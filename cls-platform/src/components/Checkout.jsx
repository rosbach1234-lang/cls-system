import { useState } from 'react'

const PLANS = [
  { id:'starter', name:'Starter', price:49, period:'/ month', features:['3 CBT Modules','Quiz & Exam Mode','Basic Certificate','Email Support'], color:'#6366f1' },
  { id:'professional', name:'Professional', price:129, period:'/ month', features:['All 14 CBT Modules','AI Trainer (Claude)','Incident Simulation','Priority Support','Team up to 10'], color:'#0ea5e9', popular:true },
  { id:'enterprise', name:'Enterprise', price:399, period:'/ month', features:['Unlimited Users','CEO Analytics Dashboard','Custom Branding','API Access','Dedicated Account Manager','SLA 99.9%'], color:'#8b5cf6' },
]

const CANCEL_DEADLINE_DAYS = 30

export default function Checkout({ user, onBack }) {
  const [selected, setSelected]   = useState('professional')
  const [step, setStep]           = useState('plan') // plan | payment | confirm
  const [method, setMethod]       = useState('card')
  const [card, setCard]           = useState({ name:'', number:'', expiry:'', cvc:'' })
  const [processing, setProcessing] = useState(false)
  const [done, setDone]           = useState(false)

  const plan = PLANS.find(p => p.id === selected)

  const cancelDeadline = new Date()
  cancelDeadline.setDate(cancelDeadline.getDate() + CANCEL_DEADLINE_DAYS)

  const handlePay = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 2000)) // simulate payment
    setProcessing(false)
    setDone(true)
  }

  if (done) return (
    <div className="checkout">
      <div className="checkout-success">
        <div className="success-icon">✅</div>
        <h2>Subscription Activated!</h2>
        <p><strong>{plan.name}</strong> plan at €{plan.price}/month</p>
        <div className="cancel-notice">
          ⚠ <strong>Cancellation Deadline:</strong> {cancelDeadline.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}<br/>
          Cancel before this date to avoid the next billing cycle.
        </div>
        <button className="btn-primary" onClick={onBack}>Go to Dashboard</button>
      </div>
    </div>
  )

  return (
    <div className="checkout">
      <div className="checkout-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <h2>Upgrade Your Plan</h2>
      </div>

      {step === 'plan' && (
        <div className="plan-selection">
          <div className="plan-grid">
            {PLANS.map(p => (
              <div key={p.id} className={`plan-card ${selected===p.id?'selected':''} ${p.popular?'popular':''}`}
                onClick={() => setSelected(p.id)}>
                {p.popular && <div className="popular-badge">Most Popular</div>}
                <h3 style={{ color: p.color }}>{p.name}</h3>
                <div className="plan-price">€{p.price}<span>{p.period}</span></div>
                <ul>
                  {p.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <div className={`plan-radio ${selected===p.id?'checked':''}`} />
              </div>
            ))}
          </div>
          <button className="btn-primary btn-full" onClick={() => setStep('payment')}>
            Continue with {plan.name} — €{plan.price}/month →
          </button>
        </div>
      )}

      {step === 'payment' && (
        <div className="payment-section">
          <div className="payment-summary">
            <strong>{plan.name} Plan</strong> · €{plan.price}/month
            <div className="cancel-notice-small">
              You can cancel up to {CANCEL_DEADLINE_DAYS} days before next billing date.
            </div>
          </div>

          <div className="payment-methods">
            <button className={`method-btn ${method==='card'?'active':''}`} onClick={() => setMethod('card')}>
              💳 Credit / Debit Card
            </button>
            <button className={`method-btn ${method==='paypal'?'active':''}`} onClick={() => setMethod('paypal')}>
              🅿 PayPal
            </button>
          </div>

          {method === 'card' ? (
            <div className="card-form">
              <input placeholder="Cardholder Name" value={card.name}
                onChange={e => setCard({...card, name: e.target.value})} />
              <input placeholder="Card Number (e.g. 4242 4242 4242 4242)" value={card.number}
                onChange={e => setCard({...card, number: e.target.value})} maxLength={19} />
              <div className="card-row">
                <input placeholder="MM/YY" value={card.expiry}
                  onChange={e => setCard({...card, expiry: e.target.value})} maxLength={5} />
                <input placeholder="CVC" value={card.cvc}
                  onChange={e => setCard({...card, cvc: e.target.value})} maxLength={4} />
              </div>
              <div className="secure-notice">🔒 Secured by 256-bit SSL encryption · Demo mode — no real charge</div>
            </div>
          ) : (
            <div className="paypal-section">
              <div className="paypal-box">
                <div className="paypal-logo">PayPal</div>
                <p>You will be redirected to PayPal to complete payment securely.</p>
                <div className="secure-notice">🔒 Demo mode — no real charge</div>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            <button className="btn-secondary" onClick={() => setStep('plan')}>← Back</button>
            <button className="btn-primary" onClick={handlePay} disabled={processing}>
              {processing ? 'Processing...' : `Pay €${plan.price} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
