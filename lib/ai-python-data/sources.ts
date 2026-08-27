import {
  COURSE_KIT_SOURCE_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitSourceRecord,
} from "../course-kit/types";
import type { CourseKitSourceAuthoringSeed } from "../course-kit/authoring";

const ACCESSED_ON = "2026-08-26";

export const AI_PYTHON_DATA_SOURCE_SEEDS = [
  {
    record: {
      id: "python-docs",
      title: "The Python Tutorial and Errors and Exceptions",
      publisher: "Python Software Foundation",
      url: "https://docs.python.org/3/tutorial/",
      evidenceUrls: [
        "https://docs.python.org/3/tutorial/",
        "https://docs.python.org/3/tutorial/errors.html",
        "https://docs.python.org/3/license.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "Python 3.14.7 documentation, updated 2026-08-25",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PSF License Version 2; documentation examples additionally offered under 0BSD",
      supports:
        "Python 3.14 language execution, values, functions, exceptions, and the documented distinction between syntax errors and runtime exceptions.",
      boundary:
        "The documentation describes current language and library behavior; it does not prove that a learner's program is correct, reproducible, secure, or suitable for production.",
    },
    zhHans: {
      supports: "支持 Python 3.14 的执行、值、函数、异常，以及语法错误与运行时异常的官方定义。",
      boundary: "文档只说明当前语言和库行为，不能证明学习者程序正确、可复现、安全或适合生产。",
    },
  },
  {
    record: {
      id: "python-venv",
      title: "venv — Creation of virtual environments",
      publisher: "Python Software Foundation",
      url: "https://docs.python.org/3/library/venv.html",
      evidenceUrls: [
        "https://docs.python.org/3/library/venv.html",
        "https://docs.python.org/3/license.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "Python 3.14.x",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PSF License Version 2; documentation examples additionally offered under 0BSD",
      supports:
        "Creating isolated Python environments and treating an environment as disposable and reproducible from a dependency declaration.",
      boundary:
        "A virtual environment is not a portable application bundle, and an environment directory alone does not record operating-system, hardware, or external-service dependencies.",
    },
    zhHans: {
      supports: "支持创建隔离的 Python 环境，并从依赖声明重建可丢弃的环境。",
      boundary: "虚拟环境不是可移植应用包，目录本身也不会记录操作系统、硬件或外部服务依赖。",
    },
  },
  {
    record: {
      id: "jupyter-docs",
      title: "Project Jupyter Documentation",
      publisher: "Project Jupyter",
      url: "https://docs.jupyter.org/en/latest/",
      evidenceUrls: [
        "https://docs.jupyter.org/en/latest/",
        "https://nbformat.readthedocs.io/en/latest/format_description.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "rolling documentation accessed 2026-08-26",
      kind: "official-documentation",
      stability: "current-documentation",
      reuseStatus: "licence-noted-no-copy",
      licence: "Project Jupyter BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "The notebook document model, code-cell execution metadata, and the separation between a saved document and a live kernel session.",
      boundary:
        "A saved notebook can contain stale outputs or hidden execution state; its presence is not evidence that cells run cleanly from a fresh kernel.",
    },
    zhHans: {
      supports: "支持 notebook 文档模型、代码单元执行元数据，以及已保存文档与实时内核会话的区分。",
      boundary: "已保存 notebook 可能包含过期输出或隐藏状态；文件存在不代表它能从全新内核顺序运行。",
    },
  },
  {
    record: {
      id: "notebook-reproducibility",
      title: "Ten Simple Rules for Reproducible Research in Jupyter Notebooks",
      publisher: "PLOS Computational Biology",
      url: "https://doi.org/10.1371/journal.pcbi.1007007",
      evidenceUrls: ["https://doi.org/10.1371/journal.pcbi.1007007"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2019-07-25",
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "licence-noted-no-copy",
      licence: "CC BY 4.0; this course uses an original synthesis and does not copy figures",
      supports:
        "Practical notebook reproducibility practices such as documenting dependencies, controlling hidden state, recording data provenance, and testing a clean run.",
      boundary:
        "These practices improve auditability but cannot guarantee bit-for-bit equality across library versions, platforms, hardware, or nondeterministic services.",
    },
    zhHans: {
      supports: "支持记录依赖、控制隐藏状态、保存数据来源并验证全新运行等 notebook 可复现实践。",
      boundary: "这些实践提高可审查性，但不能保证跨库版本、平台、硬件或非确定性服务逐位一致。",
    },
  },
  {
    record: {
      id: "pytest-docs",
      title: "pytest documentation",
      publisher: "pytest project",
      url: "https://docs.pytest.org/en/stable/",
      evidenceUrls: [
        "https://docs.pytest.org/en/stable/",
        "https://docs.pytest.org/en/stable/how-to/assert.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "stable rolling documentation accessed 2026-08-26",
      kind: "official-documentation",
      stability: "current-documentation",
      reuseStatus: "licence-noted-no-copy",
      licence: "MIT project licence; linked and paraphrased only",
      supports:
        "Executable assertions, expected exceptions, and focused tests that turn a data or program expectation into a repeatable check.",
      boundary:
        "Passing tests establish only the encoded cases and assertions; they do not establish untested business meaning, data truth, fairness, or complete correctness.",
    },
    zhHans: {
      supports: "支持用可执行断言、预期异常和聚焦测试，把程序或数据预期转成可重复检查。",
      boundary: "测试通过只覆盖已编码的案例与断言，不能证明未测试的业务含义、数据真实性、公平或完整正确性。",
    },
  },
  {
    record: {
      id: "typing-spec",
      title: "Python Typing Specification",
      publisher: "Python typing community and Python Software Foundation ecosystem",
      url: "https://typing.python.org/en/latest/spec/",
      evidenceUrls: ["https://typing.python.org/en/latest/spec/"],
      accessedOn: ACCESSED_ON,
      revision: "rolling specification accessed 2026-08-26",
      kind: "normative-standard",
      stability: "current-documentation",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The semantics expected of Python type checkers and the role of annotations as machine-checkable interface claims.",
      boundary:
        "Type annotations are not runtime validation by default, and a clean type check does not prove data values, side effects, or domain assumptions are correct.",
    },
    zhHans: {
      supports: "支持 Python 类型检查器应遵循的语义，以及注解作为可机器检查接口声明的作用。",
      boundary: "类型注解默认不是运行时验证；类型检查通过也不能证明数据值、副作用或领域假设正确。",
    },
  },
  {
    record: {
      id: "numpy-arrays-random",
      title: "NumPy quickstart and random sampling documentation",
      publisher: "NumPy project",
      url: "https://numpy.org/doc/stable/user/quickstart.html",
      evidenceUrls: [
        "https://numpy.org/doc/stable/user/quickstart.html",
        "https://numpy.org/doc/stable/reference/random/",
        "https://numpy.org/doc/stable/reference/random/generator.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "NumPy 2.5 stable documentation",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "Array shape, axis, broadcasting, vectorized operations, and use of a Generator such as default_rng for explicit pseudorandom state.",
      boundary:
        "A seed is not cryptographic protection and does not guarantee identical results across algorithms, releases, hardware, parallel schedules, or external libraries.",
    },
    zhHans: {
      supports: "支持数组形状、轴、广播、向量化运算，以及用 default_rng 等 Generator 显式管理伪随机状态。",
      boundary: "种子不是密码学保护，也不保证跨算法、版本、硬件、并行调度或外部库得到完全相同结果。",
    },
  },
  {
    record: {
      id: "pandas-tabular",
      title: "pandas User Guide",
      publisher: "pandas project",
      url: "https://pandas.pydata.org/docs/user_guide/index.html",
      evidenceUrls: [
        "https://pandas.pydata.org/docs/user_guide/index.html",
        "https://pandas.pydata.org/docs/user_guide/10min.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "pandas 3.0.5 documentation",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "Labeled tabular objects, explicit column selection, filtering, grouping, aggregation, and typed inspection in pandas 3.0.x.",
      boundary:
        "A DataFrame does not itself establish tidy structure, semantic validity, unit consistency, provenance, or appropriate statistical inference.",
    },
    zhHans: {
      supports: "支持 pandas 3.0.x 中带标签的表格对象、显式选列、筛选、分组、聚合与类型检查。",
      boundary: "DataFrame 本身不能证明数据整洁、语义有效、单位一致、来源完整或统计推断恰当。",
    },
  },
  {
    record: {
      id: "tidy-data-paper",
      title: "Tidy Data",
      publisher: "Journal of Statistical Software",
      url: "https://doi.org/10.18637/jss.v059.i10",
      evidenceUrls: ["https://doi.org/10.18637/jss.v059.i10"],
      accessedOn: ACCESSED_ON,
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The organizing principle that variables form columns, observations form rows, and observational units form tables for many analytic workflows.",
      boundary:
        "Tidy data is an organizing convention, not the only valid data model and not proof that variables, observations, or units were defined correctly.",
    },
    zhHans: {
      supports: "支持在许多分析流程中以列表示变量、以行表示观察、以表表示观察单元的组织原则。",
      boundary: "整洁数据是一种组织约定，不是唯一有效数据模型，也不能证明变量、观察或单元定义正确。",
    },
  },
  {
    record: {
      id: "pandas-missing",
      title: "Working with missing data",
      publisher: "pandas project",
      url: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
      evidenceUrls: ["https://pandas.pydata.org/docs/user_guide/missing_data.html"],
      accessedOn: ACCESSED_ON,
      revision: "pandas 3.0.x documentation",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "The distinct pandas missing-value sentinels, nullable dtypes, detection operations, and propagation behavior relevant to a cleaning plan.",
      boundary:
        "Drop, fill, and imputation choices are substantive modeling decisions; an API operation cannot determine whether missingness is ignorable or what value is defensible.",
    },
    zhHans: {
      supports: "支持 pandas 缺失值标记、可空类型、检测操作与传播行为，供清洗方案使用。",
      boundary: "删除、填补和插补是实质性建模决定；API 无法判断缺失是否可忽略，也无法决定哪种值合理。",
    },
  },
  {
    record: {
      id: "frictionless-specs",
      title: "Frictionless Data Specifications",
      publisher: "Frictionless Data",
      url: "https://specs.frictionlessdata.io/",
      evidenceUrls: [
        "https://specs.frictionlessdata.io/",
        "https://specs.frictionlessdata.io/data-package/",
        "https://specs.frictionlessdata.io/table-schema/",
      ],
      accessedOn: ACCESSED_ON,
      revision: "rolling specifications accessed 2026-08-26",
      kind: "normative-standard",
      stability: "current-documentation",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Machine-readable package metadata, resource paths, field schemas, constraints, and checksums as components of a portable data receipt.",
      boundary:
        "A package or schema that validates can still contain false, biased, stale, mislicensed, or semantically inappropriate data.",
    },
    zhHans: {
      supports: "支持用机器可读的包元数据、资源路径、字段模式、约束与校验和形成可移交数据收据。",
      boundary: "通过包或模式验证的数据仍可能虚假、有偏、过期、许可错误或语义不合适。",
    },
  },
  {
    record: {
      id: "nist-statistics",
      title: "NIST/SEMATECH e-Handbook of Statistical Methods",
      publisher: "National Institute of Standards and Technology",
      url: "https://www.itl.nist.gov/div898/handbook/",
      evidenceUrls: ["https://www.itl.nist.gov/div898/handbook/"],
      accessedOn: ACCESSED_ON,
      kind: "official-guidance",
      stability: "stable-concept",
      reuseStatus: "licence-noted-no-copy",
      licence: "United States government work boundary; third-party material may be separately protected",
      supports:
        "Descriptive summaries, exploratory analysis, sampling assumptions, uncertainty, and the need to connect a statistic to a data-generating process.",
      boundary:
        "A descriptive statistic does not identify a causal effect, repair biased sampling, or justify population inference without a defensible design and assumptions.",
    },
    zhHans: {
      supports: "支持描述性汇总、探索分析、抽样假设与不确定性，并要求把统计量连接到数据生成过程。",
      boundary: "描述性统计不能识别因果效应、修复偏差抽样，也不能在缺乏合理设计与假设时支持总体推断。",
    },
  },
  {
    record: {
      id: "scipy-bootstrap",
      title: "scipy.stats.bootstrap",
      publisher: "SciPy project",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html",
      evidenceUrls: ["https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html"],
      accessedOn: ACCESSED_ON,
      revision: "SciPy 1.18 current documentation",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "The current SciPy bootstrap interface, paired-sample option, confidence-level parameter, random-state control, and documented interval methods.",
      boundary:
        "Bootstrap output inherits the sample, statistic, dependence, and resampling assumptions; a narrow interval is not proof that the sample represents the target population.",
    },
    zhHans: {
      supports: "支持当前 SciPy bootstrap 接口、配对样本选项、置信水平、随机状态控制与区间方法。",
      boundary: "自助法输出继承样本、统计量、依赖结构与重抽样假设；窄区间不证明样本代表目标总体。",
    },
  },
  {
    record: {
      id: "matplotlib-quickstart",
      title: "Matplotlib quick start guide",
      publisher: "Matplotlib project",
      url: "https://matplotlib.org/stable/users/explain/quick_start.html",
      evidenceUrls: ["https://matplotlib.org/stable/users/explain/quick_start.html"],
      accessedOn: ACCESSED_ON,
      revision: "stable rolling documentation accessed 2026-08-26",
      kind: "official-documentation",
      stability: "current-documentation",
      reuseStatus: "licence-noted-no-copy",
      licence: "Matplotlib BSD-compatible project licence; course charts are original",
      supports:
        "The Figure/Axes model, labeled plotting, scales, legends, annotations, and explicit layout control used to build an original chart.",
      boundary:
        "A plotting API can render misleading encodings; it does not choose an honest denominator, baseline, scale, aggregation, uncertainty display, or comparison.",
    },
    zhHans: {
      supports: "支持以 Figure/Axes、标签、比例尺、图例、注释与显式布局控制制作原创图表。",
      boundary: "绘图库也能渲染误导性编码；它不会替你选择诚实的分母、基线、尺度、聚合、不确定性或比较。",
    },
  },
  {
    record: {
      id: "csvw-recommendation",
      title: "Model for Tabular Data and Metadata on the Web",
      publisher: "World Wide Web Consortium",
      url: "https://www.w3.org/TR/2015/REC-tabular-data-model-20151217/",
      evidenceUrls: ["https://www.w3.org/TR/2015/REC-tabular-data-model-20151217/"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2015-12-17",
      revision: "W3C Recommendation 17 December 2015",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A standard model for describing tables, columns, datatypes, dialects, foreign keys, and metadata for CSV-like resources on the Web.",
      boundary:
        "Conformance describes structure and metadata, not the truth, completeness, ethical collection, or fitness of the records.",
    },
    zhHans: {
      supports: "支持以标准模型描述网络表格、列、数据类型、方言、外键及 CSV 类资源元数据。",
      boundary: "符合结构和元数据标准不代表记录真实、完整、采集合乎伦理或适合特定用途。",
    },
  },
  {
    record: {
      id: "json-rfc8259",
      title: "RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format",
      publisher: "Internet Engineering Task Force",
      url: "https://www.rfc-editor.org/rfc/rfc8259",
      evidenceUrls: ["https://www.rfc-editor.org/rfc/rfc8259"],
      accessedOn: ACCESSED_ON,
      revision: "RFC 8259",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "JSON grammar, values, object member names, arrays, number interoperability limits, and UTF-8 requirements for exchanged JSON text.",
      boundary:
        "Valid JSON carries no domain schema, authorization, provenance, freshness, completeness, or guarantee that a remote response is trustworthy.",
    },
    zhHans: {
      supports: "支持 JSON 语法、值、对象成员名、数组、数字互操作限制与交换文本的 UTF-8 要求。",
      boundary: "合法 JSON 不包含领域模式、授权、来源、时效、完整性，也不保证远程响应可信。",
    },
  },
  {
    record: {
      id: "http-rfc9110",
      title: "RFC 9110: HTTP Semantics",
      publisher: "Internet Engineering Task Force",
      url: "https://www.rfc-editor.org/rfc/rfc9110",
      evidenceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
      accessedOn: ACCESSED_ON,
      revision: "RFC 9110",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "HTTP request methods, status-code semantics, representation metadata, conditional requests, and the distinction between safe and idempotent methods.",
      boundary:
        "Protocol semantics do not prove an API is complete, correctly implemented, authorized for reuse, stable over time, or safe to retry with application side effects.",
    },
    zhHans: {
      supports: "支持 HTTP 请求方法、状态码语义、表示元数据、条件请求，以及安全方法与幂等方法的区分。",
      boundary: "协议语义不能证明 API 完整、实现正确、获准复用、长期稳定，也不能保证带业务副作用的重试安全。",
    },
  },
  {
    record: {
      id: "pandas-merge",
      title: "pandas.merge",
      publisher: "pandas project",
      url: "https://pandas.pydata.org/docs/reference/api/pandas.merge.html",
      evidenceUrls: ["https://pandas.pydata.org/docs/reference/api/pandas.merge.html"],
      accessedOn: ACCESSED_ON,
      revision: "pandas 3.0.x documentation",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "BSD-3-Clause project licence; linked and paraphrased only",
      supports:
        "Join-key selection, merge cardinality validation, merge indicators, and pandas' documented behavior of matching null keys to each other.",
      boundary:
        "The validate argument checks cardinality, not whether keys have the right business meaning; pandas null-key matching also differs from usual SQL join behavior.",
    },
    zhHans: {
      supports: "支持连接键选择、连接基数校验、来源指示列，以及 pandas 会相互匹配空键的已记录行为。",
      boundary: "validate 只检查基数，不证明键的业务含义正确；pandas 的空键匹配也不同于通常 SQL 连接。",
    },
  },
  {
    record: {
      id: "ceds-v13",
      title: "Common Education Data Standards Version 13",
      publisher: "United States Department of Education",
      url: "https://ceds.ed.gov/dataModel.aspx",
      evidenceUrls: [
        "https://ceds.ed.gov/dataModel.aspx",
        "https://ceds.ed.gov/cedsdownloads.aspx",
      ],
      accessedOn: ACCESSED_ON,
      revision: "CEDS Version 13",
      kind: "official-guidance",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "United States government work boundary; downloads may contain separately identified third-party material",
      supports:
        "A current official education-data vocabulary and data-model reference that can inform field definitions and interoperability review.",
      boundary:
        "CEDS is not a local policy, collection authorization, privacy determination, licence for third-party records, or certification that a dataset is accurate or fit for use.",
    },
    zhHans: {
      supports: "支持以当前官方教育数据词汇与数据模型参考审查字段定义和互操作性。",
      boundary: "CEDS 不是本地政策、采集授权、隐私判断、第三方记录许可，也不是数据准确或适用性的认证。",
    },
  },
] as const satisfies CourseKitNonEmpty<CourseKitSourceAuthoringSeed>;

export type AiPythonDataSourceId =
  (typeof AI_PYTHON_DATA_SOURCE_SEEDS)[number]["record"]["id"];

export const AI_PYTHON_DATA_SOURCES = AI_PYTHON_DATA_SOURCE_SEEDS.map(
  ({ record }) => ({
    ...record,
    schemaVersion: COURSE_KIT_SOURCE_SCHEMA_VERSION,
  }),
) as unknown as CourseKitNonEmpty<CourseKitSourceRecord<AiPythonDataSourceId>>;

export function getAiPythonDataSource(
  sourceId: AiPythonDataSourceId,
): CourseKitSourceRecord<AiPythonDataSourceId> {
  const source = AI_PYTHON_DATA_SOURCES.find((candidate) => candidate.id === sourceId);
  if (!source) throw new Error(`Unknown AI Python & Data source: ${sourceId}`);
  return source;
}
