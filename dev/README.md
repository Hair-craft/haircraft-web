# Development docs (storefront)

How the Hair Craft storefront is planned, tracked and quality-checked. These are the same rules as the backend (`../nestjs-haircraft/dev`) and the admin panel (`../angular-haircraft/dev`).

**Progress at a glance:** [PROGRESS.md](PROGRESS.md), which shows every phase and its small steps, test results and QC sign-off.

```
dev/
├── plan/      what we intend to build: written and approved BEFORE any code
├── status/    what was actually built: written AFTER implementation
└── testing/   step-by-step manual QC guide: written AFTER implementation
```

## Lifecycle of one phase

1. **Plan:** `plan/<yyyy-mm-dd>-<slug>.md`. It is reviewed by the owner. **No code until it is marked _Approved_.**
2. **Implementation:** the developer self-tests along the way: typecheck, lint, build, unit tests, Playwright, and a screenshot click-through.
3. **Status:** `status/<yyyy-mm-dd>-<slug>.md` records what was built, deviations and why, issues fixed, verification results and limitations.
4. **Testing:** `testing/<yyyy-mm-dd>-<slug>.md` is a click-by-click guide for QC: what to open, what to do, what correct looks like, and a results table. QC never needs to read code.
5. **Tracking:** tick the phase's steps in `PROGRESS.md` and add the results.

**A phase is done only when all three documents exist and QC has signed off.**

## Naming

`<yyyy-mm-dd>` is the date the plan was first written; the status and testing files reuse it. Storefront phases are `phase-s<n>-<slug>`, e.g. `plan/2026-10-05-phase-s1-foundation.md`.

## Index

| Date       | Slug                        | Plan                                                     | Status                                                     | Testing                                                      | QC      |
| ---------- | --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| 2026-10-05 | storefront-roadmap          | [plan](plan/2026-10-05-storefront-roadmap.md) (approved) | — (tracked per phase)                                      | —                                                            | —       |
| 2026-10-05 | phase-s1-foundation         | [plan](plan/2026-10-05-phase-s1-foundation.md)           | [status](status/2026-10-05-phase-s1-foundation.md)         | [testing](testing/2026-10-05-phase-s1-foundation.md)         | Pending |
| 2026-10-05 | phase-s2-home-page          | [plan](plan/2026-10-05-phase-s2-home-page.md)            | [status](status/2026-10-05-phase-s2-home-page.md)          | [testing](testing/2026-10-05-phase-s2-home-page.md)          | Pending |
| 2026-10-05 | phase-s2b-home-redesign     | [plan](plan/2026-10-05-phase-s2b-home-redesign.md)       | [status](status/2026-10-05-phase-s2b-home-redesign.md)     | [testing](testing/2026-10-05-phase-s2b-home-redesign.md)     | Pending |
| 2026-10-06 | phase-s3-product-listing    | [plan](plan/2026-10-06-phase-s3-product-listing.md)      | [status](status/2026-10-06-phase-s3-product-listing.md)    | [testing](testing/2026-10-06-phase-s3-product-listing.md)    | Pending |
| 2026-10-06 | phase-s4-search             | [plan](plan/2026-10-06-phase-s4-search.md)               | [status](status/2026-10-06-phase-s4-search.md)             | [testing](testing/2026-10-06-phase-s4-search.md)             | Pending |
| 2026-10-06 | phase-s5-product-page       | [plan](plan/2026-10-06-phase-s5-product-page.md)         | [status](status/2026-10-06-phase-s5-product-page.md)       | [testing](testing/2026-10-06-phase-s5-product-page.md)       | Pending |
| 2026-10-06 | phase-s6-sign-in            | [plan](plan/2026-10-06-phase-s6-sign-in.md)              | [status](status/2026-10-06-phase-s6-sign-in.md)            | [testing](testing/2026-10-06-phase-s6-sign-in.md)            | Pending |
| 2026-10-06 | phase-s7-cart               | [plan](plan/2026-10-06-phase-s7-cart.md)                 | [status](status/2026-10-06-phase-s7-cart.md)               | [testing](testing/2026-10-06-phase-s7-cart.md)               | Pending |
| 2026-10-06 | phase-s8-wishlist           | [plan](plan/2026-10-06-phase-s8-wishlist.md)             | [status](status/2026-10-06-phase-s8-wishlist.md)           | [testing](testing/2026-10-06-phase-s8-wishlist.md)           | Pending |
| 2026-10-06 | phase-b9-edit-profile       | [plan](plan/2026-10-06-phase-b9-edit-profile.md)         | [status](status/2026-10-06-phase-b9-edit-profile.md)       | [testing](testing/2026-10-06-phase-b9-edit-profile.md)       | Pending |
| 2026-10-07 | phase-s9-my-account         | [plan](plan/2026-10-07-phase-s9-my-account.md)           | [status](status/2026-10-07-phase-s9-my-account.md)         | [testing](testing/2026-10-07-phase-s9-my-account.md)         | Pending |
| 2026-10-07 | phase-s10-checkout          | [plan](plan/2026-10-07-phase-s10-checkout.md)            | [status](status/2026-10-07-phase-s10-checkout.md)          | [testing](testing/2026-10-07-phase-s10-checkout.md)          | Pending |
| 2026-10-07 | phase-s11-payment           | [plan](plan/2026-10-07-phase-s11-payment.md)             | [status](status/2026-10-07-phase-s11-payment.md)           | [testing](testing/2026-10-07-phase-s11-payment.md)           | Pending |
| 2026-10-07 | phase-s12-my-orders         | [plan](plan/2026-10-07-phase-s12-my-orders.md)           | [status](status/2026-10-07-phase-s12-my-orders.md)         | [testing](testing/2026-10-07-phase-s12-my-orders.md)         | Pending |
| 2026-10-07 | phase-s13-reviews           | [plan](plan/2026-10-07-phase-s13-reviews.md)             | [status](status/2026-10-07-phase-s13-reviews.md)           | [testing](testing/2026-10-07-phase-s13-reviews.md)           | Pending |
| 2026-10-07 | phase-s13b-review-photos    | [plan](plan/2026-10-07-phase-s13b-review-photos.md)      | [status](status/2026-10-07-phase-s13b-review-photos.md)    | [testing](testing/2026-10-07-phase-s13b-review-photos.md)    | Pending |
| 2026-10-07 | phase-s14-information-pages | [plan](plan/2026-10-07-phase-s14-information-pages.md)   | [status](status/2026-10-07-phase-s14-information-pages.md) | [testing](testing/2026-10-07-phase-s14-information-pages.md) | Pending |
| 2026-10-07 | phase-s15-seo-performance   | [plan](plan/2026-10-07-phase-s15-seo-performance.md)     | [status](status/2026-10-07-phase-s15-seo-performance.md)   | [testing](testing/2026-10-07-phase-s15-seo-performance.md)   | Pending |
