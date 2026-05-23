import { Router } from 'express';
import { query, one, run, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { month, dateFrom, dateTo } = req.query;
    let sql = 'SELECT * FROM expenses WHERE user_id = $1';
    const params = [req.user.userId];
    if (month) {
      sql += ' AND date LIKE $2';
      params.push(month + '%');
    } else if (dateFrom && dateTo) {
      sql += ' AND date >= $2 AND date <= $3';
      params.push(dateFrom, dateTo);
    }
    sql += ' ORDER BY date DESC, created_at DESC';
    const rows = await query(sql, params);
    res.json(rows.map(r => ({ ...r, isRecurring: !!r.is_recurring })));
  } catch (err) {
    console.error('GET expenses error:', err);
    res.status(500).json({ error: 'Error al leer gastos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, category, description, date, isRecurring } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'amount, category y date son requeridos' });
    }
    const id = newId();
    await run(
      'INSERT INTO expenses (id, user_id, amount, category, description, date, is_recurring) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, req.user.userId, Number(amount), category, description || '', date, isRecurring ? 1 : 0]
    );
    const row = await one('SELECT * FROM expenses WHERE id = $1', [id]);
    res.status(201).json({ ...row, isRecurring: !!row.is_recurring });
  } catch (err) {
    console.error('POST expense error:', err);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { amount, category, description, date, isRecurring } = req.body;
    const existing = await one('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });

    const updates = [];
    const params = [];
    let idx = 1;
    if (amount !== undefined) { updates.push(`amount = $${idx++}`); params.push(Number(amount)); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); params.push(category); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
    if (date !== undefined) { updates.push(`date = $${idx++}`); params.push(date); }
    if (isRecurring !== undefined) { updates.push(`is_recurring = $${idx++}`); params.push(isRecurring ? 1 : 0); }
    params.push(req.params.id);
    await run(`UPDATE expenses SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    const row = await one('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ ...row, isRecurring: !!row.is_recurring });
  } catch (err) {
    console.error('PUT expense error:', err);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE expense error:', err);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

export default router;
