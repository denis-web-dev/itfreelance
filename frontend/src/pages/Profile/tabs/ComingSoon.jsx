import styles from './Tabs.module.css';

export default function ComingSoon({ title }) {
	return (
		<section className={styles.card}>
			<h2 className={styles.heading}>{title}</h2>
			<p className={styles.empty}>Раздел появится позже</p>
		</section>
	);
}
