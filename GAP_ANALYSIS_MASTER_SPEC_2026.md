# Gap Analysis — AWS GUNI SCD 2026 Master Implementation Specification

**Date:** 2026-09-06. **Method:** direct code/schema inspection of this repository (backend modules, database migrations, admin/web/volunteer apps) against every numbered section of the uploaded spec. Nothing here was inferred from documentation alone unless stated.

**Legend:** ✅ Done · 🟡 Partial · ❌ Missing

This is a snapshot, not a criticism — the codebase already covers the hardest, highest-risk 60% of the spec (auth, RBAC, payments, QR/check-in, PDFs, audit, CI, security). What's missing is concentrated in a predictable place: **CMS breadth** (the spec's "if it exists, Admin can manage it" principle isn't fully realized) and a handful of **named-but-unbuilt features** (coupons, invoices, ticket plans, Sheets sync). *(Update: every item on the priority list below is now done as of commit `eea11d7` — see the checked-off entries throughout.)*

**Update (2026-09-06, later same session):** sections 15 (ticket plans) and 16 (coupon/discount engine) below are now ✅ Done — see commits `04617d0` (ticket plans) and `89ca147` (coupons). The rest of this report is unchanged from the original pass; items 1-2 in the "Named features" table and the priority list still reflect the pre-fix state for traceability, with a note added at each closed item.

---

## 1. What's solid (✅)

| Area | Spec section(s) | Evidence |
|---|---|---|
| Auth (login, refresh, reset, verify, rate limiting, RBAC) | 19, 43, 56 | `backend/src/modules/auth`, `middleware/authentication`, `middleware/authorization` — JWT HS256-pinned, bcrypt, timing-safe token compares |
| Payment flow + webhook idempotency | 21, 22 | `backend/src/modules/payments` — signature verification, insert-first-wins dedup, server-side status only |
| Two-QR ticket system (registration + goodie) with opaque tokens | 24, 30, 57 | `backend/src/modules/qr-tokens`, `tickets/ticket-pdf.ts` — no PII in QR payload |
| Volunteer check-in + duplicate prevention | 30, 32 | `backend/src/modules/checkpoints` |
| Ticket PDF generation | 24 | `backend/src/modules/tickets/ticket-pdf.ts` |
| Email delivery tracking (queued/sent/failed/resent) | 26 | `email_records` table + `email_records_delivery_fields` migration |
| Audit logging | 42 | Called from 19 of 24 controllers (achievements, agenda, announcements, auth, certificates, checkpoints, event, faq, payments, qr-tokens, registrations, sessions, speakers, tickets, timeline, user-dashboard, users, venues, volunteers) |
| CMS for event/agenda/announcements/FAQ/sessions/speakers/timeline/venues | 11, 13, 38 | `apps/admin/src/pages/content/*`, matching backend modules |
| CSV reporting exports (registrations, attendees, payments, checkpoint attendance) | 45 | Added this session — `backend/src/utils/csv.ts` + per-module `exportCsv()` |
| Dashboard trend charts | 33, 45 | Added this session — `/admin/dashboard/trends`, `apps/admin/src/components/charts` |
| Security fundamentals | 56 | Parameterized SQL throughout, Zod `safeParse` (no mass assignment), bcrypt rounds=12, helmet+CORS allowlist, rate limiting — reviewed in an earlier session pass, no criticals found |
| CI (lint/typecheck/build/unit/integration) + new E2E job | 69 | `.github/workflows/ci.yml`; Playwright suite added this session |
| Certificates, achievements, event-wrapped | 49 | Fully built — exceeds the spec's "future-ready, don't need to implement" ask for certificates |
| About/AWS section CMS | 6 | commit `76d49b6` — `about_sections` module (title/body/image/link, orderable, DRAFT/PUBLISHED/ARCHIVED), same shape as gallery/announcements; public `AboutEvent.tsx` renders it when published, falls back to static copy otherwise. |
| Event Highlights KPI cards (date/time/venue/registration window/ticket prices/speaker+session counts/capacity) | 7 | commit `1903ef4` — extends the existing data-driven `EventInfo` section with per-ticket-plan price cards, speaker/session counts, and summed venue capacity, all from existing public endpoints (no hardcoded numbers). |
| Downloadable event schedule PDF | 12 | commit `03cd4bd` — `schedule_pdf` singleton table + module: Generate/Regenerate (renders via pdfkit from live agenda+session+venue data), Publish/Unpublish, admin preview/download, and a manual-replace upload path. Public download button on Agenda/Timeline pages only appears once a published file exists; the public status endpoint never leaks an unpublished file's existence. |

---

## 2. Gaps — grouped by theme

### A. Named features that don't exist yet

