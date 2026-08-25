# Course 12 Claude UI media audit

**Audit result: PASS.** The seven figure families pass the binary, visual, privacy, and instructional-accessibility audit as course-authored captures of the authenticated Claude Desktop app. The current page implementation also passes the no-endorsement, responsive-image, alternative-text, caption, observation-date, and hash-gate checks documented below.

**Audited at:** 2026-08-23 03:28 CST, UTC+08:00  
**Final page-level verification:** 2026-08-23 04:04 CST, UTC+08:00  
**UI observed:** 2026-08-23  
**Scope:** 7 PNG masters and 14 WebP derivatives under `public/courses/claude-income/figures/`  
**Capture provenance supplied for this audit:** Course-authored captures from the user's authenticated Claude Desktop app. The source app viewport was 1322 by 768 pixels. The figure masters are privacy-oriented crops except where the ledger says the full viewport was retained. Device-pixel ratio is not embedded and is therefore unknown.

## Audit method and global findings

The audit combined original-resolution visual inspection, OCR as a privacy backstop, decoded-dimension checks, PNG chunk inspection, WebP container inspection, and SHA-256 hashing after the asset set was frozen.

- **Real UI status: PASS.** All seven images show internally consistent Claude Desktop controls and states from the documented capture session. They are real interface captures, not reconstructed mockups. Cropping and lossy WebP encoding are the only documented transformations. Because metadata was intentionally stripped, this provenance is established by the capture record and visual review, not by EXIF evidence inside the files.
- **Privacy status: PASS.** No username, email address, avatar, conversation title, client name, client content, local file path, usage amount, payment detail, readable private project title, or account identifier is visible. OCR did not recover private background text. Figure 07 exposes a small non-identifying product-configuration list, documented below.
- **Metadata status: PASS.** Every PNG contains only `IHDR`, `IDAT`, and `IEND` chunks. There are no PNG text, timestamp, EXIF, XMP, ICC, comment, GPS, or application-name chunks. `webpmux -info` reports `No features present` for every WebP, meaning no EXIF, XMP, ICC, animation, or other optional feature payload is embedded. The PNGs decode as 8-bit RGB; the WebPs decode as ordinary VP8 color images.
- **Derivative status: PASS.** Each WebP derivative preserves its PNG master's composition and aspect ratio, allowing for one-pixel rounding at reduced sizes. Several filenames indicate a maximum target rather than the decoded width. Integration must use the decoded dimensions in this report.
- **Responsive renderer status: PASS, verified 2026-08-23 03:50 CST.** `components/claude-income/CourseFigure.tsx` builds width descriptors from each variant's decoded-width metadata and de-duplicates candidates with the same decoded width. The current renderer therefore exposes only one 510w WebP candidate for Figure 04. The seven metadata records match the decoded widths in this report.
- **Accessible renderer status: PASS, verified 2026-08-23 04:04 CST.** The current renderer uses each audited `alt`, intrinsic master dimensions, a semantic `figure` and `figcaption`, a machine-readable observation date, visible teaching points, and a related-official-guidance link. The shared course stylesheet supplies a visible `:focus-visible` outline to the full-resolution image link. The Figure 05 security boundary and Figure 06 in-progress boundary are repeated in HTML captions and teaching points.
- **Rights and no-endorsement renderer status: PASS, verified 2026-08-23 04:04 CST.** The dashboard and every lesson render the independent-project notice. It explicitly identifies Claude and Anthropic as Anthropic PBC trademarks, states that aicourse.top is independent and is not affiliated with, sponsored by, or endorsed by Anthropic, preserves underlying-interface rights, and warns that the interface can change after the observation date. The adjacent media `NOTICE.md` and JSON manifest use `course-authored capture` language and contain no ambiguous `first-party` or `course-authorized` wording.
- **Instructional accessibility status: PASS WITH INTEGRATION REQUIREMENTS.** Safe alt-text suggestions appear below. Any control, warning, or workflow step needed to complete an exercise must also appear as adjacent HTML text. Learners must not be expected to read small screenshot text or infer state from color alone.
- **Temporal status: PASS WITH DATE CAVEAT.** These images document the interface observed on 2026-08-23. Labels, model names, availability, plan entitlements, and control placement can change. Captions must not turn an observed UI state into a universal or permanent product claim.

