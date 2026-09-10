// src/components/ui/SaveButton/SaveButton.jsx
import clsx from 'clsx';
import styles from './SaveButton.module.css';

export default function SaveButton({
  onClick,
  type = 'button',
  children = 'Сохранить изменения',
  className = '',
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  isLoading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(
        styles['save-btn'],
        styles[`save-btn--${variant}`],
        isLoading && styles['save-btn--loading'],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className={styles['save-btn__loader']}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="30 30"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 10 10"
                to="360 10 10"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          Сохранение...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
