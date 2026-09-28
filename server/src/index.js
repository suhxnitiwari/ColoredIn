import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sequelize } from './models/index.js';
import passport from './config/passport.js';
import { seed } from './seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import pageRoutes from './routes/pages.js';
import artworkRoutes from './routes/artworks.js';
import speechRoutes from './routes/speech.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';
// In development the API always sits on 5001 (Vite proxies to it); hosts like Render set PORT in production.
const PORT = (isProd ? process.env.PORT : process.env.API_PORT) || 5001;
const SequelizeStore = SequelizeStoreInit(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'blob:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    },
  },
}));
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '8mb' })); // artwork PNGs arrive as data URLs
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 24 * 30 },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api', speechRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// In production the built React app is served from the same origin.
if (isProd) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.name?.startsWith('Sequelize') ? 400 : 500).json({ error: err.errors?.[0]?.message || 'Something went wrong.' });
});

await seed();
await sessionStore.sync();
app.listen(PORT, () => console.log(`ColoredIn API on http://localhost:${PORT}`));