## Per-figure ledger

### Figure 01: Chat composer

- **Files and decoded dimensions:** PNG master 720 by 270; `-640.webp` 640 by 240; `-960.webp` 720 by 270. The 960 candidate is intentionally capped at the 720-pixel master width.
- **Viewport and crop:** Center crop from the 1322 by 768 app viewport. The crop removes the account sidebar and conversation history while retaining the greeting, composer, Chat/Cowork switch, model control, microphone, and voice control.
- **Observed UI state:** Chat is selected. A pointer overlaps the Chat control. The model label visible in this dated capture is a live UI observation and must not be used as an availability or pricing claim.
- **Privacy and crop review:** PASS. No account or task data appears. The crop includes every control it is intended to teach and does not expose sidebar content.
- **Actual UI status:** Real Claude Desktop Chat UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop Chat composer with Chat selected, a plus menu, model selector, microphone, and voice controls.`
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 02: Cowork composer

- **Files and decoded dimensions:** PNG master 720 by 300; `-640.webp` 640 by 267; `-960.webp` 720 by 300. The 960 candidate is capped at the 720-pixel master width.
- **Viewport and crop:** Center crop from the 1322 by 768 app viewport. It excludes the private task area below the composer and all conversation history.
- **Observed UI state:** Cowork is selected. The generic `Project or folder` and permission-mode controls are visible, but no project or folder has been selected.
- **Privacy and crop review:** PASS. No project name, folder path, task title, or task content remains in the crop.
- **Actual UI status:** Real Claude Desktop Cowork UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop Cowork composer with Cowork selected and project or folder and permission mode controls below the prompt.`
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 03: Capability menu

- **Files and decoded dimensions:** PNG master 760 by 510; `-640.webp` 640 by 429; `-960.webp` 760 by 510. The 960 candidate is capped at the 760-pixel master width.
- **Viewport and crop:** Purpose-specific crop from the 1322 by 768 app viewport. It retains the open plus menu and nearby composer context while excluding account and history panels.
- **Observed UI state:** The menu visibly lists files or photos, projects, Skills, Connectors, plugins, Research, and Web search. Generic suggestion chips appear beside it. Web search is checked in this observation.
- **Privacy and crop review:** PASS. The menu and suggestion chips contain generic product text only.
- **Actual UI status:** Real Claude Desktop capability-menu UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop plus menu listing files, projects, Skills, Connectors, plugins, Research, and Web search beside the Chat composer.`
- **Accuracy boundary:** Do not infer that every item is available on every plan, account, operating system, or future version from this image alone.
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 04: Create a project dialog

- **Files and decoded dimensions:** PNG master 510 by 385; `-640.webp` 510 by 385; `-960.webp` 510 by 385. Both derivatives are native-size encodings with different hashes. They are not distinct width candidates.
- **Viewport and crop:** Modal-only crop from the 1322 by 768 app viewport. A previous dimmed-background margin was removed before this final audit. The final master contains only the complete dialog and its rounded border.
- **Observed UI state:** Blank project-name and project-goal fields, a folder option, Cancel, and Create project are visible. The dialog was opened for documentation and was not submitted.
- **Privacy and crop review:** PASS. There is no remaining background content, and both input fields are blank. The close control and all actions are fully visible.
- **Actual UI status:** Real Claude Desktop Project-creation UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop Create a project dialog with blank fields for a project name and goal, a folder option, and Create project and Cancel buttons.`
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 05: File output dialog

