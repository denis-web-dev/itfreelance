import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProfileEdit.module.css';
import Button from '../../components/Button/Button';
import InputForm from '../../components/InputForm/InputForm';
import PortfolioBlock from '../../components/PortfolioBlock/PortfolioBlock';

const baseSchema = z.object({
  fullName: z.string().min(2, 'Введите имя и фамилию'),
  region: z.string().min(1, 'Укажите регион'),
  phone: z.string().min(10, 'Введите корректный телефон'),
  email: z.string().email('Некорректный email'),
  sphere: z.string().min(1, 'Укажите сферу деятельности'),
  about: z.string().max(1000, 'Максимум 1000 символов').optional(),
});

const freelancerSchema = baseSchema.extend({
  experience: z.string().min(1, 'Укажите опыт работы'),
  rate: z.string().min(1, 'Укажите ставку руб/час'),
});

const customerSchema = baseSchema.extend({
  companyName: z.string().min(2, 'Введите название компании'),
  marketYears: z.string().min(1, 'Укажите количество лет на рынке'),
});

const getSchema = (isFreelancer) =>
  isFreelancer ? freelancerSchema : customerSchema;

export default function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const isFreelancer = user?.role === 'freelancer';

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const schema = getSchema(isFreelancer);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user || {},
  });

  const onSubmit = (data) => {
    console.log('Профиль сохранён:', data);
    updateUser(data);
    alert('Профиль успешно обновлён!');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>Информация</h1>

        <div className={styles.content}>
          {/* Блок аватара */}
          <div className={styles.avatarBlock}>
            <div className={styles.avatarWrapper}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Аватар"
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>Фото профиля</div>
              )}
            </div>
            <label className={styles.uploadButton}>
              Загрузить
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              <InputForm
                label="Имя Фамилия *"
                register={register('fullName')}
                error={errors.fullName}
              />
              <InputForm
                label="Регион *"
                register={register('region')}
                error={errors.region}
              />

              {isFreelancer ? (
                <>
                  <InputForm
                    label="Опыт работы *"
                    register={register('experience')}
                    error={errors.experience}
                  />
                  <InputForm
                    label="Ставка руб/час *"
                    register={register('rate')}
                    error={errors.rate}
                  />
                </>
              ) : (
                <>
                  <InputForm
                    label="Название компании *"
                    register={register('companyName')}
                    error={errors.companyName}
                  />
                  <InputForm
                    label="Лет на рынке *"
                    register={register('marketYears')}
                    error={errors.marketYears}
                  />
                </>
              )}

              <InputForm
                label="Телефон"
                register={register('phone')}
                error={errors.phone}
              />
              <InputForm
                label="E-mail *"
                register={register('email')}
                error={errors.email}
              />

              <div className={styles.fullWidth}>
                <InputForm
                  label="Сфера деятельности *"
                  register={register('sphere')}
                  error={errors.sphere}
                />
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>
                  О себе{isFreelancer ? '' : ' / О компании'}
                </label>
                <textarea
                  className={styles.textarea}
                  {...register('about')}
                  placeholder="Расскажите о себе..."
                />
              </div>
            </div>

            {/* Портфолио */}
            {isFreelancer && <PortfolioBlock />}

            <Button
              type="submit"
              variant="primary"
              className={styles.saveButton}
            >
              Сохранить изменения
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
