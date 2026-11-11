import * as ordersService from './orders.service.js';

export const create = async (req, res, next) => {
	try {
		const order = await ordersService.createOrder(req.user.id, req.body);
		res.status(201).json({ success: true, message: 'Заказ создан', data: { order } });
	} catch (error) {
		next(error);
	}
};

export const list = async (req, res, next) => {
	try {
		const data = await ordersService.listOrders(req.user.id, req.validatedQuery);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const listFavorites = async (req, res, next) => {
	try {
		const data = await ordersService.listFavoriteOrders(req.user.id, req.validatedQuery);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const listMine = async (req, res, next) => {
	try {
		const data = await ordersService.listMyOrders(req.user.id, req.validatedQuery);
		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
};

export const getOne = async (req, res, next) => {
	try {
		const order = await ordersService.viewOrder(req.params.id, req.user);
		res.status(200).json({ success: true, data: { order } });
	} catch (error) {
		next(error);
	}
};

export const respond = async (req, res, next) => {
	try {
		const order = await ordersService.respondToOrder(req.user.id, req.params.id);
		res.status(201).json({ success: true, message: 'Отклик отправлен', data: { order } });
	} catch (error) {
		next(error);
	}
};

export const selectResponse = async (req, res, next) => {
	try {
		const order = await ordersService.selectResponse(
			req.user.id,
			req.params.id,
			req.params.responseId,
		);
		res.status(200).json({ success: true, message: 'Исполнитель выбран', data: { order } });
	} catch (error) {
		next(error);
	}
};

export const rejectResponse = async (req, res, next) => {
	try {
		const order = await ordersService.rejectResponse(
			req.user.id,
			req.params.id,
			req.params.responseId,
		);
		res.status(200).json({ success: true, message: 'Отклик отклонён', data: { order } });
	} catch (error) {
		next(error);
	}
};

export const remove = async (req, res, next) => {
	try {
		await ordersService.deleteOrder(req.user.id, req.params.id);
		res.status(200).json({ success: true, message: 'Заказ удалён' });
	} catch (error) {
		next(error);
	}
};

export const update = async (req, res, next) => {
	try {
		const order = await ordersService.updateOrder(req.user.id, req.params.id, req.body);
		res.status(200).json({ success: true, message: 'Заказ обновлён', data: { order } });
	} catch (error) {
		next(error);
	}
};

export const cancel = async (req, res, next) => {
	try {
		const order = await ordersService.cancelOrder(req.user.id, req.params.id);
		res.status(200).json({ success: true, message: 'Заказ отменён', data: { order } });
	} catch (error) {
		next(error);
	}
};
