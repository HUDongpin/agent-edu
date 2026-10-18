import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { COURSES } from "../lib/courses";

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

const HANDBOOK_COST_TRUTH: Record<string, string> = {
  en: "Provider charges vary with model, time, cache and usage",
  es: "los cargos del proveedor varían según el modelo, la hora, la caché y el uso",
  fr: "les frais du fournisseur varient selon le modèle, l’heure, le cache et l’usage",
  de: "die Provider-Kosten variieren je nach Modell, Zeitfenster, Cache und Nutzung",
  "zh-Hans": "供应商费用会随模型、时段、缓存和实际用量变化",
  "zh-Hant": "供應商費用會隨模型、時段、快取和實際用量變化",
  ja: "プロバイダー料金はモデル、時間帯、キャッシュ、使用量によって変わります",
  ko: "공급자 요금은 모델, 시간대, 캐시, 실제 사용량에 따라 달라집니다",
  ar: "تختلف رسوم المزوّد باختلاف النموذج والوقت والتخزين المؤقت والاستخدام",
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

test("homepage metadata describes variable Provider cost instead of promising a fixed price", () => {
  const fixedPriceUnit = /[¢$€£¥₩]|\b(?:cent|cents)\b|美分|分钱|分錢|セント|سنت/u;

  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    const handbook = JSON.parse(readFileSync(`messages/handbook/${locale}.json`, "utf8")) as Record<string, string>;
    const labMeta = catalog["track.2.meta"];
    const buildMeta = catalog["track.3.meta"];
    const handbookCost = handbook["hb.body.p-compare.82"];
    assert.equal(typeof labMeta, "string", `${locale}:track.2.meta must exist`);
    assert.equal(typeof buildMeta, "string", `${locale}:track.3.meta must exist`);
    assert.equal(typeof handbookCost, "string", `${locale}:hb.body.p-compare.82 must exist`);
    assert.match(labMeta, /DeepSeek/u, `${locale}:track.2.meta must identify the browser Lab Provider`);
    assert.match(labMeta, new RegExp(VARIABLE_COST_TRUTH[locale].lab.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.match(buildMeta, new RegExp(VARIABLE_COST_TRUTH[locale].build.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.match(handbookCost, new RegExp(HANDBOOK_COST_TRUTH[locale].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
    assert.doesNotMatch(`${labMeta}\n${buildMeta}\n${handbookCost}`, fixedPriceUnit, `${locale} must not advertise a fixed sample price`);
  }
});

test("the report card keeps the best and still reports the run that happened", async () => {
  /* Keeping only the maximum made the instrument disagree with the course. The
     worksheet asks the learner to record one improvement and one regression and
     not to hide inconvenient cases, while the report quietly held the
     high-water mark — so a learner who changed a prompt, lost two cases and
     re-ran saw their old number stand. */
  const { currentScore } = await import("../course/report");

  // A regression is reported as the regression it is.
  assert.equal(currentScore({ score: 20, latest: 17 }), 17);
  // An improvement moves both.
  assert.equal(currentScore({ score: 20, latest: 20 }), 20);
  // A record written before `latest` existed still reads correctly.
  assert.equal(currentScore({ score: 19 }), 19);
  assert.equal(currentScore(undefined), undefined);
});

test("every eval failure carries the reason the runner already computed", async () => {
  /* `why` names the wrong price against the menu price. It was built for every
     case and then dropped unless the caller asked for verbose output, so a
     learner who failed stage 4 read twelve case ids and no reasons — and stage
     3's README told them to read failures stage 3 never printed. */
  const { run } = await import("../course/cafe/evalset");
  const guessing = async () => ({
    items: [{ name: "flat white", size: "L" as const, price: 9.99 }],
    total: 9.99,
    needs_confirmation: false,
  });

  const [, failures] = await run(guessing as never, { verbose: false });
  assert.ok(failures.length > 0, "a guessing till must fail cases");
  for (const failure of failures) {
    assert.ok(failure.id, "each failure names its case");
    assert.ok(failure.why.trim().length > 0, `${failure.id} came back with no reason`);
  }
  const priced = failures.find((f) => f.id === "large-flat-white");
  assert.match(priced?.why ?? "", /9\.99.*5\.1/, "a price failure names both prices");
});

test("a failing check points somewhere short of the whole answer", () => {
  /* Between FAIL and SOLUTIONS.md — which is the complete answer, and ends the
     learner's own course — there was nothing at all. */
  const check = readFileSync("course/check.ts", "utf8");
  assert.match(check, /function bad\(m: string, hint\?: string\): never/);
  assert.match(check, /re-read course\/\$\{STAGES\[checking\]\}\/README\.md/);
  assert.match(check, /checking = stage;/);
  // The cost warning must read the same seam as the client, or it warns about
  // spending on a run that npm has already switched offline.
  assert.match(check, /COSTS_MONEY\.has\(stage\) && !OFFLINE/);
});

test("the transfer stage ships a worked example, scored honestly", () => {
  /* Everything up to Stage 8 hands the learner a worked example — the café —
     and Stage 8 is where it stops. Removing the scaffolding is the point of
     Stage 9, but the finished thing had never been shown, which is the standard
     way a transfer task fails to transfer. */
  const example = readFileSync("course/stage9-project/worked-example.md", "utf8");
  const template = readFileSync("course/stage9-project/artifact-template.md", "utf8");

  /* It answers the template it is an example of. Every numbered section of the
     template has to appear, or the example teaches a shape the rubric does not
     ask for. */
  const sections = [...template.matchAll(/^## (\d+\. .+)$/gm)].map((m) => m[1]);
  assert.ok(sections.length >= 8, "the template should have its eight sections");
  for (const section of sections) {
    assert.ok(example.includes(section), `the worked example skips "${section}"`);
  }

  /* Not perfect on purpose. An exemplar that scores full marks teaches that the
     rubric is a formality; one that loses a row and says why teaches what a 1
     looks like. */
  assert.match(example, /\|\s*\*\*1\*\*\s*\|/, "one rubric row must score 1");
  assert.match(example, /11 of 12/);

  /* The two things the rubric's review prompts hunt for: a gate that is code
     rather than a request, and a regression that was not hidden. */
  assert.match(example, /REFUSED/);
  assert.match(example, /regress/i);

  /* And it must not be the café, which is the scaffolding being removed. */
  assert.doesNotMatch(example.split("## 1.")[1] ?? "", /\bcafé menu\b|\bflat white\b|\blatte\b/i);

  // Reachable from both places a learner would look for it.
  assert.match(readFileSync("course/stage9-project/README.md", "utf8"), /worked-example\.md/);
  assert.match(readFileSync("course/README.md", "utf8"), /worked-example\.md/);
});

test("stage 5 is two graded steps and the stage table stops claiming one or two TODOs", () => {
  const readme = readFileSync("course/README.md", "utf8");
  const stage5 = readFileSync("course/stage5-loop/README.md", "utf8");
  const run = readFileSync("course/stage5-loop/run.ts", "utf8");
  const check = readFileSync("course/check.ts", "utf8");

  assert.doesNotMatch(readme, /one or two `TODO`s/);
  assert.match(readme, /stage 5 has two graded steps \(5a, then 5b\)/);
  assert.match(readme, /stage 6 has four/);
  assert.match(readme, /stages 7 and 8 have two/);
  assert.match(readme, /\| Difficulty \| Rough time \|/);
  assert.match(readme, /★{4}/);
  for (const stage of ["0", "1", "2", "3", "4", "5", "6", "7", "8"]) {
    assert.match(readme, new RegExp(`^\\| ${stage} \\|`, "m"));
  }

  assert.match(stage5, /describeToolUse/);
  assert.match(stage5, /answerOneTool/);
  assert.match(stage5, /course\/check\.ts 5a/);
  assert.match(stage5, /course\/check\.ts 5b/);
  assert.match(stage5, /course\/check\.ts 5` grades both steps/);
  assert.doesNotMatch(stage5, /one `TODO`: the body of the loop/);

  const describeAt = run.indexOf("describeToolUse(response)");
  const answerAt = run.indexOf("answerOneTool(messages, response)");
  assert.ok(describeAt >= 0 && answerAt > describeAt, "5a looks at the block before it builds a tool_result");
  assert.match(run, /TODO 5a: print response\.content/);
  assert.match(run, /TODO 5b: feed every tool result back/);

  assert.match(check, /raw === "5a" \|\| raw === "5b"/);
  assert.match(check, /course\/check\.ts <0-8>/);
  assert.match(check, /placed \$\{placed\} order\(s\); the café is short on two things/);
  assert.match(check, /the manager was never emailed/);
  assert.match(check, /is_error: true/);
  assert.match(check, /async 5\(m\) \{\s*console\.log\("  step 5a/);
  assert.match(check, /await check5a\(m\)/);
  assert.match(check, /await check5loop\(m, true\)/);
  assert.match(check, /part === "5b"\) await check5loop\(mod, true\)/);

  /* The Simplified Chinese course docs mirror the same split. The English
     assertions above stay as they are; these only add the zh pages. */
  const zhReadme = readFileSync("course/README.zh-Hans.md", "utf8");
  const zhStage5 = readFileSync("course/stage5-loop/README.zh-Hans.md", "utf8");

  assert.doesNotMatch(zhReadme, /一两个 `TODO`/);
  assert.doesNotMatch(zhReadme, /智能体循环本身/);
  assert.match(zhReadme, /第 0–4 阶段各有一个 `TODO`/);
  assert.match(zhReadme, /第 5 阶段有两个计分步骤（先 5a，再 5b）/);
  assert.match(zhReadme, /第 6 阶段有四个/);
  assert.match(zhReadme, /第 7 和第 8 阶段各有两个/);
  assert.match(zhReadme, /\| 难度 \| 大致用时 \|/);
  assert.match(zhReadme, /★ 是一处小改动/);
  assert.match(zhReadme, /★★★★ 是第 6 阶段：四个 `TODO`，其中包括累计审批闸门/);
  const zhRows: Array<[string, string, string]> = [
    ["0", "★", "10 分钟"],
    ["1", "★", "15 分钟"],
    ["2", "★★", "20 分钟"],
    ["3", "★", "15 分钟"],
    ["4", "★★", "25 分钟"],
    ["5", "★★★", "40 分钟"],
    ["6", "★★★★", "60 分钟"],
    ["7", "★★★", "30 分钟"],
    ["8", "★★", "25 分钟"],
  ];
  for (const [stage, stars, time] of zhRows) {
    assert.match(
      zhReadme,
      new RegExp(`^\\| ${stage} \\|.*\\| ${stars} \\| ${time} \\|`, "m"),
      `Simplified Chinese stage ${stage} row should show ${stars} and ${time}`,
    );
  }

  assert.match(zhStage5, /describeToolUse/);
  assert.match(zhStage5, /answerOneTool/);
  assert.match(zhStage5, /runAgent/);
  assert.match(zhStage5, /course\/check\.ts 5a/);
  assert.match(zhStage5, /course\/check\.ts 5b/);
  assert.match(zhStage5, /course\/check\.ts 5` 给两个步骤一起打分/);
  assert.match(zhStage5, /## 逐条讲解 TODO/);
  assert.match(zhStage5, /TODO 5a，第一处/);
  assert.match(zhStage5, /TODO 5a，第二处/);
  assert.match(zhStage5, /TODO 5b/);
  assert.doesNotMatch(zhStage5, /只有一个 `TODO`/);
  assert.doesNotMatch(zhStage5, /循环的主体/);
  const zhA = zhStage5.indexOf("步骤 5a");
  const zhB = zhStage5.indexOf("步骤 5b");
  assert.ok(zhA >= 0 && zhB > zhA, "the Chinese stage 5 README does 5a before 5b");
});

test("every stage ships a Simplified Chinese README and English READMEs link to it", () => {
  const stageFolders = readdirSync("course", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^stage\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const zhLink = /> 简体中文：\[README\.zh-Hans\.md\]\(README\.zh-Hans\.md\)/;
  const courseReadme = readFileSync("course/README.md", "utf8");
  const courseZh = readFileSync("course/README.zh-Hans.md", "utf8");
  assert.match(courseReadme, zhLink);
  assert.match(courseZh, /九个引导阶段（0–8）/);
  assert.match(courseZh, /worked-example\.md/);

  for (const stage of stageFolders) {
    const files = readdirSync(`course/${stage}`);
    assert.equal(files.includes("README.zh-Hans.md"), true, `${stage} missing README.zh-Hans.md`);
    assert.match(readFileSync(`course/${stage}/README.md`, "utf8"), zhLink);
    assert.match(courseZh, new RegExp(`${stage}/README\\.zh-Hans\\.md`));
    const zh = readFileSync(`course/${stage}/README.zh-Hans.md`, "utf8");
    if (stage === "stage9-project") {
      assert.match(zh, /worked-example\.md/);
      assert.match(zh, /目前仍是英文/);
    } else {
      assert.match(zh, /## 逐条讲解 TODO/);
    }
  }

  const buildPage = readFileSync("app/[locale]/build/page.tsx", "utf8");
  assert.match(buildPage, /locale === "zh-Hans"/);
  assert.match(buildPage, /course\/README\.zh-Hans\.md/);
});

test("stage 2 records distinct answers from the five probes the report names", () => {
  /* Stage 2's own runner and its README ask the vague question five times.
     The grader asked it three times and stored that count, while the report
     card always printed "from 5 identical questions". Three distinct answers
     out of three samples was reported as if five had been asked. */
  const check = readFileSync("course/check.ts", "utf8");
  const stage2 = check.slice(check.indexOf("async 2("), check.indexOf("async 3("));
  const bound = /for \(let i = 0; i < (\d+); i\+\+\)/.exec(stage2);
  assert.ok(bound, "stage 2 must probe the vague question in a counted loop");
  assert.equal(bound[1], "5");
  const report = readFileSync("course/report.ts", "utf8");
  assert.match(report, new RegExp(`distinct answers from ${bound[1]} identical questions`));
});

test("guided time, the DeepSeek signup note and the keyless entry agree", () => {
  /* Stages 0–8 in the course table are the Part 3 duration. The catalogue,
     the home page and both course READMEs have to name that sum, and the
     whole guided course is handbook + Lab + those stages. Stage 9 is outside it. */
  const courseReadme = readFileSync("course/README.md", "utf8");
  const stageMinutes = [...courseReadme.matchAll(/^\| ([0-8]) \|.*\| (\d+) min \|$/gm)]
    .map((row) => Number(row[2]));
  assert.deepEqual(stageMinutes, [10, 15, 20, 15, 25, 40, 60, 30, 25]);
  const part3 = stageMinutes.reduce((sum, minutes) => sum + minutes, 0);
  assert.equal(part3, 240);

  const minutes = Object.fromEntries(COURSES.map((course) => [course.id, course.minutes]));
  assert.equal(minutes.handbook, 60);
  assert.equal(minutes.lab, 40);
  assert.equal(minutes.build, part3);
  assert.equal(minutes.handbook + minutes.lab + minutes.build, 340);

  assert.match(courseReadme, /stages 0–8 are about four hours/);
  assert.match(courseReadme, /Stage 9 is open-ended and is not in that total/);
  assert.match(
    readFileSync("course/README.zh-Hans.md", "utf8"),
    /第 0–8 阶段大约四小时。第 9 阶段是开放式的/,
  );
  assert.match(readFileSync("README.md", "utf8"), /about 5–6 hours for the guided work, plus an open-ended Stage 9/);

  const phone: Record<string, string> = {
    en: "phone number",
    es: "número de teléfono",
    fr: "numéro de téléphone",
    de: "Telefonnummer",
    "zh-Hans": "手机号",
    "zh-Hant": "手機號碼",
    ja: "電話番号",
    ko: "전화번호",
    ar: "رقم هاتف",
  };
  const topUp: Record<string, string> = {
    en: "top-up",
    es: "recarga",
    fr: "recharge",
    de: "Aufladung",
    "zh-Hans": "充值",
    "zh-Hant": "儲值",
    ja: "入金",
    ko: "충전",
    ar: "رصيد",
  };
  const retiredLede: Record<string, string> = {
    en: "about four hours",
    es: "unas cuatro horas",
    fr: "environ quatre heures",
    de: "etwa vier Stunden",
    "zh-Hans": "约四小时",
    "zh-Hant": "約四小時",
    ja: "約4時間",
    ko: "약 네 시간",
    ar: "نحو أربع ساعات",
  };
  const retiredAfternoon = /afternoon|après-midi|Nachmittag|una tarde|下午就能|午後|오후|بعد الظهر/;

  const home = readFileSync("app/[locale]/page.tsx", "utf8");
  assert.match(home, /data-no-key/);
  assert.match(home, /href=\{p\("\/handbook\/"\)\}/);
  assert.match(home, /href=\{p\("\/lab\/"\)\}/);
  assert.match(home, /href=\{p\("\/build\/"\)\}/);
  assert.match(home, /npm run course:offline/);

  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    assert.doesNotMatch(catalog["home.lede"], new RegExp(retiredLede[locale]));
    assert.match(catalog["home.lede"], /9/);
    assert.match(catalog["home.for2d"], /9/);
    assert.doesNotMatch(catalog["home.for2d"], retiredAfternoon);
    assert.doesNotMatch(catalog["track.3.meta"], /2[–〜~-]3|٢–٣/);
    assert.doesNotMatch(catalog["build.beforeTime"], /two to three|dos y tres|deux à trois|zwei bis drei|两到三|兩到三|2〜3時間|2~3시간|ساعتين إلى ثلاث/);
    assert.match(catalog["build.beforeTime"], /0[^\d]{0,3}8[\s\S]*9/);
    for (const key of ["home.noKeyTitle", "home.noKeyBody", "home.noKeyHandbook", "home.noKeyLab", "home.noKeyCourse"]) {
      assert.equal(typeof catalog[key], "string", `${locale}:${key}`);
      assert.ok(catalog[key].trim().length > 0, `${locale}:${key} empty`);
    }
    for (const key of ["lab.setup.s1d", "track.2.meta", "home.a1"]) {
      assert.ok(catalog[key].includes(phone[locale]), `${locale}:${key} must name the phone requirement`);
      assert.ok(catalog[key].includes(topUp[locale]), `${locale}:${key} must name the top-up`);
    }
    assert.ok(
      catalog["lab.setup.s1d"].includes(catalog["lab.s4.recordedCta"]),
      `${locale}: the signup step must name the scripted-run button`,
    );
    assert.doesNotMatch(catalog["lab.setup.lede"], /two minutes|dos minutos|deux minutes|zwei Minuten|大约两分钟|大約兩分鐘|2分ほど|2분이면|دقيقتين/);
  }

  const en = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  assert.match(en["home.lede"], /about 5–6 hours for the guided work, plus an open-ended Stage 9/);
  assert.match(en["home.for2d"], /about 5–6 hours/);
  assert.match(en["track.3.meta"], /^about 4 hours · /);
  assert.match(en["build.beforeTime"], /about four hours/);
  assert.match(en["build.beforeTime"], /open-ended/);
});

test("course READMEs map handbook chapters and Lab steps onto every stage", () => {
  /* The three parts teach one café. The handbook numbers the ideas in its own
     order (evaluation is §07, after the harness). The Lab has four steps and
     stops once the menu is in the prompt. The course writes the same ideas,
     then keeps going. A row that invents a Lab step for the loop, or points
     §03 at the eval stage, would send a reader to the wrong page. */
  const FAST_EN = "If you have already finished the Lab, move quickly through stages 1–4 and treat them as review. The new part is writing the code yourself.";
  const FAST_ZH = "如果已经做完实验室，第 1–4 阶段可以走得快一些，把它们当作复习。新的部分是你自己把代码写出来。";
  const NONE = "—";

  const en = readFileSync("course/README.md", "utf8");
  const zh = readFileSync("course/README.zh-Hans.md", "utf8");
  const enMsg = JSON.parse(readFileSync("messages/en.json", "utf8")) as Record<string, string>;
  const zhMsg = JSON.parse(readFileSync("messages/zh-Hans.json", "utf8")) as Record<string, string>;
  const markup = readFileSync("lib/handbook/markup.ts", "utf8");
  const behaviour = readFileSync("lib/handbook/behaviour.ts", "utf8");

  assert.ok(en.includes(FAST_EN), "English fast-track sentence");
  assert.ok(zh.includes(FAST_ZH), "Chinese fast-track sentence");
  assert.match(en, /do the \*\*\[Lab\]\(https:\/\/aicourse\.top\/en\/lab\/\)\*\* first: the same ground as stages 0 to 4/);
  assert.match(zh, /先去做 \*\*\[实验室\]\(https:\/\/aicourse\.top\/zh-Hans\/lab\/\)\*\*：和第 0 到第 4 阶段同一块地/);

  /* The hash the handbook writes is the rail's data-p, and the panel id is p-<name>. */
  assert.match(behaviour, /const target='#'\+name/);

  type Row = {
    stage: number;
    dir: string;
    anchor: string | null;
    hbKey: string | null;
    chapter: string | null;
    labStep: number | null;
    labKey: string | null;
    glossKey: string | null;
  };
  const rows: Row[] = [
    { stage: 0, dir: "stage0-hello", anchor: null, hbKey: null, chapter: null, labStep: 1, labKey: "lab.s1.name", glossKey: null },
    { stage: 1, dir: "stage1-kiosk", anchor: "code", hbKey: "hb.code", chapter: "01", labStep: 2, labKey: "lab.s2.name", glossKey: null },
    { stage: 2, dir: "stage2-prompt", anchor: "prompt", hbKey: "hb.prompt", chapter: "02", labStep: 3, labKey: "lab.s3.name", glossKey: null },
    { stage: 3, dir: "stage3-evals", anchor: "evals", hbKey: "hb.evals", chapter: "07", labStep: 4, labKey: "lab.s4.name", glossKey: "lab.s4.h" },
    { stage: 4, dir: "stage4-context", anchor: "context", hbKey: "hb.context", chapter: "03", labStep: 4, labKey: "lab.s4.name", glossKey: "lab.s4.addMenu" },
    { stage: 5, dir: "stage5-loop", anchor: "loop", hbKey: "hb.loop", chapter: "04", labStep: null, labKey: null, glossKey: null },
    { stage: 6, dir: "stage6-harness", anchor: "harness", hbKey: "hb.harness", chapter: "06", labStep: null, labKey: null, glossKey: null },
    { stage: 7, dir: "stage7-graph", anchor: "graph", hbKey: "hb.graph", chapter: "05", labStep: null, labKey: null, glossKey: null },
    { stage: 8, dir: "stage8-security", anchor: "security", hbKey: "hb.security", chapter: "08", labStep: null, labKey: null, glossKey: null },
    { stage: 9, dir: "stage9-project", anchor: null, hbKey: null, chapter: null, labStep: null, labKey: null, glossKey: null },
  ];

  function section(md: string, heading: string): string {
    const at = md.indexOf(heading);
    assert.ok(at >= 0, `missing ${heading}`);
    const rest = md.slice(at);
    const next = rest.indexOf("\n## ", heading.length);
    return next === -1 ? rest : rest.slice(0, next);
  }

  function cells(line: string): string[] {
    const parts = line.split("|").map((part) => part.trim());
    return parts.slice(1, -1);
  }

  function checkCopy(
    md: string,
    heading: string,
    messages: Record<string, string>,
    siteLocale: string,
    stepWord: string,
    stageFile: (dir: string) => string,
  ) {
    const block = section(md, heading);
    assert.ok(block.includes(siteLocale === "en" ? FAST_EN : FAST_ZH), `${siteLocale} fast-track sits with the table`);
    assert.ok(existsSync("app/[locale]/lab/page.tsx"));
    assert.ok(existsSync("app/[locale]/handbook/page.tsx"));

    for (const anchor of [...block.matchAll(/handbook\/#([a-z]+)/g)].map((match) => match[1])) {
      assert.ok(markup.includes(`data-p=\\"${anchor}\\"`), `#${anchor} is not a handbook rail id`);
      assert.ok(markup.includes(`id=\\"p-${anchor}\\"`), `panel p-${anchor} is missing`);
    }
    const labUrls = [...block.matchAll(/\]\((https:\/\/aicourse\.top\/[^)]+)\)/g)]
      .map((match) => match[1])
      .filter((url) => url.includes("/lab"));
    assert.ok(labUrls.length >= 5, `${siteLocale} Lab column should link the steps that exist`);
    for (const url of labUrls) {
      assert.equal(url, `https://aicourse.top/${siteLocale}/lab/`, `${siteLocale} Lab link`);
    }

    for (const spec of rows) {
      const line = block.split("\n").find((item) => item.startsWith(`| ${spec.stage} |`));
      assert.ok(line, `${siteLocale} stage ${spec.stage} row`);
      const [number, stageCell, handbookCell, labCell] = cells(line);
      assert.equal(number, String(spec.stage));
      assert.ok(stageCell.includes(`(${stageFile(spec.dir)})`), `${siteLocale} stage ${spec.stage} link`);
      assert.equal(existsSync(join("course", stageFile(spec.dir).replace(/\/$/, ""))), true, spec.dir);

      if (spec.anchor === null) {
        assert.equal(handbookCell, NONE, `${siteLocale} stage ${spec.stage} handbook`);
      } else {
        assert.ok(handbookCell.includes(`§${spec.chapter} ${messages[spec.hbKey ?? ""]}`), handbookCell);
        assert.ok(handbookCell.includes(`https://aicourse.top/${siteLocale}/handbook/#${spec.anchor}`), handbookCell);
      }

      if (spec.labStep === null) {
        assert.equal(labCell, NONE, `${siteLocale} stage ${spec.stage} Lab`);
      } else {
        assert.ok(labCell.includes(`${stepWord} ${spec.labStep}`), labCell);
        assert.ok(labCell.includes(messages[spec.labKey ?? ""]), labCell);
        assert.ok(labCell.includes(`https://aicourse.top/${siteLocale}/lab/`), labCell);
        if (spec.glossKey) assert.ok(labCell.includes(messages[spec.glossKey]), labCell);
      }
    }

    for (const orphan of [
      { anchor: "start", key: "hb.start", chapter: "00" },
      { anchor: "compare", key: "hb.compare", chapter: "09" },
      { anchor: "play", key: "hb.play", chapter: "10" },
    ]) {
      assert.ok(block.includes(`https://aicourse.top/${siteLocale}/handbook/#${orphan.anchor}`), orphan.anchor);
      assert.ok(block.includes(`§${orphan.chapter} ${messages[orphan.key]}`), `${siteLocale} ${orphan.key}`);
    }
  }

  const enTable = en.indexOf("## The nine guided stages (0–8)");
  const enMap = en.indexOf("## Handbook, Lab and these stages");
  const enReport = en.indexOf("## Your report card");
  assert.ok(enTable >= 0 && enMap > enTable && enReport > enMap, "English table sits with the stages");
  const zhTable = zh.indexOf("## 九个引导阶段（0–8）");
  const zhMap = zh.indexOf("## 手册、实验室与这些阶段");
  const zhReport = zh.indexOf("## 你的成绩单");
  assert.ok(zhTable >= 0 && zhMap > zhTable && zhReport > zhMap, "Chinese table sits with the stages");

  checkCopy(en, "## Handbook, Lab and these stages", enMsg, "en", "Step", (dir) => `${dir}/`);
  checkCopy(zh, "## 手册、实验室与这些阶段", zhMsg, "zh-Hans", "步骤", (dir) => `${dir}/README.zh-Hans.md`);
});

test("the build page tells Lab graduates that stages 1–4 are review", () => {
  assert.match(readFileSync("app/[locale]/build/page.tsx", "utf8"), /\{t\("build\.labReview"\)\}/);
  const expected: Record<string, string> = {
    en: "Done the Lab? Stages 1–4 will be review — this time you write the code.",
    "zh-Hans": "实验室做完了？第 1–4 关会是复习——这一次由你自己写代码。",
    "zh-Hant": "實驗室做完了？第 1–4 階段會是複習——這一次由你自己寫程式。",
    ja: "ラボを終えたなら、ステージ1〜4は復習です。今度は自分でコードを書きます。",
    ko: "실습실을 마쳤다면 1~4단계는 복습입니다. 이번에는 코드를 직접 작성합니다.",
    es: "¿Ya terminaste el Laboratorio? Las etapas 1–4 serán un repaso: esta vez el código lo escribes tú.",
    fr: "L'Atelier est déjà fait ? Les étapes 1 à 4 seront une révision — cette fois, c'est vous qui écrivez le code.",
    de: "Sie haben das Labor schon abgeschlossen? Die Stufen 1–4 sind eine Wiederholung — diesmal schreiben Sie den Code selbst.",
    ar: "أنهيت المختبر؟ ستكون المراحل 1–4 مراجعة — هذه المرة تكتب الشيفرة بنفسك.",
  };
  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    assert.equal(catalog["build.labReview"], expected[locale], locale);
  }
});
