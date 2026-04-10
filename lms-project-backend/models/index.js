import User from './User.js';
import Course from './Course.js';
import Quiz from './Quiz.js';

export {
	User,
	Course,
	Quiz,
};

export async function initializeIndexes() {
	await Promise.all([
		User.syncIndexes(),
		Course.syncIndexes(),
		Quiz.syncIndexes(),
	]);
}

