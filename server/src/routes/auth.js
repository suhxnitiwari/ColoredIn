import { Router } from 'express';
import passport, { googleEnabled } from '../config/passport.js';
import { User } from '../models/index.js';

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || '';

router.get('/google', (req, res, next) => {
  if (!googleEnabled) return res.redirect(`${CLIENT_URL}/login?error=google_not_configured`);
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login?error=failed` }),
  (_req, res) => res.redirect(`${CLIENT_URL}/`));

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect(`${CLIENT_URL}/`));
  });
});

// Local-development login so the app is usable before Google OAuth keys exist.
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev', async (req, res, next) => {
    const role = req.query.role === 'admin' ? 'admin' : 'child';
    const [user] = await User.findOrCreate({
      where: { google_id: `dev-${role}` },
      defaults: { email: `${role}@coloredin.dev`, name: role === 'admin' ? 'Dev Admin' : 'Dev Kid', role },
    });
    req.login(user, (err) => (err ? next(err) : res.redirect(`${CLIENT_URL}/`)));
  });
}

router.get('/providers', (_req, res) => {
  res.json({ google: googleEnabled, dev: process.env.NODE_ENV !== 'production' });
});

export default router;
