import json
import math
from pathlib import Path

SCOOPABLE_STARS = [
    'O', 'B', 'A', 'F', 'G', 'K', 'M'
]

def handle(navroute):
    routes = navroute.get("Route", [])

    route_list = []

    for i, route in enumerate(routes):
        next_destination = routes[i + 1] if i + 1 < len(routes) else None
        route_list.append({
            "name": route.get("StarSystem"),
            "class": route.get("StarClass"),
            "distance": distance(route.get("StarPos"), next_destination.get("StarPos")) if next_destination else 0,
            "scoopable": route.get("StarClass") in SCOOPABLE_STARS
        })

    return route_list


def distance(a, b):
    return round(math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2), 2)
