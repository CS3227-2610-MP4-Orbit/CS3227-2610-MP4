"""Capture counts-only Claude Code usage for a bounded development task.

The Claude Code counterpart of ``token_usage.py`` (Codex). Run ``start`` from inside the Claude
Code session before the task, then ``finish`` after the task's last agent turn.

Claude Code keeps one transcript per session at ``~/.claude/projects/<project>/<session>.jsonl``
and one per spawned subagent at ``<session>/subagents/agent-<id>.jsonl``. Unlike Codex, each API
response carries its own usage rather than a running total, and a response is written once per
content block with the same usage repeated. So the task's usage is the sum over *unique*
responses (by message id) whose timestamps fall between ``start`` and ``finish``.

Counters are normalised to the Codex names so run records from both tools compare directly:

* ``input_tokens``             = uncached + cache-read + cache-write prompt tokens (all input)
* ``cached_input_tokens``      = cache-read prompt tokens (part of input)
* ``cache_write_input_tokens`` = prompt tokens written to the cache (part of input)
* ``output_tokens``            = output tokens, including thinking
* ``reasoning_output_tokens``  = thinking tokens (part of output; null when not reported)
* ``total_tokens``             = input + output

Only session and agent IDs, model IDs, timestamps and numbers are written. Prompts, code, tool
input and tool output are never copied.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

from agent_workflow import TASK_ID
from token_usage import COUNTERS, USAGE_DIR, now_utc, parse_time, update_draft_run, write_new

SESSION_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
AGENT_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
MODEL_ID = re.compile(r"^[a-zA-Z0-9_.:\[\]-]{1,100}$")
SOURCE = "local_claude_code_transcript_window"
NOTE = ("Usage from local Claude Code transcripts: unique API responses inside the task window; "
        "see counts-only evidence file. Missing counters remain null.")


def default_projects_dir() -> Path:
    return Path(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude")).expanduser() / "projects"


def valid_session(value: str | None) -> str:
    if not isinstance(value, str) or not SESSION_ID.fullmatch(value):
        raise ValueError("A valid Claude Code session ID is required")
    return value.lower()


def find_transcript(projects_dir: Path, session_id: str) -> Path:
    matches = [p for p in projects_dir.glob(f"*/{session_id}.jsonl") if p.is_file() and not p.is_symlink()]
    if len(matches) != 1:
        raise ValueError("Expected exactly one transcript for the Claude Code session")
    return matches[0]


def agent_path(meta_file: Path) -> str:
    """Label a subagent by its type, e.g. /root/general_purpose, like Codex agent paths."""
    try:
        agent_type = json.loads(meta_file.read_text(encoding="utf-8")).get("agentType")
    except (OSError, ValueError, AttributeError):
        agent_type = None
    if not isinstance(agent_type, str) or not agent_type:
        return "/root/subagent"
    return "/root/" + (re.sub(r"[^a-z0-9]+", "_", agent_type.lower()).strip("_")[:60] or "subagent")


def transcripts(main: Path) -> dict[str, tuple[Path, str]]:
    """The session's own transcript plus every subagent transcript it spawned."""
    found = {"root": (main, "root")}
    subagents = main.with_suffix("") / "subagents"
    if subagents.is_dir():
        for path in sorted(subagents.glob("agent-*.jsonl")):
            agent_id = path.stem.removeprefix("agent-")
            if AGENT_ID.fullmatch(agent_id) and path.is_file() and not path.is_symlink():
                found[agent_id] = (path, agent_path(path.with_suffix(".meta.json")))
    return found


