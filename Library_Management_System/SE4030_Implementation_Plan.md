# SE4030 – Secure Software Development  
## Implementation Plan: Library Management System

**Marks:** 25 | **Group size:** 4  
**Application:** Library Management System (MERN)  
**Original repo:** https://github.com/uvindu-wijesinghe/Library_Management_System  
**Last original commit (pre-hardening):** `19d6f96` — use this as the “before” baseline for the report

---

## 1. Why this application is suitable

| Criterion | Assessment |
|-----------|------------|
| Not a teaching vulnerable app | Not DVWA / WebGoat / DVNA / DIVA — real library domain app |
| Scope & complexity | Users, roles, books, reservations, membership slips, e-books, file uploads, admin panel |
| ≥7 distinct vulnerabilities | Organic OWASP-style issues already present (see §4) |
| OAuth / OIDC | No OAuth today; “Sign in with Google” is a natural new feature |
| Fix commit history | Thin history (3 commits) → clean “one fix per commit” narrative |

**Tech stack**

- Frontend: React 19, Redux Toolkit, React Router, Tailwind, Axios  
- Backend: Node.js, Express 4  
- Database: MongoDB + Mongoose  
- Auth today: Email/password + JWT (cookie + response body)  
- Uploads: Multer → `backend/uploads/`

---

## 2. Assignment deliverables (checklist)

| # | Deliverable | Owner | Status |
|---|-------------|-------|--------|
| 1 | `README.txt` — member names, index numbers, original GitHub link, hardened repo link, YouTube link | All | ☐ |
| 2 | Report PDF — vulns, fixes, unfixed + reasons, secure SDLC practices | All | ☐ |
| 3 | Hardened GitHub repo with **detailed commit messages** | All | ☐ |
| 4 | YouTube video ≤ 20 min (demo vulns + fixes + OAuth) | Presenter(s) | ☐ |
| 5 | Single ZIP uploaded to CourseWeb (README + PDF + any required extras) | Lead | ☐ |

### 2.1 README.txt template (fill before submission)

```text
SE4030 – Secure Software Development
Library Management System – Hardened Version

Group Members:
1. <Name> – <Index Number>
2. <Name> – <Index Number>
3. <Name> – <Index Number>
4. <Name> – <Index Number>

Original project (before security fixes):
https://github.com/uvindu-wijesinghe/Library_Management_System

Modified / hardened project:
https://github.com/<org-or-user>/<hardened-repo-name>

YouTube video (max 20 minutes):
https://youtube.com/<link>
```

---

## 3. Repository & process strategy

### 3.1 Recommended Git workflow

1. **Fork or create a new private/public repo** for the *hardened* submission (keep original as reference).  
2. Tag the insecure baseline: `git tag v0-insecure-baseline`.  
3. Create branch `security-hardening`.  
4. **One logical fix = one commit** with a clear message (required by the brief).  
5. Final merge to `main` with OAuth feature commits at the end.

### 3.2 Commit message style (examples)

```text
fix(authz): require admin auth on GET /api/all-users and strip password hashes
fix(authz): protect book CRUD and delete-user with authToken + adminOnly
fix(auth): prevent role mass-assignment on signup and update-user
fix(auth): stop accepting JWT from query string and remove token from login JSON
fix(upload): restrict image MIME types and file size for Multer uploads
chore(security): stop tracking .env; add root .gitignore and .env.example
fix(config): add helmet, rate limiting on /signin, and tighten CORS
feat(oauth): add Google OAuth 2.0 authorization-code login for members
```

### 3.3 Suggested testing tools (black box + white box)

| Tool | Type | Use for |
|------|------|---------|
| **OWASP ZAP** | Black box | Crawl/scan login, APIs, headers, cookie flags |
| **Burp Suite Community** / browser DevTools | Black box | Replay requests without cookies; IDOR tests |
| **Postman / curl** | Manual | Prove missing auth on `/api/all-users`, book DELETE, etc. |
| **npm audit** / **OWASP Dependency-Check** | White box | Vulnerable dependencies |
| **Code review** (manual) | White box | Auth middleware, Multer, role checks |
| Optional: **semgrep** / **ESLint security plugins** | White box | Static patterns |

