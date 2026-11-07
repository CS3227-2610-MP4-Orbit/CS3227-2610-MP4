export type FeedbackEntry = {
  id: string;
  author_role: "developer" | "qa";
  body: string;
  created_at: string;
};

type Props = {
  entries: FeedbackEntry[];
  loadError?: boolean;
};

export function FeedbackSection({ entries, loadError = false }: Props) {
  return (
    <section aria-labelledby="feedback-heading" className="mt-10 border-t pt-6">
      <h2 id="feedback-heading" className="text-xl font-semibold">Developer and QA feedback</h2>
      {loadError ? (
        <p role="alert" className="mt-3 text-red-700">Could not load feedback. Please try again later.</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-gray-600">No feedback yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded border p-4">
              <p className="text-sm font-medium">
                {entry.author_role === "qa" ? "QA Tester" : "Developer"}
                {" · "}
                <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words">{entry.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
