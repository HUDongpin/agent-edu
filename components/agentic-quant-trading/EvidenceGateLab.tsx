"use client";

import { useId, useMemo, useState } from "react";
import styles from "./EvidenceGateLab.module.css";

const GATE_IDS = [
  "chronological-split",
  "point-in-time-data",
  "costs-and-slippage",
  "named-human-review",
  "local-synthetic-only",
] as const;

type GateId = (typeof GATE_IDS)[number];
type GateState = Record<GateId, boolean>;

const EMPTY_GATES: GateState = {
  "chronological-split": false,
  "point-in-time-data": false,
  "costs-and-slippage": false,
  "named-human-review": false,
  "local-synthetic-only": false,
};

const FIXTURE_SHA256 = {
  "market-regime-synthetic-v1.csv":
    "fd3890e80bdb140dae988a98fa3a26f44e3eb5e3abaebfbd8e53ea7c2244aaac",
  "news-signals-synthetic-v1.json":
    "ec7749936666bf987d470a61bc50fda37a82f4046a6293204805d1f44e392294",
  "risk-policy.template.json":
    "bf013a6b0267b7c9a20b3b564018e28eab2ff2184e0787d8a9d78a0b2a200506",
  "local-replay-lab.py":
    "b9e595bf13582486806b33e31a993f69f92f6fcad0c78b7eef94ed9117f2c7f8",
} as const;

type LabFileName = keyof typeof FIXTURE_SHA256;

const LAB_FILES = (Object.entries(FIXTURE_SHA256) as [LabFileName, string][]).map(([name, sha256]) => ({
  name,
  sha256,
  href: `/courses/agentic-quant-trading/${name}`,
}));

const FORMULA = {
  id: "aicourse.synthetic-evidence-decay",
  version: "1.0.0",
  expressions: {
    sharpe_like_score:
      "max(0.10, 2.34 - 0.51*chronological - 0.37*point_in_time - 0.28*costs)",
    maximum_drawdown_percent:
      "-(8.1 + 2.6*chronological + 1.8*point_in_time + 1.1*costs)",
    annual_turnover: "6.8 if costs else 9.4",
  },
} as const;

