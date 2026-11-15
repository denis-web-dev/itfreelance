import * as conversationsService from './conversations.service.js';

export const list = async (req, res, next) => {
	try {
		const items = await conversationsService.listConversations(req.user.id, req.validatedQuery);
		res.status(200).json({ success: true, data: { items } });
	} catch (error) {
		next(error);
	}
};

export const detail = async (req, res, next) => {
	try {
		const conversation = await conversationsService.getConversation(req.user.id, req.params.id);
		res.status(200).json({ success: true, data: { conversation } });
	} catch (error) {
		next(error);
	}
};

export const byOrder = async (req, res, next) => {
	try {
		const data = await conversationsService.openByOrder(req.user.id, req.params.orderId);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const hide = async (req, res, next) => {
	try {
		await conversationsService.hideConversation(req.user.id, req.params.id);
		res.status(200).json({ success: true, message: 'Чат удалён из вашего списка' });
	} catch (error) {
		next(error);
	}
};

export const messages = async (req, res, next) => {
	try {
		const items = await conversationsService.listMessages(
			req.user.id,
			req.params.id,
			req.validatedQuery,
		);
		res.status(200).json({ success: true, data: { items } });
	} catch (error) {
		next(error);
	}
};

export const send = async (req, res, next) => {
	try {
		const message = await conversationsService.sendMessage(req.user.id, req.params.id, req.body);
		res.status(201).json({ success: true, data: { message } });
	} catch (error) {
		next(error);
	}
};

export const read = async (req, res, next) => {
	try {
		await conversationsService.markRead(req.user.id, req.params.id);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};

export const unreadCount = async (req, res, next) => {
	try {
		const data = await conversationsService.countUnread(req.user.id);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};
