import time


class ContextService:
    def __init__(self, status_service, state_service):
        self._cache: dict = {
            "context": "normal",
            "data": {}
        }
        self._status = status_service
        self._state = state_service
        self._last_fuel = 0.0
        self._last_fuel_time = 0.0

    def handle(self):
        status = self._status.get_cache()
        state = self._state.get_cache()

        flags = status.get("Flags", {})
        altitude = status.get("Altitude", 0)

        approach_body = state.get("approach_body", {})
        approach_settlement = state.get("approach_settlement", {})
        docking = state.get("docking", {})
        docked = state.get("docked", {})
        location = state.get("location", {})

        # ── Layer 1: Interdiction ──────────────────────────
        if flags.get("is_being_interdicted"):
            self._cache["context"] = "danger"
            self._cache["data"] = {
                "in_danger": True,
                "interdicted": True,
            }

        # ── Layer 2: FSD Transient (takes priority over heat danger) ─
        elif flags.get("is_fsd_jumping"):
            destination = status.get("Destination", {})
            jump = state.get("jump", {})
            self._cache["context"] = "fsd_jump"
            self._cache["data"] = {
                "destination": destination.get("Name", ""),
                "system_address": destination.get("System", ""),
                "jump_type": jump.get("type", ""),
                "star_class": jump.get("star_class", ""),
            }

        elif flags.get("is_fsd_charging"):
            destination = status.get("Destination", {})
            jump = state.get("jump", {})
            dest_system = destination.get("System", 0)
            is_hyperspace = bool(dest_system) if dest_system else jump.get("type") == "Hyperspace"
            self._cache["context"] = "fsd_charging"
            self._cache["data"] = {
                "destination": destination.get("Name", ""),
                "system_address": dest_system,
                "jump_type": "Hyperspace" if is_hyperspace else "Supercruise",
                "star_class": jump.get("star_class", ""),
            }

        # ── Layer 3: Fuel scooping (intentional action, beats heat danger) ─
        elif flags.get("is_scooping_fuel"):
            self._handle_scooping(status, state)

        # ── Layer 4: General danger (skip overheating — heat indicator covers it) ─
        elif flags.get("is_in_danger") and not flags.get("is_overheating"):
            self._cache["context"] = "danger"
            self._cache["data"] = {
                "in_danger": True,
                "interdicted": False,
            }

        # ── Layer 5: Docking ───────────────────────────────
        elif docking.get("reason"):
            self._cache["context"] = "docking_denied"
            self._cache["data"] = {
                "reason": docking.get("reason"),
            }

        elif docking.get("is_granted"):
            self._cache["context"] = "docking"
            self._cache["data"] = {
                "landing_pad": docking.get("landing_pad"),
            }

        elif flags.get("is_docked"):
            self._cache["context"] = "docked"
            self._cache["data"] = {
                "station": docked.get("station_name"),
                "type": docked.get("station_type"),
                "faction": docked.get("station_faction"),
                "government": docked.get("station_government"),
                "economy": docked.get("station_economy"),
                "services": docked.get("station_services", []),
            }

        # ── Layer 6: Flight ────────────────────────────────
        elif approach_settlement.get("name"):
            self._cache["context"] = "approach_settlement"
            self._cache["data"] = {
                "settlement": approach_settlement.get("name", ""),
                "economy": approach_settlement.get("economy", ""),
                "services": approach_settlement.get("services", ""),
                "altitude": round(altitude, 1),
            }

        elif approach_body.get("name"):
            self._cache["context"] = "approach_body"
            self._cache["data"] = {
                "body": approach_body.get("name"),
                "altitude": round(altitude, 1),
                "planet_radius": round(status.get("PlanetRadius", 0.0), 1),
                "speed": round(status.get("Speed", 0.0), 1),
                "system_address": state.get("location", {}).get("system", {}).get("StarSystemAddress", 0),
                "body_id": approach_body.get("body_id", 0),
            }

        elif flags.get("is_supercruise"):
            destination = status.get("Destination", {})
            self._cache["context"] = "supercruise"
            self._cache["data"] = {
                "current_system": location.get("system", {}).get("StarSystem", ""),
                "destination": destination.get("Name", ""),
                "system_address": destination.get("System", ""),
            }

        # ── Layer 7: Warning ───────────────────────────────
        elif flags.get("is_low_fuel"):
            fuel = status.get("Fuel", {})
            fuel_main = fuel.get("FuelMain", 0.0)
            fuel_capacity = state.get("loadout", {}).get("fuel_capacity") or 0.0
            if fuel_capacity > 0:
                pct = round(fuel_main / fuel_capacity * 100, 1)
            else:
                pct = 0.0
            self._cache["context"] = "low_fuel"
            self._cache["data"] = {
                "fuel_main": fuel_main,
                "fuel_capacity": fuel_capacity,
                "fuel_pct": pct,
            }

        else:
            loc = state.get("location", {})
            sys = loc.get("system", {})
            self._cache["context"] = "normal"
            self._cache["data"] = {
                "ship": state.get("loadout", {}).get("ship", ""),
                "system": sys.get("StarSystem", ""),
                "allegiance": sys.get("Allegiance", ""),
                "economy": sys.get("Economy", ""),
                "secondEconomy": sys.get("SecondEconomy", ""),
                "government": sys.get("Government", ""),
                "security": sys.get("Security", ""),
                "population": sys.get("Population", 0),
                "controllingFaction": loc.get("faction", ""),
                "controllingFactionState": loc.get("factionState", ""),
                "factions": loc.get("factions", []),
            }

        print(self._cache["context"])

    def _handle_scooping(self, status: dict, state: dict) -> None:
        fuel = status.get("Fuel", {})
        fuel_main = fuel.get("FuelMain", 0.0)
        fuel_capacity = state.get("loadout", {}).get("fuel_capacity") or 0.0

        now = time.time()

        if self._last_fuel_time == 0 or (now - self._last_fuel_time) > 30:
            self._last_fuel = fuel_main
            self._last_fuel_time = now
            rate = 0.0
            eta = None
        else:
            delta_fuel = fuel_main - self._last_fuel
            delta_time = now - self._last_fuel_time

            if delta_fuel <= 0:
                # No change — keep previous ETA
                rate = self._cache["data"].get("scoop_rate", 0.0)
                eta = self._cache["data"].get("eta_seconds")
            elif delta_time > 0:
                rate = delta_fuel / delta_time
                self._last_fuel = fuel_main
                self._last_fuel_time = now
                remaining = max(fuel_capacity - fuel_main, 0.0)
                eta = remaining / rate if rate > 0 else None
            else:
                rate = 0.0
                eta = None

        self._cache["context"] = "fuel_scooping"
        self._cache["data"] = {
            "fuel_main": fuel_main,
            "fuel_capacity": fuel_capacity,
            "scoop_rate": round(rate, 3),
            "eta_seconds": round(eta) if eta is not None else self._cache["data"].get("eta_seconds"),
        }

    def get_cache(self):
        return self._cache
