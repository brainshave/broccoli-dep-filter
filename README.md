# Dependency-tracking multiple-tree processing for Broccoli

- Tracks dependencies of each file automatically, even files included during compilation (using [fs-history])
- Takes in multiple trees, allows to name them (you can pass an object instead of an array), only chosen ones are iterated over
- Bit like [broccoli-filter] but more

[fs-history]: https://www.npmjs.org/package/fs-history
[broccoli-filter]: https://github.com/broccolijs/broccoli-filter

## Usage (function style)

    var filter = require("broccoli-dep-filter");

    var tree = filter(config);

## Configuration

Input trees options:

- `trees`: array or object, one or more indexed or named trees,
- `iterated`: iterated trees, indexes or names from the `trees` option (optional, defaults to all indexes or keys from `trees`)

Filtering options:

- `extensions`: list of extensions of input files (optional)
- `target`: extension of produced output files (optional, only applies to `extensions`)
- `filter`: extra filtering, either a function or a regular expression (optional)

Various options:

- `dest_dir`: move output files to a subdirectory of the output tree
- `read`: by default `process` receives file contents, set `read` to false if you want just the file path
- `binary`: read and save file as binary buffer instead of a UTF-8 string
- `name`: label the tree (used for reporting performance metrics by broccoli)

Processing options:

- `process(src : String) : String`
- `init(trees : Array || Object) : process`

You pass only one of `init` or `process`.

The `process` function is invoked for every input file, as argument it
gets file contents (if `read: false`) as a string or a buffer (when
`binary: true`). `process` can return file's content either directly
or as a promise (it has to be the same type as input: buffer or
string).

The `init` function is invoked once all input trees are resolved. As
an argument it gets an array or object (depending on the type of the
`trees` option) mapping the tree names or indexes to trees' root
directories. `init` has to return a `process` function.

Example:

    var filter = require("broccoli-dep-filter");

    function setup (input_tree, less_config) {
      return filter({
        trees: [input_tree],
        extensions: ["less"],
        target: "css",
        process: compile_less
      });

      function compile_less (src) {
        //…
      }
    }

## Usage (prototype style)

Planned to work as a drop-in replacement for broccoli-filter.

## How does the dependency-tracking work?

Files that are read during a build of a target (an output file) are
observed (with the [fs-history] [fs-history] module) and
remembered. Before the rebuild all dependencies are checked if they
have changed.

[fs-history]: https://github.com/szywon/node-fs-history

## Copying

MIT licence, see [COPYING](COPYING).