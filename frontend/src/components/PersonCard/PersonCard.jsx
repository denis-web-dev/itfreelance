import { Link } from 'react-router-dom';
import RatingStars from '../RatingStars/RatingStars';
import defaultAvatar from '../../assets/img-header/avatarBG.png';
import styles from './PersonCard.module.css';

/**
 * Карточка человека: имя, аватар, рейтинг, сфера, опыт и место для кнопок.
 * person: { name, avatarUrl, sphere, rating }; to: ссылка на его профиль
 */
export default function PersonCard({ person, experience, to, children }) {
	const { name, avatarUrl, sphere, rating } = person;
	const avatar = <img className={styles.avatar} src={avatarUrl || defaultAvatar} alt="" />;

	return (
		<article className={styles.card}>
			<svg
				className={styles.bgPersonCard}
				width="446"
				height="483"
				viewBox="0 0 446 483"
				preserveAspectRatio="none"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M394.616 42.2046C384.988 50.2018 384.988 64.9778 394.616 72.975L438.779 109.655C443.353 113.455 446 119.094 446 125.041V463C446 474.046 437.046 483 426 483H20C8.95432 483 0 474.046 0 463V20C0 8.95431 8.9543 0 20 0H390.048C408.77 0 417.228 23.4229 402.826 35.3852L394.616 42.2046Z"
					fill="#EBEBEB"
				/>
			</svg>
			<div className={styles.content}>
				<h3 className={styles.name}>
					{to ? (
						<Link to={to} className={styles.nameLink}>
							{name}
						</Link>
					) : (
						name
					)}
				</h3>

				{to ? (
					<Link to={to} tabIndex={-1} aria-hidden="true">
						{avatar}
					</Link>
				) : (
					avatar
				)}

				<div className={styles.field}>
					<span className={styles.label}>Рейтинг</span>
					{rating == null ? (
						<span className={styles.value}>Пока нет оценок</span>
					) : (
						<div className={styles.rating}>
							<RatingStars value={rating} />
							<span className={styles.value}>{rating.toFixed(1)}/5</span>
						</div>
					)}
				</div>

				<div className={styles.field}>
					<span className={styles.label}>Сфера деятельности</span>
					<span className={styles.value}>{sphere || 'Не указано'}</span>
				</div>

				<div className={styles.field}>
					<span className={styles.label}>Опыт работы</span>
					<span className={styles.value}>{experience || 'Не указано'}</span>
				</div>

				{children && <div className={styles.actions}>{children}</div>}
			</div>
		</article>
	);
}
