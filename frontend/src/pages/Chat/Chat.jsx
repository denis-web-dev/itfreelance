import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { getConversation } from '../../services/conversationsApi';
import { formatBudget } from '../../utils/format';
import styles from './Chat.module.css';

export default function Chat() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { logout } = useAuth();

	const [conversation, setConversation] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let ignore = false;

		async function load() {
			try {
				const res = await getConversation(id);
				if (ignore) return;
				setConversation(res.data.conversation);
				setError('');
			} catch (e) {
				if (ignore) return;
				if (e.status === 401) {
					logout();
					return;
				}
				setConversation(null);
				setError(e.message || 'Не удалось открыть чат');
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => {
			ignore = true;
		};
	}, [id, logout]);

	// «Назад»: на предыдущую страницу, а если страницу открыли напрямую, к списку чатов
	const handleBack = () => {
		if (location.key !== 'default') navigate(-1);
		else navigate('/messages');
	};

	const stages = conversation?.order.stages ?? [];

	return (
		<div className={styles.page}>
			<ProfileHeader />

			<main className={styles.shell}>
				<button type="button" className={styles.back} onClick={handleBack}>
					← Назад
				</button>

				{loading && <p className={styles.status}>Загрузка...</p>}
				{error && (
					<p className={styles.error} role="alert">
						{error}
					</p>
				)}

				{conversation && (
					<div className={styles.layout}>
						{/* key: при переходе в другой чат состояние окна сбрасывается */}
						<ChatWindow key={conversation.id} conversation={conversation} />

						<aside className={styles.panel} aria-label="Состояние сделки">
							<h2 className={styles.panelTitle}>
								<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
									<path
										fill="currentColor"
										d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
									/>
								</svg>
								Сделка не запущена
							</h2>

							{stages.length > 0 && (
								<ol className={styles.stages}>
									{stages.map((stage) => (
										<li key={stage.position} className={styles.stage}>
											<span className={styles.stageNumber}>Этап {stage.position}</span>
											<span className={styles.stageTitle}>{stage.title}</span>
											<span className={styles.stageBudget}>{formatBudget(stage.budget)}</span>
										</li>
									))}
								</ol>
							)}

							<p className={styles.note}>
								Сдача этапов и оплата станут доступны после запуска безопасной сделки.
							</p>
						</aside>
					</div>
				)}
			</main>
		</div>
	);
}
