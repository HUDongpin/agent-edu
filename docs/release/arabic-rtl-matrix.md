# Arabic RTL, breakpoint, theme, and keyboard matrix

Run every row against the same frozen commit and Vercel deployment. The 979px
and 980px rows prove the orientation boundary; 390px and 1440px prove the
representative mobile and desktop journeys. Keyboard checks are mandatory in
every row, not a ninth optional case.

| Width | Theme | Expected visual orientation | `aria-orientation` | Keyboard suite | Active tab visible | Whole-page overflow | Bidi/code | Result |
|---:|---|---|---|---|---|---|---|---|
| 390 | light | horizontal | horizontal | pending | pending | pending | pending | pending |
| 390 | dark | horizontal | horizontal | pending | pending | pending | pending | pending |
| 979 | light | horizontal | horizontal | pending | pending | pending | pending | pending |
| 979 | dark | horizontal | horizontal | pending | pending | pending | pending | pending |
| 980 | light | vertical | vertical | pending | pending | pending | pending | pending |
| 980 | dark | vertical | vertical | pending | pending | pending | pending | pending |
| 1440 | light | vertical | vertical | pending | pending | pending | pending | pending |
| 1440 | dark | vertical | vertical | pending | pending | pending | pending | pending |

## Keyboard suite for each row

1. Start from a deep link, then repeat after restored progress, pointer click,
   and keyboard selection.
2. Confirm exactly one tab has `tabindex="0"`; every other tab has `-1`.
3. `Home` and `End` move to the first and last tab.
4. In horizontal RTL layout, `ArrowLeft` moves to the next visual item and
   `ArrowRight` to the previous visual item. Wrapping behavior must be consistent.
5. In vertical layout, verify the implemented Up/Down behavior and that Left/Right
   do not contradict the announced orientation.
6. Focus, selected state, panel visibility, URL/deep-link state, and the stable
   page H1 agree after each move.
7. The active tab scrolls fully into view without moving focus elsewhere.

## Visual and bidi suite for each row

- No whole-page horizontal overflow; a deliberately scrollable code/table region
  must be clearly bounded and must not force the page width.
- Focus rings, selected state, text, and icons remain visible in both themes.
- Arabic punctuation and numbers read in the intended order.
- Code, URLs, file paths, API/model identifiers, and hostnames remain LTR.
- Long Arabic labels do not overlap, clip, or hide controls.

## Evidence and signature

Record only a sanitized matrix record ID and deployment ID. Never paste a
preview bypass URL, credential, Prompt/reply, Provider response, or screenshot
containing any of those values.

- Release commit SHA:
- Vercel deployment ID:
- Arabic reviewer reference:
- Assistive technology/browser/device summary:
- Matrix record ID:
- Result: pass / fail
- Completed at (UTC):
- Evidence sanitization confirmed by:

Automated direction and DOM assertions cannot replace this Arabic review.
