import type { CursorFigureId, CursorFigureManifest, CursorLessonSlug } from "./types";

const privacyChecklist = [
  "First-party Cursor media from a public official page",
  "No API key, token, credential, email address, or learner-supplied private content",
  "Incidental identifiers already published in a public Cursor demo are recorded per figure",
  "No unrelated application or private browser tab visible",
] as const;

const copyrightNotice = "© Anysphere, Inc. First-party Cursor UI used for limited educational commentary. aicourse.top is not affiliated with or endorsed by Cursor.";

type FigureInput = {
  readonly id: CursorFigureId;
  readonly lessonSlug: CursorLessonSlug;
  readonly surface: CursorFigureManifest["surface"];
  readonly captureIntent: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly cursorVersion: string;
  readonly os: string;
  readonly sourceUrl: string;
  readonly sourcePageUrl: string;
  readonly sourcePublishedOn?: string;
  readonly sourceAssetSha256?: string;
  readonly frameTimeSeconds?: number;
  readonly visiblePublicDemoIdentifiers?: readonly string[];
  readonly uiFreshness: "current" | "dated-current" | "historical-interface";
};

function figure(input: FigureInput): CursorFigureManifest {
  const stem = `/courses/cursor/${input.id}`;
  return {
    ...input,
    status: "available",
    rightsStatus: "rights-review-required",
    captureIntent: input.captureIntent,
    src: `${stem}-master.png`,
    srcSet: {
      webpLarge: `${stem}-1600.webp`,
      webpSmall: `${stem}-960.webp`,
    },
    capturedOn: "2026-08-23",
    privacyReviewed: true,
    privacyChecklist,
    copyrightNotice,
    altKey: `figures.${input.id}.alt`,
    captionKey: `figures.${input.id}.caption`,
  };
}

