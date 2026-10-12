import { Link } from 'react-router-dom';
import styles from './ConsentCheckbox.module.css';

export default function ConsentCheckbox({ register, error, disabled = false }) {
	return (
		<div className={styles.wrapper}>
			<div className={styles.row}>
				<input
					type="checkbox"
					id="consent"
					disabled={disabled}
					className={styles.checkbox}
					{...register('consent')}
				/>
				<label htmlFor="consent" className={styles.label}>
					Я согласен на обработку персональных данных и принимаю{' '}
					<Link to="/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>
						Политику конфиденциальности
					</Link>
				</label>
			</div>

			{error && <p className={styles.error}>{error}</p>}
		</div>
	);
}
