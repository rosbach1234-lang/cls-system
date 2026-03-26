const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.get('/', auth, (req, res) => {
  const programs = db.prepare('SELECT * FROM programs').all();
  const enriched = programs.map(p => {
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND program_id = ?').get(req.user.id, p.id);
    return { ...p, target_roles: JSON.parse(p.target_roles), enrolled: !!enrollment };
  });
  res.json(enriched);
});

router.get('/:code', auth, (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE code = ?').get(req.params.code);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  const modules = db.prepare('SELECT * FROM modules WHERE program_id = ? ORDER BY module_number').all(program.id);
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND program_id = ?').get(req.user.id, program.id);
  const progress = db.prepare('SELECT * FROM module_progress WHERE user_id = ? AND module_id IN (SELECT id FROM modules WHERE program_id = ?)').all(req.user.id, program.id);
  const progressMap = {};
  progress.forEach(p => { progressMap[p.module_id] = p; });
  const modulesWithProgress = modules.map((m, i) => ({
    ...m,
    sections: m.sections ? JSON.parse(m.sections) : [],
    progress: progressMap[m.id] || null,
    is_unlocked: i === 0 || (progressMap[modules[i-1]?.id]?.passed),
    is_completed: progressMap[m.id]?.passed || false,
  }));
  res.json({ ...program, target_roles: JSON.parse(program.target_roles), modules: modulesWithProgress, enrolled: !!enrollment });
});

router.post('/:code/enroll', auth, (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE code = ?').get(req.params.code);
  if (!program) return res.status(404).json({ error: 'Not found' });
  db.prepare('INSERT OR IGNORE INTO enrollments (user_id, program_id) VALUES (?, ?)').run(req.user.id, program.id);
  res.json({ message: 'Enrolled' });
});

module.exports = router;
