'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type Screen = 'inspector' | 'stream' | 'budget' | 'health' | 'comparison';
type Spread = { mean: number; min: number; max: number };
type PolicyEvidence = {
  name: string;
  attempts: Spread;
  recovered: Spread;
  grossRevenue: Spread;
  netRevenue: Spread;
  netRupeesPerAttempt: Spread;
  unusedAttemptsAtHorizon: Spread;
};
type RailEvidence = {
  rail: string;
  cohortSize: number;
  retriesPerMandate: number;
  policies: PolicyEvidence[];
  pairedNetDifference: Spread;
  seedsWonByRecoveryLoop: number;
  perSeed: unknown[];
};
type EvaluationPayload = {
  fix7Evidence?: { reportedRails?: { upiNpcCalibrated?: RailEvidence; cardsUncalibrated?: RailEvidence } };
};
type Decision = {
  eventId: string;
  action: 'retry' | 'wait' | 'refuse_terminal';
  probability: number;
  attemptPrice?: number;
  expectedValue?: number;
  scheduledAt?: number | null;
  reasons?: string[];
  gate?: { allowed: boolean; reasons: string[] };
  event: { bank: string; rail: string; amount: number; createdAt: number; attemptsUsed?: number };
};
type SimulationPayload = {
  mode: string;
  decisions: Decision[];
  metrics: { totalEvents: number; attempts: number; recovered: number; recoveredRevenue: number; refused: number; waiting: number };
};

const screens: { id: Screen; label: string; eyebrow: string }[] = [
  { id: 'inspector', label: 'Decision inspector', eyebrow: 'Explain one decision' },
  { id: 'stream', label: 'Decision stream', eyebrow: 'Watch the policy act' },
  { id: 'budget', label: 'Attempt budget', eyebrow: 'See attempts strand' },
  { id: 'health', label: 'Issuer health', eyebrow: 'Inject an outage' },
  { id: 'comparison', label: 'Policy comparison', eyebrow: 'Efficiency and revenue' },
];

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
const formatAction = (action: Decision['action']) => action === 'refuse_terminal' ? 'Hard refuse' : action.charAt(0).toUpperCase() + action.slice(1);

function EvidenceTag({ children, tone = 'calibrated' }: { children: React.ReactNode; tone?: 'calibrated' | 'simulated' }) {
  return <span className={`evidence-tag ${tone}`}>{children}</span>;
}

