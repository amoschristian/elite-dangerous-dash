import json
from datetime import datetime
from pathlib import Path


JOURNAL_LOG = Path("ed_journal.log")
STATUS_LOG = Path("ed_status.log")
ENABLED = False


def log_journal_event(raw_line: str) -> None:
    if not ENABLED:
        return
    try:
        data = json.loads(raw_line)
    except json.JSONDecodeError:
        data = {"_raw": raw_line}

    record = {
        "ts": datetime.now().isoformat(timespec="milliseconds"),
        "data": data,
    }

    with open(JOURNAL_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, separators=(",", ":")) + "\n")


def log_status_update(raw_data: dict) -> None:
    if not ENABLED:
        return

    record = {
        "ts": datetime.now().isoformat(timespec="milliseconds"),
        "data": raw_data,
    }

    with open(STATUS_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, separators=(",", ":")) + "\n")
