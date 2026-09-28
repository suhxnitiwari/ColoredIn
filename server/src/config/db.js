import { Sequelize } from 'sequelize';

// Neon/Postgres in production; a local SQLite file when DATABASE_URL is not set.
export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize({ dialect: 'sqlite', storage: new URL('../../dev.sqlite', import.meta.url).pathname, logging: false });
