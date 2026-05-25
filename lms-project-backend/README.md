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
- `MONGODB_URI=mongodb://127.0.0.1:27017` (local) **or** `mongodb+srv://...` (Atlas)
- `MONGODB_DB=lms_db`

### MongoDB Atlas: “Could not connect / IP isn’t whitelisted”

Your `.env` uses Atlas (`mongodb+srv://...`). Atlas only allows connections from **whitelisted IPs**.

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access**
2. **Add IP Address** → **Add Current IP Address**
3. For dev only (less secure): **Allow Access from Anywhere** → `0.0.0.0/0`
4. Wait ~1 minute, then `node server.js` again

If your Wi‑Fi IP changes often, use “Add Current IP Address” each time or `0.0.0.0/0` for development.

**Local MongoDB instead of Atlas:** install MongoDB locally, then in `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=lms_db
```
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
