import * as path from "node:path";
import { rollup } from "rollup";
import plugin from "rollup-plugin-filemeta/index.ts";
import { assert, assertEquals, assertIsError, assertRejects } from "@std/assert";

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

  assertEquals(code.output[0].code, `console.log('simple-filename.js');`);
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

  assertEquals(code.output[0].code, `console.log('${source.slice(0, source.lastIndexOf('/')+1)}');`);
});

Deno.test("forgotten plugin", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/simple-filename.js",
	  );

	  const rejected = assertRejects(() => import(source));

	  assertIsError(await rejected, Error, /UNREACHABLE/);
});
