import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrders } from '../services/ordersApi';

const PAGE_SIZE = 10;

/**
 * Хук загрузки заказов: фильтры, пагинация, отмена устаревших запросов.
 */
export function useOrders(initialFilters = {}) {
	const { logout } = useAuth(); // внутри хука — правильно

	const [orders, setOrders] = useState([]);
	const [meta, setMeta] = useState({ total: 0, pages: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filters, setFilters] = useState({ page: 1, limit: PAGE_SIZE, ...initialFilters });
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			setLoading(true);
			setError(null);

			try {
				const res = await getOrders(filters, { signal: controller.signal });
				if (controller.signal.aborted) return;

				setOrders(res.data.items);
				setMeta({ total: res.data.total, pages: res.data.pages });
			} catch (e) {
				if (e.name === 'AbortError') return;
				if (e.status === 401) {
					logout();
					return;
				}
				setError(e.message || 'Ошибка сети');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		load();

		return () => controller.abort();
	}, [filters, reloadKey, logout]);

	// При смене фильтров возвращаемся на первую страницу
	const updateFilters = useCallback((next) => {
		setFilters((prev) => ({ ...prev, page: 1, ...next }));
	}, []);

	const setPage = useCallback((page) => {
		setFilters((prev) => ({ ...prev, page }));
	}, []);

	const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

	return {
		orders,
		total: meta.total,
		pages: meta.pages,
		page: filters.page,
		loading,
		error,
		filters,
		updateFilters,
		setPage,
		refetch,
	};
}
