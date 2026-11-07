import { DeveloperDashboard } from "./developer-dashboard";
import { getAssignedDeveloperReports } from "@/lib/developer/queries";

export default async function DeveloperPage() {
  const result = await getAssignedDeveloperReports();

  if (result.kind === "denied") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-3xl font-semibold">Developer workspace</h1>
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          You do not have permission to access the Developer workspace.
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header>
        <p className="text-sm font-medium text-gray-600">Python Bug Workflow</p>
        <h1 className="mt-1 text-3xl font-semibold">Developer workspace</h1>
        <p className="mt-2 text-gray-600">Review the bugs assigned to you and continue investigation.</p>
      </header>
      <DeveloperDashboard reports={result.reports} />
    </main>
  );
}
