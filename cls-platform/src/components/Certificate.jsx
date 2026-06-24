import { useRef } from 'react'

export default function Certificate({ data, user, onBack }) {
  const certRef = useRef()

  const certCode = `CLS-${String(data?.module?.id || 1).padStart(3,'0')}-${user.name.split(' ').map(n=>n[0]).join('')}-${Date.now().toString(36).toUpperCase()}`
  const issuedDate = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const validUntil = new Date(); validUntil.setFullYear(validUntil.getFullYear() + 2)
  const validDate  = validUntil.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  const handlePrint = () => window.print()

  const handleDownload = () => {
    const el = certRef.current
    const html = `<!DOCTYPE html><html><head><title>CLS Certificate</title>
    <style>
      body { margin:0; font-family: Georgia, serif; background:#fff; }
      .cert { width:800px; min-height:560px; margin:20px auto; padding:50px; border:8px double #1e3a5f; position:relative; }
      .cert-header { text-align:center; border-bottom:3px solid #1e3a5f; padding-bottom:20px; margin-bottom:30px; }
      .cert-logo { font-size:28px; font-weight:bold; color:#1e3a5f; letter-spacing:3px; }
      .cert-subtitle { color:#666; font-size:13px; margin-top:5px; }
      .cert-title { font-size:36px; color:#1e3a5f; text-align:center; margin:20px 0 10px; }
      .cert-body { text-align:center; }
      .cert-name { font-size:28px; color:#c5a028; font-style:italic; margin:15px 0; border-bottom:2px solid #c5a028; display:inline-block; padding:0 40px 8px; }
      .cert-module { font-size:18px; color:#1e3a5f; font-weight:bold; margin:15px 0; }
      .cert-score { font-size:22px; color:#22c55e; margin:10px 0; }
      .cert-meta { display:flex; justify-content:space-between; margin-top:40px; font-size:12px; color:#666; }
      .cert-seal { position:absolute; right:50px; bottom:80px; width:80px; height:80px; border-radius:50%; background:#1e3a5f; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; text-align:center; font-weight:bold; }
      .cert-valid { color:#ef4444; font-size:13px; margin-top:20px; }
    </style></head><body>
    ${el.innerHTML}
    </body></html>`
    const blob = new Blob([html], { type:'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `CLS_Certificate_${certCode}.html`
    a.click()
  }

  return (
    <div className="certificate-page">
      <div className="cert-controls no-print">
        <button onClick={onBack} className="btn-back">← Dashboard</button>
        <h2>🏆 Certificate Earned!</h2>
        <div className="cert-actions">
          <button className="btn-secondary" onClick={handlePrint}>🖨 Print</button>
          <button className="btn-primary" onClick={handleDownload}>⬇ Download HTML</button>
        </div>
      </div>

      <div className="cert" ref={certRef}>
        <div className="cert-header">
          <div className="cert-logo">✈ CLS — CLEAR LEADERSHIP SYSTEMS</div>
          <div className="cert-subtitle">Aviation Training & Development · IATA Aligned CBT Platform</div>
        </div>

        <div className="cert-body">
          <div className="cert-title">Certificate of Completion</div>
          <p style={{ textAlign:'center', color:'#666' }}>This is to certify that</p>
          <div className="cert-name">{user.name}</div>
          <p style={{ textAlign:'center', color:'#666', marginTop:'15px' }}>of <strong>{user.company}</strong> has successfully completed</p>
          <div className="cert-module">{data?.module?.title || 'Aviation Training Module'}</div>
          <div className="cert-score">Score: {data?.score || 0}% — {data?.type === 'exam' ? 'Final Examination' : 'Practice Assessment'}</div>
          <p style={{ color:'#888', fontSize:'13px' }}>Meeting the IATA standard pass score of 80% required for certification</p>
        </div>

        <div className="cert-meta">
          <div>
            <div><strong>Certificate ID:</strong> {certCode}</div>
            <div><strong>Issued:</strong> {issuedDate}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ borderTop:'2px solid #1e3a5f', paddingTop:'5px', marginTop:'30px', width:'200px' }}>
              CLS Training Authority
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div><strong>Valid Until:</strong> {validDate}</div>
            <div className="cert-valid">Renewal required after 2 years</div>
          </div>
        </div>

        <div className="cert-seal">CLS<br/>CERTIFIED<br/>✈</div>
      </div>
    </div>
  )
}
