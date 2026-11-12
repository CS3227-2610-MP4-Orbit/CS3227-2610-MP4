import { describe, expect, it } from "vitest";

import { activeRoute, isAppRole, WORKSPACES } from "./roles";

describe("WORKSPACES", () => {
  it("sends each role to its own workspace", () => {
    expect(WORKSPACES.reporter.home).toBe("/reports");
    expect(WORKSPACES.developer.home).toBe("/developer");
    expect(WORKSPACES.qa.home).toBe("/qa");
  });

  it("links every role to its own workspace only", () => {
    for (const [role, workspace] of Object.entries(WORKSPACES)) {
      const hrefs = workspace.links.map((link) => link.href);
      expect(hrefs).not.toContain("/");
      expect(hrefs).toContain(workspace.home);
      const others = Object.entries(WORKSPACES).filter(([other]) => other !== role).map(([, w]) => w.home);
      for (const href of hrefs) expect(others.some((home) => href === home || href.startsWith(`${home}/`))).toBe(false);
    }
  });
});

describe("activeRoute", () => {
  const qa = WORKSPACES.qa.links;

  it("matches exactly, then by the longest parent", () => {
    expect(activeRoute("/qa", qa)).toBe("/qa");
    expect(activeRoute("/qa/abc", qa)).toBe("/qa");
    expect(activeRoute("/reports/new", WORKSPACES.reporter.links)).toBe("/reports/new");
    expect(activeRoute("/reports/abc", WORKSPACES.reporter.links)).toBe("/reports");
  });

  it("does not match sign-in or unrelated paths", () => {
    expect(activeRoute("/", qa)).toBeNull();
    expect(activeRoute("/qanything", qa)).toBeNull();
    expect(activeRoute("/reports", qa)).toBeNull();
    expect(activeRoute("/login", qa)).toBeNull();
  });
});

describe("isAppRole", () => {
  it("accepts only the three roles", () => {
    expect(["reporter", "developer", "qa"].every(isAppRole)).toBe(true);
    expect([null, undefined, "admin", "QA", 1].some(isAppRole)).toBe(false);
  });
});
