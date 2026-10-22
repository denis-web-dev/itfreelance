import styles from './OrderCard.module.css';
import Button from '../Button/Button';
import RatingStars from '../RatingStars/RatingStars';
import IconLike from '../../assets/icons/icon-like.svg?react';
import { formatBudget, formatDate } from '../../utils/format';

/**
 * Карточка заказа
 */
export default function OrderCard({ order, onRespond, onDetails, onToggleFavorite }) {
	const { rating } = order.customer;

	return (
		<article className={styles.card}>
			{onToggleFavorite && (
				<button
					type="button"
					className={styles.favorite}
					onClick={() => onToggleFavorite(order.id)}
					aria-label="В избранное"
				>
					<IconLike className={styles.favoriteIcon} />
				</button>
			)}

			<h3 className={styles.title}>{order.title}</h3>

			<div className={styles.rating}>
				<span className={styles.ratingLabel}>Рейтинг заказчика</span>
				{rating == null ? (
					<span className={styles.ratingValue}>Пока нет оценок</span>
				) : (
					<div className={styles.stars}>
						<RatingStars value={rating} />
						<span className={styles.ratingValue}>{rating.toFixed(1)}/5</span>
					</div>
				)}
			</div>

			<div className={styles.budget}>
				<span className={styles.budgetLabel}>Бюджет проекта</span>
				<span className={styles.budgetValue}>{formatBudget(order.budget)}</span>
			</div>

			{order.tools.length > 0 && (
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
			)}

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
