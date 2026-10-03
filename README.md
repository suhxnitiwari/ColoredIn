# ColoredIn: Color Your Future

*A free coloring adventure that shows girls ages 3 to 9 the careers where women are still underrepresented, and lets them color themselves into one.*

**Live:** https://coloredin.onrender.com (free Render instance, so the first visit after a quiet spell can take about a minute to wake up)

## Why it exists

Kids start deciding what "people like me" become long before anyone asks them. ColoredIn introduces girls to 41 real careers, from astronaut and robot engineer to judge, CEO and firefighter, and every coloring page shows a diverse female character actively building, leading or creating. Each career comes with a kid-friendly job description she can hear read aloud, a fun fact, and a "You might love this if…" line that connects the job to something she already enjoys ("you love dinosaurs and digging in the sandbox").

## What it is

- **An adventure map, not a menu.** Careers are levels along a stream that flows through seven worlds, one per career group: Rainforest, Desert, Autumn Forest, Mountains, Blossom Garden, Snowy Tundra and Sunny Beach. Each world pours over a waterfall into the next.
- **Your own explorer.** Kids build a character (skin tone, hair style and color, outfit, glasses or a bow) who paddles in on a swan boat and walks the trail to each level. Finished pictures earn stars on the map.
- **A real coloring studio** with tap-to-fill, a crayon, zoom, undo and a gallery of saved artwork.
- **An admin dashboard** for managing careers, categories, drawings and user roles.

## How it's built

### The coloring engine (`client/src/coloring/`)

- **Leak-proof fill, computed in a Web Worker.** `regions.js` thresholds the line art by luminance, then morphologically closes the ink mask (a separable dilate, then erode) so small gaps in a drawing can't let paint leak. It labels every fillable region with an iterative flood fill on typed arrays, discards specks, and finally grows all regions outward with a multi-source BFS so ink and anti-aliased edge pixels belong to their nearest region. Fills tuck under the lines with no white halos. Results come back to the main thread as transferable buffers.
- **Ripple fill.** Region pixels are bucketed by distance from the tap and painted outward with an ease-out curve, so color spreads like a drop of paint.
- **Stay-in-the-lines crayon.** Brush strokes are drawn to a scratch canvas, clipped to the region where the stroke started, then stamped onto the paint layer (toggleable).
- **Two stacked canvases,** one for paint and one for line art converted to transparent ink, behind a small imperative API that React talks to.
- Pinch and wheel zoom with pan, a brush size that follows the zoom level, 40-step undo/redo that stores only the changed bounding box, keyboard shortcuts for grown-ups, and autosaved drafts per page in `localStorage`.

### The worlds (`client/src/worlds/`)

- **Two layouts from one data model.** Phones held upright get a top-to-bottom journey; iPads and desktops get a side-scrolling map built in parallax layers (sky, far hills, near hills, the stream and trail, a blurred foreground), each moving at its own speed. Mouse wheel and arrow keys scroll sideways, and the map remembers where the child left off.
- **Data-driven biomes.** Each world is a config object (sky gradient, water and cliff colors, scenery, critters, particles, ambience) rendered by hand-drawn SVG components, so a new world is a new entry, not a new page.

### Sound and voice (`client/src/lib/`)

- **Synthesized ambience with the Web Audio API.** A babbling brook made from brown noise sits under each world, with birds, wind or waves layered on top depending on where you are, plus a soft music-box melody. No audio files.
- **Celebration sounds:** a sparkle when a career opens and a five-note cheer when artwork is saved, all mutable.
- **Read-aloud** through an Express route that calls ElevenLabs text-to-speech, caches the MP3 in memory per page and serves it with a one-day cache header. Without an API key it returns 404 and the client falls back to the browser's built-in speech synthesis.

### The backend (`server/`)

- **Express 5 + Sequelize** with four models (users, career categories, coloring pages, saved artworks) and cascading deletes. PostgreSQL on Neon in production, a local SQLite file in development, chosen automatically from `DATABASE_URL`.
- **Google OAuth 2.0 with Passport**, sessions stored in the database, `httpOnly` and `sameSite` cookies, and role-based middleware: admins manage content, kids can only see and delete their own artwork.
- **helmet** with a tuned Content Security Policy, CORS, input validation on saved PNGs, and an idempotent seed that runs safely on every boot.
- **One deployable service:** in production Express serves the built React app from the same origin.

## Design choices

- **Representation in the details.** The palette is deliberately small but has dedicated rows of skin and hair tones, so every child can color a character who looks like her.
- **Privacy for kids.** The explorer avatar is stored only on the device, never on the server.
- **Made for pre-readers:** every career can be read aloud, tools are icon-labeled, and progress shows up as stars on the map instead of text.
- **Bunny Trails, merged in.** ColoredIn and Bunny Trails started as the same idea. The career matches, the music-box melody and the celebration sounds all came from that earlier game prototype.

## Tech stack

React 19 + Vite, React Router, Tailwind CSS v4, Axios, Canvas 2D, Web Workers, Web Audio API · Node.js, Express 5, Sequelize, Passport (Google OAuth 2.0), helmet, cors · PostgreSQL on Neon, SQLite for development · ElevenLabs · Render

## Run it locally

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev                          # API on :5001, web on :5173
```

With no `DATABASE_URL`, the API uses a local SQLite file (`server/dev.sqlite`) and seeds 7 career categories and 41 careers on boot. With no Google keys, the login page offers **Kid** and **Admin** dev logins (disabled in production).

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

One web service. Build: `npm run build`. Start: `npm start`. Env: `DATABASE_URL` (Neon or Render Postgres), `SESSION_SECRET`, `SERVER_URL` (optional on Render; defaults to `RENDER_EXTERNAL_URL`), `CLIENT_URL` (empty or the same URL), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, optional `ELEVENLABS_API_KEY`.

---

Built by [Suhani Tiwari](https://suhanitiwari.com).
