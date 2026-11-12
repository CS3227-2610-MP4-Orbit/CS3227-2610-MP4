import { describe, expect, it } from "vitest";

import { isValidPythonSyntax } from "./python-validation";

describe("isValidPythonSyntax", () => {
  it.each([
    ["a function", "def f(x):\n    return x\n"],
    ["a class with a method", "class A:\n    def m(self):\n        pass\n"],
    ["imports and keyword arguments", "from decimal import Decimal, ROUND_HALF_UP\n\ndef r(x):\n    return int(Decimal(str(x)).quantize(Decimal('1'), rounding=ROUND_HALF_UP))\n"],
    ["a comprehension", "x = [i for i in range(3) if i]\n"],
    ["try/except/finally", "try:\n    pass\nexcept ValueError as e:\n    raise\nfinally:\n    pass\n"],
    ["match/case", "match x:\n    case 1:\n        pass\n    case _:\n        pass\n"],
    ["an f-string", "f'{x!r:>10}'\n"],
    ["async code", "async def f():\n    await g()\n"],
    ["a decorator and annotations", "@dec\ndef f(*, a: int = 1, **k) -> None: ...\n"],
    ["a multi-line expression", "x = (1,\n     2)\n"],
  ])("accepts %s", (_, source) => {
    expect(isValidPythonSyntax(source)).toBe(true);
  });

  it.each([
    ["a missing colon", "def f(x)\n    return x\n"],
    ["a missing indent", "def f(x):\nreturn x\n"],
    ["an unclosed call", "return int(x\n"],
    ["a broken parameter list", "def broken(:"],
    ["a doubled operator", "x = = 1\n"],
    ["a dangling operator", "x = 1 +\n"],
    ["an else without if", "else:\n    pass\n"],
    ["a function without a body", "def f():\n"],
  ])("rejects %s", (_, source) => {
    expect(isValidPythonSyntax(source)).toBe(false);
  });

  it("never runs the code", () => {
    expect(isValidPythonSyntax("import os\nos.system('touch /tmp/should-not-exist')\n")).toBe(true);
  });
});
