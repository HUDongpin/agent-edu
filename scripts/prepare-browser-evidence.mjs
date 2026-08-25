import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("browser-evidence");
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true, mode: 0o700 });
