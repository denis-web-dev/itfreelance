import bcrypt from 'bcryptjs';

// В тестах берём минимальную стоимость хеширования ради скорости
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

export const hashPassword = async (password) => {
	return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
	return bcrypt.compare(password, hash);
};
