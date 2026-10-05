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

| Date | Slug | Plan | Status | Testing | QC |
|---|---|---|---|---|---|
| 2026-10-05 | storefront-roadmap | [plan](plan/2026-10-05-storefront-roadmap.md) (draft, awaiting review) | — (tracked per phase) | — | — |
| 2026-10-05 | phase-s1-foundation | [plan](plan/2026-10-05-phase-s1-foundation.md) (draft, awaiting review) | — | — | — |
