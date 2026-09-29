# Evidence and Postman Testing Guide

This guide explains how every member should collect security evidence for the SE4030 Library Management System assignment.

No Git commits are created by this guide. Each member should collect evidence on their assigned branch and attach it to the final report.

## 1. Evidence Rules

For every vulnerability, collect evidence in this order:

1. **Before evidence:** show the insecure behavior using the insecure baseline or a saved original version.
2. **Code evidence:** show the changed file and the relevant code line/block.
3. **After evidence:** repeat the same request after the fix.
4. **Authorization evidence:** test no token, GENERAL user, and ADMIN user where relevant.
5. **Screenshot evidence:** capture the complete Postman request and response.
6. **Write the result:** record the status code, response message, impact, and fix.

Never include these in screenshots:

- Passwords.
- MongoDB connection strings.
- Google client secrets.
- JWT values.
- Complete cookies.
- Personal information that is not needed for the report.

Redact tokens and secrets before saving screenshots.

## 2. Start the Application

Open two terminals.

### Backend terminal

```powershell
cd "C:\Users\user\Desktop\ssd assignment latest\Secure-Software-Development-Assignment-\Library_Management_System\backend"
npm run dev
```

Expected output:

```text
Connected to DB
Server is running on port 8000
```

### Frontend terminal

```powershell
cd "C:\Users\user\Desktop\ssd assignment latest\Secure-Software-Development-Assignment-\Library_Management_System\frontend"
npm start
```

Expected frontend URL:

```text
http://localhost:3000
```

The Postman base URL is:

```text
http://localhost:8000/api
```

## 3. Create Test Accounts

Use two disposable local accounts:

### GENERAL account

```text
Name: Evidence General
Email: evidence.general@example.com
Password: Evidence@12345
```

### ADMIN account

Create the ADMIN account using the project’s protected admin creation path or the existing administrator account. Do not create an ADMIN using public signup.

Record the admin email privately. Never put the admin password in screenshots.

## 4. Postman Environment

Create a Postman environment named `Library Evidence`.

Add these variables:

```text
baseUrl = http://localhost:8000/api
generalCookie =
adminCookie =
testUserId =
testBookId =
testEbookId =
```

Do not store real passwords or long-lived production tokens in a shared Postman collection.

## 5. How to Capture a Postman Screenshot

For each request:

1. Open the request in Postman.
2. Show the HTTP method and URL.
3. Show the relevant Headers or Body tab.
4. Send the request.
5. Wait until the response is complete.
6. Make sure the response status code is visible.
7. Make sure the response message is visible.
8. Resize the response panel so the important result is readable.
9. Redact cookies, Bearer tokens, passwords, and personal data.
10. Use `Snipping Tool` with `Win + Shift + S`.
11. Save the screenshot using the filename listed in this guide.

Postman screenshot filenames should use this format:

```text
<Member>-<Vulnerability>-<stage>-<test>.png
```

Examples:

```text
pasindu-v1-before-unauthenticated.png
pasindu-v1-after-general-403.png
pasindu-v1-after-admin-no-password.png
```

## 6. How to Capture Code Screenshots

For the code evidence:

1. Open the relevant file in VS Code.
2. Show the route or middleware that fixes the issue.
3. Include the file name in the editor tab.
4. Select only the relevant code block.
5. Capture the screenshot with `Win + Shift + S`.
6. Do not include secrets from `.env`.

Recommended code evidence names:

```text
pasindu-v1-route-authz.png
minindu-v3-public-signup-role.png
prasandu-v5-cookie-auth.png
uvindu-v7-upload-filter.png
```

## 7. Authentication Requests in Postman

### Login request

```text
Method: POST
URL: {{baseUrl}}/signin
```

Body, raw JSON:

```json
{
  "email": "evidence.general@example.com",
  "password": "Evidence@12345"
}
```

Headers:

```text
Content-Type: application/json
```

Expected result:

```text
200 OK
Login Successful
```

The response should not contain `data.token`. Postman should receive an HTTP-only cookie named `token`.

For the ADMIN account, repeat the request with the administrator credentials.

### Using the cookie

Postman normally stores cookies automatically if cookie handling is enabled.

To confirm the cookie:

1. Send the login request.
2. Select **Cookies** near the request URL.
3. Select `localhost`.
4. Confirm a `token` cookie exists.
5. Do not include the cookie value in screenshots.

## 8. Pasindu Evidence: V1

