declare module "rollup-filemeta" {
	interface Filemeta {
		readonly filename: string;
		readonly dirname: string;
	}
	const meta: Filemeta;
	export default meta;
}
