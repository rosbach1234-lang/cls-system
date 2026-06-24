import { useState, useEffect, useCallback } from 'react'

const QUESTION_BANK = {
  1: [
    { id:101, q:'What does FOD stand for in ramp operations?', opts:['Foreign Object Debris','Flight Operations Data','Forward Object Detection','Fuel Operations Division'], c:0, e:'FOD (Foreign Object Debris) refers to any object on the ramp that could damage aircraft or injure personnel.' },
    { id:102, q:'Minimum safe distance from a running jet engine intake?', opts:['3 metres','5 metres','10 metres','15 metres'], c:2, e:'The minimum safe distance from a running jet engine intake is 10 metres to prevent ingestion hazards.' },
    { id:103, q:'What colour vest does a wing-walker typically wear?', opts:['Blue','Yellow/Orange','Red','Green'], c:1, e:'Wing-walkers wear high-visibility yellow or orange vests for easy identification on the ramp.' },
    { id:104, q:'Before connecting a GPU, you must first:', opts:['Start the aircraft APU','Ensure aircraft chocks are in place','Check fuel levels','Obtain captain approval'], c:1, e:'Chocks must be in place before connecting any ground power to prevent aircraft movement.' },
    { id:105, q:'Maximum speed for GSE on the ramp is:', opts:['10 km/h','25 km/h','15 km/h','30 km/h'], c:2, e:'GSE speed is limited to 15 km/h on active ramp areas to prevent accidents.' },
    { id:106, q:'A pushback requires a minimum of how many crew?', opts:['1 – driver only','2 – driver and headset operator','3 – driver, headset, and wingwalker','4 – full crew'], c:1, e:'Pushback requires at minimum a tow driver and a headset operator communicating with the cockpit.' },
    { id:107, q:'What is the first action when you discover FOD on the runway?', opts:['Remove it immediately','Report to ATC and mark the area','Ignore if small','Call the airline'], c:1, e:'Runway FOD must be immediately reported to ATC so the runway can be cleared safely.' },
    { id:108, q:'Engine blast danger zone extends how far behind a taxiing aircraft?', opts:['30 m','60 m','100 m','150 m'], c:2, e:'Engine blast from a taxiing aircraft can be dangerous up to 100 metres behind the aircraft.' },
  ],
  4: [
    { id:401, q:'A runway incursion is classified by ICAO into how many categories?', opts:['2','3','4','5'], c:2, e:'ICAO classifies runway incursions into 4 categories (A-D) based on severity.' },
    { id:402, q:'What is the first priority in any aircraft ground emergency?', opts:['Protect equipment','Evacuate personnel','Contact airline','Complete paperwork'], c:1, e:'Life safety — evacuating and protecting personnel — is always the first priority.' },
    { id:403, q:'ARFF stands for:', opts:['Aviation Risk & Fire Fighting','Aircraft Rescue and Fire Fighting','Airside Response and First response','Airport Runway Fire Force'], c:1, e:'ARFF = Aircraft Rescue and Fire Fighting — the specialist airport emergency service.' },
  ],
}

function getQuestions(moduleId) {
  const bank = QUESTION_BANK[moduleId] || QUESTION_BANK[1]
  const shuffled = [...bank].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(8, shuffled.length)).map(q => ({
    ...q,
    opts: q.opts.map((o,i) => ({ text:o, orig:i })).sort(() => Math.random() - 0.5)
  }))
}

export default function Quiz({ module, onComplete, onBack }) {
  const [questions]      = useState(() => getQuestions(module?.id || 1))
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState({})
  const [showExp, setShowExp]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore]       = useState(0)

  // Spaced repetition: track weak questions
  const [weakQ, setWeakQ]       = useState([])

  const q = questions[current]

  const answer = (optIndex) => {
    if (answers[q.id] !== undefined) return
    const isCorrect = q.opts[optIndex].orig === q.c
    setAnswers(prev => ({ ...prev, [q.id]: { chosen: optIndex, correct: isCorrect } }))
    if (!isCorrect) setWeakQ(prev => [...new Set([...prev, q.id])])
    setShowExp(true)
  }

  const next = () => {
    setShowExp(false)
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else submit()
  }

  const submit = useCallback(() => {
    const correct = Object.values(answers).filter(a => a.correct).length
    const pct     = Math.round((correct / questions.length) * 100)
    setScore(pct)
    setSubmitted(true)
  }, [answers, questions.length])

  if (submitted) {
    const passed = score >= 80
    return (
      <div className="quiz-result">
        <div className={`result-card ${passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">{passed ? '🏆' : '📚'}</div>
          <h2>{passed ? 'Quiz Passed!' : 'Keep Practising'}</h2>
          <div className="result-score">{score}%</div>
          <p>{Object.values(answers).filter(a=>a.correct).length} / {questions.length} correct</p>
          {weakQ.length > 0 && <p className="weak-notice">⚠ {weakQ.length} topic{weakQ.length>1?'s':''} need review</p>}
          <div className="result-actions">
            {passed
              ? <button className="btn-primary" onClick={() => onComplete({ module, score, type:'quiz' })}>Get Certificate</button>
              : <button className="btn-primary" onClick={() => window.location.reload()}>Retry Quiz</button>
            }
            <button className="btn-secondary" onClick={onBack}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  const chosen = answers[q.id]

  return (
    <div className="quiz">
      <div className="quiz-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h2>🎯 {module?.title} — Practice Quiz</h2>
        <div className="quiz-progress">{current+1} / {questions.length}</div>
      </div>

      <div className="quiz-bar">
        <div className="quiz-bar-fill" style={{ width: `${((current+1)/questions.length)*100}%` }} />
      </div>

      <div className="question-card">
        <p className="question-text">{q.q}</p>
        <div className="options">
          {q.opts.map((opt, i) => {
            let cls = 'option'
            if (chosen !== undefined) {
              if (opt.orig === q.c) cls += ' correct'
              else if (i === chosen.chosen && !chosen.correct) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => answer(i)} disabled={chosen !== undefined}>
                <span className="opt-label">{String.fromCharCode(65+i)}</span> {opt.text}
              </button>
            )
          })}
        </div>
        {showExp && chosen && (
          <div className={`explanation ${chosen.correct ? 'exp-correct' : 'exp-wrong'}`}>
            <strong>{chosen.correct ? '✓ Correct!' : '✗ Incorrect'}</strong>
            <p>{q.e}</p>
            <button className="btn-next" onClick={next}>
              {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
