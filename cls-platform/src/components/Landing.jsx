import { useState } from 'react'

export default function Landing({ onLogin, onDemo }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [tab, setTab]           = useState('standard')

  const handleLogin = (e) => {
    e.preventDefault()
    const ok = onLogin(email, password)
    if (!ok) setError('Invalid email or password.')
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">✈ CLS Aviation Training Platform</div>
        <p className="landing-tagline">Professional CBT for Ground Handling & Aviation Management</p>
      </header>

      <div className="landing-hero">
        <div className="hero-text">
          <h1>Train Smarter.<br/>Certify Faster.</h1>
          <p>14 IATA-aligned CBT programs · AI-powered coaching · Real-time analytics</p>
          <div className="hero-stats">
            <div className="stat"><span>2,800+</span><label>Questions</label></div>
            <div className="stat"><span>14</span><label>Programs</label></div>
            <div className="stat"><span>6</span><label>Modules</label></div>
            <div className="stat"><span>AI</span><label>Trainer</label></div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button className={tab==='standard'?'active':''} onClick={() => setTab('standard')}>Standard Login</button>
            <button className={tab==='ceo'?'active':''} onClick={() => setTab('ceo')}>CEO / Executive</button>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <input type="email" placeholder="Company Email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }} required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => { setPassword(e.target.value); setError('') }} required />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary">Login</button>
          </form>

          <div className="demo-divider">── Quick Demo Access ──</div>
          <div className="demo-buttons">
            {tab === 'standard'
              ? <button className="btn-demo" onClick={() => onDemo('standard')}>
                  Demo: Supervisor Login<br/><small>max@airline.com</small>
                </button>
              : <button className="btn-demo btn-ceo" onClick={() => onDemo('ceo')}>
                  Demo: CEO Login<br/><small>ceo@airline.com</small>
                </button>
            }
          </div>
        </div>
      </div>

      <section className="features">
        {[
          { icon:'🎯', title:'Adaptive Learning', desc:'Spaced repetition targets your weak areas automatically.' },
          { icon:'⏱', title:'Timed Exams', desc:'45-minute IATA-style exams with instant scoring.' },
          { icon:'🚨', title:'Incident Simulation', desc:'3 real-world scenarios: emergency, cargo, security.' },
          { icon:'🤖', title:'AI Trainer', desc:'24/7 Claude-powered coaching in English & German.' },
          { icon:'📊', title:'CEO Analytics', desc:'Team performance, risk heatmaps, compliance tracking.' },
          { icon:'🏆', title:'Certificates', desc:'Downloadable PDF certificates valid for 2 years.' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        © 2025 CLS — Clear Leadership Systems · All rights reserved
      </footer>
    </div>
  )
}
