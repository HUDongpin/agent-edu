import type {
  ClaudeFigureCourseOriginal,
  ClaudeFigureId,
  ClaudeFigureManifest,
} from "./types";

const screenshotPrivacyChecklist = [
  "No credentials, API keys, tokens, private messages, or customer data",
  "No private browser tabs, notifications, or unrelated applications",
  "Visible names and organisations are intentionally published by the attributed repository source",
  "Interface date and source are recorded; model labels are not presented as current entitlements",
] as const;

const repositoryRights = "repository-licence-reviewed" as const;

const originalPrivacyChecklist = [
  "No credentials, account data, private messages, personal paths, or customer data",
  "No copied product-interface pixels, third-party logos, remote images, or embedded scripts",
  "Visible labels are generic instructional copy authored specifically for this course",
  "The diagram is visibly marked as course-original and not a product screenshot",
] as const;

type OriginalInput = Pick<
  ClaudeFigureCourseOriginal,
  "id" | "lessonSlug" | "surface" | "captureIntent" | "src" | "sha256"
>;
type RawOriginal = Omit<ClaudeFigureCourseOriginal, "altKey" | "captionKey">;

function originalFigure(input: OriginalInput): RawOriginal {
  return {
    ...input,
    status: "available",
    assetKind: "original-diagram",
    width: 1200,
    height: 720,
    createdOn: "2026-08-26",
    creationMethod: "Deterministic, hand-authored SVG assembled from geometric primitives and course-authored labels; no source screenshot or third-party visual asset was traced or embedded.",
    provenance: "course-original",
    rightsStatus: "course-original",
    licence: "CC0-1.0",
    provenancePath: "/courses/claude/figure-provenance.v1.json",
    attribution: "Course-original abstract diagram, dedicated under CC0 1.0; not a Claude product screenshot.",
    privacyReviewed: true,
    privacyChecklist: originalPrivacyChecklist,
  };
}

