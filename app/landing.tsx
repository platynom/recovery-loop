'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Intro from './intro';

type Rail = {
  rail: string; rlNet: number; rlAtt: number; rlRec: number; rlStr: number; rlPer: number;
  flNet: number; flAtt: number; flRec: number; flPer: number; diff: number; won: number;
};
type Point = { cap: number; rails: Rail[] };
export type Sweep = { frozenCap: number; seeds: number; points: Point[] };

const inr = (n: number) => '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
const signed = (n: number) => (n >= 0 ? '+' : '−') + inr(n);
const mean1 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ── reveal-on-scroll ─────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.rv'));
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e, i) => {
        if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 70); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

/* ── count-up ─────────────────────────────────────────────────── */
function useCountUp(target: number, ms = 1400) {
  // Initialised to the true value so server-rendered HTML and reduced-motion
  // users see the real number; the animation only ever runs inside rAF.
  const [v, setV] = useState(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ── hero canvas: payment attempts resolving ──────────────────── */
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let raf = 0, w = 0, h = 0;
    const dots: { x: number; y: number; s: number; a: number; ok: boolean; r: number }[] = [];
    const resize = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const spawn = () => {
      if (dots.length > 90) return;
      dots.push({ x: Math.random() * w, y: h + 12, s: 0.28 + Math.random() * 0.55, a: 0, ok: Math.random() > 0.34, r: 1.1 + Math.random() * 2.1 });
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (Math.random() < 0.42) spawn();
      for (let i = dots.length - 1; i >= 0; i--) {
        const p = dots[i];
        p.y -= p.s; p.a = Math.min(1, p.a + 0.012);
        if (p.y < -14) { dots.splice(i, 1); continue; }
        const fade = p.y < h * 0.42 ? Math.max(0, p.y / (h * 0.42)) : 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.ok ? `rgba(34,192,168,${0.5 * p.a * fade})` : `rgba(201,83,77,${0.36 * p.a * fade})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize', resize); draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} aria-hidden />;
}

/* ── rail card ────────────────────────────────────────────────── */
function RailCard({ r, seeds }: { r: Rail; seeds: number }) {
  const win = r.won >= 8;
  const lose = r.won <= 2;
  const inconclusive = !win && !lose;
  const cls = win ? 'win' : lose ? 'lose' : '';
  const pct = Math.min(100, (Math.abs(r.diff) / 1_200_000) * 100);
  return (
    <div className={`rail ${cls}`}>
      <header>
        <strong>{r.rail}</strong>
        <span className={`pill ${win ? 'win' : lose ? 'lose' : 'inc'}`}>
          {win ? `wins ${r.won}/${seeds}` : lose ? `loses ${seeds - r.won}/${seeds}` : `inconclusive ${r.won}/${seeds}`}
        </span>
      </header>
      <div className={`delta ${r.diff >= 0 ? 'win' : 'lose'}`}>{signed(r.diff)}</div>
      <div className="bar"><i className={r.diff >= 0 ? 'win' : 'lose'} style={{ width: `${pct / 2}%` }} /></div>
      <dl>
        <div><dt>Attempts spent</dt><dd>{mean1(r.rlAtt)}<small>vs {mean1(r.flAtt)}</small></dd></div>
        <div><dt>Payments recovered</dt><dd>{mean1(r.rlRec)}<small>vs {mean1(r.flRec)}</small></dd></div>
        <div><dt>Net per attempt</dt><dd>{inr(r.rlPer)}<small>vs {inr(r.flPer)}</small></dd></div>
        <div><dt>Attempts stranded</dt><dd>{mean1(r.rlStr)}</dd></div>
      </dl>
      <p className="why" style={{ marginTop: 14, fontSize: 11 }}>Counts are means across {seeds} seeds, so they carry a decimal.</p>
      {inconclusive && <p className="why" style={{ marginTop: 10, fontSize: 11.5 }}>Reported as inconclusive — the seed range crosses zero.</p>}
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────── */
export default function Landing({ sweep }: { sweep: Sweep }) {
  useReveal();
  const caps = useMemo(() => sweep.points.map((p) => p.cap), [sweep]);
  const frozenIdx = Math.max(0, caps.indexOf(sweep.frozenCap));
  const [idx, setIdx] = useState(frozenIdx);
  const point = sweep.points[idx];
  const upi = point.rails.find((r) => /upi/i.test(r.rail)) ?? point.rails[0];
  const headline = sweep.points[frozenIdx].rails.find((r) => /upi/i.test(r.rail))!.diff;
  const counted = useCountUp(headline);

  const why = (cap: number) =>
    cap < 14
      ? `At ${cap} days the agent is forced to decide before the customer's next salary credit arrives. It conserves attempts it can never spend, and on UPI ${mean1(upi.rlStr)} of them expire unused.`
      : cap === 14
        ? 'At 14 days, deferral first spans a salary cycle. The agent can wait for the credit that actually funds the payment — this is the frozen, validated cap.'
        : `At ${cap} days the agent can still reach payday, but waits longer than it needs to and gives back part of the gain.`;

  return (
    <div className="lp">
      <Intro amount={headline} seeds={sweep.seeds} />
      {/* HERO */}
      <header className="hero">
        <HeroCanvas />
        <div className="hero-in">
          <span className="badge"><i />Razorpay AI Buildathon · Revenue Recovery</span>
          <h1>When is it worth retrying<br />a failed payment — and<br />when is <em>refusing</em> better?</h1>
          <p>Razorpay retries on a fixed calendar: day one, day two, day three, then it halts. NPCI gives each UPI mandate one attempt plus three retries, non-transferable. This agent decides which of them are worth spending.</p>
          <div className="proof">
            <b>{signed(counted)}</b>
            <span>net revenue · {sweep.seeds} of {sweep.seeds} held-out seeds</span>
          </div>
          <div className="cta">
            <Link className="btn p" href="/console">Open the console →</Link>
            <Link className="btn s" href="/why">Why this problem →</Link>
          </div>
        </div>
        <span className="scroll-hint">scroll</span>
      </header>

      {/* PROBLEM */}
      <section>
        <p className="eyb rv">The problem</p>
        <h2 className="rv">Three systems that never talk to each other.</h2>
        <p className="lede rv">Every signal needed to retry intelligently already exists inside Razorpay. None of it reaches the retry scheduler.</p>
        <div className="prob">
          <article className="rv"><i>01</i><h3>A fixed calendar</h3><p>Subscription charges retry at T+1, T+2 and T+3, then the mandate halts. The same three days for every failure, whatever caused it.</p></article>
          <article className="rv"><i>02</i><h3>A hard budget</h3><p>NPCI allows one attempt plus three retries per UPI AutoPay mandate. Non-transferable — an attempt saved on one customer cannot be spent on another.</p></article>
          <article className="rv"><i>03</i><h3>An unused signal</h3><p>Razorpay publishes a live issuer-downtime feed and runs an ML router that, <a href="https://razorpay.com/docs/payments/optimizer/dynamic-routing/" target="_blank" rel="noreferrer">by their own documentation</a>, reroutes within twenty minutes of a gateway degrading. Neither is wired to retries.</p></article>
        </div>
      </section>

      {/* FINDING — slider */}
      <section className="find">
        <div className="find-in">
          <p className="eyb rv">The finding</p>
          <h2 className="rv">One parameter decides whether refusing pays.</h2>
          <p className="lede rv">How long the agent may defer before it is forced to act. Drag it. Every number below is measured on {sweep.seeds} held-out seeds the cap was never chosen on.</p>

          <div className="sl-wrap rv">
            <div className="sl-head">
              <strong>Maximum deferral</strong>
              <b>{point.cap}<small>days</small></b>
            </div>
            <input
              className="cap" type="range" min={0} max={caps.length - 1} step={1} value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              aria-label="Maximum deferral in days"
            />
            <div className="ticks">
              {caps.map((c, i) => (
                <span key={c} className={`${i === idx ? 'on' : ''} ${c === sweep.frozenCap ? 'frozen' : ''}`} onClick={() => setIdx(i)}>{c}d</span>
              ))}
            </div>
            <p className="why">{why(point.cap)}</p>
            <div className="rails">
              {point.rails.map((r) => <RailCard key={r.rail} r={r} seeds={sweep.seeds} />)}
            </div>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section className="meth">
        <div className="meth-in">
          <p className="eyb rv">How it was measured</p>
          <h2 className="rv">Six ways this result could have been wrong.</h2>
          <p className="lede rv">Each was found, documented, and corrected. The numbers before and after are in the repository.</p>
          <ol className="tl">
            <li className="rv"><i>1</i><div><strong>Circular ground truth</strong><p>Success was defined as a random draw falling below the model&apos;s own prediction — the agent graded its own homework. Rebuilt so outcomes come from hidden world state the model never sees. The advantage collapsed from <code>2.5×</code> to nothing.</p></div></li>
            <li className="rv"><i>2</i><div><strong>Silent schema break</strong><p>The simulator emitted an old field shape after the diagnosis layer changed. Every policy silently recovered <code>₹0</code>. A generator assertion now fails loudly instead.</p></div></li>
            <li className="rv"><i>3</i><div><strong>Discarded deferrals</strong><p>Deferred retries were scheduled with a valid time and then thrown away by a one-line filter. Recovery was being deleted, not measured.</p></div></li>
            <li className="rv"><i>4</i><div><strong>Pooled vs per-mandate</strong><p>The budget was modelled as one shared pool. NPCI&apos;s cap is per mandate and non-transferable — a category error that inverted the result.</p></div></li>
            <li className="rv"><i>5</i><div><strong>Zero-attempt artifact</strong><p>Real NPCI baselines were fed to a gate designed for outage spikes, so it read every bank as permanently down and made <code>0</code> attempts. A policy that never acts has not been measured.</p></div></li>
            <li className="rv"><i>6</i><div><strong>Refuse / wait conflation</strong><p>Economic refusals were treated as terminal, so 98% of mandates were abandoned at t=0 and never revisited. Separating hard stops from deferrals is what exposed the deferral cap itself.</p></div></li>
          </ol>
        </div>
      </section>

      {/* LIMITS */}
      <section className="lim">
        <p className="eyb rv">Honest limits</p>
        <h2 className="rv">What this does not prove.</h2>
        <ul>
          <li className="rv">No real merchant retry data exists publicly. Card network rules and PCI-DSS make retry chains unpublishable, so outcomes come from a simulator calibrated to NPCI&apos;s published bank-level decline rates.</li>
          <li className="rv">Ground truth is authored. It is independent of the prediction model, and survives ±25% perturbation of every rule that moves the result — but the same person wrote both.</li>
          <li className="rv">Cards is inconclusive: 6 of 10 seeds, and the range crosses zero. It is not reported as a win anywhere.</li>
          <li className="rv">The NPCI-calibrated cohort contains only business-decline and technical-decline classes, because that is the split NPCI publishes. Other failure paths are implemented and unit-tested but not exercised here.</li>
        </ul>
      </section>

      {/* CLOSE */}
      <section className="close">
        <h2 className="rv">Open it and press the outage button.</h2>
        <p className="lede rv" style={{ margin: '0 auto 28px' }}>The console runs the same policy on a live decision stream. Take a bank down and watch pending retries turn into deferrals.</p>
        <div className="cta rv">
          <Link className="btn p" href="/console">Open the console →</Link>
          <Link className="btn s" style={{ borderColor: '#c6d5d5', color: '#2c4a50' }} href="/why">Why this problem</Link>
        </div>
      </section>

      <div className="foot">
        <span>Recovery Loop · Razorpay AI Buildathon, Track 03 ·</span>
        <span>Test mode only · every figure from committed evidence: <a href="https://github.com/platynom/recovery-loop/tree/master/data/evaluation" target="_blank" rel="noreferrer">results</a> · <a href="https://github.com/platynom/recovery-loop/blob/master/docs/LIMITATIONS.md" target="_blank" rel="noreferrer">limitations</a> · <a href="https://github.com/platynom/recovery-loop" target="_blank" rel="noreferrer">repo</a></span>
      </div>
    </div>
  );
}
