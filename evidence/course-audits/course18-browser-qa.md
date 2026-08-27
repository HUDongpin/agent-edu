# Course 18 browser QA report

> Final local verification: 2026-08-26 (Asia/Taipei)  
> Branch: `codex/course-18-agentic-teaching`  
> Build under test: Next.js 16.3.1 static export served from `out/` on localhost  
> Browser driver: Playwright CLI, Chromium

## Scope

- Simplified Chinese course home: `/zh-Hans/ai-teaching/`
- Simplified Chinese module 1: `/zh-Hans/ai-teaching/agentic-teaching-boundaries/`
- Explicit fallback example: `/ar/ai-teaching/`
- Viewports: `320 × 844`, `360 × 844`, `375 × 844`, `390 × 844` and `1440 × 900`

## Results

| Check | Result | Evidence observed |
|---|---|---|
| Production render | PASS | Course title, 10-module map, 16-source register, final assessment and capstone rendered from the static export. |
| Responsive layout | PASS | The final rebuilt home and module pages had `scrollWidth === viewport width` at 320, 360, 375 and 390 px; desktop also had no overflow at 1440 px. A long commit SHA found by an independent narrow-screen audit was fixed with zero-minimum grid tracks and safe metadata wrapping. The non-breaking `K‑12` title no longer splits between `K-` and `12`. |
| Mobile navigation keyboard path | PASS | After opening `菜单`, normal `Tab` moved to the first navigation link (`课程`); `Escape` closed the menu, restored focus to the menu button and set `aria-expanded="false"`. |
| Decision boundary | PASS | Selecting high-impact grading plus automatic authority produced the blocking state `停止：不能把高影响判断交给智能体`. |
| Artifact gate | PASS | A synthetic 394-character boundary card containing all five required labels passed the deterministic structure check; the UI continued to state that human quality review was required. |
| Knowledge gate | PASS | The correct no-AI transfer answer unlocked module completion only after the structured artifact had been saved. |
| Progress persistence | PASS | After recording module 1 and reloading, the module remained complete and the course home showed `1/12` (`8%`). |
| Fallback transparency | PASS | `/ar/ai-teaching/` retained Arabic site chrome but displayed a prominent English-course fallback notice and English course content. |
| Accessible names | PASS | Every tested button, input, select and textarea had a label; page landmarks were made unique after the initial scan identified duplicate course-map/evidence names. |
| axe-core, course home | PASS | Final scan: 0 violations at both mobile and desktop verification points. |
| axe-core, module page | PASS | Final scan after landmark fix: 0 violations. |
| Document structure | PASS | One `main`, one `h1`, labelled progressbar, labelled fieldsets and no unlabeled tested controls. |
| Browser console | PASS with note | 0 errors. Chromium reported one non-blocking Next.js CSS preload warning after page load; it did not affect rendering or interaction. |

## Build and release boundary

- `npx next build --webpack`: PASS; 1,940 static pages generated.
- `npm run ai-teaching:static-check`: PASS; 99 Course 18 HTML routes, reviewed `en`/`zh-Hans` hreflang, explicit fallback elsewhere, plus schema 3 integrity over all 12,148 exported files.
- `npm run build`: Course 18 and preceding gates pass, then the existing Course Codex release gate stops the site build because 18 real Codex UI captures are still missing. This is outside Course 18 and prevents an honest whole-site release claim.

## Artifact handling

Playwright snapshots, screenshots and console logs were written under the ignored directory `output/playwright/course18/.playwright-cli/`. They are local QA artifacts and are intentionally not part of the course source package.

## 纠错复验（2026-08-26）

内容纠错与最终 v2 证据回执落地后，另以 `tests/ai-teaching-course.spec.ts` 和专用 Playwright 配置对 hash-bound 最新静态产物做了 6 项回归，结果为 **6/6 PASS**：

1. 英文与简体中文课程首页、模块 1 在 320 px 均无横向溢出；桌面英文首页没有 serious/critical axe 违规，且未捕获浏览器运行错误。
2. 浏览器真正选择 10 道正确答案与 2 道非关键错误答案并提交；页面精确显示并保存 `10/12`，显示英文逐题正确/错误状态与解释，重载后总进度保持 `1/12`；旧 `agenticTeaching.quiz.passed=true` 和 capstone v1 布尔值被 fail closed 拒绝。
3. 中文浏览器流程选择 11 道正确答案但故意答错关键题；即使达到数值阈值，仍显示“不通过”、中文逐题解释且不写入通过回执，进度保持 `0/12`。
4. 英文模块完成回执在只浏览中文页时保持有效；使用中文模板明确保存新修订后，旧模块回执立即失效，进度由 `1/12` 回到 `0/12`。
5. `grade` 即使选择 draft-only 权限仍进入停止路径；页面要求教师先完成学术判断，智能体之后才可生成可编辑的证据摘要或反馈草稿。
6. 完成 10 个模块、`10/12` 终测与 Capstone 后，另一标签页保存并重新记录一份新的合格模块证据；原标签页的旧责任声明随 prerequisite fingerprint 变化自动失效，必须重新勾选后才能再次记录 Capstone。

最终一轮独立进度审计还发现了 positional-only 绕过：若本地化可见标签在数组位置间换位而保留 `correctIndex`，旧 validator 可能接受错误语义。现已移除运行期评分对索引的依赖：期末与 checkpoint 选项均物化为 `{id, label}`，浏览器按 semantic ID 选择、反馈、计分并铸造回执；canonical contract 同时锁定 option ID 顺序和每种已审校语言的 exact 标签指纹。确定性负测覆盖英中同时换标签、同时换 ID、checkpoint 标签/ID 换位、错误 ID 铸造，以及标签契约更新后旧回执失效。上述修复之后重新完成 1,940 页构建和本页列出的 6/6 浏览器流程。

最新复验同时通过：`npm run ai-teaching:check:release`、TypeScript、目标 ESLint、`git diff --check`、Next.js 16.3.1 `--webpack` 构建（1,940 个静态页面）以及 99 个 Course 18 静态 HTML 路由检查。构建后的 schema 3 清单绑定当前源输入 `cd3b340ee5f0…`、99 个课程 HTML `d64fcc306d16…`，以及完整 `out/` 中 12,148 个文件的排序 inventory 和全树 `cbcec007e6a3…`；共享负测证明只改一个 JS/CSS 字节、缺失文件或新增文件都会被拒绝。Playwright 默认先验证清单、禁用已有服务器复用，再服务 `out/` 发布候选，不依赖 Next 开发服务器。这也避免隔离工作树的跨根目录依赖符号链接触发 Turbopack 拒绝，同时拒绝陈旧导出。
