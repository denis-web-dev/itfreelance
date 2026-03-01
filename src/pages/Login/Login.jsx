import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import clsx from 'clsx';
import styles from './Login.module.css';

// Схема валидации (Zod) — точно как в вашей верстке
const schema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  rememberMe: z.boolean().optional(),
});

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log('Вход:', data);
    // Здесь позже будет вызов API: services/auth.login(data)
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
            <div className={styles['form-group']}>
              <input
                type="email"
                {...register('email')}
                placeholder="E-mail"
                className={styles['form__email']}
              />
              {errors.email && (
                <p className={styles.error}>{errors.email.message}</p>
              )}
            </div>

            {/* Поле Пароль с переключателем видимости */}
            <div className={styles['form-group']}>
              <input
                type="password"
                {...register('password')}
                placeholder="Введите пароль"
                className={styles['form__password']}
              />
              {errors.password && (
                <p className={styles.error}>{errors.password.message}</p>
              )}

              {/* Кнопка показа/скрытия пароля */}
              <button
                type="button"
                className={styles['toggle-password']}
                aria-label="Показать пароль"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M3.15222 5.8518C2.16343 6.85903 1.40027 8.08847 0.944441 9.45811H0.945275C0.845065 9.75916 0.845065 10.0846 0.945275 10.3856C2.18611 14.1081 5.69944 16.7939 9.84111 16.7939C11.0996 16.7939 12.3002 16.5459 13.3966 16.0961L11.3326 14.0322C10.8591 14.2038 10.3552 14.2939 9.84194 14.2939C8.68162 14.2939 7.56882 13.833 6.74835 13.0125C5.92788 12.1921 5.46694 11.0793 5.46694 9.91895C5.46694 9.4057 5.55713 8.90175 5.72872 8.42829L3.15222 5.8518ZM8.46576 5.76602L6.39712 3.69738C7.46362 3.27568 8.62605 3.04395 9.84278 3.04395C13.9844 3.04395 17.4969 5.72978 18.7386 9.45228C18.8386 9.75394 18.8386 10.0789 18.7386 10.3798C18.2948 11.7141 17.5592 12.9153 16.6074 13.9076L13.9949 11.2951C14.1406 10.8553 14.2169 10.391 14.2169 9.91895C14.2169 8.75862 13.756 7.64582 12.9355 6.82535C12.1151 6.00488 11.0023 5.54395 9.84194 5.54395C9.36985 5.54395 8.90563 5.62025 8.46576 5.76602ZM7.3458 10.0454C7.37702 10.6624 7.63588 11.2478 8.07484 11.6867C8.51379 12.1257 9.09917 12.3845 9.71618 12.4157L7.3458 10.0454ZM12.3253 9.6256L10.136 7.43621C10.691 7.50177 11.2112 7.75201 11.6104 8.15118C12.0095 8.55034 12.2598 9.07059 12.3253 9.6256Z"
                    fill="#7B7B7B"
                  />
                  <path
                    d="M3.45524 2.6084L2.6084 3.45524L16.5442 17.391L17.391 16.5442L3.45524 2.6084Z"
                    fill="#7B7B7B"
                  />
                </svg>
              </button>
            </div>

            {/* Чекбокс "Запомнить меня" */}
            <div className={styles['form-group__checkbox']}>
              <label className={styles['form__checkbox-label']}>
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className={styles['form__checkbox']}
                />
                Запомнить меня
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
