# rollup-filemeta

A small Rollup/Vite plugin that allows bundled modules to access the filename
and dirname of the original source module.

## Overview

ECMAScript modules have access to an `import.meta` object, which allows them to
read learn where they are located relative to other resources. The
`import.meta.url` property allows a module to refer to its own location in order
to, e.g., create relative import paths to sibling modules.

If a module is fed through a bundler, however, `import.meta.url` will reflect
the _bundle's_ location at runtime. There's no dynamic mechanism for a bundled
module to refer to its original location relative to other modules in the source
project.

`rollup-filemeta` seeks to provide this mechanism to Rollup bundles by
interpolating a local module's `id` value into its source code at build time.

## Usage

### Installing the plugin

The Rollup plugin is exported as a module from`rollup-filemeta/plugin`. Add
`rollup-filemeta/plugin` to your Rollup or Vite configuration in the
[standard way](https://rollupjs.org/tutorial/#using-plugins):

Deno:

```console
$ deno add rollup-filemeta
```

npm/Yarn/pnpm/etc. should use the `jsr` compatibility layer:

```console
$ npx jsr -D rollup-filemeta
```

```ts
// rollup.config.mjs
import filemeta from "rollup-filemeta/plugin";

export default {
	// ... other bundle configuration
	plugins: [
		filemeta({
			base: __dirname, // optional: set a base path for briefer interpolated module paths
		}),
	],
};
```

The plugin accepts these configuration options:

- `base`: Optionally set a base path which will be trimmed from interpolated
  paths to local modules. This could be helpful to avoid embedding
  machine-specific path information into a bundle.

### Invoking the macro in a local module

The plugin provides a _virtual_ module called `rollup-filemeta`, to be imported
into your project's local module(s):

```ts
// <path-to-project>/src/my-module.mjs
import meta from "rollup-filemeta";

console.log(meta.filename); // logs the whole filepath to the module: <path-to-project>/src/my-module.js
console.log(meta.dirname); // logs the directory path to the module: <path-to-project>/src
```

This virtual module acts as a **build-time macro**: during the `transform` step
of a Rollup build, the import declaration is erased, and usages of
`meta.filename` or `meta.dirname` are rewritten to contain metadata about the
original, pre-bundled module.

The `filename` and `dirname` seek to resemble Node's `import.meta.filename` and
`import.meta.dirname` properties, but with Rollup module IDs. **This means that
`filename` is the full path to the module file**, not just the base name of the
file. `dirname` is the full path without the base name of the file. (I didn't
pick this convention!)

**Constraints on usage**: It's currently expected and enforced that the import
declaration for `rollup-filemeta` will strictly be a **default import** with a
single specifier only (though this specifier can be anything). Importing any of
the virtual module's exports directly will cause a Rollup build error. The
intention behind this constraint is code clarity: there's not yet any
first-class macro syntax for ECMAScript, and I think it's less confusing for a
member access from an imported identifier to transform/disappear than a bare
identifier expression. There's no _technical_ constraint here, though, and it
could be relaxed in the future.

### Why not use Rollup's `resolveImportMeta` hook?

`resolveImportMeta` would also work to interpolate metadata about the original
module's file, _except_ it's an output generation hook, not a build hook. This
means that modules served from a Vite dev server would not have any custom
`import.meta` properties resolved by `resolveImportMeta`, since it's never
called. Using a `transform` hook means both Vite dev servers and standard Rollup
builds use the same mechanism for interpolating file metadata.

## Prior art

Thank you to @Comandeer for their
[rollup-plugin-macros](https://github.com/Comandeer/rollup-plugin-macros/tree/main)
package and corresponding [blog post](https://blog.comandeer.pl/makrony.html),
which aided the design of this plugin.
