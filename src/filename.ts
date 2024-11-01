// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FILENAME(): string {
  throw new Error(
    "UNREACHABLE: encountered an untransformed `rollup-plugin-filemeta/filename.FILENAME()` call. Ensure that you've configured `rollup-plugin-filemeta` in your Rollup config correctly.",
  );
}
