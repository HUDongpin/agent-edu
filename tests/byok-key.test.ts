import assert from "node:assert/strict";
import test from "node:test";
import { createKeyStore, type StorageLike } from "../lib/byok/key-store";
import { createKeyVerifier } from "../lib/byok/key-verifier";
import { ProviderError } from "../lib/byok/types";

const MODEL = "deepseek-v4-flash" as const;

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function rejected(promise: Promise<unknown>): Promise<ProviderError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ProviderError);
    return error;
  }
  assert.fail("Expected ProviderError");
}

test("Save & test follows the full state machine and lists models once", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const models = deferred<string[]>();
  let checks = 0;
  const verifier = createKeyVerifier(store, async () => {
    checks++;
    return models.promise;
  });

  assert.equal(store.getStatus(), "empty");
  const resultPromise = verifier.saveAndTest("arbitrary-nonempty-value", MODEL);
  assert.equal(store.getStatus(), "verifying");
  assert.equal(store.getKey(), "arbitrary-nonempty-value");

  models.resolve([MODEL, "deepseek-v4-pro"]);
  const result = await resultPromise;
  assert.equal(checks, 1);
  assert.equal(store.getStatus(), "verified");
  assert.equal(result.selectedModelVisible, true);
  assert.equal(result.balanceVerified, false);
});

test("an arbitrary non-empty value is tested instead of prefix-blocked", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  let checks = 0;
  const verifier = createKeyVerifier(store, async () => {
    checks++;
    return [MODEL];
  });

  await verifier.saveAndTest("x", MODEL);
  assert.equal(checks, 1);
  assert.equal(store.getStatus(), "verified");
});

test("401 rejects and removes the saved key", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const verifier = createKeyVerifier(store, async () => {
    throw new ProviderError("auth", "rejected", {
      billing: "provider-rejected-no-usage",
      httpStatus: 401,
    });
  });

  const error = await rejected(verifier.saveAndTest("not-a-real-key", MODEL));
  assert.equal(error.code, "auth");
  assert.equal(store.getStatus(), "rejected");
  assert.equal(store.getKey(), "");
  assert.equal(store.hasKey(), false);
});

test("unreachable keeps the saved key for an explicit retry", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const verifier = createKeyVerifier(store, async () => {
    throw new ProviderError("network", "offline", { billing: "unknown-after-send" });
  });

  const error = await rejected(verifier.saveAndTest("not-a-real-key", MODEL));
  assert.equal(error.code, "network");
  assert.equal(store.getStatus(), "unreachable");
  assert.equal(store.getKey(), "not-a-real-key");
});

test("non-401 rejection and missing selected model do not silently erase the key", async (t) => {
  await t.test("403", async () => {
    const storage = new MemoryStorage();
    const store = createKeyStore(() => storage);
    const verifier = createKeyVerifier(store, async () => {
      throw new ProviderError("auth", "forbidden", {
        billing: "provider-rejected-no-usage",
        httpStatus: 403,
      });
    });
    await rejected(verifier.saveAndTest("not-a-real-key", MODEL));
    assert.equal(store.getStatus(), "rejected");
    assert.equal(store.getKey(), "not-a-real-key");
  });

  await t.test("model not visible", async () => {
    const storage = new MemoryStorage();
    const store = createKeyStore(() => storage);
    const verifier = createKeyVerifier(store, async () => ["deepseek-v4-pro"]);
    const error = await rejected(verifier.saveAndTest("not-a-real-key", MODEL));
    assert.equal(error.code, "provider");
    assert.equal(store.getStatus(), "rejected");
    assert.equal(store.getKey(), "not-a-real-key");
  });
});

test("Forget removes only this store's tab copy and resets status", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const verifier = createKeyVerifier(store, async () => [MODEL]);
  await verifier.saveAndTest("not-a-real-key", MODEL);

  store.forget();
  assert.equal(store.getKey(), "");
  assert.equal(store.getStatus(), "empty");
});

test("changing the selected model returns a verified saved key to unverified", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const verifier = createKeyVerifier(store, async () => [MODEL]);
  await verifier.saveAndTest("not-a-real-key", MODEL);
  assert.equal(store.getStatus(), "verified");

  store.markUnverified();
  assert.equal(store.getStatus(), "saved-unverified");
  assert.equal(store.getKey(), "not-a-real-key");
});

test("a confirmed runtime rejection can delete the key without hiding rejected status", () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  assert.equal(store.save("not-a-real-key"), true);

  store.reject({ deleteSavedKey: true });
  assert.equal(store.getStatus(), "rejected");
  assert.equal(store.getKey(), "");

  assert.equal(store.save("replacement-key"), true);
  store.reject();
  assert.equal(store.getStatus(), "rejected");
  assert.equal(store.getKey(), "replacement-key");
});

test("a superseded verification cannot overwrite the newer key state", async () => {
  const storage = new MemoryStorage();
  const store = createKeyStore(() => storage);
  const models = deferred<string[]>();
  const verifier = createKeyVerifier(store, async () => models.promise);
  const old = verifier.saveAndTest("old-key", MODEL);
  store.save("new-key");
  models.resolve([MODEL]);

  const error = await rejected(old);
  assert.equal(error.code, "aborted");
  assert.equal(store.getStatus(), "saved-unverified");
  assert.equal(store.getKey(), "new-key");
});
