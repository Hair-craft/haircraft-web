# Plan: Phase B9, edit profile (backend)

**Status: Approved (2026-10-06)** with the recommended options: no email changes in B9; own edits are audit-logged for everyone (`profile.updated`); backend only (the admin panel's edit form is a later follow-up).

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). The work is in `nestjs-haircraft`; it is what S9 (My account) needs to let customers change their details. B10–B12 were built alongside storefront phases; B9 is its own short phase, as the roadmap set out.

## Context

Customers and staff can read their own profile (`GET /profile`, `GET /admin/profile`) but can't change it. Today only staff can edit a customer's name and phone, from the admin panel (`PATCH /admin/customers/:id`).

**What already exists:**

- the `profile:update` permission ("Edit own profile and change own password"), given to customers and every staff role
- the same field rules in the admin's customer edit: first name required (up to 100 characters), last name optional, phone optional in international format (`+919876543210`), `null` or `""` removes an optional field
- the audit log and field-by-field change records, used by every staff edit
- `POST /auth/change-password` (S9 uses it as it is)

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **B9.1 `PATCH /profile`** (customers) and **`PATCH /admin/profile`** (staff):
   - the body has `firstName`, `lastName` and `phone`, all optional, with the same rules as the admin's customer edit (one shared DTO)
   - it returns the updated profile, exactly as the `GET` returns it
   - an empty body, or one that changes nothing, returns the profile unchanged
   - unknown fields are refused (`400`), as everywhere in the API; so is `email` (open question 1)
   - permission `profile:update`
   - a staff member who must change a temporary password can't use it until they have (as with every other admin action)
   - **records:** `updated_by` is set to the person themselves; changes are written to the audit log as `profile.updated`, with what changed (open question 2); the cached sign-in details are refreshed, as after a staff edit
2. **B9.2 Tests and docs:**
   - unit tests for the service
   - e2e tests:
     - customers and staff can edit and clear fields
     - validation (an empty first name, a bad phone, 101 characters, `email`)
     - each audience is refused on the other's route
     - unauthenticated requests get `401`
     - the audit entry is written
     - nothing changes on an empty body
     - a customer can't touch anyone else
   - Swagger descriptions, the backend README and `PROGRESS.md`

**Out of scope:**

- changing the email address (open question 1)
- the admin panel's own "edit my profile" screen (open question 3)
- the storefront screens (S9)

## Design

- **One service method** (`UsersService.updateProfile`), used by both controllers. It runs in a transaction, locks the user's row, compares old and new values, writes only what changed, and records the audit entry, in the same way as `CustomersService.update`.
- **The DTO** (`UpdateProfileDto`) moves the field rules out of `UpdateCustomerDto`, which then reuses it, so the two can't drift apart.
- **No new permission, table or migration.**

## Files

```
nestjs-haircraft/src/modules/users/dto/update-profile.dto.ts     new: the shared DTO
nestjs-haircraft/src/modules/users/users.service.ts              updateProfile
nestjs-haircraft/src/modules/profile/profile.controller.ts       PATCH on both controllers
nestjs-haircraft/src/modules/customers/dto/customers.dto.ts      UpdateCustomerDto reuses the rules
nestjs-haircraft/src/modules/users/users.service.spec.ts, test/profile.e2e-spec.ts
nestjs-haircraft/README.md, nestjs-haircraft/dev/PROGRESS.md
nextjs-haircraft/dev/status/…-phase-b9-…, nextjs-haircraft/dev/testing/…-phase-b9-…, nextjs-haircraft/dev/PROGRESS.md
```

## Testing

1. **Unit:**
   - only changed fields are written
   - audit entries are written only when something changed
   - the sign-in cache is refreshed
2. **e2e:** as listed in B9.2, against the test database; the full backend suite still passes (310 unit, 273 e2e today).
3. **QC guide:** steps in Swagger (`/api/docs`) for a customer and an admin.

## Risks

- **The storefront remembers the first name** (for "Hello, Priya") in a display cookie; S9 updates it after an edit. B9 itself changes nothing in the storefront.
- **Phone numbers are not unique** in the database, so two accounts can share one; that stays as it is (no change from registration).

## Open questions

1. **Changing the email address.** Recommended: **not in B9**: the email is the sign-in name and order contact, and changing it safely needs a confirmation email to the new address (no email service is set up yet). S9 shows it as read-only with "Contact us to change your email". The alternative is allowing it now with the current password as confirmation (no email check).
2. **Audit log for one's own edits.** Recommended: **yes, for everyone** (`profile.updated`, with old and new values): one rule for staff and customers, and it helps answer "who changed this phone number?". The alternative is staff only.
3. **The admin panel.** Recommended: **backend only now**; adding "Edit" to the admin panel's existing My profile page is a small follow-up you can ask for at any time. The alternative is adding it in this phase (one form in `angular-haircraft`, with its tests).
