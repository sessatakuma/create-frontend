# Akuma layout reference

These are measurements and patterns from the local AkuMa web app checkout at `dbe446900f57ab6e175b8293f0a2289e1002eefc`. Use them when reproducing Akuma or deliberately adopting one of its patterns. They do not prescribe the structure of other Sessatakuma products.

The shared brand rules and tokens live in [design.md](../design.md). Start a new product from that document and its functional brief. This reference is optional; consult only the sections relevant to the chosen interface.

The two-panel editor, full-height empty surfaces, three-step guide, sticky header and large footer form one complete Akuma composition. Other products can use different navigation, content widths, density, page order and responsive layouts. The precise dimensions below apply to the reference composition.

## Akuma header

Use a full-width, sticky, solid green bar, 64px tall, with a 1px bottom border. Desktop horizontal padding is 32px; at 480px and below it is 12px. Put the existing logo at 32 × 32px beside a white 20px bold product name with an 8px gap. Keep the artwork's aspect ratio and transparency.

Place a concise guide link with a 20px outline book icon on the right. Its control height is 40px, radius 8px, with an 8px icon/text gap. It hides at 480px and below. Authentication is optional content: AkuMa uses a small white email field and translucent white sign-in control. If included, use 36px height, 8px corners, and compact mobile variants.

## Working area: the AkuMa reference

At widths of 1024px and above:

- The main container is centered, at most 1400px wide **including** 32px padding on each side.
- Two equal-width panels sit in a grid with a 32px gap. Each panel has a 24px radius and a 1px border.
- The main area occupies the rest of the first viewport: `min-height: calc(100dvh - 64px)` including padding. A nested editor viewport uses `min-height: calc(100dvh - 64px - 64px)`.
- Each panel stack reserves 53px above and 53px below the panel for status/callout space. This is `14px * 1.5 + 16px * 2`. With the main's 32px top padding, panel tops sit at y=149px.
- Panel content and bottom controls are inset 24px. Content is top-aligned; controls stay at the bottom. Minimum panel height is 192px and panels grow with content.
- At 1440 × 1000 CSS pixels, with no scrollbar width, panels begin at x=52 and x=736; each is 652px wide and 766px tall. A platform scrollbar may move the centered edges by about 8px. The guide begins after the first viewport.

The input is a borderless multiline field in the left panel. Its first line has extra clearance to align with the result's Japanese baseline below the ruby track: top padding is `24px + (24px * .6) + 2px = 40.4px`, with 24px horizontal padding. The empty result uses the same 40.4px total top inset (24px surface padding plus 16.4px placeholder padding), font size and line height, so both placeholders share a baseline. A quiet “insert example” action with a dice icon sits at bottom right. The right panel contains annotated text and a compact bottom toolbar. Neither panel has a large visible title or nested card stack. Empty states use top-left 24px gray placeholder text at 60% opacity, not centered illustrations. In AkuMa the short empty result label is “結果”. The result toolbar appears when there is content; an empty result surface contains only its placeholder.

For another workflow, preserve the generous working surface, small quiet controls and first-viewport priority. Change panel count only when the task calls for it. Do not add a sidebar or a marketing hero by default.

### Responsive behavior

| Width           | Working area                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------- |
| 1024px and up   | Two equal columns, 32px gutter, 24px panel corners, 53px stack clearance above/below          |
| 769–1023px      | One column, 32px page padding, 8px panel gap, rounded panels, no 53px stack clearance         |
| 768px and below | Full-bleed stacked white surfaces, zero page padding and gap, square corners, no side borders |

On small screens each empty tool panel has a minimum height of `(100dvh - 64px) / 2`. At 390 × 844, the first panel occupies y=64–454 and the second y=454–844. Keep 24px interior padding. Content growth may increase panel height. Expand controls hide on mobile. Guide content returns to 16px horizontal padding and 48px outer vertical spacing. Do not scale down a desktop layout or retain floating rounded mobile cards.

### Width and sizing contract

Preserve Akuma's viewport-fitting layout at every layer, including explanatory rows and input internals. Use `<meta name="viewport" content="width=device-width, initial-scale=1">`. Grid tracks use `minmax(0, 1fr)`, and grid/flex children that contain text or demonstrations have `min-width: 0`. White preview surfaces use `width: 100%` and border-box sizing. On mobile the icon showcase areas become **80 × 80px**, with 40px glyphs and 16px gaps; the row's width is capped by its available container width. At 390px, a guide preview has 358px outer width and 294px inside its 32px padding.

The following implementation constraints express those source dimensions. Apply them to equivalent classes in the new site:

```css
*,
*::before,
*::after {
    box-sizing: border-box;
}
.panel-stack,
.panel,
.guide-row,
.guide-copy,
.guide-preview {
    min-width: 0;
}
.guide-preview {
    width: 100%;
}
.action-showcase {
    display: flex;
    justify-content: center;
    gap: 32px;
    width: min(100%, 520px);
}
.showcase-icon {
    flex: 0 1 112px;
    min-width: 0;
    height: 112px;
}
@media (max-width: 768px) {
    .guide-row {
        grid-template-columns: minmax(0, 1fr);
    }
    .action-showcase {
        gap: 16px;
    }
    .showcase-icon {
        flex-basis: 80px;
        height: 80px;
    }
}
```

