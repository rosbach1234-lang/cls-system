import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, PieChart, Pie } from 'recharts'

const TEAM_DATA = [
  { name:'Ramp Ops',    score:87, passed:14, total:16, risk:'low' },
  { name:'Cargo',       score:72, passed:8,  total:12, risk:'medium' },
  { name:'Check-in',    score:91, passed:11, total:11, risk:'low' },
  { name:'Security',    score:65, passed:6,  total:10, risk:'high' },
  { name:'Management',  score:78, passed:7,  total:9,  risk:'medium' },
  { name:'Supervisors', score:83, passed:9,  total:11, risk:'low' },
]

const TREND_DATA = [
  { month:'Oct', avg:68 }, { month:'Nov', avg:72 }, { month:'Dec', avg:70 },
  { month:'Jan', avg:75 }, { month:'Feb', avg:79 }, { month:'Mar', avg:82 },
]

const COMPLIANCE_DATA = [
  { module:'Ramp Safety', score:87 }, { module:'DG / Cargo', score:72 },
  { module:'Pax Handling', score:91 }, { module:'Emergency', score:65 },
  { module:'Security', score:78 }, { module:'Management', score:83 },
]

const RISK_COLORS = { low:'#22c55e', medium:'#f59e0b', high:'#ef4444' }

export default function CEOAnalytics({ user }) {
  const totalStaff    = TEAM_DATA.reduce((s,d) => s + d.total, 0)
  const totalPassed   = TEAM_DATA.reduce((s,d) => s + d.passed, 0)
  const complianceRate = Math.round((totalPassed / totalStaff) * 100)
  const avgScore       = Math.round(TEAM_DATA.reduce((s,d) => s + d.score, 0) / TEAM_DATA.length)
  const highRisk       = TEAM_DATA.filter(d => d.risk === 'high').length

  return (
    <div className="ceo-analytics">
      <div className="analytics-header">
        <div>
          <h1>CEO Analytics Dashboard</h1>
          <p>{user.company} · Executive View · {new Date().toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</p>
        </div>
        <div className="analytics-badge">Executive Access</div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-value">{complianceRate}%</div>
          <div className="kpi-label">Compliance Rate</div>
          <div className={`kpi-trend ${complianceRate >= 80 ? 'good' : 'warn'}`}>
            {complianceRate >= 80 ? '▲ On Target' : '▼ Below 80%'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{avgScore}%</div>
          <div className="kpi-label">Avg Score</div>
          <div className="kpi-trend good">▲ +14% vs Oct</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalPassed}/{totalStaff}</div>
          <div className="kpi-label">Certified Staff</div>
          <div className="kpi-trend good">✓ {totalPassed} certified</div>
        </div>
        <div className="kpi-card kpi-risk">
          <div className="kpi-value" style={{ color:'#ef4444' }}>{highRisk}</div>
          <div className="kpi-label">High-Risk Departments</div>
          <div className="kpi-trend warn">⚠ Needs attention</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Department Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TEAM_DATA} margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize:11 }} />
              <YAxis domain={[0,100]} tick={{ fontSize:11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="score" radius={[4,4,0,0]}>
                {TEAM_DATA.map((d,i) => <Cell key={i} fill={RISK_COLORS[d.risk]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>6-Month Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA} margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis domain={[60,100]} tick={{ fontSize:11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ fill:'#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Compliance by Module</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={COMPLIANCE_DATA}>
              <PolarGrid />
              <PolarAngleAxis dataKey="module" tick={{ fontSize:10 }} />
              <Radar dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name:'Low Risk',    value: TEAM_DATA.filter(d=>d.risk==='low').length,    fill:'#22c55e' },
                { name:'Medium Risk', value: TEAM_DATA.filter(d=>d.risk==='medium').length, fill:'#f59e0b' },
                { name:'High Risk',   value: TEAM_DATA.filter(d=>d.risk==='high').length,   fill:'#ef4444' },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value}) => `${name}: ${value}`} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="risk-table">
        <h3>Department Risk Heatmap</h3>
        <table>
          <thead>
            <tr><th>Department</th><th>Avg Score</th><th>Certified</th><th>Compliance</th><th>Risk Level</th></tr>
          </thead>
          <tbody>
            {TEAM_DATA.map(d => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.score}%</td>
                <td>{d.passed}/{d.total}</td>
                <td>
                  <div className="mini-bar">
                    <div style={{ width:`${Math.round((d.passed/d.total)*100)}%`, background: RISK_COLORS[d.risk] }} />
                  </div>
                  {Math.round((d.passed/d.total)*100)}%
                </td>
                <td><span className={`risk-badge risk-${d.risk}`}>{d.risk.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
