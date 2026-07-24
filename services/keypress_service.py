import sys
from time import sleep
from pynput.keyboard import Key

_is_windows = sys.platform == "win32"

if _is_windows:
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    _ed_hwnd = None
    _EnumWindowsProc = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    KEYEVENTF_KEYUP = 0x0002
    KEYEVENTF_EXTENDEDKEY = 0x0001

    PM_NOREMOVE = 0x0001

    _vk_map = {
        Key.insert: 0x2D,
        Key.home: 0x24,
        Key.delete: 0x2E,
        Key.up: 0x26,
        Key.down: 0x28,
        Key.left: 0x25,
        Key.right: 0x27,
        Key.shift: 0x10,
    }


    def _find_elite_window():
        global _ed_hwnd
        if _ed_hwnd and user32.IsWindow(_ed_hwnd):
            return _ed_hwnd

        for title in ["Elite - Dangerous (CLIENT)", "Elite - Dangerous", "Elite Dangerous"]:
            hwnd = user32.FindWindowW(None, title)
            if hwnd:
                _ed_hwnd = hwnd
                return hwnd

        found = [None]

        def enum_cb(hwnd, _):
            if found[0]:
                return False
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buf = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buf, length + 1)
                txt = buf.value
                if "Elite" in txt and "Dangerous" in txt:
                    found[0] = hwnd
                    return False
            return True

        user32.EnumWindows(_EnumWindowsProc(enum_cb), 0)
        if found[0]:
            _ed_hwnd = found[0]
        return _ed_hwnd


    def refocus_elite():
        hwnd = _find_elite_window()
        if not hwnd:
            return

        fg = user32.GetForegroundWindow()
        if fg == hwnd:
            return

        msg = wintypes.MSG()
        user32.PeekMessageW(ctypes.byref(msg), None, 0, 0, PM_NOREMOVE)

        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, 9)

        fg_thread = user32.GetWindowThreadProcessId(fg, None)
        cur_thread = kernel32.GetCurrentThreadId()
        if fg_thread != cur_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, True)
        user32.SetForegroundWindow(hwnd)
        user32.BringWindowToTop(hwnd)
        if fg_thread != cur_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, False)


    def _vk(key):
        if isinstance(key, str):
            return ord(key.upper())
        return _vk_map.get(key, 0)


    def _send_key(key):
        vk = _vk(key)
        scan = user32.MapVirtualKeyW(vk, 0)
        extended = vk in (0x2D, 0x24, 0x2E, 0x26, 0x28, 0x25, 0x27)
        flags = KEYEVENTF_EXTENDEDKEY if extended else 0

        user32.keybd_event(vk, scan, flags, 0)
        user32.keybd_event(vk, scan, flags | KEYEVENTF_KEYUP, 0)


    def _send_shift_m():
        shift_vk = _vk(Key.shift)
        shift_scan = user32.MapVirtualKeyW(shift_vk, 0)
        m_vk = _vk("m")
        m_scan = user32.MapVirtualKeyW(m_vk, 0)

        user32.keybd_event(shift_vk, shift_scan, 0, 0)
        user32.keybd_event(m_vk, m_scan, 0, 0)
        user32.keybd_event(m_vk, m_scan, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(shift_vk, shift_scan, KEYEVENTF_KEYUP, 0)


def handle(action: str):
    if not _is_windows:
        return
    if not _find_elite_window():
        return

    refocus_elite()
    sleep(0.05)

    if action == "system_map":
        _send_key("n")
    elif action == "galaxy_map":
        _send_key("m")
    elif action == "cockpit_mode":
        _send_shift_m()
    elif action == "supercruise":
        _send_key("j")
    elif action == "hyperspace":
        _send_key("k")
    elif action == "balance_pips":
        _send_key(Key.down)
    elif action == "flight_assist":
        _send_key("z")
    elif action == "landing_gear":
        _send_key("l")
    elif action == "lights":
        _send_key(Key.insert)
    elif action == "night_vision":
        _send_key("/")
    elif action == "hardpoint":
        _send_key("u")
    elif action == "cargo_scoop":
        _send_key(Key.home)
    elif action == "silent_running":
        _send_key(Key.delete)
    elif action == "engine_pips":
        _send_key(Key.up)
    elif action == "system_pips":
        _send_key(Key.left)
    elif action == "weapon_pips":
        _send_key(Key.right)
    elif action == "heatsink":
        _send_key("v")
    elif action == "fsd":
        _send_key("j")
