import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth.js';
import expensesRouter from './routes/expenses.js';
import debtsRouter from './routes/debts.js';
import categoriesRouter from './routes/categories.js';
import configRouter from './routes/config.js';
import { getDb } from './db.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3103;

app.use(cors());
app.use(express.json());

// Inicializa DB
getDb();

// API routes
app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/config', configRouter);

// Serve SPA
const distPath = path.join(dir, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ruta no encontrada' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Debt Tracker API running on port ${PORT}`);
});
