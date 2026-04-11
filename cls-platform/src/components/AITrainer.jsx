import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are an expert aviation training coach for CLS — Clear Leadership Systems. 
You specialise in IATA ground handling, ramp safety, cargo operations, passenger handling, airside security, and aviation management.
Answer questions in the language the user writes in (English or German).
Keep answers concise, practical, and referenced to IATA standards where possible.
Always prioritise safety in your guidance.`

const QUICK_TOPICS = [
  'What is FOD and how do I prevent it?',
  'Explain weight & balance for a B737',
  'What are IATA DGR Class 3 requirements?',
  'How do I handle an unruly passenger?',
  'Explain SMS in aviation',
  'Was ist eine Startbahnfreigabe?',
  'Erkläre mir Just Culture',
]

export default function AITrainer({ user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user.name.split(' ')[0]}! 👋 I'm your AI Aviation Trainer. Ask me anything about ground handling, safety, cargo, or aviation management — in English or German.` }
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey]   = useState(localStorage.getItem('cls_api_key') || '')
  const [showKey, setShowKey] = useState(!localStorage.getItem('cls_api_key'))
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const saveKey = () => {
    localStorage.setItem('cls_api_key', apiKey)
    setShowKey(false)
  }

  const send = async (text) => {
    const userText = text || input.trim()
    if (!userText) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const key = localStorage.getItem('cls_api_key')
      if (!key) { setShowKey(true); setLoading(false); return }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'API error')
      }

      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.content[0].text }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `⚠ Error: ${err.message}. Please check your API key.` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-trainer">
      <div className="ai-header">
        <h2>🤖 AI Aviation Trainer</h2>
        <button className="btn-small" onClick={() => setShowKey(v => !v)}>
          {showKey ? 'Hide Key' : 'API Key'}
        </button>
      </div>

      {showKey && (
        <div className="api-key-setup">
          <p>Enter your Anthropic API key to enable AI coaching:</p>
          <div className="key-input-row">
            <input type="password" placeholder="sk-ant-..." value={apiKey}
              onChange={e => setApiKey(e.target.value)} />
            <button className="btn-primary" onClick={saveKey}>Save</button>
          </div>
          <small>Key is stored locally in your browser only.</small>
        </div>
      )}

      <div className="quick-topics">
        {QUICK_TOPICS.map(t => (
          <button key={t} className="topic-chip" onClick={() => send(t)}>{t}</button>
        ))}
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="msg-avatar">{m.role === 'assistant' ? '🤖' : '👤'}</div>
            <div className="msg-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="msg-avatar">🤖</div>
            <div className="msg-content typing"><span/><span/><span/></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about aviation safety, procedures, regulations..."
          disabled={loading}
        />
        <button className="btn-send" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? '...' : '➤'}
        </button>
      </div>
    </div>
  )
}
