/** Stage 7 — a routed workflow where the review step cannot be skipped. */
import { ask, preflight, spend } from "../cafe/llm";

const POLICY = "Refund policy: for a damaged item we refund that item, or ship a " +
  "replacement. We never issue store credit, never refund an entire order because " +
  "one item was damaged, and never offer free delivery.";

export const COMPLAINT = "My order #4381 arrived crushed — one of the two bags of beans " +
  "was split open. Really disappointed, this is the second time.";

const ROUTE_SCHEMA = {
  type: "object",
  properties: { lane: { type: "string", enum: ["order", "question", "complaint"] } },
  required: ["lane"],
  additionalProperties: false,
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    approved: { type: "boolean" },
    problem: { type: "string", description: "Empty when approved." },
  },
  required: ["approved", "problem"],
  additionalProperties: false,
};

export const SENT: string[] = [];

/* --- nodes --------------------------------------------------------------- */

/** Decide which lane this message belongs in. A model node. */
export async function route(message: string): Promise<string> {
  // TODO 1: ask the model to classify `message` using ROUTE_SCHEMA and return
  // the lane. One model call at low effort; inspect returned usage and the
  // dated cost estimate rather than assuming a fixed magnitude.
  throw new Error("TODO 1: write the router");
}

/** Write the customer-facing reply. A model node. */
export function draftComplaintReply(message: string, note = ""): Promise<string> {
  return ask(
    `A customer complained:\n${message}\n\n${POLICY}\n\n${note}\n\n` +
    "Write the reply to the customer. Two sentences.",
    { system: "You write short, warm replies for a café's support team." });
}

/** Check a draft against the policy. A model node. */
export async function review(draft: string): Promise<[boolean, string]> {
  // TODO 2: ask the model whether `draft` complies with POLICY, using
  // REVIEW_SCHEMA, and return [approved, problem].
  throw new Error("TODO 2: write the reviewer");
}

/** The only way anything reaches a customer. */
export function send(text: string): void { SENT.push(text); }

/* --- the graph ----------------------------------------------------------- */

export async function handle(
  message: string, { reviewer, maxRewrites = 2 }: { reviewer: boolean; maxRewrites?: number },
): Promise<string> {
  const lane = await route(message);
  if (lane !== "complaint") {
    const reply = await ask(`Answer this briefly: ${message}`);
    send(reply);
    return reply;
  }

  let draft = await draftComplaintReply(message);
  if (!reviewer) { send(draft); return draft; }

  for (let i = 0; i < maxRewrites; i++) {
    const [ok, problem] = await review(draft);
    if (ok) break;
    draft = await draftComplaintReply(message, `A reviewer rejected the last draft: ${problem}`);
  }
  send(draft);
  return draft;
}

if (import.meta.filename === process.argv[1]) {
  preflight();
  SENT.length = 0;
  const unreviewed = await handle(COMPLAINT, { reviewer: false });
  console.log(`\nwithout the reviewer:\n  ${unreviewed}\n`);
  SENT.length = 0;
  const reviewed = await handle(COMPLAINT, { reviewer: true });
  console.log(`with the reviewer:\n  ${reviewed}\n`);
  console.log(`  send() was called ${SENT.length} time(s) — the graph guarantees that.`);
  console.log(`\ncost  : ${spend()}`);
}
