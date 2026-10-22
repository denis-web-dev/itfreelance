import InputForm from '../../../components/InputForm/InputForm';
import styles from './ProfileInfo.module.css';

export default function ProfileInfo({
	avatarPreview,
	handleAvatarChange,
	register,
	errors,
	isFreelancer,
	onSubmit,
	handleSubmit,
}) {
	return (
		<div className={styles.profileInfo}>
			<div className={styles.profileContent}>
				<div className={styles.avatarBlock}>
					<h1 className={styles.profileTitle}>Информация</h1>
					<div className={styles.avatarWrapper}>
						{avatarPreview ? (
							<img src={avatarPreview} alt="Аватар" className={styles.avatarImg} />
						) : (
							<div className={styles.avatarPlaceholder}>Фото профиля</div>
						)}
						<div className={styles.avatarOverlay}></div>
					</div>
					<label className={styles.uploadButton}>
						Загрузить
						<input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
					</label>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
					<div className={styles.formColumns}>
						<div className={styles.formColumnLeft}>
							{isFreelancer ? (
								<InputForm
									label="Имя Фамилия *"
									placeholder="Имя Фамилия *"
									field={register('fullName')}
									error={errors.fullName}
								/>
							) : (
								<InputForm
									label="Название компании *"
									placeholder="Название компании *"
									field={register('companyName')}
									error={errors.companyName}
								/>
							)}
							<InputForm
								className={styles.regionInput}
								label="Регион *"
								placeholder="Регион *"
								field={register('region')}
								error={errors.region}
								inputSize="default"
							/>

							{isFreelancer ? (
								<>
									<InputForm
										label="Опыт работы *"
										placeholder="Опыт работы"
										field={register('experience')}
										error={errors.experience}
										inputSize="default"
									/>
									<InputForm
										label="Ставка руб/час"
										placeholder="Ставка руб/час"
										field={register('rate')}
										error={errors.rate}
										inputSize="default"
									/>
								</>
							) : (
								<>
									<InputForm
										label="Кол-во лет на рынке *"
										placeholder="Кол-во лет на рынке *"
										field={register('marketYears')}
										error={errors.marketYears}
										inputSize="default"
									/>
								</>
							)}
							<div className={styles.fullWidth}>
								<InputForm
									label="Сфера деятельности *"
									placeholder="Сфера деятельности *"
									field={register('sphere')}
									error={errors.sphere}
									inputSize="default"
								/>
								{/* <div className={styles.exampleText}>
									Например: <span className={styles.exampleTextSpan}>Frontend Developer{'  '}</span>
									<span className={styles.exampleTextSpan}>UX/UI дизайнер{'  '}</span>
									<span className={styles.exampleTextSpan}>SEO </span>
									<span className={styles.exampleTextSpan}>QA-инженер </span>
									<span className={styles.exampleTextSpan}>Графический дизайнер{'  '}</span>
								</div> */}
							</div>
						</div>

						<div className={styles.formColumnRight}>
							<InputForm
								label="Телефон"
								placeholder="Телефон"
								field={register('phone')}
								error={errors.phone}
								inputSize="default"
							/>
							<InputForm
								className={styles.emailInput}
								label="E-mail *"
								placeholder="E-mail *"
								field={register('email')}
								error={errors.email}
								inputSize="default"
								readOnly
							/>
							<InputForm
								label="Site"
								placeholder="Site"
								field={register('site')}
								error={errors.site}
								inputSize="default"
							/>
							<InputForm
								label="Telegram"
								placeholder="Telegram"
								field={register('telegram')}
								error={errors.telegram}
								inputSize="default"
							/>
							<InputForm
								label="Vk"
								placeholder="Vk"
								field={register('vk')}
								error={errors.vk}
								inputSize="default"
							/>
						</div>
					</div>
				</form>
				{/* <div className={styles.profileBtn}>
            <Button
              type="submit"
              variant="primary"
              className={styles.saveButton}
            >
              Сохранить изменения
            </Button>
          </div> */}
			</div>
		</div>
	);
}
