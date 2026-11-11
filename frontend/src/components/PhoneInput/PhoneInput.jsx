import { IMaskInput } from 'react-imask';
import styles from '../InputForm/InputForm.module.css';

// Показывает "+7" сразу, принимает только цифры
export default function PhoneInput({ value, onChange, onBlur, error }) {
	const errorMessage = error?.message;

	return (
		<div className={styles['form-group']}>
			<IMaskInput
				name="phone"
				mask="+{7} (000) 000-00-00"
				lazy={false}
				value={value ?? ''}
				onAccept={(val) => onChange(val)}
				onBlur={onBlur}
				inputMode="tel"
				autoComplete="tel"
				placeholder="Телефон"
				className={`${styles['form-input']} ${styles['form-input--profile']} ${error ? styles['form-input-error'] : ''}`}
			/>
			<span className={styles['form-placeholder']}>Телефон</span>
			{errorMessage && <p className={styles.error}>{errorMessage}</p>}
		</div>
	);
}
