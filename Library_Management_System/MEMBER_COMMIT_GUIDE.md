# Member Code and Commit Guide

This guide maps the current implementation to each group member's assigned vulnerabilities. It explains which files belong to each member, what code was added or changed, which vulnerability the change addresses, what evidence to capture, and the commit command to use.

No commits were created by the assistant. The commands below are instructions for the project owner to review and run manually.

## Important Before Committing

Run all commands from the repository root:

```powershell
cd "C:\Users\user\Desktop\ssd assignment latest\Secure-Software-Development-Assignment-\Library_Management_System"
```

## How This Handoff Should Be Used

Each member should receive the ZIP package containing this guide and the current project source. Each member must work only on the branch assigned below, review the existing code, add or edit the files listed for that member, test the change, and commit only that member's work.

The assistant has not created these branches and has not committed anything. The repository currently has `development` and `main`; the members should create the assignment branches locally from the current `development` branch.

### Branches

Use these exact branch names:

```text
security-hardening       shared integration branch
feature/pasindu-v1-v2   Pasindu: V1 and V2
feature/minindu-v3-v4   Minindu: V3 and V4
feature/prasandu-v5-v6  Prasandu: V5 and V6
feature/uvindu-v7-v8-oauth Uvindu: V7, V8, and OAuth
```

Each member starts from the same current `development` branch:

```powershell
git switch development
git pull origin development
git switch -c feature/<member-work>
```

Replace `<member-work>` with the exact branch name above. After committing, push only that branch:

```powershell
git push -u origin feature/<member-work>
```

Do not push `.env` files, Google secrets, MongoDB credentials, generated uploads, or `node_modules`.

### Adding Code From the ZIP

1. Extract the ZIP into a working folder.
2. Open the extracted `Library_Management_System` folder in VS Code.
3. Run `npm install` inside `backend` and `frontend` if `node_modules` is not present.
4. Copy your local `backend/.env` separately; it is intentionally not included in the ZIP.
5. Work only on your assigned branch.
6. Use `git diff` before staging.
7. Run the tests listed in your member section.
8. Stage only your assigned files.
9. Commit using the exact message listed in this guide.
10. Push your branch for review.

### If Members Work In One Shared Clone

If all members use the same local clone, each member must commit or stash their current changes before switching branches. Do not copy another member's uncommitted changes into your branch accidentally. The safest workflow is one separate clone or one clean worktree per member.

## Quick Code Map: What Goes Where

The ZIP already contains the current implementation. These are the key code additions each member should verify in their branch.

### Pasindu code map

In `backend/routes/index.js`, protected admin routes must use:

```js
router.get('/all-users', authToken, adminOnly, allUsers);
router.delete('/delete-user/:id', authToken, adminOnly, deleteUser);
router.post('/books', authToken, adminOnly, upload.single('image'), addBook);
router.put('/books/:id', authToken, adminOnly, upload.single('image'), updateBook);
router.delete('/books/:id', authToken, adminOnly, deleteBook);
```

In `backend/controller/allUsers.js`, the query must exclude passwords:

```js
const allUsers = await userModel.find().select('-password').sort({ createdAt: -1 });
```

The shared middleware is `backend/middleware/adminOnly.js`. It must verify `req.userId`, load the user, and return `403` unless the role is `ADMIN`.

### Minindu code map

In `backend/controller/userSignup.js`, public signup must force the role:

```js
const { email, password, name, profilePic } = req.body;
const payload = { email, name, password, role: 'GENERAL', authProvider: 'local' };
```

Do not accept `role` from the public request body.

In `backend/routes/index.js`, admin functions must use:

```js
router.post('/approve-membership', authToken, adminOnly, approveMembership);
router.get('/pending-memberships', authToken, adminOnly, getAllPendingMemberships);
router.get('/all-reservations', authToken, adminOnly, getAllReservations);
router.put('/reservation-status/:id', authToken, adminOnly, updateReservationStatus);
router.post('/e-books', authToken, adminOnly, ebookUpload.fields([...]), addEBook);
```

The full e-book route should retain its existing upload field definitions; only the authorization middleware is being added.

### Prasandu code map

In `backend/middleware/authToken.js`, do not include query-string token handling. Accept only a Bearer header or HTTP-only cookie:

