# LMS Backend (Express + MongoDB + Mongoose)

Production-oriented LMS backend scaffold with the requested schema pack:

- `User`
- `Course` (+ lessons)
- `Quiz` (per course + trigger timestamp)

Firebase Admin login support is included for admin authentication.

> JWT is intentionally disabled right now. Protected APIs use `x-user-id` request header.

## Features

- Secure password storage (`scrypt`, no plaintext)
- Quiz safety: `isCorrect` is not sent from quiz fetch endpoints before submission
- Unique quiz enforcement on `(course, triggerTimestampSeconds, status)` for active/inactive records
- Firebase Admin token verification endpoint for admin login
- Optional index sync on boot (`SYNC_INDEXES=true`)

## Environment variables

Create `.env`:

- `PORT=5000`
- `MONGODB_URI=mongodb://127.0.0.1:27017`
- `MONGODB_DB=lms_db`
- `NODE_ENV=development`
- `SYNC_INDEXES=true`
- `FIREBASE_SERVICE_ACCOUNT_JSON={...json...}` or `FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json`
- `FIREBASE_ADMIN_EMAILS=admin1@example.com,admin2@example.com`

## Run

```bash
npm install
npm run dev
```

## Seed sample data

```bash
npm run seed
```

## API groups

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/firebase/admin-login`
- `GET /api/auth/me`
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/quizzes/course/:courseId`
- `GET /api/quizzes/course/:courseId/timestamp/:triggerTimestampSeconds`
