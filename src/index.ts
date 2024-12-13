import { simple } from "acorn-walk";
import type { Plugin } from "rollup";
import type { Identifier, ImportDeclaration, MemberExpression } from "acorn";
import MagicString from "magic-string";

const PLUGIN_NAME = "rollup-plugin-filemeta";
const PLUGIN_VERSION = "0.1.0";

const virtualModule = "rollup-filemeta";

type Key = "filename" | "dirname";

type Resolver = (id: string) => string;

const quote = (s: string, style: "single" | "double" = "single"): string => {
	const q = style === "single" ? `'` : `"`;
	return q + s + q;
};

// TODO: add support for custom or truncated bases.
// We can use Vite's/Rollup's interpolated __dirname in this file to help set the base,
// which will be set based on the location of the consuming project's config.
const resolveFilename: Resolver = (id) => quote(id);
const resolveDirname: Resolver = (id) =>
	quote(id.slice(0, id.lastIndexOf("/") + 1));

const resolverWithBase: (base: string, res: Resolver) => Resolver =
	(base, res) => (id) => {
		id = id.replace(base, "");
		if (id.charAt(0) === "/") {
			id = id.slice(1);
		}
		return res(id);
	};

const resolvers: Record<Key, Resolver> = {
	["filename"]: resolveFilename,
	["dirname"]: resolveDirname,
};

interface PluginOptions {
	base?: string;
}

const plugin = (opts?: PluginOptions): Plugin => ({
	name: PLUGIN_NAME,
	version: PLUGIN_VERSION,

	resolveId(source) {
		if (source === virtualModule) {
			return { id: `\0${source}`, external: true };
		}

		return null;
	},

	transform(code, id) {
		if (!code.includes(virtualModule)) {
			return null;
		}

		const { error } = this;
		const program = this.parse(code);

		interface Usage {
			node: MemberExpression;
			key: Key;
		}

		const state: {
			declaration: ImportDeclaration | null;
			localName: string;
			usages: Usage[];
		} = { declaration: null, localName: "", usages: [] };

		simple(
			program,
			{
				// eslint-disable-next-line @typescript-eslint/naming-convention
				ImportDeclaration(node, state) {
					if (
						!(
							typeof node.source.value === "string" &&
							virtualModule === node.source.value
						)
					) {
						return null;
					}

					if (node.specifiers.length !== 1) {
						error(
							"rollup-filemeta: macro was not imported as a default specifier",
						);
					}

					const localName = node.specifiers[0].local.name;

					state.localName = localName;
					state.declaration = node;
				},
				// eslint-disable-next-line @typescript-eslint/naming-convention
				MemberExpression(node, state) {
					const identifier: Identifier = node.object as Identifier;
					if (
						!(identifier.name &&
							identifier.name === state.localName)
					) {
						return null;
					}

					const property: Identifier = node.property as Identifier;
					if (
						!(property.name &&
							["filename", "dirname"].includes(property.name))
					) {
						error(
							`rollup-plugin-filemeta: unexpected access on virtual module export.` +
								`Please ensure you only access the default export object with one of the expected identifiers ("filename", "dirname").`,
						);
					}

					state.usages.push({ node, key: property.name as Key });
				},
			},
			undefined,
			state,
		);

		if (!state.declaration || !state.usages.length) {
			return null;
		}

		const newCode = new MagicString(code);
		newCode.remove(state.declaration.start, state.declaration.end);
		for (const usage of state.usages) {
			const { key, node } = usage;
			let resolver = resolvers[key];
			if (opts?.base) {
				resolver = resolverWithBase(opts.base, resolver);
			}
			newCode.update(node.start, node.end, resolver(id));
		}

		return { code: newCode.toString(), map: newCode.generateMap() };
	},
});

export default plugin;
