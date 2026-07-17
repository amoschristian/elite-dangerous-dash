import json
import math
from pathlib import Path

INIT_CACHE = {
    "commander": {
        "name": "",
    },
    "location": {
        "system": {
            "StarSystem": "",
            "StarSystemAddress": "",
            "StarPos": []
        },
        "station": "",
        "faction": ""
    },
    "statistics": {
        "current_credits": 0
    }
}
    
def handle(events):
    data = INIT_CACHE

    # read cache
    cache_file = Path(__file__).parent / "journal/cache.json"
    if cache_file.exists():
        cache = open(cache_file, "r")
        data = json.load(cache)
        
    for i, event in enumerate(events):
        latest_event = events[max(0, i - 1)]
        event_type = event["event"]
        
        if event_type == "Commander":
            data["commander"]["name"] = event["Name"]
        elif event_type == "Location":
            data["location"]["system"]["StarSystem"] = event["StarSystem"]
            data["location"]["system"]["StarSystemAddress"] = event["SystemAddress"]
            data["location"]["system"]["StarPos"] = event["StarPos"]
            data["location"]["station"] = event["StationName"]
            data["location"]["faction"] = event["StationFaction"]["Name"]
        elif event_type == "Statistics":
            data["statistics"]["current_credits"] = event["Bank_Account"]["Current_Wealth"]

    # write updated cache
    cache = open(cache_file, "w")
    json.dump(data, cache)

    return data
