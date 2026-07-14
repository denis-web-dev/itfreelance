import styles from './CardBg.module.css';

export default function CardBg({
  children,
  imageSrc,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.wrapper} ${className}`} {...props}>
      <div className={styles.background}>
        <img className={styles.backgroundImage} src={imageSrc} alt="фон" />
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
