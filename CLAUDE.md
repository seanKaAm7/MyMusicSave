# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

This is a fully static site — no build step, no dependencies to install.

```bash
# Open directly in browser, or serve locally:
python -m http.server 8000
# Then visit http://localhost:8000
```

## Architecture

Single-page-per-route static app using URL query parameters for routing. No framework, no bundler — pure HTML/CSS/Vanilla JS.

**Routing:** On each page load, `app.js` detects the current page via `location.pathname` and calls the matching `init*()` function. Query parameters (e.g., `?id=flower-boy`, `?genre=hip-hop`) determine what data to render.

```
data.js  →  app.js  →  HTML template files
(data)      (logic)     (containers only)
```

**Page files are containers only** — they define a wrapper element and load scripts. All content is injected via `innerHTML` in `app.js`.

**Pages and their init functions:**

| File | Init function | Query param |
|------|--------------|-------------|
| index.html | `initIndex()` | — |
| genre.html | `initGenre()` | `?genre=<id>` |
| year.html | `initYear()` | `?year=<year>` |
| artist.html | `initArtist()` | `?id=<id>` |
| album.html | `initAlbum()` | `?id=<id>` |

## Data

All data lives in `data.js` as three global arrays: `GENRES`, `ALBUMS`, `ARTISTS`.

- **ALBUMS** has the richest schema: `id`, `genre`, `title`, `artist`, `year`, `coverImage` (local path), `coverGradient`, `accentColor`, `tracks[]`, `credits{}`, `concept` (Korean text), `era` (Korean text)
- **ARTISTS**: `id`, `name`, `photo` (local path), `origin`, `activeFrom`, `genres[]`, `accentColor`, `bio` (Korean text)
- **GENRES**: `id`, `name`, `color`, `bg` (CSS gradient string)

Images are in `img/` (album covers as `cover_*.png`) and `img/artist/` (artist photos).

## Key Conventions

- **Language:** All user-facing content (concept, era, bio), documentation files, and comments in data.js are written in **Korean**.
- **Logging:** All development activity is appended to `user_log.js` in Korean, no emojis. Never edit existing entries — append only.
- **Versioning:** `PATCH_NOTES.js` tracks versions. Update it when releasing notable changes.
- **IDs:** Album/artist IDs are kebab-case slugs (e.g., `flower-boy`, `tyler-the-creator`). `artistNameToId()` in app.js converts names to IDs.
- **Navigation:** Use the `navigate()`, `albumUrl()`, `genreUrl()`, `yearUrl()`, `artistUrl()` helpers in app.js — never construct URLs manually.

## Planned but Not Yet Implemented

`archive_spotify_expansion_plan.md` describes a Spotify API integration to auto-enrich album data via a serverless `api/spotify.js` bridge. This is in spec phase only — the current codebase is purely local/static.
