import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearTokens } from '../services/tokens';

const AuthContext = createContext(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth должен использоваться внутри AuthProvider');
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadUser = async () => {
			try {
				// ========== СЕЙЧАС (localStorage) ==========
				const savedUser = localStorage.getItem('user');
				if (savedUser) {
					setUser(JSON.parse(savedUser));
				}

				// ========== ПОТОМ (запрос к бэкенду) ==========
				// Раскомментируешь и удалишь кусок выше:
				//
				// const response = await fetch('/api/auth/me', {
				//   credentials: 'include', // если используешь cookie
				// });
				//
				// if (response.ok) {
				//   const data = await response.json();
				//   setUser(data.user);
				// } else {
				//   setUser(null);
				//   localStorage.removeItem('user');
				// }
			} catch (e) {
				console.error('Ошибка загрузки пользователя:', e);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		loadUser();
	}, []);

	const updateUser = useCallback((newData) => {
		setUser((prev) => {
			const updated = { ...prev, ...newData };
			localStorage.setItem('user', JSON.stringify(updated));
			return updated;
		});
	}, []);

	const login = useCallback((userData) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
	}, []);

	const logout = useCallback(() => {
		setUser(null);
		localStorage.removeItem('user');
		clearTokens();
	}, []);

	return (
		<AuthContext.Provider value={{ user, setUser, updateUser, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};
