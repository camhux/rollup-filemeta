import {simple} from 'acorn-walk';
import type {Plugin} from 'rollup';
import type {ImportDeclaration, CallExpression} from 'acorn';
import MagicString from 'magic-string';

const name = 'rollup-filemeta';

const macros = ['filename', 'dirname'] as const;
const macroImports = new Set(macros.map((m) => `${name}/${m}`));

type Macro = `${typeof name}/${'filename' | 'dirname'}`;

type Resolver = (id: string) => string;

const resolveFilename: Resolver = (id) => id.slice(id.lastIndexOf('/'));
const resolveDirname: Resolver = (id) => id.slice(0, id.lastIndexOf('/'));

const resolvers: Record<Macro, Resolver> = {
	[`${name}/filename`]: resolveFilename,
	[`${name}/dirname`]: resolveDirname,
};

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

		type LocalName = string;
		const state: {
			usages: Map<
				LocalName,
				{macro: Macro; declaration: ImportDeclaration; calls: CallExpression[]}
			>;
		} = {usages: new Map()};

		simple(
			program,
			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				ImportDeclaration(node, state) {
					if (
						!(
							typeof node.source.value === 'string' &&
							macroImports.has(node.source.value)
						)
					) {
						return null;
					}

					// Each macro file should be imported as a default specifier
					if (node.specifiers.length !== 1) {
						throw new Error(
							'rollup-filemeta: macro was not imported as a default specifier',
						);
					}

					const localName = node.specifiers[0].local.name;

					state.usages.set(localName, {
						// TODO: just calculate and provide the replacement avlue right here? we should know it
						macro: node.source.value as Macro,
						declaration: node,
						calls: [],
					});
				},
				// eslint-disable-next-line @typescript-eslint/naming-convention
				CallExpression(node, state) {
					if (
						node.callee.type !== 'Identifier' ||
						!state.usages.has(node.callee.name)
					) {
						return null;
					}

					const entry = state.usages.get(node.callee.name);

					if (!entry) {
						throw new Error(
							`rollup-filemeta: found call for macro-sourced identifier ${node.callee.name}, but found no entry in state.usages. This indicates a bug in rollup-filemeta.`,
						);
					}

					entry.calls.push(node);
				},
			},
			undefined,
			state,
		);

		let hasAnyUsageCalls = false;
		for (const {calls} of state.usages.values()) {
			hasAnyUsageCalls ||= calls.length > 0;
		}

		if (state.usages.size === 0 || !hasAnyUsageCalls) {
			return null;
		}

		const newCode = new MagicString(code);
		for (const usage of state.usages.values()) {
			const {macro, declaration} = usage;
			newCode.remove(declaration.start, declaration.end);
			for (const call of usage.calls) {
				newCode.update(call.start, call.end, resolvers[macro](id));
			}
		}

		return {code: newCode.toString(), ast: program, map: newCode.generateMap()};
	},
});

export default plugin;
