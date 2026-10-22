import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import CloseIcon from '../../Icons/CloseIcon';
import styles from './CloseButton.module.css';

const ICON_SIZE = {
	small: 14,
	medium: 16,
	large: 18,
};

export default function CloseButton({
	onClick,
	to = '/',
	className = '',
	ariaLabel = 'Закрыть',
	size = 'medium', // 'small' | 'medium' | 'large'
	variant = 'default', // 'default' | 'dark' | 'light' | 'transparent' |
	type = 'button',
}) {
	const navigate = useNavigate();
	const handleClick = (event) => {
		if (onClick) {
			onClick(event);
			return;
		}
		navigate(to);
	};
	return (
		<button
			type={type}
			onClick={handleClick}
			className={clsx(
				styles['close-btn'],
				styles[`close-btn--${size}`],
				styles[`close-btn--${variant}`],
				className,
			)}
			aria-label={ariaLabel}
		>
			<CloseIcon size={ICON_SIZE[size] ?? ICON_SIZE.medium} className={styles['close-btn-svg']} />
		</button>
	);
}
