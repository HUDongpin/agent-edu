import type {
  MaterializedAgentOrchestrationCourse,
  MaterializedAgentOrchestrationModule,
} from "@/lib/agent-orchestration";
import styles from "./AgentOrchestrationCourse.module.css";

const RUNTIME_ROWS_EN = [
  {
    surface: "Responses Multi-agent",
    layer: "Provider API · Beta",
    unit: "Active descendant agent turns",
    root: "`/root` excluded",
    owner: "Hosted root agent",
  },
  {
    surface: "Codex subagents",
    layer: "Coding runtime",
    unit: "Open spawned threads",
    root: "Primary thread excluded",
    owner: "Task-tree coordinator",
  },
  {
    surface: "OpenAI Agents SDK",
    layer: "SDK / application",
    unit: "Runs, tools, handoffs",
    root: "Application-defined",
    owner: "Manager or current agent",
  },
  {
    surface: "Claude Agent SDK",
    layer: "SDK / runtime",
    unit: "Isolated subagent contexts",
    root: "Parent context retained",
    owner: "Parent or selected subagent",
  },
  {
    surface: "MCP 2026-07-28",
    layer: "Capability protocol",
    unit: "Self-contained requests",
    root: "No agent hierarchy",
    owner: "Host application",
  },
] as const;

const RUNTIME_ROWS_ZH = [
  {
    surface: "Responses Multi-agent",
    layer: "提供商 API · Beta",
    unit: "活跃的后代智能体轮次",
    root: "不计 `/root`",
    owner: "托管根智能体",
  },
  {
    surface: "Codex subagents",
    layer: "编码运行时",
    unit: "已打开的派生任务线程",
    root: "不计主线程",
    owner: "任务树协调者",
  },
  {
    surface: "OpenAI Agents SDK",
    layer: "SDK / 应用层",
    unit: "运行、工具与交接",
    root: "由应用定义",
    owner: "经理或当前智能体",
  },
  {
    surface: "Claude Agent SDK",
    layer: "SDK / 运行时",
    unit: "隔离的子智能体上下文",
    root: "保留父上下文",
    owner: "父智能体或已选子智能体",
  },
  {
    surface: "MCP 2026-07-28",
    layer: "能力协议",
    unit: "自包含请求",
    root: "没有智能体层级",
    owner: "宿主应用",
  },
] as const;

function label(
  labels: Readonly<Record<string, string>>,
  key: string,
  fallback: string,
): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export function RuntimeSemanticsLedger({
  contentLocale,
}: {
  contentLocale: string;
}) {
  const chinese = contentLocale === "zh-Hans";
  const rows = chinese ? RUNTIME_ROWS_ZH : RUNTIME_ROWS_EN;
  const headers = [
    { id: "runtime-surface-header", label: chinese ? "运行表面" : "Surface" },
    { id: "runtime-layer-header", label: chinese ? "层次" : "Layer" },
    { id: "runtime-unit-header", label: chinese ? "容量 / 工作单元" : "Capacity / work unit" },
    { id: "runtime-root-header", label: chinese ? "根节点语义" : "Root semantics" },
    { id: "runtime-owner-header", label: chinese ? "控制所有者" : "Control owner" },
  ] as const;
  return (
    <div className={styles.runtimeLedger}>
      <div className={styles.runtimeTable} role="table" aria-label={chinese ? "运行时特定的编排语义" : "Runtime-specific orchestration semantics"}>
        <div role="row" className={styles.runtimeHeader}>
          {headers.map((header) => (
            <span role="columnheader" id={header.id} key={header.id}>{header.label}</span>
          ))}
        </div>
        {rows.map((row) => (
          <div role="row" key={row.surface}>
            <strong role="cell" aria-label={`${headers[0].label}: ${row.surface}`} data-label={headers[0].label}>{row.surface}</strong>
            <span role="cell" aria-label={`${headers[1].label}: ${row.layer}`} data-label={headers[1].label}>{row.layer}</span>
            <span role="cell" aria-label={`${headers[2].label}: ${row.unit}`} data-label={headers[2].label}>{row.unit}</span>
            <span role="cell" aria-label={`${headers[3].label}: ${row.root}`} data-label={headers[3].label}>{row.root}</span>
            <span role="cell" aria-label={`${headers[4].label}: ${row.owner}`} data-label={headers[4].label}>{row.owner}</span>
          </div>
        ))}
      </div>
      <p>
        {chinese
          ? "相同词语可能对应不同契约：容量和所有权由具体运行时定义。没有最新来源时，不要把某一行关于 slot、root 或 session 的事实移植到另一行。"
          : "Same words, different contracts: capacity and ownership are runtime-defined. Never copy a ‘slot,’ ‘root,’ or ‘session’ claim across rows without a fresh source."}
      </p>
    </div>
  );
}

