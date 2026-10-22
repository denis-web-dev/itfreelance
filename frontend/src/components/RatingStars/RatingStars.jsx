import styles from './RatingStars.module.css';

const STAR_PATH =
	'M12.9995 18.7093L17.4954 21.4285C18.3187 21.9268 19.3262 21.1902 19.1095 20.2585L17.9179 15.1452L21.8937 11.7002C22.6195 11.0718 22.2295 9.88015 21.2762 9.80432L16.0437 9.36015L13.9962 4.52849C13.6279 3.65099 12.3712 3.65099 12.0029 4.52849L9.95536 9.34932L4.72286 9.79349C3.76953 9.86932 3.37953 11.061 4.10536 11.6893L8.0812 15.1343L6.88953 20.2477C6.67286 21.1793 7.68036 21.916 8.5037 21.4177L12.9995 18.7093Z';

function StarIcon({ size, className }) {
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="0 0 26 26"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d={STAR_PATH} />
		</svg>
	);
}

/**
 * Пять звёзд с дробным заполнением. Цвет задаётся через color у className.
 */
export default function RatingStars({ value = 0, size = 26, className = '' }) {
	return (
		<span
			className={`${styles.stars} ${className}`}
			role="img"
			aria-label={`Рейтинг ${value} из 5`}
		>
			{[0, 1, 2, 3, 4].map((index) => {
				const fill = Math.min(Math.max(value - index, 0), 1);
				return (
					<span key={index} className={styles.star} style={{ width: size, height: size }}>
						<StarIcon size={size} className={styles.empty} />
						<span className={styles.fill} style={{ width: `${fill * 100}%` }}>
							<StarIcon size={size} />
						</span>
					</span>
				);
			})}
		</span>
	);
}
