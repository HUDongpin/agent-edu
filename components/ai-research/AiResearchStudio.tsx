import { CourseLabPack } from "@/components/course-kit/CourseLabPack";

export function AiResearchStudio({
  locale,
  moduleSlug,
}: {
  readonly locale: string;
  readonly moduleSlug?: string;
}) {
  const zh = locale === "zh-Hans";
  const base = "/courses/ai-research";
  return (
    <CourseLabPack
      courseId="ai-research"
      eyebrow={zh ? "离线工作室" : "Offline studio"}
      title={zh ? "逐页证据核验工作室" : "Page-grounded evidence verification studio"}
      intro={zh
        ? `不要信任预抽取字符串。下载原创合成 PDF、页表清单与${moduleSlug ? `模块 ${moduleSlug}` : "mini-review"} 工作包，回到一手页码核验。`
        : `Do not trust pre-extracted strings. Download the original synthetic PDFs, page/table manifest, and ${moduleSlug ? `module ${moduleSlug}` : "mini-review"} work pack, then verify every claim at the primary page.`}
      assets={[
        { href: `${base}/primary/REC-001.pdf`, label: "REC-001 full text", format: "PDF · 9 pages", description: zh ? "准实验报告；方法 p.4、结果表 p.7、局限 p.9。" : "Quasi-experimental report: method p.4, result table p.7, limitation p.9." },
        { href: `${base}/primary/REC-002.pdf`, label: "REC-002 full text", format: "PDF · 11 pages", description: zh ? "定性访谈；抽样 p.5、主题 p.8、局限 p.11。" : "Qualitative interview report: sampling p.5, theme p.8, limitation p.11." },
        { href: `${base}/primary/REC-005.pdf`, label: "REC-005 full text", format: "PDF · 13 pages", description: zh ? "随机比较；分配 p.6、主结果表 p.10、局限 p.13。" : "Randomised comparison: allocation p.6, primary table p.10, limitation p.13." },
        { href: `${base}/lab/primary-object-manifest.json`, label: zh ? "一手对象清单" : "Primary-object manifest", format: "JSON + SHA-256", description: zh ? "把本地记录 ID、PDF 哈希、精确 locator 与允许主张绑定。" : "Binds local record IDs, PDF hashes, exact locators, and allowed claims." },
        { href: `${base}/lab/mini-review-template.json`, label: zh ? "八产物 mini-review 模板" : "Eight-artifact mini-review template", format: "JSON", description: zh ? "协议、检索、筛选、主张证据、抽取、复现、引文审计与 AI 披露。" : "Protocol, search, screening, claim evidence, extraction, reproduction, citation audit, and AI disclosure." },
        { href: `${base}/lab/capstone.schema.json`, label: zh ? "产物 schema" : "Artifact schema", format: "JSON Schema", description: zh ? "拒绝缺页、错哈希、RAG 片段替代一手来源或无核验者的包。" : "Rejects missing pages, wrong hashes, RAG chunks used as evidence, and unverified packages." },
        { href: `${base}/lab/validate.py`, label: zh ? "离线页证据校验器" : "Offline page-evidence validator", format: "Python 3 · stdlib", description: zh ? "以 aicourse.ai-research.validator.v1 核验 PDF 魔数/页数/哈希、locator、八产物与审查状态。" : "Uses aicourse.ai-research.validator.v1 to check PDF signature, page count, hashes, locators, eight artifacts, and review status." },
      ]}
      commands={[
        "python public/courses/ai-research/lab/validate.py --package public/courses/ai-research/lab/mini-review-example.json",
        "pdftotext -f 7 -l 7 public/courses/ai-research/primary/REC-001.pdf -",
      ]}
      boundary={zh
        ? "所有 PDF 都是原创虚构教学对象，不可引用为真实研究；RAG 或抽取表只用于定位，最终主张必须回到 PDF 页、表、数据或代码。"
        : "Every PDF is an original fictional teaching object and cannot be cited as real research. RAG and extraction sheets are locators only; final claims must return to the PDF page, table, data, or code."}
    />
  );
}
