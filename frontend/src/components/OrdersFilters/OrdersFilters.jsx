import { useState } from 'react';
import styles from './OrdersFilters.module.css';

/**
 * Фильтры заказов
 */
export default function OrdersFilters({ filters, onChange }) {
	const [search, setSearch] = useState(filters.search || '');
	const [ratingOn, setRatingOn] = useState(Boolean(filters.minRating));

	const budgetOptions = [
		{ label: 'Любой', value: '' },
		{ label: 'до 50 000', value: '0-50000' },
		{ label: '50 000 - 100 000', value: '50000-100000' },
		{ label: '100 000 - 300 000', value: '100000-300000' },
		{ label: 'от 300 000', value: '300000-' },
	];

	const handleBudget = (e) => {
		const v = e.target.value;
		if (!v) {
			onChange({ budgetMin: undefined, budgetMax: undefined });
			return;
		}
		const [min, max] = v.split('-');
		onChange({
			budgetMin: min || undefined,
			budgetMax: max || undefined,
		});
	};

	const handleRating = () => {
		const next = !ratingOn;
		setRatingOn(next);
		onChange({ minRating: next ? 4.8 : undefined });
	};

	const handleSearch = (e) => {
		e.preventDefault();
		onChange({ search: search.trim() || undefined });
	};

	return (
		<div className={styles.filters}>
			<div className={styles.field}>
				<label className={styles.label}>Бюджет проекта, ₽</label>
				<select className={styles.select} onChange={handleBudget} defaultValue="">
					{budgetOptions.map((o) => (
						<option key={o.value || 'all'} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			<div className={styles.field}>
				<label className={styles.label}>Инструменты</label>
				<select
					className={styles.select}
					onChange={(e) =>
						onChange({
							tools: e.target.value ? [e.target.value] : undefined,
						})
					}
					defaultValue=""
				>
					<option value="">Не выбрано</option>
					<option value="React">React</option>
					<option value="Vue.js">Vue.js</option>
					<option value="Node.js">Node.js</option>
					<option value="TypeScript">TypeScript</option>
					<option value="PostgreSQL">PostgreSQL</option>
					<option value="JavaScript">JavaScript</option>
				</select>
			</div>

			<div className={styles.toggleWrap}>
				<button
					type="button"
					className={`${styles.toggle} ${ratingOn ? styles.toggleOn : ''}`}
					onClick={handleRating}
					aria-pressed={ratingOn}
				>
					<span className={styles.toggleKnob} />
				</button>
				<span className={styles.toggleLabel}>Рейтинг выше 4.8</span>
			</div>

			<form className={styles.search} onSubmit={handleSearch}>
				<input
					type="search"
					className={styles.searchInput}
					placeholder="Ключевые слова"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<button type="submit" className={styles.searchBtn} aria-label="Поиск">
					🔍
				</button>
			</form>
		</div>
	);
}
