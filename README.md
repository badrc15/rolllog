# RollLog

RollLog is a Brazilian jiu-jitsu position map. Pick a position and a top- or bottom-player viewpoint, then follow a sweep, pass, escape, takedown, or submission branch into the next position. The path stays visible as breadcrumbs so you can backtrack and compare routes. Each branch includes a common upside and trade-off, plus a direct video or a technique-specific YouTube search. Position notes describe both players; submission endpoints switch to attacker/defender views. The map spans common standing, guard, passing, pin, escape, scramble, and submission states; BJJ has too many variations for any one map to be literally exhaustive.

## Public website

The public site is published with GitHub Pages: <https://badrc15.github.io/rolllog/>. GitHub Actions builds a static version from the Jinja template whenever `main` is updated. The same workflow is available to run manually from the repository's **Actions** tab.

GitHub Pages only serves static files; it cannot run the local FastAPI server. `scripts/build_static_site.py` renders `templates/index.html` with the position data and copies the browser assets into `_site/` for deployment.

To make a local static build:

```powershell
python -m pip install "jinja2>=3.1,<4.0"
python scripts/build_static_site.py
```

## Run locally

You need Python 3.10 or newer.

```powershell
cd path\to\RollLog
py -m venv .venv
\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open <http://127.0.0.1:8000>. On macOS or Linux, activate with `source .venv/bin/activate`. The local app has no account or user tracking. Curated position photos are loaded from Wikimedia Commons, so an internet connection is needed to display them. Every embedded image links to its file page and credit/license; positions without a selected photo include a focused Commons image search.

To run it in Docker:

```sh
docker build -t rolllog .
docker run --rm -p 127.0.0.1:8000:8000 rolllog
```

## Learn the code in small steps

1. **Map positions and transitions.** `position_map.json` contains position nodes and directed links. Each node has a `top` and `bottom` explanation. Each link has a `from`, a `to`, the player roles at either end, the connecting technique, and optional video or coaching note.
2. **Load the map in Python.** `load_position_map()` in `main.py` reads the JSON file. FastAPI loads it once on startup and passes it to the page.
3. **Render the starting page.** `templates/index.html` provides the layout. It places the data into `POSITION_MAP`, which lets the browser draw paths without a separate database or server call for each click.
4. **Follow a branch.** `static/app.js` filters the position index, shows incoming links and next links for the chosen viewpoint, and adds clicked destinations to the breadcrumb path.
5. **Add another move.** Add a position object if it is a new state, then add a link object with valid `from` and `to` IDs. Use a `from_role` and `to_role` of `top` or `bottom`. Add a video URL and a short coach/safety note when useful; missing video URLs get a YouTube search for the technique.

## Privacy, attribution, and training notes

The source repository and GitHub Pages website are public. The app does not collect user accounts or save a visitor's choices. Wikimedia Commons provides the photos, and YouTube provides linked technique searches or videos; those external services may receive normal browser requests when opened.

Embedded photos link back to their Commons source pages, where authors and licenses are listed. Video links lead to YouTube. External media and video availability can change. Rank labels are suggested study stages, not a universal syllabus. Technique notes are study prompts, not a substitute for instruction; practise with a qualified coach and release submissions immediately on a tap. Leg-entanglement entries are especially ruleset- and safety-dependent.

## Project files

```text
main.py                 FastAPI app and JSON loader
position_map.json       Position nodes and connecting technique links
templates/index.html    Position map and pathway interface
static/style.css        Responsive layout
static/app.js           Interactive map navigation
scripts/build_static_site.py  GitHub Pages static-site builder
.github/workflows/pages.yml   GitHub Pages deployment workflow
```