function StatePanel({ state, label, onRetry }: { state: LoadState; label: string; onRetry: () => void }) {
  if (state === 'loading') return <div className="state-panel loading" role="status"><span className="spinner" /><strong>Loading {label}</strong><p>The API is still responding.</p></div>;
  if (state === 'error') return <div className="state-panel error" role="alert"><span>!</span><strong>{label} fetch failed</strong><p>This is an API error, not an empty result.</p><button onClick={onRetry}>Try again</button></div>;
  return <div className="state-panel empty"><span>○</span><strong>No {label} returned</strong><p>The API succeeded, but the result set is empty.</p><button onClick={onRetry}>Refresh</button></div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('inspector');
  const [outage, setOutage] = useState(false);
  const [simulation, setSimulation] = useState<SimulationPayload | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationPayload | null>(null);
  const [simulationState, setSimulationState] = useState<LoadState>('loading');
  const [evaluationState, setEvaluationState] = useState<LoadState>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulationNonce, setSimulationNonce] = useState(0);
  const [evaluationNonce, setEvaluationNonce] = useState(0);
  const loadSimulation = useCallback(() => {
    setSimulationState('loading');
    setSimulationNonce((value) => value + 1);
  }, []);
  const loadEvaluation = useCallback(() => {
    setEvaluationState('loading');
    setEvaluationNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/simulation${outage ? '?outageBank=HDFC' : ''}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Simulation request failed'); return response.json(); })
      .then((payload: SimulationPayload) => {
        setSimulation(payload);
        setSimulationState(payload.decisions?.length ? 'ready' : 'empty');
        if (payload.decisions?.length) setSelectedId((current) => current && payload.decisions.some((item) => item.eventId === current) ? current : payload.decisions[0].eventId);
      })
      .catch((error) => { if (error.name !== 'AbortError') { setSimulation(null); setSimulationState('error'); } });
    return () => controller.abort();
  }, [outage, simulationNonce]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/evaluation', { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Evaluation request failed'); return response.json(); })
      .then((payload: EvaluationPayload) => {
        const reported = payload.fix7Evidence?.reportedRails;
        setEvaluation(payload);
        setEvaluationState(reported?.upiNpcCalibrated && reported?.cardsUncalibrated ? 'ready' : 'empty');
      })
      .catch((error) => { if (error.name !== 'AbortError') { setEvaluation(null); setEvaluationState('error'); } });
    return () => controller.abort();
  }, [evaluationNonce]);

  const decisions = useMemo(() => simulation?.decisions ?? [], [simulation]);
  const selected = decisions.find((item) => item.eventId === selectedId) ?? decisions[0];
  const rails = evaluation?.fix7Evidence?.reportedRails;
  const health = useMemo(() => {
    const issuerEvents = decisions.filter((item) => item.event.bank === 'HDFC');
    return {
      total: issuerEvents.length,
      retry: issuerEvents.filter((item) => item.action === 'retry').length,
      wait: issuerEvents.filter((item) => item.action === 'wait').length,
      refused: issuerEvents.filter((item) => item.action === 'refuse_terminal').length,
    };
  }, [decisions]);

  const showSimulationState = simulationState !== 'ready';
  const showEvaluationState = evaluationState !== 'ready';

  return <main className="dashboard-shell">
    <aside className="sidebar">
      <div className="brand"><span>RL</span><div><strong>Recovery Loop</strong><small>Evidence console</small></div></div>
      <p className="nav-heading">Demo screens</p>
      <nav>{screens.map((item, index) => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => setScreen(item.id)}><i>{index + 1}</i><span><strong>{item.label}</strong><small>{item.eyebrow}</small></span></button>)}</nav>
      <div className="sidebar-proof"><span className="live-dot" /><div><strong>Test mode</strong><small>No live payments attempted</small></div></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><div><p>Razorpay Buildathon · final evidence</p><h1>{screens.find((item) => item.id === screen)?.label}</h1></div><div className="source-key"><EvidenceTag tone="simulated">Simulated</EvidenceTag><EvidenceTag>NPCI-calibrated</EvidenceTag></div></header>

      {screen === 'inspector' && <section className="screen">
        <div className="screen-intro"><div><p className="eyebrow">Decision intelligence</p><h2>One decision, fully exposed.</h2><p>Probability, opportunity cost, safety gate, and action come from the runtime policy response.</p></div><EvidenceTag tone="simulated">Simulated event</EvidenceTag></div>
        {showSimulationState ? <StatePanel state={simulationState} label="decision data" onRetry={loadSimulation} /> : selected && <div className="inspector-grid">
          <article className="decision-summary"><div className="decision-id"><span>{selected.event.bank}</span><div><small>{selected.event.rail}</small><strong>{selected.eventId}</strong></div></div><div className={`action-orb ${selected.action}`}><small>Resulting action</small><strong>{formatAction(selected.action)}</strong></div><p>{selected.reasons?.join('. ') || 'No policy reason was returned.'}</p></article>
          <article className="decision-math"><Metric label="p(success)" value={`${(selected.probability * 100).toFixed(1)}%`} detail="model estimate" /><Metric label="Attempt price" value={typeof selected.attemptPrice === 'number' ? inr.format(selected.attemptPrice) : 'Unavailable'} detail="mandate-local opportunity cost" /><Metric label="Expected value" value={typeof selected.expectedValue === 'number' ? inr.format(selected.expectedValue) : 'Unavailable'} detail="probability × payment value" /><Metric label="Gate verdict" value={selected.gate?.allowed ? 'Pass' : 'Defer / block'} detail={selected.gate?.reasons?.join(', ') || 'No gate reason returned'} /></article>
          <article className="decision-timeline"><p className="eyebrow">Decision trace</p><ol><li><span>1</span><div><strong>Failure classified</strong><small>Observable failure tuple enters the policy.</small></div></li><li><span>2</span><div><strong>Safety gate {selected.gate?.allowed ? 'passed' : 'intervened'}</strong><small>{selected.gate?.reasons?.join('. ') || 'No blocking reason.'}</small></div></li><li><span>3</span><div><strong>{formatAction(selected.action)}</strong><small>{selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString('en-IN') : 'No attempt scheduled.'}</small></div></li></ol></article>
        </div>}
      </section>}

      {screen === 'stream' && <section className="screen">
        <div className="screen-intro"><div><p className="eyebrow">Runtime feed</p><h2>Every choice leaves a reason.</h2><p>Select any row to send it to the inspector.</p></div><EvidenceTag tone="simulated">Simulated stream</EvidenceTag></div>
        {showSimulationState ? <StatePanel state={simulationState} label="decision stream" onRetry={loadSimulation} /> : <article className="stream-card"><div className="stream-meta"><span><i className="live-dot" />API connected</span><strong>{number.format(decisions.length)} decisions returned</strong></div><div className="table-wrap"><table><thead><tr><th>Event</th><th>Issuer / rail</th><th>Amount</th><th>p(success)</th><th>Gate</th><th>Action</th><th /></tr></thead><tbody>{decisions.map((decision) => <tr key={decision.eventId}><td><strong>{decision.eventId}</strong></td><td>{decision.event.bank}<small>{decision.event.rail}</small></td><td>{inr.format(decision.event.amount)}</td><td>{(decision.probability * 100).toFixed(1)}%</td><td><span className={`gate ${decision.gate?.allowed ? 'pass' : 'block'}`}>{decision.gate?.allowed ? 'Pass' : 'Intervene'}</span></td><td><span className={`action-pill ${decision.action}`}>{formatAction(decision.action)}</span></td><td><button onClick={() => { setSelectedId(decision.eventId); setScreen('inspector'); }}>Inspect →</button></td></tr>)}</tbody></table></div></article>}
      </section>}

      {screen === 'budget' && <section className="screen">
        <div className="screen-intro"><div><p className="eyebrow">Per-mandate accounting</p><h2>Conserved attempts do not transfer.</h2><p>The unused count makes the mechanism behind the total-revenue loss visible.</p></div><EvidenceTag>Final evaluation</EvidenceTag></div>
        {showEvaluationState ? <StatePanel state={evaluationState} label="attempt evidence" onRetry={loadEvaluation} /> : <div className="rail-grid">{[
          { data: rails!.upiNpcCalibrated!, label: 'UPI AutoPay', tag: 'NPCI-calibrated' }, { data: rails!.cardsUncalibrated!, label: 'Cards', tag: 'Simulated' },
        ].map(({ data, label, tag }) => {
          const recovery = data.policies.find((item) => item.name === 'Recovery Loop')!;
          const ladder = data.policies.find((item) => item.name !== 'Recovery Loop')!;
          const available = data.cohortSize * data.retriesPerMandate;
          return <article className="budget-card" key={data.rail}><div className="card-head"><div><p className="eyebrow">{label}</p><h3>{number.format(available)} mandate-local retries</h3></div><EvidenceTag tone={tag === 'Simulated' ? 'simulated' : 'calibrated'}>{tag}</EvidenceTag></div><div className="budget-policy"><strong>Recovery Loop</strong><div className="budget-bar"><i style={{ width: `${Math.min(100, recovery.attempts.mean / available * 100)}%` }} /></div><span>{number.format(recovery.attempts.mean)} used</span><b>{number.format(recovery.unusedAttemptsAtHorizon.mean)} stranded</b></div><div className="budget-policy baseline"><strong>Fixed ladder</strong><div className="budget-bar"><i style={{ width: `${Math.min(100, ladder.attempts.mean / available * 100)}%` }} /></div><span>{number.format(ladder.attempts.mean)} used</span><b>{number.format(ladder.unusedAttemptsAtHorizon.mean)} stranded</b></div><p className="mechanism">Each mandate owns its own cap of {number.format(data.retriesPerMandate)} retries. An attempt saved on one mandate cannot fund another.</p></article>;
        })}</div>}
      </section>}

      {screen === 'health' && <section className="screen">
        <div className="screen-intro"><div><p className="eyebrow">Issuer-health join</p><h2>See the scheduler respond to an outage.</h2><p>The scenario changes the runtime simulation; it is not a claim about a real issuer incident.</p></div><EvidenceTag tone="simulated">Simulated outage scenario</EvidenceTag></div>
        {showSimulationState ? <StatePanel state={simulationState} label="issuer-health data" onRetry={loadSimulation} /> : <div className="health-grid"><article className={`issuer-card ${outage ? 'outage-active' : ''}`}><div className="issuer-title"><span>H</span><div><small>Simulated issuer</small><h3>HDFC</h3></div><strong>{outage ? 'Outage injected' : 'Normal state'}</strong></div><div className="health-stats"><Metric label="Events in visible stream" value={number.format(health.total)} /><Metric label="Retry" value={number.format(health.retry)} /><Metric label="Wait" value={number.format(health.wait)} /><Metric label="Hard refuse" value={number.format(health.refused)} /></div><button className={outage ? 'danger-button active' : 'danger-button'} onClick={() => { setSimulationState('loading'); setOutage((value) => !value); }}>{outage ? 'End simulated outage' : 'Inject simulated outage'}</button></article><article className="capture-note"><EvidenceTag tone="simulated">Join limitation</EvidenceTag><h3>Real captures cannot power this demo.</h3><p>The captured Razorpay test-mode failures have both <code>bank</code> and <code>card.issuer</code> set to null. They cannot join to issuer health, so this screen is explicitly simulated.</p><div><span>bank</span><strong>null</strong></div><div><span>card.issuer</span><strong>null</strong></div></article></div>}
      </section>}

      {screen === 'comparison' && <section className="screen">
        <div className="screen-intro"><div><p className="eyebrow">Final honest comparison</p><h2>More efficient. Less total revenue.</h2><p>Both sides of the result are shown together, from the final evaluation artifact.</p></div><EvidenceTag>Final evidence</EvidenceTag></div>
        {showEvaluationState ? <StatePanel state={evaluationState} label="policy comparison" onRetry={loadEvaluation} /> : <div className="comparison-grid">{[
          { data: rails!.upiNpcCalibrated!, label: 'UPI AutoPay', tag: 'NPCI-calibrated' }, { data: rails!.cardsUncalibrated!, label: 'Cards', tag: 'Simulated' },
        ].map(({ data, label, tag }) => {
          const recovery = data.policies.find((item) => item.name === 'Recovery Loop')!;
          const ladder = data.policies.find((item) => item.name !== 'Recovery Loop')!;
          const recoveryEfficiency = recovery.grossRevenue.mean / recovery.attempts.mean;
          const ladderEfficiency = ladder.grossRevenue.mean / ladder.attempts.mean;
          const ratio = recoveryEfficiency / ladderEfficiency;
          return <article className="comparison-card" key={data.rail}><div className="card-head"><div><p className="eyebrow">{label}</p><h3>{ratio.toFixed(1)}× efficiency lead</h3></div><EvidenceTag tone={tag === 'Simulated' ? 'simulated' : 'calibrated'}>{tag}</EvidenceTag></div><div className="comparison-pair"><section><p>Gross rupees / attempt</p><div><span>Recovery Loop</span><strong>{inr.format(recoveryEfficiency)}</strong></div><div><span>Fixed ladder</span><strong>{inr.format(ladderEfficiency)}</strong></div><em>Recovery Loop leads {ratio.toFixed(1)}×</em></section><section className="loss"><p>Total gross revenue</p><div><span>Recovery Loop</span><strong>{inr.format(recovery.grossRevenue.mean)}</strong></div><div><span>Fixed ladder</span><strong>{inr.format(ladder.grossRevenue.mean)}</strong></div><em>Recovery Loop loses {data.seedsWonByRecoveryLoop}/{data.perSeed.length} seeds</em></section></div><footer><span>Paired net difference</span><strong>{inr.format(data.pairedNetDifference.mean)}</strong><small>Recovery Loop minus fixed ladder</small></footer></article>;
        })}</div>}
      </section>}
    </section>
  </main>;
}