Document tool screenshots (ZAP alerts, Postman 200 without token) in the report appendix.

---

## 4. Vulnerability inventory (target: 8 findings — fix ≥7)

Frame each as a **distinct** OWASP/CWE item even when several relate to access control.

### V1 — Broken Access Control: unauthenticated sensitive data exposure  
**OWASP:** A01:2021 Broken Access Control | **CWE-306** Missing Authentication  

| | |
|--|--|
| **Evidence** | `GET /api/all-users` has **no** `authToken` and returns full user documents (incl. password hashes) |
| **Files** | `backend/routes/index.js` (~L122), `backend/controller/allUsers.js` |
| **PoC** | `curl http://localhost:<port>/api/all-users` → 200 + user list without login |
| **Fix** | Add `authToken` + `adminOnly`; project fields to exclude `password` |
| **Commit** | `fix(authz): protect all-users endpoint and hide password hashes` |
| **Member** | M1 |

---

### V2 — Broken Access Control: unauthenticated destructive / admin APIs  
**OWASP:** A01 | **CWE-306**  

| | |
|--|--|
| **Evidence** | `DELETE /api/delete-user/:id`, `POST/PUT/DELETE /api/books` have no authentication |
| **Files** | `backend/routes/index.js` (book routes L57–61, delete-user L124), controllers |
| **PoC** | Delete a book or user with curl and no `Authorization` header |
| **Fix** | `authToken` + `adminOnly` on all mutating admin routes |
| **Commit** | `fix(authz): require admin auth for user delete and book mutations` |
| **Member** | M1 |

---

### V3 — Privilege escalation / mass assignment of `role`  
**OWASP:** A01 | **CWE-915** Improperly Controlled Modification of Dynamically-Determined Object Attributes  

| | |
|--|--|
| **Evidence** | Signup accepts `role` from body (`userSignup.js`); `updateUser` allows any authenticated user to set `role` / update any `userId` |
| **Files** | `backend/controller/userSignup.js`, `backend/controller/updateUser.js`, frontend `AddUser.js` |
| **PoC** | `POST /api/signup` with `"role":"ADMIN"`; or authenticated GENERAL user updates another user’s role |
| **Fix** | Force `role: 'GENERAL'` on public signup; only ADMIN may set role / update other users; self-update limited fields |
| **Commit** | `fix(auth): block role mass-assignment on signup and update-user` |
| **Member** | M2 |

---

### V4 — Missing function-level authorization (authenticated but not admin)  
**OWASP:** A01 | **CWE-285** Improper Authorization  

| | |
|--|--|
| **Evidence** | Membership approve/list, all reservations, e-book add/update/delete use `authToken` only — any logged-in GENERAL user can call them. Existing `helpers/permission.js` is unused, broken (no `await`), and leftover from another domain |
| **Files** | `backend/routes/index.js`, `membershipController.js`, `bookReservationController.js`, `eBookController.js`, `helpers/permission.js` |
| **PoC** | Login as GENERAL → `POST /api/approve-membership` or `GET /api/all-reservations` |
| **Fix** | Implement working `adminOnly` middleware; apply to admin-only routes; keep member-only routes scoped to `req.userId` |
| **Commit** | `fix(authz): add adminOnly middleware and enforce on admin APIs` |
| **Member** | M2 |

---

### V5 — Sensitive data exposure & insecure JWT handling  
**OWASP:** A02 Cryptographic Failures / A07 Identification & Authentication Failures | **CWE-598**, **CWE-532**  

