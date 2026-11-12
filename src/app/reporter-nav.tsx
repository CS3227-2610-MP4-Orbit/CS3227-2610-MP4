import { activeRoute, WORKSPACES } from "../lib/roles";

/** The Reporter link to highlight for a path (kept for the Reporter navigation tests). */
export function activeReporterRoute(pathname: string): string | null {
  return activeRoute(pathname, WORKSPACES.reporter.links);
}