def response_usage(usage: object) -> dict[str, int | None] | None:
    """Normalise one API response's usage to the Codex counter names."""
    if not isinstance(usage, dict):
        return None
    parts = [usage.get(key) for key in
             ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens")]
    if not all(type(value) is int and value >= 0 for value in parts):
        return None
    uncached, cache_read, cache_write, output = parts
    details = usage.get("output_tokens_details")
    thinking = details.get("thinking_tokens") if isinstance(details, dict) else None
    total_input = uncached + cache_read + cache_write
    return {
        "input_tokens": total_input,
        "cached_input_tokens": cache_read,
        "cache_write_input_tokens": cache_write,
        "output_tokens": output,
        "reasoning_output_tokens": thinking if type(thinking) is int and thinking >= 0 else None,
        "total_tokens": total_input + output,
    }


def read_window(path: Path, since: str, until: str) -> dict:
    """Sum unique responses in [since, until] for one transcript."""
    start, end = parse_time(since), parse_time(until)
    if not start or not end or end < start:
        raise ValueError("Invalid capture window")
    responses: dict[str, dict] = {}
    malformed = False
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").split("\n")
    except OSError as error:
        raise ValueError("Could not read a Claude Code transcript") from error
    # The last element is "" for a complete file, or a line still being written; ignore it.
    for line in lines[:-1]:
        try:
            item = json.loads(line)
        except ValueError:
            malformed = True
            continue
        if not isinstance(item, dict) or item.get("type") != "assistant":
            continue
        when = parse_time(item.get("timestamp"))
        message = item.get("message")
        if not when or not isinstance(message, dict):
            malformed = True
            continue
        if not start <= when <= end or message.get("model") == "<synthetic>":
            continue
        message_id = message.get("id")
        if not isinstance(message_id, str):
            malformed = True
            continue
        entry = responses.setdefault(message_id, {"model": message.get("model"),
                                                  "usage": response_usage(message.get("usage")),
                                                  "tool_calls": 0})
        content = message.get("content")
        if isinstance(content, list):
            entry["tool_calls"] += sum(1 for block in content
                                       if isinstance(block, dict) and block.get("type") == "tool_use")
    usage: dict[str, int | None] = {}
    for key in COUNTERS:
        values = [r["usage"][key] if r["usage"] else None for r in responses.values()]
        usage[key] = None if malformed or None in values else sum(values)
    models = sorted({r["model"] for r in responses.values()
                     if isinstance(r["model"], str) and MODEL_ID.fullmatch(r["model"])})
    return {"responses": len(responses), "tool_calls": sum(r["tool_calls"] for r in responses.values()),
            "model_ids": models, "usage": usage}


def capture(task_id: str, session_id: str, projects_dir: Path, since: str, until: str) -> dict:
    if not TASK_ID.fullmatch(task_id):
        raise ValueError("Invalid task ID")
    main = find_transcript(projects_dir, valid_session(session_id))
    sessions = {}
    for key, (path, label) in transcripts(main).items():
        window = read_window(path, since, until)
        if window["responses"]:
            sessions[key] = {"agent_path": label, **window}
    total = {key: (sum(s["usage"][key] for s in sessions.values())
                   if sessions and all(s["usage"][key] is not None for s in sessions.values()) else None)
             for key in COUNTERS}
    return {"schema_version": 1, "task_id": task_id, "root_session_id": session_id.lower(),
            "started_at": since, "finished_at": until, "source": SOURCE,
            "responses": sum(s["responses"] for s in sessions.values()),
            "tool_calls": sum(s["tool_calls"] for s in sessions.values()),
            "sessions": sessions, "total_usage": total}


def start_capture(task_id: str, session_id: str | None, projects_dir: Path,
                  usage_dir: Path = USAGE_DIR) -> dict:
    session_id = valid_session(session_id)
    find_transcript(projects_dir, session_id)
    start = {"schema_version": 1, "task_id": task_id, "root_session_id": session_id,
             "captured_at": now_utc(), "source": SOURCE}
    write_new(usage_dir / f"{task_id}.start.json", start)
    return start


def finish_capture(task_id: str, projects_dir: Path, *, run_file: Path | None = None,
                   usage_dir: Path = USAGE_DIR) -> dict:
    start = json.loads((usage_dir / f"{task_id}.start.json").read_text(encoding="utf-8"))
    if start.get("source") != SOURCE or start.get("task_id") != task_id:
        raise ValueError("The start file was not written by the Claude Code collector for this task")
    summary = capture(task_id, start["root_session_id"], projects_dir, start["captured_at"], now_utc())
    result_path = usage_dir / f"{task_id}.usage.json"
    write_new(result_path, summary)
    try:
        if run_file:
            update_draft_run(run_file, summary, result_path, note=NOTE, tool_calls=summary["tool_calls"])
    except Exception:
        # A bad draft must not strand the exclusive result file and block a retry.
        result_path.unlink(missing_ok=True)
        raise
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=("start", "finish"))
    parser.add_argument("task_id")
    parser.add_argument("--session-id", help="Claude Code session ID; defaults to CLAUDE_CODE_SESSION_ID")
    parser.add_argument("--run-file", type=Path, help="Existing draft run JSON to populate on finish")
    parser.add_argument("--projects-dir", type=Path, default=default_projects_dir())
    args = parser.parse_args()
    if not TASK_ID.fullmatch(args.task_id):
        parser.error("Invalid task ID")
    try:
        if args.command == "start":
            if args.run_file:
                raise ValueError("--run-file is only valid with finish")
            start_capture(args.task_id, args.session_id or os.environ.get("CLAUDE_CODE_SESSION_ID"),
                          args.projects_dir)
            print(f"Captured start time for {args.task_id}; run finish after the task's last agent turn")
        else:
            summary = finish_capture(args.task_id, args.projects_dir, run_file=args.run_file)
            total = summary["total_usage"]
            print(f"Captured counts-only usage for {args.task_id}: {summary['responses']} responses, "
                  f"{summary['tool_calls']} tool calls, input {total['input_tokens']} "
                  f"(cached {total['cached_input_tokens']}), output {total['output_tokens']} "
                  f"(thinking {total['reasoning_output_tokens']})")
        return 0
    except Exception as error:
        # Never print exception details: they can contain a private path or raw input.
        parser.exit(1, f"Usage capture failed ({type(error).__name__}); check the task ID, session ID, "
                       "or draft run fields. No transcript content was copied.\n")


if __name__ == "__main__":
    raise SystemExit(main())
