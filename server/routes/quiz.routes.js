const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');
const { v4: uuidv4 } = require('uuid');

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Randomize answer options, track new correct index server-side
function randomizeQuestion(q) {
  const optsEN = JSON.parse(q.options_en);
  const optsDE = JSON.parse(q.options_de);
  const indices = shuffle([...Array(optsEN.length).keys()]);
  return {
    ...q,
    options_en: indices.map(i => optsEN[i]),
    options_de: indices.map(i => optsDE[i]),
    _correct: indices.indexOf(q.correct_index),
    _map: indices,
  };
}

// GET questions — randomized, no correct answers sent to client
router.get('/questions/:moduleId/:quizType', auth, (req, res) => {
  const { moduleId, quizType } = req.params;
  const { section_id } = req.query;

  // Get previous attempt question IDs for smart pool rotation
  const prev = db.prepare('SELECT answers FROM quiz_attempts WHERE user_id = ? AND module_id = ? AND quiz_type = ? ORDER BY submitted_at DESC LIMIT 1').get(req.user.id, moduleId, quizType);
  const prevIds = prev ? Object.keys(JSON.parse(prev.answers)).map(Number) : [];

  // Fetch pool
  let pool;
  if (quizType === 'section' && section_id) {
    pool = db.prepare('SELECT * FROM questions WHERE module_id = ? AND section_id = ?').all(moduleId, section_id);
  } else {
    pool = db.prepare('SELECT * FROM questions WHERE module_id = ?').all(moduleId);
  }
  if (!pool.length) return res.status(404).json({ error: 'No questions found' });

  // Smart draw: prefer unseen questions
  const count = quizType === 'section' ? Math.min(3, pool.length) : Math.min(8, pool.length);
  let drawn;
  if (prevIds.length && pool.length > count) {
    const unseen = pool.filter(q => !prevIds.includes(q.id));
    const seen = shuffle(pool.filter(q => prevIds.includes(q.id)));
    if (unseen.length >= count) {
      drawn = shuffle(unseen).slice(0, count);
    } else {
      drawn = shuffle([...unseen, ...seen.slice(0, count - unseen.length)]);
    }
  } else {
    drawn = shuffle(pool).slice(0, count);
  }

  // Randomize answers
  const randomized = drawn.map(randomizeQuestion);

  // Store session (server-side scoring — client cannot cheat)
  const token = uuidv4();
  const sessionData = {
    qs: randomized.map(q => ({ id: q.id, correct: q._correct })),
    module_id: +moduleId, quiz_type: quizType, section_id: section_id || null,
    user_id: req.user.id, t: Date.now()
  };
  db.prepare('INSERT INTO quiz_sessions (token,user_id,module_id,session_data) VALUES (?,?,?,?)').run(token, req.user.id, moduleId, JSON.stringify(sessionData));

  // Send questions WITHOUT correct answers
  const safeQs = randomized.map(({ _correct, _map, correct_index, ...q }) => q);
  res.json({ questions: safeQs, session_token: token, count: safeQs.length });
});

