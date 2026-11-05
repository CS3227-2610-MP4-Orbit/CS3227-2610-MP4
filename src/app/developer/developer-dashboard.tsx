import Link from "next/link";

import type { DeveloperReport } from "@/lib/developer/queries";

export function getDashboardState(reports: DeveloperReport[]) {
  return reports.length === 0 ? "empty" : "populated";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function DeveloperDashboard({ reports }: { reports: DeveloperReport[] }) {
  if (reports.length === 0) {
    return (
      <section aria-labelledby="empty-heading" className="rounded-xl border border-dashed p-8">
        <h2 id="empty-heading" className="text-lg font-semibold">No assigned bug reports</h2>
        <p className="mt-2 text-sm text-gray-600">Reports assigned to you will appear here.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="assigned-heading">
      <h2 id="assigned-heading" className="text-lg font-semibold">Assigned reports</h2>
      <ul className="mt-4 grid gap-4">
        {reports.map((report) => (
          <li key={report.id} className="rounded-xl border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{report.title}</h3>
                <p className="mt-1 text-sm text-gray-600">Status: {statusLabel(report.status)}</p>
              </div>
              <Link className="rounded border px-3 py-2 text-sm" href={`/developer/${report.id}`}>
                Open report
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