### V1 vulnerability

Unauthenticated access to `/api/all-users` exposed user data and could expose password hashes.

### V1 before test

Use the insecure baseline or original code.

```text
Method: GET
URL: http://localhost:8000/api/all-users
Headers: no Authorization header
Cookies: none
```

Expected insecure result in the original version:

```text
200 OK
User list returned without login
```

Take this screenshot immediately after the response appears:

```text
pasindu-v1-before-unauthenticated.png
```

In the report, explain that this demonstrates missing authentication and sensitive data exposure.

### V1 after test without login

Use the hardened code.

```text
Method: GET
URL: {{baseUrl}}/all-users
Headers: no Authorization header
Cookies: none
```

Expected result:

```text
401 Unauthorized
Authentication required
```

Save:

```text
pasindu-v1-after-no-token-401.png
```

### V1 after test as GENERAL

1. Login as GENERAL.
2. Make the `GET /all-users` request using the stored cookie.

Expected result:

```text
403 Forbidden
Admin access required
```

Save:

```text
pasindu-v1-after-general-403.png
```

### V1 after test as ADMIN

1. Login as ADMIN.
2. Make the same request.

Expected result:

```text
200 OK
```

Check the response carefully:

- The user list may be present.
- The response must not contain a `password` field.

Save:

```text
pasindu-v1-after-admin-no-password.png
```

### V1 code screenshot

Capture:

```text
pasindu-v1-route-authz.png
pasindu-v1-password-exclusion.png
pasindu-v1-admin-middleware.png
```

### V1 report paragraph

Include:

- Endpoint.
- OWASP A01 Broken Access Control.
- CWE-306 Missing Authentication.
- Impact: unauthorized exposure of users and password hashes.
- Before status: `200` without login.
- After statuses: `401` without login, `403` for GENERAL, `200` for ADMIN.
- Fix files.

## 9. Pasindu Evidence: V2

### V2 vulnerability

Unauthenticated users could perform destructive or administrative actions such as deleting users and modifying books.

### V2 before delete-user test

Use an expendable user ID in the insecure baseline.

```text
Method: DELETE
URL: http://localhost:8000/api/delete-user/<USER_ID>
Headers: no Authorization header
Cookies: none
```

Expected insecure result in the original version:

```text
200 OK
User deleted without authentication
```

Do not delete a real production user. Use a disposable test database/user.

Save:

```text
pasindu-v2-before-delete-user.png
```

### V2 after delete-user test

```text
Method: DELETE
URL: {{baseUrl}}/delete-user/<USER_ID>
Cookies: none
```

Expected:

```text
401 Unauthorized
```

Login as GENERAL and repeat.

Expected:

```text
403 Forbidden
```

Save:

```text
pasindu-v2-after-delete-user-401.png
pasindu-v2-after-delete-user-403.png
```

### V2 book mutation tests

Test each endpoint without a cookie:

```text
POST   {{baseUrl}}/books
PUT    {{baseUrl}}/books/<BOOK_ID>
DELETE {{baseUrl}}/books/<BOOK_ID>
```

Expected for each:

```text
401 Unauthorized
```

Login as GENERAL and repeat. Expected:

```text
403 Forbidden
```

Login as ADMIN and use safe test data. Expected:

```text
Authorized request reaches the controller
```

Save:

```text
pasindu-v2-books-no-token.png
pasindu-v2-books-general-403.png
pasindu-v2-books-admin.png
```

### V2 report paragraph

Explain that authentication and role authorization are enforced before destructive controllers execute.

## 10. Minindu Evidence: V3

### V3 vulnerability

Public signup accepted a client-controlled role and allowed attempted privilege escalation to ADMIN.

### V3 before test

Use the insecure baseline:

```text
Method: POST
URL: http://localhost:8000/api/signup
```

Body:

```json
{
  "name": "Escalation Test",
  "email": "escalation-before@example.com",
  "password": "Evidence@12345",
  "role": "ADMIN"
}
```

Expected insecure result:

```text
201 Created
role: ADMIN
```

Save:

```text
minindu-v3-before-role-escalation.png
```

### V3 after public signup test

Use the hardened code and a new email:

```text
Method: POST
URL: {{baseUrl}}/signup
```

Use the same body with `role: ADMIN`.

Expected result:

```text
201 Created
role: GENERAL
```

Save:

```text
minindu-v3-after-role-forced-general.png
```

