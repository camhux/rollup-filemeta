import DIRNAME from "rollup-plugin-filemeta/dirname.ts";
import FILENAME from "rollup-plugin-filemeta/filename.ts";

function consume(s) {
	console.log(s);
}

consume(DIRNAME());

consume(DIRNAME());

consume(FILENAME());

consume(FILENAME());

consume(DIRNAME());

consume(FILENAME());
