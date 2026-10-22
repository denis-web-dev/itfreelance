import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import styles from './CabinetTabs.module.css';

const Icon = ({ path }) => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d={path} />
	</svg>
);

const ICONS = {
	check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
	heart:
		'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
	person:
		'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
	gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
};

const tabClass = ({ isActive }) => clsx(styles.tab, isActive && styles.tabActive);

export default function CabinetTabs({ showEdit }) {
	return (
		<nav className={styles.bar} aria-label="Разделы кабинета">
			<div className={styles.group}>
				<NavLink to="/profile/deals" className={tabClass}>
					<Icon path={ICONS.check} />
					Сделки
				</NavLink>
				<NavLink to="/profile/favorites" className={tabClass}>
					<Icon path={ICONS.heart} />
					Избранное
				</NavLink>
				<NavLink to="/profile/about" className={tabClass}>
					<Icon path={ICONS.person} />
					Профиль
				</NavLink>
			</div>

			<div className={styles.group}>
				{showEdit && (
					<Link to="/profile/edit" className={styles.tab}>
						Редактировать
					</Link>
				)}
				<NavLink
					to="/profile/settings"
					className={({ isActive }) => clsx(styles.tab, styles.gear, isActive && styles.tabActive)}
					aria-label="Настройки"
				>
					<Icon path={ICONS.gear} />
				</NavLink>
			</div>
		</nav>
	);
}
