import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile, updateMyProfile } from '../../services/profileApi';
import { toFieldErrors } from '../../services/api';
import { apiToForm, formToApi } from '../../utils/profileMapper';
import styles from './ProfileEdit.module.css';
import SaveButton from '../../components/ui/SaveButton/SaveButton';
import CardBg from '../../components/CardBg/CardBg';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ProfileInfo from '../../components/Profile/ProfileInfo/ProfileInfo';
import bgImage from '../../assets/img-header/bg.png';
import defaultAvatar from '../../assets/img-header/avatarBG.png';
import ProfileAbout from '../../components/Profile/ProfileAbout/ProfileAbout';
import ProfilePortfolio from '../../components/Profile/ProfilePortfolio/ProfilePortfolio';

const baseSchema = z.object({
	fullName: z.string().trim().min(2, 'Введите имя и фамилию'),
	email: z.string(), // только для чтения, значение берётся из аккаунта
	region: z.string().max(100, 'Не более 100 символов'),
	phone: z.string().regex(/^\+?[0-9\s()-]{10,20}$/, 'Введите корректный телефон'),
	sphere: z.string().trim().min(1, 'Укажите сферу деятельности').max(100),
	about: z.string().max(500, 'Максимум 500 символов').optional(),
	site: z
		.string()
		.max(200, 'Не более 200 символов')
		.refine(
			(value) => value === '' || /^https?:\/\/\S+$/i.test(value),
			'Введите ссылку, начиная с http:// или https://',
		)
		.optional(),
	telegram: z.string().max(64, 'Не более 64 символов').optional(),
	vk: z.string().max(100, 'Не более 100 символов').optional(),
	skills: z.string().optional(),
	tools: z.string().optional(),
});

const freelancerSchema = baseSchema.extend({
	experience: z.string().min(1, 'Укажите опыт работы'),
	rate: z.string().regex(/^\d+$/, 'Укажите ставку числом (руб/час)'),
});

const customerSchema = baseSchema.extend({
	companyName: z.string().min(2, 'Введите название компании'),
	marketYears: z.string().regex(/^\d+$/, 'Укажите количество лет числом'),
});

const getSchema = (isFreelancer) => (isFreelancer ? freelancerSchema : customerSchema);

export default function ProfileEdit() {
	const { user, updateUser, logout } = useAuth();
	const isFreelancer = user?.role === 'FREELANCER';

	const [avatarPreview, setAvatarPreview] = useState(user?.avatar || defaultAvatar);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors },
		watch,
	} = useForm({
		resolver: zodResolver(getSchema(isFreelancer)),
		defaultValues: apiToForm({ user, profile: null }),
	});

	// Загружаем профиль с сервера при открытии страницы
	useEffect(() => {
		let ignore = false;

		const load = async () => {
			try {
				const result = await getMyProfile();
				if (!ignore) reset(apiToForm(result.data));
			} catch (error) {
				if (error.status === 401) {
					logout(); // сессия истекла: ProtectedRoute перенаправит на вход
					return;
				}
				if (!ignore) setStatus({ type: 'error', text: error.message });
			} finally {
				if (!ignore) setIsLoading(false);
			}
		};

		load();
		return () => {
			ignore = true;
		};
		// Загрузка нужна один раз при открытии страницы
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = async (data) => {
		setIsSaving(true);
		setStatus(null);

		try {
			const result = await updateMyProfile(formToApi(data, isFreelancer));
			reset(apiToForm(result.data));
			updateUser({ fullName: result.data.profile.fullName });
			setStatus({ type: 'success', text: 'Профиль сохранён' });
		} catch (error) {
			if (error.status === 401) {
				logout();
				return;
			}
			// Ошибки сервера показываем под нужными полями
			const fieldErrors = Object.entries(toFieldErrors(error));
			fieldErrors.forEach(([field, message]) => {
				setError(field.split('.')[0], { message });
			});
			setStatus({
				type: 'error',
				text: fieldErrors.length ? 'Проверьте выделенные поля' : error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Показ превью выбранного аватара (сохранение на сервер будет отдельным шагом)
	const handleAvatarChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => setAvatarPreview(reader.result);
			reader.readAsDataURL(file);
		}
	};

	if (isLoading) return <p className="container">Загрузка...</p>;

	return (
		<div className={styles.wrapper}>
			<div className="container">
				<CardBg imageSrc={bgImage} className="fullWidthBlock">
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
					<ProfileAbout register={register} watch={watch} errors={errors} />
					<ProfilePortfolio />
					{status && (
						<p
							className={status.type === 'error' ? styles.noticeError : styles.noticeSuccess}
							role={status.type === 'error' ? 'alert' : 'status'}
						>
							{status.text}
						</p>
					)}
					<div className={styles.saveWrapper}>
						<SaveButton type="submit" onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
							Сохранить
						</SaveButton>
					</div>
				</main>
			</div>
		</div>
	);
}
