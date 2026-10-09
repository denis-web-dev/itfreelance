import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import OrdersFilters from '../../components/OrdersFilters/OrdersFilters';
import OrderCard from '../../components/OrderCard/OrderCard';
// import AiRecommendations from '../../components/AiRecommendations/AiRecommendations';
import { useOrders } from '../../hooks/useOrders';
import { toggleFavorite } from '../../services/ordersApi';
import CardBg from '../../components/CardBg/CardBg';
import bgOrder from '../../assets/img-orders/BgHeader-order.png';
import eyesOrder from '../../assets/img-orders/eyes-order.png';
import styles from './Orders.module.css';

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
		<div className={styles.wrapper}>
			<div className="container">
				<CardBg imageSrc={bgOrder} className={styles.bgOrder}>
					<ProfileHeader className={styles.profileHeaderOrder} />
					<div className={styles.bgContent}>
						<h1 className={styles.titleOrder}>Заказы</h1>
						<img className={styles.eyesOrder} src={eyesOrder} alt="Декорация глаз на фоне" />
					</div>
				</CardBg>

				<main className={styles.orderMain}>
					<div className={styles.containerMain}>
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

							{/* <div className={styles.sidebar}>
								<AiRecommendations onClick={() => console.log('AI подбор')} />
							</div> */}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
