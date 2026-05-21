import { Router } from 'express';
import { getDb, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { month, dateFrom, dateTo } = req.query;
    let sql = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [req.user.userId];
    if (month) {
      sql += ' AND date LIKE ?';
      params.push(month + '%');
    } else if (dateFrom && dateTo) {
      sql += ' AND date >= ? AND date <= ?';
      params.push(dateFrom, dateTo);
    }
    sql += ' ORDER BY date DESC, created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows.map(r => ({ ...r, isRecurring: !!r.is_recurring })));
  } catch (err) {
    console.error('GET expenses error:', err);
    res.status(500).json({ error: 'Error al leer gastos' });
  }
});

router.post('/', (req, res) => {
  try {
    const { amount, category, description, date, isRecurring } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'amount, category y date son requeridos' });
    }
    const db = getDb();
    const id = newId();
    db.prepare(`INSERT INTO expenses (id, user_id, amount, category, description, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.user.userId, Number(amount), category, description || '', date, isRecurring ? 1 : 0);
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.status(201).json({ ...row, isRecurring: !!row.is_recurring });
  } catch (err) {
    console.error('POST expense error:', err);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { amount, category, description, date, isRecurring } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });
    db.prepare(`UPDATE expenses SET amount=?, category=?, description=?, date=?, is_recurring=? WHERE id=?`)
      .run(
        amount !== undefined ? Number(amount) : existing.amount,
        category || existing.category,
        description !== undefined ? description : existing.description,
        date || existing.date,
        isRecurring !== undefined ? (isRecurring ? 1 : 0) : existing.is_recurring,
        req.params.id
      );
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json({ ...row, isRecurring: !!row.is_recurring });
  } catch (err) {
    console.error('PUT expense error:', err);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE expense error:', err);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

export default router;
