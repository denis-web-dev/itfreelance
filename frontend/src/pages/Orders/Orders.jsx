import { useState } from 'react';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import OrdersFilters from '../../components/OrdersFilters/OrdersFilters';
import OrderCard from '../../components/OrderCard/OrderCard';
import Pagination from '../../components/Pagination/Pagination';
import CreateOrderModal from '../../components/CreateOrderModal/CreateOrderModal';
import { useAuth } from '../../contexts/AuthContext';
// import AiRecommendations from '../../components/AiRecommendations/AiRecommendations';
import { useOrders } from '../../hooks/useOrders';
import CardBg from '../../components/CardBg/CardBg';
import bgOrder from '../../assets/img-orders/BgHeader-order.png';
import eyesOrder from '../../assets/img-orders/eyes-order.png';
import styles from './Orders.module.css';

export default function Orders() {
	const [isCreateOpen, setCreateOpen] = useState(false);
	const { user } = useAuth();
	const { orders, total, pages, page, loading, error, filters, updateFilters, setPage } =
		useOrders();

	const handleRespond = (_id) => {
		// позже: navigate или API
	};

	const handleDetails = (_id) => {
		// позже: navigate(`/orders/${id}`)
	};

	const handlePageChange = (nextPage) => {
		setPage(nextPage);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleCreated = () => {
		setCreateOpen(false);
		updateFilters({}); // возвращаемся на первую страницу и перезагружаем список
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
						{user?.role === 'CUSTOMER' && (
							<button
								type="button"
								className={styles.createBtn}
								onClick={() => setCreateOpen(true)}
							>
								+ Создать заказ
							</button>
						)}
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
										/>
									))}
								{!loading && !error && orders.length === 0 && (
									<p className={styles.status}>Заказов не найдено</p>
								)}
								{!loading && !error && (
									<Pagination page={page} pages={pages} onChange={handlePageChange} />
								)}
							</div>

							{/* <div className={styles.sidebar}>
								<AiRecommendations onClick={() => console.log('AI подбор')} />
							</div> */}
						</div>
					</div>
				</main>
			</div>
			{isCreateOpen && (
				<CreateOrderModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
			)}
		</div>
	);
}
