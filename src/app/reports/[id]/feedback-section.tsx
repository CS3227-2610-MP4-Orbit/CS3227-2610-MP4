import { MessageSquareText } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    <section id="report-feedback" aria-labelledby="feedback-heading" className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="feedback-heading" className="text-sm font-semibold">Developer and QA feedback</h2>
      </div>
      {loadError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">Could not load feedback. Please try again later.</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No feedback yet.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l pl-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span aria-hidden="true" className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-card", entry.author_role === "qa" ? "bg-amber-500" : "bg-sky-500")} />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{entry.author_role === "qa" ? "QA Tester" : "Developer"}</span>
                {" · "}
                <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
              </p>
              <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">{entry.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
