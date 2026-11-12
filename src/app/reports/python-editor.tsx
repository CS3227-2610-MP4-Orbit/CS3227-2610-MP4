"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorView } from "codemirror";

type Props = {
  id: string;
  value: string;
  maxLength: number;
  invalid: boolean;
  onValueChange?: (value: string) => void;
};

export function syncSubmissionValue(textarea: Pick<HTMLTextAreaElement, "value"> | null, next: string) {
  if (textarea) textarea.value = next;
}

export function PythonEditor({ id, value, maxLength, invalid, onValueChange }: Props) {
  const [current, setCurrent] = useState(value);
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastPropRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => { onValueChangeRef.current = onValueChange; }, [onValueChange]);

  useEffect(() => {
    viewRef.current?.contentDOM.setAttribute("aria-invalid", String(invalid));
  }, [invalid, ready]);

  // Server actions return the submitted values when validation fails.
  useEffect(() => {
    if (value === lastPropRef.current) return;
    lastPropRef.current = value;
    syncSubmissionValue(textareaRef.current, value);
    setCurrent(value);
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    let disposed = false;
    let mountedView: EditorView | null = null;
    Promise.all([import("codemirror"), import("@codemirror/lang-python"), import("@codemirror/state")]).then(([
      { EditorView, basicSetup }, { python }, { EditorState },
    ]) => {
      if (disposed || !hostRef.current) return;
      const initial = textareaRef.current?.value ?? value;
      if (initial !== value) setCurrent(initial);
      mountedView = new EditorView({
        parent: hostRef.current,
        doc: initial,
        extensions: [
          basicSetup,
          python(),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-labelledby": `${id}-label`, "aria-invalid": String(invalid) }),
          EditorState.transactionFilter.of((transaction) => transaction.newDoc.length > maxLength ? [] : transaction),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const next = update.state.doc.toString();
              syncSubmissionValue(textareaRef.current, next);
              setCurrent(next);
              onValueChangeRef.current?.(next);
            }
          }),
          EditorView.theme({
            "&": { borderRadius: "0.5rem", border: "1px solid var(--input)", backgroundColor: "var(--card)", fontSize: "0.8125rem" },
            ".cm-content": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", minHeight: "18rem", padding: "0.75rem 0", caretColor: "var(--foreground)" },
            ".cm-scroller": { maxHeight: "34rem", overflow: "auto", borderRadius: "0.5rem" },
            ".cm-gutters": { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderRight: "1px solid var(--border)", borderTopLeftRadius: "0.5rem", borderBottomLeftRadius: "0.5rem" },
            ".cm-activeLine": { backgroundColor: "oklch(0.585 0.2 268 / 0.05)" },
            ".cm-activeLineGutter": { backgroundColor: "oklch(0.585 0.2 268 / 0.08)", color: "var(--foreground)" },
            "&.cm-focused": { outline: "none", borderColor: "var(--ring)", boxShadow: "0 0 0 3px oklch(0.585 0.2 268 / 0.2)" },
          }),
        ],
      });
      viewRef.current = mountedView;
      setReady(true);
    }).catch(() => {
      // The form remains usable through the native textarea if enhancement fails.
    });
    return () => {
      disposed = true;
      mountedView?.destroy();
      viewRef.current = null;
    };
    // The editor mounts once; new action values are synchronized by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div ref={hostRef} aria-hidden={!ready} className={ready ? "" : "hidden"} />
      <textarea
        ref={textareaRef}
        id={id}
        name="python_code"
        value={current}
        onChange={(event) => { setCurrent(event.target.value); onValueChangeRef.current?.(event.target.value); }}
        maxLength={maxLength}
        rows={12}
        required={!ready}
        aria-invalid={invalid}
        aria-hidden={ready}
        tabIndex={ready ? -1 : undefined}
        className={ready ? "hidden" : "w-full rounded-lg border border-input bg-card px-4 py-3 font-mono text-sm"}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <p className="text-xs font-normal text-muted-foreground tabular-nums">Python · {ready ? "Tab to indent · syntax highlighting · " : "Plain text editor · "}{current.length.toLocaleString()} / {maxLength.toLocaleString()} characters</p>
    </div>
  );
}
