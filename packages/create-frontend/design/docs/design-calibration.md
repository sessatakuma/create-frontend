# Design guide validation

The reusable brand guide is [design.md](../design.md); exact source composition measurements live in the optional [Akuma layout reference](design-akuma-reference.md). Their visual source is the local Akuma checkout at `dbe446900f57ab6e175b8293f0a2289e1002eefc`, including its original logo and Noto Sans JP font. Other repositories and external design references are outside this calibration.

## Complete shared footer across five products · 2026-10-03

Five fresh-context builders received the same frozen version 10 guide, original logo/font assets, copies of Akuma's four social-service SVG marks and the five family-flexibility briefs below. Akuma implementation, screenshots, the optional layout reference, previous prototypes and review feedback were excluded. The guide stayed unchanged throughout the run; the reviewer did not edit the generated sites.

Frozen builder-input guide SHA-256 (before repository formatting and shared-repo asset path updates):

```text
d98b0c201007990651670b2038730d26db663e8d97d2cd68b8f3562e8415be7d
```

All five reproduced the warm gray canvas and sage header/footer while choosing different task structures. Their shared footer contains the original bear, Instagram/Threads/Facebook/GitHub marks in source order, `contact@sessatakuma.dev`, Akuma's exact Traditional Chinese brand purpose paragraph and the oversized live Sessatakuma wordmark. The purpose and contact content remain part of the brand when applying the guide's content deletion test.

All 15 footer reviews at 1440 × 1000, 768 × 1024 and 390 × 844 CSS pixels passed:

- Original 96px bear; supplied 24px social marks in 48px controls with accessible service names.
- Instagram, Threads and Facebook are buttons showing “這個帳號還在準備中。” locally; no invented social destinations.
- GitHub targets `https://github.com/sessatakuma`; email targets `mailto:contact@sessatakuma.dev`.
- White controls, 16px/400 email and 16px purpose paragraph with 1.75 leading. Contact controls fit without overlapping the bear; narrower layouts can wrap the group.
- Source canvas/header/footer colors, loaded Noto Sans JP, document scroll width equal to client width and viewport scale 1.
- Both wordmark spans fit horizontally. The contained footer ends at the document edge within subpixel rounding, with Akuma's vertical wordmark edge clipping.

The three pending buttons were exercised in every product, including Threads via keyboard Enter. Each shows the original local message and keeps the current page. Keyboard focus uses a visible white 2px outline. Additional 320px checks in all five confirm contact fit, preserved sizes and no bear/contact overlap. These checks inspect destinations without sending email or creating an external social action.

| Product      | Independent composition                                                     | Representative task checks                                                                  |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 詞彙庫       | Dense collection with search/filter controls and responsive vocabulary rows | Details/example, studied count 9 → 10, search/topic zero results and recovery to 24 entries |
| 每日複習     | One focused prompt; full footer appears on completion                       | Space reveal, arrow-key ratings, eight-card 7/1 result and one missed-card replay           |
| 一起開口     | Month calendar and selected-day agenda                                      | Details, local plan 0 → 1 → 0, full-session disabled action and empty November              |
| 日語小課     | Contents navigation, lesson column and inline Japanese examples             | Reading aids, bookmark, three-question 3/3 feedback and completion                          |
| 開口的第一步 | Public introduction, four-week curriculum, activity and local form          | Activity choice/reveal and validated browser-local confirmation                             |

Footer screenshots were visually inspected at all three sizes. Representative local interactions were exercised in Chromium with no console errors or warnings. All five generated browser scripts passed syntax checks. The wordmark measures 216px at 1440px, 115.2px at 768px and 101.4px at 390px.

The 1,419-word guide fixes shared brand content and visual foundations while leaving product navigation, layout, density and work-surface geometry flexible. This run covers one independent generation per tested brief and reviewed states. It does not guarantee every future generation or model, production services, educational completeness, accessibility conformance or other browsers.

Local implementations are `v10-library/`, `v10-flashcards/`, `v10-calendar/`, `v10-reader/` and `v10-course/` under `.build/design-calibration/`. The gallery provides page/footer views at desktop/tablet/phone sizes, runnable products and an earlier-guide comparison. `design-v10.md` is the frozen guide; `evidence-v10/review.json` records inputs, file hashes, measurements, inspected states and review scope. Social SVG copies come from `Footer.tsx`'s custom marks and existing Lucide imports. The generated sites and full screenshot archive remain local review artifacts. Selected captures are retained in the [showcase](showcase.md), alongside the [frozen builder input](calibration/design-v10.md) and [review manifest](calibration/review-v10.json). The briefs and procedure below support reproduction. The published guide keeps the reviewed visual rules, with repository formatting and asset paths adapted for this shared repo.

