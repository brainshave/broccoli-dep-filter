# Dependency-tracking processing for Broccoli

Similar to [broccoli-filter] [broccoli-filter] but many-to-one instead
of one-to-one.

[broccoli-filter]: https://github.com/broccolijs/broccoli-filter

Rebuilds only if file or any of its dependencies changed. Doesn't need
to parse any files in order to find dependencies.

## Usage (function style)

    var filter = require("broccoli-dep-filter");

    return filter(input_tree, {
      extensions: ["less"],
      target: "css",
      process: compile
    });

    function compile_less (str) {
      // …
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