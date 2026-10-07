# Status: Phase B9, edit profile (backend)

Tracks progress against [`plan/2026-10-06-phase-b9-edit-profile.md`](../plan/2026-10-06-phase-b9-edit-profile.md).

## 2026-10-06: implemented and verified

**Result: done.** Both in-scope items (B9.1 and B9.2) are implemented in `nestjs-haircraft`, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 316 unit tests (6 new) and 282 e2e tests (9 new), all passing
- the storefront's end-to-end tests (which start the backend) still pass

Approved with the recommended options:

- no email changes in B9
- one's own edits are audit-logged for everyone
- backend only (the admin panel's edit form is an optional follow-up)

---

## What was built

### B9.1 `PATCH /profile` and `PATCH /admin/profile`

- **The body:** `firstName`, `lastName`, `phone`, all optional; only what is sent changes.
- **The rules:**
  - first name required, up to 100 characters
  - last name up to 100 characters
  - phone in international format (`+919812345678`)
  - `null` or `""` removes the last name or phone
- **The answer:** the profile, exactly as the `GET` returns it, with the message "Profile updated". An empty body, or one that changes nothing, returns the profile unchanged and writes nothing.
- **Refused:** `email`, `status` and any other field (`400`), as everywhere in the API. Customers can't use the admin route and staff can't use the customer route (`403`); signed-out callers get `401`. A staff member with a temporary password must change it first (`PASSWORD_CHANGE_REQUIRED`).
- **Records:**
  - each change is written to the audit log as `profile.updated`, with old and new values, for example "meera@test.local changed their own firstName, phone"
  - `updated_by` is the person themselves
  - the cached sign-in details (which carry the name) are refreshed straight away
- **Swagger** describes both routes, and the backend README's endpoint table lists them.

### Shared rules

The field rules now live in one `UpdateProfileDto`. The admin's customer edit (`PATCH /admin/customers/:id`) reuses it, so the two can't drift apart. Its own tests still pass unchanged.

## Changed from the plan

- **Where the code lives:** the edit is in a small `ProfileService` in the profile module, not in `UsersService`. The users module can't use the audit log and sign-in cache without a circular module dependency. This doesn't change any behaviour.

## Known and accepted

- **Phone numbers aren't unique,** as at registration: two accounts may share one.
- **The storefront** isn't affected yet: S9 will add the edit form and update the "Hello, Meera" name after a change.

## Not done / follow-ups

- Changing the email address (needs email verification; S9 shows it read-only).
- An **Edit** button on the admin panel's My profile page (optional; ask any time).
