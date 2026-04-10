import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB } from '../config/db.js';
import { Course, User, initializeIndexes } from '../models/index.js';

dotenv.config();

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      return resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function runSeed() {
  await connectDB();

  if (process.env.SYNC_INDEXES === 'true') {
    await initializeIndexes();
  }

  const adminEmail = 'admin@lms.local';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await hashPassword('admin12345');

    admin = await User.create({
      fullName: 'LMS Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
    });
  }

  const hasCourse = await Course.findOne({ createdBy: admin._id });
  if (!hasCourse) {
    await Course.create({
      title: 'Intro to LMS Platform',
      subtitle: 'Sample seeded course',
      description: 'Seeded course for API smoke testing.',
      summary: 'Seed sample',
      video: {
        provider: 'other',
        url: 'https://example.com/video/intro.mp4',
        durationSeconds: 600,
      },
      lessons: [
        {
          title: 'Welcome',
          order: 0,
          startSeconds: 0,
          endSeconds: 120,
          moduleTitle: 'Getting Started',
        },
      ],
      status: 'published',
      publishedAt: new Date(),
      createdBy: admin._id,
      updatedBy: admin._id,
    });
  }

  console.log('Seed complete');
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
