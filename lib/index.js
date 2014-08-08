"use strict";

module.exports = filter;

var fs = require("fs");
var join = require("path").join;
var dirname = require("path").dirname;

var _ = require("underscore");
var history = require("fs-history");
var walk_sync = require("walk-sync");
var quick_temp = require("quick-temp");
var map_series = require("promise-map-series");
var mkdirp = require("mkdirp");
var Q = require("q");

function filter (config) {
  config = config || {};

  var trees        = config.trees || {};
  var trees_kvs    = _.pairs(trees);
  var trees_keys   = _.pluck(trees_kvs, 0);
  var trees_values = _.pluck(trees_kvs, 1);

  var iterated = config.iterated || Object.keys(trees);
  var out_ext = config.target || "";
  var dest_dir = config.dest_dir || "";
  var preread = "read" in config ? config.read : true;
  var sieve = (config.filter instanceof RegExp
               ? config.filter.test.bind(config.filter)
               : config.filter || function () { return true; });

  var tree_name = config.name || "dep-filter";

  var fs_options = config.binary ? {} : { encoding: "utf8" };

  var match_ext = (config.extensions
                   && build_ext_regexp(config.extensions));

  var init = config.init || function () {
    return config.process || function () {
      return "";
    };
  }

  var drain = history();

  var tmp = {};
  quick_temp.makeOrReuse(tmp, "path");

  var db = {};

  return {
    description: tree_name,
    read: read,
    cleanup: cleanup
  }

  function read (read_tree) {
    return map_series(trees_values, read_tree).then(run);
  }

  function run (roots) {
    var named_roots = roots.reduce(function (agg, root, index) {
      agg[trees_keys[index]] = root;
      return agg;
    }, new trees.constructor);

    var iterated_trees =
      iterated
      .map(function (name) { return named_roots[name]; })
      .map(function (root) {
        var files = walk_sync(root).filter(function (path) {
          return sieve(path) && (match_ext ? match_ext.test(path) : true);
        });
        return {
          root: root,
          files: files
        }
      });

    // TODO: detect duplicate files to warn of overwriting files

    var process = init(named_roots);

    // TODO: delete before compilation

    return map_series(iterated_trees, function (tree) {
      return map_series(tree.files, process_file.bind(null, process, tree.root));
    }).then(function (output_paths) {
      remove_deleted_files(output_paths);

      return tmp.path;
    });
  }

  function remove_deleted_files (processed_paths) {
    _.difference(Object.keys(db), _.flatten(processed_paths)).forEach(function (path) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      delete db[path];
    });
  }

  function process_file (process, root, path) {
    var input_path = join(root, path);
    var output_path = join(tmp.path,
                           dest_dir,
                           (match_ext && out_ext
                            ? path.replace(match_ext, "$1." + out_ext)
                            : path));

    // Empty the file history
    drain();

    if (!needs_rebuild(output_path)) {
      return output_path;
    }

    var param = preread ? fs.readFileSync(input_path, fs_options) : input_path;

    return Q(process(param)).then(function (content) {
      var deps = _.uniq(drain())

      db[output_path] = {
        time: new Date(),
        deps: deps
      }

      mkdirp.sync(dirname(output_path));
      fs.writeFileSync(output_path, content, fs_options);

      return output_path;
    });
  }

  function needs_rebuild (output_path) {
    var info = db[output_path];

    if (!info) return true;

    return _.any(info.deps, newer_than(info.time));
  }

  function cleanup () {
    quick_temp.remove(tmp, "path");
  }
}

function build_ext_regexp (exts) {
  return new RegExp("^(.*)\\.(" + exts.join("|") + ")$");
}

function newer_than (time) {
  return function (path) {
    return !fs.existsSync(path) || fs.statSync(path).mtime > time
  }
}