```js
if (req.headers.authorization?.startsWith('Bearer ')) {
  token = req.headers.authorization.substring(7);
} else if (req.cookies?.token) {
  token = req.cookies.token;
}
```

In `backend/controller/userSignin.js`, the response should set the cookie but must not return the JWT in `data.token`.

In `backend/index.js`, security configuration must include:

```js
app.use(helmet());
app.use('/api/signin', authLimiter);
app.use('/api/signup', authLimiter);
```

The CORS origin must come from `process.env.FRONTEND_URL`.

### Uvindu code map

In `backend/middleware/uploadMiddleware.js`, image uploads must verify MIME type and extension and apply a size limit:

```js
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
limits: { fileSize: 5 * 1024 * 1024 }
```

The filename should use a generated random value, not the original filename.

For OAuth, the main files are:

```text
backend/controller/authGoogle.js
backend/models/userModel.js
backend/routes/index.js
frontend/src/pages/Login.js
frontend/src/common/index.js
```

Google users must always be created with:

```js
role: 'GENERAL'
```

The client secret must remain in `backend/.env` and must never be placed in React code.

Before committing:

- Review the diff for the files assigned to you.
- Do not stage `backend/.env` or any frontend `.env` file.
- Do not stage real MongoDB, JWT, or Google OAuth secrets.
- Do not stage uploaded PDFs or other runtime upload files.
- Capture before/after evidence before making the final commits.
- Use the commit messages shown below so the history is easy to grade.

## Recommended Commit Order

Use this order because authorization middleware is needed before protected routes can be tested:

1. Pasindu: V1 and V2 authorization fixes.
2. Minindu: V3 and V4 role and function-level authorization.
3. Prasandu: V5 and V6 JWT, logging, headers, rate limits, and configuration.
4. Uvindu: V7 uploads, V8 secret hygiene, and Google OAuth.
5. Documentation and evidence commits after all security fixes.

The assignment asks for one logical fix per commit. Do not combine every change into one large commit.

---

# Pasindu: V1 and V2

## V1 - Missing Authentication and Sensitive User Data

### Vulnerability

`GET /api/all-users` was accessible without authentication and could expose complete user documents, including password hashes.

### Files for Pasindu

#### `backend/routes/index.js`

Change made:

- Added `authToken` and `adminOnly` to the `/all-users` route.

Current protection:

```text
GET /api/all-users
-> authToken
-> adminOnly
-> allUsers controller
```

Why this file matters:

- Express route middleware is the server-side enforcement point.
- Frontend visibility checks alone are not security controls.

#### `backend/controller/allUsers.js`

Change made:

- Added `.select('-password')` to the user query.

Why this file matters:

- Even authorized administrators should not receive password hashes unnecessarily.

#### `backend/middleware/adminOnly.js`

Change used by Pasindu's work:

- Loads the authenticated user from MongoDB.
- Allows only `role === 'ADMIN'`.
- Returns `401` when authentication is missing or invalid.
- Returns `403` when the authenticated user is not an admin.

### V1 Evidence to Capture

Before fix:

```powershell
curl http://localhost:8000/api/all-users
```

Save the unauthenticated response or screenshot showing the old insecure behavior. Use the insecure baseline checkout if the current code is already fixed.

After fix:

```powershell
curl -i http://localhost:8000/api/all-users
```

Expected result without a token:

```text
401 Unauthorized
```

Then test with a GENERAL user and record:

```text
403 Forbidden
```

Finally test with an ADMIN account and confirm:

- The request succeeds.
- The response does not contain `password`.

### V1 Commit

```powershell
git add backend/routes/index.js backend/controller/allUsers.js backend/middleware/adminOnly.js
git commit -m "fix(authz): protect all-users endpoint and hide password hashes"
```

If `adminOnly.js` is committed by Minindu instead, leave it out of Pasindu's commit and document the dependency in the report.

---

## V2 - Unauthenticated Destructive and Admin APIs

### Vulnerability

User deletion and book create/update/delete operations were available without adequate authentication and authorization.

### Files for Pasindu

#### `backend/routes/index.js`

Protected routes:

```text
POST   /api/books
PUT    /api/books/:id
DELETE /api/books/:id
DELETE /api/delete-user/:id
```

Each route now uses:

