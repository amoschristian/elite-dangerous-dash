import json
from pathlib import Path

FLAG_NAMES = {
    0: "is_docked",
    1: "is_landed",
    2: "is_landing_gear_down",
    3: "is_shields_up",
    4: "is_supercruise",
    5: "is_flight_assist_off",
    6: "is_hardpoints_deployed",
    7: "is_in_wing",
    8: "is_lights_on",
    9: "is_cargo_scoop_deployed",
    10: "is_silent_running",
    11: "is_scooping_fuel",
    12: "is_srv_handbrake_on",
    13: "is_srv_turret_deployed",
    14: "is_srv_under_ship",
    15: "is_srv_drive_assist_on",
    16: "is_fsd_mass_locked",
    17: "is_fsd_charging",
    18: "is_fsd_cooldown",
    19: "is_low_fuel",
    20: "is_overheating",
    21: "has_lat_long",
    22: "is_in_danger",
    23: "is_being_interdicted",
    24: "is_in_main_ship",
    25: "is_in_fighter",
    26: "is_in_srv",
    27: "is_analysis_mode",
    28: "is_night_vision_on",
    29: "is_altitude_from_average_radius",
    30: "is_fsd_jumping",
    31: "is_srv_high_beam_on",
}

def handle(status):
    flags = status.get("Flags", 0)

    if not flags:
        return []

    status["flags"] = decode_flags(flags)
    return status

def decode_flags(flags):
    return {
        name: bool(flags & (1 << bit))
        for bit, name in FLAG_NAMES.items()
    }