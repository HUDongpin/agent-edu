import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  RESPONSIBLE_AI_CAPSTONE_ARTIFACTS,
  RESPONSIBLE_AI_CAPSTONE_VERSION,
} from "./capstone";
import { RESPONSIBLE_AI_EN_COURSE_COPY } from "./copy/en";
import { RESPONSIBLE_AI_ZH_HANS_COURSE_COPY } from "./copy/zh-Hans";
import { RESPONSIBLE_AI_MODULES } from "./modules";
import {
  RESPONSIBLE_AI_QUESTION_BANK,
  RESPONSIBLE_AI_QUIZ_VERSION,
} from "./quiz";
import { RESPONSIBLE_AI_SOURCE_SEEDS } from "./sources";

export const RESPONSIBLE_AI_COURSE = buildCourseKitDefinition({
  manifest: {
    id: "responsible-ai",
    version: "2026.08.26-v1",
    displayNumber: 16,
    publishedOn: "2026-08-26",
    completionEvidence: {
      moduleReceipt: "none",
      capstoneArtifact: "draft",
    },
    milestoneCount: 12,
    phases: [
      {
        id: "scope-and-rights",
        copy: {
          en: { title: "Scope and rights", summary: "Bound purpose, affected people, authority, data rights, privacy, and the conditions that require the team to stop." },
          zhHans: { title: "范围与权利", summary: "限定目的、受影响者、权限、数据权利、隐私，以及要求团队停止的条件。" },
        },
      },
      {
        id: "test-and-document",
        copy: {
          en: { title: "Test and document", summary: "Audit subgroup performance and uncertainty, then turn model, data, system, safeguards, and limitations into challengeable records." },
          zhHans: { title: "测试与记录", summary: "审计子群性能与不确定性，再把模型、数据、系统、保障与局限写成可质疑记录。" },
        },
      },
      {
        id: "authority-and-recourse",
        copy: {
          en: { title: "Authority and recourse", summary: "Give named people the information, workload, power, escalation path, and remedy process needed to change a consequential outcome." },
          zhHans: { title: "权限与救济", summary: "让具名人员拥有改变重要结果所需的信息、工作量条件、权力、升级路径与救济程序。" },
        },
      },
      {
        id: "operate-and-decide",
        copy: {
          en: { title: "Operate and decide", summary: "Red-team realistic failures, prepare incident response, and make an evidence-linked go, conditional-go, or no-go decision." },
          zhHans: { title: "运营与决定", summary: "红队测试现实失败，准备事件响应，并作出有证据链接的上线、有条件上线或不上线决定。" },
        },
      },
    ],
  },
  sources: RESPONSIBLE_AI_SOURCE_SEEDS,
  modules: RESPONSIBLE_AI_MODULES,
  courseCopy: {
    en: RESPONSIBLE_AI_EN_COURSE_COPY,
    zhHans: RESPONSIBLE_AI_ZH_HANS_COURSE_COPY,
  },
  quiz: {
    version: RESPONSIBLE_AI_QUIZ_VERSION,
    questions: RESPONSIBLE_AI_QUESTION_BANK,
  },
  capstone: {
    version: RESPONSIBLE_AI_CAPSTONE_VERSION,
    artifacts: RESPONSIBLE_AI_CAPSTONE_ARTIFACTS,
  },
});
