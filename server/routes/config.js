import { Router } from 'express';
import { getDb, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:key', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM user_config WHERE user_id = ? AND key = ?').get(req.user.userId, req.params.key);
    res.json({ key: req.params.key, value: row ? row.value : null });
  } catch (err) {
    console.error('GET config error:', err);
    res.status(500).json({ error: 'Error al leer config' });
  }
});

router.put('/:key', (req, res) => {
  try {
    const { value } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT id FROM user_config WHERE user_id = ? AND key = ?').get(req.user.userId, req.params.key);
    if (existing) {
      db.prepare('UPDATE user_config SET value = ? WHERE id = ?').run(String(value ?? ''), existing.id);
    } else {
      db.prepare('INSERT INTO user_config (id, user_id, key, value) VALUES (?, ?, ?, ?)')
        .run(newId(), req.user.userId, req.params.key, String(value ?? ''));
    }
    res.json({ key: req.params.key, value: String(value ?? '') });
  } catch (err) {
    console.error('PUT config error:', err);
    res.status(500).json({ error: 'Error al guardar config' });
  }
});

export default router;