```text
authToken + adminOnly
```

#### `backend/controller/deleteUser.js`

Status:

- The controller performs the deletion operation.
- Authorization is enforced by the route middleware before the controller is reached.
- No controller rewrite is required for the basic V2 authorization fix.

#### `backend/controller/bookController.js`

Status:

- The controller handles book operations.
- Authorization is enforced in `backend/routes/index.js`.
- No role check should be moved only into the frontend.

### V2 Evidence to Capture

Test without authentication:

```powershell
curl -i -X DELETE http://localhost:8000/api/delete-user/<USER_ID>
curl -i -X POST http://localhost:8000/api/books
```

Expected result:

```text
401 Unauthorized
```

Test with a GENERAL user's cookie/token:

```text
403 Forbidden
```

Test with an ADMIN user's cookie/token:

- The request reaches the controller.
- Use a disposable test book/user for destructive tests.

### V2 Commit

```powershell
git add backend/routes/index.js backend/controller/deleteUser.js backend/controller/bookController.js
git commit -m "fix(authz): require admin auth for user delete and book mutations"
```

If `routes/index.js` is already included in the V1 commit, stage only the remaining V2 route changes and use a separate focused commit.

---

## Pasindu Extra: OWASP ZAP and Authorization Evidence

Pasindu owns the scan/evidence coordination for V1 and V2.

Capture:

- ZAP scan before hardening, if available from the insecure baseline.
- ZAP scan after hardening.
- Missing authentication findings before the fix.
- Protected endpoint results after the fix.
- Request/response screenshots from curl, Postman, or browser DevTools.

Suggested evidence directory:

```text
security-evidence/
  pasindu-v1-before.png
  pasindu-v1-after-401.png
  pasindu-v1-general-403.png
  pasindu-v2-before.png
  pasindu-v2-after.png
  zap-baseline-before.html
  zap-baseline-after.html
```

Do not commit secrets or cookies inside screenshots. Redact tokens, passwords, and database URLs.

---

# Minindu: V3 and V4

## V3 - Privilege Escalation and Mass Assignment

### Vulnerability

Public signup accepted a client-provided role, allowing a request such as:

```json
{"role":"ADMIN"}
```

An authenticated user could also attempt to modify user roles through user update functionality.

### Files for Minindu

#### `backend/controller/userSignup.js`

Change made:

- Removed the client-controlled `role` from the destructured request data.
- Forces every public signup to use:

```text
role: 'GENERAL'
```

Why this file matters:

- Public signup is an untrusted input boundary.
- A client must never be allowed to select a privileged role.

#### `backend/controller/adminCreateUser.js`

Why it was added:

- Provides a separate administrator-only path to create `ADMIN` or `GENERAL` accounts.
- Validates allowed roles.
- Is protected by `authToken` and `adminOnly`.

#### `backend/controller/updateUser.js`

Change made:

- Validates the requested role against `ADMIN` and `GENERAL`.
- Restricts the endpoint through admin route middleware.
- Excludes the password field in the returned updated user.

#### `backend/models/userModel.js`

Relevant protection:

- The schema allows only `ADMIN` and `GENERAL`.
- The model hashes local passwords before saving.
- Google accounts may omit a local password through the conditional password requirement.

#### `backend/routes/index.js`

Protected routes:

```text
POST /api/update-user
POST /api/admin/create-user
```

Both require:

```text
authToken + adminOnly
```

### V3 Evidence to Capture

Public signup escalation test:

```powershell
$body = '{"name":"Escalation Test","email":"escalation@example.com","password":"Test@12345","role":"ADMIN"}'
Invoke-RestMethod -Uri "http://localhost:8000/api/signup" -Method Post -ContentType "application/json" -Body $body
```

Expected result:

- User creation succeeds only as `GENERAL`.
- The response must not show `ADMIN` for public signup.

Role update test:

- Login as GENERAL.
- Attempt to call `/api/update-user`.
- Expected result: `403 Forbidden`.

Admin creation test:

- Login as ADMIN.
- Call `/api/admin/create-user` with `role: ADMIN`.
- Expected result: success.

### V3 Commit

```powershell
git add backend/controller/userSignup.js backend/controller/adminCreateUser.js backend/controller/updateUser.js backend/models/userModel.js
git commit -m "fix(auth): block role mass-assignment on signup and update-user"
```

