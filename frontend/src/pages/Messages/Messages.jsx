import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations } from '../../services/conversationsApi';
import styles from './Messages.module.css';

export default function Messages() {
	const { logout } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let ignore = false;

		async function load() {
			try {
				const res = await getConversations();
				if (ignore) return;
				setItems(res.data.items);
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
	}, [logout, reloadKey]);

	// Какой чат открыт: ?c= или ?order= из адреса, иначе самый свежий
	const chatParam = searchParams.get('c');
	const orderParam = searchParams.get('order');
	const selected =
		items.find((item) => item.id === chatParam) ??
		items.find((item) => item.orderId === orderParam) ??
		items[0] ??
		null;

	const handleSent = useCallback(() => setReloadKey((key) => key + 1), []);

	// Собеседник прочитал: обнуляем счётчик в списке без повторного запроса
	const handleRead = useCallback((id) => {
		setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: 0 } : item)));
	}, []);

	return (
		<div className={styles.page}>
			<ProfileHeader />

			<main className={styles.shell}>
				<h1 className={styles.title}>Сообщения</h1>

				{loading && <p className={styles.status}>Загрузка...</p>}
				{error && (
					<p className={styles.error} role="alert">
						{error}
					</p>
				)}

				{!loading && !error && items.length === 0 && (
					<p className={styles.status}>
						Чатов пока нет. Чат появится, когда заказчик выберет исполнителя для заказа.
					</p>
				)}

				{!loading && !error && items.length > 0 && (
					<div className={styles.layout}>
						<ul className={styles.list}>
							{items.map((item) => (
								<li key={item.id}>
									<button
										type="button"
										className={clsx(styles.item, selected?.id === item.id && styles.itemActive)}
										onClick={() => setSearchParams({ c: item.id })}
									>
										<span className={styles.itemName}>
											{item.partner.name}
											{item.unread > 0 && <span className={styles.badge}>{item.unread}</span>}
										</span>
										<span className={styles.itemOrder}>{item.orderTitle}</span>
										{item.lastMessage && (
											<span className={styles.itemLast}>{item.lastMessage.text}</span>
										)}
									</button>
								</li>
							))}
						</ul>

						{selected && (
							<ChatWindow
								key={selected.id}
								conversation={selected}
								onSent={handleSent}
								onRead={handleRead}
							/>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