### V3 update-user authorization test

Login as GENERAL and send:

```text
Method: POST
URL: {{baseUrl}}/update-user
```

Body:

```json
{
  "userId": "<TARGET_USER_ID>",
  "role": "ADMIN"
}
```

Expected:

```text
403 Forbidden
```

Save:

```text
minindu-v3-general-role-update-403.png
```

Login as ADMIN and repeat with safe test data. Confirm the permitted role update works.

Save:

```text
minindu-v3-admin-role-update.png
```

### V3 code screenshots

```text
minindu-v3-public-signup-role.png
minindu-v3-admin-create-user.png
minindu-v3-update-user-role-check.png
```

## 11. Minindu Evidence: V4

### V4 vulnerability

Authenticated GENERAL users could access administrative membership, reservation, or e-book functions.

### V4 GENERAL-user tests

Login as GENERAL and test each request:

```text
GET  {{baseUrl}}/all-reservations
PUT  {{baseUrl}}/reservation-status/<RESERVATION_ID>
POST {{baseUrl}}/approve-membership
GET  {{baseUrl}}/pending-memberships
POST {{baseUrl}}/e-books
PUT  {{baseUrl}}/e-books/<EBOOK_ID>
DELETE {{baseUrl}}/e-books/<EBOOK_ID>
```

Expected result for every admin-only request:

```text
403 Forbidden
Admin access required
```

Save screenshots:

```text
minindu-v4-general-all-reservations-403.png
minindu-v4-general-membership-403.png
minindu-v4-general-ebooks-403.png
```

### V4 ADMIN tests

Login as ADMIN and repeat using safe test data.

Expected:

```text
Admin authorization passes
```

Save:

```text
minindu-v4-admin-authorized.png
```

### V4 member-scope tests

Login as GENERAL and confirm these member operations still work only for the logged-in user:

```text
POST {{baseUrl}}/book-reservation
GET  {{baseUrl}}/user-reservations
PUT  {{baseUrl}}/cancel-reservation/<OWN_RESERVATION_ID>
```

Save:

```text
minindu-v4-member-scope.png
```

## 12. Prasandu Evidence: V5

### V5 vulnerability

JWTs were previously exposed unnecessarily, accepted in query strings, and sensitive request information was logged.

### V5 login response test

```text
Method: POST
URL: {{baseUrl}}/signin
```

After sending the request:

- Show the response JSON.
- Confirm there is no `data.token` value.
- Open the cookie manager separately and confirm an HTTP-only `token` cookie exists.

Save:

```text
prasandu-v5-cookie-only-login.png
```

Redact the cookie value before saving.

### V5 query-token test

Use any test JWT only locally and never include its value in the screenshot.

```text
Method: GET
URL: {{baseUrl}}/user-details?token=<REDACTED_TOKEN>
Headers: remove Authorization header
Cookies: remove token cookie
```

Expected:

```text
401 Unauthorized
```

Save:

```text
prasandu-v5-query-token-rejected.png
```

### V5 logging test

1. Start the backend.
2. Login.
3. Request user details.
4. Change a password using test credentials.
5. Review the backend terminal.

Confirm the terminal does not print:

- Passwords.
- Request bodies.
- JWT values.
- Complete cookies.
- Password comparison results.

Save a screenshot only if it contains no secret values:

```text
prasandu-v5-safe-logs.png
```

### V5 code screenshots

```text
prasandu-v5-auth-token.png
prasandu-v5-cookie-signin.png
prasandu-v5-no-password-logs.png
```

## 13. Prasandu Evidence: V6

### V6 Helmet test

Use Postman:

```text
Method: GET
URL: {{baseUrl}}/books
```

Open the response Headers tab and look for headers such as:

```text
x-content-type-options
x-frame-options
strict-transport-security (when HTTPS is used)
content-security-policy (depending on Helmet configuration)
```

Save:

```text
prasandu-v6-helmet-headers.png
```

Do not claim HSTS for local HTTP if it is not present.

### V6 rate-limit test

Send repeated failed signin requests using a safe test email/password. Do not attack the server with a script or excessive traffic.

After the configured limit is reached, expected result:

```text
429 Too Many Requests
Too many login attempts. Please try again later.
```

Save:

```text
prasandu-v6-rate-limit-429.png
```

### V6 CORS test

From the frontend at `http://localhost:3000`, confirm API requests work.

