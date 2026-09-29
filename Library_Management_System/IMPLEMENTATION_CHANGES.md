# Implementation Changes and Handover Notes

This document explains the work completed in the Library Management System for the SE4030 secure software development assignment.

No Git commit was created. All changes remain in the working tree for the project owner to review and commit.

## 1. Project Status

The project now contains the main security-hardening implementation and Google OAuth implementation. The application was tested locally with:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Database: MongoDB Atlas
- OAuth provider: Google OAuth 2.0 Authorization Code flow

The Google OAuth start flow was tested successfully: the application redirected to the Google sign-in page. During testing, a duplicate registration-number problem was found and fixed in the user model.

## 2. Files Changed or Added

### Root files

#### `../.gitignore`

Why it was changed:

- Added protection for `.env` files and environment secrets.
- Added rules for `node_modules`, build/cache files, and runtime upload content.
- Added upload-directory rules while allowing `.gitkeep` placeholders.

Why the file is needed:

- Prevents database passwords, JWT secrets, Google client secrets, dependencies, and uploaded user content from being committed accidentally.

Important limitation:

- `.gitignore` does not remove files that Git already tracks. Existing tracked PDFs in `backend/uploads/` still need to be removed from Git tracking manually before the final commit.

#### `README.md`

Why it was changed:

- Corrected the backend URL from port `5000` to port `8000`.
- Added environment setup instructions.
- Added the Google OAuth callback URL.
- Documented security hardening features.
- Linked the assignment checklist to `README.txt`.

Why the file is needed:

- Gives developers the correct commands and URLs for running the project.
- Explains how to configure OAuth without placing secrets in source control.

#### `README.txt`

Why it was added:

- Provides the required assignment submission template.
- Includes placeholders for four member names and student/index numbers.
- Includes placeholders for the hardened repository URL and YouTube URL.
- Lists the evidence that must be attached to the final submission.

What you must edit:

- Replace all `<Name>` placeholders.
- Replace all `<Student/Index Number>` placeholders.
- Add the hardened GitHub repository URL.
- Add the final YouTube demonstration URL.

#### `IMPLEMENTATION_CHANGES.md`

Why it was added:

- This is the detailed handover document explaining every implementation change, installation, test, limitation, and remaining task.

### Backend configuration and dependencies

#### `backend/.env`

Why it was changed locally:

- Configured the MongoDB Atlas URI.
- Configured the JWT signing secret.
- Configured the frontend CORS origin.
- Configured Google OAuth client ID, client secret, and callback URL.

Required local values:

