import { notFound } from "next/navigation";

import { getAssignedDeveloperReportDetail } from "@/lib/developer/detail";

import { AddNoteForm, EditNoteForm, StartWorkForm } from "./note-form";

export default async function DeveloperReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const detail = await getAssignedDeveloperReportDetail(reportId);
  if (!detail) notFound();
  const { report, notes } = detail;
  const canEditNotes = report.status === "open" || report.status === "in_progress";

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header>
        <p className="text-sm text-gray-600">Developer workspace / report</p>
        <h1 className="mt-1 text-3xl font-semibold">{report.title}</h1>
        <p className="mt-2 capitalize text-gray-600">Status: {report.status.replaceAll("_", " ")}</p>
      </header>

      {report.status === "open" && (
        <StartWorkForm reportId={report.id} />
      )}

      <section className="grid gap-4 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Bug report</h2>
        <div><h3 className="font-medium">Original Python code</h3><pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-3 text-sm">{report.code}</pre></div>
        <div><h3 className="font-medium">Error message</h3><p className="mt-1 whitespace-pre-wrap text-sm">{report.error_message || "Not provided"}</p></div>
        <div><h3 className="font-medium">Expected behaviour</h3><p className="mt-1 whitespace-pre-wrap text-sm">{report.expected_behavior}</p></div>
        <div><h3 className="font-medium">Actual behaviour</h3><p className="mt-1 whitespace-pre-wrap text-sm">{report.actual_behavior || "Not provided"}</p></div>
        <div><h3 className="font-medium">Reproduction steps</h3><p className="mt-1 whitespace-pre-wrap text-sm">{report.reproduction_steps}</p></div>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Investigation notes</h2>
        {notes.length === 0 ? <p className="mt-2 text-sm text-gray-600">No investigation notes yet.</p> : (
          <ul className="mt-4 grid gap-4">
            {notes.map((note) => (
              <li key={note.id} className="rounded border p-4">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <p className="mt-2 text-xs text-gray-500">Created {new Date(note.created_at).toLocaleString()} · Updated {new Date(note.updated_at).toLocaleString()}</p>
                {canEditNotes && <EditNoteForm reportId={report.id} noteId={note.id} body={note.body} />}
              </li>
            ))}
          </ul>
        )}
        {canEditNotes && <AddNoteForm reportId={report.id} />}
      </section>
    </main>
  );
}
