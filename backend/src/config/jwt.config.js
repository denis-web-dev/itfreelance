export const jwtConfig = {
	access: {
		secret: process.env.JWT_ACCESS_SECRET,
		expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
	},
	refresh: {
		secret: process.env.JWT_REFRESH_SECRET,
		expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
	},
};
