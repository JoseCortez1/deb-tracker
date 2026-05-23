import { Router } from 'express';
import { query, one, run, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:key', async (req, res) => {
  try {
    const row = await one('SELECT value FROM user_config WHERE user_id = $1 AND key = $2', [req.user.userId, req.params.key]);
    res.json({ key: req.params.key, value: row ? row.value : null });
  } catch (err) {
    console.error('GET config error:', err);
    res.status(500).json({ error: 'Error al leer config' });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const existing = await one('SELECT id FROM user_config WHERE user_id = $1 AND key = $2', [req.user.userId, req.params.key]);
    if (existing) {
      await run('UPDATE user_config SET value = $1 WHERE id = $2', [String(value ?? ''), existing.id]);
    } else {
      await run('INSERT INTO user_config (id, user_id, key, value) VALUES ($1, $2, $3, $4)',
        [newId(), req.user.userId, req.params.key, String(value ?? '')]);
    }
    res.json({ key: req.params.key, value: String(value ?? '') });
  } catch (err) {
    console.error('PUT config error:', err);
    res.status(500).json({ error: 'Error al guardar config' });
  }
});

export default router;
