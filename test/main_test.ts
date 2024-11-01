import * as path from "node:path";
import { rollup } from "rollup";
import plugin from "../src/index.ts";
import { assertEquals } from "@std/assert";

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
