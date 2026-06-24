import { useState } from 'react'

const MODULES = [
  { id:1, code:'MOD-01', title:'Ramp Operations & Safety',      icon:'🛬', level:'Operational', questions:280, duration:'35 min', topics:['FOD Prevention','Aircraft Marshalling','GSE Safety','Pushback Procedures'] },
  { id:2, code:'MOD-02', title:'Cargo & Dangerous Goods',       icon:'📦', level:'Operational', questions:320, duration:'40 min', topics:['IATA DGR','Load Planning','ULD Management','Weight & Balance'] },
  { id:3, code:'MOD-03', title:'Passenger Handling & Check-in', icon:'🎫', level:'Operational', questions:260, duration:'35 min', topics:['DCS Systems','Boarding Control','Special Passengers','Documentation'] },
  { id:4, code:'MOD-04', title:'Airside Safety & Emergency',    icon:'🚨', level:'Safety',      questions:340, duration:'45 min', topics:['Runway Incursion','Emergency Procedures','Fire Safety','First Aid'] },
  { id:5, code:'MOD-05', title:'Airport Security & Compliance', icon:'🔒', level:'Compliance',  questions:290, duration:'40 min', topics:['ICAO Annex 17','Screening Procedures','Access Control','Threat Assessment'] },
  { id:6, code:'MOD-06', title:'Aviation Management & KPIs',    icon:'📊', level:'Management',  questions:310, duration:'45 min', topics:['OTP Management','SLA Compliance','Team Leadership','Cost Control'] },
]

const PROGRESS = {
  1: { score: 87, passed: true,  attempts: 1 },
  2: { score: 72, passed: false, attempts: 1 },
  3: { score: 0,  passed: false, attempts: 0 },
}

export default function Dashboard({ user, onOpenModule }) {
  const [selected, setSelected] = useState(null)

  const totalPassed  = Object.values(PROGRESS).filter(p => p.passed).length
  const avgScore     = Object.values(PROGRESS).filter(p => p.attempts > 0).reduce((s,p,_,a) => s + p.score/a.length, 0)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>{user.company} · {user.role === 'ceo' ? 'Executive Access' : 'Training Dashboard'}</p>
        </div>
        <div className="dashboard-stats">
          <div className="dstat"><span>{totalPassed}/6</span><label>Passed</label></div>
          <div className="dstat"><span>{avgScore ? Math.round(avgScore)+'%' : '—'}</span><label>Avg Score</label></div>
          <div className="dstat"><span>{totalPassed}</span><label>Certificates</label></div>
        </div>
      </div>

      <div className="module-grid">
        {MODULES.map(mod => {
          const prog = PROGRESS[mod.id]
          const pct  = prog?.attempts > 0 ? prog.score : 0
          return (
            <div key={mod.id} className={`module-card ${prog?.passed ? 'passed' : ''}`}
              onClick={() => setSelected(selected?.id === mod.id ? null : mod)}>
              <div className="module-header">
                <span className="module-icon">{mod.icon}</span>
                <div>
                  <div className="module-code">{mod.code}</div>
                  <div className={`module-level level-${mod.level.toLowerCase()}`}>{mod.level}</div>
                </div>
                {prog?.passed && <span className="badge-passed">✓ Certified</span>}
              </div>
              <h3>{mod.title}</h3>
              <div className="module-meta">
                <span>📝 {mod.questions} questions</span>
                <span>⏱ {mod.duration}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct > 0 ? '#f59e0b' : '#e5e7eb' }} />
              </div>
              <div className="progress-label">{pct > 0 ? `${pct}% — ${prog.attempts} attempt${prog.attempts>1?'s':''}` : 'Not started'}</div>

              {selected?.id === mod.id && (
                <div className="module-actions" onClick={e => e.stopPropagation()}>
                  <div className="module-topics">
                    {mod.topics.map(t => <span key={t} className="topic-tag">{t}</span>)}
                  </div>
                  <div className="action-buttons">
                    <button className="btn-quiz"  onClick={() => onOpenModule(mod, 'quiz')}>🎯 Practice Quiz</button>
                    <button className="btn-exam"  onClick={() => onOpenModule(mod, 'exam')}>📋 Final Exam</button>
                    <button className="btn-sim"   onClick={() => onOpenModule(mod, 'simulation')}>🚨 Simulation</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