For an unauthorized origin, inspect the response and confirm the configured CORS policy does not grant unrestricted access.

Save:

```text
prasandu-v6-cors.png
```

### V6 environment test

Show that:

```text
FRONTEND_URL
REACT_APP_API_URL
PORT
```

are loaded from environment configuration rather than hard-coded values throughout the application.

Do not show real secrets.

## 14. Uvindu Evidence: V7

### V7 vulnerability

Uploads previously lacked sufficient type, extension, size, and filename controls.

### V7 valid image test

Use an authorized ADMIN request to the relevant book image endpoint.

```text
Method: POST
URL: {{baseUrl}}/books
Body: form-data
Field: image
Type: File
Value: small-test.png
```

Expected:

```text
Valid image accepted
Generated filename is not the original filename
```

Save:

```text
uvindu-v7-valid-image.png
```

### V7 invalid image tests

Repeat with these files:

```text
test.html
malicious.js
fake.exe
wrong-extension.txt
```

Set the file field to `image`.

Expected:

```text
400 Bad Request
Only JPEG, PNG, and WebP images are allowed
```

Save:

```text
uvindu-v7-invalid-html-rejected.png
uvindu-v7-invalid-js-rejected.png
```

### V7 oversized file test

Use an image larger than 5 MB.

Expected:

```text
400 Bad Request
File too large
```

Save:

```text
uvindu-v7-oversized-file-rejected.png
```

### V7 e-book tests

For e-book upload:

- Valid cover image should be an image.
- Valid e-book file should be PDF.
- Non-PDF e-book file should be rejected.
- Files over 10 MB should be rejected.

Save:

```text
uvindu-v7-invalid-ebook-rejected.png
uvindu-v7-oversized-ebook-rejected.png
```

Never upload an actual malware sample. Use harmless files with invalid extensions/MIME types.

## 15. Uvindu Evidence: V8

### V8 tracked-secret test

Run from the repository root:

```powershell
git ls-files "backend/.env" "frontend/.env"
```

Expected final result:

```text
No output
```

Check tracked uploads:

```powershell
git ls-files "backend/uploads/*"
```

Expected final result:

```text
No runtime upload files listed
```

Save terminal evidence:

```text
uvindu-v8-no-tracked-secrets.png
uvindu-v8-no-tracked-uploads.png
```

### V8 example-file test

Show these files without opening real `.env` files:

```text
backend/.env.example
frontend/.env.example
.gitignore
```

Confirm that `.env.example` contains placeholders, not real credentials.

Save:

```text
uvindu-v8-env-example.png
uvindu-v8-gitignore.png
```

### V8 rotation evidence

Do not screenshot the actual secrets. Record in the report that:

- MongoDB password was rotated.
- Google OAuth client secret was rotated.
- Local `.env` was updated after rotation.

## 16. Uvindu Evidence: Google OAuth

### OAuth configuration check

Confirm these values exist only in local `backend/.env`:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

The callback URL must be exactly:

```text
http://localhost:8000/api/auth/google/callback
```

### OAuth complete flow

1. Open `http://localhost:3000/login`.
2. Click **Continue with Google**.
3. Confirm the Google sign-in page appears.
4. Sign in with a test Google account.
5. Approve consent.
6. Confirm Google redirects to the backend callback.
7. Confirm the backend redirects to the frontend home page.
8. Confirm the new member is logged in.
9. Confirm `/api/user-details` returns the user.
10. Confirm MongoDB contains the user.
11. Confirm the user role is `GENERAL`.
12. Confirm an HTTP-only application cookie exists.

Save screenshots at these moments:

```text
uvindu-oauth-login-button.png
uvindu-oauth-google-consent.png
uvindu-oauth-frontend-success.png
uvindu-oauth-user-details.png
```

Do not capture the Google password, authorization code, client secret, or JWT cookie value.

### OAuth failure evidence

If the flow fails, capture the final redirect reason and backend terminal error without secrets. Common causes:

```text
not_configured  -> .env is missing credentials or backend was not restarted
token_exchange  -> client secret, callback URL, or OAuth client configuration mismatch
profile         -> Google profile request failed
server          -> database or application error
```

## 17. OWASP ZAP Evidence

Run ZAP only against the local application.

Recommended targets:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

Workflow:

1. Start backend and frontend.
2. Open ZAP.
3. Use Quick Start or Automated Scan.
4. Scan only localhost.
5. Export the report before fixing if the insecure baseline is available.
6. Export a second report after hardening.
7. Redact cookies, tokens, and personal data.
8. Save the reports in the evidence folder.

