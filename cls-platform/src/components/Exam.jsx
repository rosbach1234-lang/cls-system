import { useState, useEffect, useRef } from 'react'

const EXAM_QUESTIONS = [
  { id:1,  q:'What is the IATA standard pass score for ground handling CBT?', opts:['70%','75%','80%','85%'], c:2, topic:'Standards' },
  { id:2,  q:'FOD inspection of the ramp must be conducted:', opts:['Once daily','Before each aircraft movement','Weekly','After incidents only'], c:1, topic:'Ramp Safety' },
  { id:3,  q:'Maximum gross weight for a B737-800 is approximately:', opts:['65,000 kg','79,000 kg','70,500 kg','85,000 kg'], c:1, topic:'Aircraft Knowledge' },
  { id:4,  q:'A "hot refuelling" operation refers to:', opts:['Refuelling in summer','Refuelling with engine running','Refuelling under time pressure','Refuelling with pax on board'], c:1, topic:'Fuelling' },
  { id:5,  q:'SGHA stands for:', opts:['Standard Ground Handling Agreement','Safety Ground Handling Act','Station Ground Handling Assessment','Standard Gate Handling Agreement'], c:0, topic:'Contracts' },
  { id:6,  q:'Which IATA document governs DG air transport?', opts:['IATA DGR','IATA ICHM','IATA AHM','IATA TACT'], c:0, topic:'Dangerous Goods' },
  { id:7,  q:'An OTP of 85% means:', opts:['85% of flights are on time','85% of staff are trained','85% pass rate in CBT','85% fuel efficiency'], c:0, topic:'KPIs' },
  { id:8,  q:'Chocks must be placed:', opts:['After passenger boarding','Before any ground equipment connects','After engine shutdown only','At crew discretion'], c:1, topic:'Ramp Safety' },
  { id:9,  q:'ICAO Annex 14 covers:', opts:['Air Traffic Management','Aerodromes','Personnel Licensing','Aircraft Operations'], c:1, topic:'Compliance' },
  { id:10, q:'Load sheet must be signed by:', opts:['Captain only','Load controller only','Both captain and load controller','Ground supervisor'], c:2, topic:'Load Control' },
  { id:11, q:'A runway incursion Category A is classified as:', opts:['Near miss','Serious incident','Minor deviation','Collision'], c:1, topic:'Safety' },
  { id:12, q:'Just Culture in aviation means:', opts:['No punishment for any error','Punishing all mistakes','Distinguishing honest mistakes from negligence','Rewarding good performance'], c:2, topic:'Safety Culture' },
  { id:13, q:'SMS stands for:', opts:['Station Management System','Safety Management System','Service Monitoring Software','Standard Method of Supervision'], c:1, topic:'Safety Management' },
  { id:14, q:'A "wet lease" agreement includes:', opts:['Aircraft only','Aircraft and crew','Ground equipment','Catering only'], c:1, topic:'Aviation Business' },
  { id:15, q:'The primary purpose of a turnaround time target is:', opts:['Reduce costs','Ensure aircraft rotation efficiency','Increase passenger satisfaction','Comply with regulations'], c:1, topic:'Operations' },
]

const TOTAL_SECONDS = 45 * 60

export default function Exam({ module, onComplete, onBack }) {
  const [answers, setAnswers]     = useState({})
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore]         = useState(0)
  const [current, setCurrent]     = useState(0)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleSubmit = () => {
    clearInterval(timerRef.current)
    const correct = EXAM_QUESTIONS.filter(q => answers[q.id] === q.c).length
    const pct = Math.round((correct / EXAM_QUESTIONS.length) * 100)
    setScore(pct)
    setSubmitted(true)
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2,'0')
  const ss = String(timeLeft % 60).padStart(2,'0')
  const timerClass = timeLeft < 300 ? 'timer danger' : timeLeft < 600 ? 'timer warning' : 'timer'

  if (submitted) {
    const passed = score >= 80
    const correct = EXAM_QUESTIONS.filter(q => answers[q.id] === q.c).length
    const topicResults = {}
    EXAM_QUESTIONS.forEach(q => {
      if (!topicResults[q.topic]) topicResults[q.topic] = { c:0, t:0 }
      topicResults[q.topic].t++
      if (answers[q.id] === q.c) topicResults[q.topic].c++
    })
    return (
      <div className="exam-result">
        <div className={`result-card ${passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">{passed ? '🎓' : '📖'}</div>
          <h2>{passed ? 'Exam Passed!' : 'Exam Failed'}</h2>
          <div className="result-score">{score}%</div>
          <p>{correct} / {EXAM_QUESTIONS.length} correct · Pass mark: 80%</p>
          <div className="topic-breakdown">
            <h4>Topic Breakdown</h4>
            {Object.entries(topicResults).map(([t, r]) => (
              <div key={t} className="topic-row">
                <span>{t}</span>
                <span className={r.c/r.t >= 0.8 ? 'good' : 'poor'}>{r.c}/{r.t}</span>
              </div>
            ))}
          </div>
          <div className="result-actions">
            {passed
              ? <button className="btn-primary" onClick={() => onComplete({ module, score, type:'exam' })}>Get Certificate</button>
              : <button className="btn-primary" onClick={onBack}>Back to Dashboard</button>
            }
          </div>
        </div>
      </div>
    )
  }

  const q = EXAM_QUESTIONS[current]
  const progress = (Object.keys(answers).length / EXAM_QUESTIONS.length) * 100

  return (
    <div className="exam">
      <div className="exam-header">
        <button onClick={onBack} className="btn-back">← Exit</button>
        <h2>📋 Final Exam — {module?.title || 'Aviation Training'}</h2>
        <div className={timerClass}>⏱ {mm}:{ss}</div>
      </div>

      <div className="exam-meta">
        <span>Question {current+1} of {EXAM_QUESTIONS.length}</span>
        <span>{Object.keys(answers).length} answered</span>
        <button className="btn-submit-exam" onClick={handleSubmit}
          disabled={Object.keys(answers).length < EXAM_QUESTIONS.length}>
          Submit Exam
        </button>
      </div>

      <div className="exam-bar">
        <div className="exam-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="exam-layout">
        <div className="question-card">
          <div className="question-topic">{q.topic}</div>
          <p className="question-text">{q.q}</p>
          <div className="options">
            {q.opts.map((opt, i) => (
              <button key={i}
                className={`option ${answers[q.id] === i ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}>
                <span className="opt-label">{String.fromCharCode(65+i)}</span> {opt}
              </button>
            ))}
          </div>
          <div className="exam-nav">
            <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current===0}>← Prev</button>
            <button onClick={() => setCurrent(c => Math.min(EXAM_QUESTIONS.length-1, c+1))} disabled={current===EXAM_QUESTIONS.length-1}>Next →</button>
          </div>
        </div>

        <div className="question-nav">
          <h4>Question Navigator</h4>
          <div className="q-grid">
            {EXAM_QUESTIONS.map((_, i) => (
              <button key={i} className={`q-dot ${answers[EXAM_QUESTIONS[i].id] !== undefined ? 'answered' : ''} ${current===i?'active':''}`}
                onClick={() => setCurrent(i)}>{i+1}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
