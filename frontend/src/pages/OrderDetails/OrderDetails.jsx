import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import Button from '../../components/Button/Button';
import PersonCard from '../../components/PersonCard/PersonCard';
import CreateOrderModal from '../../components/CreateOrderModal/CreateOrderModal';
import IconLike from '../../assets/icons/icon-like.svg?react';
import { useAuth } from '../../contexts/AuthContext';
import {
	getOrder,
	cancelOrder,
	deleteOrder,
	respondToOrder,
	selectResponse,
	rejectResponse,
	addFavorite,
	removeFavorite,
} from '../../services/ordersApi';
import { formatBudget, formatYears } from '../../utils/format';
import styles from './OrderDetails.module.css';

const STATUS_LABELS = {
	OPEN: 'Ожидает исполнителя',
	IN_PROGRESS: 'В работе',
	COMPLETED: 'Завершён',
	CANCELLED: 'Снят с публикации',
};

const RESPONSE_LABELS = {
	PENDING: 'Вы откликнулись',
	SELECTED: 'Вас выбрали исполнителем',
	REJECTED: 'Отклик отклонён',
};

const ICONS = {
	check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
	eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
	heart:
		'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
	trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
};

function SvgIcon({ path, size = 20 }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d={path} />
		</svg>
	);
}

function Fact({ label, value }) {
	return (
		<div className={styles.fact}>
			<p className={styles.factLabel}>{label}</p>
			<p className={styles.factValue}>{value}</p>
		</div>
	);
}

function Stat({ icon, value, label }) {
	return (
		<span className={styles.stat} title={label} aria-label={`${label}: ${value}`}>
			<SvgIcon path={icon} size={24} />
			{value}
		</span>
	);
}

// "2026-10-15" -> "15.10.2026" (без часовых поясов)
const formatDeadline = (iso) => iso.split('-').reverse().join('.');
const formatFullDate = (iso) => new Date(iso).toLocaleDateString('ru-RU');

