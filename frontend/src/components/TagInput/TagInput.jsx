import { useState } from 'react';
import clsx from 'clsx';
import styles from './TagInput.module.css';

const MAX_TAG_LENGTH = 50;

export default function TagInput({
	label,
	placeholder,
	value = [],
	onChange,
	error,
	maxItems = 20,
	className,
}) {
	const [draft, setDraft] = useState('');
	const isFull = value.length >= maxItems;

	const addTag = (raw) => {
		const name = raw.trim().slice(0, MAX_TAG_LENGTH);
		if (!name || value.length >= maxItems) return;

		// Повторы без учёта регистра игнорируем: «react» и «React» это один пункт
		if (!value.some((t) => t.toLowerCase() === name.toLowerCase())) {
			onChange([...value, name]);
		}
		setDraft('');
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault(); // не отправляем форму профиля
			addTag(draft);
		}
	};

	const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

	return (
		<div className={clsx(styles.field, className)}>
			<div className={clsx(styles.inputWrap, error && styles.inputError)}>
				<input
					className={styles.input}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={() => addTag(draft)}
					placeholder={isFull ? `Максимум ${maxItems}` : placeholder}
					disabled={isFull}
					maxLength={MAX_TAG_LENGTH}
					aria-label={label}
				/>
				<span className={styles.label}>{label}</span>
			</div>

			{value.length > 0 && (
				<ul className={styles.chips}>
					{value.map((tag) => (
						<li key={tag}>
							<label className={styles.chip} title="Снять галочку, чтобы убрать">
								<input
									type="checkbox"
									checked
									onChange={() => removeTag(tag)}
									className={styles.checkbox}
								/>
								<svg
									className={styles.box}
									width="16"
									height="16"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<rect width="24" height="24" rx="5" fill="#1a1a1a" />
									<path
										d="M6 12.5l4 4 8-9"
										stroke="#fff"
										strokeWidth="3"
										strokeLinecap="round"
										strokeLinejoin="round"
										fill="none"
									/>
								</svg>
								<span>{tag}</span>
							</label>
						</li>
					))}
				</ul>
			)}

			{error && <p className={styles.error}>{error}</p>}
		</div>
	);
}
