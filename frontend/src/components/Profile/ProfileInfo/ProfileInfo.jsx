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
              <img
                src={avatarPreview}
                alt="Аватар"
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>Фото профиля</div>
            )}
            <div className={styles.avatarOverlay}></div>
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

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formColumns}>
            <div className={styles.formColumnLeft}>
              <InputForm
                label="Имя Фамилия *"
                placeholder="Имя Фамилия *"
                register={register('fullName')}
                error={errors.fullName}
                inputSize="default"
              />
              <InputForm
                className={styles.regionInput}
                label="Регион *"
                placeholder="Регион *"
                register={register('region')}
                error={errors.region}
                inputSize="default"
              />

              {isFreelancer ? (
                <>
                  <InputForm
                    label="Опыт работы *"
                    placeholder="Опыт работы"
                    register={register('experience')}
                    error={errors.experience}
                    inputSize="default"
                  />
                  <InputForm
                    label="Ставка руб/час"
                    placeholder="Ставка руб/час"
                    register={register('rate')}
                    error={errors.rate}
                    inputSize="default"
                  />
                </>
              ) : null}
              <div className={styles.fullWidth}>
                <InputForm
                  label="Сфера деятельности *"
                  placeholder="Сфера деятельности *"
                  register={register('sphere')}
                  error={errors.sphere}
                  inputSize="default"
                />
                <div className={styles.exampleText}>
                  Например:{' '}
                  <span className={styles.exampleTextSpan}>
                    Frontend Developer{'  '}
                  </span>
                  <span className={styles.exampleTextSpan}>
                    UX/UI дизайнер{'  '}
                  </span>
                  <span className={styles.exampleTextSpan}>SEO </span>
                  <span className={styles.exampleTextSpan}>QA-инженер </span>
                  <span className={styles.exampleTextSpan}>
                    Графический дизайнер{'  '}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.formColumnRight}>
              <InputForm
                label="Телефон"
                placeholder="Телефон"
                register={register('phone')}
                error={errors.phone}
                inputSize="default"
              />
              <InputForm
                className={styles.emailInput}
                label="E-mail *"
                placeholder="E-mail *"
                register={register('email')}
                error={errors.email}
                inputSize="default"
              />
              <InputForm
                label="Site"
                placeholder="Site"
                register={register('site')}
                error={errors.site}
                inputSize="default"
              />
              <InputForm
                label="Telegram"
                placeholder="Telegram"
                register={register('telegram')}
                error={errors.telegram}
                inputSize="default"
              />
              <InputForm
                label="Vk"
                placeholder="Vk"
                register={register('vk')}
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
