import meta from "rollup-filemeta";

function consume(s) {
	console.log(s);
}

consume(meta.dirname);

consume(meta.dirname);

consume(meta.filename);

consume(meta.filename);

consume(meta.dirname);

consume(meta.filename);