Akuma uses a normal textarea with `field-sizing: content` and a flex-based panel. When using an alternative autosizing implementation, its hidden measuring element must obey the same border-box sizing and width as the visible field. Prefer the existing simple layout where possible. Page-level overflow clipping is not a substitute for correctly sized content; only the oversized footer wordmark intentionally clips within its footer.

At 390px device emulation, verify `document.documentElement.clientWidth === 390`, `document.documentElement.scrollWidth <= 390` and `visualViewport.scale === 1`. Compare scroll width to **client width**, since mobile browsers can expand `innerWidth` to accommodate overflow and then scale the whole page down. Check both empty and populated states.

## Akuma annotation and controls

Show furigana directly above its base characters, with dark base text and muted readings. Reserve a dedicated accent track above the readings. Pitch uses a 2px muted red horizontal stroke and a short right-hand downstroke when the pitch falls. Preserve space even when accents are hidden so text does not jump. Japanese words and their readings should stay together when wrapping.

The vertical order is **accent track → reading → Japanese base**. Give each word an explicit reading row and base row (`inline-grid` is the source approach). Words without readings still reserve the same reading-row height, so kana, punctuation and annotated kanji share a base line. At 24px base size, the reading row is approximately 26.5px: `14.4px * .5 + 2px + 14.4px * 1.2`. Anchor pitch strokes to that reading row. A low/unmarked sound has an empty accent lane; a sustained high sound has a horizontal mark; a falling sound has that mark plus a downstroke. Base characters remain free of red decoration. In a static sample, use explicit per-word markup and these rows rather than depending on browser ruby positioning for the accent track.

For reference, `Kana.css` uses a 0.5em accent lane, a 2px gap, and a 0.4rem drop. Editing highlights are restrained red tints. A dark result panel uses light text and a lightened green accent (`color-mix(in srgb, #619e83 72%, white)`). The rest of the page keeps its normal colors.

Use Lucide outline icons, generally 18–24px, with `currentColor` and consistent 2px strokes. Existing social-service marks are exceptions. Controls have transparent backgrounds, muted text, 8px corners and soft off-white hover states. The source desktop toolbar uses 40px squares, 8px icon gaps and a thin separator before export actions. Main calls to action use solid green and white text; secondary actions use a pale surface and subtle border. Avoid turning every tool action into a filled button.

Provide visible keyboard focus (2px green outline, 2px offset; white on green), accessible names for icon-only actions, correct button semantics, and working keyboard interactions. The input's keyboard focus uses one **inset** 2px green outline with `outline-offset: -2px`; the outer panel keeps its normal border. Pointer interaction shows the caret without adding a second inset frame. Preserve readable labels and practical touch targets. Do not hide overflow to conceal layout errors.

## Akuma explanatory sections

These sit on the same warm gray page canvas. AkuMa's guide container is at most 1400px wide. At desktop widths of 1024px and above it has **128px** internal side padding, so it is narrower than the tool. The section has 64px outer vertical padding. The pitch introduction has its own 64px vertical padding and top/bottom hairlines, followed by 64px space before the three guide rows.

The pitch introduction uses a `.9fr / 1.1fr` layout with an 80px gap. Its **left column contains the heading followed by its paragraph** with 32px between the blocks. The right column contains three compact stacked examples: low/unmarked, sustained high, and falling pitch. Each example places a 48px kana glyph in a 64px-square area beside an 18px bold title and 16px muted explanation. A sibling learning tool can use equivalent concept examples here. Keep headings naturally wrapped on desktop; the source's deliberate heading break occurs on mobile. On mobile, stack the introduction columns, with 24px between them and 32px vertical padding.

Each guide row has a white 16px-radius demonstration panel and a text block. On desktop use equal columns, a 96px gap and 64px vertical padding, with a minimum row height of 344px. Alternate the demonstration left/right between rows. A demonstration surface is at least 208px tall and uses 32px padding. Large instructional icons are 56px, in 112px areas. Step titles are 18px; explanation text is 16px with 1.75 line height. On mobile, stack each demonstration above its explanation, use 32px row padding, and shrink the showcase icons to 40px.

Instructional demonstrations have their own larger scale. In Akuma's editable-word demonstration, the scale token is 48px desktop / 36px mobile; readings are `.76` times that scale and base characters are `1.14` times it (about 36.5px reading / 54.7px base on desktop). Pitch strokes are 3px with an approximately 11px drop. This creates one large centered word, rather than ordinary 24px editor text floating in a large card. Source action demonstrations use three charcoal icons (keyboard, clipboard, dice; or copy, image, code) with 32px gaps, 16px on mobile. Content can vary by workflow while retaining this visual weight.