| | |
|--|--|
| **Evidence** | JWT returned in JSON body *and* cookie; token accepted via `?token=` query (leaks in logs/Referer); verbose logging of headers/body/token in `authToken.js` and debug middleware |
| **Files** | `backend/controller/userSignin.js`, `backend/middleware/authToken.js`, `backend/index.js` |
| **PoC** | Inspect login response for `data.token`; call API with `?token=...` |
| **Fix** | Prefer httpOnly cookie only (or document Bearer-only and stop dual leakage); **remove query-string token**; remove/redact sensitive logs; set secure cookie flags for production |
| **Commit** | `fix(auth): harden JWT delivery and remove query-token + verbose auth logs` |
| **Member** | M3 |

---

### V6 — Security misconfiguration  
**OWASP:** A05 Security Misconfiguration | **CWE-16**  

| | |
|--|--|
| **Evidence** | No Helmet; `/uploads` publicly served; no rate limiting; CORS relies on env (typo risk `FONTEND_URL` elsewhere); hard-coded `http://localhost:8000` in frontend API base; debug middleware logs request bodies |
| **Files** | `backend/index.js`, `frontend/src/common/index.js`, env files |
| **PoC** | ZAP passive scan → missing security headers; open `/uploads/<file>` without auth |
| **Fix** | Add `helmet`; rate-limit `/api/signin` (and optionally `/signup`); env-based API URL; restrict static upload access where feasible; remove debug body logging |
| **Commit** | `fix(config): add helmet, rate limits, and tighten CORS/static config` |
| **Member** | M3 |

---

### V7 — Unrestricted / insecure file upload  
**OWASP:** A04 Insecure Design / A03 Injection-related risk | **CWE-434** Unrestricted Upload of File with Dangerous Type  

| | |
|--|--|
| **Evidence** | `uploadMiddleware.js` — no MIME/extension whitelist, no size limit (unlike `ebookUpload.js`) |
| **Files** | `backend/middleware/uploadMiddleware.js`, membership/book upload routes |
| **PoC** | Upload `.html` / `.js` / large file to membership slip or book image endpoint |
| **Fix** | Allow only image MIME types (`image/jpeg`, `image/png`, `image/webp`); size limit (e.g. 2–5 MB); randomize filenames; optionally serve uploads with `Content-Disposition: attachment` / non-executable |
| **Commit** | `fix(upload): restrict MIME types and size for Multer image uploads` |
| **Member** | M4 |

---

### V8 — Secrets & configuration hygiene  
**OWASP:** A02 / A05 | **CWE-798**, **CWE-200**  

| | |
|--|--|
| **Evidence** | `backend/.env` tracked / present in workspace; no solid root `.gitignore` for secrets; weak placeholder secrets if used as-is |
| **Files** | `backend/.env`, missing root `.gitignore`, need `.env.example` |
| **PoC** | Clone repo → secrets visible in history/files |
| **Fix** | Root `.gitignore` for `.env`, `node_modules`, `uploads/*`; commit `.env.example` only; **rotate** any real keys; document setup in README |
| **Commit** | `chore(security): untrack secrets and add .env.example + .gitignore` |
| **Member** | M4 |

---

### Optional extras (if time / for report depth)

| ID | Issue | Notes |
|----|--------|-------|
| V9 | Weak authentication controls | Min password length 6; no rate limit (covered partly in V6); user enumeration (“User Not Found” vs invalid password) in `userSignin.js` |
| V10 | CSRF | Cookie session + `credentials: 'include'` without CSRF tokens — discuss SameSite + CSRF token if cookie-only auth kept |
| V11 | Client-only admin UI gate | `AdminPanel.js` redirect is not security — reinforce that server checks (V1–V4) are the real control |

---

## 5. Implementation plan — fixes (ordered)

Do fixes in this order so later work builds on auth middleware.

```text
Phase A  Baseline & tools
Phase B  AuthZ core (V1, V2, V4) + role hardening (V3)
Phase C  JWT / logging / uploads / secrets / config (V5–V8)
Phase D  OAuth / OIDC feature
Phase E  Retest, report, video, README
```