export default function OrderDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();

	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [actionError, setActionError] = useState('');
	const [busy, setBusy] = useState(false);
	const [isEditOpen, setEditOpen] = useState(false);

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			try {
				const res = await getOrder(id, { signal: controller.signal });
				setOrder(res.data.order);
				setError('');
			} catch (e) {
				if (e.name === 'AbortError') return;
				if (e.status === 401) {
					logout();
					return;
				}
				setError(e.message || 'Не удалось загрузить заказ');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		load();
		return () => controller.abort();
	}, [id, logout]);

	// «Назад»: на предыдущую страницу, а если страницу открыли напрямую, то к списку заказов
	const handleBack = () => {
		if (location.key !== 'default') navigate(-1);
		else navigate('/orders');
	};

	const runAction = async (action) => {
		if (busy) return;
		setBusy(true);
		setActionError('');
		setNotice('');
		try {
			await action();
		} catch (e) {
			if (e.status === 401) {
				logout();
				return;
			}
			setActionError(e.message || 'Не удалось выполнить действие');
		} finally {
			setBusy(false);
		}
	};

	const handleCancel = () => {
		if (!window.confirm('Снять заказ с публикации? Он перейдёт в «Завершённые».')) return;
		runAction(async () => {
			const res = await cancelOrder(id);
			setOrder(res.data.order);
			setNotice('Заказ снят с публикации');
		});
	};

	const handleDelete = () => {
		if (!window.confirm('Удалить заказ без возможности восстановления?')) return;
		runAction(async () => {
			await deleteOrder(id);
			navigate('/profile/deals', { replace: true, state: { notice: 'Заказ удалён' } });
		});
	};

	const handleRespond = () =>
		runAction(async () => {
			const res = await respondToOrder(id);
			setOrder(res.data.order);
			setNotice('Отклик отправлен: заказчик получил уведомление');
		});

	const handleSelect = (responseId) =>
		runAction(async () => {
			await selectResponse(id, responseId);
			navigate('/profile/deals', {
				state: { notice: 'Исполнитель выбран. Чат с ним появится в следующем обновлении' },
			});
		});

	const handleReject = (responseId) => {
		if (!window.confirm('Отклонить отклик исполнителя?')) return;
		runAction(async () => {
			const res = await rejectResponse(id, responseId);
			setOrder(res.data.order);
		});
	};

	const handleToggleFavorite = () => {
		const next = !order.isFavorite;
		setOrder((prev) => ({ ...prev, isFavorite: next }));
		(next ? addFavorite(id) : removeFavorite(id)).catch(() =>
			setOrder((prev) => ({ ...prev, isFavorite: !next })),
		);
	};

	const handleUpdated = async () => {
		setEditOpen(false);
		try {
			const res = await getOrder(id);
			setOrder(res.data.order);
			setNotice('Изменения сохранены');
		} catch (e) {
			setActionError(e.message || 'Не удалось обновить данные заказа');
		}
	};

	const showChatStub = () => setNotice('Чат появится в следующем обновлении');

	if (loading || error || !order) {
		return (
			<div className={styles.page}>
				<ProfileHeader />
				<main className={styles.shell}>
					<button type="button" className={styles.back} onClick={handleBack}>
						← Назад
					</button>
					<p className={error ? styles.error : styles.status}>
						{loading ? 'Загрузка...' : error || 'Заказ не найден'}
					</p>
				</main>
			</div>
		);
	}

	// Поле stats приходит только автору заказа: сервер сам решает, кто он
	const isOwner = order.stats !== undefined;
	const isFreelancer = user?.role === 'FREELANCER';
	const isOpen = order.status === 'OPEN';
	const canUnpublish = isOwner && isOpen;
	const canDelete = isOwner && (isOpen || order.status === 'CANCELLED');
	const responses = order.responses ?? [];
	const myResponse = order.myResponse ?? null;
	const customerExperience =
		order.customer.marketYears != null ? formatYears(order.customer.marketYears) : null;

	// Блок кнопок рисуется дважды: вверху карточки и внизу, как на макетах
	const renderActions = (className) => (
		<div className={className}>
			{isOwner && (
				<>
					<Button variant="primary" onClick={() => setEditOpen(true)} disabled={busy}>
						Редактировать
					</Button>
					{canUnpublish && (
						<Button variant="secondary" onClick={handleCancel} disabled={busy}>
							Снять с публикации
						</Button>
					)}
					{canDelete && (
						<button
							type="button"
							className={styles.iconBtn}
							onClick={handleDelete}
							disabled={busy}
							aria-label="Удалить заказ"
						>
							<SvgIcon path={ICONS.trash} />
						</button>
					)}
				</>
			)}

			{isFreelancer && (
				<>
					{myResponse ? (
						<Button variant="secondary" disabled>
							{RESPONSE_LABELS[myResponse.status]}
						</Button>
					) : (
						isOpen && (
							<Button variant="primary" onClick={handleRespond} disabled={busy}>
								Откликнуться
							</Button>
						)
					)}
					<button
						type="button"
						className={clsx(styles.iconBtn, order.isFavorite && styles.iconBtnActive)}
						onClick={handleToggleFavorite}
						aria-pressed={order.isFavorite}
						aria-label={order.isFavorite ? 'Убрать из избранного' : 'В избранное'}
					>
						<IconLike />
					</button>
				</>
			)}
		</div>
	);

	return (
		<div className={styles.page}>
			<ProfileHeader />

			<main className={styles.shell}>
				<button type="button" className={styles.back} onClick={handleBack}>
					← Назад
				</button>

				{notice && (
					<p className={styles.notice} role="status">
						{notice}
					</p>
				)}
				{actionError && (
					<p className={styles.error} role="alert">
						{actionError}
					</p>
				)}

				<div className={styles.layout}>
					<article className={styles.card}>
						<div className={styles.cardHead}>
							<span className={styles.date}>{formatFullDate(order.createdAt)}</span>
							<span className={styles.statusLabel}>{STATUS_LABELS[order.status]}</span>
							{renderActions(styles.actionsTop)}
						</div>

						<h1 className={styles.title}>{order.title}</h1>

						<div className={styles.facts}>
							<div>
								<Fact
									label="Бюджет"
									value={order.budget == null ? 'Не указан' : formatBudget(order.budget)}
								/>
								{order.deadline && (
									<Fact label="Дедлайн заказа" value={formatDeadline(order.deadline)} />
								)}
							</div>
							{order.tools.length > 0 && (
								<div>
									<Fact label="Инструменты" value={order.tools.join(' • ')} />
								</div>
							)}
						</div>

						{order.stages?.length > 0 && (
							<ul className={styles.stages}>
								{order.stages.map((stage) => (
									<li key={stage.position} className={styles.stage}>
										<span className={styles.stageNumber}>Этап {stage.position}</span>
										<span className={styles.stageTitle}>{stage.title}</span>
										<span className={styles.stageBudget}>{formatBudget(stage.budget)}</span>
									</li>
								))}
							</ul>
						)}

						{order.description && (
							<section>
								<h2 className={styles.sectionTitle}>Задачи проекта</h2>
								<p className={styles.description}>{order.description}</p>
							</section>
						)}

						{renderActions(styles.actionsBottom)}
					</article>

					<aside className={styles.side}>
						{isOwner ? (
							<section className={clsx(styles.panel, styles.panelAccent)}>
								<p className={styles.panelLabel}>
									{responses.length > 0 ? 'Выбрать исполнителя' : 'Статистика'}
								</p>
								<div className={styles.stats}>
									<Stat icon={ICONS.check} value={order.stats.responses} label="Откликнулось" />
									<Stat icon={ICONS.eye} value={order.stats.views} label="Просмотров" />
									<Stat icon={ICONS.heart} value={order.stats.favorites} label="В избранном" />
								</div>

								{responses.length > 0 && (
									<div className={styles.people}>
										{responses.map((item) => (
											<PersonCard
												key={item.id}
												person={item.freelancer}
												experience={item.freelancer.experience}
												to={`/users/${item.freelancer.id}`}
											>
												{item.status === 'SELECTED' ? (
													<>
														<span className={styles.selected}>Выбран исполнителем</span>
														<Button variant="primary" onClick={showChatStub}>
															Перейти в сообщения
														</Button>
													</>
												) : (
													isOpen && (
														<>
															<Button
																variant="primary"
																onClick={() => handleSelect(item.id)}
																disabled={busy}
															>
																Выбрать исполнителем
															</Button>
															<button
																type="button"
																className={styles.rejectBtn}
																onClick={() => handleReject(item.id)}
																disabled={busy}
																aria-label="Отклонить отклик"
															>
																×
															</button>
														</>
													)
												)}
											</PersonCard>
										))}
									</div>
								)}
							</section>
						) : (
							<section className={styles.panel}>
								<p className={styles.panelLabel}>Заказчик</p>
								<PersonCard
									person={order.customer}
									experience={customerExperience}
									to={`/users/${order.customer.id}`}
								>
									<Button
										variant="secondary"
										onClick={() => navigate(`/users/${order.customer.id}`)}
									>
										Посмотреть профиль
									</Button>
								</PersonCard>
							</section>
						)}
					</aside>
				</div>
			</main>

			{isEditOpen && (
				<CreateOrderModal
					orderId={order.id}
					onClose={() => setEditOpen(false)}
					onUpdated={handleUpdated}
				/>
			)}
		</div>
	);
}
