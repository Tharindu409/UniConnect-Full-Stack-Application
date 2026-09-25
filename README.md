# UniConnect

UniConnect is a full-stack university community platform built with the MERN stack. It helps students connect with clubs, manage events, track skills and achievements, explore projects, and participate in campus life through a single web application.

The platform includes student-facing features such as profile management, club membership, event registration, mentorship, project sharing, and news updates, alongside admin tools for moderation and club administration.

## Features

- Student authentication and role-based access
- Student profiles with academic and personal details
- Skill and badge/certificate management
- Club creation, membership, and management
- Event calendar and event registration flow
- Mentorship and mentor matching support
- News and project publishing features
- Admin dashboard for oversight and club administration
- Budget and expense tracking for clubs and events
- Password reset and email-based account communication

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| Email | Nodemailer |
| File Uploads | Multer |
| Scheduling | node-cron |

## Project Structure

```text
.
├── backend/
│   ├── app.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── images/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── README.md
├── index.js
└── package.json
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 18+ installed
- npm installed
- MongoDB instance running locally or remotely
- A valid email account for SMTP/Gmail-based notifications

## Environment Variables

Create a `.env` file inside the `backend` folder with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/uniconnect
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:5173
BACKEND_PUBLIC_URL=http://localhost:5000

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

RESET_EMAIL_USER=your_email@example.com
RESET_EMAIL_PASS=your_email_app_password
```

Notes:

- `MONGODB_URI` can also be named `MONGO_URI` because the app accepts either.
- For Gmail, use an App Password instead of your regular password.
- `JWT_SECRET` should be a long random secret string in production.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Tharindu409/UniConnect-Full-Stack-Application.git
cd UniConnect-Full-Stack-Application
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the backend

```bash
cd backend
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Application Workflow

- Students can register and log in to their accounts.
- Users can manage personal profiles, skills, and achievement records.
- Club admins can create clubs and manage memberships.
- Students can browse campus events and register for them.
- News, project, and analytics pages support campus engagement.
- Administrators can monitor club activity and manage system operations.

## Available Roles

The application uses role-based access for common university workflows:

- `STUDENT`
- `CLUB_ADMIN`
- `SYSTEM_ADMIN`

## Scripts

### Backend

```bash
npm start
npm run dev
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Production Notes

- Use a real MongoDB deployment such as MongoDB Atlas for production.
- Store secrets securely in environment variables or a deployed secret manager.
- Set `FRONTEND_URL` and `BACKEND_PUBLIC_URL` correctly in hosted environments.
- Use a production-ready web server and reverse proxy when deploying.

## Contributing

Contributions are welcome. If you want to improve the app:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request with a clear summary.

 
