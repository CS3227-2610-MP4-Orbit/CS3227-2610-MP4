// Where each role works: the single source for the home page, navigation and sign-in redirect.

export type AppRole = "reporter" | "developer" | "qa";

export type NavLink = { href: string; label: string };

export type Workspace = {
  label: string;
  /** Where the role lands after signing in. */
  home: string;
  headline: string;
  summary: string;
  links: readonly NavLink[];
  actions: readonly NavLink[];
};

export const WORKSPACES: Record<AppRole, Workspace> = {
  reporter: {
    label: "Reporter workspace",
    home: "/reports",
    headline: "Track a Python bug from report to feedback.",
    summary: "Share a reproducible snippet, follow its status, and read Developer or QA feedback in one place.",
    links: [{ href: "/", label: "Home" }, { href: "/reports", label: "My reports" }, { href: "/reports/new", label: "New report" }],
    actions: [{ href: "/reports/new", label: "Submit a bug report" }, { href: "/reports", label: "View my reports" }],
  },
  developer: {
    label: "Developer workspace",
    home: "/developer",
    headline: "Fix the bugs assigned to you.",
    summary: "Investigate each report, record notes, and submit a fix for QA. Rejected fixes come back with QA feedback.",
    links: [{ href: "/", label: "Home" }, { href: "/developer", label: "Assigned bugs" }],
    actions: [{ href: "/developer", label: "Open assigned bugs" }],
  },
  qa: {
    label: "QA workspace",
    home: "/qa",
    headline: "Verify fixes before they close.",
    summary: "Compare each fix with the original code, record your tests, and approve it or send it back with feedback.",
    links: [{ href: "/", label: "Home" }, { href: "/qa", label: "QA queue" }],
    actions: [{ href: "/qa", label: "Open the QA queue" }],
  },
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "reporter" || value === "developer" || value === "qa";
}

/**
 * The link to highlight for a path: an exact match, otherwise the longest link that is a parent
 * of the path. Home ("/") only matches itself. Null on sign-in and on unrelated paths.
 */
export function activeRoute(pathname: string, links: readonly NavLink[]): string | null {
  if (pathname === "/login") return null;
  let best: string | null = null;
  for (const { href } of links) {
    const matches = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
