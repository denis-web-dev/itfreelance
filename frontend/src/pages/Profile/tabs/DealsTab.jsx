import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import clsx from 'clsx';
import Button from '../../../components/Button/Button';
import CreateOrderModal from '../../../components/CreateOrderModal/CreateOrderModal';
import OrderCard from '../../../components/OrderCard/OrderCard';
import Pagination from '../../../components/Pagination/Pagination';
import { getAssignedOrders, getMyOrders, getRejectedOrders } from '../../../services/ordersApi';
import styles from './Tabs.module.css';

const SUBTABS = {
	CUSTOMER: [
		{ id: 'active', label: 'Активные' },
		{ id: 'waiting', label: 'Ожидают исполнителя' },
		{ id: 'done', label: 'Завершённые' },
	],
	FREELANCER: [
		{ id: 'active', label: 'Активные' },
		{ id: 'done', label: 'Завершённые' },
		{ id: 'rejected', label: 'Отклонённые' },
	],
};

// Какие статусы заказа входят в каждую вкладку
const CUSTOMER_STATUSES = {
	active: ['IN_PROGRESS'],
	waiting: ['OPEN'],
	done: ['COMPLETED', 'CANCELLED'],
};
const FREELANCER_STATUSES = {
	active: ['IN_PROGRESS'],
	done: ['COMPLETED'],
};

const PAGE_SIZE = 10;

// Нужный запрос для вкладки и роли
const requestFor = (isCustomer, tabId, page, signal) => {
	const params = { page, limit: PAGE_SIZE };
	if (isCustomer) {
		return getMyOrders({ ...params, status: CUSTOMER_STATUSES[tabId] }, { signal });
	}
	if (tabId === 'rejected') return getRejectedOrders(params, { signal });
	return getAssignedOrders({ ...params, status: FREELANCER_STATUSES[tabId] }, { signal });
};

export default function DealsTab() {
	const { user } = useOutletContext();
	const navigate = useNavigate();
	const location = useLocation();
	const isCustomer = user.role === 'CUSTOMER';
	const subtabs = SUBTABS[user.role] ?? SUBTABS.FREELANCER;

	const [activeId, setActiveId] = useState(subtabs[0].id);
	const [page, setPage] = useState(1);
	const [reloadKey, setReloadKey] = useState(0);
	const [list, setList] = useState({ items: [], pages: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isCreateOpen, setCreateOpen] = useState(false);
	// Сообщение может прийти со страницы заказа (после удаления или выбора исполнителя)
	const [notice, setNotice] = useState(location.state?.notice ?? '');

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			setLoading(true);
			setError('');
			try {
				const res = await requestFor(isCustomer, activeId, page, controller.signal);
				setList({ items: res.data.items, pages: res.data.pages });
			} catch (e) {
				if (e.name === 'AbortError') return;
				setError(e.message || 'Не удалось загрузить заказы');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		load();
		return () => controller.abort();
	}, [isCustomer, activeId, page, reloadKey]);

	const selectTab = (id) => {
		setActiveId(id);
		setPage(1);
	};

	const handleCreated = () => {
		setCreateOpen(false);
		setNotice('Заказ опубликован: исполнители увидят его в разделе «Заказы»');
		selectTab('waiting');
		setReloadKey((key) => key + 1);
	};

	return (
		<section className={styles.card}>
			<div className={styles.headingRow}>
				<h2 className={styles.heading}>Сделки</h2>
				{isCustomer && (
					<Button variant="primary" onClick={() => setCreateOpen(true)}>
						+ Добавить заказ
					</Button>
				)}
			</div>

			<div className={styles.subtabs} role="tablist">
				{subtabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={tab.id === activeId}
						className={clsx(styles.subtab, tab.id === activeId && styles.subtabActive)}
						onClick={() => {
							selectTab(tab.id);
							setNotice('');
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{notice && (
				<p className={styles.notice} role="status">
					{notice}
				</p>
			)}

			{loading && <p className={styles.empty}>Загрузка...</p>}
			{error && (
				<p className={styles.error} role="alert">
					{error}
				</p>
			)}
			{!loading && !error && list.items.length === 0 && (
				<p className={styles.empty}>Здесь пока ничего нет</p>
			)}
			{!loading && !error && list.items.length > 0 && (
				<div className={styles.orders}>
					{list.items.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							isOwn={isCustomer}
							isAssigned={!isCustomer}
							statusLabel={!isCustomer && activeId === 'rejected' ? 'Отклонён' : undefined}
							onDetails={(id) => navigate(`/orders/${id}`)}
							onOpenChat={() => setNotice('Чат появится в следующем обновлении')}
						/>
					))}
				</div>
			)}
			{!loading && !error && <Pagination page={page} pages={list.pages} onChange={setPage} />}

			{isCreateOpen && (
				<CreateOrderModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
			)}
		</section>
	);
}