## Akuma composition validation · 2026-09-29

Five fresh-context builders exercised three guide revisions. The final two builders independently produced a reading tool and a speaking-practice concept using the same frozen guide, original logo and font assets. They received the functional briefs below without Akuma source, reference screenshots, other generated implementations or previous review feedback. The final implementations were reviewed as generated; their visual styling was not patched by the reviewer.

The frozen version 3 guide reproduced the Sessatakuma brand frame, type hierarchy, work-surface geometry, instructional scale and footer identity across both workflows. Both briefs specified the same two-panel composition with a guide and large footer. This establishes repeatability of that composition; it does not establish layout flexibility across different product types. The current brand guide separates shared foundations from optional patterns, with the precise Akuma measurements retained in the layout reference.

Frozen guide SHA-256:

```text
41f4f57108ec6253dba6b3f2b1701dc73016f1fd7192551ce71f6e614876183e
```

### Visual checks

| Check                                                          | Reading                               | Speaking                              |
| -------------------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| Sage header/footer, warm gray canvas and white surfaces        | Pass                                  | Pass                                  |
| Loaded Noto Sans JP; 24px tool text; 64px header               | Pass                                  | Pass                                  |
| Desktop and stacked panel geometry against Akuma               | Pass                                  | Pass                                  |
| Open instructional rows and large demonstration graphics       | Pass                                  | Pass                                  |
| Original 96px footer bear, 16px contact and oversized wordmark | Pass, with breakpoint tolerance below | Pass, with breakpoint tolerance below |
| Empty, populated and focused tool states                       | Pass                                  | Pass                                  |
| Mobile horizontal fit and natural viewport scale               | Pass                                  | Pass                                  |

Both final builds and Akuma have the following measured empty-state geometry. Dimensions are CSS pixels. Desktop/tablet measurements include a 15px browser scrollbar; mobile emulation does not.

| Viewport    | Panel positions and size                            | Document client / scroll width | Viewport scale |
| ----------- | --------------------------------------------------- | ------------------------------ | -------------- |
| 1440 × 1000 | x=44.5 / 728.5, y=149; each 652 × 766; 24px corners | 1425 / 1425                    | 1              |
| 768 × 1024  | x=0, y=64 / 544; each 753 × 480; square corners     | 753 / 753                      | 1              |
| 390 × 844   | x=0, y=64 / 454; each 390 × 390; square corners     | 390 / 390                      | 1              |

The footer wordmark measures 216px at 1440px and 101.4px at 390px in all three sites. At exactly 768px the prototypes use the stacked mobile wordmark, while Akuma retains its single line until 767px. This one-pixel breakpoint tolerance was accepted for family resemblance; exact reproduction should follow the layout reference's “below 768px” footer rule. Guide wording, demonstration content and section heights also vary with the functional brief.

Screenshots cover the top, instructional sections and footer, including desktop and phone populated states, the reading export menu and speaking completion state. Mobile overflow was also checked with 12 lines of Japanese content in each tool. Both retained a 390px scroll width and viewport scale 1.

### Interaction checks

- Reading: example insertion, mixed reading/base alignment, accent toggle without baseline movement, copy success feedback, export-menu opening and Escape with restored focus, and deletion back to the empty state.
- Speaking: prompt insertion and synchronized preview, advancing timer, paused timer, reset, completion, repeat and deletion back to the empty state.
- Both: no console errors or warnings during the final mobile checks. The generated JavaScript also passed syntax checks.

Reading annotations use a small deterministic sample dictionary. Speaking is a local timer and script practice concept. Export file contents, production services, authentication, accessibility conformance and browsers beyond the reviewed Chromium session are outside this validation.

The local review index is `.build/design-calibration/index.html`. Final implementations are in `final-reading/` and `final-speaking/`; `evidence/review.json` records their file hashes, measurements, screenshots and review scope. Source screenshots remain review evidence and were excluded from builder context.

## Repeatable procedure

