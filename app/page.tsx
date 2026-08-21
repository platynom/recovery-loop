'use client';

import { useState } from 'react';

const decisions = [
  { id: 'pay_8K2M', bank: 'HDFC', rail: 'UPI AutoPay', amount: '₹1,299', status: 'Retry', score: '84%', time: '10:42' },
  { id: 'pay_1Q7A', bank: 'SBI', rail: 'eMandate', amount: '₹499', status: 'Wait', score: '62%', time: '10:40' },
  { id: 'pay_9P3L', bank: 'Axis', rail: 'UPI AutoPay', amount: '₹2,499', status: 'Refuse', score: '21%', time: '10:38' },
  { id: 'pay_4N8C', bank: 'ICICI', rail: 'Cards', amount: '₹899', status: 'Retry', score: '77%', time: '10:35' },
];

export default function Home() {
  const [outage, setOutage] = useState(false);
  const [selected, setSelected] = useState<(typeof decisions)[number] | null>(null);

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
          <div className="top-actions"><span className="last-sync">● Live · updated now</span><button className={outage ? 'outage active-outage' : 'outage'} onClick={() => setOutage(!outage)}><span>⚡</span>{outage ? 'End HDFC outage' : 'Simulate outage'}</button><button className="avatar" aria-label="Account menu">AK</button></div>
        </header>

        {outage && <div className="incident" role="alert"><span>!</span><div><strong>HDFC UPI outage is active</strong><p>4 pending retries were refused. Estimated attempts protected: ₹37.20</p></div><button onClick={() => setOutage(false)}>Dismiss</button></div>}

        <section className="hero-grid" id="overview">
          <article className="recovery-card">
            <div className="card-heading"><div><p className="eyebrow">Recovered this month</p><h2>₹2,84,610</h2></div><span className="trend">↑ 18.4%</span></div>
            <div className="chart" aria-label="Recovered revenue increased over the past 30 days">
              <div className="chart-y"><span>₹12k</span><span>₹8k</span><span>₹4k</span><span>₹0</span></div>
              <div className="chart-area"><i/><b/><em/><span className="chart-tag">₹11.2k</span></div>
            </div>
            <div className="chart-footer"><span>01 Aug</span><span>08 Aug</span><span>15 Aug</span><span>22 Aug</span></div>
          </article>

          <article className="budget-card" id="budget">
            <div className="card-heading"><div><p className="eyebrow">Attempt budget</p><h3>68% used</h3></div><button className="dots" aria-label="Budget options">•••</button></div>
            <div className="donut" aria-label="68 percent of attempt budget used"><div><strong>6,842</strong><span>of 10,000</span></div></div>
            <div className="budget-stats"><span><i className="teal"/>Recovered <strong>2,316</strong></span><span><i/>Refused <strong>1,044</strong></span></div>
            <p className="budget-note">At this pace, you’ll finish the month with <strong>1,240 attempts remaining.</strong></p>
          </article>
        </section>

        <section className="metric-row">
          <article><span className="metric-icon cyan">₹</span><div><p>Revenue / attempt</p><strong>₹41.60</strong><small>↑ ₹6.20 vs baseline</small></div></article>
          <article><span className="metric-icon green">↗</span><div><p>Recovery rate</p><strong>33.8%</strong><small>↑ 4.1% this month</small></div></article>
          <article><span className="metric-icon amber">⌛</span><div><p>Attempts protected</p><strong>1,044</strong><small>₹9,710 cost avoided</small></div></article>
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
              <div><span>Recovery Loop</span><i><b style={{width:'100%'}}/></i><strong>₹41.6</strong></div>
              <div><span>T+1 / T+2 / T+3</span><i><b className="baseline" style={{width:'79%'}}/></i><strong>₹33.1</strong></div>
              <div><span>Payday heuristic</span><i><b className="baseline" style={{width:'66%'}}/></i><strong>₹27.4</strong></div>
              <div><span>Do nothing</span><i><b className="baseline" style={{width:'31%'}}/></i><strong>₹12.8</strong></div>
            </div>
            <p className="evidence-note"><span>i</span> Demo values use a labeled simulation. Production claims require merchant test data.</p>
          </article>
        </section>

        <section className="value-strip">
          <div><p className="eyebrow">Commercial case</p><h3>Turn failed subscriptions into retained revenue.</h3><p>At 50,000 failed renewals per month, this simulation projects <strong>₹4.7L in incremental monthly recovery</strong> while avoiding 8,900 low-value attempts.</p></div>
          <div className="value-actions"><span><b>₹56.4L</b> annualized value</span><button onClick={() => document.getElementById('decisions')?.scrollIntoView({behavior:'smooth'})}>Inspect the evidence →</button></div>
        </section>
      </section>

      {selected && <div className="drawer-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <aside className="inspector" role="dialog" aria-modal="true" aria-labelledby="inspector-title" onClick={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setSelected(null)} aria-label="Close inspector">×</button>
          <p className="eyebrow">Decision inspector</p><h2 id="inspector-title">{selected.id}</h2><p className="inspector-sub">{selected.amount} · {selected.bank} {selected.rail}</p>
          <div className="decision-call"><span className={`status ${selected.status.toLowerCase()}`}>{selected.status}</span><strong>{selected.status === 'Retry' ? 'Retry in 4 hours' : selected.status === 'Wait' ? 'Hold until rail stabilizes' : 'Do not spend an attempt'}</strong><p>Expected recovery value clears the current attempt price with a calibrated safety margin.</p></div>
          <h3>Decision inputs</h3>
          <dl><div><dt>Recovery probability</dt><dd>{selected.score}</dd></div><div><dt>Attempt price</dt><dd>₹9.30</dd></div><div><dt>Expected value</dt><dd>₹{selected.status === 'Refuse' ? '5.20' : '34.80'}</dd></div><div><dt>Bank decline rate</dt><dd>{selected.bank === 'SBI' ? '7.2%' : '1.8%'}</dd></div></dl>
          <h3>Why this decision</h3><p className="explanation">The bank rail is within its normal operating range, the retry budget has capacity, and this payment’s predicted recovery value exceeds the cost threshold.</p>
          <div className="audit-stamp"><span>✓</span><div><strong>Policy checks passed</strong><p>No issuer stop signal · attempt 1 of 3 · full audit record</p></div></div>
        </aside>
      </div>}
    </main>
  );
}
