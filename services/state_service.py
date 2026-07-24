import json
from pathlib import Path

from .event_logger import log_journal_event

DOCKING_DENIED_REASONS = {
    "NoSpace":       "No available landing pads at this station. Wait for a pad to free up.",
    "TooLarge":      "Your ship is too large for this station's landing pads.",
    "Hostile":       "The station is hostile toward you. You are not welcome here.",
    "Offences":      "You have outstanding fines or bounties. Clear your record before docking.",
    "Distance":      "You are too far from the station. Move closer within 7.5km and request docking again.",
    "ActiveFighter": "You have a deployed fighter. Retract it before requesting docking.",
    "NoReason":      "Docking request denied for unspecified reasons.",
}

def _parse_factions(factions: list) -> list[dict]:
    """Extract relevant fields from Factions list, sorted by influence desc."""
    parsed = []
    for f in factions:
        active_states = [s.get("State", "") for s in f.get("ActiveStates", [])]
        parsed.append({
            "name": f.get("Name", ""),
            "government": f.get("Government", ""),
            "influence": f.get("Influence", 0.0),
            "state": f.get("FactionState", ""),
            "activeStates": active_states,
            "myReputation": f.get("MyReputation", 0.0),
        })
    parsed.sort(key=lambda f: f["influence"], reverse=True)
    return parsed[:5]


