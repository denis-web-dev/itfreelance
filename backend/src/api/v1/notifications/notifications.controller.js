import * as notificationsService from './notifications.service.js';

export const list = async (req, res, next) => {
	try {
		const data = await notificationsService.listNotifications(req.user.id, req.validatedQuery);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const read = async (req, res, next) => {
	try {
		await notificationsService.markRead(req.user.id, req.params.id);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};

export const readAll = async (req, res, next) => {
	try {
		await notificationsService.markAllRead(req.user.id);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};
