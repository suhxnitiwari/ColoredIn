import 'dotenv/config';
import { sequelize, Category, ColoringPage } from './models/index.js';
import { categories, pages } from './seedData.js';

// Inserts starter categories and pages. Skips anything that already exists, so
// it is safe to run on every boot. Pass --reset to rebuild the database.
export async function seed({ reset = false } = {}) {
  await sequelize.sync({ force: reset });
  for (const c of categories) await Category.findOrCreate({ where: { name: c.name }, defaults: c });
  const byName = Object.fromEntries((await Category.findAll()).map((c) => [c.name, c.id]));
  for (const { category, ...p } of pages) {
    await ColoringPage.findOrCreate({ where: { title: p.title }, defaults: { ...p, category_id: byName[category] } });
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await seed({ reset: process.argv.includes('--reset') });
  console.log('Seeded ColoredIn database.');
  await sequelize.close();
}
