import {simple} from 'acorn-walk';
import type {Plugin} from 'rollup';
import type {ImportDeclaration, Identifier} from 'acorn';

const name = 'rollup-plugin-filemeta';

const macros = ['filename', 'dirname'];
const macroImports = new Set(macros.map((m) => `${name}/${m}`));

// TODO: options for root/full path stuff, include/exclude
const plugin = (): Plugin => ({
	name,

	resolveId(source) {
		if (macroImports.has(source)) {
			return {id: source, external: true};
		}

		return null;
	},

	transform(code, id) {
		// TODO: blunt check; would a regex for a macro import path be worth it?
		if (!code.includes(name)) {
			return null;
		}

		const program = this.parse(code);

		const state: {
			importNode: ImportDeclaration | undefined;
			usages: Identifier[];
		} = {importNode: undefined, usages: []};

		simple(program, {
			ImportDeclaration(node) {},

			Identifier(node) {},
		});
	},
});

export default plugin;
