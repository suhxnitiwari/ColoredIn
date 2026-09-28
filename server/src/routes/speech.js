import { Router } from 'express';
import { ColoringPage } from '../models/index.js';

// Read-aloud via ElevenLabs. Returns 404 when no API key is configured so the
// client can fall back to the browser's built-in speech synthesis.
const router = Router();
const cache = new Map();
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

router.get('/pages/:id/speech', async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) return res.status(404).json({ error: 'Speech not configured.' });
  const page = await ColoringPage.findByPk(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found.' });

  const text = `${page.title}. ${page.job_description}`;
  const key = `${page.id}:${text}`;
  if (!cache.has(key)) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.75 } }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Speech service failed.' });
    cache.set(key, Buffer.from(await r.arrayBuffer()));
  }
  res.set('Content-Type', 'audio/mpeg').set('Cache-Control', 'public, max-age=86400').send(cache.get(key));
});

export default router;