- **Files and decoded dimensions:** PNG master 780 by 520; `-640.webp` 640 by 427; `-960.webp` 780 by 520. The 960 candidate is capped at the 780-pixel master width.
- **Viewport and crop:** Dialog-focused crop from the 1322 by 768 app viewport. The entire safety explanation, network-access switch, output examples, Settings links, and `Try it out` action remain visible.
- **Observed UI state:** The Claude dialog presents spreadsheet, PDF, presentation, and DOCX examples. Limited network access is enabled in this captured state, and the interface itself warns that this increases security risks.
- **Privacy and crop review:** PASS. The filenames and topics are generic product examples, not the user's files. No account data is present.
- **Actual UI status:** Real Claude Desktop file-output UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop file-output dialog showing spreadsheet, PDF, presentation, and Word document examples, with limited network access enabled and a security warning.`
- **Accuracy and accessibility boundary:** The safety warning is instructionally important. Repeat its meaning in nearby HTML instead of relying on small screenshot text. Do not imply that all formats or network access are available on every plan or are safe without review.
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 06: Artifact workspace

- **Files and decoded dimensions:** PNG master 1322 by 768; `-640.webp` 640 by 372; `-960.webp` 960 by 558.
- **Viewport and crop:** Full 1322 by 768 capture of the Claude Desktop artifact workspace. The Claude account and history sidebar was already collapsed before capture.
- **Observed UI state:** A course-authored prompt asks Claude to build and publish a web-page artifact. The capture shows a work-in-progress state with Progress, Outputs, and Context panels. It does not show a finished, tested, or published artifact.
- **Privacy and crop review:** PASS. The visible prompt is synthetic course content. The artifact title is generic, and no client material, path, account identity, or conversation history appears.
- **Actual UI status:** Real Claude Desktop artifact workspace captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop New artifact workspace with a web-page prompt, an empty work area, and Progress, Outputs, and Context panels.`
- **Accuracy boundary:** Caption this as a workspace or in-progress example, not proof that an artifact was successfully built, published, sold, or monetized.
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

### Figure 07: Skills settings

- **Files and decoded dimensions:** PNG master 950 by 690; `-640.webp` 640 by 465; `-960.webp` 950 by 690. The 960 candidate is capped at the 950-pixel master width.
- **Viewport and crop:** Settings-window crop from the 1322 by 768 app viewport. It retains the Skills navigation, list, author column, update dates, Browse control, and Add control. Account-detail pages are not opened.
- **Observed UI state:** Three Anthropic-authored skill names and their 2026-08-22 update dates are visible. This is an observed account state, not a claim that the same list appears for every learner.
- **Privacy and crop review:** PASS WITH DISCLOSURE. The figure reveals a low-sensitivity, non-identifying installed-skill inventory (`import-memory`, `morning`, and `skill-creator`) and update dates. It reveals no personal identity or user-authored content. If the publisher's privacy policy treats enabled feature inventory as confidential account configuration, replace this figure with a fresh demonstration-account capture; otherwise it is safe to release.
- **Actual UI status:** Real Claude Desktop Skills settings UI captured on 2026-08-23.
- **Suggested alt text:** `Claude Desktop Skills settings showing three Anthropic-authored skills, last-updated dates, and Browse and Add controls.`
- **Accuracy boundary:** Do not infer universal plan access or ongoing availability from the captured list.
- **Rights note:** Editorial interface capture. Use only with the mandatory global trademark and no-endorsement notice.

## SHA-256 release ledger

These hashes identify the frozen binaries audited at 2026-08-23 03:28 CST.

