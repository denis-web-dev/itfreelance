import styles from './Pagination.module.css';

// Для 20 страниц и текущей 6: 1 … 5 6 7 … 20
const getPageItems = (page, pages) => {
	const items = [];
	for (let p = 1; p <= pages; p++) {
		if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
			items.push(p);
		} else if (items[items.length - 1] !== 'dots') {
			items.push('dots');
		}
	}
	return items;
};

export default function Pagination({ page, pages, onChange }) {
	if (pages <= 1) return null;

	return (
		<nav className={styles.pagination} aria-label="Страницы">
			<button
				type="button"
				className={styles.arrow}
				onClick={() => onChange(page - 1)}
				disabled={page === 1}
			>
				Назад
			</button>

			{getPageItems(page, pages).map((item, index) =>
				item === 'dots' ? (
					<span key={`dots-${index}`} className={styles.dots}>
						…
					</span>
				) : (
					<button
						key={item}
						type="button"
						className={`${styles.page} ${item === page ? styles.pageActive : ''}`}
						onClick={() => onChange(item)}
						aria-current={item === page ? 'page' : undefined}
					>
						{item}
					</button>
				),
			)}

			<button
				type="button"
				className={styles.arrow}
				onClick={() => onChange(page + 1)}
				disabled={page === pages}
			>
				Вперёд
			</button>
		</nav>
	);
}
