/** Clean-clone proof that offline mode needs no key, network, or private fixture. */
import { OFFLINE, ask, preflight, spend } from "./cafe/llm";

if (!OFFLINE) {
  throw new Error("Run this preflight with --offline; the package script does that for you.");
}

preflight();
const answer = await ask("Explain what this local preflight proves.", { maxTokens: 120 });
if (!answer.trim()) throw new Error("The scripted offline stand-in returned an empty response.");

console.log("  PASS  no API key is required");
console.log("  PASS  the scripted local response is available");
console.log(`  PASS  ${spend()}`);
