"""Draw the token-usage charts in docs/Reflections.md from counts-only usage evidence.

Reads only ``workflow/evidence/usage/*.usage.json`` (token counts, no prompts or code), so the
charts can be regenerated and checked against the evidence. Requires matplotlib, which is not a
project dependency: ``python3 -m pip install matplotlib``.

    python3 workflow/scripts/plot_usage.py            # writes PNGs to docs/images/
    python3 workflow/scripts/plot_usage.py --out DIR
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.ticker import FuncFormatter  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
USAGE = ROOT / "workflow" / "evidence" / "usage"

# Same Codex counter and route for all three Reporter features; only F005 calls the AI gateway.
FEATURES = (
    ("F002-reporter-feedback", "F002 Feedback view\n(no AI)"),
    ("F004-reporter-code-diff", "F004 Code comparison\n(no AI)"),
    ("F005-report-quality", "F005 Check my report\n(AI feature)"),
)
ROLES = ("Orchestrator", "Explorer", "Generator", "Code reviewer", "Security reviewer", "Verifier")
COLORS = {
    "Orchestrator": "#B8BEC6", "Explorer": "#7FB7A4", "Generator": "#1F4E8C",
    "Code reviewer": "#E08A3C", "Security reviewer": "#C0392B", "Verifier": "#8E6BB8",
}
# Subagent names differ per task (e.g. feedback_research, comparison_generator), so match by suffix.
ROLE_KEYS = (
    ("research", "Explorer"), ("generator", "Generator"), ("code_review", "Code reviewer"),
    ("security_review", "Security reviewer"), ("verifier", "Verifier"),
)


def load(task_id: str) -> dict:
    return json.loads((USAGE / f"{task_id}.usage.json").read_text())


def role_of(agent_path: str) -> str | None:
    if agent_path == "root":
        return "Orchestrator"
    name = agent_path.rsplit("/", 1)[-1]
    return next((role for key, role in ROLE_KEYS if key in name), None)


def millions(x: float, _pos: int) -> str:
    return f"{x / 1e6:.0f}M"


def style(ax) -> None:
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.tick_params(axis="y", length=0)


def plot_f005_by_agent(out: Path) -> None:
    usage = load("F005-report-quality")
    labels = {"root": "Orchestrator (root)", "/root/quality_generator": "Generator",
              "/root/security_review": "Security reviewer", "/root/code_review": "Code reviewer"}
    rows = [(labels[s["agent_path"]], s["usage"]["input_tokens"], s["usage"]["cached_input_tokens"])
            for s in usage["sessions"].values()][::-1]
    names = [r[0] for r in rows]

    fig, ax = plt.subplots(figsize=(11, 5.4))
    ax.barh(names, [r[2] for r in rows], color="#9DB4D6", label="Cached input")
    ax.barh(names, [r[1] - r[2] for r in rows], left=[r[2] for r in rows], color="#1F4E8C", label="Uncached input")
    for i, (_, total, cached) in enumerate(rows):
        ax.text(total + 3e5, i, f"{total / 1e6:.1f}M  ({cached / total:.1%} cached)", va="center", fontsize=12)
    ax.set_xlim(0, 25e6)
    ax.xaxis.set_major_formatter(FuncFormatter(millions))
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.0), ncol=2, frameon=False, fontsize=12)
    style(ax)

    total = usage["total_usage"]
    fig.suptitle("Input tokens per agent for F005 (Check my report), 9 Nov 2026",
                 fontweight="bold", fontsize=16, x=0.02, ha="left", y=1.02)
    fig.text(0.02, -0.03, f"Total: {total['input_tokens'] / 1e6:.1f}M input, "
             f"{total['cached_input_tokens'] / total['input_tokens']:.1%} cached. "
             "Source: workflow/evidence/usage/F005-report-quality.usage.json", fontsize=11, color="#555")
    fig.savefig(out / "f005-input-by-agent.png", dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def plot_features_by_agent(out: Path) -> None:
    table, meta = {}, {}
    for task_id, _ in FEATURES:
        usage = load(task_id)
        by_role = dict.fromkeys(ROLES, 0)
        for session in usage["sessions"].values():
            role = role_of(session["agent_path"])
            if role:
                by_role[role] += session["usage"]["input_tokens"]
        table[task_id] = by_role
        total = usage["total_usage"]
        meta[task_id] = (total["input_tokens"], total["cached_input_tokens"] / total["input_tokens"])

    task_ids = [task_id for task_id, _ in FEATURES][::-1]
    names = [label for _, label in FEATURES][::-1]
    fig, ax = plt.subplots(figsize=(12, 5.4))
    left = [0] * len(task_ids)
    for role in ROLES:
        values = [table[t][role] for t in task_ids]
        ax.barh(names, values, left=left, color=COLORS[role], label=role, edgecolor="white", linewidth=0.6)
        left = [a + b for a, b in zip(left, values)]
    for i, task_id in enumerate(task_ids):
        total, cached = meta[task_id]
        ax.text(total + 6e5, i, f"{total / 1e6:.1f}M input\n{cached:.1%} cached", va="center", fontsize=12)
    ax.set_xlim(0, 72e6)
    ax.xaxis.set_major_formatter(FuncFormatter(millions))
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.0), ncol=6, frameon=False, fontsize=11,
              handlelength=1.2, columnspacing=1.0)
    style(ax)

    fig.suptitle("Input tokens per Reporter feature, split by agent",
                 fontweight="bold", fontsize=16, x=0.02, ha="left", y=1.03)
    fig.text(0.02, -0.03, "Same local Codex counter for all three; subagents ran gpt-6-sol. One run each, no repeats. "
             "Source: workflow/evidence/usage/F002, F004, F005 *.usage.json", fontsize=11, color="#555")
    fig.savefig(out / "reporter-features-input-by-agent.png", dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=ROOT / "docs" / "images")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"font.size": 14, "font.family": "sans-serif",
                         "font.sans-serif": ["Helvetica", "Arial", "DejaVu Sans"]})
    plot_f005_by_agent(args.out)
    plot_features_by_agent(args.out)
    print(f"Wrote charts to {args.out}")


if __name__ == "__main__":
    main()
