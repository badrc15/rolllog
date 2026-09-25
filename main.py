"""RollLog: a local BJJ position map and technique-learning companion."""

from contextlib import asynccontextmanager
from pathlib import Path
import json

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def load_position_map():
    """Load the position nodes and connecting techniques from JSON."""
    return json.loads((BASE_DIR / "position_map.json").read_text(encoding="utf-8"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.position_map = load_position_map()
    yield


app = FastAPI(title="RollLog · BJJ position map", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/")
def home(request: Request):
    position_map = request.app.state.position_map
    return templates.TemplateResponse(request, "index.html", {
        "position_map": position_map,
        "families": sorted({node["family"] for node in position_map["positions"]}),
    })