const COPY = {
  en: {
    eyebrow: "Interactive evidence gate",
    title: "Make an attractive backtest harder to believe",
    intro:
      "Select the claims an auditor would investigate. The figures are deliberately fictional and only demonstrate how evidence controls can deflate an optimistic result; they are not a strategy, forecast, signal, or investment recommendation.",
    claimNoticeTitle: "Claims, not verification",
    claimNotice:
      "Every switch is an unverified learner claim. This screen does not execute the fixtures or prove that a control exists. Use the bundled offline self-test, inspect its assertions, then ask a named human to review the evidence.",
    packTitle: "Download the auditable local replay pack",
    packIntro:
      "Four original, publication-eligible files reproduce the local teaching boundary. Download them, verify the displayed SHA-256 values, inspect the script, then run the self-test with networking disabled.",
    packFileDescriptions: {
      "market-regime-synthetic-v1.csv": "Synthetic market-regime tape",
      "news-signals-synthetic-v1.json": "Synthetic timestamped news signals",
      "risk-policy.template.json": "Executable deterministic risk policy",
      "local-replay-lab.py": "Standard-library-only replay and seven assertions",
    },
    download: "Download",
    selfTest: "Offline self-test",
    expectedResult: "Expected: status=pass, 7/7 assertions, network_calls=0.",
    legend: "Unverified evidence and boundary claims",
    gates: {
      "chronological-split": {
        title: "Chronological split claimed",
        detail: "Training ends before validation begins; no random time-series split.",
      },
      "point-in-time-data": {
        title: "Point-in-time data claimed",
        detail: "Every feature carries known_at and effective_at timestamps.",
      },
      "costs-and-slippage": {
        title: "Costs and slippage claimed",
        detail: "Fees, spread, latency, and adverse fills are charged to the replay.",
      },
      "named-human-review": {
        title: "Named human review claimed",
        detail: "The agent can propose; a named reviewer owns review decisions and policy changes.",
      },
      "local-synthetic-only": {
        title: "Local synthetic boundary claimed",
        detail:
          "Only bundled SYN-A fixtures are in scope; there is no network, external account, secret, or market-action path.",
      },
    },
    status: "Illustrative checklist status",
    incomplete: "ILLUSTRATIVE CHECKLIST INCOMPLETE",
    complete: "ILLUSTRATIVE CHECKLIST COMPLETE",
    incompleteDetail: "One or more learner claims have not been selected.",
    completeDetail:
      "All five unverified claims are selected. The artifact is eligible for named human review only.",
    claimsSelected: "claims selected",
    tableCaption: "Fictional teaching metrics before and after the selected claims",
    tableRegionLabel: "Scrollable table of fictional teaching metrics",
    tableKeyboardHint: "On a narrow screen, focus this table and scroll horizontally to inspect every column.",
    scenario: "Scenario",
    score: "Sharpe-like score",
    drawdown: "Maximum drawdown",
    turnover: "Annual turnover",
    verdict: "Evidence verdict",
    optimistic: "Optimistic notebook",
    reviewed: "Claim-adjusted illustration",
    inadmissible: "Not admissible as evidence",
    incompleteVerdict: "Unverified and incomplete",
    reviewEligible: "Eligible for human review",
    synthetic: "Synthetic fixture SYN-A · no real asset · no market connection",
    formulaNotice: "Illustrative formula aicourse.synthetic-evidence-decay · version 1.0.0",
    disclaimerTitle: "Boundary",
    disclaimer:
      "Illustrative only. Checklist completion and self-test success are not performance evidence, replay permission, investment advice, or authorisation for market action.",
    copyReceipt: "Copy illustrative receipt",
    copied: "Illustrative receipt copied",
    copyFailed: "Clipboard unavailable; the receipt was not copied",
    reset: "Reset claims",
    metricSummary: (score: string, drawdown: string, turnover: string) =>
      `Illustrative claim-adjusted metrics: Sharpe-like score ${score}; maximum drawdown ${drawdown} percent; annual turnover ${turnover} times.`,
  },
  "zh-Hans": {
    eyebrow: "交互式证据闸门",
    title: "让一份漂亮的回测更难被轻信",
    intro:
      "请选择审计者需要核查的主张。所有数值均为刻意设计的虚构示例，只用来说明证据控制如何压低过度乐观的结果；它们不是策略、预测、信号或投资建议。",
    claimNoticeTitle: "这里只记录主张，不完成验证",
    claimNotice:
      "每个开关都只是学习者尚未验证的自述。本页面不会执行夹具，也不能证明控制真实存在。请先运行随附的离线自测、检查逐项断言，再交由具名人员审核证据。",
    packTitle: "下载可审计的本地回放包",
    packIntro:
      "四个原创且可发布的文件共同复现本地教学边界。下载后先核对页面所列 SHA-256、检查脚本，再在断网条件下运行自测。",
    packFileDescriptions: {
      "market-regime-synthetic-v1.csv": "合成市场状态时间带",
      "news-signals-synthetic-v1.json": "带时间戳的合成新闻信号",
      "risk-policy.template.json": "可执行的确定性风险政策",
      "local-replay-lab.py": "仅用 Python 标准库的回放程序与七项断言",
    },
    download: "下载",
    selfTest: "离线自测",
    expectedResult: "预期：status=pass、7/7 项断言通过、network_calls=0。",
    legend: "尚未验证的证据与边界主张",
    gates: {
      "chronological-split": {
        title: "声称已按时间顺序切分",
        detail: "训练期先结束，验证期才开始；时间序列不得随机切分。",
      },
      "point-in-time-data": {
        title: "声称使用时点一致数据",
        detail: "每项特征都携带 known_at 与 effective_at 时间戳。",
      },
      "costs-and-slippage": {
        title: "声称计入成本与滑点",
        detail: "回放必须计入手续费、价差、延迟和不利成交。",
      },
      "named-human-review": {
        title: "声称已安排具名人员审核",
        detail: "智能体只能提出建议；审核结论与政策变更由具名人员负责。",
      },
      "local-synthetic-only": {
        title: "声称仅在本地使用合成数据",
        detail: "范围仅含随附的 SYN-A 夹具；不存在网络、外部账户、秘密信息或市场操作路径。",
      },
    },
    status: "说明性检查表状态",
    incomplete: "说明性检查表尚未完成",
    complete: "说明性检查表已完成",
    incompleteDetail: "仍有一项或多项学习者主张未被选择。",
    completeDetail: "五项未验证主张均已选择；此材料仅可进入具名人员审核。",
    claimsSelected: "项主张已选择",
    tableCaption: "选择不同主张前后的虚构教学指标",
    tableRegionLabel: "可横向滚动的虚构教学指标表",
    tableKeyboardHint: "在窄屏上，请聚焦此表格后横向滚动，以查看所有列。",
    scenario: "情境",
    score: "类 Sharpe 分数",
    drawdown: "最大回撤",
    turnover: "年化换手",
    verdict: "证据判定",
    optimistic: "乐观笔记本",
    reviewed: "按主张调整的示例",
    inadmissible: "不可作为证据采信",
    incompleteVerdict: "未验证且未完成",
    reviewEligible: "可进入人工审核",
    synthetic: "合成样本 SYN-A · 无真实资产 · 不连接市场",
    formulaNotice: "说明性公式 aicourse.synthetic-evidence-decay · 版本 1.0.0",
    disclaimerTitle: "边界声明",
    disclaimer:
      "仅供说明。完成检查表或通过自测，都不是绩效证据、回放许可、投资建议，也不授权任何市场操作。",
    copyReceipt: "复制说明性收据",
    copied: "说明性收据已复制",
    copyFailed: "剪贴板不可用，未能复制收据",
    reset: "重置主张",
    metricSummary: (score: string, drawdown: string, turnover: string) =>
      `按主张调整后的说明性指标：类 Sharpe 分数 ${score}；最大回撤 ${drawdown}%；年化换手 ${turnover} 倍。`,
  },
} as const;

