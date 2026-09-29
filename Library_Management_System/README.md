# 📚 Library Management System

A modern web-based Library Management System built to simplify library operations and improve the overall user experience for both staff and members. It streamlines membership management, book cataloging, reservations, e-book handling, fines, authentication, and administrative workflows from a single platform.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Library_Management_System
```

### 2. Install Dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Run the Application
```bash
cd backend
npm run dev
```

```bash
cd frontend
npm start
```

Then access:
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:8000

## 🏛️ Platform Overview
A complete digital library platform featuring:

### Core Modules
- 👤 User registration and login
- 🛡️ Role-based access for admins and members
- 📖 Book collection management
- 📅 Reservation and borrowing workflow
- 📘 E-book upload and viewing
- 💰 Fine tracking and management
- 📊 Admin dashboard and reporting

## ✨ Features

### For Members
- Register and sign in securely
- Browse books and e-books
- Reserve materials
- View personal reservation history
- Access library-related updates

### For Administrators
- Manage users and roles
- Add or update books and e-books
- Monitor reservations and fines
- Oversee library activity through the dashboard

## 🧰 Tech Stack
- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT
- File Handling: Multer, uploads support

## 🏗️ Architecture
```text
Frontend (React) -> Backend API (Express) -> MongoDB Database
```

The application is structured into separate frontend and backend layers, allowing clean routing, API handling, and scalable feature expansion.

## 📦 Project Structure
```text
backend/        # API server and database logic
frontend/       # React UI for users and admins
```

## ⚙️ Environment Setup
Copy `backend/.env.example` to `backend/.env` and set the local values before running the backend. For Google login, configure a Google OAuth Web application with this exact redirect URI:

```text
http://localhost:8000/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `backend/.env`. Set `REACT_APP_API_URL=http://localhost:8000` in `frontend/.env` when using a different backend URL. Never commit either `.env` file.

## 🔐 Security Hardening
- Server-side `ADMIN` authorization protects administrative APIs.
- Public signup always creates `GENERAL` users.
- Password hashes are excluded from user responses.
- JWTs are delivered through an HTTP-only cookie and are not accepted in query strings.
- Helmet security headers and authentication rate limits are enabled.
- Image and e-book uploads have type and size restrictions.
- Google OAuth uses the server-side Authorization Code flow and never promotes OAuth users to `ADMIN`.

The assignment submission checklist and editable member information are in `README.txt`. Evidence such as ZAP reports, curl/Postman results, and the report PDF must be added before submission.

## 📝 Usage
Once the app is running, users can:
- create accounts
- log in securely
- browse and manage books
- place reservations
- access uploaded e-books
- interact with admin controls

## 🤝 Contributing
Contributions are welcome. Feel free to fork the repository, create a feature branch, and submit a pull request.

## 📄 License
This project is open-source and available for educational and development purposes.

## 📞 Support
For questions or issues, please contact the project maintainer or open an issue in the repository.
