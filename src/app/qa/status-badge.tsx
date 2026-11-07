const styles: Record<string, string> = {
  awaiting_qa: "bg-amber-100 text-amber-900",
  in_progress: "bg-blue-50 text-blue-800",
  open: "bg-slate-100 text-slate-700",
  closed: "bg-emerald-50 text-emerald-800",
};

const labels: Record<string, string> = {
  awaiting_qa: "Awaiting QA",
  in_progress: "With Developer",
  open: "Not started",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status] ?? styles.open}`}>{labels[status] ?? status}</span>;
}
