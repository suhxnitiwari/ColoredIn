import { Router } from 'express';
import { User } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/me', (req, res) => res.json(req.user ?? null));

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await User.findAll({ order: [['createdAt', 'ASC']] }));
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['child', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be "child" or "admin".' });
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.id === req.user.id && role !== 'admin') return res.status(400).json({ error: "You can't remove your own admin role." });
  user.role = role;
  await user.save();
  res.json(user);
});

export default router;
