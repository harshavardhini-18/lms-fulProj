import mongoose from 'mongoose';

async function fetchPublicIp() {
	try {
		const res = await fetch('https://api.ipify.org?format=json', {
			signal: AbortSignal.timeout(4000),
		});
		const data = await res.json();
		return data?.ip || null;
	} catch {
		return null;
	}
}

function atlasWhitelistHint(ip) {
	const lines = [
		'MongoDB Atlas blocked this connection (Network Access / IP whitelist).',
		'Fix: https://cloud.mongodb.com → your project → Network Access → Add IP Address',
	];
	if (ip) {
		lines.push(`Add this IP: ${ip}  (or use "Add Current IP Address")`);
	} else {
		lines.push('Click "Add Current IP Address", or for local dev only: Allow Access from Anywhere (0.0.0.0/0).');
	}
	lines.push('Wait ~1 minute after saving, then run: node server.js');
	return lines.join('\n');
}

export async function connectDB() {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error('MONGODB_URI is required in environment variables');
	}

	mongoose.set('strictQuery', true);

	try {
		await mongoose.connect(mongoUri, {
			dbName: process.env.MONGODB_DB || undefined,
			serverSelectionTimeoutMS: 10000,
		});
	} catch (err) {
		const msg = String(err?.message || err);
		const isAtlas = mongoUri.startsWith('mongodb+srv://') || /whitelist|Server selection timed out/i.test(msg);
		if (isAtlas) {
			const ip = await fetchPublicIp();
			throw new Error(`${msg}\n\n${atlasWhitelistHint(ip)}`);
		}
		throw err;
	}

	console.log(`MongoDB connected: ${mongoose.connection.name}`);
}