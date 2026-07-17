import json
from pathlib import Path

from fastapi import FastAPI, Request

from services import navroute_service, status_service, journal_service

app = FastAPI()

DUMMY_NAVROUTE = "dummy/navroute.json"
DUMMY_STATUS = "dummy/status.json"
DUMMY_JOURNAL = "dummy/journal.log"

@app.get("/")
def index():
    with open(DUMMY_STATUS) as f:
        status = json.load(f)
    with open(DUMMY_NAVROUTE) as f:
        navroute = json.load(f)

    events = []
    with open(DUMMY_JOURNAL) as f:
        for line in f:
            events.append(json.loads(line))

    return {
        "status": status_service.handle(status),
        "navroute": navroute_service.handle(navroute),
        "events": journal_service.handle(events)
    }

@app.post("/keypress")
def keypress(request: Request):
    return {"message": "Keypress"}
