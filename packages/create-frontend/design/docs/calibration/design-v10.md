# Sessatakuma product design

This visual language comes from Akuma. Put the user's content and work first, with a calm, direct and friendly tone. The product brief determines layout, navigation, density and breakpoints; choose them to suit the task. Exact Akuma geometry is available in the optional [layout reference](docs/design-akuma-reference.md).

## Brand anchors

- Use **Noto Sans JP** for Latin and Japanese text, including controls and the wordmark. Load the font, inherit it into inputs/buttons, and keep normal letter spacing.
- Use the original bear unchanged: `public/images/logo.png`, `logo-128.png`, `logo-64.png`, or supplied copies. Preserve its proportions, colors and transparency.
- Spell the family name **Sessatakuma**. Product names can vary; preserve **AkuMa** when referring to that product. Render names as live text.

## Core tokens

Source: `src/index.css`. Reuse these roles; add a value only when the existing vocabulary cannot serve the content or accessibility need.

```css
:root {
  --font-body: 'Noto Sans JP', sans-serif;
  --color-bg-primary: hsl(0, 8%, 90%);
  --color-bg-secondary: #ffffff;
  --color-bg-secondary-hover: #fafaf9;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-inverted: #ffffff;
  --color-accent-green: #619e83;
  --color-accent-green-hover: #4e7e69;
  --color-accent-green-light: #eff7f4;
  --color-accent-red: #9e4145;
  --color-accent-red-light: #fcf2f2;
  --color-border: #e5e7eb;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --shadow-soft: 0 4px 6px -1px rgb(0 0 0 / .05), 0 2px 4px -1px rgb(0 0 0 / .03);
  --shadow-soft-floating: 0 8px 16px -8px rgb(0 0 0 / .14), 0 2px 6px rgb(0 0 0 / .06);
}
```

Primary buttons use green with white text; use the darker green where label contrast requires it. Pale green supports quiet selections and success states. Muted red is for pitch marks, warnings and errors. Additional chart colors may distinguish data while preserving these action roles.

## Content restraint

Start with the content and actions. Use one clear title per view or section. Default to no eyebrow, subtitle, decorative number or slogan; add context only when it contributes information the title and content do not provide. Prefer a descriptive heading over a poetic heading that needs another label to explain it.

Apply a deletion test to every small label, helper line, badge and icon: would removing it lose meaning, navigation, actionable instruction, state, progress or a relevant constraint? If not, delete it rather than shrink or mute it. Show a fact once in its useful location; avoid repeating counts, product descriptions, status or button instructions around the same task. Use badges and icons for meaningful distinctions, not to ornament every row or section.

Keep teaching prose, Japanese examples, useful lesson metadata, keyboard shortcuts, errors and necessary disclosures. Put unfamiliar instructions near the relevant action or state. Express warmth through clear help and useful feedback; do not fill headers, sidebars and footers with generic encouragement. Completion states show results and next actions without prose restating either. Empty states explain the problem and recovery only where these are not already clear. Run the deletion pass across every state before delivering.

## Type and surfaces

These are starting sizes; adapt emphasis to the content and keep a small, consistent hierarchy.

| Role | Default |
| --- | --- |
| Body | 16px / 400 |
| Supporting control label | 14px / 500–600 |
| Product name | 20px / 700 |
| Subheading | 18px / 700 |
| Section heading | 28px / 700 |
| Japanese practice text | 24px / 400 |
| Display heading | 32–56px / 700 |

Use about 1.75 line-height for prose and tighter leading for controls and dense rows. Annotated Japanese needs extra clearance: furigana starts at 60% of base size, with an accent lane above it. Keep readings with their words, align mixed-text baselines and preserve space when annotations are toggled.

Use a 4px spacing rhythm. Compact controls use 6–8px corners, grouped surfaces 16px, and large workspaces up to 24px. Borders are subtle and generally 1px. Group with whitespace and dividers; use a contained surface when it clarifies a boundary. Keep resting shadows soft and reserve stronger elevation for floating UI.

## Shared brand frame

Keep these assignments consistent across products. Source: `src/components/Nav.css`, `Footer.css` and `AccentEditor/components/AccentEditor.css`. Layout, navigation and content density remain flexible.

| Region | Shared treatment |
| --- | --- |
| Page canvas | `--color-bg-primary`: warm gray around the content, including public pages. White belongs to work surfaces or distinct content sections, not an alternate whole-page theme. |
| Site header | `--color-accent-green` with white product name and navigation. Original bear at 32px, product name at 20px/700; start at 64px tall and adapt controls to fit. |
| Site footer | The same `--color-accent-green`, white content, original bear and oversized **Sessatakuma** wordmark. Use the shared composition below. |

