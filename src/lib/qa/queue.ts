export type QueueStatus = "open" | "in_progress" | "awaiting_qa" | "closed";

export type QueueReport = {
  id: string;
  title: string;
  status: QueueStatus;
  created_at: string; // when the Reporter filed it
  updated_at: string; // last status change (e.g. when the latest fix was submitted)
};

/**
 * The order the QA tester's assigned reports appear in on /qa.
 *
 * Only `awaiting_qa` reports need QA action now; `in_progress` ones are back with the Developer,
 * and `closed` ones are history. Return a new array; do not sort `reports` in place.
 */
export function orderQaQueue(reports: readonly QueueReport[]): QueueReport[] {
  // Work first, then context: fixes needing QA, then reports back with the Developer, then ones
  // not started, then closed history.
  const group: Record<QueueStatus, number> = { awaiting_qa: 0, in_progress: 1, open: 2, closed: 3 };
  return [...reports].sort((a, b) => {
    if (a.status !== b.status) return group[a.status] - group[b.status];
    const age = Date.parse(a.updated_at) - Date.parse(b.updated_at);
    // Awaiting QA: oldest hand-off first, so no fix waits behind newer ones.
    // Everything else: most recent first, as a history.
    return (a.status === "awaiting_qa" ? age : -age) || a.id.localeCompare(b.id);
  });
}
