import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function pickedProvider(env: Record<string, string>): string {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e",
      'const m = await import("./course/cafe/llm.ts"); console.log(m.PROVIDER);'],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, DEEPSEEK_API_KEY: "", ANTHROPIC_API_KEY: "", CAFE_PROVIDER: "", ...env },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim().split("\n").pop() ?? "";
}

test("with both keys set and no CAFE_PROVIDER, the course picks DeepSeek as the README says", () => {
  assert.equal(pickedProvider({ DEEPSEEK_API_KEY: "sk-test", ANTHROPIC_API_KEY: "sk-ant-test" }), "deepseek");
});

test("a lone Anthropic key still selects Anthropic, and CAFE_PROVIDER still forces one", () => {
  assert.equal(pickedProvider({ ANTHROPIC_API_KEY: "sk-ant-test" }), "anthropic");
  assert.equal(
    pickedProvider({ DEEPSEEK_API_KEY: "sk-test", ANTHROPIC_API_KEY: "sk-ant-test", CAFE_PROVIDER: "anthropic" }),
    "anthropic",
  );
});
