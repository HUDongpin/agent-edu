import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const STAGE_ZERO_TITLES: Record<string, string> = {
  en: "Prove the local stand-in path",
  es: "Comprueba la ruta del sustituto local",
  fr: "Vérifier le parcours du substitut local",
  de: "Den Pfad des lokalen Ersatzmodells prüfen",
  "zh-Hans": "验证本地替代模型路径",
  "zh-Hant": "驗證本機替代模型路徑",
  ja: "ローカル代替モデルの経路を確認する",
  ko: "로컬 대체 모델 경로 확인하기",
  ar: "تحقّق من مسار البديل المحلي",
};
const STAGE_TWO_TITLES: Record<string, string> = {
  en: "Make the first real model call",
  es: "Haz la primera llamada real al modelo",
  fr: "Effectuer le premier véritable appel au modèle",
  de: "Den ersten echten Modellaufruf ausführen",
  "zh-Hans": "第一次调用真实模型",
  "zh-Hant": "第一次呼叫真實模型",
  ja: "初めて実際のモデルを呼び出す",
  ko: "실제 모델을 처음 호출하기",
  ar: "نفّذ أول استدعاء حقيقي للنموذج",
};
const NEW_TAB_LABELS: Record<string, string> = {
  en: "opens in a new tab",
  es: "se abre en una pestaña nueva",
  fr: "s’ouvre dans un nouvel onglet",
  de: "öffnet sich in einem neuen Tab",
  "zh-Hans": "在新标签页中打开",
  "zh-Hant": "在新分頁中開啟",
  ja: "新しいタブで開きます",
  ko: "새 탭에서 열림",
  ar: "يفتح في علامة تبويب جديدة",
};
const REQUIRED_KEYS = [
  "build.startSetup",
  "build.repoLanguageTitle",
  "build.repoLanguageBody",
  "build.stageMapTitle",
  "build.stageMapBody",
  "build.stageMapLabel",
  "build.stageLabel",
  "build.continueStage1",
  "build.viewAllStages",
  "build.copyCommand",
  "build.copySuccess",
  "build.copyFailure",
  "build.posixLabel",
  "build.powerShellLabel",
  "build.shellChoiceLabel",
  "build.opensNewTab",
  ...Array.from({ length: 10 }, (_, index) => `build.stage${index}Title`),
];

test("Course 3 launchpad keeps the localized route static while making setup the primary journey", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");

  assert.doesNotMatch(page, /^\s*["']use client["']/m);
  assert.match(page, /href="#local-setup"/);
  assert.match(page, /id="local-setup"/);
  assert.match(page, /data-repository-language-boundary/);
  assert.ok(
    page.indexOf("data-repository-language-boundary") < page.indexOf("href=\"#local-setup\""),
    "the English-only repository boundary must appear before the hero CTAs",
  );
  assert.match(page, /target="_blank"/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /aria-hidden="true"/);
  assert.match(page, /inLanguage:\s*"en"/);
  assert.doesNotMatch(page, /inLanguage:\s*locale/);
});

test("Course 3 exposes all ten stages before Provider detail and a Stage 0 continuation", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");
  const styles = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");
  const stages = [
    "stage0-hello",
    "stage1-kiosk",
    "stage2-prompt",
    "stage3-evals",
    "stage4-context",
    "stage5-loop",
    "stage6-harness",
    "stage7-graph",
    "stage8-security",
    "stage9-project",
  ];

  for (const stage of stages) assert.match(page, new RegExp(stage));
  assert.match(page, /data-course-stage-map/);
  assert.ok(
    page.indexOf("data-course-stage-map") < page.indexOf('t("build.providerTitle")'),
    "the stage map must precede Provider detail",
  );
  assert.match(page, /href=\{stageOneUrl\}/);
  assert.match(page, /href="#course-stages"/);
  assert.match(page, /styles\.providerGrid/);
  assert.match(styles, /\.providerGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,/);
});

