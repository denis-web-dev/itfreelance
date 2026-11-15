import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { getMessages, sendMessage, markConversationRead } from '../../services/conversationsApi';
import styles from './ChatWindow.module.css';

const POLL_MS = 4000;
const MAX_LENGTH = 2000;

// "14:05" для сегодняшних, иначе "12.11 14:05"
const formatTime = (iso) => {
	const date = new Date(iso);
	const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	if (date.toDateString() === new Date().toDateString()) return time;
	return `${date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${time}`;
};

const withTime = (message) => ({ ...message, time: formatTime(message.createdAt) });

export default function ChatWindow({ conversation, onSent, onRead }) {
	const { id, partner, orderTitle, orderStatus } = conversation;
	const [messages, setMessages] = useState([]);
	const [loaded, setLoaded] = useState(false);
	const [loadError, setLoadError] = useState('');
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState('');
	const listRef = useRef(null);
	const isClosed = orderStatus !== 'IN_PROGRESS';

	// Загрузка и обновление раз в несколько секунд, пока открыт чат
	useEffect(() => {
		let ignore = false;
		const controller = new AbortController();

		async function pull() {
			if (document.hidden) return;
			try {
				const res = await getMessages(id, { signal: controller.signal });
				if (ignore) return;
				const items = res.data.items.map(withTime);
				setMessages(items);
				setLoaded(true);
				setLoadError('');
				if (items.some((m) => m.senderId === partner.id && !m.readAt)) {
					markConversationRead(id)
						.then(() => {
							if (!ignore) onRead?.(id);
						})
						.catch(() => {});
				}
			} catch (e) {
				if (e.name === 'AbortError' || ignore) return;
				setLoadError(e.message || 'Не удалось загрузить сообщения');
			}
		}

		pull();
		const timer = setInterval(pull, POLL_MS);
		return () => {
			ignore = true;
			controller.abort();
			clearInterval(timer);
		};
	}, [id, partner.id, onRead]);

	// Прокрутка к последнему сообщению
	useEffect(() => {
		const el = listRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages.length]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const value = text.trim();
		if (!value || sending) return;

		setSending(true);
		setSendError('');
		try {
			const res = await sendMessage(id, value);
			const sent = withTime(res.data.message);
			setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
			setText('');
			onSent?.();
		} catch (err) {
			setSendError(err.message || 'Не удалось отправить сообщение');
		} finally {
			setSending(false);
		}
	};

	// Enter отправляет, Shift+Enter переносит строку
	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	};

	return (
		<section className={styles.chat}>
			<header className={styles.head}>
				<h2 className={styles.partner}>{partner.name}</h2>
				<p className={styles.order}>{orderTitle}</p>
			</header>

			<ul className={styles.list} ref={listRef} aria-live="polite">
				{!loaded && !loadError && <li className={styles.status}>Загрузка...</li>}
				{loadError && <li className={styles.error}>{loadError}</li>}
				{loaded && messages.length === 0 && (
					<li className={styles.status}>Сообщений пока нет. Напишите первым</li>
				)}
				{messages.map((message) => (
					<li
						key={message.id}
						className={clsx(
							styles.message,
							message.senderId === partner.id ? styles.theirs : styles.mine,
						)}
					>
						<p className={styles.text}>{message.text}</p>
						<time className={styles.time} dateTime={message.createdAt}>
							{message.time}
						</time>
					</li>
				))}
			</ul>

			{isClosed ? (
				<p className={styles.closed}>Чат закрыт: заказ уже не в работе</p>
			) : (
				<form className={styles.form} onSubmit={handleSubmit}>
					<textarea
						className={styles.input}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={handleKeyDown}
						maxLength={MAX_LENGTH}
						rows={2}
						placeholder="Напишите сообщение"
						aria-label="Сообщение"
					/>
					<button type="submit" className={styles.send} disabled={sending || !text.trim()}>
						Отправить
					</button>
					{sendError && (
						<p className={styles.error} role="alert">
							{sendError}
						</p>
					)}
				</form>
			)}
		</section>
	);
}
