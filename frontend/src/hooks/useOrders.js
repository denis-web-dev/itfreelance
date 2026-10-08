import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrders } from '../services/ordersApi';

/**
 * Хук загрузки заказов с фильтрами.
 * Поддерживает отмену запроса (AbortController) и refetch.
 */
export function useOrders(initialFilters = {}) {
	const [orders, setOrders] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filters, setFilters] = useState(initialFilters);
	const [reloadKey, setReloadKey] = useState(0);
	const abortRef = useRef(null);

	useEffect(() => {
		if (abortRef.current) {
			abortRef.current.abort();
		}

		const controller = new AbortController();
		abortRef.current = controller;

		async function load() {
			setLoading(true);
			setError(null);

			try {
				const res = await getOrders(filters, { signal: controller.signal });

				if (controller.signal.aborted) return;

				if (res.success) {
					setOrders(res.data.items);
					setTotal(res.data.total);
				} else {
					setError('Не удалось загрузить заказы');
				}
			} catch (e) {
				if (e.name === 'AbortError') return;
				setError(e.message || 'Ошибка сети');
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}

		load();

		return () => {
			controller.abort();
		};
	}, [filters, reloadKey]);

	const updateFilters = useCallback((next) => {
		setFilters((prev) => ({ ...prev, ...next }));
	}, []);

	const refetch = useCallback(() => {
		setReloadKey((k) => k + 1);
	}, []);

	return {
		orders,
		total,
		loading,
		error,
		filters,
		updateFilters,
		refetch,
	};
}
