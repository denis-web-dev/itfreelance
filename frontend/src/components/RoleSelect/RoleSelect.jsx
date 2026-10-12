import styles from './RoleSelect.module.css';

export default function RoleSelect({ register, error, disabled = false }) {
	return (
		<div className={styles.wrapper}>
			<label htmlFor="role" className={styles.label}>
				Я регистрируюсь как:
			</label>

			<select
				id="role"
				disabled={disabled}
				className={`${styles.select} ${error ? styles.selectError : ''}`}
				{...register('role')}
			>
				<option value="" disabled>
					Выберите роль
				</option>
				<option value="FREELANCER">Фрилансер (ищу работу)</option>
				<option value="CUSTOMER">Заказчик (ищу исполнителей)</option>
			</select>

			{error && <p className={styles.error}>{error}</p>}
		</div>
	);
}
