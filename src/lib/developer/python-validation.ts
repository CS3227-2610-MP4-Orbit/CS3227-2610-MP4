import { parser } from "@lezer/python";

/**
 * Parse submitted Python without executing it, in JavaScript.
 *
 * This used to run `python -c "ast.parse(...)"`, but Vercel's Node runtime has no Python binary, so
 * every fix was rejected in deployed environments. The Lezer grammar (the one behind the editor's
 * highlighting) runs anywhere Node does. It is error-tolerant, so a syntax error appears as an
 * error node in the tree rather than an exception.
 *
 * It is slightly more lenient than CPython: it accepts a few semantic errors such as `1 = x`,
 * inconsistent dedents and Python 2 `print 'x'`. It does not reject valid Python. The code is
 * never run, and QA tests every revision, so leniency is the safe direction.
 */
export function isValidPythonSyntax(source: string): boolean {
  let valid = true;
  parser.parse(source).iterate({
    enter: (node) => {
      if (node.type.isError) valid = false;
      return valid;
    },
  });
  return valid;
}
