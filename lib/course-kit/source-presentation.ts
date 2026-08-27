import type {
  CourseKitContentLocale,
  CourseKitMaterialisedSourceRecord,
  CourseKitSourceRecord,
} from "./types";

export const COURSE_KIT_SOURCE_DEFAULT_TRANSFORMATION_EN =
  "Claims were bounded, paraphrased, and integrated into original course instruction; no source prose, image, notebook, assignment, or quiz was copied.";
export const COURSE_KIT_SOURCE_LINK_ONLY_RIGHTS_EN =
  "Link-only evidence: no source asset is redistributed; only original paraphrase and citation metadata are published.";
export const COURSE_KIT_SOURCE_LICENCE_RIGHTS_EN =
  "Reuse is limited by the recorded licence and to original paraphrase; no third-party source asset is redistributed.";

/**
 * Exact, reviewed presentation translations for learner-facing source metadata.
 *
 * Source titles, publishers, identifiers, and unknown metadata deliberately stay
 * in their source language. Exact matching prevents a new or changed rights
 * statement from being silently translated with a broader, inaccurate claim.
 */
export const COURSE_KIT_ZH_HANS_SOURCE_PRESENTATION_TRANSLATIONS = {
  [COURSE_KIT_SOURCE_DEFAULT_TRANSFORMATION_EN]:
    "主张已经限定边界并转述为原创课程讲解；未复制任何来源正文、图片、笔记本、作业或测验。",
  [COURSE_KIT_SOURCE_LINK_ONLY_RIGHTS_EN]:
    "证据仅以链接方式引用；未再分发任何第三方来源资产，仅发布原创转述和引文元数据。",
  [COURSE_KIT_SOURCE_LICENCE_RIGHTS_EN]:
    "复用仅限于所记录许可允许的范围和原创转述；未再分发任何第三方来源资产。",
  "Apache-2.0 project code; linked and paraphrased documentation":
    "Apache-2.0 项目代码；文档仅以链接和转述方式使用",
  "Apache-2.0 project; linked and paraphrased":
    "Apache-2.0 项目；仅以链接和转述方式使用",
  "BSD-3-Clause project licence; linked and paraphrased only":
    "BSD-3-Clause 项目许可；仅以链接和转述方式使用",
  "CC BY 4.0 for the BMJ article; original course diagrams and checklists are independently authored":
    "BMJ 文章采用 CC BY 4.0；课程图示与清单均为独立原创",
  "CC BY 4.0; independent course synthesis":
    "CC BY 4.0；课程内容为独立综合",
  "CC BY 4.0; this course uses an original synthesis and does not copy figures":
    "CC BY 4.0；本课程采用原创综合，未复制图表",
  "Community Specification License 1.0; linked and paraphrased":
    "Community Specification License 1.0；仅以链接和转述方式使用",
  "Documentation CC BY 4.0; code Apache-2.0; linked and paraphrased":
    "文档采用 CC BY 4.0，代码采用 Apache-2.0；仅以链接和转述方式使用",
  "Google SRE book CC BY-NC-ND 4.0; link and paraphrase only":
    "Google SRE 图书采用 CC BY-NC-ND 4.0；仅以链接和转述方式使用",
  "Google SRE materials CC BY-NC-ND 4.0; link and paraphrase only":
    "Google SRE 材料采用 CC BY-NC-ND 4.0；仅以链接和转述方式使用",
  "MIT project licence; linked and paraphrased only":
    "MIT 项目许可；仅以链接和转述方式使用",
  "MIT project licence; site and third-party assets are not presumed reusable":
    "MIT 项目许可；不推定网站及第三方资产可复用",
  "Matplotlib BSD-compatible project licence; course charts are original":
    "Matplotlib 项目采用兼容 BSD 的许可；课程图表为原创",
  "OCI specification terms and patent policy; linked and paraphrased":
    "OCI 规范条款及专利政策；仅以链接和转述方式使用",
  "Open Government Licence – Canada, subject to its terms":
    "Open Government Licence – Canada；复用须遵守其条款",
  "Open-access CC BY article; independently authored course materials":
    "开放获取文章采用 CC BY；课程材料均为独立原创",
  "Open-access article under CC BY; independently authored course fixtures":
    "开放获取文章采用 CC BY；课程夹具均为独立原创",
  "PSF License Version 2; documentation examples additionally offered under 0BSD":
    "PSF License Version 2；文档示例另以 0BSD 提供",
  "Project Jupyter BSD-3-Clause project licence; linked and paraphrased only":
    "Project Jupyter 采用 BSD-3-Clause 项目许可；仅以链接和转述方式使用",
  "PyTorch BSD-style project licence; linked and paraphrased only":
    "PyTorch 采用 BSD 风格项目许可；仅以链接和转述方式使用",
  "United States government work boundary; downloads may contain separately identified third-party material":
    "美国政府作品边界；下载内容可能包含另行标明的第三方材料",
  "United States government work boundary; third-party credited material excluded":
    "美国政府作品边界；不包含已标注出处的第三方材料",
  "United States government work boundary; third-party material may be separately protected":
    "美国政府作品边界；第三方材料可能另受保护",
  "Directive modified 2025-06-24; 65 risk and 41 mitigation questions":
    "指令于 2025-06-24 修订；包含 65 个风险问题和 41 个缓解问题",
  "Canada — federal administrative decisions within the Directive's scope":
    "加拿大——该指令适用范围内的联邦行政决定",
  "European Union / European Economic Area subject to applicable scope":
    "欧盟／欧洲经济区，须符合适用范围",
  "European Union policy context; non-binding":
    "欧盟政策语境；不具约束力",
  "European Union, subject to instrument scope and phased application":
    "欧盟，须遵守文书适用范围及分阶段实施安排",
  "United States federal guidance":
    "美国联邦指引",
  "PyTorch 2.13 documentation family; Adam paper version current at access":
    "PyTorch 2.13 文档系列；Adam 论文版本截至访问时为当前版本",
  "New GRADE Book available since 2024; 2013 handbook is being phased out chapter by chapter":
    "新版 GRADE Book 自 2024 年起可用；2013 年手册正逐章停用",
  "rolling site; compatible specification and release must be pinned":
    "持续更新的网站；必须固定兼容的规范与发布版本",
} as const satisfies Readonly<Record<string, string>>;

