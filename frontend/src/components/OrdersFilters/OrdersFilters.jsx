import { useState } from 'react';
import {
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
	Transition,
} from '@headlessui/react';
import { Fragment } from 'react';
import styles from './OrdersFilters.module.css';

const budgetOptions = [
	{ label: 'Любой', value: '' },
	{ label: 'до 50 000', value: '0-50000' },
	{ label: '50 000 - 100 000', value: '50000-100000' },
	{ label: '100 000 - 300 000', value: '100000-300000' },
	{ label: 'от 300 000', value: '300000-' },
];

const toolsOptions = [
	{ label: 'Не выбрано', value: '' },
	{ label: 'React', value: 'React' },
	{ label: 'Vue.js', value: 'Vue.js' },
	{ label: 'Node.js', value: 'Node.js' },
	{ label: 'TypeScript', value: 'TypeScript' },
	{ label: 'PostgreSQL', value: 'PostgreSQL' },
	{ label: 'JavaScript', value: 'JavaScript' },
];

export default function OrdersFilters({ filters, onChange }) {
	const [search, setSearch] = useState(filters.search || '');
	const [ratingOn, setRatingOn] = useState(Boolean(filters.minRating));

	// Текущее значение бюджета
	const currentBudgetValue =
		filters.budgetMin || filters.budgetMax
			? `${filters.budgetMin || ''}-${filters.budgetMax || ''}`
			: '';

	const selectedBudget =
		budgetOptions.find((o) => o.value === currentBudgetValue) || budgetOptions[0];

	const selectedTool =
		toolsOptions.find((o) => o.value === (filters.tools?.[0] || '')) || toolsOptions[0];

	const handleBudgetChange = (option) => {
		if (!option.value) {
			onChange({ budgetMin: undefined, budgetMax: undefined });
			return;
		}
		const [min, max] = option.value.split('-');
		onChange({
			budgetMin: min || undefined,
			budgetMax: max || undefined,
		});
	};

	const handleToolsChange = (option) => {
		onChange({
			tools: option.value ? [option.value] : undefined,
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

				<Listbox value={selectedBudget} onChange={handleBudgetChange}>
					{({ open }) => (
						<div className={styles.dropdown}>
							<ListboxButton className={`${styles.button} ${open ? styles.buttonOpen : ''}`}>
								<span>{selectedBudget.label}</span>
								<span className={`${styles.caret} ${open ? styles.caretRotate : ''}`}>
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="currentColor"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M7 12.3846L12 17L17 12.3846M12 16.359L12 7"
											stroke="#1A1A1A"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
							</ListboxButton>

							<Transition
								show={open}
								as={Fragment}
								enter="transition ease-out duration-200"
								enterFrom="opacity-0 translate-y-1"
								enterTo="opacity-100 translate-y-0"
								leave="transition ease-in duration-150"
								leaveFrom="opacity-100 translate-y-0"
								leaveTo="opacity-0 translate-y-1"
							>
								<ListboxOptions className={styles.list}>
									{budgetOptions.map((option) => (
										<ListboxOption
											key={option.value || 'all'}
											value={option}
											className={styles.item}
										>
											{option.label}
										</ListboxOption>
									))}
								</ListboxOptions>
							</Transition>
						</div>
					)}
				</Listbox>
			</div>

			{/* ===== Инструменты ===== */}
			<div className={styles.field}>
				<label className={styles.label}>Инструменты</label>

				<Listbox value={selectedTool} onChange={handleToolsChange}>
					{({ open }) => (
						<div className={styles.dropdown}>
							<ListboxButton className={`${styles.button} ${open ? styles.buttonOpen : ''}`}>
								<span>{selectedTool.label}</span>
								<span className={`${styles.caret} ${open ? styles.caretRotate : ''}`}>
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="currentColor"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M7 12.3846L12 17L17 12.3846M12 16.359L12 7"
											stroke="#1A1A1A"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</span>
							</ListboxButton>

							<Transition
								show={open}
								as={Fragment}
								enter="transition ease-out duration-200"
								enterFrom="opacity-0 translate-y-1"
								enterTo="opacity-100 translate-y-0"
								leave="transition ease-in duration-150"
								leaveFrom="opacity-100 translate-y-0"
								leaveTo="opacity-0 translate-y-1"
							>
								<ListboxOptions className={styles.list}>
									{toolsOptions.map((option) => (
										<ListboxOption
											key={option.value || 'none'}
											value={option}
											className={styles.item}
										>
											{option.label}
										</ListboxOption>
									))}
								</ListboxOptions>
							</Transition>
						</div>
					)}
				</Listbox>
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

			{/* ===== Поиск ===== */}
			<form className={styles.search} onSubmit={handleSearch}>
				<button type="submit" className={styles.searchBtn} aria-label="Поиск">
					<svg
						width="18"
						height="18"
						viewBox="0 0 12 13"
						fill="#7b7b7b"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M4.71486 0.363647C7.3188 0.363647 9.42971 2.52187 9.42971 5.18418C9.42971 6.27828 9.0732 7.28725 8.47248 8.09628L11.812 11.5145C12.0629 11.7714 12.0627 12.1876 11.8114 12.4441C11.5602 12.7007 11.1531 12.7004 10.9022 12.4436L7.56312 9.02601C6.77183 9.64021 5.78498 10.0047 4.71486 10.0047C2.11091 10.0047 0 7.84648 0 5.18418C0 2.52187 2.11091 0.363647 4.71486 0.363647ZM4.71486 1.67827C2.82108 1.67827 1.28586 3.2479 1.28586 5.18418C1.28586 7.12045 2.82108 8.69009 4.71486 8.69009C6.60863 8.69009 8.14386 7.12045 8.14386 5.18418C8.14386 3.2479 6.60863 1.67827 4.71486 1.67827Z" />
					</svg>
				</button>
				<input
					type="search"
					className={styles.searchInput}
					placeholder="Ключевые слова"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</form>
		</div>
	);
}
