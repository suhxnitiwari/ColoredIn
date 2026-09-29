import { Router } from 'express';
import { Category, ColoringPage } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const fields = ['title', 'job_description', 'fun_fact', 'image_url', 'audio_url', 'category_id'];
const pick = (body) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f] === '' ? null : body[f]]));
const include = [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }];

router.get('/', async (req, res) => {
  const where = req.query.category ? { category_id: req.query.category } : {};
  res.json(await ColoringPage.findAll({ where, include, order: [['id', 'ASC']] }));
});

router.get('/:id', async (req, res) => {
  const page = await ColoringPage.findByPk(req.params.id, { include });
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  res.json(page);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const data = pick(req.body);
  if (!data.title || !data.job_description || !data.category_id) {
    return res.status(400).json({ error: 'Title, description and category are required.' });
  }
  const page = await ColoringPage.create({ ...data, created_by: req.user.id });
  res.status(201).json(await ColoringPage.findByPk(page.id, { include }));
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const page = await ColoringPage.findByPk(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  await page.update(pick(req.body));
  res.json(await ColoringPage.findByPk(page.id, { include }));
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const page = await ColoringPage.findByPk(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found.' });
  await page.destroy();
  res.status(204).end();
});

export default router;
