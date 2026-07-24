#!/usr/bin/env python3
"""
Replay engine for Elite Dangerous events.

Reads recorded events from dummy/ed_journal.log and dummy/ed_status.log
and replays them step by step into dummy/Journal.log and dummy/Status.json
so the dashboard can be tested with real scenario data.

The two log files are merged by timestamp to preserve chronological order
across the independent journal and status streams.

Usage:
    python replay.py              Show current state and position
    python replay.py next         Advance to next event
    python replay.py prev         Go back to previous event
    python replay.py reset        Go back to start
    python replay.py goto N       Jump to event N
    python replay.py run          Replay all events sequentially (with delay)
    python replay.py status       Show replay position info
"""

import json
import sys
import time
from pathlib import Path

DUMMY_DIR = Path(__file__).parent / "dummy"
JOURNAL_EVENTS_FILE = DUMMY_DIR / "ed_journal.log"
STATUS_EVENTS_FILE = DUMMY_DIR / "ed_status.log"
JOURNAL_FILE = DUMMY_DIR / "Journal.log"
STATUS_FILE = DUMMY_DIR / "Status.json"
NAVROUTE_FILE = DUMMY_DIR / "NavRoute.json"
STATE_FILE = DUMMY_DIR / ".replay_state.json"


def load_events() -> list[dict]:
    """Load both log files and merge into a single sorted timeline."""
    events: list[dict] = []

    if JOURNAL_EVENTS_FILE.exists():
        with open(JOURNAL_EVENTS_FILE) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                record = json.loads(line)
                record["source"] = "journal"
                events.append(record)

    if STATUS_EVENTS_FILE.exists():
        with open(STATUS_EVENTS_FILE) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                record = json.loads(line)
                record["source"] = "status"
                events.append(record)

    events.sort(key=lambda e: e["ts"])
    return events


