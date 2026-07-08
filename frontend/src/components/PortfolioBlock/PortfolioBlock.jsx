import styles from './PortfolioBlock.module.css';

export default function PortfolioBlock() {
  return (
    <div className={styles.portfolioSection}>
      <h3 className={styles.portfolioTitle}>Портфолио</h3>
      <div className={styles.portfolioGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className={styles.portfolioItem}>
            <div className={styles.portfolioAdd}>+</div>
          </div>
        ))}
      </div>
    </div>
  );
}
