"""Render RollLog's FastAPI/Jinja template as a GitHub Pages site."""

from __future__ import annotations

import json
from pathlib import Path
import shutil

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"


def main() -> None:
    position_map = json.loads((ROOT / "position_map.json").read_text(encoding="utf-8"))
    families = sorted({node["family"] for node in position_map["positions"]})
    environment = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=True,
    )
    rendered = environment.get_template("index.html").render(
        position_map=position_map,
        families=families,
    )

    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    (OUTPUT / "static").mkdir(parents=True)
    (OUTPUT / "index.html").write_text(rendered, encoding="utf-8")
    for asset in ("app.js", "style.css"):
        shutil.copy2(ROOT / "static" / asset, OUTPUT / "static" / asset)
    print(f"Built {len(position_map['positions'])} positions and {len(position_map['links'])} connections into {OUTPUT}")


if __name__ == "__main__":
    main()
