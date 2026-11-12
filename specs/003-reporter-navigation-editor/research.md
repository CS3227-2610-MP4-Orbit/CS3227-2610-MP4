# Research

- Existing Reporter UI uses standalone links and a plain textarea. The form's `python_code` field is already validated and LF-normalized server-side.
- CodeMirror 6 `basicSetup` includes line numbers, undo history, indentation, bracket matching and keyboard bindings. Python support comes from `@codemirror/lang-python` (official CodeMirror documentation: https://codemirror.net/examples/basic/ and https://github.com/codemirror/lang-python).
- Keep an actual textarea as the form value and pre-hydration fallback. On editor changes, synchronize the textarea through React state or DOM input and enforce existing 20,000-character limit. Avoid duplicate named controls.
- Route links are sufficient for global navigation; detail tabs can use anchors to avoid losing server-rendered content or adding a new client authorization boundary.