export const CURSOR_FIGURES = [
  figure({
    id: "fig-01", lessonSlug: "orient-privacy", surface: "app",
    captureIntent: "Open Agents Window from the command palette and identify the agent-first workspace.",
    width: 2400, height: 1399, sha256: "4ddba0ebc46c6cc550e7f8e1c353a602cf16c73b31686c2609e7fa3d315ecbd4",
    cursorVersion: "Current Agents Window docs; Desktop 3.17 latest when checked", os: "macOS, official demo",
    sourceUrl: "https://cursor.com/docs-static/images/agent/open-agents-window-final.png",
    sourcePageUrl: "https://cursor.com/docs/agent/agents-window", uiFreshness: "current",
  }),
  figure({
    id: "fig-02", lessonSlug: "tab-inline-edit", surface: "app",
    captureIntent: "Recognise a multi-line Tab prediction as a suggestion that remains under the learner's control.",
    width: 2400, height: 1260, sha256: "03d702720b971f169a106ff5dccac0d7c009ab36fb10f6f883f0e36aa88cd17f",
    cursorVersion: "Cursor Tab product visual, current", os: "First-party product artwork",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/features/tab-og-image-2.png",
    sourcePageUrl: "https://cursor.com/tab", uiFreshness: "current",
  }),
  figure({
    id: "fig-03", lessonSlug: "agent-interface", surface: "app",
    captureIntent: "Read an Agent result beside the file it inspected and separate claims from visible repository evidence.",
    width: 2400, height: 1386, sha256: "bc93ca7881d5fd2bb99dd30aae104a8cb42c99f84cea66b1651d950123b52ff7",
    cursorVersion: "Current Agents Window docs; Desktop 3.17 latest when checked", os: "macOS, official demo",
    sourceUrl: "https://cursor.com/docs-static/images/agent/file-agents-window-final.png",
    sourcePageUrl: "https://cursor.com/docs/agent/agents-window", uiFreshness: "current",
    visiblePublicDemoIdentifiers: [
      "Public Cursor demo Draft PR URL: github.com/anysphere/everysphere/pull/90449",
    ],
  }),
  figure({
    id: "fig-04", lessonSlug: "task-contracts", surface: "app",
    captureIntent: "Use the current prompt composer to turn an ambitious goal into a bounded contract before any tool runs.",
    width: 3608, height: 2160, sha256: "f780f81227626bded06b552a1fac58d4940c4fdfd08384d0e807458ad15c004f",
    cursorVersion: "Cursor 3.17-era changelog UI", os: "Cursor interface, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/2026-08-13-changelog-goal-CPDEcewlxhbdqRa131C8yZjhDdOGzb.mp4",
    sourcePageUrl: "https://cursor.com/changelog/08-19-26", sourcePublishedOn: "2026-08-19", uiFreshness: "dated-current",
    sourceAssetSha256: "72c567f74492b46e2311af7cd334ad5f3c218ee53794c772e8d8d28787646c3f",
    frameTimeSeconds: 2,
  }),
  figure({
    id: "fig-05", lessonSlug: "plan-execute-steer", surface: "app",
    captureIntent: "Inspect an editable prepared plan and approve the Build transition only after scope and checks are explicit.",
    width: 1739, height: 1124, sha256: "baf22ef12a61165288c3e97553794978128179706cdeac774f15bd08d8b4f3a8",
    cursorVersion: "Cursor Plan Mode UI, October 2025", os: "macOS, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/blog/plan-mode-0.png",
    sourcePageUrl: "https://cursor.com/blog/plan-mode", sourcePublishedOn: "2025-10-07", uiFreshness: "historical-interface",
  }),
  figure({
    id: "fig-06", lessonSlug: "test-review-recover", surface: "app",
    captureIntent: "Review multiple agent tabs and diffs while keeping the changed-file boundary visible.",
    width: 1833, height: 1179, sha256: "48b7b6e4db15d0293380a3572352c9e96a6187e6e1ff5dfb398504e533f839e0",
    cursorVersion: "Cursor 3.0", os: "macOS, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/agent-tabs",
    sourcePageUrl: "https://cursor.com/changelog/3-0", sourcePublishedOn: "2026-04-02", uiFreshness: "dated-current",
    visiblePublicDemoIdentifiers: [
      "Public Cursor demo local path: /Users/dgomes/src",
      "Public Cursor demo repository remote: git@github.com:davidgomes/treadmiller.git",
    ],
  }),
  figure({
    id: "fig-07", lessonSlug: "rules-skills-mcp", surface: "web",
    captureIntent: "Distinguish a focused Team Rule from Skills and MCP tools instead of treating every customization as a rule.",
    width: 1949, height: 562, sha256: "16d0af902c226199ca2ad805633a4390a6d465488b7f947d928e947c1cf6d77e",
    cursorVersion: "Cursor Rules documentation, current", os: "Cursor web settings, official demo",
    sourceUrl: "https://cursor.com/docs-static/images/context/rules/team-rules-1.png",
    sourcePageUrl: "https://cursor.com/docs/rules", uiFreshness: "current",
  }),
  figure({
    id: "fig-08", lessonSlug: "cloud-parallel", surface: "cloud",
    captureIntent: "Choose Local or Cloud deliberately and keep the execution environment visible during handoff.",
    width: 2142, height: 1356, sha256: "f301dd1785af2852a1c30a6c5106dafae67387aa31fd8a2abca8c47b48ac015c",
    cursorVersion: "Cursor 3.7", os: "Agents Window, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/handoff-to-cloud.png",
    sourcePageUrl: "https://cursor.com/changelog/cloud-in-agents-window", sourcePublishedOn: "2026-06-17", uiFreshness: "dated-current",
  }),
  figure({
    id: "fig-09", lessonSlug: "software-studio", surface: "app",
    captureIntent: "Recognise the optional enterprise Browser Origin Allowlist before using manually approved visual verification on a local application.",
    width: 1008, height: 328, sha256: "5d62e6a79cc1e735a95261d4890a4ed8812af20135f4c02f55cbd2069c490832",
    cursorVersion: "Cursor Browser documentation, current", os: "Cursor settings, official demo",
    sourceUrl: "https://cursor.com/docs-static/images/agent/browser-origin-allowlist.png",
    sourcePageUrl: "https://cursor.com/docs/agent/tools/browser", uiFreshness: "current",
  }),
  figure({
    id: "fig-10", lessonSlug: "research-studio", surface: "app",
    captureIntent: "Observe Agentic Search locating relevant repository material before a research claim is drafted.",
    width: 1920, height: 1080, sha256: "2bc1f485d9378ee14ccf7f24f1ed8c2c93ecc1f51c156b76a5b5745817cd1f11",
    cursorVersion: "Cursor Learn video UI", os: "macOS, official lesson",
    sourceUrl: "https://image.mux.com/Qd4HOPoW018byI6froV6iiMH900mm00D802ywLjMueEZWQM/thumbnail.jpg?time=70&width=1920",
    sourcePageUrl: "https://cursor.com/learn/understanding-your-codebase", uiFreshness: "historical-interface",
    visiblePublicDemoIdentifiers: [
      "Recognizable official Cursor Learn presenter in first-party lesson media",
    ],
  }),
  figure({
    id: "fig-11", lessonSlug: "writing-studio", surface: "app",
    captureIntent: "Use a visible plan to separate source review, outline, drafting, style checks, and integrity checks.",
    width: 1920, height: 1080, sha256: "1ba338ea6a1c5b98ce1c3a8f52cc7a11ce2f0ec896dfb6b0e88bea5dcafad07a",
    cursorVersion: "Cursor Learn video UI", os: "macOS, official lesson",
    sourceUrl: "https://image.mux.com/lV01vHZrA4Y8JWAbiRnCF95GhgqwQcw1H7T7bXCRFrAY/thumbnail.jpg?time=180&width=1920",
    sourcePageUrl: "https://cursor.com/learn/creating-features", uiFreshness: "historical-interface",
    visiblePublicDemoIdentifiers: [
      "Public Cursor Learn demo local path: /Users/lrobinson/Developer/cursor-sh-landing",
    ],
  }),
  figure({
    id: "fig-12", lessonSlug: "office-studio", surface: "app",
    captureIntent: "Inspect a workflow Skill, then deliberately keep it active as a Custom Mode in the current chat before working with approved office files and integrations.",
    width: 3840, height: 2160, sha256: "04da725ef2d7ab5aa7b90e001b32e6f77fcc79495b60f82e909400933b4505e9",
    cursorVersion: "Cursor 3.17-era changelog UI", os: "Cursor interface, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/2026-08-13-changelog-sticky-skills-GyjHI2f0MGVFngQBebLBnlQjEkkxQm.mp4",
    sourcePageUrl: "https://cursor.com/changelog/08-19-26", sourcePublishedOn: "2026-08-19", uiFreshness: "dated-current",
    sourceAssetSha256: "0b8cbb230d10dd93a48fe7548156f54ae6f4a42b0ea24ffa4dd15bd5d0643962",
    frameTimeSeconds: 2,
  }),
  figure({
    id: "fig-13", lessonSlug: "teaching-studio", surface: "app",
    captureIntent: "Open only a synthetic teaching workspace and keep local versus cloud sources explicit.",
    width: 1670, height: 966, sha256: "2c8434e62417623149f0f6e3906ae625898f29bfb90621839a003dd7cae3449c",
    cursorVersion: "Cursor 3.11", os: "macOS, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/redesigned-picker.png",
    sourcePageUrl: "https://cursor.com/changelog/side-chat", sourcePublishedOn: "2026-07-10", uiFreshness: "dated-current",
  }),
  figure({
    id: "fig-14", lessonSlug: "workflow-capstone", surface: "cloud",
    captureIntent: "Read Cloud Build status, active-build revision, snapshot, environment version, and detail links before opening logs and checks or accepting a capstone handoff.",
    width: 1920, height: 1080, sha256: "2af5302873a7e429259a755c130ee9008d00b8f6a56b40cdbd03de15b91f28fe",
    cursorVersion: "Cursor Cloud Builds, August 2026", os: "Cursor web dashboard, official demo",
    sourceUrl: "https://ptht05hbb1ssoooe.public.blob.vercel-storage.com/assets/changelog/debug-builds-ERbRas4foKC6DFp3sTW0LSRfoFcxjG.png",
    sourcePageUrl: "https://cursor.com/changelog/08-13-26", sourcePublishedOn: "2026-08-13", uiFreshness: "dated-current",
    visiblePublicDemoIdentifiers: [
      "Public Cursor demo account name and avatar: Maya Gao",
    ],
  }),
] as const satisfies readonly CursorFigureManifest[];

export const CURSOR_FIGURE_BY_ID = Object.fromEntries(
  CURSOR_FIGURES.map((item) => [item.id, item]),
) as unknown as Readonly<Record<CursorFigureId, CursorFigureManifest>>;