---

## V4 - Missing Function-Level Authorization

### Vulnerability

Some authenticated users could access administrative functions because routes used authentication without checking the role.

### Files for Minindu

#### `backend/middleware/adminOnly.js`

This is the central function-level authorization middleware.

#### `backend/routes/index.js`

Admin-only routes now include:

```text
POST /api/approve-membership
GET  /api/pending-memberships
GET  /api/all-reservations
PUT  /api/reservation-status/:id
POST /api/e-books
PUT  /api/e-books/:id
DELETE /api/e-books/:id
```

Each uses `authToken + adminOnly`.

Member-scoped routes remain authenticated but are not admin-only:

```text
POST /api/book-reservation
GET  /api/user-reservations
PUT  /api/cancel-reservation/:id
POST /api/upload-membership-slip
```

#### `backend/controller/membershipController.js`

Status:

- Membership operations use `req.userId` from authentication.
- Approval and pending membership access are protected by route middleware.
- Sensitive debug output was removed.

#### `backend/controller/bookReservationController.js`

Status:

- User reservation access is scoped through authenticated user logic.
- All reservations and status updates are protected as admin operations.

#### `backend/controller/eBookController.js`

Status:

- E-book mutations are protected by admin middleware.
- Public read/view routes remain available according to the application design.

### V4 Evidence to Capture

Login as GENERAL and test:

```text
GET  /api/all-reservations -> 403
POST /api/approve-membership -> 403
GET  /api/pending-memberships -> 403
POST /api/e-books -> 403
PUT  /api/e-books/:id -> 403
DELETE /api/e-books/:id -> 403
```

Login as ADMIN and repeat the tests with safe test data. The admin requests should pass route authorization.

### V4 Commit

```powershell
git add backend/middleware/adminOnly.js backend/routes/index.js backend/controller/membershipController.js backend/controller/bookReservationController.js backend/controller/eBookController.js
git commit -m "fix(authz): add adminOnly middleware and enforce admin APIs"
```

---

# Prasandu: V5 and V6

## V5 - Sensitive Data Exposure and JWT Security

### Vulnerability

The original implementation returned JWTs in the login JSON response, accepted query-string tokens, and logged sensitive authentication information.

### Files for Prasandu

#### `backend/middleware/authToken.js`

Changes made:

- Accepts Bearer tokens from the Authorization header.
- Accepts the HTTP-only `token` cookie.
- Removed `req.query.token` support.
- Returns controlled authentication errors.
- Clears invalid cookies.
- Removed verbose authentication logging.

#### `backend/controller/userSignin.js`

Changes made:

- Uses generic invalid login messages.
- Issues the JWT through an HTTP-only cookie.
- Does not include the JWT in the JSON response body.
- Uses `secure` and `sameSite` settings based on environment.

#### `backend/controller/changePassword.js`

Changes made:

- Removed request-body logging.
- Removed user ID logging.
- Removed password-comparison result logging.
- Keeps password verification and hashing behavior.

#### `backend/index.js`

Changes made:

- Removed the old change-password debug middleware that printed request bodies.

#### `frontend/src/utils/api.js`

Why it was added:

- Sends `credentials: 'include'` for cookie-based sessions.
- Handles non-success HTTP responses consistently.

#### `frontend/src/context/AuthContext.js`

Status:

- Uses the shared API helper for authenticated requests.
- No JWT is stored in local storage by the login flow.

### V5 Evidence to Capture

- Inspect the login response and confirm no `data.token` is returned.
- Request `/api/user-details?token=<JWT>` and confirm it is rejected.
- Request `/api/user-details` without a cookie and confirm `401`.
- Login normally and confirm the browser sends an HTTP-only cookie.
- Review backend logs and confirm passwords, request bodies, and tokens are not printed.

### V5 Commit

```powershell
git add backend/middleware/authToken.js backend/controller/userSignin.js backend/controller/changePassword.js backend/index.js frontend/src/utils/api.js frontend/src/context/AuthContext.js
git commit -m "fix(auth): harden JWT delivery and remove query-token logging"
```

If `AuthContext.js` was not changed in the current diff, do not stage it in this commit. Only stage files actually reviewed and changed.

---

