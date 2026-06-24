// CLS CBT Platform Server
// © 2025 CLS — Clear Leadership Systems. All rights reserved.
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // Initialize DB

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', '*'] }));
app.use(express.json());

// Copyright header on all responses
app.use((req, res, next) => {
  res.setHeader('X-CLS-Copyright', '© 2025 CLS Clear Leadership Systems. All rights reserved.');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// API Routes
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/user',     require('./routes/user.routes'));
app.use('/api/programs', require('./routes/program.routes'));
app.use('/api/quiz',     require('./routes/quiz.routes'));

// Serve static website files
app.use(express.static(path.join(__dirname, '../website')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../website/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✈  CLS CBT Server running`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api`);
  console.log(`\n   © 2025 CLS — Clear Leadership Systems\n`);
});
