import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { toFieldErrors } from '../../services/api';
import { saveTokens } from '../../services/tokens';
import { useAuth } from '../../contexts/AuthContext';
import CloseIcon from '../../components/Icons/CloseIcon';
import InputForm from '../../components/InputForm/InputForm';
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
		role: z.enum(['FREELANCER', 'CUSTOMER'], {
			error: () => ({ message: 'Выберите роль' }),
		}),
		consent: z.literal(true, {
			error: () => ({ message: 'Необходимо согласие на обработку данных' }),
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword'],
	});

function Register() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [searchParams] = useSearchParams();
	const [serverError, setServerError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const roleFromUrl = searchParams.get('role');
	const defaultRole = ['FREELANCER', 'CUSTOMER'].includes(roleFromUrl) ? roleFromUrl : '';

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: { role: defaultRole, consent: false },
	});

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
				role: data.role,
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

	return (
		<div className={styles['wrapper-registration']}>
			<div className="container">
				<h1 className={clsx(styles['main-title-registration'], styles['main-title'])}>
					Регистрация
				</h1>

				<div className={styles['block-bg']}>
					<button className={styles['block-bg-close-btn']} onClick={handleClose}>
						<CloseIcon className={styles['block-bg-close-svg']} />
					</button>

					<svg
						className={styles['block-bg-svg']}
						width="1410"
						height="738"
						viewBox="0 0 1410 738"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						focusable="false"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M1338.69 0C1360.04 0 1370.74 25.8136 1355.64 40.9107C1346.28 50.2696 1346.28 65.4433 1355.64 74.8022L1401.21 120.375C1406.84 126.001 1410 133.632 1410 141.588V740C1410 756.569 1396.57 770 1380 770H30C13.4315 770 0 756.569 0 740V30C0 13.4315 13.4315 0 30 0H1338.69Z"
							fill="#fff"
						/>
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

						{/* Выбор роли */}
						<div style={{ marginBottom: '15px' }}>
							<label htmlFor="role" style={{ display: 'block', marginBottom: '5px' }}>
								Я регистрируюсь как:
							</label>
							<select
								id="role"
								{...register('role')}
								style={{
									width: '100%',
									padding: '10px',
									borderRadius: '5px',
									border: '1px solid #ccc',
								}}
							>
								<option value="" disabled>
									Выберите роль
								</option>
								<option value="FREELANCER">Фрилансер (ищу работу)</option>
								<option value="CUSTOMER">Заказчик (ищу исполнителей)</option>
							</select>
							{errors.role && (
								<p style={{ color: 'red', fontSize: '12px' }}>{errors.role.message}</p>
							)}
						</div>

						{/* Чекбокс согласия */}
						<div
							style={{
								marginBottom: '15px',
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
							}}
						>
							<input
								type="checkbox"
								id="consent"
								{...register('consent')}
								style={{ marginTop: '3px' }}
							/>
							<label htmlFor="consent" style={{ fontSize: '14px', lineHeight: '1.4' }}>
								Я согласен на обработку персональных данных и принимаю{' '}
								<Link to="/privacy" target="_blank">
									Политику конфиденциальности
								</Link>
							</label>
						</div>
						{errors.consent && (
							<p style={{ color: 'red', fontSize: '12px', marginTop: '-10px' }}>
								{errors.consent.message}
							</p>
						)}

						{/* Глобальная ошибка от сервера */}
						{serverError && <p style={{ color: 'red', textAlign: 'center' }}>{serverError}</p>}

						<button type="submit" disabled={isLoading} className={styles['form__btn-reg']}>
							{isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
						</button>
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
