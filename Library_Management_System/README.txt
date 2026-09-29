SE4030 - Secure Software Development
Library Management System - Hardened Version

Group Members:
1. <Name> - <Student/Index Number>
2. <Name> - <Student/Index Number>
3. <Name> - <Student/Index Number>
4. <Name> - <Student/Index Number>

Original project:
https://github.com/uvindu-wijesinghe/Library_Management_System

Hardened repository:
<Add your hardened GitHub repository URL>

YouTube demonstration video (maximum 20 minutes):
<Add your YouTube URL>

Application URLs used for the local demonstration:
Frontend: http://localhost:3000
Backend API: http://localhost:8000

Security work completed:
- Added server-side ADMIN authorization middleware.
- Protected administrative user, book, reservation, membership, and e-book APIs.
- Prevented public signup from assigning the ADMIN role.
- Excluded password hashes from user responses.
- Removed JWT query-string authentication and sensitive authentication logging.
- Added Helmet security headers and authentication rate limiting.
- Restricted uploaded image and e-book file types and sizes.
- Added Google OAuth 2.0 Authorization Code login for members.
- Added environment examples without real credentials.

Submission evidence to attach:
- Before and after evidence for vulnerabilities V1-V8.
- OWASP ZAP report or screenshots.
- npm audit output and dependency remediation notes.
- curl or Postman authorization tests.
- OAuth login screenshots.
- Git commit history.
- Individual contribution table.

Important:
Never commit backend/.env, frontend/.env, database passwords, JWT secrets, or Google OAuth client secrets.
