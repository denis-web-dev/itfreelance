import * as favoritesService from './favorites.service.js';

export const add = async (req, res, next) => {
	try {
		await favoritesService.addFavorite(req.user.id, req.params.id);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};

export const remove = async (req, res, next) => {
	try {
		await favoritesService.removeFavorite(req.user.id, req.params.id);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};
