import type { PromptFigureKind, PromptFigureManifest } from "./types";

const promptWorkbenchCreationPrompt = `Use case: text-localization. Asset type: Course 7 prompt-engineering hero/workbench illustration. Image 1 was the edit target and visual-style reference. Replace the existing five-card sequence with exactly six equal cream paper cards, aligned left to right and connected by the same small coral arrow tabs. Preserve the premium top-down dark-charcoal desk scene, cream textured paper, coral edge accents, pencil, notebooks, lighting, shadows, landscape composition, and restrained editorial style. Show exactly these uppercase labels, one per card, in this order: GOAL, CONTEXT, TASK, CONSTRAINTS, OUTPUT, SUCCESS CRITERIA. Use bold black uppercase sans serif typography; SUCCESS CRITERIA may use two centered lines. Include exactly six cards and those six labels, with no title, subtitle, icons, logos, watermark, or extra text. Do not crop a card. Avoid the old terms OUTCOME, INPUT, and FORMAT.`;

const evaluationLoopCreationPrompt = `Use case: scientific-educational. Asset type: supporting course figure for a lesson about evaluating prompts. Create a tactile overhead three-part prompt evaluation loop made from real paper cards on the same cool charcoal-navy matte desk. Arrange three large off-white cards in a clear clockwise closed loop connected by restrained coral cord or arrows. Show exactly these uppercase labels once: ANALYZE, MEASURE, IMPROVE. Use high-end editorial product photography, realistic materials, soft studio light, and a wide landscape crop. Include no other text, numbers, logos, watermark, screens, gradients, purple, neon, hands, or generic AI imagery.`;

export const PROMPT_FIGURES = [
  { kind: "pipeline", format: "semantic-html", status: "available", raster: null },
  {
    kind: "workbench",
    format: "original-raster-with-transcript",
    status: "available",
    raster: {
      webpPath: "/courses/prompts/prompt-workbench-v2.webp",
      webpWidth: 1536,
      webpHeight: 1024,
      pngPath: "/courses/prompts/prompt-workbench-v2.png",
      width: 1536,
      height: 1024,
      webpSha256: "da07ae6ef9c65098621b7e07c2f73efacccea29bcebb4ba99d4d7a33a6714df6",
      pngSha256: "0130fc3fb46e8cadf734eaef239b804e102e30385f3febf841059620a401e439",
      createdOn: "2026-08-23",
      creator: "OpenAI image generation",
      creationPrompt: promptWorkbenchCreationPrompt,
    },
  },
  { kind: "authority", format: "semantic-html", status: "available", raster: null },
  { kind: "few-shot", format: "semantic-html", status: "available", raster: null },
  { kind: "four-jobs", format: "semantic-html", status: "available", raster: null },
  {
    kind: "evaluation-loop",
    format: "original-raster-with-transcript",
    status: "available",
    raster: {
      webpPath: "/courses/prompts/evaluation-loop.webp",
      webpWidth: 1536,
      webpHeight: 1024,
      pngPath: "/courses/prompts/evaluation-loop.png",
      width: 1280,
      height: 853,
      webpSha256: "e66f440f557466adf39021b6700f133cfb8a1d48a644bebd0ea1b0cddd03eaa8",
      pngSha256: "5ef3f1c9e60b021f55903d966e0568007d13832015c91d1af17f4005799a6bf6",
      createdOn: "2026-08-23",
      creator: "OpenAI image generation",
      creationPrompt: evaluationLoopCreationPrompt,
    },
  },
  { kind: "chain", format: "semantic-html", status: "available", raster: null },
  { kind: "evidence", format: "semantic-html", status: "available", raster: null },
  { kind: "capstone", format: "semantic-html", status: "available", raster: null },
] as const satisfies readonly PromptFigureManifest[];

export const PROMPT_FIGURE_BY_KIND = Object.freeze(Object.fromEntries(
  PROMPT_FIGURES.map((figure) => [figure.kind, figure]),
)) as Readonly<Record<PromptFigureKind, PromptFigureManifest>>;
