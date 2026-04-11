// CLS Database - © 2025 CLS Clear Leadership Systems
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'cls.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    department TEXT,
    experience_years INTEGER DEFAULT 0,
    lang TEXT DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    description_en TEXT,
    description_de TEXT,
    target_roles TEXT NOT NULL,
    level TEXT NOT NULL,
    total_modules INTEGER NOT NULL,
    pass_score INTEGER DEFAULT 80,
    max_attempts INTEGER DEFAULT 2,
    lockout_days INTEGER DEFAULT 180
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER REFERENCES programs(id),
    module_number INTEGER NOT NULL,
    title_en TEXT NOT NULL,
    title_de TEXT NOT NULL,
    content_en TEXT,
    content_de TEXT,
    sections TEXT,
    estimated_minutes INTEGER DEFAULT 35
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER REFERENCES modules(id),
    section_id TEXT,
    quiz_type TEXT NOT NULL,
    topic TEXT NOT NULL,
    question_en TEXT NOT NULL,
    question_de TEXT NOT NULL,
    options_en TEXT NOT NULL,
    options_de TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation_en TEXT NOT NULL,
    explanation_de TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium'
  );

  CREATE TABLE IF NOT EXISTS quiz_sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER,
    module_id INTEGER,
    session_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    program_id INTEGER REFERENCES programs(id),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    UNIQUE(user_id, program_id)
  );

  CREATE TABLE IF NOT EXISTS module_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    module_id INTEGER REFERENCES modules(id),
    attempts INTEGER DEFAULT 0,
    best_score REAL DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    locked_until DATETIME,
    completed_at DATETIME,
    UNIQUE(user_id, module_id)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    module_id INTEGER REFERENCES modules(id),
    quiz_type TEXT NOT NULL,
    section_id TEXT,
    attempt_number INTEGER NOT NULL,
    answers TEXT NOT NULL,
    score REAL NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deficiencies TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    program_id INTEGER REFERENCES programs(id),
    module_id INTEGER REFERENCES modules(id),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cert_code TEXT UNIQUE NOT NULL,
    score REAL NOT NULL,
    valid_until DATETIME
  );