```env
MONGODB_URI=<your MongoDB URI>
TOKEN_SECRET_KEY=<long random secret>
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<Google client ID>
GOOGLE_CLIENT_SECRET=<Google client secret>
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

Security requirement:

- This file must never be committed.
- The MongoDB password and Google client secret used during testing were exposed during the development conversation. Rotate both credentials in their provider consoles before submission, then update this local file.

#### `backend/.env.example`

Why it was added:

- Documents the required backend environment variables without containing real credentials.
- Provides the MongoDB Atlas connection format.
- Provides the Google callback URL.

Why the file is needed:

- Other developers can create their own `.env` file from a safe template.
- It documents configuration without exposing secrets.

#### `backend/package.json`

Why it was changed:

Added these packages:

- `helmet`: adds common HTTP security headers.
- `express-rate-limit`: limits repeated authentication requests.

Why they are needed:

- Helmet addresses security misconfiguration and missing security headers.
- Rate limiting reduces password-guessing and authentication abuse.

#### `backend/package-lock.json`

Why it was changed:

- Records the installed backend dependency versions.
- Includes the newly installed `helmet` and `express-rate-limit` packages.
- Includes dependency updates from `npm audit fix`.

Validation result:

```text
backend npm audit: found 0 vulnerabilities
```

### Backend authentication and authorization

#### `backend/middleware/authToken.js`

Why it was changed:

- Accepts JWTs from the Authorization Bearer header or HTTP-only cookie.
- Removed support for `?token=` query-string authentication.
- Added consistent `401` responses for missing, expired, and malformed tokens.
- Clears invalid cookies.
- Removed verbose token/header logging.

Security benefit:

- Query-string tokens can leak through browser history, server logs, analytics, and Referer headers. They are no longer accepted.

#### `backend/middleware/adminOnly.js`

Why it was added:

- Loads the authenticated user from MongoDB.
- Requires the user role to be exactly `ADMIN`.
- Returns `401` for missing/unknown users and `403` for non-admin users.

Security benefit:

- Makes authorization a server-side control instead of relying on the React interface.

#### `backend/controller/userSignup.js`

Why it was changed:

- Public signup now ignores any client-provided role.
- Every public signup creates a `GENERAL` user.
- Password validation remains enforced.
- New local users are explicitly marked as `local` authentication users.

Security benefit:

- Prevents a visitor from sending `{ "role": "ADMIN" }` and escalating privileges.

#### `backend/controller/userSignin.js`

Why it was changed:

- Uses a generic `Invalid email or password` response.
- Prevents user enumeration through different login errors.
- Sends the JWT through an HTTP-only cookie only.
- No longer returns the JWT in the JSON response body.
- Keeps secure and SameSite cookie settings for production.

Security benefit:

- Reduces token exposure and avoids revealing whether an email exists.

#### `backend/controller/userDetails.js`

Why it was already aligned with hardening:

- Returns the authenticated user without the password field.
- Depends on `authToken` to identify the user.

#### `backend/controller/allUsers.js`

Why it was changed:

- Excludes the password hash using `.select('-password')`.
- Keeps the endpoint response limited to non-password user data.

Security benefit:

- Even an authorized administrator does not receive password hashes unnecessarily.

#### `backend/controller/updateUser.js`

Why it was changed:

- Validates the target user ID.
- Restricts role changes to the allowed `ADMIN` and `GENERAL` values.
- Excludes the password field from the response.
- This endpoint is protected by `authToken` and `adminOnly` in the routes.

Security benefit:

- Prevents arbitrary role values and restricts user administration to admins.

#### `backend/controller/adminCreateUser.js`

Why it was added:

- Provides a separate admin-only user creation path.
- Allows an authenticated administrator to create either `ADMIN` or `GENERAL` users.
- Public signup remains limited to `GENERAL`.

Security benefit:

- Separates privileged account creation from public registration.

#### `backend/helpers/permission.js`

Why it was changed:

- Updated the old permission helper to use the current admin role terminology and authorization approach.

Important note:

- The active route protection uses `backend/middleware/adminOnly.js`, which is clearer and directly integrated into Express routes.

### Backend routes and application configuration

#### `backend/routes/index.js`

Why it was changed:

- Added missing authentication routes.
- Added Google OAuth start and callback routes.
- Added `authToken` and `adminOnly` to admin-only APIs.
- Protected book creation, update, and delete routes.
- Protected e-book creation, update, and delete routes.
- Protected all reservations and reservation-status updates.
- Protected membership approval and pending-membership routes.
- Protected all-users, update-user, delete-user, and admin-create-user routes.
- Kept member-specific reservation and membership upload routes authenticated.

Security benefit:

- Unauthenticated and non-admin users can no longer call administrative APIs successfully.

#### `backend/index.js`

Why it was changed:

- Added Helmet.
- Added rate limiting to signup and signin routes.
- Configured CORS from `FRONTEND_URL`.
- Removed the old verbose change-password debug middleware.
- Added controlled Multer upload error responses.
- Serves uploads as attachments with `X-Content-Type-Options: nosniff`.
- Creates the upload directory when needed.

Security benefit:

- Improves headers, brute-force resistance, upload error handling, and static-file handling.

#### `backend/config/db.js`

Status:

- No code change was required.
- It already reads `MONGODB_URI` from `backend/.env`.

#### `backend/package.json` and `backend/package-lock.json`

These files also document the runtime dependency installation described above.

### Backend file uploads

#### `backend/middleware/uploadMiddleware.js`

Why it was changed:

- Allows only JPEG, JPG, PNG, and WebP images.
- Checks both MIME type and extension.
- Limits files to 5 MB.
- Generates randomized filenames using cryptographic random bytes.

Security benefit:

- Rejects dangerous file types and oversized uploads.
- Reduces filename collisions and unsafe original filenames.

#### `backend/middleware/ebookUpload.js`

Status:

- Existing e-book upload handling already restricted cover images and PDFs and limited files to 10 MB.
- Routes now also require admin authorization for e-book mutations.

#### `backend/uploads/.gitkeep`

Why it was added:

- Keeps the uploads directory structure available in a clean checkout while the upload contents remain ignored.

### Backend user model and OAuth

#### `backend/models/userModel.js`

Why it was changed:

- Added optional `googleId` and `authProvider` fields.
- Allows Google users to exist without a local password.
- Keeps roles limited to `ADMIN` and `GENERAL`.
- Keeps password hashing in the Mongoose save hook.
- Added collision checking for generated registration numbers.

Important bug fixed:

- Google signup previously failed with a duplicate registration number such as `BN1002`.
- The generator now checks MongoDB and advances until it finds an unused number.

Security benefit:

- Google users are always created as `GENERAL`.
- Local passwords remain hashed.

#### `backend/controller/authGoogle.js`

Why it was added:

- Implements Google OAuth 2.0 Authorization Code flow without exposing the client secret to the frontend.
- Redirects users to Google consent.
- Exchanges the authorization code server-side.
- Retrieves the Google profile.
- Finds or creates a local user.
- Links Google to an existing email account.
- Never promotes a Google user to `ADMIN`.
- Issues the application JWT through an HTTP-only cookie.
- Redirects back to the frontend after success or failure.

Runtime verification:

- The OAuth start endpoint successfully redirected to the Google sign-in screen.
- A duplicate registration-number callback error was found and fixed.
- A complete new-user consent and callback test still needs to be performed using a real Google account.

### Frontend files

#### `frontend/src/common/index.js`

Why it was changed:

- Uses `REACT_APP_API_URL` when provided.
- Keeps `http://localhost:8000` as the local default.
- Added the Google OAuth endpoint.
- Restored the shared `baseUrl` alias used by the change-password endpoint.

