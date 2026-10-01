# ColoredIn: Color Your Future

A free coloring app that introduces girls (ages 3–9) to real careers where women are underrepresented. Each page shows a diverse female character actively building or creating, with a kid-friendly job description kids can hear read aloud.

## Quick start

```bash
npm run install:all
cp server/.env.example server/.env   # already done locally
npm run dev                          # API on :5001, web on :5173
```

With no `DATABASE_URL`, the API uses a local SQLite file (`server/dev.sqlite`) and seeds 7 categories and 10 pages on boot. With no Google keys, the login page offers **Kid** and **Admin** dev logins (disabled in production).

## Bunny Trails, merged in

ColoredIn and Bunny Trails started as the same idea: help young girls discover careers through play. Bunny Trails was an early game prototype, and its best parts now live here:

- **"You might love this if…"** on every career card, linking each job to something kids already enjoy (`client/src/lib/careerMatch.js`).
- **A music-box melody** that wanders over the adventure map's nature sounds, built entirely with the Web Audio API (`client/src/lib/ambience.js`).
- **Celebration sounds:** a sparkle when a career opens and a five-note cheer when artwork is saved (`client/src/lib/sound.js`).

## The coloring engine (`client/src/coloring/`)

- **Leak-proof fill**: `regions.js` runs in a Web Worker. It morphologically closes small gaps in the line art, labels every fillable region, then assigns ink/anti-aliased pixels to the nearest region, so fills never leak and never leave white halos.
- **Stay-in-the-lines crayon**: brush strokes are clipped to the region where the stroke started (toggleable).
- Ripple fill animation, pinch/wheel zoom and pan, undo/redo (40 steps), a brush size that follows the zoom level, and autosaved drafts per page (localStorage).
- A small, deliberate palette with dedicated **skin** and **hair** tone rows.
- Soft synthesized sound effects (mutable) and read-aloud via ElevenLabs, falling back to browser speech.

## Stack

React + Vite, React Router, Tailwind v4, Axios · Node/Express 5, Sequelize, Passport (Google OAuth 2.0), helmet, cors · PostgreSQL on Neon · ElevenLabs · Render

## API

| Method | Route | Access |
|---|---|---|
| GET | `/auth/google`, `/auth/google/callback`, `/auth/logout` | public |
| GET | `/api/users/me` | public |
| GET / PUT | `/api/users`, `/api/users/:id` | admin |
| GET | `/api/categories`, `/api/categories/:id` | public |
| POST / PUT / DELETE | `/api/categories[/:id]` | admin |
| GET | `/api/pages`, `/api/pages/:id` | public |
| POST / PUT / DELETE | `/api/pages[/:id]` | admin |
| GET | `/api/pages/:id/speech` | public (ElevenLabs MP3) |
| GET / POST / DELETE | `/api/artworks[/:id]` | logged-in user (own artwork only) |

## Deploying to Render

One web service. Build: `npm run build`. Start: `npm start`. Env: `DATABASE_URL` (Neon), `SESSION_SECRET`, `SERVER_URL` (your Render URL), `CLIENT_URL` (empty or the same URL), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, optional `ELEVENLABS_API_KEY`.
