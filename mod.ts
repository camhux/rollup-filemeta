/**
 * Virtual module providing typed exports that `rollup-filemeta/plugin` will
 * transform at build time to contain metadata about the module's source file.
 *
 * You should not import "rollup-filemeta" without also configuring your
 * Rollup/Vite build to consume "rollup-filemeta/plugin"!
 * @module
 */

// TODO: Should we throw an error if this module is evaluated (indicating
// that it weren't properly transformed and erased by Rollup?)

interface Filemeta {
	readonly filename: string;
	readonly dirname: string;
}

declare const meta: Filemeta;

export default meta;
