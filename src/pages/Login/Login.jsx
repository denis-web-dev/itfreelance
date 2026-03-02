import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import clsx from 'clsx';
import styles from './Login.module.css';
import { useState } from 'react';
import InputForm from '../../components/InputForm/InputForm';

// Схема валидации (Zod) — точно как в вашей верстке
const schema = z.object({
  email: z.string().email('Некорректно введен email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  rememberMe: z.boolean().optional(),
});

function Login() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const [showPassword, setShowPassword] = useState(false);

  // Отслеживаем состояние чекбокса
  const rememberMe = watch('rememberMe');

  const onSubmit = (data) => {
    console.log('Вход:', data);
    // Здесь позже будет вызов API: services/auth.login(data)
  };

  //Функция для переключения видимости пароля
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles['wrapper-entrance']}>
      <div className={styles['container']}>
        <h1
          className={clsx(styles['main-title-entrance'], styles['main-title'])}
        >
          Вход
        </h1>

        <div className={styles['block-bg']}>
          {/* Кнопка закрытия — вынесена в компонент */}
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

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={styles['form__container-entrance']}
          >
            {/* Поле Email */}
            <InputForm
              type="email"
              placeholder="E-mail"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Поле Пароль с переключателем видимости */}
            <InputForm
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              error={errors.password?.message}
              showPasswordToggle={true}
              onTogglePassword={togglePasswordVisibility}
              showPassword={showPassword}
              {...register('password')}
            />

            {/* Чекбокс "Запомнить меня" */}
            <div className={styles['form-group__checkbox']}>
              <label className={styles['form__checkbox-label']}>
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className={styles['form__checkbox']}
                />

                {/* ЕДИНСТВЕННЫЙ SVG, который меняет стили через clsx */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={clsx(
                    styles['form__checkbox-custom'],
                    rememberMe
                      ? styles['checkbox-checked']
                      : styles['checkbox-unchecked']
                  )}
                >
                  {/* Рамка чекбокса (всегда видна) */}
                  <rect
                    x="0.5"
                    y="0.5"
                    width="23"
                    height="23"
                    rx="5"
                    stroke-width="2"
                    className={styles['checkbox-rect']}
                  />

                  {/* Галочка (видна только когда чекбокс отмечен) */}
                  <path
                    className={styles['checkbox-checkmark']}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.70711 10.7071C6.31658 10.3166 5.68342 10.3166 5.29289 10.7071L4.70711 11.2929C4.31658 11.6834 4.31658 12.3166 4.70711 12.7071L9.29289 17.2929C9.68342 17.6834 10.3166 17.6834 10.7071 17.2929L19.2929 8.70711C19.6834 8.31658 19.6834 7.68342 19.2929 7.29289L18.7071 6.70711C18.3166 6.31658 17.6834 6.31658 17.2929 6.70711L10.7071 13.2929C10.3166 13.6834 9.68342 13.6834 9.29289 13.2929L6.70711 10.7071Z"
                  />
                </svg>

                <span className={styles['form__checkbox-text']}>
                  Запомнить меня
                </span>
              </label>
              <Link
                to="/forgot-password"
                className={styles['form__forgot-password']}
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Кнопка Войти */}
            <button type="submit" className={styles['form__btn']}>
              Войти
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className={styles['account__link-entrance']}>
            <span className={styles['account__entrance-reg']}>
              Нет аккаунта?
            </span>
            <Link to="/register" className={styles['account__link-enter']}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