### Phase A — Baseline (Week 1)

1. Clone original; tag `v0-insecure-baseline`.  
2. Run app locally; create GENERAL + ADMIN test users.  
3. Capture PoCs for V1–V8 (screenshots / curl output).  
4. Run OWASP ZAP baseline scan; save HTML/PDF report.  
5. Run `npm audit` in `backend/` and `frontend/`.  
6. Create hardened remote repo; push baseline tag.

### Phase B — Authorization (Week 1–2)

1. **Create middleware** `backend/middleware/adminOnly.js`:
   - Load user by `req.userId`; require `role === 'ADMIN'`; return 403 otherwise.
2. Fix / replace broken `helpers/permission.js` (or delete and use `adminOnly` only).
3. Apply routes:

| Route | Middleware after fix |
|-------|----------------------|
| `GET /all-users` | `authToken`, `adminOnly` |
| `POST /update-user` | `authToken`, `adminOnly` (or self-update path without role) |
| `DELETE /delete-user/:id` | `authToken`, `adminOnly` |
| `POST/PUT/DELETE /books` | `authToken`, `adminOnly` |
| `POST /approve-membership` | `authToken`, `adminOnly` |
| `GET /pending-memberships` | `authToken`, `adminOnly` |
| `GET /all-reservations` | `authToken`, `adminOnly` |
| `PUT /reservation-status/:id` | `authToken`, `adminOnly` |
| `POST/PUT/DELETE /e-books` | `authToken`, `adminOnly` |

4. `allUsers.js`: `.select('-password')` (or explicit safe fields).  
5. Signup: ignore client `role`; always `GENERAL`. Only admin “Add User” may set role via a separate protected endpoint.  
6. Commit separately per vulnerability (V1, V2, V3, V4).

### Phase C — Session, uploads, config (Week 2)

1. Remove `req.query.token` from `authToken.js`.  
2. Decide JWT strategy (recommended for report clarity):
   - **Option A (preferred):** httpOnly cookie only; do not put JWT in JSON body.  
   - **Option B:** Bearer token in memory (frontend); no query string; cookie optional.  
3. Strip sensitive `console.log` of tokens/passwords/bodies.  
4. Harden Multer (`fileFilter` + `limits.fileSize`).  
5. Add `helmet`, `express-rate-limit` on `/api/signin`.  
6. Root `.gitignore` + `.env.example`; remove `.env` from tracking.  
7. Retest all PoCs → should fail (401/403) or be blocked.

### Phase D — OAuth / OpenID Connect (Week 2–3)

See §6.

### Phase E — Documentation & submission (Week 3–4)

1. Write report PDF (§8).  
2. Record YouTube demo (§9).  
3. Fill `README.txt`.  
4. Zip and submit.

---

## 6. OAuth / OpenID Connect feature plan

### 6.1 Goal (product feature)

**“Sign in with Google”** for library members using OAuth 2.0 **Authorization Code** flow (OIDC ID token optional for profile claims). After successful IdP login, create/link a local user and issue the app’s existing session (JWT cookie).

### 6.2 Provider

| Choice | Pros |
|--------|------|
| **Google OAuth** (recommended) | Free, well documented, quick for demo |
| Facebook | Similar; slightly more app review friction |
| WSO2 IS / Keycloak | Good if you want self-hosted IdP story for the report |

**Recommendation:** Google + Authorization Code + server-side token exchange.

### 6.3 High-level flow

```text
[React Login] → "Continue with Google"
       → Backend GET /api/auth/google  (redirect to Google)
       → User consents
       → Google redirects to Backend GET /api/auth/google/callback?code=...
       → Exchange code for tokens (client_secret stays on server)
       → Find or create user (email from Google profile)
       → Set role = GENERAL (never ADMIN from IdP alone)
       → Issue app JWT httpOnly cookie
       → Redirect to frontend /home (or /login-success)
```

