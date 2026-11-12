import styles from './OrderCard.module.css';
import Button from '../Button/Button';
import RatingStars from '../RatingStars/RatingStars';
import IconLike from '../../assets/icons/icon-like.svg?react';
import { formatBudget, formatDate } from '../../utils/format';

const STATUS_LABELS = {
	OPEN: 'Ожидает исполнителя',
	IN_PROGRESS: 'В работе',
	COMPLETED: 'Завершён',
	CANCELLED: 'Отменён',
};

// "2026-10-15" -> "15.10.2026" (без часовых поясов)
const formatDeadline = (iso) => iso.split('-').reverse().join('.');

/**
 * Карточка заказа.
 * isOwn: карточка моего заказа в кабинете заказчика
 */
export default function OrderCard({
	order,
	isOwn = false,
	onDetails,
	onOpenChat,
	onToggleFavorite,
}) {
	const { rating } = order.customer;
	const hasResponses = (order.responsesCount ?? 0) > 0;
	const canChooseExecutor = isOwn && order.status === 'OPEN' && hasResponses;
	const canOpenChat = isOwn && order.status === 'IN_PROGRESS';

	return (
		<article className={styles.card}>
			{!isOwn && onToggleFavorite && (
				<button
					type="button"
					className={styles.favorite}
					onClick={() => onToggleFavorite(order.id)}
					aria-label="В избранное"
				>
					<IconLike className={styles.favoriteIcon} />
				</button>
			)}

			{isOwn && (
				<span className={styles.status}>{STATUS_LABELS[order.status] ?? order.status}</span>
			)}

			<h3 className={styles.title}>{order.title}</h3>

			{!isOwn && (
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
			)}

			<div className={styles.budget}>
				<span className={styles.budgetLabel}>Бюджет проекта</span>
				<span className={styles.budgetValue}>
					{order.budget == null ? 'Не указан' : formatBudget(order.budget)}
				</span>
			</div>

			{/* Дедлайн показываем только у заказа в работе (в «Сделки → Активные») */}
			{isOwn && order.status === 'IN_PROGRESS' && order.deadline && (
				<div className={styles.budget}>
					<span className={styles.budgetLabel}>Дедлайн</span>
					<span className={styles.budgetValue}>{formatDeadline(order.deadline)}</span>
				</div>
			)}

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
				{canChooseExecutor && (
					<Button variant="primary" onClick={() => onDetails?.(order.id)}>
						Выбрать исполнителя
					</Button>
				)}
				{canOpenChat && (
					<Button variant="primary" onClick={() => onOpenChat?.(order.id)}>
						Перейти в сообщения
					</Button>
				)}
				<Button
					variant={canChooseExecutor || canOpenChat ? 'secondary' : 'primary'}
					onClick={() => onDetails?.(order.id)}
				>
					Подробнее
				</Button>
				<span className={styles.date}>{formatDate(order.createdAt)}</span>
			</div>
		</article>
	);
}
