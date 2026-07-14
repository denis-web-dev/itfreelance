import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProfileEdit.module.css';
import Button from '../../components/Button/Button';
import InputForm from '../../components/InputForm/InputForm';
import PortfolioBlock from '../../components/PortfolioBlock/PortfolioBlock';
import CardBg from '../../components/CardBg/CardBg';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ProfileInfo from '../../components/Profile/ProfileInfo/ProfileInfo';
import defaultAvatar from '../../assets/img-header/avatarBG.png';
import ProfileAbout from '../../components/Profile/ProfileAbout/ProfileAbout';

const baseSchema = z.object({
  fullName: z.string().min(2, 'Введите имя и фамилию'),
  region: z.string().min(1, 'Укажите регион'),
  phone: z.string().min(10, 'Введите корректный телефон'),
  email: z.string().email('Некорректный email'),
  sphere: z.string().min(1, 'Укажите сферу деятельности'),
  about: z.string().max(500, 'Максимум 500 символов').optional(),
  site: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  telegram: z.string().optional(),
  vk: z.string().optional(),
  skills: z.string().optional(),
  tools: z.string().optional(),
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
  // const isFreelancer = user?.role === 'freelancer';
  const isFreelancer = true;
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar || defaultAvatar
  );

  const schema = getSchema(isFreelancer);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user || {},
  });

  const onSubmit = (data) => {
    console.log('Профиль сохранён:', data);
    updateUser(data);
    alert('Профиль успешно обновлён!');
  };

  // ← Обработчик загрузки нового аватара
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Показываем превью на клиенте
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <CardBg
          imageSrc="src/assets/img-header/bg.png"
          className="fullWidthBlock"
        >
          <ProfileHeader />
          <ProfileInfo
            avatarPreview={avatarPreview}
            handleAvatarChange={handleAvatarChange}
            register={register}
            errors={errors}
            isFreelancer={isFreelancer}
            onSubmit={onSubmit}
            handleSubmit={handleSubmit}
          />
        </CardBg>
        <main className={styles.profileMain}>
          <ProfileAbout
          register={register}
          watch={watch}
          errors={errors}
          />
        </main>
      </div>
    </div>
  );
}
