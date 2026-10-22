import clsx from 'clsx';
import UserIcon from '../../Icons/UserIcon';
import styles from './UserIconCreate.module.css';

const ICON_SIZE = {
	small: 16,
	medium: 24,
	large: 32,
};

export default function UserIconCreate({
	size = 'medium', // 'small' | 'medium' | 'large'
	variant = 'light', // 'light' | 'dark' | 'pink' | 'yellow'
	className = '',
}) {
	return (
		<span
			className={clsx(
				styles.userIconCreate,
				styles[`userIconCreate--${size}`],
				styles[`userIconCreate--${variant}`],
				className,
			)}
			aria-hidden="true"
		>
			<UserIcon size={ICON_SIZE[size] ?? ICON_SIZE.medium} className={styles.icon} />
		</span>
	);
}