const RAW_CLAUDE_FIGURES = [
  originalFigure({
    id: "fig-01", lessonSlug: "choose-your-surface", surface: "desktop",
    captureIntent: "Compare task boundaries before choosing Chat, Cowork, or Code.",
    src: "/courses/claude/figures/fig-01-surface-map-original.svg",
    sha256: "b2d2b3c258db48cbacb6f0bef871d110ba41774909b6043d27ed0445d4575d7e",
  }),
  originalFigure({
    id: "fig-02", lessonSlug: "describe-the-outcome", surface: "chat",
    captureIntent: "Turn a request into an outcome contract with context, constraints, evidence, and format.",
    src: "/courses/claude/figures/fig-02-outcome-contract-original.svg",
    sha256: "84d843f884cf21c32966b5a609f3edd7ec4c2772ee35a7531af09b7dce9acd8f",
  }),
  originalFigure({
    id: "fig-03", lessonSlug: "iterate-with-examples", surface: "artifacts",
    captureIntent: "Show an inspect-change-verify loop that preserves the working artifact.",
    src: "/courses/claude/figures/fig-03-iteration-loop-original.svg",
    sha256: "1dbae1d91d09d68a060c1c52c239d5d915ed504a58df4bfb81531e0c1967cffd",
  }),
  originalFigure({
    id: "fig-04", lessonSlug: "discern-verify-protect", surface: "chat",
    captureIntent: "Separate a requested capability from its permission consequence and approval decision.",
    src: "/courses/claude/figures/fig-04-permission-gate-original.svg",
    sha256: "b677c22e11ee9dbbe6566c54ad329787532f289f8aea90491a749526ea90a93e",
  }),
  originalFigure({
    id: "fig-05", lessonSlug: "work-with-files", surface: "chat",
    captureIntent: "Distinguish preview, native file, local verification, and external sharing boundaries.",
    src: "/courses/claude/figures/fig-05-file-verification-original.svg",
    sha256: "690d659c59f0763499003126312709a4dcf588009ebad6a1a9a76ff2ea2263b2",
  }),
  {
    id: "fig-06", lessonSlug: "build-projects", status: "available", assetKind: "interface-screenshot", surface: "projects",
    captureIntent: "Inspect the separation between Project memory, instructions, files, and individual chats.",
    src: "/courses/claude/figures/fig-06-projects.png",
    srcSet: { webpLarge: "/courses/claude/figures/fig-06-projects-1600.webp", largeWidth: 1600, largeSha256: "fe7d042ee41e4a8a3e17be2e2071870b0d09c2c81f80906072df0eeec7169b58", webpSmall: "/courses/claude/figures/fig-06-projects-800.webp", smallWidth: 800, smallSha256: "0d5a107f0d48a81874ec2fd15a3e465291e113db4e81214fb43e3b62bd9d094c" },
    width: 2160, height: 1324, observedOn: "2026-02-23", observedUi: "Claude.ai Projects · practitioner capture published February 2026",
    sha256: "a5d044d4b559c14c364283df0b6c7fe9dd554993c3f1d68035b164f66fd170fc", privacyReviewed: true,
    sourceUrl: "https://github.com/chrisblattman/claudeblattman/blob/12e14d42d5c8af6383019ac27ef91e898e812fc2/docs/images/claude-projects-v1.png", provenance: "licensed-community", rightsStatus: repositoryRights,
    attribution: "Claude Projects screenshot by Chris Blattman, from claudeblattman, used under the MIT License; UI and trademarks remain Anthropic's.",
    thirdPartySourceUrl: "https://github.com/chrisblattman/claudeblattman", thirdPartyLicense: "MIT", sourceCommit: "12e14d42d5c8af6383019ac27ef91e898e812fc2",
    sourceSha256: "fb7bc7488412a683616d19dfe3635049cbadb11c9fc5b38ca476a96ab8f22772", modifications: "Local PNG has metadata removed with no pixel changes; responsive WebPs are resized and compressed.",
    privacyChecklist: screenshotPrivacyChecklist,
  },
  originalFigure({
    id: "fig-07", lessonSlug: "create-artifacts", surface: "artifacts",
    captureIntent: "Place acceptance testing before a separate artifact publication decision.",
    src: "/courses/claude/figures/fig-07-artifact-gate-original.svg",
    sha256: "6af320bf1960e3c8341273a3cfc1ad7f676d5cac28b814feb8b257f82c3e3e39",
  }),
  originalFigure({
    id: "fig-08", lessonSlug: "research-with-citations", surface: "research",
    captureIntent: "Treat retrieval output as a locator and verify every claim against the original source.",
    src: "/courses/claude/figures/fig-08-source-audit-original.svg",
    sha256: "8a1baaf5e04681af8513949c94591a90056aa1755586a8b714872e7360bf7561",
  }),
  originalFigure({
    id: "fig-09", lessonSlug: "extend-with-tools", surface: "connectors",
    captureIntent: "Review tool capabilities, scopes, data movement, and revocation before connection.",
    src: "/courses/claude/figures/fig-09-tool-scope-original.svg",
    sha256: "41b2b4a530bc08ccdb69ed86ee3f0c36b7a970f3fbe464c1f01a57fbfe0b0617",
  }),
  originalFigure({
    id: "fig-10", lessonSlug: "delegate-with-cowork", surface: "cowork",
    captureIntent: "Bound delegated work by inputs, workspace, approvals, verification, and stop conditions.",
    src: "/courses/claude/figures/fig-10-delegation-envelope-original.svg",
    sha256: "00448e3d0be7caa90e3ba8c232a84c051d439e844b668d2852693399ecbfe0be",
  }),
  {
    id: "fig-11", lessonSlug: "software-engineering", status: "available", assetKind: "interface-screenshot", surface: "code",
    captureIntent: "Inspect Claude Code auditing repository instructions against the current codebase with explicit task and file context.",
    src: "/courses/claude/figures/fig-11-code.png",
    srcSet: { webpLarge: "/courses/claude/figures/fig-11-code-1600.webp", largeWidth: 1600, largeSha256: "2aff32d834ad2a668a45b720b7de05e5ff03a4ac795e0618f8b8320ddffcf309", webpSmall: "/courses/claude/figures/fig-11-code-800.webp", smallWidth: 800, smallSha256: "dd8b735f37b7965a3a1ca13de54da7a595a28d6d8cda8f86e068590386f64f35" },
    width: 1734, height: 960, observedOn: "2026-08-23", observedUi: "Claude Code terminal auditing CLAUDE.md · official plugin repository snapshot",
    sha256: "007a90d0a088c02b2878b2f57b5b44aab5a276aeb612a5fbf73d92c9577581d5", privacyReviewed: true,
    sourceUrl: "https://github.com/anthropics/claude-plugins-official/blob/340e33aef211d95769d252324854497af871dafe/plugins/claude-md-management/claude-md-improver-example.png", provenance: "licensed-community", rightsStatus: repositoryRights,
    attribution: "Claude Code terminal image from anthropics/claude-plugins-official, used under the Apache License 2.0; the local PNG has metadata removed and the responsive WebP files are resized derivatives. UI and trademarks remain Anthropic's.",
    thirdPartySourceUrl: "https://github.com/anthropics/claude-plugins-official/tree/340e33aef211d95769d252324854497af871dafe/plugins/claude-md-management", thirdPartyLicense: "Apache-2.0", sourceCommit: "340e33aef211d95769d252324854497af871dafe",
    sourceSha256: "a0b12357a8d8f9b1ba16692805344b8c4d03af2cc2eefcb70c68431b4350d1ad", modifications: "Local PNG has metadata removed with no pixel changes; responsive WebPs are resized and compressed.",
    privacyChecklist: screenshotPrivacyChecklist,
  },
  {
    id: "fig-12", lessonSlug: "research-and-data", status: "available", assetKind: "interface-screenshot", surface: "platform",
    captureIntent: "Read the real execution timeline, tools, resources, and prompt behind a data-analysis agent run.",
    src: "/courses/claude/figures/fig-12-data-analysis-platform.png",
    srcSet: { webpLarge: "/courses/claude/figures/fig-12-data-analysis-platform-1600.webp", largeWidth: 1600, largeSha256: "d92c9579e353db0112816f6b1575f198dfb333963d0ce4246c56bb0ce9aac746", webpSmall: "/courses/claude/figures/fig-12-data-analysis-platform-800.webp", smallWidth: 800, smallSha256: "9da9d9348d1d3245f55397269ab54495faaa4a051e95a2c09cdeba2243cdba2e" },
    width: 2894, height: 1924, observedOn: "2026-08-19", observedUi: "Claude Platform Sessions · official cookbook repository snapshot",
    sha256: "26bf21e75b29d31bbd6beb3dc79fcf93f4af653740bfbc8587aedeccdde97cd3", privacyReviewed: true,
    sourceUrl: "https://github.com/anthropics/claude-cookbooks/blob/35f2eec7e44897c537e44441b7dff2f0ecbfb804/managed_agents/example_data/data_analyst_agent/console_session.png", provenance: "licensed-community", rightsStatus: repositoryRights,
    attribution: "Claude Platform screenshot from anthropics/claude-cookbooks, used under the MIT License.",
    thirdPartySourceUrl: "https://github.com/anthropics/claude-cookbooks", thirdPartyLicense: "MIT", sourceCommit: "35f2eec7e44897c537e44441b7dff2f0ecbfb804",
    sourceSha256: "edcc3b1d266a6bf936545be99d3ac6fd22f9b28bc50fa8906ec39d39e79c5645", modifications: "Local PNG has metadata removed with no pixel changes; responsive WebPs are resized and compressed.",
    privacyChecklist: screenshotPrivacyChecklist,
  },
  originalFigure({
    id: "fig-13", lessonSlug: "writing-and-office", surface: "artifacts",
    captureIntent: "Keep facts, audience, tone, approval, and sending under human control.",
    src: "/courses/claude/figures/fig-13-writing-control-original.svg",
    sha256: "f3bec89b8a7459afd1050865ac28eb326a78c745dcf7573f4c8d62e12adf7a2d",
  }),
  originalFigure({
    id: "fig-14", lessonSlug: "teaching-and-learning", surface: "artifacts",
    captureIntent: "Connect learning goals, supported practice, learner evidence, and educator review.",
    src: "/courses/claude/figures/fig-14-learning-loop-original.svg",
    sha256: "123a25efcafa675ab03e52959b6cbbdca6f7143855134e9b7ee196f0fd6751ca",
  }),
  originalFigure({
    id: "fig-15", lessonSlug: "portfolio-capstone", surface: "artifacts",
    captureIntent: "Pause at the publication boundary for content, audience, privacy, link, and approval review.",
    src: "/courses/claude/figures/fig-15-publication-boundary-original.svg",
    sha256: "67b91a42fb9c0672b62761df412cdfde578b860b53bf6442c2d25c4f14720c31",
  }),
] as const;

export const CLAUDE_FIGURES = RAW_CLAUDE_FIGURES.map((figure) => ({
  ...figure,
  altKey: `figures.${figure.id}.alt` as const,
  captionKey: `figures.${figure.id}.caption` as const,
})) satisfies readonly ClaudeFigureManifest[];

export const CLAUDE_FIGURE_BY_ID = Object.fromEntries(
  CLAUDE_FIGURES.map((figure) => [figure.id, figure]),
) as unknown as Readonly<Record<ClaudeFigureId, ClaudeFigureManifest>>;
