/* eslint-disable no-console */
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import Button from '../../components/Button/Button';
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
    alert(
      'На вашу почту отправлена ссылка для восстановления пароля (симуляция)'
    );
  };

  return (
    <div className={styles['wrapper-forgot']}>
      <div className="container">
        <h1 className={clsx(styles['main-title-forgot'], styles['main-title'])}>
          Забыли пароль?
        </h1>

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
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1338.69 0C1360.04 0 1370.74 25.8136 1355.64 40.9107C1346.28 50.2696 1346.28 65.4433 1355.64 74.8022L1401.21 120.375C1406.84 126.001 1410 133.632 1410 141.588V740C1410 756.569 1396.57 770 1380 770H30C13.4315 770 0 756.569 0 740V30C0 13.4315 13.4315 0 30 0H1338.69Z"
              fill="#fff"
            />
          </svg>
          <p className={styles['form-description']}>
            Мы отправим ссылку для восстановления на ваш e-mail.
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={styles['form__container-forgot']}
          >
            <InputForm
              type="email"
              placeholder="E-mail"
              label="E-mail"
              name="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" variant="primary">
              Отправить
            </Button>
          </form>

          <div className={styles['account__link-forgot']}>
            <Link to="/login" className={styles['account__link-enter']}>
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