class StateService:
    def __init__(self) -> None:
        self._last_position: int = 0
        self._cache: dict = {
            "location": {
                "system": {
                    "StarSystem": "",
                    "StarSystemAddress": "",
                    "StarPos": [],
                    "Allegiance": "",
                    "Economy": "",
                    "SecondEconomy": "",
                    "Government": "",
                    "Security": "",
                    "Population": 0,
                },
                "station": "",
                "faction": "",
                "factionState": "",
                "factions": [],
            },
            "loadout": {
                "ship": "",
                "ship_name": "",
                "ship_id": "",
                "rebuy": 0,
            },
            "missions": [],
            "news":[],
            "target": {
                "ship": "",
            },
            "approach_body": {
                "name": "",
                "body_id": 0,
            },
            "approach_settlement": {
                "name": "",
                "services": [],
                "economy": "",
                "lat": 0.0,
                "lon": 0.0,
            },
            "docking" : {
                "is_granted": False,
                "landing_pad": "",
                "reason": "",
            },
            "docked": {
                "station_name": "",
                "station_type": "",
                "station_faction": "",
                "station_services": [],
                "station_government": "",
                "station_economy": "",
            },
            "jump": {
                "type": "",
                "star_system": "",
                "star_class": "",
                "system_address": 0,
            },
        }

    def handle(self, path: Path) -> None:
        with open(path) as f:
            file_size = path.stat().st_size
            if file_size < self._last_position:
                self._last_position = 0
            f.seek(self._last_position)

            for line in f:
                line = line.strip()
                if not line:
                    continue

                event = json.loads(line)
                log_journal_event(line)
                self._on_event(event)

            self._last_position = f.tell()

    def _clear_approach_state(self) -> None:
        """Reset approach, docking, and docked caches to defaults."""
        self._cache["approach_body"]["name"] = ""
        self._cache["approach_settlement"]["name"] = ""
        self._cache["approach_settlement"]["services"] = ""
        self._cache["approach_settlement"]["economy"] = ""
        self._cache["approach_settlement"]["lat"] = 0.0
        self._cache["approach_settlement"]["lon"] = 0.0
        self._cache["docking"]["is_granted"] = False
        self._cache["docking"]["landing_pad"] = ""
        self._cache["docking"]["reason"] = ""

    def _clear_docked_state(self) -> None:
        """Clear docked station info (undock / supercruise / jump)."""
        self._clear_approach_state()
        self._cache["docked"]["station_name"] = ""
        self._cache["docked"]["station_type"] = ""
        self._cache["docked"]["station_faction"] = ""
        self._cache["docked"]["station_services"] = ""
        self._cache["docked"]["station_government"] = ""
        self._cache["docked"]["station_economy"] = ""

    def _on_event(self, event: dict) -> None:
        event_type = event["event"]

        # Static Events
        if event_type == "Location":
            loc = self._cache["location"]
            sys = loc["system"]
            sys["StarSystem"] = event["StarSystem"]
            sys["StarSystemAddress"] = event["SystemAddress"]
            sys["StarPos"] = event["StarPos"]
            sys["Allegiance"] = event.get("SystemAllegiance", "")
            sys["Economy"] = event.get("SystemEconomy_Localised", "")
            sys["SecondEconomy"] = event.get("SystemSecondEconomy_Localised", "")
            sys["Government"] = event.get("SystemGovernment_Localised", "")
            sys["Security"] = event.get("SystemSecurity_Localised", "")
            sys["Population"] = event.get("Population", 0)
            loc["station"] = event.get("StationName", "")
            loc["faction"] = event.get("StationFaction", {}).get("Name", "")
            loc["factionState"] = event.get("StationFaction", {}).get("FactionState", "")
            loc["factions"] = _parse_factions(event.get("Factions", []))
            # Location with Docked=true means we loaded in while docked.
            # Populate docked cache and clear approach state, same as Docked event.
            if event.get("Docked") and event.get("StationName"):
                self._clear_approach_state()
                docked = self._cache["docked"]
                docked["station_name"] = event["StationName"]
                docked["station_type"] = event.get("StationType", "")
                docked["station_faction"] = event.get("StationFaction", {}).get("Name", "")
                docked["station_services"] = event.get("StationServices", [])
                docked["station_government"] = event.get("StationGovernment_Localised", "")
                docked["station_economy"] = event.get("StationEconomy_Localised", "")
        elif event_type == "FSDJump":
            loc = self._cache["location"]
            sys = loc["system"]
            sys["StarSystem"] = event["StarSystem"]
            sys["StarSystemAddress"] = event["SystemAddress"]
            sys["StarPos"] = event["StarPos"]
            sys["Allegiance"] = event.get("SystemAllegiance", "")
            sys["Economy"] = event.get("SystemEconomy_Localised", "")
            sys["SecondEconomy"] = event.get("SystemSecondEconomy_Localised", "")
            sys["Government"] = event.get("SystemGovernment_Localised", "")
            sys["Security"] = event.get("SystemSecurity_Localised", "")
            sys["Population"] = event.get("Population", 0)
            loc["station"] = ""
            loc["faction"] = event.get("SystemFaction", {}).get("Name", "")
            loc["factionState"] = event.get("SystemFaction", {}).get("FactionState", "")
            loc["factions"] = _parse_factions(event.get("Factions", []))
            self._clear_docked_state()
        elif event_type == "StartJump":
            jump = self._cache["jump"]
            jump["type"] = event.get("JumpType", "")
            jump["star_system"] = event.get("StarSystem", "")
            jump["star_class"] = event.get("StarClass", "")
            jump["system_address"] = event.get("SystemAddress", 0)
        elif event_type == "Loadout":
            self._cache["loadout"]["ship"] = event["Ship"].upper()
            self._cache["loadout"]["ship_name"] = event["ShipName"]
            self._cache["loadout"]["ship_id"] = event["ShipIdent"]
            self._cache["loadout"]["rebuy"] = event["Rebuy"]
            self._cache["loadout"]["fuel_capacity"] = event.get("FuelCapacity", {}).get("Main", 0.0) or 0.0
            self._cache["loadout"]["hull_health"] = event.get("HullHealth", 1.0)
        elif event_type == "Mission":
            self._cache["missions"] = event["Active"]

        # Combat Events
        elif event_type == "ShipTargeted":
            self._cache["target"]["ship"] = event 

        # Planetary Approach
        elif event_type == "ApproachBody":
            self._cache["approach_body"]["name"] = event["Body"]
            self._cache["approach_body"]["body_id"] = event.get("BodyID", 0)
            self._cache["approach_settlement"]["name"] = ""
        elif event_type == "ApproachSettlement":
            self._cache["approach_body"]["name"] = ""
            self._cache["approach_settlement"]["name"] = event["Name"]
            self._cache["approach_settlement"]["services"] = event["StationServices"]
            self._cache["approach_settlement"]["economy"] = event["StationEconomy_Localised"]
            self._cache["approach_settlement"]["lat"] = event.get("Latitude", 0.0)
            self._cache["approach_settlement"]["lon"] = event.get("Longitude", 0.0)
        elif event_type in ("SupercruiseEntry", "LeaveBody"):
            self._clear_docked_state()

        # Docking Process
        elif event_type == "DockingDenied":
            self._cache["docking"]["is_granted"] = False
            self._cache["docking"]["reason"] = DOCKING_DENIED_REASONS.get(event["Reason"], "Unknown reason")
        elif event_type == "DockingGranted":
            self._cache["docking"]["is_granted"] = True
            self._cache["docking"]["landing_pad"] = event["LandingPad"]
            self._cache["docking"]["reason"] = ""
        elif event_type == "DockingCancelled":
            self._cache["docking"]["is_granted"] = False
            self._cache["docking"]["landing_pad"] = ""
            self._cache["docking"]["reason"] = ""

        # Docked and Undocked
        elif event_type == "Docked":
            self._clear_approach_state()
            self._cache["location"]["system"]["StarSystem"] = event.get("StarSystem", self._cache["location"]["system"]["StarSystem"])
            self._cache["location"]["system"]["StarSystemAddress"] = event.get("SystemAddress", self._cache["location"]["system"]["StarSystemAddress"])
            self._cache["location"]["station"] = event["StationName"]
            docked = self._cache["docked"]
            docked["station_name"] = event["StationName"]
            docked["station_type"] = event["StationType"]
            docked["station_faction"] = event["StationFaction"]["Name"]
            docked["station_services"] = event["StationServices"]
            docked["station_government"] = event["StationGovernment_Localised"]
            docked["station_economy"] = event["StationEconomy_Localised"]
        elif event_type == "Undocked":
            self._clear_docked_state()

    def get_cache(self) -> dict:
        return self._cache