The source's Chinese guide heading emphasizes short phrases with a **4px green underline**, 4px below the text. Use this sparingly when language and meaning support it. This is an underline on meaningful words, not a decorative swoosh.

If a secondary product or plan section is required, AkuMa provides a full-width white band with a centered 1120px inner area, 48px vertical/32px horizontal padding, large left-aligned heading and modest bordered plan cards. It follows the guide. Pricing and roadmap status are content, not reusable brand rules; take them from the current product brief.

## Full brand footer pattern

This is a major brand signature. Use full-width solid `#619e83` with white content and no rounded outer container. Top padding is 48px. An inner block uses 32px horizontal padding, 32px row gaps, and 80px of bottom spacing before the wordmark.

On desktop, place the existing bear logo at **96 × 96px** on the left. Put 24px social icons in 48px touch areas on the right, with `contact@sessatakuma.dev` below them. Put the brand's short purpose paragraph under the logo, in the left half of the layout. In Akuma, Sessatakuma describes developing Japanese learning tools and planning a Japanese speaking-practice community. Keep claims grounded in that scope.

The contact email is **16px / 400 on both desktop and mobile**. The source social row contains Instagram, Threads, Facebook and GitHub; GitHub links to `https://github.com/sessatakuma`. The other three are pending accounts and use buttons that show a short local “account in preparation” message. Preserve that behavior or use only destinations supplied by the product owner. Do not invent social URLs. Keep the contact row's visual weight when reproducing AkuMa.

For a Traditional Chinese prototype, this existing brand paragraph can be reused verbatim. Render it as a naturally wrapping paragraph without manually inserted line breaks:

> Sessatakuma 正在開發日語學習相關工具，也正計劃創立一個日文口說練習社群，透過提供團隊成員過去建立的完整練習體系與為其開發出的各式工具，幫助學習者提升口說練習效率、有效累積開口說日語的信心。

Finish with the exact text **Sessatakuma**, rendered as adjacent `Sessa` and `takuma` spans. Desktop size is `clamp(64px, 15vw, 224px)`, weight 700, line-height `.82`, top padding `.18em`, **normal letter spacing and normal word spacing**. Use Noto Sans JP without horizontal scaling or tracking adjustments. The wordmark starts at the left edge, nearly spans the page, and meets the bottom edge. It is not a small centered footer label. The footer clips its oversize wordmark at its own boundary.

Below 768px, keep the **same 96px logo** left and contact group right at the top, with 32px outer side padding; let the purpose paragraph span the width. The contact group can occupy the remaining row width; do not reduce its font size. At unusually narrow widths where the two groups cannot fit, wrap the contact group rather than shrinking the logo or text. Stack the wordmark as **Sessa** / **takuma**, centered, at **26vw**, retaining the tight line height. At 390px this is about 101px. Keep the contact address on one line and ensure the top row fits.

## Typography measurements

| Role                                | Size / weight                           | Line height |
| ----------------------------------- | --------------------------------------- | ----------- |
| Header product name                 | 20px / 700                              | 1.5         |
| Tool input and Japanese result      | 24px / 400                              | 2.5         |
| Furigana                            | 60% of base text (14.4px at 24px) / 400 | 1.2         |
| Guide section heading               | 28px / 700                              | 1.2         |
| Guide step title                    | 18px / 700                              | 1.3         |
| Body and footer description         | 16px / 400                              | 1.75        |
| Toolbar label                       | 14px / 500–600                          | 1.5         |
| Secondary product promotion heading | 56px / 700                              | 1           |

The 56px heading is for the secondary Chrome extension section in AkuMa. It does not introduce the working tool. Below 840px it becomes 44px; below 560px, 32px. Body copy is muted gray. Large Japanese content is normal weight, not a bold display treatment. Avoid uppercase tracked eyebrows and unrelated display fonts.

## Source map

| Rule                                          | Akuma evidence                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| Colors, spaces, radii, shadows                | `src/index.css`                                                              |
| Typeface and font loading                     | `src/app/layout.tsx`                                                         |
| Page order                                    | `src/components/Main.tsx`                                                    |
| Header and compact brand                      | `src/components/Nav.tsx`, `Nav.css`, `src/auth/AuthControls.css`             |
| Work surface geometry and responsive layout   | `src/components/AccentEditor/components/AccentEditor.css`                    |
| Input, result, toolbar, focus and dark result | `Input.css`, `Result.css` in the same directory                              |
| Furigana and accent geometry                  | `Kana.css` in the same directory                                             |
| Instructional rows and examples               | `src/components/UsageSection.tsx`, `UsageSection.css`, `UsageAccentDemo.css` |
| Secondary promotion                           | `src/components/ChromeExtensionSection.css`                                  |
| Brand footer and contact details              | `src/components/Footer.tsx`, `Footer.css`, `src/i18nConfig.ts`               |
| Original bear artwork                         | `public/images/logo.png`, `logo-128.png`, `logo-64.png`                      |
