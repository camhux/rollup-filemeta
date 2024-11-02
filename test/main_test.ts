import * as path from "node:path";
import { rollup } from "rollup";
import plugin from "rollup-plugin-filemeta/index.ts";
import { assert, assertEquals, assertIsError, assertRejects } from "@std/assert";

Deno.test("simple filename transform", async () => {
  const source = path.resolve(
    import.meta.dirname ?? "./test",
    "fixtures/simple.js",
  );

  const bundle = await rollup({
    input: source,
    plugins: [plugin()],
  });

  const code = await bundle.generate({
    compact: true,
  });

  assertEquals(code.output[0].code, `console.log('simple.js');`);
});

Deno.test("forgotten plugin", async () => {
	const source = path.resolve(
		import.meta.dirname ?? "./test",
		"fixtures/simple.js",
	  );

	  const rejected = assertRejects(() => import(source));

	  assertIsError(await rejected, Error, /UNREACHABLE/);
});
