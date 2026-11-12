import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ProfileHeader.module.css';
import logoWhite from '../../../assets/img-header/Logo-white.png';
import NotificationsMenu from '../../NotificationsMenu/NotificationsMenu';

export default function ProfileHeader({ className = '' }) {
	const { user } = useAuth();

	return (
		<header className={`${styles.headerProfile} ${className}`}>
			<div className={styles.headerInner}>
				<Link to="/" className={styles.logo}>
					<img src={logoWhite} alt="Logotip" />
				</Link>
				<nav className={styles.nav}>
					<Link to="/orders" className={styles.navLink}>
						Заказы
					</Link>
					<Link to="/freelancers" className={styles.navLink}>
						Исполнители
					</Link>
				</nav>

				<div className={styles.actions}>
					<NotificationsMenu />
					<div className={styles.profileHeaderEmail}>
						<a className={styles.profileHeaderEmailLink} href="mailto:user@example.com">
							<svg
								className={styles.profileHeaderEmailIcon}
								width="24"
								height="20"
								viewBox="0 0 24 20"
								fill="#1A1A1A"
								xmlns="http://www.w3.org/2000/svg"
								aria-label="Email"
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M1.172 1.25571C-7.94729e-08 2.51 0 4.53143 0 8.57143V11.4286C0 15.4686 -7.94729e-08 17.49 1.172 18.7443C2.34267 20 4.22933 20 8 20H16C19.7707 20 21.6573 20 22.828 18.7443C24 17.49 24 15.4686 24 11.4286V8.57143C24 4.53143 24 2.51 22.828 1.25571C21.6573 2.55448e-07 19.7707 0 16 0H8C4.22933 0 2.34267 2.55448e-07 1.172 1.25571ZM4.74 4.52571C4.44579 4.31544 4.08566 4.23899 3.73884 4.3132C3.39202 4.38742 3.08693 4.6062 2.89067 4.92143C2.69441 5.23666 2.62306 5.62251 2.69232 5.9941C2.76159 6.36569 2.96579 6.69258 3.26 6.90286L10.5213 12.0886C10.9593 12.4012 11.4738 12.568 12 12.568C12.5262 12.568 13.0407 12.4012 13.4787 12.0886L20.74 6.90286C21.0342 6.69258 21.2384 6.36569 21.3077 5.9941C21.3769 5.62251 21.3056 5.23666 21.1093 4.92143C20.9131 4.6062 20.608 4.38742 20.2612 4.3132C19.9143 4.23899 19.5542 4.31544 19.26 4.52571L12 9.71143L4.74 4.52571Z"
									fill="#1A1A1A"
								/>
							</svg>
						</a>
					</div>
					{user && (
						<Link to="/profile" className={styles.userInfo} aria-label="Личный кабинет">
							<div className={styles.profileHeaderUser}>{}</div>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
