import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';

const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findByPk(id));
  } catch (err) {
    done(err);
  }
});

if (googleEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5001'}/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const [user] = await User.findOrCreate({
        where: { google_id: profile.id },
        defaults: { email, name: profile.displayName, avatar_url: profile.photos?.[0]?.value },
      });
      if (email && adminEmails.includes(email) && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

export default passport;
