# Dependency-tracking processing for Broccoli

Similar to [broccoli-filter] [broccoli-filter] but many-to-one instead
of one-to-one.

[broccoli-filter]: https://github.com/broccolijs/broccoli-filter

Rebuilds only if file or any of its dependencies changed. Doesn't need
to parse any files in order to find dependencies.

## Usage (function style)

    var filter = require("broccoli-dep-filter");

    var tree = filter(config);

## Configuration

Input trees options:

- `trees`: array or object, one or more indexed or named trees,
- `iterated`: iterated trees, indexes or names from the `trees` option, optional, defaults to all indexes or keys from `trees`

Filtering options:

- `extensions`: list of extensions of input files
- `target`: extension of produced output files

Processing options:

- `process(src : String) : String`
- `init(trees : Array || Object) : process`

You pass only one of `init` or `process`.

The `process` function is invoked for every input file, as argument it
gets file contents. `process` can return either a string or a promise
that resolves to a string.

The `init`

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

MIT licence.