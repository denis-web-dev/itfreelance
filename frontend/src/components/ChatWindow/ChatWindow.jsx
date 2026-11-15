import { Fragment, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { getMessages, sendMessage, markConversationRead } from '../../services/conversationsApi';
import { formatNumber } from '../../utils/format';
import defaultAvatar from '../../assets/img-header/avatarBG.png';
import styles from './ChatWindow.module.css';

const POLL_MS = 4000;
const MAX_LENGTH = 2000;

// "Сегодня", "Вчера" или дата ДД.ММ.ГГ
const formatDay = (iso) => {
	const date = new Date(iso);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	if (date.toDateString() === today.toDateString()) return 'Сегодня';
	if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
	return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const withLabels = (message) => ({
	...message,
	day: formatDay(message.createdAt),
	time: new Date(message.createdAt).toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
	}),
});

// "2026-10-15" -> "15.10.2026"
const formatDeadline = (iso) => iso.split('-').reverse().join('.');

export default function ChatWindow({ conversation }) {
	const { id, role, partner, order } = conversation;
	const isCustomer = role === 'CUSTOMER';
	const isClosed = order.status !== 'IN_PROGRESS';

	const [messages, setMessages] = useState([]);
	const [loaded, setLoaded] = useState(false);
	const [loadError, setLoadError] = useState('');
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState('');
	const [pinnedVisible, setPinnedVisible] = useState(true);
	const listRef = useRef(null);

	// Загрузка и обновление раз в несколько секунд, пока открыт чат
	useEffect(() => {
		let ignore = false;
		const controller = new AbortController();

		async function pull() {
			if (document.hidden) return;
			try {
				const res = await getMessages(id, { signal: controller.signal });
				if (ignore) return;
				const items = res.data.items.map(withLabels);
				setMessages(items);
				setLoaded(true);
				setLoadError('');
				// Сообщения собеседника, которые мы увидели, отмечаем прочитанными
				if (items.some((m) => m.senderId === partner.id && !m.readAt)) {
					markConversationRead(id).catch(() => {});
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
	}, [id, partner.id]);

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
			const sent = withLabels(res.data.message);
			setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
			setText('');
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
				<div>
					<h2 className={styles.partner}>{partner.name}</h2>
					<p className={styles.role}>{isCustomer ? 'Исполнитель' : 'Заказчик'}</p>
				</div>

				{pinnedVisible && (
					<div className={styles.pinned}>
						<div className={styles.pinnedBody}>
							<p className={styles.pinnedLabel}>Закреплённое сообщение</p>
							<p className={styles.pinnedText}>{order.title}</p>
						</div>
						<button
							type="button"
							className={styles.pinnedClose}
							onClick={() => setPinnedVisible(false)}
							aria-label="Скрыть закреплённое сообщение"
						>
							×
						</button>
					</div>
				)}
			</header>

			<ul className={styles.list} ref={listRef} aria-live="polite">
				<li className={styles.system}>
					<p className={styles.systemTitle}>
						{isCustomer ? 'Вы выбрали исполнителя' : 'Заказчик выбрал вас исполнителем!'}
					</p>
					<dl className={styles.facts}>
						<div className={styles.fact}>
							<dt>Проект</dt>
							<dd>{order.title}</dd>
						</div>
						<div className={styles.fact}>
							<dt>Бюджет, ₽</dt>
							<dd>{order.budget == null ? 'Не указан' : formatNumber(order.budget)}</dd>
						</div>
						{order.deadline && (
							<div className={styles.fact}>
								<dt>Дедлайн</dt>
								<dd>{formatDeadline(order.deadline)}</dd>
							</div>
						)}
					</dl>
					<p className={styles.systemNote}>
						Здесь можно обсудить детали проекта. Безопасная сделка и оплата этапов будут доступны
						позже.
					</p>
				</li>

				{!loaded && !loadError && <li className={styles.status}>Загрузка...</li>}
				{loadError && <li className={styles.error}>{loadError}</li>}

				{messages.map((message, index) => {
					const mine = message.senderId !== partner.id;
					const newDay = index === 0 || messages[index - 1].day !== message.day;

					return (
						<Fragment key={message.id}>
							{newDay && <li className={styles.day}>{message.day}</li>}
							<li className={clsx(styles.row, mine ? styles.mine : styles.theirs)}>
								<img
									className={styles.avatar}
									src={mine ? defaultAvatar : partner.avatarUrl || defaultAvatar}
									alt=""
								/>
								<div className={styles.bubble}>
									<p className={styles.text}>{message.text}</p>
									<time className={styles.time} dateTime={message.createdAt}>
										{message.time}
									</time>
								</div>
							</li>
						</Fragment>
					);
				})}
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
						rows={1}
						placeholder="Сообщение"
						aria-label="Сообщение"
					/>
					<button
						type="submit"
						className={styles.send}
						disabled={sending || !text.trim()}
						aria-label="Отправить"
					>
						<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
							<path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
						</svg>
					</button>
					{sendError && (
						<p className={styles.sendError} role="alert">
							{sendError}
						</p>
					)}
				</form>
			)}
		</section>
	);
}
