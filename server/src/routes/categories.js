import { Router } from 'express';
import { Category, ColoringPage } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const fields = ['name', 'description', 'color', 'icon', 'sort_order'];
const pick = (body) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

router.get('/', async (_req, res) => {
  res.json(await Category.findAll({ order: [['sort_order', 'ASC'], ['name', 'ASC']] }));
});

router.get('/:id', async (req, res) => {
  const category = await Category.findByPk(req.params.id, { include: [{ model: ColoringPage, as: 'pages' }] });
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  res.json(category);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  res.status(201).json(await Category.create(pick(req.body)));
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  res.json(await category.update(pick(req.body)));
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  const count = await ColoringPage.count({ where: { category_id: category.id } });
  if (count) return res.status(409).json({ error: `Move or delete its ${count} page(s) first.` });
  await category.destroy();
  res.status(204).end();
});

export default router;
