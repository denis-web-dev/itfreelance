import * as portfolioService from './portfolio.service.js';

export const listMine = async (req, res, next) => {
	try {
		const items = await portfolioService.listMyItems(req.user.id);
		res.status(200).json({ success: true, data: { items } });
	} catch (error) {
		next(error);
	}
};

export const create = async (req, res, next) => {
	try {
		const item = await portfolioService.createItem(req.user.id, req.body, req.file);
		res.status(201).json({ success: true, message: 'Проект добавлен', data: { item } });
	} catch (error) {
		next(error);
	}
};

export const update = async (req, res, next) => {
	try {
		const item = await portfolioService.updateItem(req.user.id, req.params.id, req.body, req.file);
		res.status(200).json({ success: true, message: 'Проект обновлён', data: { item } });
	} catch (error) {
		next(error);
	}
};

export const remove = async (req, res, next) => {
	try {
		await portfolioService.deleteItem(req.user.id, req.params.id);
		res.status(200).json({ success: true, message: 'Проект удалён' });
	} catch (error) {
		next(error);
	}
};
