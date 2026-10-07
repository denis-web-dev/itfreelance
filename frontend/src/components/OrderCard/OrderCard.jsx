import styles from './OrderCard.module.css';
import Button from '../Button/Button';

/**
 * Карточка заказа
 */
export default function OrderCard({ order, onRespond, onDetails, onToggleFavorite }) {
	const formatBudget = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

	const formatDate = (dateStr) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
	};

	const renderStars = (rating) => {
		const full = Math.floor(rating);
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<span key={i} className={i <= full ? styles.starFull : styles.starEmpty}>
					★
				</span>,
			);
		}
		return stars;
	};

	return (
		<article className={styles.card}>
			<button
				type="button"
				className={styles.favorite}
				onClick={() => onToggleFavorite?.(order.id)}
				aria-label="В избранное"
			>
				{order.isFavorite ? '♥' : '♡'}
			</button>

			<h3 className={styles.title}>{order.title}</h3>

			<div className={styles.rating}>
				<span className={styles.ratingLabel}>Рейтинг заказчика</span>
				<div className={styles.stars}>
					{renderStars(order.rating)}
					<span className={styles.ratingValue}>{order.rating.toFixed(1)}/5</span>
				</div>
			</div>

			<div className={styles.budget}>
				<span className={styles.budgetLabel}>Бюджет проекта</span>
				<span className={styles.budgetValue}>{formatBudget(order.budget)}</span>
			</div>

			<div className={styles.tools}>
				<span className={styles.toolsLabel}>Инструменты</span>
				<div className={styles.toolsList}>
					{order.tools.map((tool) => (
						<span key={tool} className={styles.tool}>
							{tool}
						</span>
					))}
				</div>
			</div>

			<div className={styles.actions}>
				<Button variant="primary" onClick={() => onRespond?.(order.id)}>
					Откликнуться
				</Button>
				<Button variant="secondary" onClick={() => onDetails?.(order.id)}>
					Подробнее
				</Button>
				<span className={styles.date}>{formatDate(order.createdAt)}</span>
			</div>
		</article>
	);
}