def load_state() -> dict:
    """Load replay state (current index and initial journal/status snapshots)."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return _create_initial_state()


def _create_initial_state() -> dict:
    """Snapshot the current dummy files to create a baseline."""
    journal_lines: list[str] = []
    if JOURNAL_FILE.exists():
        with open(JOURNAL_FILE) as f:
            journal_lines = [line.rstrip() for line in f if line.strip()]

    status_data = {}
    if STATUS_FILE.exists() and STATUS_FILE.stat().st_size > 0:
        with open(STATUS_FILE) as f:
            status_data = json.load(f)

    navroute_data = {}
    if NAVROUTE_FILE.exists() and NAVROUTE_FILE.stat().st_size > 0:
        with open(NAVROUTE_FILE) as f:
            navroute_data = json.load(f)

    return {
        "index": -1,
        "total_events": 0,
        "initial_journal_lines": journal_lines,
        "initial_status": status_data,
        "initial_navroute": navroute_data,
    }


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def reset_files(state: dict) -> None:
    """Restore dummy files to the initial baseline state."""
    # Restore Journal.log
    initial_lines = state.get("initial_journal_lines", [])
    with open(JOURNAL_FILE, "w") as f:
        for line in initial_lines:
            f.write(line + "\n")

    # Restore Status.json
    initial_status = state.get("initial_status", {})
    with open(STATUS_FILE, "w") as f:
        json.dump(initial_status, f, indent=2)

    # Restore NavRoute.json
    initial_navroute = state.get("initial_navroute", {})
    if initial_navroute:
        with open(NAVROUTE_FILE, "w") as f:
            json.dump(initial_navroute, f, indent=2)


def replay_event(event: dict) -> None:
    """Write a single recorded event to the appropriate dummy file."""
    source = event["source"]
    data = event["data"]

    if source == "journal":
        line = json.dumps(data, separators=(",", ":"))
        with open(JOURNAL_FILE, "a") as f:
            f.write(line + "\n")

        # NavRoute events also update NavRoute.json
        if data.get("event") == "NavRoute":
            with open(NAVROUTE_FILE, "w") as f:
                json.dump(data, f, indent=2)

    elif source == "status":
        with open(STATUS_FILE, "w") as f:
            json.dump(data, f, indent=2)


def show_progress(events: list[dict], state: dict) -> None:
    """Print current replay position and the next few events."""
    idx = state["index"]
    total = len(events)

    print(f"Position: {idx + 1} / {total}")
    print()

    if idx >= 0 and idx < total:
        ev = events[idx]
        source = ev["source"]
        event_type = ev["data"].get("event", "?")
        ts = ev["ts"]
        print(f"  Last: [{source}] {event_type}  @ {ts}")

    if idx + 1 < total:
        next_ev = events[idx + 1]
        source = next_ev["source"]
        event_type = next_ev["data"].get("event", "?")
        ts = next_ev["ts"]
        print(f"  Next: [{source}] {event_type}  @ {ts}")

    print()
    print("Commands: next | prev | reset | goto N | run | status")


def cmd_status(events: list[dict], state: dict) -> None:
    """Show detailed replay status."""
    show_progress(events, state)

    print("--- Dummy files state ---")
    if JOURNAL_FILE.exists():
        lines = sum(1 for _ in open(JOURNAL_FILE))
        print(f"  Journal.log: {lines} lines")
    if STATUS_FILE.exists():
        print(f"  Status.json: present")


def cmd_next(events: list[dict], state: dict) -> None:
    """Advance one event."""
    idx = state["index"] + 1
    if idx >= len(events):
        print("Already at the end.")
        return

    event = events[idx]
    replay_event(event)
    state["index"] = idx
    state["total_events"] = len(events)
    save_state(state)

    source = event["source"]
    event_type = event["data"].get("event", "?")
    print(f"[{idx + 1}/{len(events)}] Replayed: [{source}] {event_type}")


def cmd_prev(events: list[dict], state: dict) -> None:
    """Go back one event (reset and replay up to previous)."""
    if state["index"] < 0:
        print("Already at the start.")
        return

    # Reset files and replay all events before current
    reset_files(state)
    target_idx = state["index"] - 1
    state["index"] = -1
    save_state(state)

    for i in range(target_idx + 1):
        ev = events[i]
        replay_event(ev)
        state["index"] = i
    state["total_events"] = len(events)
    save_state(state)

    print(f"[{target_idx + 1}/{len(events)}] Rewound to event {target_idx + 1}")


def cmd_reset(events: list[dict], state: dict) -> None:
    """Reset to initial state."""
    reset_files(state)
    state["index"] = -1
    state["total_events"] = len(events)
    save_state(state)
    print("Reset to initial state.")


def cmd_goto(events: list[dict], state: dict, target: int) -> None:
    """Jump to a specific event index (1-based)."""
    if target < 1 or target > len(events):
        print(f"Invalid index. Range: 1 - {len(events)}")
        return

    reset_files(state)
    state["index"] = -1
    for i in range(target):
        replay_event(events[i])
        state["index"] = i
    state["total_events"] = len(events)
    save_state(state)

    ev = events[target - 1]
    source = ev["source"]
    event_type = ev["data"].get("event", "?")
    print(f"[{target}/{len(events)}] Jumped to: [{source}] {event_type}")


def cmd_run(events: list[dict], state: dict, delay: float = 0.1) -> None:
    """Replay all remaining events with a delay between each."""
    idx = state["index"]
    remaining = events[idx + 1:]
    print(f"Replaying {len(remaining)} events (delay={delay}s)...")
    for i, ev in enumerate(remaining):
        replay_event(ev)
        idx += 1
        state["index"] = idx
        state["total_events"] = len(events)
        source = ev["source"]
        event_type = ev["data"].get("event", "?")
        print(f"  [{idx + 1}/{len(events)}] [{source}] {event_type}")
        time.sleep(delay)
    save_state(state)
    print("Done.")


def main() -> None:
    if not JOURNAL_EVENTS_FILE.exists() and not STATUS_EVENTS_FILE.exists():
        print(f"Error: No event logs found ({JOURNAL_EVENTS_FILE} or {STATUS_EVENTS_FILE})")
        sys.exit(1)

    events = load_events()
    state = load_state()

    command = sys.argv[1] if len(sys.argv) > 1 else "status"

    if command == "next":
        cmd_next(events, state)
    elif command == "prev":
        cmd_prev(events, state)
    elif command == "reset":
        cmd_reset(events, state)
    elif command == "goto":
        if len(sys.argv) < 3:
            print("Usage: python replay.py goto N")
            sys.exit(1)
        cmd_goto(events, state, int(sys.argv[2]))
    elif command == "run":
        delay = float(sys.argv[2]) if len(sys.argv) > 2 else 0.1
        cmd_run(events, state, delay)
    elif command == "status":
        cmd_status(events, state)
    else:
        print(f"Unknown command: {command}")
        print("Commands: next | prev | reset | goto N | run | status")


if __name__ == "__main__":
    main()
