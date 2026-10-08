/* eslint-disable no-console */
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import InputForm from '../../components/InputForm/InputForm';
import clsx from 'clsx';
import styles from './ForgotPassword.module.css';

const schema = z.object({
	email: z.string().email('Введите корректный email'),
});

function ForgotPassword() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = (data) => {
		console.log('Восстановление пароля для:', data.email);
		// Здесь позже будет API-запрос
		alert('На вашу почту отправлена ссылка для восстановления пароля (симуляция)');
	};

	return (
		<div className={styles['wrapper-forgot']}>
			<div className="container">
				<h1 className={clsx(styles['main-title-forgot'], styles['main-title'])}>Забыли пароль?</h1>

				<div className={styles['block-bg']}>
					{/* Кнопка закрытия */}
					<button className={styles['block-bg-close-btn']}>
						<CloseIcon className={styles['block-bg-close-svg']} />
					</button>

					{/* Фоновый SVG */}
					<svg
						className={styles['block-bg-svg']}
						width="1410"
						height="738"
						viewBox="0 0 1410 738"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1358.9 40.8078C1349.57 50.1431 1349.57 65.2787 1358.9 74.6141L1401.21 116.924C1406.84 122.55 1410 130.181 1410 138.137V708C1410 724.569 1396.57 738 1380 738H30C13.4315 738 0 724.569 0 708V30C0 13.4315 13.4315 0 30 0H1342C1363.3 0 1373.96 25.7487 1358.9 40.8078Z"
							fill="white"
						/>
					</svg>

					<p className={styles['form-description']}>
						Мы отправим ссылку для восстановления на ваш e-mail.
					</p>
					<form onSubmit={handleSubmit(onSubmit)} className={styles['form__container-forgot']}>
						<InputForm
							type="email"
							placeholder="E-mail"
							label="E-mail"
							name="email"
							error={errors.email?.message}
							{...register('email')}
						/>

						<button type="submit" className={styles['form__btn-forgot']}>
							Отправить
						</button>
					</form>

					<div className={styles['account__link-forgot']}>
						<span className={styles['account__forgot']}>Вспомнили пароль?</span>
						<Link to="/login" className={styles['account__link-enter']}>
							Войти
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ForgotPassword;
