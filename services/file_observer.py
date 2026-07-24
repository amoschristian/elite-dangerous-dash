from pathlib import Path
from typing import Callable
import time

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class _FileObserver(FileSystemEventHandler):
    def __init__(self, target_file: Path, callback: Callable) -> None:
        self.target_file = target_file.resolve()
        self.callback = callback

    def on_modified(self, event) -> None:
        if event.is_directory:
            return

        time.sleep(0.1)
        path = Path(event.src_path).resolve()

        if path != self.target_file:
            return

        self.callback(path)


class FileWatcher:
    def __init__(self) -> None:
        self._observer = Observer()

    def watch(self, path: Path, callback: Callable) -> None:
        self._observer.schedule(
            _FileObserver(path, callback),
            str(path.parent),
            recursive=False,
        )

    def start(self) -> None:
        self._observer.start()

    def stop(self) -> None:
        self._observer.stop()
        self._observer.join()
