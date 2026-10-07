/**
 * Сервис заказов (orders).
 * Сейчас — mock, форма ответа как у будущего бэкенда.
 * Позже заменим на fetch к /api/v1/orders
 */

const MOCK_ORDERS = [
	{
		id: '1',
		title: 'Разработка веб-приложения с админ-панелью',
		budget: 580000,
		rating: 5.0,
		tools: ['React', 'Spring Boot', 'TypeScript', 'PostgreSQL'],
		createdAt: '2025-12-08',
		isFavorite: false,
	},
	{
		id: '2',
		title: 'Full-stack разработка интернет-магазина',
		budget: 420000,
		rating: 4.8,
		tools: ['Vue.js', 'Node.js', 'MySQL', 'Java'],
		createdAt: '2025-12-08',
		isFavorite: false,
	},
	{
		id: '3',
		title: 'Разработка лендинга-визитки',
		budget: 40000,
		rating: 4.6,
		tools: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
		createdAt: '2025-12-08',
		isFavorite: false,
	},
];

/**
 * Задержка с поддержкой AbortSignal
 */
function delay(ms, signal) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);

		if (signal) {
			if (signal.aborted) {
				clearTimeout(timer);
				reject(new DOMException('Aborted', 'AbortError'));
				return;
			}

			signal.addEventListener(
				'abort',
				() => {
					clearTimeout(timer);
					reject(new DOMException('Aborted', 'AbortError'));
				},
				{ once: true },
			);
		}
	});
}

/**
 * Получить список заказов с фильтрами
 * @param {Object} params - budgetMin, budgetMax, tools, minRating, search
 * @param {Object} options - { signal?: AbortSignal }
 */
export async function getOrders(params = {}, { signal } = {}) {
	await delay(300, signal);

	let items = [...MOCK_ORDERS];

	if (params.minRating != null) {
		items = items.filter((o) => o.rating >= Number(params.minRating));
	}

	if (params.search) {
		const q = String(params.search).toLowerCase();
		items = items.filter((o) => o.title.toLowerCase().includes(q));
	}

	if (params.budgetMin != null) {
		items = items.filter((o) => o.budget >= Number(params.budgetMin));
	}

	if (params.budgetMax != null) {
		items = items.filter((o) => o.budget <= Number(params.budgetMax));
	}

	if (params.tools?.length) {
		items = items.filter((o) => params.tools.some((t) => o.tools.includes(t)));
	}

	return {
		success: true,
		data: {
			total: items.length,
			items,
		},
	};
}

/**
 * Переключить избранное (заготовка под API)
 */
export async function toggleFavorite(orderId, { signal } = {}) {
	await delay(200, signal);
	return { success: true, data: { id: orderId } };
}
