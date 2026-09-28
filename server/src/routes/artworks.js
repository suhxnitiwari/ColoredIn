import { Router } from 'express';
import { ColoringPage, SavedArtwork } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const include = [{ model: ColoringPage, as: 'page', attributes: ['id', 'title', 'image_url'] }];

router.get('/', async (req, res) => {
  res.json(await SavedArtwork.findAll({ where: { user_id: req.user.id }, include, order: [['saved_at', 'DESC']] }));
});

router.get('/:id', async (req, res) => {
  const artwork = await SavedArtwork.findOne({ where: { id: req.params.id, user_id: req.user.id }, include });
  if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });
  res.json(artwork);
});

router.post('/', async (req, res) => {
  const { page_id, colored_image_data } = req.body;
  if (!page_id || !colored_image_data?.startsWith('data:image/png;base64,')) {
    return res.status(400).json({ error: 'page_id and a PNG image are required.' });
  }
  if (!(await ColoringPage.findByPk(page_id))) return res.status(404).json({ error: 'Page not found.' });
  const artwork = await SavedArtwork.create({ page_id, colored_image_data, user_id: req.user.id });
  res.status(201).json(artwork);
});

router.delete('/:id', async (req, res) => {
  const deleted = await SavedArtwork.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  if (!deleted) return res.status(404).json({ error: 'Artwork not found.' });
  res.status(204).end();
});

export default router;
