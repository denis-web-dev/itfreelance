import styles from './AiRecommendations.module.css';

/**
 * Блок AI-рекомендаций (сайдбар)
 */
export default function AiRecommendations({ onClick }) {
	return (
		<aside className={styles.block}>
			<div className={styles.icon}>✨</div>
			<h3 className={styles.title}>AI - рекомендации</h3>
			<p className={styles.text}>интеллектуальный подбор интересных заказов</p>
			<button type="button" className={styles.btn} onClick={onClick}>
				Подобрать
			</button>
		</aside>
	);
}
