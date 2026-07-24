import json
from pathlib import Path
from typing import Any, Protocol


class FileWatchService(Protocol):
    """Protocol for services that watch a file and cache parsed data.

    Every file-watch service module exposes `handle` and `get_cache`
    matching this interface.
    """

    def handle(self, path: Path) -> None: ...

    def get_cache(self) -> Any: ...


def load_json(path: Path) -> Any:
    """Open and parse a JSON file, returning the deserialised data."""
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError, OSError):
        return {}
