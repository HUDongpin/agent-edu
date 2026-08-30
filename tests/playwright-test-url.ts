const DEFAULT_PLAYWRIGHT_TEST_PORT = 4173;

export function resolvePlaywrightTestPort(
  rawPort: string | undefined = process.env.AGENT_EDU_TEST_PORT,
): number {
  if (rawPort === undefined) return DEFAULT_PLAYWRIGHT_TEST_PORT;
  if (!/^[1-9][0-9]{0,4}$/.test(rawPort)) {
    throw new Error("AGENT_EDU_TEST_PORT must be an integer between 1 and 65535");
  }
  const port = Number(rawPort);
  if (port > 65_535) {
    throw new Error("AGENT_EDU_TEST_PORT must be an integer between 1 and 65535");
  }
  return port;
}

export const PLAYWRIGHT_TEST_PORT = resolvePlaywrightTestPort();
export const PLAYWRIGHT_TEST_ORIGIN = `http://127.0.0.1:${PLAYWRIGHT_TEST_PORT}`;
export const PLAYWRIGHT_TEST_HOME_URL = `${PLAYWRIGHT_TEST_ORIGIN}/en/`;
