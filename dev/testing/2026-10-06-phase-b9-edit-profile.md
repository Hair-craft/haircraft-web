# Testing: Phase B9, edit profile (backend)

Pairs with [`plan`](../plan/2026-10-06-phase-b9-edit-profile.md) and [`status`](../status/2026-10-06-phase-b9-edit-profile.md).

**What this phase delivers:** customers and staff can change their own name and phone through the API. There is nothing to see in the shop yet; S9 adds the screen. These steps use Swagger.

## 0. Setup

1. **In `nestjs-haircraft`:** `npm run start:dev`.
2. **Open <http://localhost:3000/api/docs>.**
3. **Sign in as a customer:** `POST /api/v1/auth/login`, with a customer account from the dev seed or one you register. Copy `accessToken`, press **Authorize**, and paste it.

## A. Customer

1. **`GET /api/v1/profile`.** **Expected:** your details. Note the first name and phone.
2. **`PATCH /api/v1/profile`** with `{"firstName": "Meera", "phone": "+919812345678"}`.
   - **Expected:** `200`, "Profile updated", and the profile with the new name and phone. `GET` shows the same.
3. **`PATCH`** with `{"phone": ""}`. **Expected:** `phone` is `null`.
4. **`PATCH`** with `{}`. **Expected:** `200`, nothing changed.
5. **Bad values** (each on its own):
   - `{"firstName": "  "}`
   - `{"phone": "9812345678"}`
   - a 101-character last name
   - `{"email": "new@example.com"}`
   - **Expected:** `400` naming the field. The email is unchanged.
6. **The admin route with a customer token:** `PATCH /api/v1/admin/profile`. **Expected:** `403`.

## B. Staff

7. **Sign in as an admin** (`POST /api/v1/admin/auth/login`, `admin@example.com`), press **Authorize** and paste the new token.
8. **`PATCH /api/v1/admin/profile`** with `{"lastName": "Desk"}`. **Expected:** `200` and the admin profile with the new last name.
9. **The customer route with the admin token:** `PATCH /api/v1/profile`. **Expected:** `403`.

## C. Records

10. **Audit log:** in the admin panel, Audit log, or `GET /api/v1/admin/audit-logs`.
    - **Expected:** "profile.updated" entries, for example "… changed their own firstName, phone", with old and new values.
    - **Expected:** none for the empty change in step 4.

## D. Automated checks

11. **In `nestjs-haircraft`:** `npm test` and `npm run test:e2e`. **Expected:** 316 and 282 pass.

## Results

| #   | Check               | Expected                                         | Result (Pass/Fail) | Notes |
| --- | ------------------- | ------------------------------------------------ | ------------------ | ----- |
| 1–2 | Edit name and phone | 200, profile updated, GET matches                |                    |       |
| 3   | Clear the phone     | null                                             |                    |       |
| 4   | Empty change        | 200, nothing changes                             |                    |       |
| 5   | Bad values, email   | 400 naming the field                             |                    |       |
| 6   | Wrong route         | 403                                              |                    |       |
| 7–8 | Staff edit          | 200, admin profile updated                       |                    |       |
| 9   | Wrong route         | 403                                              |                    |       |
| 10  | Audit log           | profile.updated with changes; none for no change |                    |       |
| 11  | Automated checks    | 316 + 282                                        |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
