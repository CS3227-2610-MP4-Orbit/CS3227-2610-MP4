import { spawnSync } from "node:child_process";

/** Parse submitted Python without executing the submitted source. */
export function isValidPythonSyntax(source: string): boolean {
  const result = spawnSync( // turbopackIgnore: true
    process.env.PYTHON_BIN ?? "python",
    ["-c", "import ast, sys; ast.parse(sys.stdin.read())"],
    { input: source, encoding: "utf8", timeout: 1000, windowsHide: true },
  );
  return !result.error && result.status === 0;
}
