import { useOutletContext } from 'react-router-dom';
import RatingStars from '../../../components/RatingStars/RatingStars';
import ProfilePortfolio from '../../../components/Profile/ProfilePortfolio/ProfilePortfolio';
import styles from './Tabs.module.css';

const joinTags = (list) => (list?.length ? list.join(' • ') : '');

function Block({ label, children }) {
	return (
		<div className={styles.block}>
			<p className={styles.blockLabel}>{label}</p>
			{children ? (
				<p className={styles.text}>{children}</p>
			) : (
				<p className={styles.muted}>Не указано</p>
			)}
		</div>
	);
}

export default function AboutTab() {
	const { profile, isFreelancer } = useOutletContext();
	const rating = profile?.ratingAvg ?? null;
	const reviewsCount = profile?.ratingCount ?? 0;

	return (
		<>
			<section className={styles.card}>
				<h2 className={styles.heading}>{isFreelancer ? 'Обо мне' : 'О компании'}</h2>
				<div className={styles.columns}>
					<Block label={isFreelancer ? 'О себе' : 'О компании'}>{profile?.about}</Block>
					{isFreelancer && (
						<div>
							<Block label="Навыки">{joinTags(profile?.skills)}</Block>
							<Block label="Инструменты">{joinTags(profile?.tools)}</Block>
						</div>
					)}
				</div>
			</section>

			{isFreelancer && <ProfilePortfolio readOnly />}

			<section className={styles.card}>
				<div className={styles.headingRow}>
					<h2 className={styles.heading}>Отзывы</h2>
					{rating != null && (
						<span>
							<RatingStars value={rating} size={30} /> {rating.toFixed(1)}/5
						</span>
					)}
				</div>
				{reviewsCount === 0 ? (
					<p className={styles.muted}>Пока нет отзывов</p>
				) : (
					<p className={styles.muted}>Всего - {reviewsCount} отзывов</p>
				)}
			</section>
		</>
	);
}
