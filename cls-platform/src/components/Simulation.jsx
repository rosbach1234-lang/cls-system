import { useState } from 'react'

const SCENARIOS = [
  {
    id: 'emergency',
    title: '🚨 Aircraft Emergency — Engine Fire on Pushback',
    level: 'CRITICAL',
    intro: 'During pushback of B737-800 at Gate B12, the captain declares MAYDAY — engine fire indication on engine 2. You are the Ramp Supervisor on duty.',
    steps: [
      {
        situation: 'The captain calls MAYDAY over headset. Engine 2 shows fire indication. What is your FIRST action?',
        options: [
          { text: 'Continue pushback to clear the gate', points: 0 },
          { text: 'STOP immediately, radio ATC, alert ARFF', points: 10 },
          { text: 'Wait for confirmation from the captain', points: 3 },
          { text: 'Evacuate the tow truck only', points: 2 },
        ],
        correct: 1,
        feedback: '✓ STOP pushback immediately. Radio ATC declaring emergency. Alert ARFF (fire services). Establish a 100m safety cordon. This is the correct sequence per IATA AHM.',
      },
      {
        situation: 'ARFF is en route (ETA 2 min). Pax are aboard. Fuel truck is 40m away. What do you do next?',
        options: [
          { text: 'Move the fuel truck away from the aircraft immediately', points: 10 },
          { text: 'Wait for ARFF to arrive before any action', points: 4 },
          { text: 'Begin passenger evacuation via slides', points: 6 },
          { text: 'Disconnect tow bar and drive away', points: 2 },
        ],
        correct: 0,
        feedback: '✓ Moving the fuel truck is the highest priority — a fuel source near a fire is catastrophic. Passenger evacuation is the captain\'s decision, not ground crew.',
      },
      {
        situation: 'ARFF arrives. Fire is extinguished. No injuries. What is your immediate post-incident action?',
        options: [
          { text: 'Return to normal operations immediately', points: 0 },
          { text: 'Write incident report and preserve the scene', points: 10 },
          { text: 'Inform the airline and continue the flight', points: 2 },
          { text: 'Debrief only the ramp crew involved', points: 5 },
        ],
        correct: 1,
        feedback: '✓ Preserve the scene, write an immediate incident report, and notify safety management. The investigation takes priority over operational recovery.',
      },
    ],
  },
  {
    id: 'cargo',
    title: '📦 Dangerous Goods — Undeclared DG Discovery',
    level: 'HIGH',
    intro: 'During cargo screening, a package labelled "Electronic Equipment" shows unusual heat and a chemical smell. Your screener alerts you.',
    steps: [
      {
        situation: 'Your screener reports a suspicious warm package with chemical odour. What is your first step?',
        options: [
          { text: 'Open the package to inspect contents', points: 0 },
          { text: 'Isolate the package and clear the area', points: 10 },
          { text: 'Accept it and flag for check at destination', points: 0 },
          { text: 'Call the shipper for clarification', points: 3 },
        ],
        correct: 1,
        feedback: '✓ Never open a suspected undeclared DG. Isolate immediately, clear a 10m radius, and contact the DG coordinator and security. IATA DGR 9.4.',
      },
      {
        situation: 'The DG coordinator confirms it may contain lithium batteries in thermal runaway. Who do you notify?',
        options: [
          { text: 'Airline cargo manager only', points: 4 },
          { text: 'ARFF, airport operations, and airline — simultaneously', points: 10 },
          { text: 'The shipper to come collect it', points: 1 },
          { text: 'Security only, as it may be a security threat', points: 3 },
        ],
        correct: 1,
        feedback: '✓ Multi-agency notification is required — ARFF for fire risk, airport ops for operational impact, and the airline as cargo owner. Simultaneous notifications save time.',
      },
      {
        situation: 'Incident is contained. How do you document this for compliance?',
        options: [
          { text: 'Verbal debrief with the team — no formal report needed', points: 0 },
          { text: 'IATA DG Occurrence Report + internal incident report', points: 10 },
          { text: 'Email the shipper only', points: 2 },
          { text: 'Report only if cargo was loaded to aircraft', points: 1 },
        ],
        correct: 1,
        feedback: '✓ All undeclared DG incidents require an IATA Dangerous Goods Occurrence Report AND an internal safety report regardless of outcome.',
      },
    ],
  },
  {
    id: 'security',
    title: '🔒 Security Breach — Unattended Bag on Airside',
    level: 'HIGH',
    intro: 'A staff member reports an unattended bag near the aircraft stand at Gate A7. No owner is visible. You are the Duty Manager.',
    steps: [
      {
        situation: 'Unattended bag reported at Gate A7 airside. What is your immediate response?',
        options: [
          { text: 'Ask nearby staff if it belongs to anyone', points: 3 },
          { text: 'Treat as suspect, cordon 100m, alert security control', points: 10 },
          { text: 'Move the bag to lost property', points: 0 },
          { text: 'Wait 15 minutes before escalating', points: 0 },
        ],
        correct: 1,
        feedback: '✓ All unattended items airside must be treated as potential threats until cleared. 100m cordon, immediate notification to airport security control — ICAO Annex 17.',
      },
      {
        situation: 'Security control requests the area be evacuated. An aircraft is boarding at the adjacent gate. What do you do?',
        options: [
          { text: 'Continue boarding — keep distance from the bag', points: 0 },
          { text: 'Halt boarding, move pax to terminal, coordinate with ATC', points: 10 },
          { text: 'Speed up boarding to get the aircraft away faster', points: 1 },
          { text: 'Inform the captain only and let them decide', points: 4 },
        ],
        correct: 1,
        feedback: '✓ Adjacent gate boarding must stop. Passenger safety supersedes schedule. ATC must be informed to manage airside movement restrictions.',
      },
      {
        situation: 'EOD (Explosive Ordnance Disposal) clears the bag — it was a forgotten crew bag. What is the debrief focus?',
        options: [
          { text: 'No debrief needed — false alarm', points: 0 },
          { text: 'Review response time, communication, and access control gaps', points: 10 },
          { text: 'Disciplinary action only for the crew member', points: 2 },
          { text: 'Update the lost property register', points: 1 },
        ],
        correct: 1,
        feedback: '✓ Every security incident — regardless of outcome — requires a debrief covering response time, communication effectiveness, and systemic improvements.',
      },
    ],
  },
]

