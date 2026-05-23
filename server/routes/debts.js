import { Router } from 'express';
import { query, one, run, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM debts WHERE user_id = $1 ORDER BY paid ASC, created_at ASC', [req.user.userId]);
    res.json(rows.map(r => ({ ...r, paid: !!r.paid })));
  } catch (err) {
    console.error('GET debts error:', err);
    res.status(500).json({ error: 'Error al leer deudas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, emoji, initialBalance, minPayment, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const id = newId();
    const amt = Number(initialBalance) || 0;
    await run(
      'INSERT INTO debts (id, user_id, name, emoji, initial_balance, current_balance, min_payment, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, req.user.userId, name, emoji || '💳', amt, amt, Number(minPayment) || 0, color || '#6b7280']
    );
    const row = await one('SELECT * FROM debts WHERE id = $1', [id]);
    res.status(201).json({ ...row, paid: !!row.paid });
  } catch (err) {
    console.error('POST debt error:', err);
    res.status(500).json({ error: 'Error al crear deuda' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, emoji, currentBalance, minPayment, color, paid } = req.body;
    const existing = await one('SELECT * FROM debts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (!existing) return res.status(404).json({ error: 'Deuda no encontrada' });
    await run(
      'UPDATE debts SET name=$1, emoji=$2, current_balance=$3, min_payment=$4, color=$5, paid=$6 WHERE id=$7',
      [
        name || existing.name,
        emoji !== undefined ? emoji : existing.emoji,
        currentBalance !== undefined ? Number(currentBalance) : existing.current_balance,
        minPayment !== undefined ? Number(minPayment) : existing.min_payment,
        color || existing.color,
        paid !== undefined ? (paid ? 1 : 0) : existing.paid,
        req.params.id
      ]
    );
    const row = await one('SELECT * FROM debts WHERE id = $1', [req.params.id]);
    res.json({ ...row, paid: !!row.paid });
  } catch (err) {
    console.error('PUT debt error:', err);
    res.status(500).json({ error: 'Error al actualizar deuda' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM debts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Deuda no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE debt error:', err);
    res.status(500).json({ error: 'Error al eliminar deuda' });
  }
});

export default router;