Suggested files:

```text
security-evidence/zap-before.html
security-evidence/zap-after.html
security-evidence/zap-after-summary.png
```

In the report, explain which alerts were fixed and which residual risks remain.

## 18. Evidence Folder Structure

Create this folder outside the source code first:

```text
security-evidence/
  pasindu/
    pasindu-v1-before-unauthenticated.png
    pasindu-v1-after-no-token-401.png
    pasindu-v1-after-general-403.png
    pasindu-v1-after-admin-no-password.png
    pasindu-v2-before-delete-user.png
    pasindu-v2-after-delete-user-401.png
    pasindu-v2-books-general-403.png
  minindu/
    minindu-v3-before-role-escalation.png
    minindu-v3-after-role-forced-general.png
    minindu-v3-general-role-update-403.png
    minindu-v4-general-all-reservations-403.png
    minindu-v4-general-membership-403.png
    minindu-v4-general-ebooks-403.png
  prasandu/
    prasandu-v5-cookie-only-login.png
    prasandu-v5-query-token-rejected.png
    prasandu-v5-safe-logs.png
    prasandu-v6-helmet-headers.png
    prasandu-v6-rate-limit-429.png
    prasandu-v6-cors.png
  uvindu/
    uvindu-v7-valid-image.png
    uvindu-v7-invalid-html-rejected.png
    uvindu-v7-oversized-file-rejected.png
    uvindu-v8-no-tracked-secrets.png
    uvindu-v8-env-example.png
    uvindu-oauth-google-consent.png
    uvindu-oauth-frontend-success.png
  zap-before.html
  zap-after.html
```

Do not commit evidence containing secrets. Review every screenshot before adding it to the report or repository.

## 19. Evidence Table for the Report

For every vulnerability, use this table format:

| ID | Endpoint/file | Before result | After result | Evidence files | Fix commit |
|---|---|---|---|---|---|
| V1 | `/api/all-users` | 200 without token | 401/403; no passwords | `pasindu-v1-*` | V1 commit hash |
| V2 | User delete/book CRUD | Unauthorized success | 401/403 | `pasindu-v2-*` | V2 commit hash |
| V3 | `/api/signup` role | ADMIN accepted | GENERAL forced | `minindu-v3-*` | V3 commit hash |
| V4 | Admin APIs | GENERAL allowed | GENERAL receives 403 | `minindu-v4-*` | V4 commit hash |
| V5 | JWT/cookie/logging | Token exposed | Cookie only; query rejected | `prasandu-v5-*` | V5 commit hash |
| V6 | Headers/rate/CORS | Missing controls | Controls active | `prasandu-v6-*` | V6 commit hash |
| V7 | Upload endpoints | Invalid files accepted | Invalid files rejected | `uvindu-v7-*` | V7 commit hash |
| V8 | Secrets/uploads | Secrets/files tracked | Ignored and rotated | `uvindu-v8-*` | V8 commit hash |
| OAuth | Google login | Not available | Member login works | `uvindu-oauth-*` | OAuth commit hashes |

## 20. Final Evidence Checklist

Before submitting, confirm every item:

- [ ] Before screenshot exists for V1.
- [ ] After `401` and `403` screenshots exist for V1.
- [ ] Admin `/all-users` response has no password field.
- [ ] Before screenshot exists for V2.
- [ ] Delete-user and book CRUD unauthorized tests exist.
- [ ] Public signup ADMIN escalation test exists.
- [ ] GENERAL role-update denial exists.
- [ ] GENERAL admin-API denial screenshots exist for V4.
- [ ] JWT is absent from login JSON.
- [ ] Query-string token is rejected.
- [ ] Sensitive logs are removed.
- [ ] Helmet headers are visible.
- [ ] Rate limit `429` is captured.
- [ ] CORS/environment evidence exists.
- [ ] Invalid upload tests exist.
- [ ] Oversized upload tests exist.
- [ ] `.env` files are not tracked.
- [ ] Existing uploaded files are not tracked.
- [ ] Google consent screenshot exists.
- [ ] Successful OAuth callback and logged-in member screenshot exist.
- [ ] OWASP ZAP before/after evidence exists.
- [ ] Every member has a commit hash in the report.
- [ ] No screenshot contains passwords, tokens, cookies, or secrets.
