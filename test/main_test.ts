import * as path from "node:path";
import { rollup } from "rollup";
import plugin from "rollup-plugin-filemeta/index.ts";
import { assertEquals, assertIsError, assertRejects } from "@std/assert";
import exp from "node:constants";

Deno.test("simple filename transform", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/simple-filename.js",
	);

	const bundle = await rollup({
		input: source,
		plugins: [plugin()],
	});

	const code = await bundle.generate({
		compact: true,
	});

	assertEquals(code.output[0].code, `console.log('${source}');`);
});

Deno.test("simple dirname transform", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/simple-dirname.js",
	);

	const bundle = await rollup({
		input: source,
		plugins: [plugin()],
	});

	const code = await bundle.generate({
		compact: true,
	});

	assertEquals(
		code.output[0].code,
		`console.log('${source.slice(0, source.lastIndexOf("/") + 1)}');`,
	);
});

Deno.test("mixed and multiple usages", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/multiple-both.js",
	);

	const bundle = await rollup({
		input: source,
		plugins: [plugin()],
	});

	const code = await bundle.generate({
		compact: true,
	});

	const splitIx = source.lastIndexOf("/") + 1;
	const expectedDirname = source.slice(0, splitIx);
	const expectedFilename = source;

	const expectedCode = `function consume(s) {
	console.log(s);
}

consume('${expectedDirname}');

consume('${expectedDirname}');

consume('${expectedFilename}');

consume('${expectedFilename}');

consume('${expectedDirname}');

consume('${expectedFilename}');`;

	assertEquals(code.output[0].code, expectedCode);
});

Deno.test("two usages with custom base", async () => {
	const base = path.resolve(import.meta.dirname ?? "./test");
	console.debug(base);
	const source = path.resolve(
		base,
		"fixtures/simple-both.js",
	);

	const bundle = await rollup({
		input: source,
		plugins: [plugin({ base })],
	});

	const code = await bundle.generate({
		compact: true,
	});

	const expectedCode = `console.log('fixtures/');

console.log('fixtures/simple-both.js');`;

	assertEquals(code.output[0].code, expectedCode);
});

// TODO: anything worth doing here?
Deno.test.ignore("forgotten plugin", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/simple-filename.js",
	);

	const rejected = assertRejects(() => import(source));

	assertIsError(await rejected, Error, /UNREACHABLE/);
});

// TODO: test for improper member expression on imported object
