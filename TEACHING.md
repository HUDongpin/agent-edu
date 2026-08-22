# Teaching this

A 90-minute plan for a room of beginners, plus what to do with more time. Written for someone teaching it for the first time.

**What you need:** a projector. A low-credit, revocable DeepSeek key is optional for the teacher's live demonstration; learners can complete the Handbook and the Lab's rule exercise without one. Never share the teacher key with the room.

---

## Before the room

1. Open **[the handbook](https://aicourse.top/en/handbook/)** and **[the Lab](https://aicourse.top/en/lab/)** in two tabs.
2. If you will demo live calls, create a separate low-credit key that you can revoke after class. Use **Save & test**, then run step 1, the three-order preview and one full Eval on the exact classroom network and browser.
3. In the Provider dashboard, compare the model id, usage and charge with the Lab. Re-check the dated price link shown in the Lab. A successful mock or yesterday's test does not prove today's balance, CORS or network path.
4. Prepare the no-key route: the scripted Handbook, Lab step 2, and a projected recording or teacher-run result for steps 1, 3 and 4. If the canary fails, use this route rather than debugging private credentials in front of the class.
5. Decide whether learners may use **their own** keys. If they do, have them set a small Provider budget and remind them that Forget clears this tab but does not revoke the Provider-side key.

### The call budget to disclose before anyone runs it

| Action | Maximum logical calls | Maximum output |
|---|---:|---:|
| Step 1 · first call | 1 paid request | 250 tokens |
| Step 3 · three-order preview | 3 paid requests | 3 × 300 tokens |
| One full Eval | 20 generator + up to 8 judge = 28 | 7,600 tokens |
| Recommended journey with two Evals | 60 total | 16,350 tokens |

Each extra Eval can add up to 28 calls. The Eval runs with concurrency 4. **Stop** prevents new work from being scheduled and attempts to abort at most four in-flight requests; an in-flight request may still be charged. If a request was sent but no usage came back, the honest cost state is *unknown*, not zero.

---

## The 90 minutes

The Lab's four steps are **1 Your first call · 2 The wall · 3 Write the prompt · 4 Measure it**. Each handbook section has its own URL, so you can bookmark the ones below.

| Time | What | Where |
|---|---|---|
| 0–10 | **The question.** "Every program is a list of steps. Who picks them?" Show the dial. Do not explain the eight sections yet. | handbook [`#start`](https://aicourse.top/en/handbook/#start) |
| 10–20 | **The wall, felt not told.** Learners open the Lab's step 2 and add rules. Stop them at 7 or 8 out of 10. Ask: "how many rules for ten sentences? Who thought of `LARGE FLAT WHITE!!!` before I showed you?" | Lab step 2 |
| 20–35 | **A model, live.** You demo step 3 on the projector. Run the same vague order three times. It will not answer the same way. Let the room see the price it invented. | Lab step 3 |
| 35–50 | **The turn.** Run the 20-case eval in step 4. Note the score. Press *Add the menu, then re-run*. **This is the moment of the whole lesson** — let the number land before you say anything. | Lab step 4 |
| 50–60 | **Name what just happened.** Now go to the handbook and walk §02 Prompt, §03 Context, §07 Evaluation. They have already done all three; you are giving them the words. | [`#prompt`](https://aicourse.top/en/handbook/#prompt) · [`#context`](https://aicourse.top/en/handbook/#context) · [`#evals`](https://aicourse.top/en/handbook/#evals) |
| 60–75 | **Handing over more.** §04 Loop and §05 Graph. Step the loop widget through the failed tool call. Switch the reviewer off and watch the bad refund reach a customer. | [`#loop`](https://aicourse.top/en/handbook/#loop) · [`#graph`](https://aicourse.top/en/handbook/#graph) |
| 75–85 | **The fence.** §08 Security. Send the poisoned email. Ask the room what they would have done. | [`#security`](https://aicourse.top/en/handbook/#security) |
| 85–90 | **Where to next.** §09 decision tree; point at Part 3, the build-an-agent course, for anyone who writes code. | [`#compare`](https://aicourse.top/en/handbook/#compare) |

### If you only have 45 minutes

Do 0–50 above and stop. The eval moment is the lesson; everything after it is vocabulary. Losing §04–§08 costs less than rushing the number.

### If you have three hours

Add: learners do Lab steps 3–4 themselves with their own keys (30 min, they will all get different scores — that is a discussion, not a problem), then §10 [*Play the game*](https://aicourse.top/en/handbook/#play) as small groups (20 min), then use the [Part 3 setup guide](https://aicourse.top/en/build/) before assigning the local TypeScript course.

---

## Questions you will get

**"Is it just guessing?"** Yes, in the sense that it is predicting text. No, in the sense that the prediction is good enough to handle phrasings nobody wrote a rule for. Step 2 versus step 3 is the whole answer, and they have felt both.

**"Why did it get the price wrong?"** Because nobody told it the menu. This is the single most useful thing they will learn all day: **most "the model is bad" is "the model was never told"**. Resist explaining it before they run the eval.

**"Can't you just tell it not to make things up?"** Have them try. Add "do not invent prices" to the step 3 prompt and re-run the eval. It barely moves. Then add the menu and it jumps. Instructions do not substitute for information.

**"Which is best — prompt, loop or graph?"** Wrong axis. The question is how much control the problem actually requires you to hand over. §09 is built for this.

**"Is my score wrong if it differs from hers?"** No. Two learners with identical prompts get different scores, because 8 of the 20 cases are themselves model calls. That is a real property of evals, not a bug — and noticing it is worth more than a clean number.

**"Is the site in my language?"** The site and Handbook are available in nine languages — use the 🌐 menu, or go straight to `/es/lab/` or `/ar/lab/`. The café's menu, orders and twenty test cases remain English because translating the measured inputs would change the exercise.

---

## What tends to go wrong

- **A learner pastes a key and gets an error.** Read the Save & test state first: rejected credentials are different from an unreachable Provider. Do not ask anyone to project, paste into chat or send you a private key. Forget the tab copy and let the learner revoke the key in their Provider console if exposure is possible.
- **Everything is slow at once.** Do not assume an account limit, school network or Provider will support the room because one laptop did. Stop the run, stagger the Eval, switch to the prepared no-key route, or demo the canary result once on the projector.
- **Someone's eval scores 20/20 on the first run.** They pasted the menu into step 3 already. Ask them to take it out — the comparison is the lesson, and they have skipped it.
- **The room fixates on the café.** Redirect once: "the café is a stand-in so you are not learning two things at once." If it keeps happening, ask them to name their own domain and say what the twenty cases would be.

---

## What this course will not teach them

Say this out loud near the end; it buys you credibility and it is true.

- Nothing here makes anyone a machine-learning engineer. It is about **building systems that call models**, which is a different job.
- The security section is an introduction to one attack. It is not a security course.
- Every model behaviour shown is **as of the model they run it on**. Some of it will be wrong in a year; the *questions* will not be.

---

## One-page learner worksheet

Use this on paper or in a local document. It deliberately asks for evidence rather than a single approved design.

1. **Rules wall:** write one new customer phrasing that the current rules miss. What additional rule would it require?
2. **Prediction before Eval 1:** predict a score out of 20 and give one reason. This is not a gate; an honest wrong prediction is useful evidence.
3. **Observed baseline:** record the score, one failed case and whether the failure came from missing instructions, missing context, stochastic output or the evaluation method.
4. **One change:** name exactly what you will change and why it should affect that failure.
5. **Prediction before Eval 2:** predict the direction and size of the change.
6. **Comparison:** record the second score and one case that changed. Do not hide regressions.
7. **Control boundary:** name one decision the model may make and one decision code or a person must retain.
8. **Transfer:** name a domain you know and one failure input, one minimal eval and one irreversible action that needs a gate.

## Project rubric for Part 3 / Stage 9

Score each row 0–2. A strong project can make a different design choice from the exemplar if its evidence and trade-off are defensible.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Problem boundary | Missing or unlimited | Goal named, authority vague | Goal, non-goals and model authority explicit |
| Failure input | Only a happy path | Failure named but not reproducible | Concrete input reliably exposes the rule/prompt weakness |
| Minimal eval | Selected examples only | Cases exist without a decision rule | Cases, expected evidence and scoring rule are inspectable |
| Irreversible gate | No enforced gate | Warning or prompt-only request | Code/person gate executes before the irreversible action |
| Trust boundaries | Not identified | Provider or tool named | Provider, tools, secrets and untrusted input boundaries mapped |
| Reflection | Success claim only | One limitation named | Failures, regressions, cost and next test discussed |

**Acceptable evidence:** console output with secrets removed, a small JSON/Markdown eval result, a code link, a flow of one failed case, or a local report card. A higher score does not require a particular framework, Provider or prompt. It requires an observable claim, a proportionate control and a candid account of the trade-off.

## Lightweight observation sheet for a pilot

Without adding product telemetry, record only what the participant consents to share:

- Could the learner explain navigation, price and privacy without a blocker?
- Could they complete rules → prompt → Eval and explain the control handoff?
- Could they recover from a draft, Provider error or offline setup problem?
- Could they run offline Stage 0 locally?
- In two new situations, could they place the model/code/person boundary and justify it?
- What evidence did they produce, and what did they say was still confusing?

Keep the sheet with the teacher; do not upload keys, prompts, raw model replies or student work to the site.

---

## Reusing this

MIT. Translate it, re-cut it, put your own café in it. If you build something better, [an issue](https://github.com/HUDongpin/agent-edu/issues) with a link is welcome — especially a translation, and especially a lesson plan for a different length or level.
