import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { toFieldErrors } from '../../services/api';
import { saveTokens } from '../../services/tokens';
import { useAuth } from '../../contexts/AuthContext';
import InputForm from '../../components/InputForm/InputForm';
import CloseButton from '../../components/ui/CloseButton/CloseButton';
import Checkbox from '../../components/ui/Checkbox/Checkbox.jsx';
import clsx from 'clsx';
import styles from './Register.module.css';

const schema = z
	.object({
		name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
		email: z.string().email('Введите корректный email'),
		password: z
			.string()
			.min(8, 'Пароль должен содержать минимум 8 символов')
			.regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
			.regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
		confirmPassword: z.string(),
		consent: z.literal(true, {
			error: () => ({ message: 'Необходимо согласие на обработку данных' }),
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword'],
	});

const ROLES = ['FREELANCER', 'CUSTOMER'];

function Register() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [searchParams] = useSearchParams();
	const [serverError, setServerError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Роль выбрана на странице «Создать аккаунт» и приходит в адресе: /register?role=CUSTOMER
	const roleFromUrl = searchParams.get('role');
	const role = ROLES.includes(roleFromUrl) ? roleFromUrl : null;

	const {
		register,
		handleSubmit,
		setError,
		watch,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: { consent: false },
	});

	const isConsentChecked = watch('consent');

	const handleClose = () => {
		navigate('/');
	};

	const onSubmit = async (data) => {
		setServerError('');
		setIsLoading(true);

		try {
			const result = await registerUser({
				fullName: data.name,
				email: data.email,
				password: data.password,
				role: role,
				consent: data.consent,
			});

			saveTokens(result.data.tokens);
			login(result.data.user);
			navigate('/profile-edit');
		} catch (error) {
			if (error.status === 409) {
				setError('email', { message: error.message });
				return;
			}

			const fieldMap = { fullName: 'name' };
			const fieldErrors = Object.entries(toFieldErrors(error));
			fieldErrors.forEach(([field, message]) => {
				setError(fieldMap[field] ?? field, { message });
			});
			if (fieldErrors.length === 0) setServerError(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	// Без выбранной роли регистрироваться нельзя: возвращаем на выбор роли
	if (!role) return <Navigate to="/create-account" replace />;

	return (
		<div className={styles['wrapper-registration']}>
			<div className="container">
				<div className={styles['block-bg']}>
					<h1 className={clsx(styles['main-title-registration'], styles['main-title'])}>
						Регистрация
					</h1>
					<CloseButton
						size="large"
						variant="dark"
						className={styles['block-bg-close-btn-registration']}
						ariaLabel="Закрыть форму регистрации"
					/>
					<svg
						className={styles['block-bg-svg']}
						viewBox="0 0 1410 738"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						focusable="false"
						preserveAspectRatio="none"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M1338.69 0C1360.04 0 1370.74 25.8136 1355.64 40.9107C1346.28 50.2696 1346.28 65.4433 1355.64 74.8022L1401.21 120.375C1406.84 126.001 1410 133.632 1410 141.588V708C1410 724.569 1396.57 738 1380 738H30C13.4315 738 0 724.569 0 708V30C0 13.4315 13.4315 0 30 0H1338.69Z"
							fill="#fff"
						/>
					</svg>

					<svg
						className={styles['bg-mobile-svg']}
						width="359"
						height="651"
						viewBox="0 0 359 651"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width="359" height="651" rx="20" fill="white" />
					</svg>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className={styles['form__container-registration']}
					>
						<InputForm
							type="text"
							placeholder="Имя"
							label="Имя"
							name="name"
							inputSize="small"
							error={errors.name?.message}
							{...register('name')}
						/>

						<InputForm
							type="email"
							placeholder="E-mail"
							label="E-mail"
							name="email"
							inputSize="small"
							error={errors.email?.message}
							{...register('email')}
						/>

						<InputForm
							type="password"
							placeholder="Пароль"
							label="Пароль"
							name="password"
							inputSize="small"
							error={errors.password?.message}
							showPasswordToggle={true}
							{...register('password')}
						/>

						<InputForm
							type="password"
							placeholder="Повторите пароль"
							label="Повторите пароль"
							name="confirmPassword"
							inputSize="small"
							error={errors.confirmPassword?.message}
							showPasswordToggle={true}
							{...register('confirmPassword')}
						/>

						<button type="submit" disabled={isLoading} className={styles['form__btn-reg']}>
							{isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
						</button>

						{/* Чекбокс согласия */}
						<Checkbox
							id="consent"
							{...register('consent')}
							checked={isConsentChecked}
							className={styles['register-checkbox']}
							error={errors.consent?.message}
							disabled={isLoading}
						>
							Я согласен на обработку персональных данных и принимаю{' '}
							<a href="/privacy" target="_blank" rel="noopener noreferrer">
								Политику конфиденциальности
							</a>
						</Checkbox>

						{serverError && <p style={{ color: 'red', textAlign: 'center' }}>{serverError}</p>}
					</form>

					<div className={styles['account__link-registration']}>
						<span className={styles['account__entrance-reg']}>Есть аккаунт?</span>
						<Link to="/login" className={styles['account__link-enter']}>
							Войти
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Register;
