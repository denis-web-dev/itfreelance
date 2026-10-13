import * as profileService from './profile.service.js';

export const getMe = async (req, res, next) => {
	try {
		const data = await profileService.getMyProfile(req.user.id);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const updateMe = async (req, res, next) => {
	try {
		const data = await profileService.updateMyProfile(req.user.id, req.body);
		res.status(200).json({ success: true, message: 'Профиль обновлён', data });
	} catch (error) {
		next(error);
	}
};
