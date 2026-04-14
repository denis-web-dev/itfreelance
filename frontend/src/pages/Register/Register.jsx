import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CloseIcon from '../../components/Icons/CloseIcon';
import InputForm from '../../components/InputForm/InputForm';
import clsx from 'clsx';
import styles from './Register.module.css';

// Схема валидации (точно такая же, как на бэкенде)
const schema = z
  .object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
            // confirmPassword не отправляем — он только для валидации
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Ошибки от бэкенда (Zod или бизнес-логика)
        throw new Error(result.message || 'Ошибка регистрации');
      }

      // Успех
      setSuccessMessage(
        'Регистрация прошла успешно! Сейчас вы будете перенаправлены...'
      );

      // Сохраняем токены в localStorage (для будущей авторизации)
      localStorage.setItem('accessToken', result.data.tokens.accessToken);
      localStorage.setItem('refreshToken', result.data.tokens.refreshToken);

      // Очищаем форму
      reset();

      // Перенаправляем через 1.5 секунды (можно изменить)
      setTimeout(() => {
        navigate('/login'); // или на главную страницу
      }, 1500);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setServerError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['wrapper-registration']}>
      <div className="container">
        <h1
          className={clsx(
            styles['main-title-registration'],
            styles['main-title']
          )}
        >
          Регистрация
        </h1>

        <div className={styles['block-bg']}>
          {/* Кнопка закрытия (пока просто заглушка) */}
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
            aria-hidden="true"
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
              error={errors.name?.message}
              {...register('name')}
            />

            <InputForm
              type="email"
              placeholder="E-mail"
              label="E-mail"
              name="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <InputForm
              type="password"
              placeholder="Пароль"
              label="Пароль"
              name="password"
              error={errors.password?.message}
              showPasswordToggle={true}
              {...register('password')}
            />

            <InputForm
              type="password"
              placeholder="Повторите пароль"
              label="Повторите пароль"
              name="confirmPassword"
              error={errors.confirmPassword?.message}
              showPasswordToggle={true}
              {...register('confirmPassword')}
            />

            {/* Глобальная ошибка от сервера */}
            {serverError && (
              <p style={{ color: 'red', textAlign: 'center' }}>{serverError}</p>
            )}
            {successMessage && (
              <p style={{ color: 'green', textAlign: 'center' }}>
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={styles['form__btn-reg']}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            <p className={styles['form__text-reg']}>
              Этот сайт защищен и к нему применяются Политика конфиденциальности
              и Условия обслуживания.
            </p>
          </form>

          <div className={styles['account__link-registration']}>
            <span className={styles['account__entrance-reg']}>
              Есть аккаунт?
            </span>
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
