import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import OrdersFilters from '../../components/OrdersFilters/OrdersFilters';
import OrderCard from '../../components/OrderCard/OrderCard';
import AiRecommendations from '../../components/AiRecommendations/AiRecommendations';
import { useOrders } from '../../hooks/useOrders';
import { toggleFavorite } from '../../services/ordersApi';
import styles from './Orders.module.css';

/**
 * Страница списка заказов
 */
export default function Orders() {
	const { orders, total, loading, error, filters, updateFilters, refetch } = useOrders();

	const handleRespond = (id) => {
		console.log('Отклик на заказ', id);
		// позже: navigate или API
	};

	const handleDetails = (id) => {
		console.log('Подробнее', id);
		// позже: navigate(`/orders/${id}`)
	};

	const handleFavorite = async (id) => {
		await toggleFavorite(id);
		refetch();
	};

	return (
		<div className={styles.page}>
			<ProfileHeader />

			<main className={styles.main}>
				<div className={styles.top}>
					<h1 className={styles.heading}>Заказы</h1>
				</div>

				<OrdersFilters filters={filters} onChange={updateFilters} />

				<p className={styles.count}>Найдено {total} проектов</p>

				<div className={styles.layout}>
					<div className={styles.list}>
						{loading && <p className={styles.status}>Загрузка...</p>}
						{error && <p className={styles.error}>{error}</p>}
						{!loading &&
							!error &&
							orders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									onRespond={handleRespond}
									onDetails={handleDetails}
									onToggleFavorite={handleFavorite}
								/>
							))}
						{!loading && !error && orders.length === 0 && (
							<p className={styles.status}>Заказов не найдено</p>
						)}
					</div>

					<div className={styles.sidebar}>
						<AiRecommendations onClick={() => console.log('AI подбор')} />
					</div>
				</div>
			</main>
		</div>
	);
}
