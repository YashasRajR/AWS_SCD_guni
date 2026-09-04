# Phase 6 — UI/UX, Responsive Design & Accessibility Report

**Date:** 2026-09-04. Method: a read-only agent audit traced the actual CSS/component state of all three apps (design tokens, component inventory, responsive breakpoints, accessibility baseline, forms, motion, images, contrast values, touch targets, overflow risk) with file:line citations, then concrete fixes were made for the findings that were real, bounded, and verifiable without a browser. This phase's scope (the full checklist in the phase document) is far larger than what a single pass without visual/browser verification can responsibly claim as "done" — see section J for what's explicitly deferred and why.

## A. Design system

**Before this phase**, all three apps used AWS-orange (#ff9900/#16222f/#1a56b0) rather than the brief's purple palette, in three independently-drifting token files (web had a genuine 140-line token system; admin/volunteer each had ~15 flat tokens with their own `--radius` values, 8px vs 12px).

**Fixed this phase** — palette swapped to the brief's guidance across all three apps' existing token files (not consolidated into one shared file — see J):
- `--primary` / `--brand`: `#50377a` (was `#ff9900`)
- `--primary-hover` / `--brand-dark`: `#3f2b61` (was `#cc7a00`)
- `--secondary` (web): `#332052` (was `#16222f`)
- `--background` (web, light): `#f8f6fc` (was `#f6f7f9`)
- `--accent` (web): `#f28a45` — kept **decorative-only** (border accents, badges), not used for body text/links

**Deliberate deviation from the brief, and why**: the brief's accent orange (#F28A45) fails WCAG AA contrast as text on a light background (~2.6:1, needs 4.5:1) — this is the exact mistake phase rule 46 explicitly warns against ("do not use ... orange text on unsuitable backgrounds"). Rather than use it for links/`.btn-link` text, a new `--link` token was added (`#50377a` light / `#b39dda` dark — purple, not orange, chosen for contrast) and web's `a`/`.btn-link` rules now point to `--link` instead of `--accent`. `--accent` itself stays pure orange, used only where WCAG's more lenient 3:1 non-text threshold applies (a decorative `border-left-color`).

**Also fixed — a real contrast bug the swap itself would have introduced**: admin/volunteer's `.btn-primary`/`.sidebar-brand-mark`/`.nav-link-active`/`.topbar-mark` all pair the brand color with hardcoded `color: #1a1d23` (dark text) — correct for orange, but unreadable on the new dark purple. Flipped to `#ffffff` at all 5 sites. Separately, both apps' dark-mode themes previously reused the *same* `--brand-dark` value for two different jobs (button hover fill, and unpaired text-on-page-background in `.btn-link`/`.bottom-nav-link.active`) — the light-mode dark-purple value is unreadable as text on a near-black dark-mode page, so each app's dark-mode block now overrides `--brand-dark` to a lighter `#b39dda` specifically for that text usage.

**Typography, spacing, radius, shadows**: unchanged this phase — web's existing scale (fluid `clamp()` type, 4px spacing base, sm/md/lg/full radius, 3-tier shadow) was already solid and needed no rework; admin/volunteer still don't have one (see J).

**Component system**: `packages/ui` was found to be a single-export stub (`Button.tsx`, explicitly commented as a placeholder) with **zero consumers** in any app — not touched this phase (see J for the decision).

## B. Public web — fixed this phase

- Global link color and `.btn-link` now use the new `--link` token (purple) instead of orange-on-white.
- Registration CTA gradient/hover colors updated from orange tones to purple tones (`index.css`, the `.registration-cta` block).
- Razorpay checkout widget's `theme.color` updated from `#FF9900` to `#50377A` to match the new brand color in the one place a third-party widget renders brand-colored UI.

No page-by-page visual rebuild was attempted this phase (hero, speaker grid, agenda, timeline, venues, FAQ, etc. all already existed with real responsive CSS from Phase 5's work — the audit found web's 14 real `@media` breakpoints, fluid typography, and an accessible `Accordion` component already in place). This phase's actual highest-value web work was the palette correction above; the individual page layouts were not found to have structural gaps worth non-visually-verified rework.

## C. Attendee experience

Dashboard/profile/certificates/achievements/Event Wrapped/payment screens (built in Phase 5) inherit the palette fix automatically via CSS variables — no per-page changes were needed or made.

## D. Volunteer experience — fixed this phase

- **Touch targets**: `.btn` and `.btn-icon` bumped to real `min-height: 44px` (previously ~30px and ~24px respectively) — the audit's top-priority finding, since this is the app used standing up, mid-checkin, on a phone.
- **Focus-visible ring** added (previously none at all — browser default only, inconsistent/invisible depending on OS theme).
- **Attendee search input** (`CheckInPage.tsx`) previously had no `<label>`, relying solely on a placeholder (a real, common a11y bug — placeholder text disappears once typing starts and isn't reliably exposed as a label by every screen reader). Added a visually-hidden `<label htmlFor>` and a matching `id` on the input.

> **Attendance remains manual/authenticated and does not use QR or NFC.** Re-confirmed this phase (see F).

## E. Admin experience — fixed this phase

- **Modal** (`components/Modal.tsx`) — the only modal/dialog component in the entire codebase, used by every admin CRUD create/edit flow. Previously: Escape-to-close only, no `role="dialog"`/`aria-modal`, no focus trap, no initial focus, no focus restoration on close (a real keyboard-trap-adjacent bug — a Tab press could move focus into the page behind the modal). Rewritten with: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the title, focus moved into the dialog on open, Tab/Shift+Tab cycling kept inside the dialog while open, and focus restored to whatever element triggered the modal once it closes.
- **Touch targets**: `.btn` bumped to `min-height: 44px`, `.btn-icon` to 36×36px (a deliberately smaller floor than the 44px used elsewhere — admin is explicitly "dense, efficient, data-focused" per the phase's own §52 content-density guidance, and `.btn-icon` is used for compact inline table-row actions where 44px would break density; 36px is a middle ground, not the full target).
- **Focus-visible ring** added (previously none at all, same gap as volunteer).
- **Responsive**: previously **zero** layout breakpoints (`@media` was dark-mode-only) despite a fixed 240px sidebar that would eat most of a tablet-width viewport. Added a `max-width: 900px` breakpoint that collapses the sidebar from a left column into a horizontally-scrollable top bar — a CSS-only fix (no new component state), chosen over a full off-canvas hamburger drawer because that would require new interactive state in `AdminLayout.tsx` that can't be interactively verified from this environment (no browser here — see I).

## F. No QR/NFC — re-confirmed

Re-ran the grep sweep required by phase rule 63 across `apps/web`, `apps/volunteer`, `apps/admin`, `packages/*` for `qr|qrcode|nfc|scanner|barcode|camera attendance` (case-insensitive): **zero matches**, consistent with the Phase 5 audit. The volunteer attendance flow remains exactly `Search attendee → Verify attendee → Select activity → Record attendance`, unchanged.

## G. No fake data — re-confirmed

No changes this phase touched any data-fetching or stat-display logic; the Phase 5 audit's "zero fake/mock/hardcoded-stat" finding stands unchanged (this phase was CSS/accessibility/component-behavior only, not data wiring).

## H. Responsive verification

**Not interactively verified at the 9 target widths (320/375/390/414/768/1024/1280/1440/1920)** — this bridge has no browser, so nothing here was resized and visually inspected. What can honestly be claimed: web's existing `@media` rules (min-width 640/768/900/1024, fluid `clamp()` type) were already authored mobile-first per the Phase 5-era audit and are unchanged; admin now has one new breakpoint (900px, see E) that was traced by reading the resulting CSS rules for internal consistency (flex-direction/overflow logic checked by hand), not by rendering it. **This is the single biggest verification gap in this phase** and is flagged as Blocking in section J.

## I. Accessibility

**Automated tooling (axe/Lighthouse) could not be run** — no browser available from this device bridge, and this repo doesn't have an existing axe/Lighthouth CI integration to trigger headlessly without one. What was verified by direct code inspection instead (no tool run, human/agent reading of the actual DOM the code produces):

- Modal: focus trap, initial focus, and focus restoration implemented and traced through (see E) — not exercised in a real DOM.
- Accordion (web, pre-existing): confirmed still correct — real `<button>` trigger, `aria-expanded`/`aria-controls`, `role="region"`, `aria-hidden` panel.
- Focus-visible ring: now present in all three apps (web already had one; admin/volunteer previously had none, both fixed this phase).
- Forms: label association confirmed correct in login/register (web) and admin's `ResourceForm` (real `htmlFor`/`id` pairing) and now also volunteer's search input (fixed this phase). **Not fixed this phase**: none of the three apps associate a submit error message with its field via `aria-describedby`, or mark the error region `role="alert"`/`aria-live` — a screen reader user isn't proactively notified when a form submission fails. This exists in every form across all three apps (not a handful of isolated spots), so a safe sweep wasn't attempted without the ability to verify each site renders correctly afterward; flagged as High in J.
- Reduced motion: web already had a global `prefers-reduced-motion: reduce` rule collapsing all animation/transition durations — unchanged, still correct. admin/volunteer have no animations to guard (confirmed by the audit — zero `@keyframes`/`transition` rules in either).
- Contrast: the new palette's hardcoded pairings were chosen deliberately for AA (white text on `#50377a` primary ≈ 5.2:1 estimated; the new `--link` values were chosen specifically to fix the orange-text failure the brief's literal accent color would have caused — see A). **These are estimated, not measured with a contrast-checking tool** — no such tool was run this phase. Flagged in J as needing a real automated contrast check.

## J. Tests

```
typecheck:    PASS (npm run typecheck --workspaces --if-present, clean, all 13 packages)
lint:         PASS (npx eslint . --max-warnings=0, clean, 0 errors/warnings)
unit:         NOT RUN (same standing limitation as every prior phase)
integration:  NOT RUN
E2E:          NOT RUN — none exist in this repo yet, and couldn't be authored/verified without a browser this phase anyway
accessibility (axe/Lighthouse): NOT RUN — no browser available from this bridge
build:        NOT RUN
```

**Could not run** (same disclosed, unchanged limitation as every phase this session): `npm test`, `npm run build`, `npm run db:migrate` — this device bridge's `node_modules` was installed on Windows and is missing Linux-native binaries (`@rollup/rollup-linux-x64-gnu`) that `vitest`/`tsup` need; `npm install` has been deliberately avoided all session to not corrupt the real dev environment. **Unique to this phase**: there is also no browser reachable from this bridge, which matters far more here than in prior backend-focused phases — every claim in sections E/H/I above about how the new CSS actually *renders* (the admin sidebar collapse, the modal focus trap, contrast ratios, all 9 target widths) is based on reading the code, not seeing it. Please run `npm run dev` for all three apps locally and visually walk them, especially the new admin responsive breakpoint and the modal's keyboard behavior, before treating this phase as verified.

## Remaining issues

**Critical**
- None found that are also fixable-with-confidence from this environment. (The localStorage token-storage finding from Phase 4/5 remains open but is an auth/security item, not a UI/UX one — tracked there, not re-litigated here.)

**High**
- **Nothing in this phase has been seen in a real browser.** The palette swap, the admin responsive breakpoint, and the modal focus trap are all code-traced, not rendered. This is the top priority before calling Phase 6 done.
- Form submission errors aren't announced to screen readers anywhere in the codebase (no `role="alert"`/`aria-live`, no `aria-describedby` linking the error to its field) — present in every form in all three apps, not fixed this phase because a blind find-and-replace across ~10+ form sites without visual verification risked introducing broken markup with no way to catch it.
- Contrast ratios for the new palette are estimated, not measured with an actual contrast-checking tool.

**Medium**
- `packages/ui` remains a single-export, zero-consumer stub. Phase 6's own checklist (§4) calls for a real shared component system; this phase did not attempt to build one out or delete the stub, because doing so risks either (a) a large surface-area change with no visual verification, or (b) removing a package other in-flight work might reference. Needs an explicit decision: build it out for real, or delete it.
- No Toast/Tooltip/Tabs component exists in any app — every app currently surfaces transient state via inline text with no consistent pattern. Not addressed this phase.
- volunteer/admin still have no shared typography/spacing/radius/shadow token scale (only color tokens exist) — web's scale was not ported over.
- Individual page-level "polish" called for across the phase 6 checklist (homepage hero refinement, speaker/session/agenda/timeline/venue/FAQ visual treatment, ticket/certificate "premium" presentation, admin table responsive card-view on mobile, etc.) was **not attempted** this pass — the audit found these pages already functionally responsive and accessible-baseline-correct from Phase 5's work, and further visual refinement without the ability to see the result risks making things worse, not better, with no way to catch a regression.

**Low**
- admin's `.btn-icon` sits at 36px, short of the full 44px target, as a deliberate density trade-off (see E) — worth revisiting if user feedback says it's too small in practice.
- Long-content robustness (long speaker names, long session titles, etc.), localization/timezone-formatting review, and image lazy-loading/layout-shift review were all covered by the audit's read-only pass (each found to already be handled correctly or a non-issue — e.g. the one `<img>` in the codebase already has `alt`+`loading="lazy"`+fixed dimensions) but no changes were needed or made.

**Future polish**
- A genuine cross-app shared component library (Button/Input/Modal/Table/etc. consolidated once, not reimplemented per-app) — the natural next step once `packages/ui`'s fate (above) is decided.
- A real admin off-canvas mobile navigation (hamburger + drawer) instead of the horizontal-scroll top bar this phase shipped as the minimal safe fix.
- Automated accessibility testing (axe or Lighthouse CI) wired into the repo so future phases don't have to rely on manual code-tracing the way this one did.