function formatScore(value: number): string {
  return value.toFixed(2);
}

export function EvidenceGateLab({ locale }: { readonly locale: string }) {
  const labels = locale === "zh-Hans" ? COPY["zh-Hans"] : COPY.en;
  const rootId = useId().replace(/:/g, "");
  const [gates, setGates] = useState<GateState>(EMPTY_GATES);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const result = useMemo(() => {
    const count = GATE_IDS.filter((id) => gates[id]).length;
    const evidencePenalty =
      (gates["chronological-split"] ? 0.51 : 0) +
      (gates["point-in-time-data"] ? 0.37 : 0) +
      (gates["costs-and-slippage"] ? 0.28 : 0);
    const drawdownPenalty =
      (gates["chronological-split"] ? 2.6 : 0) +
      (gates["point-in-time-data"] ? 1.8 : 0) +
      (gates["costs-and-slippage"] ? 1.1 : 0);
    const allClaimsChecked = count === GATE_IDS.length;
    return {
      count,
      allClaimsChecked,
      adjustedScore: Math.max(0.1, 2.34 - evidencePenalty),
      adjustedDrawdown: -(8.1 + drawdownPenalty),
      adjustedTurnover: gates["costs-and-slippage"] ? 6.8 : 9.4,
    };
  }, [gates]);

  const toggle = (id: GateId) => {
    setGates((current) => ({ ...current, [id]: !current[id] }));
    setCopyState("idle");
  };

  const copyReceipt = async () => {
    const assertions = GATE_IDS.map((id) => ({
      id,
      claim_selected: gates[id],
      verified: false,
      state: gates[id] ? "claimed-unverified" : "not-claimed",
      failure_reason: gates[id]
        ? "No executable evidence is attached to this UI claim; named human verification is required."
        : "The learner did not select this claim.",
    }));
    const receipt = {
      schema: "aicourse.quant-evidence-gate-receipt.v2",
      course: "agentic-quant-trading",
      fixture: "SYN-A",
      snapshot: "2026-08-26",
      illustrative_only: true,
      checklist_status: result.allClaimsChecked
        ? "illustrative-checklist-complete"
        : "illustrative-checklist-incomplete",
      eligible_for_human_review: result.allClaimsChecked,
      authorises_replay: false,
      authorises_market_action: false,
      fixture_sha256: FIXTURE_SHA256,
      formula: FORMULA,
      assertions,
      failure_reasons: assertions.map((assertion) => assertion.failure_reason),
      illustrative_metrics: {
        sharpe_like_score: Number(formatScore(result.adjustedScore)),
        maximum_drawdown_percent: Number(result.adjustedDrawdown.toFixed(1)),
        annual_turnover: Number(result.adjustedTurnover.toFixed(1)),
      },
      execution_boundary: "bundled-local-synthetic-fixtures-only",
      disclaimer:
        "Illustrative only; checklist completion is not verification, performance evidence, investment advice, replay permission, or authorisation for market action.",
    };
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const scoreText = formatScore(result.adjustedScore);
  const drawdownText = result.adjustedDrawdown.toFixed(1);
  const turnoverText = result.adjustedTurnover.toFixed(1);

  return (
    <section className={styles.lab} aria-labelledby={`${rootId}-title`}>
      <header className={styles.intro}>
        <p>{labels.eyebrow}</p>
        <h2 id={`${rootId}-title`}>{labels.title}</h2>
        <p>{labels.intro}</p>
      </header>

      <div className={styles.claimNotice} id={`${rootId}-claim-notice`} role="note">
        <strong>{labels.claimNoticeTitle}</strong>
        <p>{labels.claimNotice}</p>
      </div>

      <div className={styles.workspace}>
        <fieldset className={styles.gates}>
          <legend>{labels.legend}</legend>
          {GATE_IDS.map((id) => {
            const inputId = `${rootId}-${id}`;
            const detailId = `${inputId}-detail`;
            return (
              <label className={styles.gate} htmlFor={inputId} key={id}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={gates[id]}
                  aria-describedby={`${rootId}-claim-notice ${detailId}`}
                  onChange={() => toggle(id)}
                />
                <span aria-hidden="true" className={styles.switch} />
                <span>
                  <strong>{labels.gates[id].title}</strong>
                  <small id={detailId}>{labels.gates[id].detail}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className={styles.result}>
          <div
            className={result.allClaimsChecked ? styles.reviewEligible : styles.blocked}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden="true">{result.allClaimsChecked ? "✓" : "×"}</span>
            <div>
              <small>{labels.status}</small>
              <strong>{result.allClaimsChecked ? labels.complete : labels.incomplete}</strong>
              <p>
                {result.allClaimsChecked ? labels.completeDetail : labels.incompleteDetail}
              </p>
            </div>
            <b>
              {result.count}/{GATE_IDS.length} {labels.claimsSelected}
            </b>
          </div>

          <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
            {labels.metricSummary(scoreText, drawdownText, turnoverText)}
          </p>

          <p className={styles.tableHint} id={`${rootId}-table-hint`}>
            {labels.tableKeyboardHint}
          </p>
          <div
            className={styles.tableWrap}
            role="region"
            tabIndex={0}
            aria-label={labels.tableRegionLabel}
            aria-describedby={`${rootId}-table-hint`}
          >
            <table>
              <caption>{labels.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col">{labels.scenario}</th>
                  <th scope="col">{labels.score}</th>
                  <th scope="col">{labels.drawdown}</th>
                  <th scope="col">{labels.turnover}</th>
                  <th scope="col">{labels.verdict}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{labels.optimistic}</th>
                  <td>2.34</td>
                  <td>−8.1%</td>
                  <td>9.4×</td>
                  <td>× {labels.inadmissible}</td>
                </tr>
                <tr>
                  <th scope="row">{labels.reviewed}</th>
                  <td>{scoreText}</td>
                  <td>{drawdownText}%</td>
                  <td>{turnoverText}×</td>
                  <td>
                    {result.allClaimsChecked
                      ? `✓ ${labels.reviewEligible}`
                      : `× ${labels.incompleteVerdict}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.fixture}>{labels.synthetic}</p>
          <p className={styles.fixture}>{labels.formulaNotice}</p>
          <div className={styles.disclaimer} role="note">
            <strong>{labels.disclaimerTitle}</strong>
            <p>{labels.disclaimer}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={copyReceipt}>
              {labels.copyReceipt}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setGates({ ...EMPTY_GATES });
                setCopyState("idle");
              }}
            >
              {labels.reset}
            </button>
          </div>
          <p className={styles.announcement} aria-live="polite" aria-atomic="true">
            {copyState === "copied"
              ? labels.copied
              : copyState === "failed"
                ? labels.copyFailed
                : ""}
          </p>
        </div>
      </div>

      <aside className={styles.labPack} aria-labelledby={`${rootId}-pack-title`}>
        <header>
          <p>{labels.selfTest}</p>
          <h3 id={`${rootId}-pack-title`}>{labels.packTitle}</h3>
          <p>{labels.packIntro}</p>
        </header>
        <ul>
          {LAB_FILES.map((file) => (
            <li key={file.name}>
              <a href={file.href} download>
                <span>
                  <strong>{file.name}</strong>
                  <small>{labels.packFileDescriptions[file.name]}</small>
                </span>
                <b>{labels.download} ↓</b>
              </a>
              <code>sha256:{file.sha256}</code>
            </li>
          ))}
        </ul>
        <pre tabIndex={0}><code>python3 local-replay-lab.py --self-test</code></pre>
        <p className={styles.expectedResult}>{labels.expectedResult}</p>
      </aside>
    </section>
  );
}

export default EvidenceGateLab;