`);

// Cleanup expired sessions
db.prepare("DELETE FROM quiz_sessions WHERE datetime(created_at,'+2 hours') < datetime('now')").run();

// SEED DEMO USERS
const seedUsers = () => {
  if (db.prepare('SELECT COUNT(*) as c FROM users').get().c > 0) return;
  const users = [
    { email:'supervisor@fraport.de', pw:'demo123', first:'Thomas', last:'Weber', role:'supervisor', company:'Fraport Ground Services', department:'Ramp Operations', exp:7 },
    { email:'ceo@menzies.com', pw:'demo123', first:'Sarah', last:'Mitchell', role:'ceo', company:'Menzies Aviation', department:'Executive', exp:20 },
    { email:'trainer@swissport.com', pw:'demo123', first:'Klaus', last:'Schneider', role:'trainer', company:'Swissport', department:'Training', exp:12 },
    { email:'hr@handling.at', pw:'demo123', first:'Anna', last:'Bauer', role:'hr_manager', company:'Vienna Airport Handling', department:'HR', exp:9 },
  ];
  const ins = db.prepare('INSERT INTO users (email,password_hash,first_name,last_name,role,company,department,experience_years) VALUES (?,?,?,?,?,?,?,?)');
  users.forEach(u => ins.run(u.email, bcrypt.hashSync(u.pw,10), u.first, u.last, u.role, u.company, u.department, u.exp));
  console.log('✓ Demo users created');
};

// SEED PROGRAMS (all 14)
const seedPrograms = () => {
  if (db.prepare('SELECT COUNT(*) as c FROM programs').get().c > 0) return;
  const progs = [
    {code:'CBT-RA',level:'operational',total_modules:8,title_en:'Ramp Agent Core Training',title_de:'Ramp Agent Grundausbildung',description_en:'Complete foundational training for ramp agents.',description_de:'Vollständige Grundausbildung für Ramp Agents.',target_roles:'["ramp_agent"]'},
    {code:'CBT-LM',level:'operational',total_modules:6,title_en:'Loading Master / Load Control',title_de:'Lademeister / Ladeplanung',description_en:'Weight & balance, load sheets, DG cargo.',description_de:'Gewicht & Schwerpunkt, Ladepläne, Gefahrgut.',target_roles:'["loading_master","ramp_agent"]'},
    {code:'CBT-CS',level:'operational',total_modules:5,title_en:'Check-in & Service Agent',title_de:'Check-in & Service Agent',description_en:'Passenger handling, documentation, DCS systems.',description_de:'Passagierbetreuung, Dokumentation, DCS.',target_roles:'["checkin_agent","gate_agent"]'},
    {code:'CBT-TE',level:'operational',total_modules:5,title_en:'Trainee Experience Program',title_de:'Trainee Experience Programm',description_en:'First 90-day onboarding for all new joiners.',description_de:'Erste-90-Tage-Onboarding für alle neuen Mitarbeiter.',target_roles:'["all"]'},
    {code:'CBT-RS',level:'supervisory',total_modules:10,title_en:'Ramp Supervisor Development',title_de:'Ramp Supervisor Entwicklung',description_en:'Comprehensive leadership development for ramp supervisors.',description_de:'Umfassende Führungsentwicklung für Ramp Supervisoren.',target_roles:'["supervisor","senior_ramp_agent","ramp_agent"]'},
    {code:'CBT-TC',level:'supervisory',total_modules:6,title_en:'Turnaround Coordinator',title_de:'Turnaround Koordinator',description_en:'Advanced turnaround management and critical path coordination.',description_de:'Fortgeschrittenes Turnaround-Management.',target_roles:'["supervisor","turnaround_coordinator"]'},
    {code:'CBT-DM',level:'management',total_modules:10,title_en:'Duty Manager Program',title_de:'Duty Manager Programm',description_en:'Operational control, crisis decision making, KPI management.',description_de:'Betriebssteuerung, Krisenentscheidung, KPI-Management.',target_roles:'["duty_manager","operations_manager"]'},
    {code:'CBT-SM',level:'management',total_modules:8,title_en:'Station Manager Program',title_de:'Station Manager Programm',description_en:'Station P&L, SLA management, workforce planning.',description_de:'Station P&L, SLA-Management, Personalplanung.',target_roles:'["station_manager"]'},
    {code:'CBT-TR',level:'management',total_modules:7,title_en:'Trainer & Training Department',title_de:'Trainer & Schulungsabteilung',description_en:'Adult learning, CBT design, competency assessment.',description_de:'Erwachsenenlernen, CBT-Design, Kompetenzbewertung.',target_roles:'["trainer","safety_officer"]'},
    {code:'CBT-HR',level:'management',total_modules:6,title_en:'Human Resources Aviation',title_de:'Human Resources Aviation',description_en:'Aviation-specific HR, fatigue risk, just culture.',description_de:'Luftfahrtspezifisches HR, Erschöpfungsrisiko.',target_roles:'["hr_manager","hr_business_partner"]'},
    {code:'CBT-AL',level:'management',total_modules:7,title_en:'Airline Operations Integration',title_de:'Airline Operations Integration',description_en:'Handler-airline interface, SLA, disruption management.',description_de:'Handler-Airline-Schnittstelle, SLA, Störungsmanagement.',target_roles:'["ceo","director","duty_manager"]'},
    {code:'CBT-EX',level:'executive',total_modules:8,title_en:'Executive Leadership Program',title_de:'Executive Leadership Programm',description_en:'For CEOs: systemic risk, safety culture, missmanagement costs.',description_de:'Für CEOs: Systemisches Risiko, Sicherheitskultur, Missmanagement.',target_roles:'["ceo","director","general_manager"]'},
    {code:'CBT-SC',level:'management',total_modules:6,title_en:'Security Compliance & Safety SMS',title_de:'Sicherheits-Compliance & SMS',description_en:'Airside authority, airport security, ICAO/EASA compliance.',description_de:'Airside-Autorität, Flughafensicherheit, ICAO/EASA.',target_roles:'["all"]'},
    {code:'CBT-PR',level:'management',total_modules:6,title_en:'PR, Social Media & Brand Management',title_de:'PR, Social Media & Markenmanagement',description_en:'Corporate communication, crisis comms, social media.',description_de:'Unternehmenskommunikation, Krisenkommunikation, Social Media.',target_roles:'["duty_manager","station_manager","director","ceo"]'},
  ];
  const ins = db.prepare('INSERT INTO programs (code,level,total_modules,title_en,title_de,description_en,description_de,target_roles,pass_score,max_attempts,lockout_days) VALUES (?,?,?,?,?,?,?,?,80,2,180)');
  progs.forEach(p => ins.run(p.code,p.level,p.total_modules,p.title_en,p.title_de,p.description_en,p.description_de,p.target_roles));
  console.log('✓ 14 programs seeded');
};

seedUsers();
seedPrograms();

module.exports = db;

if (require.main === module) {
  console.log('\n✓ CLS Database ready');
  console.log('  © 2025 CLS — Clear Leadership Systems');
  process.exit(0);
}
