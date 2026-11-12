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
		</article>
	);
}
