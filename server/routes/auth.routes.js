const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign } = require('../auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password_hash: _, ...safe } = user;
  res.json({ token: sign({ id: user.id, email: user.email, role: user.role }), user: safe });
});

router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, role, company, department, experience_years } = req.body;
  if (!email || !password || !first_name || !company) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const blockedDomains = ['gmail','yahoo','hotmail','outlook','web.de','gmx'];
  const domain = email.split('@')[1]?.split('.')[0] || '';
  if (blockedDomains.includes(domain)) {
    return res.status(400).json({ error: 'Please use your company email address' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  try {
    const result = db.prepare('INSERT INTO users (email,password_hash,first_name,last_name,role,company,department,experience_years) VALUES (?,?,?,?,?,?,?,?)').run(email, bcrypt.hashSync(password,12), first_name, last_name, role, company, department||null, experience_years||0);
    const user = db.prepare('SELECT id,email,first_name,last_name,role,company FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ token: sign({ id: user.id, email: user.email, role: user.role }), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
