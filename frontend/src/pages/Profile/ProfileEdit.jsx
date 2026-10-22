import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const tagList = z
	.array(z.string().trim().min(1).max(50, 'Не более 50 символов'))
	.max(20, 'Не более 20 пунктов');

const baseSchema = z.object({
	email: z.string(),
	region: z.string().trim().min(1, 'Укажите регион').max(100),
	phone: z.string().regex(/^\+?[0-9\s()-]{10,20}$/, 'Введите корректный телефон'),
	sphere: z.string().trim().min(1, 'Укажите сферу деятельности').max(100),
	about: z.string().max(500, 'Максимум 500 символов').optional(),
	site: z
		.string()
		.max(200)
		.refine(
			(value) => value === '' || /^https?:\/\/\S+$/i.test(value),
			'Введите ссылку, начиная с http:// или https://',
		)
		.optional(),
	telegram: z.string().max(64).optional(),
	vk: z.string().max(100).optional(),
});

const freelancerSchema = baseSchema.extend({
	fullName: z.string().trim().min(2, 'Введите имя и фамилию'),
	experience: z.string().min(1, 'Укажите опыт работы'),
	rate: z.string().trim().regex(/^\d+$/, 'Укажите ставку числом (руб/час)'),
	skills: tagList.default([]),
	tools: tagList.default([]),
});

const customerSchema = baseSchema.extend({
	fullName: z.string().optional(),
	companyName: z.string().min(2, 'Введите название компании'),
	marketYears: z.string().trim().regex(/^\d+$/, 'Укажите количество лет числом'),
});

const getSchema = (isFreelancer) => (isFreelancer ? freelancerSchema : customerSchema);

export default function ProfileEdit() {
	const navigate = useNavigate();
	const { user, updateUser, logout } = useAuth();
	const isFreelancer = user?.role === 'FREELANCER';

	const [avatarPreview, setAvatarPreview] = useState(user?.avatar || defaultAvatar);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [status, setStatus] = useState(null);

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors },
		watch,
		control,
	} = useForm({
		resolver: zodResolver(getSchema(isFreelancer)),
		defaultValues: apiToForm({
			...user,
			rate: user?.rate != null ? String(user.rate) : '',
			marketYears: user?.marketYears != null ? String(user.marketYears) : '',
			skills: Array.isArray(user?.skills) ? user.skills : [],
			tools: Array.isArray(user?.tools) ? user.tools : [],
		}),
	});

	useEffect(() => {
		let ignore = false;

		const load = async () => {
			try {
				const result = await getMyProfile();
				if (!ignore) reset(apiToForm(result.data));
			} catch (error) {
				if (error.status === 401) {
					logout();
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = async (data) => {
		setIsSaving(true);
		setStatus(null);

		try {
			const result = await updateMyProfile(formToApi(data, isFreelancer));
			reset(apiToForm(result.data));
			updateUser({ fullName: result.data.profile.fullName });
			// После сохранения — в кабинет
			navigate('/profile/about');
		} catch (error) {
			if (error.status === 401) {
				logout();
				return;
			}
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
					<ProfileAbout
						register={register}
						watch={watch}
						errors={errors}
						control={control}
						isFreelancer={isFreelancer}
					/>

					{isFreelancer && <ProfilePortfolio />}
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
