import { Router } from 'express';
import { getDb, newId } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM debts WHERE user_id = ? ORDER BY paid ASC, created_at ASC').all(req.user.userId);
    res.json(rows.map(r => ({ ...r, paid: !!r.paid })));
  } catch (err) {
    console.error('GET debts error:', err);
    res.status(500).json({ error: 'Error al leer deudas' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, emoji, initialBalance, minPayment, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const db = getDb();
    const id = newId();
    const amt = Number(initialBalance) || 0;
    db.prepare(`INSERT INTO debts (id, user_id, name, emoji, initial_balance, current_balance, min_payment, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.user.userId, name, emoji || '💳', amt, amt, Number(minPayment) || 0, color || '#6b7280');
    const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
    res.status(201).json({ ...row, paid: !!row.paid });
  } catch (err) {
    console.error('POST debt error:', err);
    res.status(500).json({ error: 'Error al crear deuda' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, emoji, currentBalance, minPayment, color, paid } = req.body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Deuda no encontrada' });
    db.prepare(`UPDATE debts SET name=?, emoji=?, current_balance=?, min_payment=?, color=?, paid=? WHERE id=?`)
      .run(
        name || existing.name,
        emoji !== undefined ? emoji : existing.emoji,
        currentBalance !== undefined ? Number(currentBalance) : existing.current_balance,
        minPayment !== undefined ? Number(minPayment) : existing.min_payment,
        color || existing.color,
        paid !== undefined ? (paid ? 1 : 0) : existing.paid,
        req.params.id
      );
    const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(req.params.id);
    res.json({ ...row, paid: !!row.paid });
  } catch (err) {
    console.error('PUT debt error:', err);
    res.status(500).json({ error: 'Error al actualizar deuda' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Deuda no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE debt error:', err);
    res.status(500).json({ error: 'Error al eliminar deuda' });
  }
});

export default router;
