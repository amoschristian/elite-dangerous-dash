import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from services import keypress_service
from services.base import FileWatchService
from services.file_observer import FileWatcher
from services.navroute_service import NavRouteService
from services.status_service import StatusService
from urllib.request import Request, urlopen
from urllib.error import URLError

from services.context_service import ContextService
from services.state_service import StateService
from fastapi.middleware.cors import CORSMiddleware

navroute: FileWatchService = NavRouteService()
status: FileWatchService = StatusService()
state: FileWatchService = StateService()
context = ContextService(status, state)
file_observer = FileWatcher()

USE_DUMMY = "--dummy" in sys.argv or os.environ.get("ED_DASH_DUMMY") == "true"

# WebSocket clients
_ws_clients: list[WebSocket] = []
_lock = asyncio.Lock()
_loop: asyncio.AbstractEventLoop | None = None


def _build_message() -> dict:
    return {
        "status": status.get_cache(),
        "state": state.get_cache(),
        "context": context.get_cache(),
        "navroute": navroute.get_cache(),
    }


async def _broadcast() -> None:
    msg = _build_message()
    async with _lock:
        stale: list[WebSocket] = []
        for ws in _ws_clients:
            try:
                await ws.send_json(msg)
            except Exception:
                stale.append(ws)
        for ws in stale:
            _ws_clients.remove(ws)


def _on_file_change(path: Path) -> None:
    if _loop is not None:
        context.handle()
        asyncio.run_coroutine_threadsafe(_broadcast(), _loop)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _loop
    _loop = asyncio.get_running_loop()

    if USE_DUMMY:
        data_dir = Path(__file__).parent / "dummy"
        status_file = data_dir / "Status.json"
        navroute_file = data_dir / "NavRoute.json"
        journal_file = data_dir / "Journal.log"
    else:
        data_dir = (
            Path.home()
            / "Saved Games"
            / "Frontier Developments"
            / "Elite Dangerous"
        )
        status_file = data_dir / "Status.json"
        navroute_file = data_dir / "NavRoute.json"
        journal_file = max(
            data_dir.glob("Journal.*.log"),
            key=lambda p: p.stat().st_mtime,
        )

    # Chain: file change → service → broadcast
    _original_status = status.handle
    _original_navroute = navroute.handle
    _original_state = state.handle

    def _status_handle(path: Path) -> None:
        _original_status(path)
        _on_file_change(path)

    def _navroute_handle(path: Path) -> None:
        _original_navroute(path)
        _on_file_change(path)

    def _state_handle(path: Path) -> None:
        prev_system = state.get_cache().get("location", {}).get("system", {}).get("StarSystem", "")
        _original_state(path)
        new_system = state.get_cache().get("location", {}).get("system", {}).get("StarSystem", "")

        if prev_system != new_system and new_system:
            cached = navroute.get_cache()
            if cached and len(cached) > 0 and cached[0]["name"] == new_system:
                cached.pop(0)

        _on_file_change(path)

    status.handle = _status_handle
    navroute.handle = _navroute_handle
    state.handle = _state_handle

    file_observer.watch(status_file, status.handle)
    file_observer.watch(navroute_file, navroute.handle)
    file_observer.watch(journal_file, state.handle)

    file_observer.start()

    state.handle(journal_file)

    yield

    file_observer.stop()
    _loop = None

    # Clean up clients
    async with _lock:
        _ws_clients.clear()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def index():
    return _build_message()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    async with _lock:
        _ws_clients.append(ws)
    try:
        # Send current state immediately
        await ws.send_json(_build_message())
        # Keep connection alive, listen for disconnects
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        async with _lock:
            if ws in _ws_clients:
                _ws_clients.remove(ws)


@app.get("/action")
def action_endpoint(action: str):
    keypress_service.handle(action)


@app.get("/shutdown")
def shutdown():
    os._exit(0)


@app.get("/focus")
def focus_elite():
    keypress_service.refocus_elite()
    return {"ok": True}


@app.get("/window/kiosk")
def window_kiosk():
    import webview
    if not webview.windows:
        return {"ok": False}
    win = webview.windows[0]
    if not win.native:
        return {"ok": False}
    if not win.native.is_fullscreen:
        win.native.toggle_fullscreen()
    return {"ok": True}


@app.get("/window/windowed")
def window_windowed():
    import webview
    if not webview.windows:
        return {"ok": False}
    win = webview.windows[0]
    if not win.native:
        return {"ok": False}
    if win.native.is_fullscreen:
        win.native.toggle_fullscreen()
    return {"ok": True}


@app.get("/api/spansh/body/{id64}")
def spansh_body_proxy(id64: int):
    """Proxy a single Spansh body request so the frontend avoids CORS."""
    return _spansh_proxy(f"https://spansh.co.uk/api/body/{id64}")


def _spansh_proxy(url: str):
    import json
    from fastapi.responses import JSONResponse
    req = Request(url, headers={"User-Agent": "elite-dangerous-dash/1.0"})
    try:
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (URLError, OSError) as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


if getattr(sys, 'frozen', False):
    base = Path(sys._MEIPASS)
else:
    base = Path(__file__).parent
frontend_dist = base / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
