import clsx from 'clsx';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

function Button({
  variant = 'default',
  children,
  ariaLabel,
  onClick,
  className,
}) {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.string,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;
