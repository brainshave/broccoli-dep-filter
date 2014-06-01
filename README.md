# Dependency-tracking processing for Broccoli

Similar to [broccoli-filter] [broccoli-filter] but many-to-one instead
of one-to-one.

[broccoli-filter]: https://github.com/broccolijs/broccoli-filter

Rebuilds only if file or any of its dependencies changed. Doesn't need
to parse any files in order to find dependencies.

## Usage (function style)

    var filter = require("broccoli-dep-filter");

    var tree = filter(input_tree, options);

Options:

- extensions: list of extensions for input files
- target: extension of produced output files
- process: function that processes a source file
- init: (optional) invoke when all trees are ready, array of tree paths is passed in, has to return process function,  `process` field is ignored if `init` is present
- extra: (optional) list of extra trees to require before processing

The `process` function is invoked for every input file, as argument it
gets file contents. `process` can return either a string or a promise
that resolves to a string.

Example:

    var filter = require("broccoli-dep-filter");

      module.exports = function (options) {

      return filter(input_tree, {
        extensions: ["less"],
        target: "css",
        process: compile
      });

      function compile_less (str) {
        // …
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

MIT licence.