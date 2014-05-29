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

function filter (input_tree, config) {
  config = config || {};
  var out_ext = config.target || "";

  var match_ext = build_ext_regexp(config.extensions || []);
  var process = config.process || function () {
    return null;
  };

  var drain = history();

  var tmp = {};
  quick_temp.makeOrReuse(tmp, "path");

  var db = {};

  return {
    read: read,
    cleanup: cleanup
  }

  function read (read_tree) {
    return read_tree(input_tree).then(run);
  }

  function run (root) {
    var paths = walk_sync(root).filter(function (path) {
      return match_ext.test(path);
    });

    return map_series(paths, process_file.bind(null, root)).then(function () {
      return tmp.path;
    });
  }

  function process_file (root, path) {
    var input_path = join(root, path);
    var output_path = join(tmp.path, path.replace(match_ext, "$1." + out_ext));

    // Empty the file history
    drain();

    if (needs_rebuild(output_path)) {
      console.log(output_path + " needs rebuild");
    }

    return Q(process(fs.readFileSync(input_path, "utf8"))).then(function (content) {
      var deps = drain();

      db[output_path] = {
        time: new Date(),
        deps: deps
      }

      mkdirp.sync(dirname(output_path));
      fs.writeFileSync(output_path, content, "utf8");
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
  return new RegExp("^(.*)\.(" + exts.join("|") + ")$");
}

function newer_than (time) {
  return function (path) {
    return fs.statSync(path).mtime > time
  }
}
