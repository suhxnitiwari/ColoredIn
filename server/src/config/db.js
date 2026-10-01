import { Sequelize } from 'sequelize';

// Neon/Postgres in production; a local SQLite file when DATABASE_URL is not set.
// Public hosts (Neon, Render's external URL) need SSL. Render's internal hostnames
// (e.g. "dpg-abc123-a") have no dots and talk over the private network without it.
const dbUrl = process.env.DATABASE_URL;
const useSsl = Boolean(dbUrl) && new URL(dbUrl).hostname.includes('.');

export const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    })
  : new Sequelize({ dialect: 'sqlite', storage: new URL('../../dev.sqlite', import.meta.url).pathname, logging: false });