// POST submit — server-side scoring
router.post('/submit', auth, (req, res) => {
  const { session_token, answers, time_taken } = req.body;

  const session = db.prepare('SELECT * FROM quiz_sessions WHERE token = ? AND user_id = ?').get(session_token, req.user.id);
  if (!session) return res.status(400).json({ error: 'Invalid session. Restart quiz.' });

  const sd = JSON.parse(session.session_data);
  if (Date.now() - sd.t > 30 * 60 * 1000) {
    db.prepare('DELETE FROM quiz_sessions WHERE token = ?').run(session_token);
    return res.status(400).json({ error: 'Session expired. Restart quiz.' });
  }

  const { module_id, quiz_type, section_id } = sd;

  // Check lockout
  const prog = db.prepare('SELECT * FROM module_progress WHERE user_id = ? AND module_id = ?').get(req.user.id, module_id);
  if (prog?.locked_until && new Date(prog.locked_until) > new Date()) {
    db.prepare('DELETE FROM quiz_sessions WHERE token = ?').run(session_token);
    return res.status(403).json({ error: 'Module locked', locked_until: prog.locked_until });
  }

  const module = db.prepare('SELECT m.*, p.max_attempts, p.lockout_days, p.pass_score FROM modules m JOIN programs p ON m.program_id = p.id WHERE m.id = ?').get(module_id);
  const maxAttempts = module?.max_attempts || 2;
  const lockoutDays = module?.lockout_days || 180;
  const passScore = module?.pass_score || 80;

  const attemptCount = db.prepare('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ? AND module_id = ? AND quiz_type = ?').get(req.user.id, module_id, quiz_type).c;

  if (attemptCount >= maxAttempts && quiz_type === 'final') {
    const lockDate = new Date();
    lockDate.setDate(lockDate.getDate() + lockoutDays);
    if (!prog) db.prepare('INSERT INTO module_progress (user_id,module_id) VALUES (?,?)').run(req.user.id, module_id);
    db.prepare('UPDATE module_progress SET locked_until = ? WHERE user_id = ? AND module_id = ?').run(lockDate.toISOString(), req.user.id, module_id);
    db.prepare('DELETE FROM quiz_sessions WHERE token = ?').run(session_token);
    return res.status(403).json({ error: 'Maximum attempts reached', locked_until: lockDate.toISOString() });
  }

  // Score using server-side correct indices
  let correct = 0;
  const defMap = {};
  const results = sd.qs.map(sq => {
    const userAns = answers[sq.id];
    const isCorrect = userAns === sq.correct;
    if (isCorrect) correct++;
    const origQ = db.prepare('SELECT topic FROM questions WHERE id = ?').get(sq.id);
    const topic = origQ?.topic || 'General';
    if (!defMap[topic]) defMap[topic] = { c: 0, t: 0 };
    defMap[topic].t++;
    if (isCorrect) defMap[topic].c++;
    return { question_id: sq.id, correct: isCorrect, correct_index: sq.correct, user_answer: userAns };
  });

  const score = Math.round((correct / sd.qs.length) * 100);
  const passed = score >= passScore;

  const deficiencies = Object.entries(defMap).map(([topic, d]) => ({
    topic, score: Math.round((d.c / d.t) * 100), total: d.t,
    assessment: d.c/d.t >= 0.8 ? 'good' : d.c/d.t >= 0.6 ? 'review' : 'critical'
  })).filter(d => d.score < 100).sort((a, b) => a.score - b.score);

  // Save attempt
  const attemptNum = attemptCount + 1;
  db.prepare('INSERT INTO quiz_attempts (user_id,module_id,quiz_type,section_id,attempt_number,answers,score,passed,time_taken,deficiencies) VALUES (?,?,?,?,?,?,?,?,?,?)').run(req.user.id, module_id, quiz_type, section_id, attemptNum, JSON.stringify(answers), score, passed ? 1 : 0, time_taken || 0, JSON.stringify(deficiencies));

  // Update progress
  if (!prog) db.prepare('INSERT INTO module_progress (user_id,module_id) VALUES (?,?)').run(req.user.id, module_id);
  const newBest = Math.max(prog?.best_score || 0, score);
  let locked_until = null;
  if (!passed && attemptNum >= maxAttempts && quiz_type === 'final') {
    const d = new Date(); d.setDate(d.getDate() + lockoutDays);
    locked_until = d.toISOString();
  }
  if (passed && quiz_type === 'final') {
    db.prepare('UPDATE module_progress SET passed=1,best_score=?,attempts=?,completed_at=CURRENT_TIMESTAMP,locked_until=NULL WHERE user_id=? AND module_id=?').run(newBest, attemptNum, req.user.id, module_id);
  } else {
    db.prepare('UPDATE module_progress SET best_score=?,attempts=?,locked_until=? WHERE user_id=? AND module_id=?').run(newBest, attemptNum, locked_until, req.user.id, module_id);
  }

  // Certificate
  let cert_code = null;
  if (passed && quiz_type === 'final') {
    cert_code = `CLS-${String(module_id).padStart(3,'0')}-U${req.user.id}-${Date.now().toString(36).toUpperCase()}`;
    const valid = new Date(); valid.setFullYear(valid.getFullYear() + 2);
    db.prepare('INSERT OR IGNORE INTO certificates (user_id,program_id,module_id,cert_code,score,valid_until) VALUES (?,?,?,?,?,?)').run(req.user.id, module?.program_id, module_id, cert_code, score, valid.toISOString());
  }

  db.prepare('DELETE FROM quiz_sessions WHERE token = ?').run(session_token);
  res.json({ score, passed, attempt_number: attemptNum, attempts_remaining: Math.max(0, maxAttempts - attemptNum), locked_until, deficiencies, question_results: results, cert_code });
});

router.get('/history/:moduleId', auth, (req, res) => {
  const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? AND module_id = ? ORDER BY submitted_at DESC').all(req.user.id, req.params.moduleId);
  res.json(attempts.map(a => ({ ...a, deficiencies: JSON.parse(a.deficiencies) })));
});

module.exports = router;
