import { Router } from 'express';
import { getDb, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM custom_categories WHERE user_id = ? ORDER BY created_at ASC').all(req.user.userId);
    res.json(rows);
  } catch (err) {
    console.error('GET categories error:', err);
    res.status(500).json({ error: 'Error al leer categorías' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const db = getDb();
    const id = newId();
    db.prepare('INSERT INTO custom_categories (id, user_id, name, icon, color) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.userId, name, icon || '📌', color || '#6b7280');
    const row = db.prepare('SELECT * FROM custom_categories WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (err) {
    console.error('POST category error:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM custom_categories WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE category error:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