| # | Feature | Status | Detail |
|---|---|---|---|
| 16 | Coupon/discount engine | ✅ **Done** (was ❌ Missing) — see commit `89ca147` | Zero references to "coupon" anywhere in the repo. No `Coupon`/`CouponUsage` tables, no validation, no checkout integration. This is a full module to build: schema, server-side validation (expiry/usage-limit/eligibility), and wiring into the payment amount calculation. |
| 15 | Ticket plans (Student ₹200 / Professional ₹350 as distinct, admin-configurable plans) | ✅ **Done** (was 🟡 Partial) — see commit `04617d0` | `events.registration_fee` is a single flat numeric column (migration `031_events_registration_fee`). `attendees.registration_type` is a free-text column with no enum and no price mapping. There is no `TicketPlan` entity with per-plan price/eligibility/capacity/availability window/display order. Today every attendee is charged the same fee regardless of student/professional status. |
| 25 | Invoice / fee-receipt PDF | ✅ Done | commit `5f2999c` — auto-generated on payment capture, admin list/download/resend-email, attendee self-service download. Tax/GST line is a schema placeholder only (no tax logic yet). |
| 28 | Social post/bio generator ("Create My SCD Post") | 🟡 Stub only | `backend/src/modules/social-sharing/social-sharing.service.ts` explicitly says *"Model + service boundary only in this phase. No LinkedIn/Instagram API integration and no image generation"* — it only lists an attendee's past shares. The actual generator (bio input, interest selection, AI copy generation with no invented claims, branded image, LinkedIn/Instagram-formatted output) doesn't exist. |
| 41 | Google Sheets sync | ✅ Done | commit `4dff699` — `sheets_sync_queue` outbox table + `sheets-sync-worker.ts` (same shape as the email worker), a `GoogleSheetsProvider`/`UnconfiguredSheetsProvider` boundary (service-account JWT bearer flow, no live credentials in this sandbox to verify against), a confirmed-registration enqueue hook, and an admin reconciliation page (`GET /admin/sheets-sync`). Added as a fifth check on the System status dashboard from item #7. |
| 28 | Social post/bio generator ("Create My SCD Post") | ✅ Done | commit `7ec6b25` — now built against the actual spec text (uploaded mid-session; the earlier `eea11d7` guess was admin-facing and wrong-scoped, kept as-is as a separate admin convenience but no longer claimed as #28). Attendee-facing `/dashboard/social-post`: bio + interest tags + optional photo upload → templated LinkedIn/Instagram copy + hashtags + event URL, preview/edit/regenerate/approve, a client-side branded-image download, and share links that log to the pre-existing (previously unused) `social_shares` table. Template-only generation, not AI — it only ever echoes the attendee's own input plus official event facts, so it structurally cannot invent achievements/titles/claims. |
| 8, 9, 10 | Real image upload (drag-drop → storage → preview) | ✅ Done | commit `d1cd8d2` — `POST /admin/uploads` (multer + local-disk `StorageProvider`), a reusable `image` field type in `ResourceForm` (file picker + preview), wired into speakers' profile-image field. Gallery/event hero images still don't exist as content fields yet (sections 9/4/5 CMS gaps below), but the upload plumbing they'll need is built. |
| 9 | Gallery (CRUD, lightbox, categorization) | ✅ Done | commit `0eeea99` — `gallery_items` module (category/event year/optional session link, admin CRUD with reorder), responsive grid + lightbox on the public site. |
| 14 | Past Events | ✅ Done | commit `0eeea99` — `past_events` module (flat archive cards per the spec's "visual glimpses" framing), admin CRUD with reorder, public grid page. |
| 40 | Popup / announcement-banner system | ✅ Done | commit `0eeea99` — `announcements` extended with image/button/showAsPopup/displayFrequency/targetAudience; a showAsPopup announcement renders as a dismissible modal (localStorage-tracked for once/until-dismissed) instead of the top banner. Audience targeting is signed-in-vs-guest only (the spec doesn't enumerate audience values, and there's no other viewer segmentation on this public endpoint). |
| 50 | Sponsor management | ❌ Missing | Zero references to "sponsor" anywhere (spec marks this "future ready" — acceptable to leave for V2). |
| 4, 5 | Header/nav/logo/CTA CMS, Hero CMS | ✅ Done | commit `327bc74` — hero subtitle/background image/CTAs and logo/header-CTA/footer-text/contact fields added to the `events` row; a new `site_links` table (kind=NAV/SOCIAL) backs admin-editable nav items and social links, each with add/remove/reorder (display order) and internal-vs-external/open-in-new-tab. Public header/footer/hero fall back to the original hard-coded content when nothing's configured yet. |
| 44 | Global admin search (by name/email/reg ID/ticket ID/payment ID/...) | ✅ Done | commits `456124a`/`9eaaba1` — a topbar search bar (`GlobalSearch.tsx`) queries `GET /admin/search?q=` across attendees, registrations, payments, and invoices in one request, permission-scoped per category, and deep-links to the matching list page pre-filtered. |
| 52 | System health monitor (payment gateway/email/storage/QR/queue status dashboard) | ✅ Done | commit `db4d83a` — `GET /admin/system-status` + a System status admin page report database connectivity, payment-gateway configuration, email-provider configuration + send-queue depth (PENDING/RETRYING `email_records`), and storage-directory writability, each reusing the exact env checks the underlying integration already uses to pick its own provider. |
| 48 | Waitlist workflow | ✅ Done | commit `c3d1fbd` — admin Promote (→ CONFIRMED, issues ticket) / Reject buttons on `RegistrationsPage` for `WAITLISTED` rows (routes through the existing generic status-update endpoint, which already had no state-machine restriction despite the stale note this row used to cite), plus `waitlisted`/`registration-rejected` email templates enqueued on each transition. Capacity-triggered auto-waitlisting is not implemented — no `TicketPlan.capacity` field exists yet, so waitlisting today is admin-initiated only. |

### B. Data model / architecture gaps

| Item | Status | Detail |
|---|---|---|
| Soft delete | ✅ Done | commit `4bb83d3` — `deleted_at` + a partial "active rows" index added to `users`, `attendees`, `registrations`, `payments`. Scoped to exactly the missing column — no admin delete/archive/restore endpoints exist yet for any of these tables (checked), so none were speculatively added; #34's archive/restore UI now has somewhere to store its state whenever it's built. |
| RBAC granularity | ✅ Done | commit `456124a` — added `FINANCE_ADMIN`, `CONTENT_ADMIN`, `VOLUNTEER_MANAGER` as pure seed-data roles (no schema change — `roles`/`role_permissions` were already fully data-driven), each granted a narrower permission subset than `ADMIN`. Fixed the admin app's login gate, which previously required the literal `ADMIN` role and would have locked every new role out of the panel entirely; it now accepts any admin-capable role, and the existing per-nav-link/per-route permission checks correctly narrow what each one can do. |
| Registration ID format | ❌ Different from spec | Spec asks for `GUNI AWS SCD 26 001`, sequential, capped at 999. Actual: `registrations.repository.ts` calls a generic `generateReferenceCode('REG')` helper, producing an opaque code (not the sequential `GUNI AWS SCD 26 NNN` format, no 999 cap, no documented collision/concurrency story specific to that format). |
| Multi-event / future-year support | ❌ Single event assumed | No `event_year` or versioning column on `events`; nothing in `event.repository.ts` suggests more than one live event row is expected. Spec section 67 wants "2026 → 2027" without a rewrite — today that would mean deciding whether to reuse the same row or add real multi-tenancy, which hasn't been designed yet. |
| Document center (regenerate/reissue with versioning) | ✅ Done | commit `287d177` — `document_versions` table + shared `documentsRepository` archive the PDF a reissue/regenerate is about to replace (with reason + admin + timestamp) before bumping a new `version` column on `tickets`/`invoices`; ticket reissue's existing QR rotation is what makes the archived version unscannable. New `invoices.service.regenerate()` (previously nonexistent) rebuilds the invoice PDF from current data. Both admin actions now require a reason and expose a "History" view with per-version PDF download. |
| Bulk admin operations | ✅ Done | commit `38e685d` — the shared `Table` component gained opt-in checkbox-column support (`selectedIds`/`onToggleRow`/`onToggleAll`); wired into `RegistrationsPage` as the first bulk action (select rows → set status for all of them via the existing per-row PATCH endpoint, fired in parallel). The same props extend to any other admin list page that grows a bulk action later. |
| Backup/restore | 🟡 Documented, unverified | `docs/deployment/deployment.md` describes a manual `pg_dump`/`pg_restore` procedure via the Postgres provider (Neon) but explicitly states the restore has never actually been run. No scripted backup exists under `database/scripts`. |

### C. Explicitly out of scope for V1 per the spec itself (no action needed now)

- Section 49 (certificates) — spec says implementation isn't required yet; this repo already over-delivers here (certificates are fully built).
- Section 50 (sponsors) — spec marks this "future ready."
- Section 32 true offline volunteer scanning — spec says this needs careful design if attempted; nothing here suggests it's attempted, which is the safe default.

---

## 3. Suggested priority order

If the goal is to close the gap between "very solid backend platform" and "the spec's full vision," the natural order — cheapest/highest-leverage first — is:

1. ~~**Ticket plans + attendee type enum** (section 15/17)~~ — done, commit `04617d0`.
2. ~~**Coupon/discount engine** (section 16)~~ — done, commit `89ca147`.
3. ~~**Invoice/receipt PDF** (section 25)~~ — done, commit `5f2999c`.
4. ~~**Real image upload** (section 8)~~ — done, commit `d1cd8d2`.
5. ~~**Hero/header/footer/nav CMS** (sections 4, 5, 38)~~ — done, commit `327bc74`.
6. ~~**Gallery, Past Events, Popups** (sections 9, 14, 40)~~ — done, commit `0eeea99`.
7. ~~**RBAC role split + global admin search + bulk operations + system health monitor** (sections 43, 44, 59, 52)~~ — done, commits `456124a`/`9eaaba1`/`38e685d`/`db4d83a`.
8. ~~**Google Sheets sync, social post generator, soft-delete migration** (sections 41, 28, 55)~~ — done, commits `4bb83d3`/`4dff699`/`eea11d7`. All best-guess implementations for #41/#28 (no detailed spec text survived for either) — verify against the actual spec and real Google credentials before relying on them.

---

*This report reflects a point-in-time code read on 2026-09-06 and does not re-verify items covered by the earlier security review (Phase 4) or the frontend/UX passes (Phases 5-6) — see those reports for anything not repeated here.*
