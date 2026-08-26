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
    "e36633cae9b1683149037ef87460d81008af95cae07ab30338b11474b6d41f0e",
  "news-signals-synthetic-v1.json":
    "795dd19a8f9781c1c7d1f62a56011e465e038772161adb4e3ac30815670701f1",
  "risk-policy.template.json":
    "043235aabc48e388134d593b88297860c9ebf1220dd0c6c2f7385864fd1a8f5f",
  "fixture-contract-self-test.py":
    "ef4f7451c42a6d794b3e3a3097a2a372d658c8c014da33e14da4d66e70ccf3dd",
  "LICENSE.txt":
    "2a24b39b930cf5c7cce0abb47db1752414ff30ae44f2f3359769a4c9d37f67a5",
  "provenance.v1.json":
    "d8e5cbf5c8158d03c28912ce4c67519a1e3ceaff4082e5847c0232863dab2304",
} as const;

type LabFileName = keyof typeof FIXTURE_SHA256;

const LAB_FILES = (Object.entries(FIXTURE_SHA256) as [LabFileName, string][]).map(([name, sha256]) => ({
  name,
  sha256,
  href: `/courses/agentic-quant-trading/${name}`,
}));

const COPY = {
  en: {
    eyebrow: "Interactive evidence gate",
    title: "Separate audit claims from executable evidence",
    intro:
      "Select the claims an auditor would investigate. This page records claim status only: it does not execute a strategy, change a performance result, produce a signal, or make an investment recommendation.",
    claimNoticeTitle: "Claims, not verification",
    claimNotice:
      "Every switch is an unverified learner claim. This screen does not execute the fixtures or prove that a control exists. Use the bundled offline self-test, inspect its assertions, then ask a named human to review the evidence.",
    packTitle: "Download the bounded fixture-contract pack",
    packIntro:
      "Download all six publication-eligible pack files into the same local directory, including the MIT licence. The provenance manifest supplies the expected hashes consumed by the self-test, which checks synthetic identity, bar-date ordering, declared timestamp ordering, and selected policy fields. It does not execute a strategy, intent, order lifecycle, fill, cost model, P&L calculation, risk calculation, kill switch, or reconciliation.",
    packFileDescriptions: {
      "market-regime-synthetic-v1.csv": "Synthetic OHLCV tape with an observation cutoff plus four availability/decision clocks; regime labels are evaluation-only",
      "news-signals-synthetic-v1.json": "Synthetic timestamped news signals",
      "risk-policy.template.json": "Declarative local boundary and synthetic-threshold template",
      "fixture-contract-self-test.py": "Standard-library-only contract self-test; no strategy or execution path",
      "LICENSE.txt": "MIT licence and copyright notice that must remain with redistributed copies",
      "provenance.v1.json": "Required provenance manifest and expected hashes consumed by the self-test",
    },
    download: "Download",
    selfTest: "Offline self-test",
    expectedResult: "Expected: status=pass, 7/7 bounded assertions, network_client_code_present=false, network_isolation_verified=false.",
    legend: "Unverified evidence and boundary claims",
    gates: {
      "chronological-split": {
        title: "Chronological split claimed",
        detail: "Training ends before validation begins; no random time-series split.",
      },
      "point-in-time-data": {
        title: "Point-in-time data claimed",
        detail: "Every input declares available_at, ingested_at, known_at, and decision_at; actual learner code still needs independent verification.",
      },
      "costs-and-slippage": {
        title: "Costs and slippage claimed",
        detail: "Fees, spread, latency, and adverse fills would need an order/fill fixture; the bundled self-test does not validate this claim.",
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
    metricsRegionLabel: "Performance metrics not-computable notice",
    metricsTitle: "Performance metrics: NOT COMPUTABLE",
    metricsReason:
      "This pack contains no strategy-return, benchmark or risk-free return, position, order, fill, fee, slippage, or portfolio-equity series. Sharpe ratio, maximum drawdown, turnover, and net-of-cost performance therefore cannot be calculated.",
    metricsInputsTitle: "Missing inputs",
    metricsInputs: ["Strategy and benchmark return series", "Positions, orders, and fills", "Fees, slippage, and portfolio equity"],
    synthetic: "Synthetic fixture SYN-A · no real asset · no market connection",
    selfTestBoundary: "The self-test verifies declared fixture fields only; it is not a no-look-ahead strategy proof or OS-level network-isolation attestation.",
    disclaimerTitle: "Boundary",
    disclaimer:
      "Illustrative only. Checklist completion and self-test success are not performance evidence, replay permission, investment advice, or authorisation for market action.",
    copyReceipt: "Copy illustrative receipt",
    copied: "Illustrative receipt copied",
    copyFailed: "Clipboard unavailable; the receipt was not copied",
    reset: "Reset claims",
  },
  "zh-Hans": {
    eyebrow: "交互式证据闸门",
    title: "把审计主张与可执行证据分开",
    intro:
      "请选择审计者需要核查的主张。本页面只登记主张状态：不会执行策略、改变绩效结果、产生信号或给出投资建议。",
    claimNoticeTitle: "这里只记录主张，不完成验证",
    claimNotice:
      "每个开关都只是学习者尚未验证的自述。本页面不会执行夹具，也不能证明控制真实存在。请先运行随附的离线自测、检查逐项断言，再交由具名人员审核证据。",
    packTitle: "下载有边界的 fixture 契约包",
    packIntro:
      "请把六个可发布的打包文件全部下载到同一个本地目录，其中包括 MIT 许可证。provenance 清单提供自测读取的预期哈希；自测只检查合成身份、bar 日期顺序、已声明的时间先后与部分政策字段，不执行策略、意图、订单生命周期、成交、成本、盈亏、风险计算、紧急停止或对账。",
    packFileDescriptions: {
      "market-regime-synthetic-v1.csv": "带观测截止点及四个可得性/决策时钟的合成 OHLCV；状态标签仅供事后评估",
      "news-signals-synthetic-v1.json": "带时间戳的合成新闻信号",
      "risk-policy.template.json": "声明式本地边界与合成阈值模板",
      "fixture-contract-self-test.py": "仅用 Python 标准库的契约自测；没有策略或执行路径",
      "LICENSE.txt": "再分发副本必须保留的 MIT 许可证与版权声明",
      "provenance.v1.json": "自测必需的来源清单与预期哈希",
    },
    download: "下载",
    selfTest: "离线自测",
    expectedResult: "预期：status=pass、7/7 项有边界断言通过、network_client_code_present=false、network_isolation_verified=false。",
    legend: "尚未验证的证据与边界主张",
    gates: {
      "chronological-split": {
        title: "声称已按时间顺序切分",
        detail: "训练期先结束，验证期才开始；时间序列不得随机切分。",
      },
      "point-in-time-data": {
        title: "声称使用时点一致数据",
        detail: "每项输入都声明 available_at、ingested_at、known_at 与 decision_at；学习者代码是否遵守仍须独立核验。",
      },
      "costs-and-slippage": {
        title: "声称计入成本与滑点",
        detail: "手续费、价差、延迟与不利成交需要订单/成交 fixture；随附自测不会验证此主张。",
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
    metricsRegionLabel: "绩效指标不可计算说明",
    metricsTitle: "绩效指标：不可计算",
    metricsReason:
      "当前包没有策略收益、基准或无风险收益、头寸、订单、成交、费用、滑点或组合净值序列，因此不能计算 Sharpe Ratio、最大回撤、换手率或成本后表现。",
    metricsInputsTitle: "缺少的输入",
    metricsInputs: ["策略与基准收益序列", "头寸、订单与成交", "费用、滑点与组合净值"],
    synthetic: "合成样本 SYN-A · 无真实资产 · 不连接市场",
    selfTestBoundary: "自测只核验已声明的 fixture 字段，不证明策略无前视，也不证明操作系统级网络隔离。",
    disclaimerTitle: "边界声明",
    disclaimer:
      "仅供说明。完成检查表或通过自测，都不是绩效证据、回放许可、投资建议，也不授权任何市场操作。",
    copyReceipt: "复制说明性收据",
    copied: "说明性收据已复制",
    copyFailed: "剪贴板不可用，未能复制收据",
    reset: "重置主张",
  },
} as const;

export function EvidenceGateLab({ locale }: { readonly locale: string }) {
  const labels = locale === "zh-Hans" ? COPY["zh-Hans"] : COPY.en;
  const rootId = useId().replace(/:/g, "");
  const [gates, setGates] = useState<GateState>(EMPTY_GATES);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const result = useMemo(() => {
    const count = GATE_IDS.filter((id) => gates[id]).length;
    const allClaimsChecked = count === GATE_IDS.length;
    return { count, allClaimsChecked };
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
      assertions,
      failure_reasons: assertions.map((assertion) => assertion.failure_reason),
      performance_metrics: {
        status: "not-computable",
        reason: labels.metricsReason,
        missing_inputs: labels.metricsInputs,
      },
      execution_boundary: {
        mode: "local-synthetic-replay",
        declared_only: true,
        runtime_enforcement_verified: false,
        network_isolation_verified: false,
        network_allowed: false,
        external_accounts_allowed: false,
        credentials_allowed: false,
        remote_endpoints_allowed: false,
        market_action_allowed: false,
      },
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

          <div
            className={styles.tableWrap}
            role="region"
            tabIndex={0}
            aria-label={labels.metricsRegionLabel}
          >
            <div>
              <strong>{labels.metricsTitle}</strong>
              <p>{labels.metricsReason}</p>
              <h3>{labels.metricsInputsTitle}</h3>
              <ul>
                {labels.metricsInputs.map((input) => <li key={input}>{input}</li>)}
              </ul>
            </div>
          </div>
          <p className={styles.fixture}>{labels.synthetic}</p>
          <p className={styles.fixture}>{labels.selfTestBoundary}</p>
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
        <pre tabIndex={0}><code>python3 fixture-contract-self-test.py --self-test</code></pre>
        <p className={styles.expectedResult}>{labels.expectedResult}</p>
      </aside>
    </section>
  );
}

export default EvidenceGateLab;