### 6.4 Backend work

| Item | Detail |
|------|--------|
| Packages | `passport`, `passport-google-oauth20` **or** manual OAuth with `axios` + `google-auth-library` |
| Env vars | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL` |
| User model | Add optional fields: `googleId`, `authProvider: 'local' \| 'google'`; make `password` not required when `googleId` set |
| Routes | `GET /api/auth/google`, `GET /api/auth/google/callback` |
| Linking | If email already exists with local account → link `googleId` or show “account exists, login with password” (document chosen policy) |
| Admin | Do **not** auto-promote Google users to ADMIN |

### 6.5 Frontend work

| Item | Detail |
|------|--------|
| Login / SignUp pages | “Continue with Google” button → `window.location = API + '/auth/google'` |
| Session | After redirect, call existing `/api/user-details` with credentials to load Redux user state |
| UX | Show toast on success/failure |

### 6.6 Google Cloud Console setup (demo)

1. Create OAuth 2.0 Client ID (Web application).  
2. Authorized redirect URI: `http://localhost:<backend-port>/api/auth/google/callback`.  
3. For video/demo, use localhost; document production URI separately.  
4. Never commit client secret.

### 6.7 Commits for OAuth

```text
feat(oauth): add googleId to user model and env example
feat(oauth): implement Google OAuth authorization-code routes
feat(ui): add Sign in with Google button on Login page
docs: document Google OAuth setup in README
```

### 6.8 Report talking points

- Why Authorization Code (not Implicit).  
- Why client secret stays on server.  
- How local JWT session still applies after IdP login.  
- How this reduces password-related risk for members.

---

## 7. Vulnerabilities intentionally left unfixed (example — adjust in report)

Pick **1–2** that you can justify honestly:

| Vuln | Why not fully fixed |
|------|---------------------|
| Full CSRF token framework | Mitigated partially via SameSite cookies + JSON API; full double-submit CSRF is larger refactor than sprint allows |
| HTTPS enforcement / HSTS in production | Local demo uses HTTP; document as deployment responsibility |
| Complete private storage for all uploads (S3 + signed URLs) | Requires cloud infra beyond assignment scope; mitigated with MIME checks + auth on mutate |

State clearly: residual risk + recommended future work.

---

## 8. Report outline (PDF)

1. **Title page** — module, group, indexes, date  
2. **Introduction** — app purpose, why selected, original vs hardened links  
3. **System overview** — architecture diagram, features, tech stack  
4. **Methodology** — white box vs black box; tools (ZAP, npm audit, manual)  
5. **Vulnerabilities found** — for each V1–V8:
   - Description & OWASP mapping  
   - Location (file/route)  
   - Impact  
   - Evidence (screenshot / request)  
   - Fix applied (or “not fixed”)  
   - Retest result  
6. **Unfixed vulnerabilities & reasons**  
7. **OAuth / OIDC implementation** — design, flow diagram, screenshots  
8. **Secure software engineering practices** that could have prevented issues:
   - Threat modeling / STRIDE early  
   - Secure coding standards (OWASP ASVS)  
   - Mandatory code review for authZ  
   - CI: dependency scanning, secret scanning  
   - Least privilege & server-side authorization always  
   - Security testing in Definition of Done  
9. **Individual contributions** — table per member  
10. **Conclusion**  
11. **References** — OWASP Top 10, ZAP, Dependency-Check, Google OAuth docs  
12. **Appendix** — ZAP reports, curl logs, commit list (`git log --oneline`)

---

## 9. YouTube video outline (≤ 20 minutes)

| Time | Segment |
|------|---------|
| 0:00–1:00 | Intro: team, app, assignment goals |
| 1:00–3:00 | App demo (happy path: login, books, admin) |
| 3:00–12:00 | **Vulnerabilities:** show PoC → show fix → retest (pick strongest 5–6 live; summarize rest) |
| 12:00–16:00 | **OAuth:** Google consent → callback → logged-in member |
| 16:00–18:00 | Tools used (ZAP snippet), unfixed items |
| 18:00–20:00 | Commit history walkthrough + closing |

