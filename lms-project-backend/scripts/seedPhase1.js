import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB } from '../config/db.js';
import { Course, Module, User, initializeIndexes } from '../models/index.js';
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

async function runPhase1Seed() {
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
    console.log('✓ Created admin user');
  }

  // Create a sample course with modules and lessons
  const courseTitle = 'React Fundamentals';
  const courseSlug = toSlug(courseTitle);

  let course = await Course.findOne({ slug: courseSlug });
  if (!course) {
    course = await Course.create({
      title: courseTitle,
      slug: courseSlug,
      subtitle: 'Learn React basics and build interactive UIs',
      description: 'A comprehensive course on React fundamentals covering components, hooks, state management, and more.',
      summary: 'Master React from basics to building dynamic applications',
      level: 'beginner',
      language: 'en',
      status: 'published',
      publishedAt: new Date(),
      createdBy: admin._id,
      updatedBy: admin._id,
    });
    console.log(`✓ Created course: ${courseTitle}`);
  }

  // Create Module 1: Getting Started
  const module1Slug = toSlug('Module 1: Getting Started');
  let module1 = await Module.findOne({ course: course._id, slug: module1Slug });
  if (!module1) {
    module1 = await Module.create({
      course: course._id,
      title: 'Module 1: Getting Started with React',
      slug: module1Slug,
      description: 'Introduction to React and its core concepts',
      order: 0,
      lessons: [
        {
          title: 'What is React?',
          order: 0,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 600,
          description: 'Learn what React is and why it\'s used for building UIs',
          resources: [],
        },
        {
          title: 'JSX Basics',
          order: 1,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 900,
          description: 'Understanding JSX syntax and how it works',
          resources: [
            {
              label: 'JSX Documentation',
              url: 'https://react.dev/learn/writing-markup-with-jsx',
            },
          ],
        },
        {
          title: 'Components and Props',
          order: 2,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1200,
          description: 'Creating reusable components and passing data through props',
          resources: [],
        },
      ],
    });
    console.log(`✓ Created Module 1 with 3 lessons`);
  }

  // Create Module 2: State & Hooks
  const module2Slug = toSlug('Module 2: State and Hooks');
  let module2 = await Module.findOne({ course: course._id, slug: module2Slug });
  if (!module2) {
    module2 = await Module.create({
      course: course._id,
      title: 'Module 2: State and Hooks',
      slug: module2Slug,
      description: 'Managing component state and using React hooks',
      order: 1,
      lessons: [
        {
          title: 'useState Hook',
          order: 0,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1200,
          description: 'Learn the useState hook for managing component state',
          resources: [
            {
              label: 'useState Reference',
              url: 'https://react.dev/reference/react/useState',
            },
          ],
        },
        {
          title: 'useEffect Hook',
          order: 1,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1500,
          description: 'Understanding side effects and lifecycle with useEffect',
          resources: [],
        },
        {
          title: 'Custom Hooks',
          order: 2,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1800,
          description: 'Creating reusable custom hooks',
          resources: [],
        },
      ],
    });
    console.log(`✓ Created Module 2 with 3 lessons`);
  }

  // Create Module 3: Advanced Concepts
  const module3Slug = toSlug('Module 3: Advanced Concepts');
  let module3 = await Module.findOne({ course: course._id, slug: module3Slug });
  if (!module3) {
    module3 = await Module.create({
      course: course._id,
      title: 'Module 3: Advanced Concepts',
      slug: module3Slug,
      description: 'Context API, performance optimization, and best practices',
      order: 2,
      lessons: [
        {
          title: 'Context API',
          order: 0,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1500,
          description: 'Global state management with Context API',
          resources: [],
        },
        {
          title: 'Performance Optimization',
          order: 1,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          videoDuration: 1800,
          description: 'Optimizing React applications for better performance',
          resources: [
            {
              label: 'React Performance Guide',
              url: 'https://react.dev/learn/render-and-commit',
            },
          ],
        },
      ],
    });
    console.log(`✓ Created Module 3 with 2 lessons`);
  }

  // Create a student user for testing progress
  const studentEmail = 'student@lms.local';
  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    const passwordHash = await hashPassword('student12345');
    student = await User.create({
      fullName: 'Test Student',
      email: studentEmail,
      passwordHash,
      role: 'student',
      isEmailVerified: true,
    });
    console.log('✓ Created student user');
  }

  console.log('\n✅ Phase 1 seed completed successfully!');
  console.log('\n📚 Course Structure:');
  console.log(`   Course: ${courseTitle}`);
  console.log(`   - Module 1: Getting Started (3 lessons)`);
  console.log(`   - Module 2: State & Hooks (3 lessons)`);
  console.log(`   - Module 3: Advanced Concepts (2 lessons)`);
  console.log('\n👤 Test Users:');
  console.log(`   Admin: ${adminEmail} / admin12345`);
  console.log(`   Student: ${studentEmail} / student12345`);

  process.exit(0);
}

runPhase1Seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
