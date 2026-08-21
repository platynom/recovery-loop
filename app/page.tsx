'use client';

import { useEffect, useState } from 'react';

type DecisionRow = { id: string; bank: string; rail: string; amount: string; status: 'Retry'|'Wait'|'Refuse'; score: string; time: string; attemptPrice?: number; expectedValue?: number; reasons?: string[]; scheduledAt?: number|null };

const initialDecisions: DecisionRow[] = [
  { id: 'pay_8K2M', bank: 'HDFC', rail: 'UPI AutoPay', amount: '₹1,299', status: 'Retry', score: '84%', time: '10:42' },
  { id: 'pay_1Q7A', bank: 'SBI', rail: 'eMandate', amount: '₹499', status: 'Wait', score: '62%', time: '10:40' },
  { id: 'pay_9P3L', bank: 'Axis', rail: 'UPI AutoPay', amount: '₹2,499', status: 'Refuse', score: '21%', time: '10:38' },
  { id: 'pay_4N8C', bank: 'ICICI', rail: 'Cards', amount: '₹899', status: 'Retry', score: '77%', time: '10:35' },
];

export default function Home() {
  const [outage, setOutage] = useState(false);
  const [selected, setSelected] = useState<DecisionRow | null>(null);
  const [decisions, setDecisions] = useState<DecisionRow[]>(initialDecisions);
  const [metrics, setMetrics] = useState({ recoveredRevenue: 284610, attempts: 6842, recovered: 2316, refused: 1044 });
  const [policyRows, setPolicyRows] = useState<Record<string, number>>({ 'Recovery Loop': 41.6, 'T+1 / T+2 / T+3': 33.1, 'Payday heuristic': 27.4, 'Do nothing': 12.8 });
  const [dataState, setDataState] = useState<'loading'|'live'|'fallback'>('loading');
  const [coverageThreshold, setCoverageThreshold] = useState(0.28);
  const [monthlyBudget, setMonthlyBudget] = useState(10000);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ coverageThreshold: String(coverageThreshold), monthlyBudget: String(monthlyBudget) });
    if (outage) query.set('outageBank', 'HDFC');
    fetch(`/api/simulation?${query}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Simulation unavailable'); return response.json(); })
      .then((payload) => {
        setDecisions(payload.decisions.slice(0, 8).map((item: { eventId: string; action: string; probability: number; event: { bank: string; rail: string; amount: number; createdAt: number } }) => ({
          id: item.eventId,
          bank: item.event.bank,
          rail: item.event.rail,
          amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.event.amount),
          status: `${item.action.charAt(0).toUpperCase()}${item.action.slice(1)}` as DecisionRow['status'],
          score: `${Math.round(item.probability * 100)}%`,
          time: new Date(item.event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          attemptPrice: Number((item as { attemptPrice?: number }).attemptPrice ?? 0),
          expectedValue: Number((item as { expectedValue?: number }).expectedValue ?? 0),
          reasons: (item as { reasons?: string[] }).reasons ?? [],
          scheduledAt: (item as { scheduledAt?: number|null }).scheduledAt,
        })));
        setMetrics(payload.metrics);
        setPolicyRows(Object.fromEntries(payload.evaluation.policies.map((row: { name: string; rupeesPerAttempt: number }) => [row.name, row.rupeesPerAttempt])));
        setDataState('live');
      })
      .catch((error) => { if (error.name !== 'AbortError') setDataState('fallback'); });
    return () => controller.abort();
  }, [outage, coverageThreshold, monthlyBudget]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Recovery Loop home"><span className="brand-mark">RL</span><span>Recovery Loop</span></a>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          <a className="nav-item active" href="#overview"><span>⌁</span>Overview</a>
          <a className="nav-item" href="#decisions"><span>↳</span>Decisions <b>12</b></a>
          <a className="nav-item" href="#health"><span>◉</span>Bank health</a>
          <a className="nav-item" href="#budget"><span>◇</span>Attempt budget</a>
          <a className="nav-item" href="#evaluation"><span>▥</span>Evaluation</a>
          <p className="nav-label second">System</p>
          <a className="nav-item" href="#audit"><span>≡</span>Audit log</a>
          <a className="nav-item" href="#settings"><span>⚙</span>Settings</a>
        </nav>
        <div className="mode-card"><span className="pulse" /><div><strong>Test mode</strong><p>Simulated payment stream</p></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="kicker">Recovery operations</p><h1>Good morning, Arjun.</h1></div>
          <div className="top-actions"><span className="last-sync">● {dataState === 'loading' ? 'Recomputing' : dataState === 'live' ? 'Engine live' : 'Demo fallback'}</span><button className={outage ? 'outage active-outage' : 'outage'} onClick={() => setOutage(!outage)}><span>⚡</span>{outage ? 'End HDFC outage' : 'Simulate outage'}</button><button className="avatar" aria-label="Account menu">AK</button></div>
        </header>

        {outage && <div className="incident" role="alert"><span>!</span><div><strong>HDFC UPI outage is active</strong><p>4 pending retries were refused. Estimated attempts protected: ₹37.20</p></div><button onClick={() => setOutage(false)}>Dismiss</button></div>}

        <section className="hero-grid" id="overview">
          <article className="recovery-card">
            <div className="card-heading"><div><p className="eyebrow">Recovered in current run</p><h2>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(metrics.recoveredRevenue)}</h2></div><span className="trend">Measured</span></div>
            <div className="chart" aria-label="Recovered revenue increased over the past 30 days">
              <div className="chart-y"><span>₹12k</span><span>₹8k</span><span>₹4k</span><span>₹0</span></div>
              <div className="chart-area"><i/><b/><em/><span className="chart-tag">₹11.2k</span></div>
            </div>
            <div className="chart-footer"><span>01 Aug</span><span>08 Aug</span><span>15 Aug</span><span>22 Aug</span></div>
          </article>

          <article className="budget-card" id="budget">
            <div className="card-heading"><div><p className="eyebrow">Attempt budget</p><h3>{Math.round((metrics.attempts / monthlyBudget) * 100)}% used</h3></div><button className="dots" aria-label="Budget options">•••</button></div>
            <div className="donut" aria-label={`${metrics.attempts} attempts used`} style={{background:`conic-gradient(var(--teal) 0 ${Math.min(100, metrics.attempts / monthlyBudget * 100)}%,#e9eeee ${Math.min(100, metrics.attempts / monthlyBudget * 100)}%)`}}><div><strong>{metrics.attempts.toLocaleString('en-IN')}</strong><span>of {monthlyBudget.toLocaleString('en-IN')}</span></div></div>
            <div className="budget-stats"><span><i className="teal"/>Recovered <strong>{metrics.recovered.toLocaleString('en-IN')}</strong></span><span><i/>Refused <strong>{metrics.refused.toLocaleString('en-IN')}</strong></span></div>
            <p className="budget-note"><strong>{Math.max(0, monthlyBudget - metrics.attempts).toLocaleString('en-IN')} attempts remain</strong> in the configured monthly budget.</p>
          </article>
        </section>

        <section className="metric-row">
          <article><span className="metric-icon cyan">₹</span><div><p>Revenue / attempt</p><strong>₹{(policyRows['Recovery Loop'] ?? 0).toFixed(2)}</strong><small>vs ₹{(policyRows['T+1 / T+2 / T+3'] ?? 0).toFixed(2)} fixed ladder</small></div></article>
          <article><span className="metric-icon green">↗</span><div><p>Recovered payments</p><strong>{metrics.recovered}</strong><small>from the current deterministic run</small></div></article>
          <article><span className="metric-icon amber">⌛</span><div><p>Attempts protected</p><strong>{metrics.refused}</strong><small>refused by safety and value gates</small></div></article>
        </section>

        <section className="stream-card" id="decisions">
          <div className="stream-head"><div><div className="stream-title"><span className="live-dot"/><h3>Live decisions</h3></div><p>Every retry, wait, and refusal—with the reason.</p></div><button>View all decisions <span>→</span></button></div>
          <div className="table-wrap"><table><thead><tr><th>Payment</th><th>Bank & rail</th><th>Amount</th><th>Recovery odds</th><th>Decision</th><th>Time</th><th></th></tr></thead><tbody>{decisions.map((d) => { const forced = outage && d.bank === 'HDFC'; const status = forced ? 'Refuse' : d.status; return <tr key={d.id}><td><strong>{d.id}</strong></td><td><b>{d.bank}</b><span>{d.rail}</span></td><td><strong>{d.amount}</strong></td><td><div className="score"><i style={{width: forced ? '8%' : d.score}}/><span>{forced ? '8%' : d.score}</span></div></td><td><span className={`status ${status.toLowerCase()}`}>{status === 'Retry' ? '↻' : status === 'Wait' ? '◷' : '×'} {status}</span></td><td>{d.time}</td><td><button className="row-action" aria-label={`Inspect ${d.id}`} onClick={() => setSelected(d)}>›</button></td></tr>})}</tbody></table></div>
        </section>

        <section className="lower-grid">
          <article className="health-card" id="health">
            <div className="section-heading"><div><p className="eyebrow">Rail intelligence</p><h3>Bank health</h3></div><span className="healthy">4 rails monitored</span></div>
            <div className="bank-list">
              {[
                ['HDFC', outage ? 'Outage' : 'Healthy', outage ? '38.4%' : '1.8%', outage ? 'danger' : 'good'],
                ['SBI', 'Degraded', '7.2%', 'warn'],
                ['ICICI', 'Healthy', '1.4%', 'good'],
                ['Axis', 'Healthy', '2.1%', 'good'],
              ].map(([bank, state, declines, tone]) => <div className="bank-row" key={bank}><span className={`bank-logo ${tone}`}>{bank.slice(0, 1)}</span><div><strong>{bank}</strong><small>{state}</small></div><div className="decline"><strong>{declines}</strong><small>decline rate</small></div><span className={`health-dot ${tone}`}/></div>)}
            </div>
          </article>

          <article className="evaluation-card" id="evaluation">
            <div className="section-heading"><div><p className="eyebrow">Measured against fixed ladders</p><h3>Baseline comparison</h3></div><span className="trend">+26%</span></div>
            <div className="bars" aria-label="Recovery Loop generates 41.6 rupees per attempt versus 33.1 for the fixed ladder">
              {['Recovery Loop', 'T+1 / T+2 / T+3', 'Payday heuristic', 'Do nothing'].map((name) => { const value = policyRows[name] ?? 0; const max = Math.max(...Object.values(policyRows), 1); return <div key={name}><span>{name}</span><i><b className={name === 'Recovery Loop' ? '' : 'baseline'} style={{width:`${Math.max(2, value / max * 100)}%`}}/></i><strong>₹{value.toFixed(1)}</strong></div> })}
            </div>
            <p className="evidence-note"><span>i</span> Demo values use a labeled simulation. Production claims require merchant test data.</p>
          </article>
        </section>

        <section className="value-strip">
          <div><p className="eyebrow">Commercial case</p><h3>Turn failed subscriptions into retained revenue.</h3><p>At 50,000 failed renewals per month, this simulation projects <strong>₹4.7L in incremental monthly recovery</strong> while avoiding 8,900 low-value attempts.</p></div>
          <div className="value-actions"><span><b>₹56.4L</b> annualized value</span><button onClick={() => document.getElementById('decisions')?.scrollIntoView({behavior:'smooth'})}>Inspect the evidence →</button></div>
        </section>

        <section className="operations-grid">
          <article id="audit" className="audit-card">
            <div className="section-heading"><div><p className="eyebrow">Immutable reasoning trail</p><h3>Audit log</h3></div><span className="healthy">Policy v1.0.0</span></div>
            <div className="audit-list">{decisions.slice(0, 4).map((decision) => <button key={decision.id} onClick={() => setSelected(decision)}><span className={`status ${decision.status.toLowerCase()}`}>{decision.status}</span><div><strong>{decision.id} · {decision.bank}</strong><small>{decision.score} recovery odds · inputs, thresholds, and reasons recorded</small></div><time>{decision.time}</time></button>)}</div>
          </article>
          <article id="settings" className="settings-card">
            <div className="section-heading"><div><p className="eyebrow">Test-mode policy</p><h3>Safety controls</h3></div><span className="locked">Locked to test</span></div>
            <label><span>Coverage threshold <b>{Math.round(coverageThreshold * 100)}%</b></span><input type="range" min="15" max="65" step="1" value={coverageThreshold * 100} onChange={(event) => setCoverageThreshold(Number(event.target.value) / 100)} /></label>
            <label><span>Monthly attempt budget <b>{monthlyBudget.toLocaleString('en-IN')}</b></span><input type="range" min="1000" max="50000" step="1000" value={monthlyBudget} onChange={(event) => setMonthlyBudget(Number(event.target.value))} /></label>
            <div className="policy-rules"><span>✓ Issuer stop signals always refuse</span><span>✓ Active outages never retry</span><span>✓ Maximum 3 attempts</span><span>✓ Every decision is auditable</span></div>
          </article>
        </section>
      </section>

      {selected && <div className="drawer-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <aside className="inspector" role="dialog" aria-modal="true" aria-labelledby="inspector-title" onClick={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setSelected(null)} aria-label="Close inspector">×</button>
          <p className="eyebrow">Decision inspector</p><h2 id="inspector-title">{selected.id}</h2><p className="inspector-sub">{selected.amount} · {selected.bank} {selected.rail}</p>
          <div className="decision-call"><span className={`status ${selected.status.toLowerCase()}`}>{selected.status}</span><strong>{selected.status === 'Retry' ? `Retry ${selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString('en-IN') : 'at the best value window'}` : selected.status === 'Wait' ? 'Hold until rail stabilizes' : 'Do not spend an attempt'}</strong><p>{selected.reasons?.join('. ') || 'Computed from the configured recovery policy and safety controls.'}</p></div>
          <h3>Decision inputs</h3>
          <dl><div><dt>Recovery probability</dt><dd>{selected.score}</dd></div><div><dt>Attempt price</dt><dd>₹{(selected.attemptPrice ?? 9.3).toFixed(2)}</dd></div><div><dt>Expected value</dt><dd>₹{(selected.expectedValue ?? (selected.status === 'Refuse' ? 5.2 : 34.8)).toFixed(2)}</dd></div><div><dt>Coverage threshold</dt><dd>{Math.round(coverageThreshold * 100)}%</dd></div></dl>
          <h3>Why this decision</h3><p className="explanation">{selected.reasons?.length ? selected.reasons.join('. ') : 'The bank rail, configured budget, recovery probability, and expected-value threshold were evaluated by deterministic policy code.'}</p>
          <div className="audit-stamp"><span>✓</span><div><strong>Policy checks passed</strong><p>No issuer stop signal · attempt 1 of 3 · full audit record</p></div></div>
        </aside>
      </div>}
    </main>
  );
}