test("Course 3 command blocks are reusable, keyboard-scrollable, copyable, and announce both outcomes", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");
  const component = readFileSync("components/courses/CourseCommandBlock.tsx", "utf8");
  const styles = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");

  assert.match(page, /<CourseCommandBlock/);
  assert.match(page, /\$env:DEEPSEEK_API_KEY/);
  assert.match(page, /\$env:ANTHROPIC_API_KEY/);
  assert.match(component, /^["']use client["'];/m);
  assert.match(component, /navigator\.clipboard\.writeText/);
  assert.match(component, /tabIndex=\{0\}/);
  assert.match(component, /aria-label=\{label\}/);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /aria-atomic="true"/);
  assert.match(component, /data-course-command/);
  assert.match(component, /data-command-scroll/);
  assert.match(component, /data-command-copy/);
  assert.match(component, /data-command-status/);
  assert.match(component, /<code translate="no">/);
  assert.match(styles, /min-(?:block-)?size:\s*44px/);
  assert.match(styles, /overflow:\s*auto/);
});

test("Course 3 isolates technical tokens and describes the offline success path truthfully", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");

  assert.match(page, /data-course-technical-token/);
  assert.match(page, /<bdi[^>]*dir="ltr"[^>]*translate="no"/);
  assert.match(page, /PASS  you wrote a question/);
  assert.match(page, /PASS  the local stand-in returned an answer/);
  assert.doesNotMatch(page, /PASS  you asked the model something/);
  assert.doesNotMatch(page, /PASS  an answer came back/);
});

test("all nine stage maps separate the local stand-in from the first real model call", () => {
  for (const locale of LOCALES) {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    ) as Record<string, string>;
    assert.equal(messages["build.stage0Title"], STAGE_ZERO_TITLES[locale]);
    assert.equal(messages["build.stage2Title"], STAGE_TWO_TITLES[locale]);
  }
});

test("all nine repository handoffs announce a new tab consistently", () => {
  const page = readFileSync("app/[locale]/build/page.tsx", "utf8");
  assert.match(page, /build\.opensNewTab/);
  assert.doesNotMatch(page, /build\.opensNewWindow/);

  for (const locale of LOCALES) {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    ) as Record<string, string>;
    assert.equal(messages["build.opensNewTab"], NEW_TAB_LABELS[locale]);
    assert.equal(messages["build.opensNewWindow"], undefined);
  }
});

test("Arabic course ranges and identifiers remain readable in RTL", () => {
  const messages = JSON.parse(readFileSync("messages/ar.json", "utf8")) as Record<string, string>;
  for (const key of ["build.lede", "build.beforeTime"]) {
    assert.match(messages[key], /من 0 إلى 8/);
    assert.doesNotMatch(messages[key], /\(0[-–]8\)/);
  }
  assert.equal(messages["build.stage6Title"], "ابنِ إطار التشغيل");
});

test("Chinese billing copy says dated estimates may become stale", () => {
  const simplified = JSON.parse(
    readFileSync("messages/zh-Hans.json", "utf8"),
  ) as Record<string, string>;
  const traditional = JSON.parse(
    readFileSync("messages/zh-Hant.json", "utf8"),
  ) as Record<string, string>;

  assert.match(simplified["build.costBody"], /特定日期/);
  assert.match(simplified["build.costBody"], /可能过时/);
  assert.doesNotMatch(simplified["build.costBody"], /日期限制/);
  assert.match(traditional["build.costBody"], /特定日期/);
  assert.match(traditional["build.costBody"], /可能過時/);
  assert.doesNotMatch(traditional["build.costBody"], /日期限制/);
});

test("all nine Course 3 launchpads translate the Phase 1 interaction copy", () => {
  const english = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  for (const locale of LOCALES) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of REQUIRED_KEYS) {
      assert.equal(typeof messages[key], "string", `${locale}:${key} must exist`);
      assert.ok(messages[key].trim().length > 0, `${locale}:${key} must not be blank`);
      if (locale !== "en") {
        assert.notEqual(messages[key], english[key], `${locale}:${key} must not fall back to English`);
      }
    }
  }
});
