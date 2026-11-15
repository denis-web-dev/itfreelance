import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
	getConversations,
	getConversationByOrder,
	hideConversation,
} from '../../services/conversationsApi';
import styles from './Messages.module.css';

// "Сегодня" или дата ДД.ММ.ГГ
const formatDay = (iso) => {
	const date = new Date(iso);
	if (date.toDateString() === new Date().toDateString()) return 'Сегодня';
	return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// Чат создан, а сообщений ещё нет: показываем приветствие по роли
const PLACEHOLDERS = {
	FREELANCER: 'Заказчик выбрал вас исполнителем!',
	CUSTOMER: 'Вы выбрали исполнителя. Напишите ему первым',
};

export default function Messages() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const orderParam = searchParams.get('order');

	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [confirmId, setConfirmId] = useState(null);

	// Поиск уходит на сервер через 300 мс после последнего нажатия клавиши
	useEffect(() => {
		const timer = setTimeout(() => setQuery(search.trim()), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Ссылка с ?order=: находим чат этого заказа и открываем его
	useEffect(() => {
		if (!orderParam) return;
		let ignore = false;

		async function resolveOrder() {
			try {
				const res = await getConversationByOrder(orderParam);
				if (!ignore) navigate(`/messages/${res.data.id}`, { replace: true });
			} catch (e) {
				if (ignore) return;
				if (e.status === 401) {
					logout();
					return;
				}
				setError(e.message || 'Чат не найден');
				setSearchParams({}, { replace: true });
			}
		}

		resolveOrder();
		return () => {
			ignore = true;
		};
	}, [orderParam, navigate, setSearchParams, logout]);

	// Список чатов
	useEffect(() => {
		if (orderParam) return;
		let ignore = false;

		async function load() {
			try {
				const res = await getConversations({ search: query });
				if (ignore) return;
				setItems(
					res.data.items.map((item) => ({
						...item,
						day: item.lastMessage ? formatDay(item.lastMessage.createdAt) : '',
					})),
				);
				setError('');
			} catch (e) {
				if (ignore) return;
				if (e.status === 401) {
					logout();
					return;
				}
				setError(e.message || 'Не удалось загрузить чаты');
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => {
			ignore = true;
		};
	}, [query, orderParam, logout]);

	// Закрытие окна удаления по Esc и по клику вне меню
	useEffect(() => {
		if (confirmId === null) return;

		const onPointerDown = (e) => {
			if (!e.target.closest('[data-chat-menu]')) setConfirmId(null);
		};
		const onKeyDown = (e) => {
			if (e.key === 'Escape') setConfirmId(null);
		};

		document.addEventListener('mousedown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('mousedown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [confirmId]);

	const handleHide = async (id) => {
		setConfirmId(null);
		try {
			await hideConversation(id);
			setItems((prev) => prev.filter((item) => item.id !== id));
		} catch (e) {
			setError(e.message || 'Не удалось удалить чат');
		}
	};

	return (
		<div className={styles.page}>
			<ProfileHeader />

			<main className={styles.shell}>
				<div className={styles.search}>
					<svg
						className={styles.searchIcon}
						width="20"
						height="20"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							fill="currentColor"
							d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
						/>
					</svg>
					<input
						type="search"
						className={styles.searchInput}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Поиск по сообщениям"
						aria-label="Поиск по сообщениям"
						maxLength={100}
					/>
				</div>

				<div className={styles.headRow}>
					<h1 className={styles.title}>Чаты</h1>
					{!loading && !error && <span className={styles.count}>Найдено: {items.length}</span>}
				</div>

				{(loading || orderParam) && !error && (
					<p className={styles.status}>{orderParam ? 'Открываем чат...' : 'Загрузка...'}</p>
				)}
				{error && (
					<p className={styles.error} role="alert">
						{error}
					</p>
				)}

				{!loading && !orderParam && !error && items.length === 0 && (
					<p className={styles.status}>
						{query
							? 'По вашему запросу ничего не найдено'
							: 'Чатов пока нет. Чат появится, когда заказчик выберет исполнителя для заказа.'}
					</p>
				)}

				{!orderParam && items.length > 0 && (
					<ul className={styles.list}>
						{items.map((item) => (
							<li key={item.id} className={styles.card}>
								<Link to={`/messages/${item.id}`} className={styles.cardLink}>
									<span className={styles.row}>
										<span className={styles.name}>
											{item.unread > 0 && (
												<span
													className={styles.dot}
													role="img"
													aria-label={`Непрочитанных: ${item.unread}`}
												/>
											)}
											{item.partner.name}
										</span>
										<span className={styles.day}>{item.day}</span>
									</span>
									<span className={styles.order}>{item.orderTitle}</span>
									<span className={styles.last}>
										{item.lastMessage ? item.lastMessage.text : PLACEHOLDERS[item.role]}
									</span>
								</Link>

								<div className={styles.menu} data-chat-menu>
									<button
										type="button"
										className={clsx(styles.menuBtn, confirmId === item.id && styles.menuBtnActive)}
										aria-label="Действия с чатом"
										aria-expanded={confirmId === item.id}
										onClick={() => setConfirmId(confirmId === item.id ? null : item.id)}
									>
										•••
									</button>
									{confirmId === item.id && (
										<div className={styles.popover} role="dialog" aria-label="Удаление чата">
											<p className={styles.popText}>Вы действительно хотите удалить чат?</p>
											<button
												type="button"
												className={styles.popClose}
												onClick={() => setConfirmId(null)}
												aria-label="Отмена"
											>
												×
											</button>
											<button
												type="button"
												className={styles.popDelete}
												onClick={() => handleHide(item.id)}
											>
												Удалить
											</button>
										</div>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</main>
		</div>
	);
}
