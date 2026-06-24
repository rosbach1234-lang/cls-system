const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.get('/profile', auth, (req, res) => {
  const user = db.prepare('SELECT id,email,first_name,last_name,role,company,department,experience_years,lang FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.get('/dashboard', auth, (req, res) => {
  const enrollments = db.prepare('SELECT e.*, p.title_en,p.title_de,p.code,p.total_modules,p.level FROM enrollments e JOIN programs p ON e.program_id = p.id WHERE e.user_id = ?').all(req.user.id);
  const certs = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE user_id = ?').get(req.user.id);
  const passed = db.prepare('SELECT COUNT(*) as c FROM module_progress WHERE user_id = ? AND passed = 1').get(req.user.id);
  const attempts = db.prepare('SELECT qa.*,m.title_en,m.title_de FROM quiz_attempts qa JOIN modules m ON qa.module_id=m.id WHERE qa.user_id=? ORDER BY qa.submitted_at DESC LIMIT 10').all(req.user.id);
  const enriched = enrollments.map(e => {
    const done = db.prepare('SELECT COUNT(*) as c FROM module_progress WHERE user_id=? AND module_id IN (SELECT id FROM modules WHERE program_id=?) AND passed=1').get(req.user.id, e.program_id).c;
    return { ...e, completed_modules: done, percent: Math.round((done/e.total_modules)*100) };
  });
  res.json({ enrollments: enriched, stats: { certificates: certs.c, passed_modules: passed.c, programs: enrollments.length }, recent_attempts: attempts });
});

router.get('/certificates', auth, (req, res) => {
  const certs = db.prepare('SELECT c.*,p.title_en,p.title_de,m.title_en as mod_en,m.title_de as mod_de FROM certificates c JOIN programs p ON c.program_id=p.id LEFT JOIN modules m ON c.module_id=m.id WHERE c.user_id=? ORDER BY c.issued_at DESC').all(req.user.id);
  res.json(certs);
});

router.get('/analytics', auth, (req, res) => {
  const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY submitted_at ASC').all(req.user.id);
  const topicMap = {};
  attempts.forEach(a => {
    JSON.parse(a.deficiencies||'[]').forEach(d => {
      if (!topicMap[d.topic]) topicMap[d.topic] = { scores: [] };
      topicMap[d.topic].scores.push(d.score);
    });
  });
  const deficiencies = Object.entries(topicMap).map(([topic, data]) => ({
    topic, avg_score: Math.round(data.scores.reduce((s,v)=>s+v,0)/data.scores.length),
    trend: data.scores.length > 1 ? (data.scores.at(-1) > data.scores[0] ? 'improving' : 'declining') : 'single'
  })).sort((a,b) => a.avg_score - b.avg_score);
  res.json({ deficiencies, total_attempts: attempts.length, score_history: attempts.map(a => ({ score: a.score, passed: a.passed, date: a.submitted_at })) });
});

module.exports = router;
