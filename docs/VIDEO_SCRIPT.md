# Recovery Loop — five-minute spoken demo

The quoted paragraphs below are the words to say. Directions in italics are recording cues and are not spoken.

## 0:00–0:35 — The problem

*On screen: the local Razorpay Payment Retries capture at `docs/recording-assets/razorpay-payment-retries-2026-08-29.png`. Keep the `pending`, automatic retry, and `halted` flow visible. Show the caption `Live documentation screenshot · captured 29 August 2026`.*

> “When a subscription payment fails in India, Razorpay retries it on day one, day two, day three, and then gives up. Same three days for everyone, whatever went wrong. Meanwhile Razorpay publishes a live feed of which banks are down, and runs a machine-learning router that reacts to a failing gateway inside twenty minutes. Neither of those is connected to the retry scheduler. I wanted to know what connecting them was worth.”

## 0:35–1:05 — The constraint

*On screen: the local NPCI circular-index capture at `docs/recording-assets/npci-upi-circular-index-2026-08-29.png`. Keep the official `UPI | OC No. 215 A | FY 2025-26 | Guidelines on usage of UPI APIs` row visible. Show the caption `Live documentation screenshot · captured 29 August 2026`.*

> “On UPI AutoPay you get one attempt and three retries. That is the entire budget, per mandate, forever. So the question is not how to retry more. It is which three moments are worth spending.”

> “And those attempts cannot move. If I save one on a mandate that never recovers, I cannot spend it on another customer. That non-transferability shapes the decision.”

## 1:05–1:40 — The agent

*On screen: `/console` → Decision inspector. Wait for the loading state to resolve. Select a retry decision from the simulated stream, then return to the inspector. Keep the `Simulated event` label visible. Point to each field as it is named.*

> “This simulated decision starts with the failure tuple; unfamiliar state is refused rather than guessed. The gate compares the bank with its own baseline. Then probability times payment value is compared with the mandate-local price of preserving this retry. If value covers price and the gate passes, retry. An outage waits; hard stops terminate. Those numbers produce the action.”

## 1:40–2:15 — The outage demo

*On screen: `/console` → Issuer health. Begin in `Normal state`. Keep the `Simulated outage scenario` label visible. Say the first sentence, then press `Inject simulated outage`. Wait for the loading state to resolve before continuing. Point to Retry and Wait.*

> “Watch what happens when a bank goes down.”

> “This outage is simulated. A domestic-card test capture now identifies issuer DCBL and can join issuer health, but this button injects a simulated outage rather than replaying a measured bank incident.”

> “Every retryable HDFC event visible here has moved into wait. No attempt is spent while the outage is active; each event is re-evaluated after clearance. With only three retries, firing into a known outage burns one third of that mandate's lifetime recovery budget.”

## 2:15–3:15 — The result

*On screen: `/console` → Policy comparison. Wait until both held-out rail cards load. Keep the frozen 14-day label, paired net result, and positive-seed count visible.*

> “I used five seeds to select the cap, froze fourteen days, then ran ten new seeds once.”

> “On held-out UPI, Recovery Loop uses 4,491.4 attempts, recovers 1,230.4 payments, and nets ₹2,857,357.83. The ladder uses 5,406.3, recovers 838.5, and nets ₹1,789,083.60.”

> “The paired UPI advantage is ₹1,068,274.23 and every one of ten validation seeds is positive. It also stays positive at every tested cap from fourteen days through the horizon, so it is a range, not one lucky point.”

> “Cards is inconclusive: plus ₹20,766.87 on average, only six of ten seeds positive, and the range crosses zero. I am not calling that a win.”

> “The UPI finding is that selective retry pays here only when deferral spans the simulated salary cycle.”

## 3:15–4:20 — How it was measured

*On screen: README → `How the evaluation was corrected`. Zoom so the six correction rows are legible. Track down the table as each failure is named.*

> “My first evaluation claimed the agent was better. That result was wrong. Ground truth was defined as a random draw falling below the model's own prediction, so the agent was grading its own homework. The old headline values are not preserved in the final machine-readable evidence, so I do not repeat them.”

