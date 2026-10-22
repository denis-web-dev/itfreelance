import { Controller } from 'react-hook-form';
import InputForm from '../../InputForm/InputForm';
import TagInput from '../../TagInput/TagInput';
import styles from './ProfileAbout.module.css';

export default function ProfileAbout({ register, watch, errors, control, isFreelancer = true }) {
	const aboutText = watch('about') || '';

	const getCounterClass = () => {
		const len = aboutText.length;
		if (len >= 500) return styles.danger;
		if (len >= 400) return styles.warning;
		return '';
	};

	const getBorderClass = () => {
		const len = aboutText.length;
		if (len >= 500) return styles.dangerBorder;
		if (len >= 400) return styles.warningBorder;
		return '';
	};

	return (
		<div className={styles.profileAbout}>
			<h2 className={styles.aboutTitle}>{isFreelancer ? 'Обо мне' : 'О компании'}</h2>

			<div className={styles.aboutContent}>
				<div className={styles.aboutLeft}>
					<div className={styles.textareaWrapper}>
						<InputForm
							label={isFreelancer ? 'О себе' : 'О компании'}
							placeholder={isFreelancer ? 'О себе' : 'О компании'}
							field={register('about')}
							name="about"
							error={errors?.about?.message}
							isTextarea={true}
							className={`${styles.aboutTextarea} ${getBorderClass()}`}
							placeholderClassName={styles.aboutPlaceholder}
							maxLength={500}
						/>
						<span className={`${styles.charCount} ${getCounterClass()}`}>
							{aboutText.length}/500
						</span>
					</div>
				</div>

				{/* Навыки и инструменты — только исполнитель */}
				{isFreelancer && (
					<div className={styles.aboutRight}>
						<div className={styles.skillsBlock}>
							<Controller
								name="skills"
								control={control}
								render={({ field }) => (
									<TagInput
										label="Навыки"
										placeholder="Например: Верстка"
										value={field.value ?? []}
										onChange={field.onChange}
										error={errors?.skills?.message}
									/>
								)}
							/>
							<p className={styles.hint}>Введите через запятую</p>
						</div>

						<div className={styles.toolsBlock}>
							<Controller
								name="tools"
								control={control}
								render={({ field }) => (
									<TagInput
										label="Инструменты"
										placeholder="Например: Figma"
										value={field.value ?? []}
										onChange={field.onChange}
										error={errors?.tools?.message}
									/>
								)}
							/>
							<p className={styles.hint}>Введите через запятую</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
