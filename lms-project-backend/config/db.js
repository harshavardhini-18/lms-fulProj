import mongoose from 'mongoose';

export async function connectDB() {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error('MONGODB_URI is required in environment variables');
	}

	mongoose.set('strictQuery', true);

	await mongoose.connect(mongoUri, {
		dbName: process.env.MONGODB_DB || undefined,
	});

	console.log(`MongoDB connected: ${mongoose.connection.name}`);
}