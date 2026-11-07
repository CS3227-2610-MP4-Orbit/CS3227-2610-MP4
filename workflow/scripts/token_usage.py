"""Capture counts-only Codex usage for a bounded development task.

Raw Codex JSONL is read locally and never copied to the repository. Run ``start``
from the orchestrator before work, then ``finish`` after all agent turns end.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from agent_workflow import ROOT, TASK_ID, validate_run


THREAD_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
AGENT_PATH = re.compile(r"^/root(?:/[a-z0-9_]+)*$")
MODEL_ID = re.compile(r"^[a-zA-Z0-9_.:-]{1,100}$")
COUNTERS = ("input_tokens", "cached_input_tokens", "cache_write_input_tokens",
            "output_tokens", "reasoning_output_tokens", "total_tokens")
USAGE_DIR = ROOT / "workflow/evidence/usage"


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def parse_time(value: str | None) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
    except ValueError:
        return None


def valid_thread(value: str | None) -> str:
    if not isinstance(value, str) or not THREAD_ID.fullmatch(value):
        raise ValueError("A valid root Codex thread ID is required")
    return value.lower()


def safe_name(value: str | None, pattern: re.Pattern[str]) -> str | None:
    return value if isinstance(value, str) and pattern.fullmatch(value) else None


def session_metadata(sessions_dir: Path) -> dict[str, tuple[Path, dict]]:
    """Read only the metadata line needed to establish thread ancestry."""
    found: dict[str, tuple[Path, dict]] = {}
    for path in sessions_dir.rglob("*.jsonl"):
        if path.is_symlink() or not path.is_file():
            continue
        try:
            with path.open(encoding="utf-8", errors="replace") as stream:
                for line in stream:
                    item = json.loads(line)
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") != "session_meta":
                        continue
                    payload = item.get("payload")
                    if not isinstance(payload, dict):
                        continue
                    thread_id = safe_name(payload.get("id"), THREAD_ID)
                    if thread_id:
                        source = payload.get("source")
                        subagent = source.get("subagent") if isinstance(source, dict) else None
                        found[thread_id.lower()] = (path, {
                            "parent_thread_id": safe_name(payload.get("parent_thread_id"), THREAD_ID),
                            "agent_path": safe_name(payload.get("agent_path"), AGENT_PATH),
                            "spawned": isinstance(subagent, dict) and isinstance(subagent.get("thread_spawn"), dict),
                            "created_at": item.get("timestamp") if parse_time(item.get("timestamp")) else None,
                        })
                    break
        except (OSError, ValueError, TypeError):
            continue
    return found


def selected_sessions(metadata: dict[str, tuple[Path, dict]], root_id: str) -> list[str]:
    if root_id not in metadata:
        raise ValueError("Root Codex session was not found; run from Codex or supply --thread-id")
    selected = {root_id}
    while True:
        children = {
            thread_id for thread_id, (_, meta) in metadata.items()
            if meta["spawned"] and meta["agent_path"] and meta["parent_thread_id"] in selected
        }
        if children <= selected:
            break
        selected.update(children)
    return sorted(selected)


def read_counters(path: Path, model_since: str | None = None) -> tuple[dict[str, int | None], list[str]]:
    usage: dict[str, int | None] = {key: None for key in COUNTERS}
    models: set[str] = set()
    malformed = False
    try:
        with path.open(encoding="utf-8", errors="replace") as stream:
            for line in stream:
                try:
                    item = json.loads(line)
                except (ValueError, TypeError):
                    malformed = True
                    continue
                if not isinstance(item, dict):
                    malformed = True
                    continue
                payload = item.get("payload")
                if not isinstance(payload, dict):
                    malformed = True
                    continue
                if item.get("type") == "turn_context":
                    model = safe_name(payload.get("model"), MODEL_ID)
                    when = parse_time(item.get("timestamp"))
                    since = parse_time(model_since)
                    if model and since and when and when >= since:
                        models.add(model)
                elif item.get("type") == "event_msg" and payload.get("type") == "token_count":
                    info = payload.get("info")
                    if not isinstance(info, dict):
                        malformed = True
                        continue
                    total = info.get("total_token_usage")
                    if isinstance(total, dict):
                        usage = {key: value if type(value) is int and value >= 0 else None
                                 for key in COUNTERS for value in [total.get(key)]}
                    else:
                        malformed = True
    except OSError as error:
        raise ValueError("Could not read a Codex session log") from error
    if malformed:
        # A malformed final usage event could otherwise make a stale count look final.
        usage = {key: None for key in COUNTERS}
    return usage, sorted(models)


def snapshot(task_id: str, root_id: str, sessions_dir: Path, *, model_since: str | None = None) -> dict:
    if not TASK_ID.fullmatch(task_id):
        raise ValueError("Invalid task ID")
    root_id = valid_thread(root_id)
    metadata = session_metadata(sessions_dir)
    if root_id in metadata and metadata[root_id][1]["agent_path"]:
        raise ValueError("Usage capture must start from the root orchestrator thread")
    sessions = {}
    for thread_id in selected_sessions(metadata, root_id):
        path, meta = metadata[thread_id]
        usage, models = read_counters(path, model_since=model_since)
        sessions[thread_id] = {
            "agent_path": "root" if thread_id == root_id else meta["agent_path"],
            "parent_thread_id": meta["parent_thread_id"] if thread_id != root_id else None,
            "created_at": meta["created_at"],
            "model_ids": models,
            "usage": usage,
        }
    return {"schema_version": 1, "task_id": task_id, "root_thread_id": root_id,
            "captured_at": now_utc(), "sessions": sessions}


def usage_delta(start: dict, end: dict) -> dict:
    if start.get("task_id") != end.get("task_id") or start.get("root_thread_id") != end.get("root_thread_id"):
        raise ValueError("Start and finish snapshots identify different tasks or threads")
    if set(start["sessions"]) - set(end["sessions"]):
        raise ValueError("A previously observed Codex session is missing at finish")
    deltas = {}
    for thread_id, after in end["sessions"].items():
        before = start["sessions"].get(thread_id)
        new_session_is_task_scoped = (
            before is None and parse_time(after.get("created_at")) is not None
            and parse_time(start["captured_at"]) is not None
            and parse_time(after["created_at"]) >= parse_time(start["captured_at"])
        )
        values = {}
        for key in COUNTERS:
            old = before["usage"].get(key) if before else (0 if new_session_is_task_scoped else None)
            new = after["usage"].get(key)
            if old is None or new is None:
                values[key] = None
            elif new < old:
                raise ValueError("Codex usage counters decreased; task attribution is unsafe")
            else:
                values[key] = new - old
        deltas[thread_id] = {
            "agent_path": after["agent_path"], "model_ids": after["model_ids"],
            "usage": values,
        }
    aggregate = {
        key: (sum(entry["usage"][key] for entry in deltas.values())
              if deltas and all(entry["usage"][key] is not None for entry in deltas.values()) else None)
        for key in COUNTERS
    }
    return {"schema_version": 1, "task_id": end["task_id"],
            "root_thread_id": end["root_thread_id"],
            "started_at": start["captured_at"], "finished_at": end["captured_at"],
            "source": "local_codex_token_count_cumulative_delta",
            "sessions": deltas, "total_usage": aggregate}


def write_new(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
        json.dump(value, stream, indent=2, sort_keys=True)
        stream.write("\n")


CODEX_NOTE = ("Usage from local Codex cumulative token-count deltas; "
              "see counts-only evidence file. Missing counters remain null.")


def update_draft_run(path: Path, summary: dict, evidence_path: Path, *,
                     note: str = CODEX_NOTE, tool_calls: int | None = None) -> None:
    # Never edit the append-only record or arbitrary files outside the draft folder.
    expected = (ROOT / "workflow/requests").resolve()
    if not path.resolve().is_relative_to(expected) or path.suffix != ".json" or not path.name.endswith("-run.json"):
        raise ValueError("--run-file must be an existing workflow/requests/*-run.json draft")
    run = json.loads(path.read_text(encoding="utf-8"))
    if run.get("task_id") != summary["task_id"]:
        raise ValueError("Draft run task ID does not match the usage capture")
    mapping = {"input_tokens": "input_tokens", "cached_tokens": "cached_input_tokens",
               "reasoning_tokens": "reasoning_output_tokens", "output_tokens": "output_tokens"}
    for target, source in mapping.items():
        if run.get(target) is not None:
            raise ValueError(f"Draft run {target} is already populated")
        run[target] = summary["total_usage"][source]
    model_ids = {}
    for entry in summary["sessions"].values():
        model_ids[entry["agent_path"]] = sorted(set(model_ids.get(entry["agent_path"], [])) | set(entry["model_ids"]))
    run["model_ids"] = model_ids
    relative = str(evidence_path.relative_to(ROOT))
    run["evidence_paths"] = list(dict.fromkeys([*run["evidence_paths"], relative]))
    if tool_calls is not None and run.get("tool_calls") is None:
        run["tool_calls"] = tool_calls
    run["notes"] = (run.get("notes", "") + " " + note).strip()
    validate_run(run)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                     prefix=".usage-run-", delete=False) as stream:
        temporary = Path(stream.name)
        json.dump(run, stream, indent=2)
        stream.write("\n")
    temporary.replace(path)


def finish_capture(task_id: str, sessions_dir: Path, *, run_file: Path | None = None,
                   thread_id: str | None = None, usage_dir: Path = USAGE_DIR) -> dict:
    start_path = usage_dir / f"{task_id}.start.json"
    result_path = usage_dir / f"{task_id}.usage.json"
    start = json.loads(start_path.read_text(encoding="utf-8"))
    root_id = valid_thread(thread_id or start.get("root_thread_id"))
    end = snapshot(task_id, root_id, sessions_dir, model_since=start["captured_at"])
    summary = usage_delta(start, end)
    write_new(result_path, summary)
    try:
        if run_file:
            update_draft_run(run_file, summary, result_path)
    except Exception:
        # A bad draft must not strand an exclusive result artifact and prevent retry.
        result_path.unlink(missing_ok=True)
        raise
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("start", "finish"))
    parser.add_argument("task_id")
    parser.add_argument("--thread-id", help="Root Codex thread ID; defaults to CODEX_THREAD_ID for start")
    parser.add_argument("--run-file", type=Path, help="Existing draft run JSON to populate on finish")
    parser.add_argument("--sessions-dir", type=Path, default=Path(os.environ.get("CODEX_HOME", "~/.codex")).expanduser() / "sessions")
    args = parser.parse_args()
    if not TASK_ID.fullmatch(args.task_id):
        parser.error("Invalid task ID")
    start_path = USAGE_DIR / f"{args.task_id}.start.json"
    try:
        if args.command == "start":
            if args.run_file:
                raise ValueError("--run-file is only valid with finish")
            data = snapshot(args.task_id, args.thread_id or os.environ.get("CODEX_THREAD_ID"), args.sessions_dir)
            write_new(start_path, data)
            print(f"Captured start usage for {args.task_id}; finish after all agent turns end")
        else:
            summary = finish_capture(args.task_id, args.sessions_dir,
                                     run_file=args.run_file, thread_id=args.thread_id)
            print(f"Captured counts-only usage for {args.task_id}; sessions: {len(summary['sessions'])}")
        return 0
    except Exception as error:
        # Never print exception details: they can contain a private path or raw input.
        parser.exit(1, f"Usage capture failed ({type(error).__name__}); inspect the task ID, "
                       "session availability, or draft run fields. No raw log content was copied.\n")


if __name__ == "__main__":
    raise SystemExit(main())
