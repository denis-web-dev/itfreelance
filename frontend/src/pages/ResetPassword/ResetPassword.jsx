import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import CloseIcon from '../../components/Icons/CloseIcon';
import Button from '../../components/Button/Button';
import InputForm from '../../components/InputForm/InputForm';
import clsx from 'clsx';
import styles from './ResetPassword.module.css';

const schema = z
  .object({
    password: z.string().min(6, 'Пароль минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

function ResetPassword() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log('Новый пароль установлен:', data);
    // Здесь позже будет API-запрос
    alert('Пароль успешно изменён! (симуляция)');
    navigate('/login');
  };

  return (
    <div className={styles['wrapper-new-pass']}>
      <div className="container">
        <h1
          className={clsx(styles['main-title-new-pass'], styles['main-title'])}
        >
          Новый пароль
        </h1>

        <div className={styles['block-bg']}>
          {/* Кнопка закрытия */}
          <button className={styles['block-bg-close-btn']}>
            <CloseIcon className={styles['block-bg-close-svg']} />
          </button>

          {/* Фоновый SVG */}
          <svg
            className={styles['block-bg-svg']}
            viewBox="0 0 1410 770"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
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
            className={styles['form__container-new-pass']}
          >
            <InputForm
              type="password"
              placeholder="Новый пароль"
              label="Новый пароль"
              name="password"
              error={errors.password?.message}
              showPasswordToggle={true}
              {...register('password')}
            />

            <InputForm
              type="password"
              placeholder="Повторите новый пароль"
              label="Повторите новый пароль"
              name="confirmPassword"
              error={errors.confirmPassword?.message}
              showPasswordToggle={true}
              {...register('confirmPassword')}
            />

            <Button type="submit" variant="primary">
              Сохранить пароль
            </Button>
          </form>

          <div className={styles['account__link-new-pass']}>
            <Link to="/login" className={styles['account__link-enter']}>
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
