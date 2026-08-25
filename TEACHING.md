# Teaching this

A 90-minute plan for a room of beginners, plus what to do with more time. Written for someone teaching it for the first time.

**What you need:** a projector, and one DeepSeek key of your own for the live demos. Learners need nothing for the first hour.

---

## Before the room

1. Open **[the handbook](https://aicourse.top/en/handbook/)** and **[the Lab](https://aicourse.top/en/lab/)** in two tabs.
2. Paste your key into the Lab's key box and run **step 1** once, so you know it works.
3. Check your balance. The whole class demo costs a few cents; a room of 30 doing the Lab themselves costs each of them about a penny.
4. Decide now whether learners will use their own keys. If not, they can still do **step 2** — it needs no key at all — and watch the rest.

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

Add: learners do Lab steps 3–4 themselves with their own keys (30 min, they will all get different scores — that is a discussion, not a problem), then §10 [*Play the game*](https://aicourse.top/en/handbook/#play) as small groups (20 min), then set [Part 3](https://github.com/HUDongpin/agent-edu/tree/main/course) as homework.

---

## Questions you will get

**"Is it just guessing?"** Yes, in the sense that it is predicting text. No, in the sense that the prediction is good enough to handle phrasings nobody wrote a rule for. Step 2 versus step 3 is the whole answer, and they have felt both.

**"Why did it get the price wrong?"** Because nobody told it the menu. This is the single most useful thing they will learn all day: **most "the model is bad" is "the model was never told"**. Resist explaining it before they run the eval.

**"Can't you just tell it not to make things up?"** Have them try. Add "do not invent prices" to the step 3 prompt and re-run the eval. It barely moves. Then add the menu and it jumps. Instructions do not substitute for information.

**"Which is best — prompt, loop or graph?"** Wrong axis. The question is how much control the problem actually requires you to hand over. §09 is built for this.

**"Is my score wrong if it differs from hers?"** No. Two learners with identical prompts get different scores, because 8 of the 20 cases are themselves model calls. That is a real property of evals, not a bug — and noticing it is worth more than a clean number.

**"Is the site in my language?"** Nine locale routes are available through the 🌐 menu, or directly at paths such as `/es/lab/` and `/ar/lab/`. Do not describe a locale as complete from the menu alone: the release audit separately checks pages, dynamic feedback, accessibility copy, media and the deployed artifact. The café's controlled English cases remain English only under the documented experiment-data exception and must have localized explanation.

---

## What tends to go wrong

- **A learner pastes a key and gets an error.** Nearly always a stray space, or a key from the wrong console. Have them press *Change*, then *Forget*, and paste again.
- **Everything is slow at once.** Thirty people hitting the API in the same minute is fine for DeepSeek's limits, but school wifi may not be. Stagger step 4, or demo it once on the projector.
- **Someone's eval scores 20/20 on the first run.** They pasted the menu into step 3 already. Ask them to take it out — the comparison is the lesson, and they have skipped it.
- **The room fixates on the café.** Redirect once: "the café is a stand-in so you are not learning two things at once." If it keeps happening, ask them to name their own domain and say what the twenty cases would be.

---

## What this course will not teach them

Say this out loud near the end; it buys you credibility and it is true.

- Nothing here makes anyone a machine-learning engineer. It is about **building systems that call models**, which is a different job.
- The security section is an introduction to one attack. It is not a security course.
- Every model behaviour shown is **as of the model they run it on**. Some of it will be wrong in a year; the *questions* will not be.

---

## Reusing this

MIT. Translate it, re-cut it, put your own café in it. If you build something better, [an issue](https://github.com/HUDongpin/agent-edu/issues) with a link is welcome — especially a translation, and especially a lesson plan for a different length or level.