Security and maintenance benefit:

- Backend URLs can be changed through environment configuration instead of editing every API entry.

#### `frontend/src/utils/api.js`

Why it was added:

- Provides a shared fetch helper.
- Sends `credentials: 'include'` so HTTP-only cookies are included.
- Handles JSON responses and non-success HTTP status codes consistently.

Security benefit:

- Supports the cookie-based authentication design without storing JWTs in local storage.

#### `frontend/src/pages/Login.js`

Why it was changed:

- Added a Continue with Google button.
- Redirects the browser to the backend OAuth start route.
- Handles OAuth error query parameters and displays a clear toast.
- Clears the OAuth error query string after displaying the message.
- Improved normal login error handling and network-error handling.

Why it is needed:

- Gives members a visible Google login entry point.
- Prevents raw OAuth JSON errors from being shown in the browser.

#### `frontend/.env.example`

Why it was added:

- Documents `REACT_APP_API_URL` for frontend configuration.
- Does not contain a secret.

#### `frontend/package-lock.json`

Why it was changed:

- Updated after dependency maintenance commands.

Important audit result:

- The frontend still reports vulnerabilities through old Create React App and transitive dependencies.
- `npm audit fix --force` was not used because npm indicated breaking changes such as replacing `react-scripts` with an invalid/breaking version.
- A future migration from Create React App to a maintained build tool should be planned separately.

## 3. Installed and Updated Packages

Installed in the backend:

```text
helmet
express-rate-limit
```

Commands used:

```powershell
cd backend
npm install helmet express-rate-limit
npm audit fix
```

Frontend dependency maintenance was attempted with:

```powershell
npm audit fix
```

The frontend audit still reports transitive issues because of the legacy `react-scripts` dependency tree. Do not use `npm audit fix --force` without testing a planned dependency migration.

## 4. Validation Performed

Completed checks:

- MongoDB Atlas connection succeeded.
- Backend started successfully on port `8000`.
- Frontend loaded successfully on port `3000`.
- Frontend production build generated `frontend/build/index.html`.
- Changed backend controllers reported no editor errors.
- Backend audit completed with `0 vulnerabilities` after remediation.
- Google OAuth start endpoint reached the Google sign-in page.
- Public signup was changed to force `GENERAL`.
- Admin routes were changed to use server-side authorization.
- JWT query-string support was removed.
- Password hashes were removed from user-list responses.

Expected behavior:

- A logged-out browser may show `401 NO_TOKEN` for the automatic `/api/user-details` request. This is expected and means the protected endpoint rejected a request without a session.
- After successful login, the browser must send the HTTP-only `token` cookie with `/api/user-details`.

## 5. Items You Must Complete

These require your personal information, external accounts, evidence, or Git decisions:

1. Fill in names and student/index numbers in `README.txt`.
2. Add the hardened repository URL.
3. Add the YouTube video URL.
4. Create the report PDF with V1-V8 evidence, OWASP mappings, impact, fixes, and retest results.
5. Capture OWASP ZAP screenshots or reports.
6. Capture curl/Postman evidence showing unauthenticated requests fail with `401` or `403`.
7. Capture successful OAuth screenshots.
8. Complete a new Google member login from consent through callback and database creation.
9. Decide and create the required Git baseline tag and security branch.
10. Make separate logical commits for each vulnerability fix.
11. Remove existing tracked upload PDFs from Git tracking before committing the final work.
12. Rotate the MongoDB password and Google client secret, then update local `backend/.env`.
13. Review the frontend dependency strategy because the remaining audit findings are transitive and tied to Create React App.

## 6. Current Completion Estimate

Technical security implementation: approximately 85%.

Assignment submission requirements: approximately 55%.

Overall implementation plan: approximately 70%.

The percentage is not 100% because the report, evidence, personal submission data, Git commit history, final OAuth end-to-end proof, credential rotation, and frontend dependency migration are still outstanding.

## 7. Safe Commit Preparation

Before committing:

```powershell
cd "C:\Users\user\Desktop\ssd assignment latest\Secure-Software-Development-Assignment-\Library_Management_System"
git status
```

Confirm that these are not staged or tracked:

```text
backend/.env
frontend/.env
real MongoDB credentials
real Google OAuth secrets
uploaded user files
```

Review every diff before creating your own commits. No commit was created during this implementation work.