export function CourseTopology({
  course,
}: {
  course: MaterializedAgentOrchestrationCourse;
}) {
  const labels = course.contentLocale === "zh-Hans"
    ? {
        intake: "任务入口",
        gate: "确定性边界",
        manager: "控制所有者",
        workers: "有界执行者",
        verifier: "证据验证",
        release: "人类 / 发布门",
        control: "控制面",
        effects: "行动与副作用面",
        reference: "参考架构 / 课程原创",
        title: "在动态系统中保留一条可问责的路径",
        summary: "这是课程对来源的原创综合，并非从任何提供商复制的图。即使模型在有界节点内选择工作，稳定控制主干仍然显式存在。",
        scope: ["范围 + 基线", "路由 + 契约", "预算 + 所有权", "工具 + 隔离", "测试 + 不确定性", "审批 + 发布"],
        effectLevels: ["读取", "可逆写入", "外部写入", "不可逆行动"],
        relationTitle: "语义关系账本",
        relations: [
          ["边界门 → 经理", "路由结果与类型化任务契约"],
          ["经理 → 执行者", "权限、期限、预算与状态所有权"],
          ["执行者 → 验证者", "结果、出处、不确定性与副作用日志"],
          ["验证者 → 发布门", "确定性检查、评估证据与未决风险"],
          ["发布门 → 副作用", "产生副作用前进行行动时授权"],
        ],
      }
    : {
        intake: "Task intake",
        gate: "Deterministic gate",
        manager: "Control owner",
        workers: "Bounded executors",
        verifier: "Evidence verification",
        release: "Human / release gate",
        control: "Control plane",
        effects: "Action + effect plane",
        reference: "Reference architecture / course original",
        title: "One accountable path through a dynamic system",
        summary: "A visual synthesis of the course—not a diagram copied from a provider. The stable spine is explicit even when a model chooses work inside a bounded node.",
        scope: ["scope + baseline", "route + contract", "budget + ownership", "tools + isolation", "tests + uncertainty", "approval + rollout"],
        effectLevels: ["read", "reversible write", "external write", "irreversible"],
        relationTitle: "Semantic relation ledger",
        relations: [
          ["Gate → Manager", "Route plus typed task contract"],
          ["Manager → Executors", "Authority, deadline, budget, state ownership"],
          ["Executors → Verifier", "Result, provenance, uncertainty, effect journal"],
          ["Verifier → Release", "Deterministic checks, eval evidence, unresolved risk"],
          ["Release → Effects", "Action-time authorization before side effect"],
        ],
      };
  const nodes = [labels.intake, labels.gate, labels.manager, labels.workers, labels.verifier, labels.release];

  return (
    <figure className={styles.topologyFigure} aria-labelledby="course-topology-title">
      <figcaption>
        <span>{labels.reference}</span>
        <h2 id="course-topology-title">{labels.title}</h2>
        <p>{labels.summary}</p>
      </figcaption>
      <div className={styles.topologyCanvas}>
        <div className={styles.planeLabel}>{labels.control}</div>
        <ol className={styles.topologyNodes}>
          {nodes.map((node, index) => (
            <li key={node} data-node={index + 1}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{node}</strong>
              <small>{labels.scope[index]}</small>
            </li>
          ))}
        </ol>
        <div className={styles.effectRail}>
          <span>{labels.effects}</span>
          <i />
          {labels.effectLevels.map((effect) => <span key={effect}>{effect}</span>)}
        </div>
      </div>
      <div className={styles.relationLedger}>
        <h3>{labels.relationTitle}</h3>
        <dl>
          {labels.relations.map(([relation, meaning]) => (
            <div key={relation}><dt>{relation}</dt><dd>{meaning}</dd></div>
          ))}
        </dl>
      </div>
    </figure>
  );
}

export function ModuleContractMap({
  module,
  labels,
}: {
  module: MaterializedAgentOrchestrationModule;
  labels: Readonly<Record<string, string>>;
}) {
  const fields = [
    [label(labels, "topology", "Topology"), module.copy.contract.topology],
    [label(labels, "trigger", "Trigger"), module.copy.contract.trigger],
    [label(labels, "completion", "Completion"), module.copy.contract.completion],
    [label(labels, "controlOwner", "Control owner"), module.copy.contract.controlOwner],
    [label(labels, "stateOwner", "State owner"), module.copy.contract.stateOwner],
    [label(labels, "contextBoundary", "Context boundary"), module.copy.contract.contextBoundary],
    [label(labels, "toolAuthority", "Tool authority"), module.copy.contract.toolAuthority],
    [label(labels, "delegationPayload", "Delegation payload"), module.copy.contract.delegationPayload],
    [label(labels, "concurrencyPolicy", "Concurrency"), module.copy.contract.concurrencyPolicy],
    [label(labels, "failurePolicy", "Failure policy"), module.copy.contract.failurePolicy],
    [label(labels, "evidence", "Evidence"), module.copy.contract.evidence],
    [label(labels, "escalation", "Escalation"), module.copy.contract.escalation],
  ] as const;
  return (
    <section className={styles.contractMap} id="module-contract" aria-labelledby="module-contract-title">
      <header>
        <div>
          <p className={styles.sectionLabel}>{label(labels, "contract", "12-field execution contract")}</p>
          <h2 id="module-contract-title">{label(labels, "contractTitle", "Make the orchestration boundary inspectable")}</h2>
        </div>
        <span>{String(module.order).padStart(2, "0")} / 15</span>
      </header>
      <dl>
        {fields.map(([term, description], index) => (
          <div key={term}>
            <dt><span>{String(index + 1).padStart(2, "0")}</span>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
