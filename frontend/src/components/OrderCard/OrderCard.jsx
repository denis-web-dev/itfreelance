import styles from './OrderCard.module.css';
import Button from '../Button/Button';
import IconLike from '../../assets/icons/icon-like.svg?react';

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
					<svg
						width="26"
						height="26"
						viewBox="0 0 26 26"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g id="ic:round-star">
							<path
								id="Vector"
								d="M12.9995 18.7093L17.4954 21.4285C18.3187 21.9268 19.3262 21.1902 19.1095 20.2585L17.9179 15.1452L21.8937 11.7002C22.6195 11.0718 22.2295 9.88015 21.2762 9.80432L16.0437 9.36015L13.9962 4.52849C13.6279 3.65099 12.3712 3.65099 12.0029 4.52849L9.95536 9.34932L4.72286 9.79349C3.76953 9.86932 3.37953 11.061 4.10536 11.6893L8.0812 15.1343L6.88953 20.2477C6.67286 21.1793 7.68036 21.916 8.5037 21.4177L12.9995 18.7093Z"
								fill="black"
							/>
						</g>
					</svg>
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
				<IconLike className={styles.favoriteIcon} />
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
