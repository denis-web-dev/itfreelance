import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Защита маршрутов на стороне интерфейса.
 * roles: если передан, доступ только этим ролям.
 * Настоящую проверку прав всегда делает сервер, это только удобство для пользователя.
 */
export default function ProtectedRoute({ roles }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) return null;

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (roles && !roles.includes(user.role)) {
		return <Navigate to="/orders" replace />;
	}

	return <Outlet />;
}
