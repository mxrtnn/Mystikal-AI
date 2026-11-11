const express = require('express');
const crypto = require('node:crypto');
const AVATARS = ['sparkles', 'moon', 'bot', 'palette', 'rocket', 'ghost'];
const COOKIE = 'mystikal_web_session';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function equal(a, b) {
  const left = Buffer.from(String(a ?? '')), right = Buffer.from(String(b ?? ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
module.exports = function accounts(db) {
  const router = express.Router();
  let ready;
  const initialize = () => ready ??= (async () => {
    await db.query('CREATE TABLE IF NOT EXISTS mystikal_web_sessions (token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(100) NOT NULL, expires_at BIGINT NOT NULL)');
    await db.query("CREATE TABLE IF NOT EXISTS mystikal_profiles (user_id VARCHAR(100) PRIMARY KEY, avatar VARCHAR(24) NOT NULL DEFAULT 'sparkles')");
  })().catch(error => { ready = undefined; throw error; });
  const wrap = handler => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const allowed = ['https://mystikal-ai.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173', ...(process.env.ACCOUNT_ORIGINS || '').split(',')];
      if (req.method === 'POST' && req.headers.origin && !allowed.includes(req.headers.origin)) return res.status(403).json({error: 'Origen no permitido.'});
      await initialize(); await handler(req, res);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'Ese correo ya está registrado.'});
      res.status(503).json({error: 'El servicio de cuentas no está disponible. Inténtalo de nuevo.'});
    }
  };
  const token = req => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
  const cookieOptions = {httpOnly: true, secure: process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER), sameSite: 'lax', path: '/'};
  const userView = row => ({id: row.id, name: row.name, email: row.email, avatar: row.avatar || 'sparkles'});
  async function authenticated(req, res) {
    const [rows] = await db.query('SELECT u.*, p.avatar FROM mystikal_web_sessions s JOIN users u ON CAST(u.id AS CHAR)=s.user_id LEFT JOIN mystikal_profiles p ON p.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', [hash(token(req)), Date.now()]);
    if (!rows.length) { res.status(401).json({error: 'Inicia sesión de nuevo para editar tu cuenta.'}); return null; }
    return rows[0];
  }
  router.post('/api/login', wrap(async (req, res) => {
    const {email, password, remember} = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 1000) return res.status(400).json({error: 'Introduce correo y contraseña.'});
    const [rows] = await db.query('SELECT u.*, p.avatar FROM users u LEFT JOIN mystikal_profiles p ON p.user_id=CAST(u.id AS CHAR) WHERE u.email=?', [email.trim()]);
    if (!rows.length || !equal(rows[0].password, password)) return res.status(401).json({error: 'Usuario o contraseña incorrectos.'});
    const value = crypto.randomBytes(32).toString('hex'), ttl = (remember ? 30 : 1) * 86400000;
    await db.query('DELETE FROM mystikal_web_sessions WHERE expires_at<? OR token_hash=?', [Date.now(), hash(token(req))]);
    await db.query('INSERT INTO mystikal_web_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)', [hash(value), String(rows[0].id), Date.now() + ttl]);
    res.cookie(COOKIE, value, {...cookieOptions, ...(remember ? {maxAge: ttl} : {})});
    res.json({user: userView(rows[0])});
  }));
  router.get('/api/account', wrap(async (req, res) => { const user = await authenticated(req, res); if (user) res.json({user: userView(user)}); }));
  router.post('/api/account', wrap(async (req, res) => {
    const user = await authenticated(req, res); if (!user) return;
    const {name, email, avatar, current_password} = req.body;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof email !== 'string' || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !AVATARS.includes(avatar)) return res.status(422).json({error: 'Revisa nombre, correo y avatar.'});
    if (!equal(user.password, current_password)) return res.status(401).json({error: 'La contraseña actual es incorrecta.'});
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [duplicate] = await connection.query('SELECT id FROM users WHERE email=? AND id<>? FOR UPDATE', [email.trim(), user.id]);
      if (duplicate.length) { await connection.rollback(); return res.status(409).json({error: 'Ese correo ya está registrado.'}); }
      await connection.query('UPDATE users SET name=?,email=? WHERE id=?', [name.trim(), email.trim(), user.id]);
      await connection.query('INSERT INTO mystikal_profiles(user_id,avatar) VALUES (?,?) ON DUPLICATE KEY UPDATE avatar=VALUES(avatar)', [String(user.id), avatar]);
      if (email.trim() !== user.email) await connection.query('DELETE FROM mystikal_web_sessions WHERE user_id=? AND token_hash<>?', [String(user.id), hash(token(req))]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    res.json({user: {id: user.id, name: name.trim(), email: email.trim(), avatar}});
  }));
  router.post('/api/account/logout', wrap(async (req, res) => {
    await db.query('DELETE FROM mystikal_web_sessions WHERE token_hash=?', [hash(token(req))]);
    res.clearCookie(COOKIE, cookieOptions); res.json({ok: true});
  }));
  return router;
};
