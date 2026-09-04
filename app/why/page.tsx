import Link from 'next/link';
import '../landing.css';

export const metadata = {
  title: 'Why this problem — Recovery Loop',
  description: 'Why failed subscription payments, where the data came from, and how the agent decides.',
};

export default function Why() {
  return (
    <div className="lp">
      <nav className="doc-top">
        <div>
          <Link href="/">← Back</Link>
          <Link className="go" href="/console">Open the console →</Link>
        </div>
      </nav>

      <header className="doc-hero">
        <p className="eyb">The case</p>
        <h1>Why this problem, where the<br />data came from, and how it&apos;s solved.</h1>
        <p>Recovery Loop was not chosen because retries are interesting. It was chosen because Razorpay publishes every signal needed to retry well, and none of it reaches the retry scheduler.</p>
        <p className="dateline"><strong>Still open as of 4 September 2026.</strong> Every claim below was re-checked against the live pages on that date, not taken from an earlier reading. Razorpay&apos;s documentation carries no publication date, so where a page is quoted it is also archived as a dated screenshot in the repository — the quote can be checked against the live page today.</p>
      </header>

      <div className="doc">

        {/* WHY */}
        <section>
          <p className="eyb">01 — Why this problem</p>
          <h2>Payments that fail without anyone choosing to leave.</h2>
          <p>A subscription charge fails because a balance was low, a bank timed out, or a card expired. The customer never cancelled. The industry calls this <strong>involuntary churn</strong>, and subscription-billing vendors such as Recurly and Chargebee commonly put it between a fifth and two-fifths of all cancellations. That range is vendor-published, not independently verified here.</p>

          <h3>What Razorpay does today</h3>
          <p>Their documentation is explicit about the retry model for subscriptions:</p>
          <blockquote>
            &ldquo;In a T+3 days cycle, we will retry the payment thrice. That is, once every day for 3 days, excluding the date of the charge.&rdquo; — after which the subscription moves to <code>halted</code>.
            <cite><a href="https://razorpay.com/docs/payments/subscriptions/payment-retries/" target="_blank" rel="noreferrer">razorpay.com/docs/payments/subscriptions/payment-retries/</a> · <strong>still live and quoted verbatim, 4 September 2026</strong> · <a href="https://github.com/platynom/recovery-loop/tree/master/docs/recording-assets" target="_blank" rel="noreferrer">archived screenshot</a></cite>
          </blockquote>
          <p>The same three days for every failure, whatever caused it. No signal is consumed.</p>

          <h3>Why that matters more in India than elsewhere</h3>
          <p>NPCI allows <strong>one attempt plus three retries per UPI AutoPay mandate</strong>, and those attempts are non-transferable — an attempt saved on one customer cannot be spent on another. Executions are also barred during peak windows. These caps took effect on <strong>1 August 2025</strong> under NPCI&apos;s UPI API guidelines, and the RBI rewrote India&apos;s recurring-payment rules on <strong>21 April 2026</strong> — repealing eight earlier circulars. The RBI framework this agent is built against is under five months old. Card rails elsewhere allow far more attempts, so Western retry engines optimise under a constraint India does not share.</p>

          <h3>The gap that made this worth building</h3>
          <p>Razorpay already runs the two systems a good retry policy needs, and fences both off from retries:</p>
          <blockquote>
            &ldquo;Optimizer rules apply only for the first-time registration payment. All subsequent debits happen on the same terminal used for registration payment. Optimizer Rules will not be applicable for subsequent payments.&rdquo;
            <cite><a href="https://razorpay.com/docs/payments/optimizer/recurring-payments/" target="_blank" rel="noreferrer">razorpay.com/docs/payments/optimizer/recurring-payments/</a> · <strong>still live and quoted verbatim, 4 September 2026</strong></cite>
          </blockquote>
          <p>Their Payment Downtime API detects issuer outages and is advisory only — the merchant is told, and decides alone. So a retry can fire straight into an outage Razorpay itself has already published.</p>
        </section>

        {/* STILL OPEN */}
        <section>
          <p className="eyb">01b — Is this still a problem?</p>
          <h2>Razorpay says it is. Twice.</h2>
          <p>A fair objection to any hackathon entry is that the gap may have closed while it was being built. Three independent things say it has not.</p>

          <h3>1. The documentation is unchanged today</h3>
          <p>Both quotes above were re-fetched from the live pages on <strong>4 September 2026</strong> — the day this was written, not weeks earlier. The T+3 ladder still stands. The Optimizer exclusion still stands. The retry documentation still contains <strong>no mention of downtime signals, issuer health, or configurable retry logic</strong>. Nothing has been fixed while this was being built.</p>

          <h3>2. Razorpay announced a product to fix it — and is still building it</h3>
          <p>On <strong>12 March 2026</strong> Razorpay launched Agent Studio, described as built on Anthropic&apos;s Claude Agent SDK. Its catalogue still lists this as a prebuilt agent, with no general-availability or pricing page for it <strong>as of 4 September 2026</strong>:</p>
          <blockquote>
            &ldquo;<strong>Subscription Recovery</strong> — Analyzes failed subscription payments, apply smarter retry logic, and trigger targeted customer nudges.&rdquo;
            <cite><a href="https://razorpay.com/agent-studio/" target="_blank" rel="noreferrer">razorpay.com/agent-studio</a> · announced 12 March 2026 · <strong>catalogue checked 4 September 2026</strong></cite>
          </blockquote>
          <p>Announced in March and still not generally available in September is a reasonable signal that the gap is open.</p>

          <h3>3. What they have shipped is a rule engine, not a decision system</h3>
          <p>Their UPI AutoPay &ldquo;Intelligent Revenue-Protect&rdquo;, announced the same day — <strong>12 March 2026</strong> — lets merchants &ldquo;configure their own retry strategies&rdquo; and &ldquo;define retry cadence, choose predefined templates, or create custom templates&rdquo;. That is a better calendar. Their published material for it mentions no downtime signal, no prediction, no confidence, and no attempt budgeting.</p>
          <p className="dateline">This project does not claim Razorpay is unaware of the problem. It claims something narrower and checkable: the signals to solve it are already published, they are not wired to retries, and I could not find the parameter that decides whether refusing pays measured anywhere public.</p>
        </section>

        {/* DATA */}
        <section>
          <p className="eyb">02 — Where the data came from</p>
          <h2>What is real, and what is not.</h2>
          <p>I could not find transaction-level retry data published anywhere public. Card network rules treat authorisation responses as confidential scheme data, and no processor publishes retry chains at transaction level. Every source below was checked and is labelled by tier.</p>

          <div className="srcs">
            <article>
              <span className="tier obs">Observed</span>
              <h4>Razorpay test-mode captures</h4>
              <p>20 real payment entities captured from the Razorpay Test API, redacted at capture time and committed. Five carry a <code>DCBL</code> issuer that joins to the downtime feed. They establish the real error tuple shape.</p>
              <p className="src-date">Captured 22 August – 1 September 2026 · Razorpay Test API</p>
              <a href="https://github.com/platynom/recovery-loop/tree/master/data/raw_events" target="_blank" rel="noreferrer">See the raw events →</a>
            </article>
            <article>
              <span className="tier real">Real · calibration</span>
              <h4>NPCI UPI AutoPay statistics</h4>
              <p>Monthly, per payer PSP: volume, approved %, business-decline % and technical-decline %. This is auto-debit mandate data specifically — the same object this agent operates on. Per-bank baselines are fitted from it.</p>
              <p className="src-date">Covers January 2025 – July 2026 · fetched 22 August 2026</p>
              <p className="src-note">NPCI moved its statistics to <code>/product/</code> paths; the older <code>/what-we-do/</code> URLs now 404. Both the live page and our capture are linked.</p>
              <a href="https://www.npci.org.in/product/ecosystem-statistics/autopay" target="_blank" rel="noreferrer">NPCI AutoPay statistics →</a>
              <a className="alt" href="https://github.com/platynom/recovery-loop/blob/master/data/npci/autopay-payer-psp-execution-2025-01_to_2026-07-fetched-2026-08-22.json" target="_blank" rel="noreferrer">Our captured data →</a>
            </article>
            <article>
              <span className="tier real">Real · calibration</span>
              <h4>NPCI NACH returns &amp; incident log</h4>
              <p>Destination-bank returns split into financial and non-financial declines — the real soft/hard partition — plus response timing, and a reportable-incident log used to shape outage windows.</p>
              <p className="src-date">Covers January 2025 – June 2026 · fetched 22 August 2026</p>
              <p className="src-note">Source: NPCI, <em>NACH Ecosystem Statistics — Destination Bankwise</em> (npci.org.in). Captured and committed for the same reason.</p>
              <a href="https://github.com/platynom/recovery-loop/blob/master/data/npci/nach-destination-bank-returns-2025-01_to_2026-06-fetched-2026-08-22.json" target="_blank" rel="noreferrer">See the captured data →</a>
            </article>
            <article>
              <span className="tier sec">External benchmark</span>
              <h4>ONS Direct Debit failure rate</h4>
              <p>UK government statistics from real Bacs clearing traffic, monthly since 2019, by sector. Used only to sanity-check the order of magnitude of recurring-payment failure — a different rail, never fed into the simulator.</p>
              <p className="src-date">Series January 2019 – July 2026 · 2026 edition · downloaded 23 August 2026</p>
              <a href="https://www.ons.gov.uk/economy/economicoutputandproductivity/output/datasets/monthlydirectdebitfailurerateandaveragetransactionamount" target="_blank" rel="noreferrer">ONS dataset (OGL v3.0) →</a>
            </article>
          </div>

          <h3>What had to be assumed</h3>
          <p>Repeat-attempt outcomes, transaction amounts, salary dates, exact outage placement, attempt costs, and the entire cards simulation. Each is listed in the limitations document, and each was perturbed by ±25% to check the result does not depend on it.</p>
        </section>

        {/* HOW */}
        <section>
          <p className="eyb">03 — How it is solved</p>
          <h2>Six steps, and one parameter that decides everything.</h2>
          <ol className="flow">
            <li><i>1</i><div><strong>Ingest</strong><p>Razorpay <code>payment.failed</code> and <code>payment.downtime.*</code> webhooks, HMAC-verified. Raw payloads are stored untouched.</p></div></li>
            <li><i>2</i><div><strong>Diagnose</strong><p>The failure is classified on the tuple <code>(error_source, error_step, error_reason)</code> — not the error code alone, which is a generic 400 bucket. An unmapped tuple is refused, never guessed.</p></div></li>
            <li><i>3</i><div><strong>Check the issuer</strong><p>Is this bank in an active outage, or declining well above its own NPCI-published baseline? This is the signal nothing currently consumes.</p></div></li>
            <li><i>4</i><div><strong>Estimate</strong><p>Recovery probability from the failure class, issuer health, elapsed time, and proximity to the customer&apos;s salary credit.</p></div></li>
            <li><i>5</i><div><strong>Price the attempt</strong><p>With one attempt and three retries and a closing horizon, spending one now means not having it later. That opportunity cost is computed by backward induction and falls to zero at the horizon.</p></div></li>
            <li><i>6</i><div><strong>Act, or refuse</strong><p>Retry, wait and re-evaluate, or stop permanently. Hard stops are terminal; economic refusals are not. Every decision is logged with its inputs.</p></div></li>
          </ol>

          <h3>The parameter that turned out to decide the result</h3>
          <p>How long the agent may defer before being forced to act. The first design capped it at three days — and lost on both rails. Insufficient-funds failures cluster around <strong>salary day</strong>, so a three-day bound means the agent can never wait for the credit that actually funds the payment. It conserves attempts it can never spend, and roughly three thousand per cohort expire unused.</p>
          <p>Raise the bound past a pay cycle and the same agent, unchanged, wins on 10 of 10 held-out seeds. The cap was chosen on one set of seeds, frozen, and validated once on ten it had never seen.</p>

          <div className="split">
            <div>
              <h4>What it does better</h4>
              <ul>
                <li>Recovers ₹28.6 lakh net against the fixed ladder&apos;s ₹17.9 lakh — <strong>+₹10,68,274</strong></li>
                <li>Spends fewer attempts — 4,491.4 against 5,406.3 (means over 10 seeds)</li>
                <li>Recovers more payments — 1,230.4 against 838.5</li>
                <li>Wins on 10 of 10 held-out seeds, positive across a 14–35 day range</li>
              </ul>
            </div>
            <div>
              <h4>What it does not prove</h4>
              <ul>
                <li>Cards is inconclusive: 6 of 10 seeds, range crosses zero</li>
                <li>Outcomes are simulated — no real merchant retry data exists publicly</li>
                <li>Ground truth is authored, though independent of the model</li>
                <li>No live A/B test; the project is locked to test mode</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>See it decide.</h2>
          <p>The console runs the same policy on a live decision stream. Take a bank down and watch pending retries become deferrals.</p>
          <div className="cta" style={{ justifyContent: 'flex-start', marginTop: 22 }}>
            <Link className="btn p" href="/console">Open the console →</Link>
            <Link className="btn s" style={{ borderColor: '#c6d5d5', color: '#2c4a50' }} href="/">Back to the summary</Link>
          </div>
        </section>

      </div>
    </div>
  );
}