| Figure | File | Decoded dimensions | SHA-256 |
|---|---|---:|---|
| 01 | `fig-01-chat-composer.png` | 720 by 270 | `11dec55d47b0de68ab6fc45ad551cb70323d56346720bee129e5cd9d224a7196` |
| 01 | `fig-01-chat-composer-640.webp` | 640 by 240 | `e045bbebae61609a7d4329223e1d3f115631ffbaf54c69dfd8a79eb487bad7ec` |
| 01 | `fig-01-chat-composer-960.webp` | 720 by 270 | `591e0990f6620f1ec40c9e9b0a6ee4e3b012a122693ecf399e46f8cf85b0ae61` |
| 02 | `fig-02-cowork-composer.png` | 720 by 300 | `92d671632af8bd8e85a316e603fcce9939c6d02882343f55b5d624a325d458c8` |
| 02 | `fig-02-cowork-composer-640.webp` | 640 by 267 | `0e4994269842350503b20a6c9f546267e8c7f47a3daefaefcda11ff626c50443` |
| 02 | `fig-02-cowork-composer-960.webp` | 720 by 300 | `cfd8cdec2698aafd72e3f173cfcd74153077441dd2141be266c569d04b8801f2` |
| 03 | `fig-03-tools-menu.png` | 760 by 510 | `aaeb8e2978e3c0fbde681ead1ed9ccf4abdb1e77929b50fbc161278627792a60` |
| 03 | `fig-03-tools-menu-640.webp` | 640 by 429 | `7cc57268c07a5d4e798335b760ae52019a8ccf5ba61b183f80e3cfb8a1de594e` |
| 03 | `fig-03-tools-menu-960.webp` | 760 by 510 | `f95b4531cf1d95a6a5b1d6f8c3e3c1c924f55668a7c1754f85b0dc51bbea4435` |
| 04 | `fig-04-new-project.png` | 510 by 385 | `7c6bba35a9c3e4730f50a68dfe25cf4454778fb34378c9089bee065e873dc13d` |
| 04 | `fig-04-new-project-640.webp` | 510 by 385 | `c64a760825449331d3046c1f360ca86fe0669a6e88f82e2920444b192efc5afd` |
| 04 | `fig-04-new-project-960.webp` | 510 by 385 | `7126248f29c8fcc3ade57cdb0706dd682f3d9c477140a2a416a917907c918302` |
| 05 | `fig-05-file-outputs.png` | 780 by 520 | `7937a17721034737827e83dc1b321677c72fb2ae9aaf4d39787de52f39a2f202` |
| 05 | `fig-05-file-outputs-640.webp` | 640 by 427 | `cf4ba12751413c516f286c997f215eb3aacf4cf7077330074abaed6d8828122a` |
| 05 | `fig-05-file-outputs-960.webp` | 780 by 520 | `60c7a1c2e9a43e63382f21d7fec6f532df3ddacc118b52a81a482c362406016d` |
| 06 | `fig-06-artifact-workspace.png` | 1322 by 768 | `81b155f3632b27c46365dafd8692ce4b5c1f63ad1649ea67888f208f7fc2e2ab` |
| 06 | `fig-06-artifact-workspace-640.webp` | 640 by 372 | `2ddfa655cd8f232cf95bd831850ebf8ddd28c01bd97b8e2f88c3d7d12f20ce31` |
| 06 | `fig-06-artifact-workspace-960.webp` | 960 by 558 | `2fbf7aa9530eb81834b3eb17c88106485d3bcc33f471bfa3d00b876ff2bc7b32` |
| 07 | `fig-07-skills-settings.png` | 950 by 690 | `08724e40883bd3713a29ba7dd1348e0e138020b7c3073ee7355ad1dfac86babb` |
| 07 | `fig-07-skills-settings-640.webp` | 640 by 465 | `d84e171adbd27eac92a8cf88e5f6f1ed153fab72c3d1d377a14c4cd3facc3392` |
| 07 | `fig-07-skills-settings-960.webp` | 950 by 690 | `12af37d406ada4d30ed28467cb9757e1d72f7c7ea1c91f5c2df4d1fe81f990e5` |

## Accessibility integration rules

1. Render each image inside a semantic `figure` with a visible `figcaption` that identifies the UI state and says `Observed in Claude Desktop on 2026-08-23`.
2. Use the suggested alt text or a meaning-equivalent alternative. Do not use filenames as alt text and do not begin with `image of` or `screenshot of`.
3. Put workflow-critical control names, the Figure 05 network-access warning, and the Figure 06 in-progress boundary in adjacent HTML. A learner must be able to complete the lesson without reading text embedded in pixels.
4. If a figure is immediately and completely described in adjacent prose, an empty alt attribute can be preferable to duplicate screen-reader output. The visible caption still remains required for date and provenance.
5. Do not make the screenshot itself the only click target for an essential action. If zoom is offered, the zoom control needs a keyboard-operable button, visible focus, an accessible name, Escape-to-close behavior, and focus restoration.
6. Preserve the intrinsic width and height from the ledger to avoid layout shift. Do not crop these figures further with `object-fit: cover`, because that can remove labels needed by the lesson.

## Responsive image integration warning

The suffixes `-640` and `-960` describe requested width caps, not guaranteed decoded widths. A `srcset` width descriptor must match the actual decoded width, not the suffix:

