import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, one, run, newId } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'deb-tracker-dev-secret-2026';
const router = Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username y password son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
    }
    const existing = await one('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing) {
      return res.status(409).json({ error: 'Email o usuario ya registrado' });
    }
    const hash = await bcrypt.hash(password, 10);
    const id = newId();
    await run('INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)', [id, email, username, hash]);
    const token = jwt.sign({ userId: id, email, username }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id, email, username } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }
    const user = await one('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = await one('SELECT id, email, username, created_at FROM users WHERE id = $1', [payload.userId]);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;

// JWT middleware para rutas protegidas
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}