## V6 - Security Misconfiguration

### Vulnerability

The original application lacked common security headers, authentication rate limits, reliable environment configuration, and clean production logging.

### Files for Prasandu

#### `backend/index.js`

Changes made:

- Added `helmet`.
- Added rate limits to `/api/signin` and `/api/signup`.
- Reads CORS origin from `FRONTEND_URL`.
- Adds safe upload response headers.
- Removes old debug middleware.

#### `backend/package.json`

Added:

```text
helmet
express-rate-limit
```

#### `backend/package-lock.json`

Records the installed dependency versions and audit fixes.

#### `frontend/src/common/index.js`

Changes made:

- Uses `REACT_APP_API_URL` if set.
- Keeps `http://localhost:8000` as the local fallback.
- Removed the stale undefined `baseUrl` problem by restoring a shared alias.

#### `backend/.env.example`

Documents:

- Port.
- MongoDB URI format.
- JWT secret placeholder.
- Frontend URL.
- Google OAuth placeholders and callback URL.

#### `frontend/.env.example`

Documents:

```env
REACT_APP_API_URL=http://localhost:8000
```

### V6 Evidence to Capture

- Inspect a backend response and show Helmet headers.
- Send repeated signin requests and record rate limiting.
- Demonstrate CORS behavior from the configured frontend origin.
- Show that changing `REACT_APP_API_URL` changes the frontend API target.
- Show that logs no longer contain passwords, request bodies, or tokens.

### V6 Commit

```powershell
git add backend/index.js backend/package.json backend/package-lock.json frontend/src/common/index.js backend/.env.example frontend/.env.example
 git commit -m "fix(config): add helmet rate limits and environment configuration"
```

Remove the accidental leading space before `git commit` if copying the command into a shell.

---

# Uvindu: V7, V8, and OAuth

## V7 - Insecure File Upload

### Vulnerability

The original image upload middleware did not sufficiently restrict file types, extensions, sizes, or filenames.

### Files for Uvindu

#### `backend/middleware/uploadMiddleware.js`

Changes made:

- Allows only JPEG, JPG, PNG, and WebP MIME types.
- Requires matching safe extensions.
- Limits image uploads to 5 MB.
- Generates timestamped cryptographically random filenames.

#### `backend/middleware/ebookUpload.js`

Existing protections reviewed:

- Cover images must have image MIME types.
- E-book files must use `application/pdf`.
- Files are limited to 10 MB.

#### `backend/index.js`

Changes made:

- Returns controlled errors for rejected image, PDF, and oversized uploads.
- Adds `Content-Disposition: attachment` and `nosniff` for static uploads.

#### `backend/routes/index.js`

Changes made:

- Book image mutations require `authToken + adminOnly`.
- Membership slip uploads require authentication.
- E-book mutations require `authToken + adminOnly`.

### V7 Evidence to Capture

Test a valid small image:

```text
Expected: accepted for an authorized request.
```

Test invalid files:

```text
.html -> rejected
.js   -> rejected
.exe  -> rejected
large image over 5 MB -> rejected
```

For e-books:

```text
non-PDF -> rejected
oversized PDF -> rejected
```

Do not use production or real user files for testing.

### V7 Commit

```powershell
git add backend/middleware/uploadMiddleware.js backend/middleware/ebookUpload.js backend/index.js backend/routes/index.js
 git commit -m "fix(upload): restrict file types sizes and filenames"
```

Remove the accidental leading space before `git commit` if copying the command.

---

## V8 - Secrets and Configuration Hygiene

### Vulnerability

The project needed safe environment templates and protection against accidentally committing credentials or runtime uploads.

### Files for Uvindu

#### `.gitignore`

Changes made:

- Ignores `.env` and `.env.*` except `.env.example`.
- Ignores dependencies and build output.
- Ignores runtime upload contents while retaining `.gitkeep`.

#### `backend/.env.example`

Contains placeholders only and no real secrets.

#### `frontend/.env.example`

Contains only the public local API URL configuration.

#### `backend/uploads/.gitkeep`

Keeps an empty upload directory available without tracking uploaded content.

### V8 Evidence and Cleanup

Run:

```powershell
git ls-files "backend/.env" "frontend/.env"
git ls-files "backend/uploads/*"
```

Required result:

- No `.env` file should be tracked.
- Existing upload PDFs should be removed from tracking before the final commit.

The owner must rotate:

- MongoDB Atlas password.
- Google OAuth client secret.
- Any JWT secret used outside local development.

### V8 Commit

After rotating secrets and removing tracked upload files:

```powershell
git rm --cached backend/uploads/*.pdf
git add .gitignore backend/.env.example frontend/.env.example backend/uploads/.gitkeep
git commit -m "chore(security): protect secrets and runtime uploads"
```

If additional upload paths exist, inspect them before using `git rm --cached`.

Never run `git add .` until you have checked that `.env` files and secrets are ignored.

---

## OAuth - Google OAuth 2.0

### Files for Uvindu

#### `backend/controller/authGoogle.js`

Implements:

- Authorization request creation.
- Server-side authorization-code exchange.
- Google profile retrieval.
- Existing-user lookup by Google ID or email.
- New GENERAL user creation.
- JWT HTTP-only cookie session.
- Frontend success/error redirect.

#### `backend/models/userModel.js`

Adds:

```text
googleId
authProvider
```

Also allows Google users to exist without a local password.

#### `backend/routes/index.js`

Adds:

```text
GET /api/auth/google
GET /api/auth/google/callback
```

#### `frontend/src/pages/Login.js`

Adds:

- Continue with Google button.
- Redirect to the backend OAuth start route.
- OAuth error handling.

#### `frontend/src/common/index.js`

Adds the `googleLogin` endpoint and environment-based backend URL.

#### `backend/.env.example`

Documents:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

### OAuth Evidence to Capture

Record the complete sequence:

1. Open login page.
2. Click Continue with Google.
3. Google sign-in screen appears.
4. Sign in and approve access.
5. Google redirects to `/api/auth/google/callback`.
6. Backend creates or links the member.
7. Backend sets the HTTP-only `token` cookie.
8. Frontend redirects to the home page.
9. `/api/user-details` returns the new member.
10. MongoDB contains the new user with role `GENERAL`.

### OAuth Commit Commands

Use separate commits:

```powershell
git add backend/models/userModel.js backend/.env.example
git commit -m "feat(oauth): add Google identity fields and environment template"
```

```powershell
git add backend/controller/authGoogle.js backend/routes/index.js
git commit -m "feat(oauth): implement Google authorization-code routes"
```

```powershell
git add frontend/src/pages/Login.js frontend/src/common/index.js frontend/src/utils/api.js
git commit -m "feat(ui): add Google sign-in and cookie session support"
```

Do not stage `backend/.env` in any OAuth commit.

---

# Documentation and Final Commit

After all member commits are reviewed, update:

```text
README.txt
README.md
IMPLEMENTATION_CHANGES.md
```

Fill in:

- Member names.
- Student/index numbers.
- Hardened repository URL.
- YouTube URL.
- Evidence file names.
- Final known residual risks.

Suggested documentation commit:

```powershell
git add README.txt README.md IMPLEMENTATION_CHANGES.md
git commit -m "docs: document security fixes testing and submission setup"
```

# Final Verification Checklist

Run:

```powershell
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend audit --audit-level=high
npm.cmd --prefix frontend run build
git diff --check
git status
```

Confirm:

- Unauthenticated admin requests return `401`.
- GENERAL users receive `403` for admin APIs.
- Public signup cannot create ADMIN.
- `/api/all-users` does not return password hashes.
- Query-string JWTs are rejected.
- Invalid and oversized uploads are rejected.
- Google OAuth completes for a new member.
- `.env` files are not tracked.
- Existing upload files are not tracked.
- Every logical fix has its own commit.
- No secrets appear in commits, screenshots, logs, or documentation.

# Current Known Gaps

At the time this guide was written:

- No commits have been created by the assistant.
- Before/after vulnerability evidence still needs to be captured.
- OWASP ZAP evidence still needs to be generated.
- A report PDF still needs to be written.
- Names, student IDs, repository URL, and YouTube URL still need to be filled in.
- Google OAuth start flow reaches Google, but a complete new-user callback test must still be recorded.
- Frontend dependency audit still reports transitive vulnerabilities from the legacy Create React App dependency tree.
- Real MongoDB and Google credentials must be rotated before final submission.
