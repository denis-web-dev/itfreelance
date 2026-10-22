import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Checkbox.module.css';

const Checkbox = forwardRef(
	({ children, error, className, id = 'consent', checked, ...props }, ref) => {
		return (
			<div className={clsx(styles['consent-wrapper'], className)}>
				<label htmlFor={id} className={styles['form__checkbox-label']}>
					<input
						type="checkbox"
						id={id}
						ref={ref}
						checked={checked}
						className={styles['form__checkbox-hidden']}
						{...props}
					/>

					{/* Кастомная SVG-иконка */}
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className={clsx(
							styles['form__checkbox-custom'],
							checked ? styles['checkbox-checked'] : styles['checkbox-unchecked'],
						)}
					>
						<rect
							x="0.5"
							y="0.5"
							width="23"
							height="23"
							rx="5"
							strokeWidth="2"
							className={styles['checkbox-rect']}
						/>
						<path
							className={styles['checkbox-checkmark']}
							fillRule="evenodd"
							clipRule="evenodd"
							d="M6.70711 10.7071C6.31658 10.3166 5.68342 10.3166 5.29289 10.7071L4.70711 11.2929C4.31658 11.6834 4.31658 12.3166 4.70711 12.7071L9.29289 17.2929C9.68342 17.6834 10.3166 17.6834 10.7071 17.2929L19.2929 8.70711C19.6834 8.31658 19.6834 7.68342 19.2929 7.29289L18.7071 6.70711C18.3166 6.31658 17.6834 6.31658 17.2929 6.70711L10.7071 13.2929C10.3166 13.6834 9.68342 13.6834 9.29289 13.2929L6.70711 10.7071Z"
						/>
					</svg>

					{/* Текст */}
					<span className={styles['form__checkbox-text']}>{children}</span>
				</label>

				{/* Вывод ошибки */}
				{error && <span className={styles['consent-error']}>{error}</span>}
			</div>
		);
	},
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
