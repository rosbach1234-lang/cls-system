import { useState } from 'react'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import Quiz from './components/Quiz'
import Exam from './components/Exam'
import Simulation from './components/Simulation'
import AITrainer from './components/AITrainer'
import Checkout from './components/Checkout'
import CEOAnalytics from './components/CEOAnalytics'
import Certificate from './components/Certificate'
import './App.css'

const DEMO_USERS = {
  'max@airline.com': { password: 'Test1234', role: 'standard', name: 'Max Müller',    company: 'AirLine GmbH' },
  'ceo@airline.com': { password: 'Ceo12345', role: 'ceo',      name: 'Sarah Mitchell', company: 'AirLine GmbH' },
}

export default function App() {
  const [user, setUser]                 = useState(null)
  const [view, setView]                 = useState('dashboard')
  const [activeModule, setActiveModule] = useState(null)
  const [cert, setCert]                 = useState(null)

  const login = (email, password) => {
    const u = DEMO_USERS[email]
    if (u && u.password === password) { setUser({ email, ...u }); setView('dashboard'); return true }
    return false
  }
  const demoLogin = (role) => {
    const email = role === 'ceo' ? 'ceo@airline.com' : 'max@airline.com'
    setUser({ email, ...DEMO_USERS[email] }); setView('dashboard')
  }
  const logout = () => { setUser(null); setView('dashboard') }
  const openModule = (mod, mode) => { setActiveModule({ ...mod, mode }); setView(mode) }
  const earnCert   = (data) => { setCert(data); setView('certificate') }

  if (!user) return <Landing onLogin={login} onDemo={demoLogin} />

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setView('dashboard')}>✈ CLS Aviation Training</div>
        <div className="nav-links">
          <button onClick={() => setView('dashboard')}  className={view==='dashboard' ?'active':''}>Dashboard</button>
          <button onClick={() => setView('ai-trainer')} className={view==='ai-trainer'?'active':''}>AI Trainer</button>
          {user.role === 'ceo' && <button onClick={() => setView('analytics')} className={view==='analytics'?'active':''}>Analytics</button>}
          <button onClick={() => setView('checkout')}   className={view==='checkout'  ?'active':''}>Upgrade</button>
        </div>
        <div className="nav-user">
          <span>{user.name}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        {view === 'dashboard'   && <Dashboard user={user} onOpenModule={openModule} />}
        {view === 'quiz'        && <Quiz module={activeModule} onComplete={earnCert} onBack={() => setView('dashboard')} />}
        {view === 'exam'        && <Exam module={activeModule} onComplete={earnCert} onBack={() => setView('dashboard')} />}
        {view === 'simulation'  && <Simulation module={activeModule} onBack={() => setView('dashboard')} />}
        {view === 'ai-trainer'  && <AITrainer user={user} />}
        {view === 'checkout'    && <Checkout user={user} onBack={() => setView('dashboard')} />}
        {view === 'analytics'   && <CEOAnalytics user={user} />}
        {view === 'certificate' && <Certificate data={cert} user={user} onBack={() => setView('dashboard')} />}
      </main>
    </div>
  )
}