> “I rebuilt outcomes from hidden world state the model never sees, and the advantage collapsed. Five more errors surfaced: a schema break that zeroed every result; scheduled deferrals that were discarded; a shared budget that should have been per mandate; a Cards run with zero attempts because I used the wrong baseline; and economic waits made terminal.”

> “All six are documented. Then I caught one more weakness: I had examined seven caps on five seeds and reported the best. I registered a disjoint seed split, selected on five, froze the cap, and validated once on ten. The correction trail matters more than choosing the favourable row.”

## 4:20–5:00 — Limitations and next proof

*On screen: README → `Limitations`. Highlight the first two limitations, then finish on `What I would do next`.*

> “I lack merchant outcomes; card-network rules and PCI keep retry chains private. I have NPCI bank decline rates and twenty Razorpay test entities—sixteen failures.”

> “Held-out validation survives across fourteen days through the horizon, but salary timing and repeat outcomes remain authored. Next: merchant data and a live A/B test.”

## Mechanical shot list

Record these screens in this exact order. Do not begin a spoken section until the named state is visible.

Routes: the cinematic intro and the case landing are at `/`, the written case is at `/why`, and the evidence console is at `/console`. The intro plays once per browser session and is gated by `sessionStorage`; clear site data (or use a fresh private window) before each take, or it will be skipped.

0. **Intro — cold open:** load `/` in a fresh private window. Let the three beats play through the reveal without touching the keyboard. Roughly thirteen seconds end to end.
0b. **Landing — the deferral-cap slider:** scroll to the cap control. Start at three days, where the agent loses, then drag to fourteen, where both rail cards flip. Hold on the flipped state so the `wins 10/10` pill and the `inconclusive 6/10` pill are readable in the same frame. This is the single most useful shot in the video: it shows the confound and the fix in one gesture.
0c. **`/why` — provenance:** scroll section 02, `Where the data came from`, so the NPCI and Razorpay citations are legible.

1. **Local screenshot — Razorpay Payment Retries:** open `docs/recording-assets/razorpay-payment-retries-2026-08-29.png`; keep the retry flow and the caption `Live documentation screenshot · captured 29 August 2026` visible. Do not load the external page while recording.
2. **Local screenshot — NPCI UPI circular index:** open `docs/recording-assets/npci-upi-circular-index-2026-08-29.png`; keep the filtered `OC No. 215 A` result and the same capture-date caption visible. Do not load the external page or former PDF URL while recording.
3. **`/console` — Decision stream:** `Simulated stream` label visible; API connected; select `sim_0001`, the Retry row at the top. Do not scroll.
4. **`/console` — Decision inspector:** `Simulated event` label visible; probability, attempt price, expected value, gate verdict, and resulting action loaded.
5. **`/console` — Issuer health before injection:** `Simulated outage scenario` and `Normal state` visible.
6. **`/console` — Issuer health after injection:** press the button on camera; wait through the distinct loading state; show `Outage injected`, Retry, Wait, and Hard refuse.
7. **`/console` — Policy comparison:** at 1280×720, confirm the `Held-out validation` and frozen `14-day` labels are visible with both rail cards. Show UPI 10/10 positive seeds and the Cards `Inconclusive: 6/10 positive seeds` text together.
8. **README — correction history:** all six rows visible while scrolling from circular ground truth through refuse/wait conflation.
9. **README — limitations and next steps:** first two limitations visible, then scroll to `What I would do next` for the final sentence.

## Thirty-second cut-down

*On screen: five-second cuts—Razorpay retry documentation, NPCI circular, decision inspector, outage injection, comparison panel, stranded-attempt count.*

> “Razorpay gives each failed UPI mandate three retries. Five selection seeds chose a fourteen-day cap; ten untouched seeds then produced a ₹1,068,274 paired net advantage, positive in all ten. The effect holds from fourteen days through the horizon. Cards is inconclusive, and the repeat outcomes remain simulated. The result is useful because the failed evaluations and the held-out correction are documented, not hidden.”
