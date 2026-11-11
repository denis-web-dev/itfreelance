import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import clsx from 'clsx';
import Button from '../../../components/Button/Button';
import CreateOrderModal from '../../../components/CreateOrderModal/CreateOrderModal';
import OrderCard from '../../../components/OrderCard/OrderCard';
import Pagination from '../../../components/Pagination/Pagination';
import { getMyOrders } from '../../../services/ordersApi';
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

// Какие статусы заказа входят в каждую вкладку заказчика
const CUSTOMER_STATUSES = {
	active: ['IN_PROGRESS'],
	waiting: ['OPEN'],
	done: ['COMPLETED', 'CANCELLED'],
};

const PAGE_SIZE = 10;

export default function DealsTab() {
	const { user } = useOutletContext();
	const isCustomer = user.role === 'CUSTOMER';
	const subtabs = SUBTABS[user.role] ?? SUBTABS.FREELANCER;

	const [activeId, setActiveId] = useState(subtabs[0].id);
	const [page, setPage] = useState(1);
	const [reloadKey, setReloadKey] = useState(0);
	const [list, setList] = useState({ items: [], pages: 0 });
	const [loading, setLoading] = useState(isCustomer);
	const [error, setError] = useState('');
	// null: окно закрыто; { orderId: null }: создание; { orderId }: редактирование
	const [modal, setModal] = useState(null);
	const [notice, setNotice] = useState('');

	useEffect(() => {
		if (!isCustomer) return;
		const controller = new AbortController();

		async function load() {
			setLoading(true);
			setError('');
			try {
				const res = await getMyOrders(
					{ status: CUSTOMER_STATUSES[activeId], page, limit: PAGE_SIZE },
					{ signal: controller.signal },
				);
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

	const reload = () => setReloadKey((key) => key + 1);

	const handleCreated = () => {
		setModal(null);
		setNotice('Заказ опубликован: исполнители увидят его в разделе «Заказы»');
		selectTab('waiting');
		reload();
	};

	const handleUpdated = () => {
		setModal(null);
		setNotice('Изменения сохранены');
		reload();
	};

	return (
		<section className={styles.card}>
			<div className={styles.headingRow}>
				<h2 className={styles.heading}>Сделки</h2>
				{isCustomer && (
					<Button variant="primary" onClick={() => setModal({ orderId: null })}>
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

			{isCustomer ? (
				<>
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
									isOwn
									onDetails={(id) => setModal({ orderId: id })}
								/>
							))}
						</div>
					)}
					{!loading && !error && <Pagination page={page} pages={list.pages} onChange={setPage} />}
				</>
			) : (
				// Для исполнителя список сделок появится вместе с модулем откликов и сделок
				<p className={styles.empty}>Здесь пока ничего нет</p>
			)}

			{modal && (
				<CreateOrderModal
					orderId={modal.orderId}
					onClose={() => setModal(null)}
					onCreated={handleCreated}
					onUpdated={handleUpdated}
				/>
			)}
		</section>
	);
}
