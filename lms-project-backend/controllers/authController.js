import asyncHandler from '../utils/asyncHandler.js';
import {
	createUserByAdmin,
	firebaseAdminLogin,
	getUserById,
	loginUser,
	registerUser,
} from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
	const user = await registerUser(req.body);
	res.status(201).json({ success: true, data: user });
});

export const login = asyncHandler(async (req, res) => {
	const user = await loginUser(req.body);
	res.json({ success: true, data: user });
});

export const me = asyncHandler(async (req, res) => {
	const user = await getUserById(req.user._id);
	res.json({ success: true, data: user });
});

export const firebaseAdminSignIn = asyncHandler(async (req, res) => {
	const { user, firebaseUid } = await firebaseAdminLogin(req.body.idToken);
	res.json({ success: true, data: { user, firebaseUid } });
});

export const adminCreateUser = asyncHandler(async (req, res) => {
	const result = await createUserByAdmin(req.body);
	res.status(201).json({ success: true, data: result });
});

