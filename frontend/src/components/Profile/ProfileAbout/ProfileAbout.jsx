import InputForm from '../../InputForm/InputForm';
import styles from './ProfileAbout.module.css';

export default function ProfileAbout({ register, watch, errors }) {
  const aboutText = watch('about') || '';

  console.log('🔍 aboutText:', aboutText); // ← Проверь в консоли
  console.log('📏 length:', aboutText.length);

  // Класс для счетчика
  const getCounterClass = () => {
    const len = aboutText.length;
    if (len >= 500) return styles.danger;
    if (len >= 400) return styles.warning;
    return '';
  };

  // Класс для рамки textarea
  const getBorderClass = () => {
    const len = aboutText.length;
    if (len >= 500) return styles.dangerBorder;
    if (len >= 400) return styles.warningBorder;
    return '';
  };

  return (
    <div className={styles.profileAbout}>
      <h2 className={styles.aboutTitle}>Обо мне</h2>

      <div className={styles.aboutContent}>
        <div className={styles.aboutLeft}>
          <div className={styles.textareaWrapper}>
            <InputForm
              label="О себе"
              placeholder="О себе"
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
        <div className={styles.aboutRight}>
          <div className={styles.skillsBlock}>
            <InputForm
              label="Навыки"
              placeholder="JavaScript, React, CSS..."
              field={register('skills')}
              error={errors?.skills?.message}
            />
            <p className={styles.hint}>Вводите через запятую</p>
          </div>

          <div className={styles.toolsBlock}>
            <InputForm
              label="Инструменты"
              placeholder="Figma, VS Code, Git..."
              field={register('tools')}
              error={errors?.tools?.message}
            />
            <p className={styles.hint}>Вводите через запятую</p>
          </div>
        </div>
      </div>
    </div>
  );
}
