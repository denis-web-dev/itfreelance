// src/components/ui/CloseButton/CloseButton.jsx
import styles from './CloseButton.module.css';

export default function CloseButton({ onClick, className = '' }) {
  return (
    <button
      className={`${styles.closeButton} ${className}`}
      onClick={onClick}
      aria-label="Закрыть"
      type="button"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18M6 6L18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
