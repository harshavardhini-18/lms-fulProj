import User from './User.js';
import Course from './Course.js';
import Quiz from './Quiz.js';
import CourseProgress from './CourseProgress.js';
import Note from './Note.js';
import ExcalidrawAsset from './ExcalidrawAsset.js';
import RefreshToken from './RefreshToken.js';
import QuizAttempt from './QuizAttempt.js';

export {
	User,
	Course,
	Quiz,
	CourseProgress,
	Note,
	ExcalidrawAsset,
	RefreshToken,
	QuizAttempt,
};

export async function initializeIndexes() {
	await Promise.all([
		User.syncIndexes(),
		Course.syncIndexes(),
		Quiz.syncIndexes(),
		CourseProgress.syncIndexes(),
		Note.syncIndexes(),
		ExcalidrawAsset.syncIndexes(),
		RefreshToken.syncIndexes(),
		QuizAttempt.syncIndexes(),
	]);
}

