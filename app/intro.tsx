'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BEATS = [
  { at: 0,    line: 'Every month, subscription payments fail.' },
  { at: 3200, line: 'Nobody chose to cancel.' },
  { at: 6400, line: 'You get three attempts to win them back.' },
];
const REVEAL = 9600;
const END = 13200;

export default function Intro({ amount, seeds }: { amount: number; seeds: number }) {
  const [show, setShow] = useState(true);
  const [t, setT] = useState(0);
  const [closing, setClosing] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  const done = useCallback(() => {
    setClosing(true);
    try { sessionStorage.setItem('rl-intro', '1'); } catch {}
    setTimeout(() => { setShow(false); document.documentElement.setAttribute('data-intro', 'seen'); document.body.style.overflow = ''; }, 620);
  }, []);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('rl-intro') === '1'; } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (started.current) return;
    started.current = true;
    if (seen || reduce) {
      try { sessionStorage.setItem('rl-intro', '1'); } catch {}
      setShow(false);
      document.documentElement.setAttribute('data-intro', 'seen');
      return;
    }
    document.body.style.overflow = 'hidden';
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => { setT(now - t0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const end = setTimeout(done, END);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') done(); };
    window.addEventListener('keydown', esc);
    return () => { cancelAnimationFrame(raf); clearTimeout(end); window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [done]);

  /* failing-payment grid */
  useEffect(() => {
    if (!show) return;
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf = 0; const t0 = performance.now();
    const d = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { c.width = c.clientWidth * d; c.height = c.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    const cells: { x: number; y: number; born: number; fail: boolean }[] = [];
    const draw = (now: number) => {
      const el = now - t0;
      const w = c.clientWidth, h = c.clientHeight;
      const gap = Math.max(26, Math.min(40, w / 34));
      const cols = Math.ceil(w / gap), rows = Math.ceil(h / gap);
      if (cells.length === 0) {
        for (let i = 0; i < cols * rows; i++) {
          cells.push({ x: (i % cols) * gap + gap / 2, y: Math.floor(i / cols) * gap + gap / 2, born: Math.random() * 5600, fail: Math.random() < 0.34 });
        }
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of cells) {
        if (el < p.born) continue;
        const age = el - p.born;
        const a = Math.min(1, age / 420);
        const failing = p.fail && el > 3000;
        const rec = failing && el > REVEAL;
        ctx.beginPath(); ctx.arc(p.x, p.y, rec ? 2.6 : failing ? 2.4 : 1.7, 0, Math.PI * 2);
        ctx.fillStyle = rec ? `rgba(34,192,168,${0.75 * a})`
          : failing ? `rgba(201,83,77,${0.62 * a})`
          : `rgba(140,180,182,${0.2 * a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [show]);

  if (!show) return null;

  const beat = [...BEATS].reverse().find((b) => t >= b.at);
  const revealed = t >= REVEAL;
  const p = Math.min(1, Math.max(0, (t - REVEAL) / 1800));
  const shown = amount * (1 - Math.pow(1 - p, 3));

  return (
    <div className={`intro${closing ? ' out' : ''}`} role="presentation">
      <canvas ref={cv} aria-hidden />
      <div className="intro-in">
        {!revealed && (
          <div className="beats">
            {BEATS.map((b, i) => {
              const next = BEATS[i + 1]?.at ?? REVEAL;
              const on = t >= b.at && t < next;
              return <p key={b.at} className={`beat${on ? ' on' : ''}`} aria-hidden={!on}>{b.line}</p>;
            })}
          </div>
        )}
        {revealed && (
          <div className="reveal">
            <span>recoverable, measured on {seeds} held-out seeds</span>
            <b>+₹{Math.round(shown).toLocaleString('en-IN')}</b>
            <em>Recovery Loop</em>
          </div>
        )}
      </div>
      <button className="skip" onClick={done}>Skip</button>
    </div>
  );
}
