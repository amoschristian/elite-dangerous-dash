import math
from pathlib import Path

from .base import load_json

SCOOPABLE_STARS = ["O", "B", "A", "F", "G", "K", "M"]


class NavRouteService:
    def __init__(self) -> None:
        self._raw: dict = {}
        self._cache: list[dict] = []

    def handle(self, path: Path) -> None:
        navroute = load_json(path)
        self._raw = navroute
        
        routes = navroute.get("Route", [])

        routes = routes[1:]

        self._cache = [
            {
                "name": route.get("StarSystem"),
                "class": route.get("StarClass"),
                "distance": self._distance(
                    route.get("StarPos"),
                    routes[i + 1].get("StarPos") if i + 1 < len(routes) else None,
                ),
                "scoopable": route.get("StarClass") in SCOOPABLE_STARS,
            }
            for i, route in enumerate(routes)
        ]

    @staticmethod
    def _distance(a: list[float] | None, b: list[float] | None) -> float:
        if not a or not b:
            return 0.0
        return round(math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2), 1)

    def get_raw(self) -> dict:
        return self._raw

    def get_cache(self) -> list[dict]:
        return self._cache
