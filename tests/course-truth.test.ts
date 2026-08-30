import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const BUILD_TRUTH_KEYS = ["track.3.desc", "c.build.blurb", "build.lede", "build.beforeTime"];

const VARIABLE_COST_TRUTH: Record<string, { lab: string; build: string }> = {
  en: { lab: "Provider charges vary", build: "offline or usage-based Provider calls" },
  es: { lab: "los cargos del proveedor varían", build: "sin conexión o llamadas al proveedor según el uso" },
  fr: { lab: "les frais du fournisseur varient", build: "hors ligne ou appels facturés à l'usage" },
  de: { lab: "variable Provider-Kosten", build: "offline oder nutzungsabhängige Provider-Aufrufe" },
  "zh-Hans": { lab: "供应商费用随实际用量变化", build: "可离线，或按实际用量调用供应商" },
  "zh-Hant": { lab: "供應商費用隨實際用量變化", build: "可離線，或按實際用量呼叫供應商" },
  ja: { lab: "プロバイダー料金は実際の使用量で変動", build: "オフラインまたは従量課金のプロバイダー呼び出し" },
  ko: { lab: "공급자 요금은 실제 사용량에 따라 달라짐", build: "오프라인 또는 사용량 기반 공급자 호출" },
  ar: { lab: "تختلف رسوم المزوّد حسب الاستخدام الفعلي", build: "دون اتصال أو استدعاءات للمزوّد محسوبة حسب الاستخدام" },
};

const HANDOFF_COST_TRUTH: Record<string, string> = {
  en: "charges vary with model, time, cache and usage",
  es: "los cargos varían según el modelo, el tiempo, la caché y el uso",
  fr: "les frais varient selon le modèle, la durée, le cache et l’utilisation",
  de: "die Kosten variieren je nach Modell, Zeit, Cache und Nutzung",
  "zh-Hans": "费用会随模型、时间、缓存和用量而变化",
  "zh-Hant": "費用會隨模型、時間、快取和用量而變化",
  ja: "料金はモデル、時間、キャッシュ、使用量によって変動します",
  ko: "요금은 모델, 시간, 캐시 및 사용량에 따라 달라집니다",
  ar: "تختلف الرسوم باختلاف النموذج والوقت والتخزين المؤقت والاستخدام",
};

test("Part 3 names nine guided stages 0–8 and a distinct Stage 9 transfer project", () => {
  const stageFolders = readdirSync("course", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^stage\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(stageFolders.map((name) => Number(/^stage(\d+)-/.exec(name)?.[1])), [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  assert.match(readFileSync("course/check.ts", "utf8"), /course\/check\.ts <0-8>/);
  for (const artifact of ["README.md", "artifact-template.md", "eval-template.json", "RUBRIC.md"]) {
    assert.equal(
      readdirSync("course/stage9-project").includes(artifact),
      true,
      `Stage 9 transfer artifact missing: ${artifact}`,
    );
  }

  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of BUILD_TRUTH_KEYS) {
      const value = catalog[key];
      assert.equal(typeof value, "string", `${locale}:${key} must exist`);
      assert.match(value, /0[^\d]{0,3}8[\s\S]*9/, `${locale}:${key} must distinguish 0–8 from 9`);
    }
  }

  const rootReadme = readFileSync("README.md", "utf8");
  const courseReadme = readFileSync("course/README.md", "utf8");
  assert.match(rootReadme, /nine guided TypeScript stages \(0–8\).*Stage 9 transfer project/);
  assert.match(courseReadme, /nine guided stages \(0–8\), then a Stage 9 transfer project/);
  assert.match(courseReadme, /## The nine guided stages \(0–8\)/);
});

test("Course 1 catalog facts expose real labels and require both route exploration and assessment submission", () => {
  const factKeys = [
    "cat.fact.prerequisite",
    "cat.fact.outcome",
    "cat.fact.artifact",
    "cat.fact.evidence",
  ];
  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of factKeys) {
      assert.equal(typeof catalog[key], "string", `${locale}:${key} must render a label`);
      assert.notEqual(catalog[key], key, `${locale}:${key} must not leak its message id`);
    }
    assert.match(catalog["c.handbook.artifact"], /10/u, `${locale}:artifact must describe the submitted run`);
    assert.match(catalog["c.handbook.evidence"], /11/u, `${locale}:evidence must require all sections`);
    assert.match(catalog["c.handbook.evidence"], /10/u, `${locale}:evidence must require assessment submission`);
  }

  const en = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  assert.doesNotMatch(en["c.handbook.artifact"], /completed|master/i);
  assert.match(en["c.handbook.evidence"], /score does not determine completion/i);
});

test("public course and result-handoff copy describe variable Provider cost instead of a fixed price", () => {
  const fixedPriceUnit = /[¢$€£¥₩]|\b(?:cent|cents)\b|美分|分钱|分錢|セント|سنت/u;

  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    const widgets = JSON.parse(readFileSync(`messages/widgets/${locale}.json`, "utf8")) as Record<string, string>;
    const labMeta = catalog["track.2.meta"];
    const buildMeta = catalog["track.3.meta"];
    const handbookCost = widgets["w.progress.continueLab.cost"];
    assert.equal(typeof labMeta, "string", `${locale}:track.2.meta must exist`);
    assert.equal(typeof buildMeta, "string", `${locale}:track.3.meta must exist`);
    assert.equal(typeof handbookCost, "string", `${locale}:w.progress.continueLab.cost must exist`);
    assert.match(labMeta, /DeepSeek/u, `${locale}:track.2.meta must identify the browser Lab Provider`);
    assert.match(labMeta, new RegExp(VARIABLE_COST_TRUTH[locale].lab.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.match(buildMeta, new RegExp(VARIABLE_COST_TRUTH[locale].build.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.match(handbookCost, new RegExp(HANDOFF_COST_TRUTH[locale].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.doesNotMatch(`${labMeta}\n${buildMeta}\n${handbookCost}`, fixedPriceUnit, `${locale} must not advertise a fixed sample price`);
  }
});