Do not use white, pale green or the darker hover/action green as a substitute for the header or footer background. White fields and subtle white-on-sage navigation hover states can sit inside the header.

Place the shared footer after normal page content. A focused exercise can hide it while the task is active; whenever shown, reuse the same content and identity rather than a compact attribution variant. Use a viewport-filling column shell with growing main content and the footer last, so no canvas strip follows it on short pages.

Reuse Akuma's complete footer content (`src/components/Footer.tsx`, `src/i18nConfig.ts`):

- Original 96px bear at left; Instagram, Threads, Facebook and GitHub marks in that order at right. Use the existing service marks at 24px in 48px controls, white on sage, with accessible service names and visible white keyboard focus. Supplied SVG copies can be used in standalone builds.
- GitHub links to `https://github.com/sessatakuma`. Instagram, Threads and Facebook are buttons showing the local message “這個帳號還在準備中。”; they have no live destinations yet. Preserve this state until real account URLs are supplied.
- Put `contact@sessatakuma.dev` below the social row, linked to `mailto:contact@sessatakuma.dev`, at 16px/400 on every screen size. Keep the address on one line. Wrap the contact group below the bear if the top row cannot fit.
- Below the bear, show the existing brand purpose paragraph at 16px with 1.75 leading: left half on wide screens, full width on narrow screens. Use the corresponding Akuma translation; Traditional Chinese is below. Let it wrap naturally.

> Sessatakuma 正在開發日語學習相關工具，也正計劃創立一個日文口說練習社群，透過提供團隊成員過去建立的完整練習體系與為其開發出的各式工具，幫助學習者提升口說練習效率、有效累積開口說日語的信心。

These shared contact and purpose details belong in the footer; keep them when applying the content deletion test. Do not replace them with task navigation or generic encouragement, invent social URLs, or append repeated product descriptions.

Finish with the bold white wordmark spanning the bottom edge, outside the padded or width-constrained inner block. Its live `Sessa` and `takuma` spans join on wide screens and stack, each centered across the full width, below 768px. Reuse Akuma's wordmark treatment:

```css
.product-shell {
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--color-bg-primary);
}
.product-shell > main { flex: 1; }
.site-footer {
  flex-shrink: 0; overflow: hidden; padding: 48px 0 0;
  background: var(--color-accent-green); color: var(--color-text-inverted);
}
.footer-inner { width: 100%; padding-inline: 32px; margin-bottom: 80px; }
.footer-bear { display: block; width: 96px; height: 96px; object-fit: contain; }
.footer-wordmark {
  display: flex; flex-wrap: nowrap; align-items: flex-end;
  width: 100%; margin: 0; padding: .18em 0 0;
  color: var(--color-text-inverted); font-family: var(--font-body);
  font-size: clamp(4rem, 15vw, 14rem); font-weight: 700;
  line-height: .82; letter-spacing: normal; word-spacing: normal;
}
.footer-wordmark span { display: block; white-space: nowrap; }
@media (max-width: 767px) {
  .footer-wordmark { flex-wrap: wrap; font-size: 26vw; text-align: center; }
  .footer-wordmark span { flex-basis: 100%; }
}
```

Apply the shell to the outer page wrapper or body, with main and footer as direct children. Put the original bear at the left of `.footer-inner`; keep `.footer-wordmark` as its sibling and last child of the footer. Keep that dominant scale and the footer's vertical edge clipping. Do not inset, shrink, stretch or horizontally crop the wordmark. Verify each span fits the viewport; hiding page overflow does not establish that the lettering fits.

## Interaction and review

Use Lucide outline icons, usually 18–24px with 2px strokes and `currentColor`. Keep secondary actions quieter than the primary action: transparent or subtly bordered, with muted labels and a soft hover surface. Keyboard focus uses a visible 2px green outline, or white on green; a field filling a panel can use one inset outline.

Keep transitions subtle, typically 200ms, and respect reduced motion. Reflow for narrow screens while keeping text readable and controls usable; content must fit without accidental page overflow or browser auto-scaling.

Review screenshots after fonts load, with realistic content and relevant empty, selected, focused and completion states. Check the canvas/header/footer color assignments, complete footer content, contact fit, pending-social behavior and wordmark as well as brand anchors, task fit, content restraint and usable wide/narrow behavior. [Calibration evidence and build briefs](docs/design-calibration.md) cover five independently generated product types.