1. Freeze a copy of `design.md` and record its SHA-256.
2. Start each builder with a fresh context. Supply only that guide, Akuma's logo, Noto Sans JP assets, copies of its four social-service SVG marks, and a functional brief. Exclude Akuma implementation files, screenshots, other generated sites and prior review feedback. For a family-flexibility test, exclude the optional Akuma layout reference too.
3. Have the builder create a standalone local site with deterministic sample data and local interaction state. Keep generated prototypes outside production routes. Let it choose layout, navigation and density from the task.
4. Review at 1440 × 1000, 768 × 1024 and 390 × 844 CSS pixels. Wait for fonts and transitions to settle. Inspect representative sections and populated, empty, selected and focused states. Include narrow navigation, overlays or completion states where relevant.
5. Assess brand identity, task fit and content restraint separately. Measure the warm gray canvas and exact sage header/footer assignments. Inspect the full footer: four social-service marks in source order, current pending-account behavior, real GitHub/mail destinations, 16px contact address, original purpose paragraph and oversized two-part wordmark on wide/narrow screens. Test keyboard focus and contact fit. Confirm the footer ends at the document edge in short and empty states. Check each wordmark span fits horizontally as well as document overflow; a clipped container can conceal cropped lettering. Exercise the main controls. Inspect small labels, supporting lines, badges and icons in each reviewed state: retain distinct task information and remove decoration or repetition. Teaching content, progress, constraints and shared brand contact/purpose content must remain useful. Compare screenshots for family resemblance; compare coordinates only for an explicit pattern-reproduction brief.
6. When a rule needs clarification, derive the clarification from Akuma and update the guide. Give the new guide to a new builder. Do not repair a generated site's visual styling and count that as evidence that the guide worked.
7. For a family-flexibility test, use distinct structures such as a dense library, focused exercise, calendar, article and public page. Accept the tested set when all meet the shared brand, content-restraint and usability criteria and their structures suit their tasks. Keep the guide unchanged throughout the independent builds and reviews. Two versions of the same shell are insufficient evidence of broad flexibility.

This establishes repeatability for the tested workflows and viewports. It does not establish that every future product, language, content length or model will match without review.

## Composition brief A: reading

Build an AkuMa Japanese reading practice site with editable Japanese input, an insert-example action, a populated furigana/pitch preview using deterministic sample data, an accent toggle, a copy action and an export menu. Include an explanatory guide with three demonstration steps and the Sessatakuma footer. Start empty and use Traditional Chinese UI copy. Use standalone HTML/CSS/JavaScript without API calls, authentication, pricing or a promotion band. Take all visual decisions from the supplied design guide.

## Composition brief B: speaking

Build a conceptual Sessatakuma Japanese speaking-practice site with the compact product title “口說練習”. Use a two-panel workflow: editable Japanese practice script and an insert-prompt action on the left; the script with start/pause/reset timer controls and a completion action on the right. Completion should have a quiet visible state. Include a three-step explanatory guide and the Sessatakuma footer. Start empty, use Traditional Chinese UI copy and real sample Japanese sentences. Use standalone HTML/CSS/JavaScript with local state. Do not add API calls, microphone requests, authentication, simulated recording, statistics or pricing. Take all visual decisions from the supplied design guide.

## Family-flexibility briefs

All five use Traditional Chinese UI, realistic Japanese sample content, local state and standalone HTML/CSS/JavaScript. Each builder receives the same frozen family guide and original logo/font/social-mark assets. No builder receives the optional layout reference or another builder's output. Main actions must work at wide and narrow sizes; visual composition is the builder's choice within the guide.

| Product                           | Functional brief                                                                                                                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vocabulary library · 詞彙庫       | Manage at least 24 entries with Japanese text, readings, meanings, topics and study state. Search, filter by topic/state, sort, inspect details and mark studied. Include counts and zero-results behavior.                                                                        |
| Focused flashcards · 每日複習     | Review eight prompts one at a time; reveal reading, meaning and an example; mark remembered or needing practice. Show progress, completion, missed-word replay and full restart. Support a visible reveal shortcut.                                                                |
| Community schedule · 一起開口     | Browse October 2026 sample sessions in Asia/Taipei. Navigate dates, filter level, inspect topic/time/capacity and add/remove a session from a local plan. Include at least ten sessions, available and full states. No real booking.                                               |
| Lesson reader · 日語小課          | Read a substantial four-to-five-section lesson about everyday routines, with Chinese explanations, Japanese dialogues, contents navigation, reading-aid toggle, bookmark, quiz and completion.                                                                                     |
| Public course page · 開口的第一步 | Explain a clearly labeled conceptual conversation course: audience, outcomes, four weekly topics, sample activity and FAQs. Include a validated local-only interest form and confirmation. Disclose that data is not sent; make no invented launch, pricing or testimonial claims. |

## Evidence to retain

Record the frozen guide hash, reference commit, builder context boundaries, final site hashes, viewport measurements, inspected states, interaction results and screenshot paths. Keep the source reference available to the reviewer but outside builder context.

The local calibration workspace for this review is `.build/design-calibration/`. It contains the frozen guide, original logo and locally loaded font assets, independent prototypes, screenshots and a review index. These are local review artifacts, separate from the production app. The functional briefs and procedure above allow future fresh-context runs without relying on those generated implementations.
