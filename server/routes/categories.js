import { Router } from 'express';
import { query, one, run, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM custom_categories WHERE user_id = $1 ORDER BY created_at ASC', [req.user.userId]);
    res.json(rows);
  } catch (err) {
    console.error('GET categories error:', err);
    res.status(500).json({ error: 'Error al leer categorías' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const id = newId();
    await run('INSERT INTO custom_categories (id, user_id, name, icon, color) VALUES ($1, $2, $3, $4, $5)',
      [id, req.user.userId, name, icon || '📌', color || '#6b7280']);
    const row = await one('SELECT * FROM custom_categories WHERE id = $1', [id]);
    res.status(201).json(row);
  } catch (err) {
    console.error('POST category error:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM custom_categories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE category error:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