export default function Simulation({ module, onBack }) {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [stepIdx, setStepIdx]         = useState(0)
  const [chosen, setChosen]           = useState(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [history, setHistory]         = useState([])
  const [done, setDone]               = useState(false)

  const scenario = SCENARIOS[scenarioIdx]
  const step     = scenario.steps[stepIdx]
  const maxPts   = SCENARIOS.reduce((s, sc) => s + sc.steps.length * 10, 0)

  const choose = (idx) => {
    if (chosen !== null) return
    const opt = step.options[idx]
    setChosen(idx)
    setTotalPoints(p => p + opt.points)
    setHistory(h => [...h, { scenario: scenario.title, step: stepIdx+1, choice: opt.text, points: opt.points, correct: idx === step.correct }])
  }

  const next = () => {
    setChosen(null)
    if (stepIdx < scenario.steps.length - 1) {
      setStepIdx(s => s + 1)
    } else if (scenarioIdx < SCENARIOS.length - 1) {
      setScenarioIdx(s => s + 1)
      setStepIdx(0)
    } else {
      setDone(true)
    }
  }

  const pct = Math.round((totalPoints / maxPts) * 100)

  if (done) {
    const rating = pct >= 85 ? { label:'Expert Responder', color:'#22c55e' }
                 : pct >= 65 ? { label:'Competent Responder', color:'#f59e0b' }
                 : { label:'Needs Development', color:'#ef4444' }
    return (
      <div className="sim-result">
        <div className="result-card">
          <div className="result-icon">🎯</div>
          <h2>Simulation Complete</h2>
          <div className="result-score" style={{ color: rating.color }}>{pct}%</div>
          <div className="sim-badge" style={{ background: rating.color }}>{rating.label}</div>
          <p>{totalPoints} / {maxPts} decision points</p>
          <div className="sim-history">
            <h4>Decision Review</h4>
            {history.map((h, i) => (
              <div key={i} className={`history-row ${h.correct ? 'correct' : 'wrong'}`}>
                <span>{h.correct ? '✓' : '✗'} {h.choice}</span>
                <span>+{h.points} pts</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="simulation">
      <div className="sim-header">
        <button onClick={onBack} className="btn-back">← Exit</button>
        <div>
          <h2>{scenario.title}</h2>
          <span className={`level-badge level-${scenario.level.toLowerCase()}`}>{scenario.level}</span>
        </div>
        <div className="sim-score">Score: {totalPoints} pts</div>
      </div>

      <div className="sim-progress">
        {SCENARIOS.map((s, i) => (
          <div key={i} className={`sim-step-dot ${i < scenarioIdx ? 'done' : i === scenarioIdx ? 'active' : ''}`}>
            {i < scenarioIdx ? '✓' : i+1}
          </div>
        ))}
      </div>

      {stepIdx === 0 && scenarioIdx === 0 && (
        <div className="sim-intro">
          <strong>Scenario Briefing:</strong> {scenario.intro}
        </div>
      )}
      {stepIdx === 0 && scenarioIdx > 0 && (
        <div className="sim-intro"><strong>New Scenario:</strong> {scenario.intro}</div>
      )}

      <div className="sim-card">
        <div className="sim-step-label">Step {stepIdx + 1} of {scenario.steps.length}</div>
        <p className="sim-situation">{step.situation}</p>
        <div className="sim-options">
          {step.options.map((opt, i) => {
            let cls = 'sim-option'
            if (chosen !== null) {
              if (i === step.correct) cls += ' correct'
              else if (i === chosen && chosen !== step.correct) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={chosen !== null}>
                {opt.text}
              </button>
            )
          })}
        </div>
        {chosen !== null && (
          <div className={`sim-feedback ${chosen === step.correct ? 'fb-correct' : 'fb-wrong'}`}>
            <strong>{chosen === step.correct ? `✓ +10 pts` : `✗ +${step.options[chosen].points} pts`}</strong>
            <p>{step.feedback}</p>
            <button className="btn-next" onClick={next}>
              {stepIdx < scenario.steps.length-1 ? 'Next Decision →'
               : scenarioIdx < SCENARIOS.length-1 ? 'Next Scenario →'
               : 'See Final Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
