import os
import sys
import time
import threading
import ctypes
import ctypes.wintypes
from pathlib import Path

import uvicorn
from app import app


def _get_secondary_monitor():
    monitors = []

    @ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_ulong, ctypes.c_ulong,
                        ctypes.POINTER(ctypes.wintypes.RECT), ctypes.c_double)
    def callback(hmonitor, hdc, lprect, lparam):
        monitors.append((lprect.contents.left, lprect.contents.top,
                         lprect.contents.right, lprect.contents.bottom))
        return 1

    ctypes.windll.user32.EnumDisplayMonitors(None, None, callback, 0)

    if len(monitors) < 2:
        return None

    for m in monitors:
        left, top, *_ = m
        if left != 0 or top != 0:
            return m
    return None


def _open_dashboard():
    import webview

    frontend_dist = Path(__file__).parent / "frontend" / "dist"
    url = "http://127.0.0.1:8000/index.html" if frontend_dist.exists() else "http://127.0.0.1:5173"

    monitor = _get_secondary_monitor()

    kwargs = {
        "title": "Elite Dangerous Dash",
        "url": url,
        "frameless": False,
        "fullscreen": False,
        "resizable": True,
        "on_top": False,
        "focus": False,
    }

    if monitor:
        left, top, right, bottom = monitor
        kwargs["x"] = left
        kwargs["y"] = top
        kwargs["width"] = right - left
        kwargs["height"] = bottom - top
    else:
        kwargs["width"] = 1024
        kwargs["height"] = 600

    webview.create_window(**kwargs)
    webview.start(gui="edgechromium")


if __name__ == "__main__":
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

    threading.Thread(
        target=uvicorn.run,
        args=(app,),
        kwargs={"host": "127.0.0.1", "port": 8000, "log_level": "warning"},
        daemon=True,
    ).start()

    time.sleep(0.5)
    _open_dashboard()
