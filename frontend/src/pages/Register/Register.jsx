import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import InputForm from '../../components/InputForm/InputForm';
import clsx from 'clsx';
import styles from './Register.module.css';

// Схема валидации
const schema = z
  .object({
    name: z.string().min(2, 'Имя слишком короткое'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

function Register() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    // TODO: Здесь будет вызов API
    // eslint-disable-next-line no-console
    console.log(data); // можно оставить временно для отладки
  };

  const handleClose = () => {
    navigate('/');
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
          {/* Кнопка закрытия */}
          <button
            className={styles['block-bg-close-btn']}
            onClick={handleClose}
          >
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

            <button
              type="submit"
              variant="primary"
              className={styles['form__btn-reg']}
            >
              Зарегистрироваться
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
