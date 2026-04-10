import fs from 'fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import AppError from './AppError.js';

function parseServiceAccountFromEnv() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		try {
			return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
		} catch {
			throw new AppError('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format', 500);
		}
	}

	if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
		try {
			const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
			return JSON.parse(raw);
		} catch {
			throw new AppError('Unable to read FIREBASE_SERVICE_ACCOUNT_PATH file', 500);
		}
	}

	return null;
}

function getFirebaseApp() {
	if (getApps().length > 0) {
		return getApps()[0];
	}

	const serviceAccount = parseServiceAccountFromEnv();

	if (!serviceAccount) {
		throw new AppError(
			'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.',
			500
		);
	}

	return initializeApp({
		credential: cert(serviceAccount),
	});
}

export function getFirebaseAuth() {
	const app = getFirebaseApp();
	return getAuth(app);
}
