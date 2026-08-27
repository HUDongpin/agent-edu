import { CourseLabPack } from "@/components/course-kit/CourseLabPack";

export function ResponsibleAiStudio({
  locale,
  moduleSlug,
}: {
  readonly locale: string;
  readonly moduleSlug?: string;
}) {
  const zh = locale === "zh-Hans";
  const base = "/courses/responsible-ai";
  const guide = `${base}/lab/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <CourseLabPack
      courseId="responsible-ai"
      eyebrow={zh ? "离线工作室" : "Offline studio"}
      title={zh ? "治理档案离线工作室" : "Governance dossier offline studio"}
      intro={zh
        ? `下载原创虚构案例、${moduleSlug ? `本模块 ${moduleSlug} 的` : "完整"}模板与校验器；所有材料均留在学习者自己的环境中。`
        : `Download the original fictional case, ${moduleSlug ? `the ${moduleSlug} module` : "the complete"} templates, and the validator; all work remains in the learner's environment.`}
      assets={[
        { href: `${base}/governance-case-synthetic-v1.json`, label: zh ? "虚构治理案例" : "Fictional governance case", format: "JSON · CC0", description: zh ? "含可人工核算的子群错误模式、人工覆盖与事件记录。" : "Includes inspectable subgroup errors, human override, and incident records." },
        { href: `${base}/lab/governance-dossier-template.json`, label: zh ? "治理档案模板" : "Governance dossier template", format: "JSON", description: zh ? "九项固定 capstone 产物与六项 Responsible AI 标准的版本化骨架。" : "Versioned skeleton for the nine locked artifacts and six Responsible AI criteria." },
        { href: `${base}/lab/capstone.schema.json`, label: zh ? "产物 schema" : "Artifact schema", format: "JSON Schema", description: zh ? "对课程、版本、fixture、产物、标准映射与审查决定进行失败即关闭校验。" : "Fail-closed checks for course, version, fixture, artifacts, rubric mapping, and review decision." },
        { href: `${base}/lab/validate.py`, label: zh ? "离线校验器" : "Offline validator", format: "Python 3 · stdlib", description: zh ? "不联网、不上传数据；以 aicourse.responsible-ai.validator.v1 输出机器可读 PASS/FAIL。" : "No network or upload; emits machine-readable PASS/FAIL under aicourse.responsible-ai.validator.v1." },
        { href: guide, label: zh ? "运行说明" : "Run guide", format: "Markdown", description: zh ? "说明正向示例、故障注入与证据收据生成。" : "Explains the positive example, failure injection, and evidence-receipt workflow." },
      ]}
      commands={[
        "python public/courses/responsible-ai/lab/validate.py --package public/courses/responsible-ai/lab/governance-dossier-example.json",
        "python public/courses/responsible-ai/lab/validate.py --package <your-dossier.json>",
      ]}
      boundary={zh
        ? "校验通过只证明本地结构与声明一致；不证明法律合规、公平、安全，也不授予真实部署权限。"
        : "A passing validator proves only local structural consistency; it does not establish legal compliance, fairness, safety, or deployment authority."}
    />
  );
}
