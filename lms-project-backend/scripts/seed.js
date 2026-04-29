import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB } from '../config/db.js';
import { Course, User, initializeIndexes } from '../models/index.js';
import { toSlug } from '../models/helpers.js';

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

  // Use the configured email user as admin (ensures test emails can be sent)
  const adminEmail = process.env.EMAIL_USER || 'admin@lms.local';

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
    console.log(`✓ Created admin user: ${adminEmail}`);
  }

  // Create test student accounts with real email domains (for testing password reset)
  const testStudents = [
    { email: 'harshavardhini.cs21@bitsathy.ac.in', fullName: 'Test User', password: 'test123456' },
    { email: 'student1@gmail.com', fullName: 'Test Student 1', password: 'student123' },
    { email: 'student2@outlook.com', fullName: 'Test Student 2', password: 'student123' },
  ];

  // Delete and recreate test students to ensure passwordHash is set
  await User.deleteMany({ 
    email: { $in: testStudents.map(s => s.email.toLowerCase()) }
  });

  for (const student of testStudents) {
    const passwordHash = await hashPassword(student.password);
    await User.create({
      fullName: student.fullName,
      email: student.email,
      passwordHash,
      role: 'student',
      isEmailVerified: true,
      isFirstTime: true,
    });
    console.log(`✓ Created test student: ${student.email}`);
  }

  const hasCourse = await Course.findOne({ createdBy: admin._id });
  const frontendCoursesModule = await import(
    '../../lms-project-try-main/src/data/coursesData.js'
  ).catch(() => null);

  const frontendCourses = frontendCoursesModule?.courses;

  if (Array.isArray(frontendCourses) && frontendCourses.length > 0) {
    for (const c of frontendCourses) {
      const title = String(c?.title || '').trim();
      if (!title) continue;

      const slug = toSlug(title);

      const lessons =
        Array.isArray(c?.lessons) && c.lessons.length > 0
          ? c.lessons.map((l, i) => ({
              title: String(l?.title || `Lesson ${i + 1}`).trim(),
              order: i,
              startSeconds: Number(l?.startSeconds || 0),
              endSeconds: undefined,
              moduleTitle: '',
              resources: [],
            }))
          : [];

      await Course.updateOne(
        { slug },
        {
          $setOnInsert: {
            slug,
            createdBy: admin._id,
          },
          $set: {
            title,
            description: String(c?.description || ''),
            videoUrl: String(c?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'),
            duration: 0,
            lessons,
            updatedBy: admin._id,
          },
        },
        { upsert: true }
      );
    }

    console.log(`Seeded/updated ${frontendCourses.length} frontend courses`);
  } else if (!hasCourse) {
    await Course.create({
      title: 'Intro to LMS Platform',
      slug: toSlug('Intro to LMS Platform'),
      subtitle: 'Sample seeded course',
      description: 'Seeded course for API smoke testing.',
      summary: 'Seed sample',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: 600,
      lessons: [
        {
          title: 'Welcome',
          order: 0,
          startSeconds: 0,
          endSeconds: 120,
          moduleTitle: 'Getting Started',
        },
      ],
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