- Figure 01 candidates: `640w` and `720w`
- Figure 02 candidates: `640w` and `720w`
- Figure 03 candidates: `640w` and `760w`
- Figure 04: one `510w` WebP candidate only; do not publish both same-size files as `640w` and `960w`
- Figure 05 candidates: `640w` and `780w`
- Figure 06 candidates: `640w` and `960w`
- Figure 07 candidates: `640w` and `950w`

Publishing a 720-pixel file as `960w`, or either 510-pixel Figure 04 file as `640w` or `960w`, would make the HTML descriptor factually wrong and can cause incorrect browser selection. This is a page-integration release condition even though the binaries themselves pass.

**Current integration verification:** PASS. The audited `CourseFigure` renderer uses the actual `variant.width` values and de-duplicates equal widths. Re-run this check if the renderer or figure metadata changes.

## Rights and trademark framing

These are course-authored captures of a third-party product interface. The capture files must not be framed as official Anthropic media, as licensed Anthropic courseware, or as evidence of Anthropic sponsorship. Underlying interface artwork, product names, and trademarks remain subject to their owners' rights. This media audit documents provenance and privacy; it is not a legal opinion about every jurisdiction or redistribution context.

The course must display this no-endorsement notice in a visible footer or media notice reachable from every page that uses the figures:

> Claude and Anthropic are trademarks of Anthropic PBC. These interface screenshots are course-authored captures reproduced for identification, commentary, and instruction; all rights in the underlying product interface remain with their respective owner. aicourse.top is independent and is not affiliated with, sponsored by, or endorsed by Anthropic.

Recommended date caveat immediately after it:

> Interface observed on 2026-08-23. Features, labels, model names, plan availability, and control locations may change; verify the current Claude interface and official documentation.

Do not use `official`, `Anthropic-approved`, `Anthropic partner`, `certified by Anthropic`, or visually similar claims in figure captions, surrounding badges, social cards, or page metadata unless separately and verifiably authorized. The Claude mark visible inside the captured interface is contextual product identification, not a course logo.

## Final release decision

**Media binary decision: PASS.** The frozen files match the hashes above, decode correctly, contain no embedded metadata beyond essential image chunks, are visually legible at their intended sizes, contain no direct personal or client data, and faithfully document real Claude Desktop UI states from 2026-08-23.

**Page-level media decision: PASS, verified 2026-08-23 04:04 CST.** All five fail-closed conditions are satisfied in the current implementation:

1. **PASS:** The trademark and no-endorsement meaning above is visible on the course dashboard and every lesson page, including every page that displays a figure.
2. **PASS:** Responsive image descriptors use actual decoded widths, and the current `CourseFigure` renderer de-duplicates Figure 04 to one 510-pixel WebP candidate.
3. **PASS:** Every figure has meaningful alternative text, a visible caption, teaching points, and an official-guidance link. Instructionally necessary warnings and completion boundaries are repeated in HTML.
4. **PASS:** Every figure caption exposes the 2026-08-23 observation date and avoids claims of universal plan access, completed delivery, revenue, endorsement, or permanence.
5. **PASS:** `scripts/check-claude-income-course.mjs` decodes every master and derivative, compares dimensions and SHA-256 values against the TypeScript and JSON manifests, rejects embedded text/EXIF/XMP chunks, and fails on incomplete privacy or capture-rights records. A development-gate run completed its media checks without a media error; its only failures at that moment were two still-in-progress, non-media course files.

This PASS is fail-closed. If a figure, derivative, figure manifest, renderer, caption, rights notice, or release checker changes, or if any hash no longer matches, the page-level media decision becomes **FAIL** until the affected checks are rerun and this ledger is updated.

### Post-audit rights-record revalidation

**PASS, 2026-08-23 04:27 CST.** The media notice was extended only to point to
the new repository-rights manifest; the required trademark, independence,
no-affiliation, no-sponsorship, no-endorsement, capture-basis, and interface-date
language remains unchanged. The deterministic Course 12 checker was rerun after
that edit. All 21 image hashes, decoded dimensions, metadata checks, privacy
fields, capture-rights fields, renderer boundaries, and notice assertions passed.
Its only reported failure was the intentionally absent final release-audit file,
which is outside the media gate. The media binary and page-level decisions remain
PASS.
