import RatingStars from '../../RatingStars/RatingStars';
import { formatNumber, formatYears } from '../../../utils/format';
import { telegramUrl, toSafeUrl } from '../../../utils/links';
import defaultAvatar from '../../../assets/img-header/avatarBG.png';
import styles from './ProfileSummary.module.css';

function Field({ label, children }) {
	return (
		<div>
			<dt className={styles.label}>{label}</dt>
			<dd className={styles.value}>
				{children || <span className={styles.empty}>Не указано</span>}
			</dd>
		</div>
	);
}

function SocialLink({ href, label, children }) {
	if (!href) return null;
	return (
		<a
			className={styles.social}
			href={href}
			target="_blank"
			rel="noopener noreferrer nofollow"
			aria-label={label}
		>
			{children}
		</a>
	);
}

export default function ProfileSummary({ user, profile, isFreelancer }) {
	const title = (!isFreelancer && profile?.companyName) || profile?.fullName || 'Без имени';
	const rating = profile?.ratingAvg ?? null;

	let experience = '';
	if (isFreelancer) experience = profile?.experience ?? '';
	else if (profile?.marketYears != null) experience = formatYears(profile.marketYears);

	const siteHref = toSafeUrl(profile?.site);
	const telegram = telegramUrl(profile?.telegram);
	const vk = toSafeUrl(profile?.vk);

	return (
		<section className={styles.summary}>
			<div className={styles.head}>
				<h1 className={styles.title}>{title}</h1>
				<div className={styles.rating}>
					{rating == null ? (
						<span className={styles.noRating}>Пока нет оценок</span>
					) : (
						<>
							<RatingStars value={rating} size={30} className={styles.stars} />
							<span className={styles.ratingValue}>
								{rating.toFixed(1)}
								<span className={styles.ratingMax}>/5</span>
							</span>
						</>
					)}
				</div>
			</div>

			<div className={styles.body}>
				<img className={styles.avatar} src={defaultAvatar} alt="" />

				<dl className={styles.fields}>
					<Field label="Сфера деятельности">{profile?.sphere}</Field>
					<Field label="Регион">{profile?.region}</Field>
					<Field label="Опыт работы">{experience}</Field>
					{isFreelancer ? (
						<Field label="Ставка руб/час">
							{profile?.rate != null ? formatNumber(profile.rate) : ''}
						</Field>
					) : (
						<div />
					)}
					<Field label="Email">{user.email}</Field>
					<Field label="Сайт">
						{siteHref ? (
							<a href={siteHref} target="_blank" rel="noopener noreferrer nofollow">
								{profile.site}
							</a>
						) : (
							profile?.site
						)}
					</Field>
					<Field label="Телефон">{profile?.phone}</Field>
					<div>
						<dt className={styles.label}>Соц. сети</dt>
						<dd className={`${styles.value} ${styles.socials}`}>
							<SocialLink href={telegram} label="Телеграм">
								TG
							</SocialLink>
							<SocialLink href={vk} label="Вконтакте">
								VK
							</SocialLink>
							{!telegram && !vk && <span className={styles.empty}>Не указано</span>}
						</dd>
					</div>
				</dl>
			</div>
		</section>
	);
}
