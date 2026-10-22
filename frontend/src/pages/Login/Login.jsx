import { z } from 'zod';
import clsx from 'clsx';
import { useState } from 'react';
import styles from './Login.module.css';
import { useForm } from 'react-hook-form';
import { loginUser } from '../../services/auth';
import { saveTokens } from '../../services/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CloseButton from '../../components/ui/CloseButton/CloseButton';
import InputForm from '../../components/InputForm/InputForm';
import Checkbox from '../../components/ui/Checkbox/Checkbox';

const schema = z.object({
	email: z.string().email('Некорректно введен email'),
	password: z.string().min(6, 'Пароль минимум 6 символов'),
	rememberMe: z.boolean().optional(),
});
const getRememberedEmail = () => {
	try {
		return localStorage.getItem('rememberedEmail') ?? '';
	} catch {
		return '';
	}
};

function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [serverError, setServerError] = useState('');
	const rememberedEmail = getRememberedEmail();

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			email: rememberedEmail,
			password: '',
			rememberMe: Boolean(rememberedEmail),
		},
	});
	const isRememberMe = watch('rememberMe');
	const rememberMe = watch('rememberMe');

	const onSubmit = async (data) => {
		setIsLoading(true);
		setServerError('');

		try {
			const result = await loginUser({ email: data.email, password: data.password });

			saveTokens(result.data.tokens);
			login(result.data.user);

			if (data.rememberMe) {
				localStorage.setItem('rememberedEmail', data.email);
			} else {
				localStorage.removeItem('rememberedEmail');
			}

			navigate(location.state?.from?.pathname || '/profile-edit', { replace: true });
		} catch (error) {
			setServerError(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={styles['wrapper-entrance']}>
			<div className={styles['container']}>
				<div className={styles['block-bg']}>
					<h1 className={clsx(styles['main-title-entrance'], styles['main-title'])}>Вход</h1>
					<CloseButton
						size="medium"
						variant="dark"
						className={styles['block-bg-close-btn']}
						ariaLabel="Закрыть"
					/>

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

					{serverError && (
						<p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{serverError}</p>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className={styles['form__container-entrance']}>
						<InputForm
							className={styles.InputFormlogin}
							type="email"
							placeholder="E-mail"
							error={errors.email?.message}
							inputSize="small"
							disabled={isLoading}
							{...register('email')}
						/>

						<InputForm
							type="password"
							placeholder="Пароль"
							error={errors.password?.message}
							showPasswordToggle={true}
							inputSize="small"
							disabled={isLoading}
							{...register('password')}
						/>

						<div className={styles['form-group__checkbox']}>
							<Checkbox
								id="rememberMe"
								{...register('rememberMe')}
								checked={isRememberMe}
								className={styles['login-remember-wrapper']} // Доп. класс для отступов
							>
								Запомнить меня
							</Checkbox>

							<Link to="/forgot-password" className={styles['form__forgot-password']}>
								Забыли пароль?
							</Link>
						</div>

						<button type="submit" className={styles['form__btn']} disabled={isLoading}>
							{isLoading ? 'Вход...' : 'Войти'}
						</button>
					</form>

					<div className={styles['account__link-entrance']}>
						<span className={styles['account__entrance-reg']}>Нет аккаунта?</span>
						<Link to="/create-account" className={styles['account__link-enter']}>
							Зарегистрироваться
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Login;