Tip: Record PoCs before fixing (or use `v0-insecure-baseline` checkout) so demos are reproducible.

---

## 10. Suggested work split (4 members)

| Member | Primary ownership |
|--------|-------------------|
| **M1** | V1, V2 — unauthenticated endpoints; ZAP scan lead; PoC scripts |
| **M2** | V3, V4 — role escalation + `adminOnly`; permission middleware tests |
| **M3** | V5, V6 — JWT hardening, Helmet, rate limit, logging cleanup |
| **M4** | V7, V8 — uploads, `.gitignore`/secrets; **OAuth feature** + Google Console setup |
| **All** | Report sections for own vulns; peer-review each other’s commits; video narration split |

Adjust names/indexes when known.

---

## 11. Concrete code targets (quick reference)

```text
backend/
  routes/index.js              ← add authToken + adminOnly to routes
  middleware/authToken.js      ← remove query token; reduce logging
  middleware/adminOnly.js      ← NEW
  middleware/uploadMiddleware.js ← MIME + size limits
  controller/userSignup.js     ← force GENERAL role
  controller/userSignin.js     ← cookie/token policy; generic errors
  controller/allUsers.js       ← exclude password; assumes admin route
  controller/updateUser.js     ← admin-only role changes
  controller/authGoogle.js     ← NEW (OAuth)
  helpers/permission.js        ← fix or remove
  index.js                     ← helmet, rate limit, less debug logging
  .env.example                 ← NEW (no secrets)
frontend/
  src/pages/Login.js           ← Google button
  src/common/index.js          ← env-based API URL
.gitignore                     ← NEW at repo root
README.txt                     ← submission deliverable
```

---

## 12. Acceptance criteria (definition of done)

- [ ] ≥7 distinct vulnerabilities documented with before/after evidence  
- [ ] Each major fix has its **own commit** with a descriptive message  
- [ ] Admin APIs reject unauthenticated and non-admin callers (401/403)  
- [ ] Public signup cannot create ADMIN  
- [ ] Password hashes never returned from `/all-users`  
- [ ] JWT not accepted from query string  
- [ ] Uploads reject non-image / oversized files  
- [ ] `.env` not in repo; `.env.example` present  
- [ ] Google OAuth login works end-to-end for a new member  
- [ ] Report PDF + README.txt + YouTube link complete  
- [ ] Hardened GitHub link works and history is reviewable  

---

## 13. Rough timeline (4 weeks)

| Week | Focus |
|------|--------|
| **1** | Baseline tag, PoCs, ZAP, npm audit, start V1–V4 fixes |
| **2** | Finish V1–V8 fixes; start Google OAuth |
| **3** | Complete OAuth; retest; draft report chapters |
| **4** | Polish report, record video, finalize README, ZIP submit |

---

## 14. Risk notes

- **Do not push real Google client secrets or MongoDB URIs.** Use `.env` locally only.  
- If `.env` was ever committed with real secrets, **rotate** them and purge from history if the repo is/was public.  
- Keep admin bootstrap: seed one ADMIN manually in MongoDB or via a one-time secure script (documented), never via open signup.  
- Frontend-only role checks are **not** fixes — graders will test APIs directly.

---

## 15. References (for report)

1. https://owasp.org/www-project-top-ten/  
2. https://owasp.org/www-project-web-security-testing-guide/  
3. https://www.zaproxy.org/  
4. https://owasp.org/www-project-dependency-check/  
5. https://developers.google.com/identity/protocols/oauth2  
6. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html  
7. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html  
8. https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html  

---

*Document version: 1.0 — Implementation plan for SE4030 Library Management System hardening + OAuth.*
