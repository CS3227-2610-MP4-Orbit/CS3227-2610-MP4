import { StatusBadge as Badge } from "@/components/app/status";

// QA phrases each stage from its own point of view; the colours are the shared status colours.
const labels: Record<string, string> = {
  awaiting_qa: "Awaiting QA",
  in_progress: "With Developer",
  open: "Not started",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge status={status} label={labels[status] ?? status} />;
}
