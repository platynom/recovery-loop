# Recovery Loop — five-minute spoken demo

The quoted paragraphs below are the words to say. Directions in italics are recording cues and are not spoken.

## 0:00–0:40 — The problem

*On screen: Razorpay's Payment Retries documentation. Keep the `pending`, automatic retry, and `halted` flow visible. Briefly point to the open tabs for Payment Downtime and Optimizer Dynamic Routing without leaving the retry page.*

> “When a subscription payment fails in India, Razorpay retries it on day one, day two, day three, and then gives up. Same three days for everyone, whatever went wrong. Meanwhile Razorpay publishes a live feed of which banks are down, and runs a machine-learning router that reacts to a failing gateway inside twenty minutes. Neither of those is connected to the retry scheduler. I wanted to know what connecting them was worth.”

## 0:40–1:10 — The constraint

*On screen: NPCI's live UPI circular index. Select `2025`, search `Guidelines on usage`, and keep the official `UPI | OC No. 215 A | FY 2025-26 | Guidelines on usage of UPI APIs` row visible. NPCI's former direct PDF URL now returns 404, so preload this filtered index rather than relying on the PDF during recording.*

> “On UPI AutoPay you get one attempt and three retries. That is the entire budget, per mandate, forever. So the question is not how to retry more. It is which three moments are worth spending.”

> “And those attempts cannot move. If I save one on a mandate that never recovers, I cannot spend it on a different customer. That non-transferability turns out to decide the result.”

## 1:10–2:10 — The agent

*On screen: Recovery Loop → Decision inspector. Wait for the loading state to resolve. Select a retry decision from the simulated stream, then return to the inspector. Keep the `Simulated event` label visible. Point to each field as it is named.*

> “This is one policy decision on a simulated payment. First is the failure tuple: what failed, where it failed, and who supplied the error. An unfamiliar tuple is refused rather than guessed.”

> “Next is issuer health. The gate compares this bank's decline rate with its own baseline. Then come the recovery odds and the attempt price: the opportunity cost of spending one of this mandate's retries now instead of preserving it for a better legal slot.”

> “The inequality is: probability times payment value must be greater than or equal to attempt price. If it clears and the gate passes, retry. An outage means wait and re-evaluate. Unknown state, issuer stop, or exhausted mandate means terminal refusal. The displayed inputs deterministically produce this action.”

## 2:10–2:50 — The outage demo

*On screen: Recovery Loop → Issuer health. Begin in `Normal state`. Keep the `Simulated outage scenario` label visible. Say the first sentence, then press `Inject simulated outage`. Wait for the loading state to resolve before continuing. Point to Retry and Wait.*

> “Watch what happens when a bank goes down.”

> “This outage is simulated. My fifteen captured test events all came back with a null issuer, so they cannot join to the downtime feed — I will come back to that.”

> “Every retryable HDFC event visible here has moved into wait. No attempt is spent while the outage is active; each event is re-evaluated after clearance. With only three retries, firing into a known outage burns one third of that mandate's lifetime recovery budget.”

## 2:50–3:50 — The result

*On screen: Recovery Loop → Policy comparison. Wait until both rail cards load. Keep gross rupees per attempt and total gross revenue visible side by side. Point first to UPI efficiency, then immediately to UPI total revenue; repeat for Cards.*

> “It is one-point-nine times more efficient per attempt on UPI. And it recovers less money than the fixed ladder. Both of those are true.”

> “On UPI, Recovery Loop uses 1,915.4 retries and recovers 546 payments. The fixed ladder uses 5,426.6 and recovers 828. Recovery Loop produces ₹1,446,109.38 gross revenue; the ladder produces ₹2,198,920.72. It wins zero of five seeds on total net revenue.”

> “Cards is entirely simulated, but tells the same story: one-point-seven times the gross efficiency, 811.6 recoveries against 1,070.2, and zero of five seeds won on total net revenue.”

> “Refusing only pays if the saved attempt can be spent somewhere else. Here it cannot: every mandate owns three non-transferable retries. So around three thousand per cohort expire—3,001.8 on UPI and 2,960.2 on Cards. That is the finding, and not the one I expected.”

## 3:50–4:30 — How it was measured

*On screen: README → `How the evaluation was corrected`. Zoom so the six correction rows are legible. Track down the table as each failure is named.*

> “My first evaluation claimed the agent was better. That result was wrong. Ground truth was defined as a random draw falling below the model's own prediction, so the agent was grading its own homework. The old headline values are not preserved in the final machine-readable evidence, so I do not repeat them.”

> “I rebuilt outcomes from hidden world state the model never sees, and the advantage collapsed. Five more errors surfaced: a schema break that zeroed every result; scheduled deferrals that were discarded; a shared budget that should have been per mandate; a Cards run with zero attempts because I used the wrong baseline; and economic waits made terminal.”

> “All six are documented with their impact, detection, and correction. Earlier git results are not comparable. This trail is why I trust the final loss more than the original win.”

## 4:30–5:00 — Limitations and next proof

*On screen: README → `Limitations`. Highlight the first two limitations, then finish on `What I would do next`.*

> “I do not have real merchant data. It is not public: card-network rules and PCI make retry chains difficult to publish. I do have real NPCI decline rates per bank, fifteen observed Razorpay test failures, and an instrument showing where refusal stops paying.”

> “My first change would be the three-day deferral cap. It binds on ninety-nine-point-eight percent of UPI deferrals, so insufficient-funds cases rarely reach salary day. That is probably much of the gap. Next comes merchant data and a live, capped A/B test reporting efficiency and total revenue together.”

## Mechanical shot list

Record these screens in this exact order. Do not begin a spoken section until the named state is visible.

1. **Browser — Razorpay Payment Retries:** retry flow visible; tabs pre-opened for Payment Downtime, Optimizer Dynamic Routing, and Optimizer Recurring Payments.
2. **Browser — NPCI UPI circular index:** select `2025`, search `Guidelines on usage`, and keep the `OC No. 215 A` result visible. Do not use the former direct PDF URL; it now returns 404.
3. **Dashboard — Decision stream:** `Simulated stream` label visible; API connected; choose a row whose action is Retry.
4. **Dashboard — Decision inspector:** `Simulated event` label visible; probability, attempt price, expected value, gate verdict, and resulting action loaded.
5. **Dashboard — Issuer health before injection:** `Simulated outage scenario` and `Normal state` visible.
6. **Dashboard — Issuer health after injection:** press the button on camera; wait through the distinct loading state; show `Outage injected`, Retry, Wait, and Hard refuse.
7. **Dashboard — Policy comparison:** both UPI AutoPay `NPCI-calibrated` and Cards `Simulated` cards loaded; keep efficiency and total revenue visible together.
8. **README — correction history:** all six rows visible while scrolling from circular ground truth through refuse/wait conflation.
9. **README — limitations and next steps:** first two limitations visible, then scroll to `What I would do next` for the final sentence.

## Thirty-second cut-down

*On screen: five-second cuts—Razorpay retry documentation, NPCI circular, decision inspector, outage injection, comparison panel, stranded-attempt count.*

> “Razorpay gives a failed subscription three retries; NPCI makes them per mandate and non-transferable. I built a scheduler using issuer health, failure diagnosis, and mandate-local attempt pricing. Across five seeds it is one-point-nine times more efficient on NPCI-calibrated UPI—and still recovers less money, winning zero of five seeds on total net revenue. The reason is 3,001.8 conserved attempts that expire. Refusal helps only when saved capacity can move.”