function translatedSourceText(
  value: string | undefined,
  contentLocale: CourseKitContentLocale,
): { readonly value: string | undefined; readonly locale: CourseKitContentLocale | undefined } {
  if (value === undefined) return { value: undefined, locale: undefined };
  if (contentLocale === "zh-Hans") {
    const translated = (
      COURSE_KIT_ZH_HANS_SOURCE_PRESENTATION_TRANSLATIONS as Readonly<
        Record<string, string>
      >
    )[value];
    if (translated) return { value: translated, locale: "zh-Hans" };
  }
  return { value, locale: "en" };
}

export function materialiseCourseKitSourcePresentation(
  source: CourseKitSourceRecord<string>,
  annotations: { readonly supports: string; readonly boundary: string },
  contentLocale: CourseKitContentLocale,
): CourseKitMaterialisedSourceRecord {
  const transformation = translatedSourceText(source.transformation, contentLocale);
  const rightsBoundary = translatedSourceText(source.rightsBoundary, contentLocale);
  const licence = translatedSourceText(source.licence, contentLocale);
  const revision = translatedSourceText(source.revision, contentLocale);
  const jurisdiction = translatedSourceText(source.jurisdiction, contentLocale);

  return {
    ...source,
    supports: annotations.supports,
    boundary: annotations.boundary,
    transformation: transformation.value ?? source.transformation,
    rightsBoundary: rightsBoundary.value ?? source.rightsBoundary,
    licence: licence.value,
    revision: revision.value,
    jurisdiction: jurisdiction.value,
    presentationLocales: {
      title: "en",
      publisher: "en",
      supports: contentLocale,
      boundary: contentLocale,
      conceptDomain: "en",
      transformation: transformation.locale ?? "en",
      rightsBoundary: rightsBoundary.locale ?? "en",
      licence: licence.locale,
      revision: revision.locale,
      jurisdiction: jurisdiction.locale,
    },
  };
}
