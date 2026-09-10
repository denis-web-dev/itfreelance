// src/components/ui/ActionButton/ActionButton.jsx
import clsx from 'clsx';
import styles from './ActionButton.module.css';

export default function ActionButton({
  onClick,
  type = 'button',
  variant = 'add', // 'add' | 'edit' | 'delete'
  size = 'medium', // 'small' | 'medium'
  className = '',
  ariaLabel,
}) {
  const icons = {
    add: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.4 0C8.61217 0 8.81566 0.0842856 8.96569 0.234315C9.11572 0.384344 9.2 0.587827 9.2 0.8V6.8H15.2C15.4122 6.8 15.6157 6.88429 15.7657 7.03431C15.9157 7.18434 16 7.38783 16 7.6V8.4C16 8.61217 15.9157 8.81566 15.7657 8.96569C15.6157 9.11572 15.4122 9.2 15.2 9.2H9.2V15.2C9.2 15.4122 9.11572 15.6157 8.96569 15.7657C8.81566 15.9157 8.61217 16 8.4 16H7.6C7.38783 16 7.18434 15.9157 7.03431 15.7657C6.88429 15.6157 6.8 15.4122 6.8 15.2V9.2H0.8C0.587827 9.2 0.384344 9.11572 0.234315 8.96569C0.0842856 8.81566 0 8.61217 0 8.4V7.6C0 7.38783 0.0842856 7.18434 0.234315 7.03431C0.384344 6.88429 0.587827 6.8 0.8 6.8H6.8V0.8C6.8 0.587827 6.88429 0.384344 7.03431 0.234315C7.18434 0.0842856 7.38783 0 7.6 0H8.4Z"
          fill="currentColor"
        />
      </svg>
    ),

    edit: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.5 2.5L15.5 5.5M13 1L4 10L2 13L5 11L14 2L13 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    // 🗑️ УДАЛИТЬ
    delete: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 5L5 13M5 5L13 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  const sizes = {
    small: styles['action-btn--small'],
    medium: styles['action-btn--medium'],
  };

  const variants = {
    add: styles['action-btn--add'],
    edit: styles['action-btn--edit'],
    delete: styles['action-btn--delete'],
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        styles['action-btn'],
        sizes[size],
        variants[variant],
        className
      )}
      aria-label={ariaLabel || `${variant} item`}
    >
      {icons[variant]}
    </button>
  );
}
