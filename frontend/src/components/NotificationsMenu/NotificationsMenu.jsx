import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
} from '../../services/notificationsApi';
import { formatDate } from '../../utils/format';
import headerStyles from '../Profile/ProfileHeader/ProfileHeader.module.css';
import styles from './NotificationsMenu.module.css';

// "5 мин назад", "3 ч назад", "Вчера", иначе дата
const formatAgo = (iso) => {
	const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return 'Только что';
	if (minutes < 60) return `${minutes} мин назад`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} ч назад`;
	if (hours < 48) return 'Вчера';
	return formatDate(iso);
};

// Загружает уведомления и готовит их к показу. Состояние не трогает
const fetchNotifications = async () => {
	const res = await getNotifications({ limit: 10 });
	return {
		items: res.data.items.map((item) => ({ ...item, ago: formatAgo(item.createdAt) })),
		unread: res.data.unread,
	};
};

function BellIcon({ hasUnread }) {
	return (
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.4164 0.679519C12.8151 1.46866 12.4504 2.39902 12.3616 3.37078C12.2727 4.34255 12.4629 5.31906 12.9118 6.19555C13.3608 7.07205 14.0515 7.81546 14.9099 8.34604C15.7683 8.87662 16.762 9.17434 17.7844 9.20728V9.21854C17.8005 9.42116 17.8166 9.62891 17.8381 9.82949C18.0924 12.129 18.672 13.7081 19.229 14.7447C19.5992 15.4355 19.963 15.894 20.2206 16.1713C20.3337 16.2936 20.4556 16.4082 20.5855 16.5142L20.5962 16.5203C20.7339 16.6156 20.8364 16.7501 20.889 16.9044C20.9416 17.0587 20.9415 17.2249 20.8888 17.3792C20.8361 17.5335 20.7335 17.6678 20.5957 17.763C20.4579 17.8582 20.292 17.9093 20.1219 17.909H0.803962C0.634181 17.9088 0.468811 17.8574 0.331501 17.7622C0.194191 17.667 0.0919724 17.5328 0.0394631 17.3789C-0.0130461 17.2249 -0.0131568 17.0591 0.0391469 16.905C0.0914506 16.751 0.19349 16.6167 0.330673 16.5213L0.339259 16.5142L0.407945 16.4589C0.472338 16.4036 0.57644 16.3105 0.705226 16.1713C0.962798 15.895 1.32662 15.4365 1.69688 14.7458C2.4374 13.3652 3.2187 11.032 3.2187 7.31711C3.2187 5.39215 3.96995 3.53677 5.32221 2.16136C6.67661 0.783903 8.52469 0 10.4629 0C10.8736 0 11.2789 0.0344535 11.6789 0.103361C11.9343 0.147366 12.7714 0.396045 13.4164 0.679519Z"
				fill="#1A1A1A"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8.20272 19.5474C8.29419 19.4969 8.3952 19.464 8.49998 19.4507C8.60477 19.4374 8.71128 19.4439 8.81343 19.4699C8.91558 19.4958 9.01137 19.5407 9.09533 19.6019C9.17929 19.6632 9.24978 19.7396 9.30277 19.8268C9.42073 20.0205 9.58998 20.1813 9.79358 20.2931C9.99718 20.4049 10.228 20.4637 10.4629 20.4637C10.6978 20.4637 10.9287 20.4049 11.1323 20.2931C11.3359 20.1813 11.5051 20.0205 11.6231 19.8268C11.6761 19.7396 11.7467 19.6632 11.8307 19.602C11.9147 19.5408 12.0106 19.4959 12.1128 19.47C12.215 19.4441 12.3215 19.4377 12.4263 19.4511C12.5312 19.4644 12.6322 19.4973 12.7236 19.5479C12.8151 19.5985 12.8952 19.6658 12.9594 19.7459C13.0236 19.8261 13.0707 19.9175 13.0978 20.0149C13.125 20.1124 13.1317 20.214 13.1177 20.3139C13.1037 20.4139 13.0692 20.5102 13.0161 20.5974C12.7567 21.024 12.3843 21.3781 11.9362 21.6243C11.4881 21.8704 10.9801 22 10.4629 22C9.94578 22 9.43772 21.8704 8.98963 21.6243C8.54153 21.3781 8.16914 21.024 7.90973 20.5974C7.85657 20.5101 7.82197 20.4137 7.80792 20.3137C7.79387 20.2137 7.80065 20.112 7.82786 20.0145C7.85508 19.917 7.90219 19.8255 7.96652 19.7454C8.03084 19.6652 8.11111 19.598 8.20272 19.5474Z"
				fill="#1A1A1A"
			/>
			{/* Жёлтая точка видна, только если есть непрочитанные */}
			{hasUnread && <circle cx="17.98" cy="3.84" r="4.02" fill="#FFCB30" />}
		</svg>
	);
}

export default function NotificationsMenu() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const rootRef = useRef(null);
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState([]);
	const [unread, setUnread] = useState(0);

	// Первая загрузка: нужна, чтобы показать жёлтую точку на колокольчике
	useEffect(() => {
		if (!user) return;
		let ignore = false;

		async function loadInitial() {
			try {
				const data = await fetchNotifications();
				if (ignore) return;
				setItems(data.items);
				setUnread(data.unread);
			} catch {
				// Колокольчик не должен ломать страницу, если сервер недоступен
			}
		}

		loadInitial();
		return () => {
			ignore = true;
		};
	}, [user]);

	// Обновление при открытии окна (вызывается из обработчика клика, не из эффекта)
	const refresh = async () => {
		try {
			const data = await fetchNotifications();
			setItems(data.items);
			setUnread(data.unread);
		} catch {
			// см. выше
		}
	};

	// Закрытие по Esc и по клику вне окна
	useEffect(() => {
		if (!open) return;

		const onPointerDown = (e) => {
			if (!rootRef.current?.contains(e.target)) setOpen(false);
		};
		const onKeyDown = (e) => {
			if (e.key === 'Escape') setOpen(false);
		};

		document.addEventListener('mousedown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('mousedown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	const toggle = () => {
		if (!open) refresh();
		setOpen((value) => !value);
	};

	const openItem = (item) => {
		setOpen(false);
		if (!item.readAt) {
			setItems((prev) =>
				prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
			);
			setUnread((count) => Math.max(0, count - 1));
			markNotificationRead(item.id).catch(() => {});
		}
		if (item.orderId) navigate(`/orders/${item.orderId}`);
	};

	const readAll = () => {
		setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
		setUnread(0);
		markAllNotificationsRead().catch(() => {});
	};

	return (
		<div className={styles.root} ref={rootRef}>
			<button
				type="button"
				className={headerStyles.profileHeaderBtnNotification}
				onClick={toggle}
				aria-haspopup="true"
				aria-expanded={open}
				aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
			>
				<BellIcon hasUnread={unread > 0} />
			</button>

			{open && (
				<div className={styles.panel} role="region" aria-label="Уведомления">
					{items.length === 0 ? (
						<p className={styles.empty}>Уведомлений пока нет</p>
					) : (
						<ul className={styles.list}>
							{items.map((item) => (
								<li key={item.id}>
									<button type="button" className={styles.item} onClick={() => openItem(item)}>
										<span className={styles.itemTitle}>
											{!item.readAt && <span className={styles.dot} aria-hidden="true" />}
											{item.title}
										</span>
										<span className={styles.itemBody}>{item.body}</span>
										<span className={styles.itemTime}>{item.ago}</span>
									</button>
								</li>
							))}
						</ul>
					)}

					{unread > 0 && (
						<button type="button" className={styles.readAll} onClick={readAll}>
							Отметить все прочитанными
						</button>
					)}
				</div>
			)}
		</div>
	);
}
