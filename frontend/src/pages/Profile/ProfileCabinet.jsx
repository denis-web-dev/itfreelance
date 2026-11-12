import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile, getPublicProfile } from '../../services/profileApi';
import { getOrder, selectResponse, rejectResponse } from '../../services/ordersApi';
import Button from '../../components/Button/Button';
import CardBg from '../../components/CardBg/CardBg';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ProfileSummary from '../../components/Cabinet/ProfileSummary/ProfileSummary';
import CabinetTabs from '../../components/Cabinet/CabinetTabs/CabinetTabs';
import bgImage from '../../assets/img-header/bg.png';
import styles from './ProfileCabinet.module.css';

// Пришли со страницы заказа: ищем отклик этого исполнителя, который ждёт решения.
// Если открыл не автор заказа, откликов в ответе нет, и кнопок не будет
const loadOffer = async (orderId, freelancerId) => {
	try {
		const res = await getOrder(orderId);
		const order = res.data.order;
		const response = order.responses?.find(
			(item) => item.freelancer.id === freelancerId && item.status === 'PENDING',
		);
		return order.status === 'OPEN' && response ? { orderId, responseId: response.id } : null;
	} catch {
		return null;
	}
};

export default function ProfileCabinet() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	// id есть только на странице чужого кабинета /users/:id
	const { id: viewedId } = useParams();
	const [searchParams] = useSearchParams();
	const orderId = searchParams.get('order');
	const isPublic = Boolean(viewedId);

	const [state, setState] = useState({ loading: true, data: null, error: null });
	const [offer, setOffer] = useState(null);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState('');

	useEffect(() => {
		let ignore = false;

		const load = async () => {
			try {
				const result = viewedId ? await getPublicProfile(viewedId) : await getMyProfile();
				const nextOffer = viewedId && orderId ? await loadOffer(orderId, viewedId) : null;
				if (ignore) return;
				setState({ loading: false, data: result.data, error: null });
				setOffer(nextOffer);
			} catch (error) {
				if (error.status === 401) {
					logout(); // сессия истекла: ProtectedRoute перенаправит на вход
					return;
				}
				if (!ignore) setState({ loading: false, data: null, error: error.message });
			}
		};

		load();
		return () => {
			ignore = true;
		};
	}, [logout, viewedId, orderId]);

	const runOfferAction = async (action) => {
		if (busy) return;
		setBusy(true);
		setActionError('');
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

	const handleSelect = () =>
		runOfferAction(async () => {
			await selectResponse(offer.orderId, offer.responseId);
			navigate('/profile/deals', {
				state: { notice: 'Исполнитель выбран. Чат с ним появится в следующем обновлении' },
			});
		});

	const handleReject = () => {
		if (!window.confirm('Отклонить отклик исполнителя?')) return;
		runOfferAction(async () => {
			await rejectResponse(offer.orderId, offer.responseId);
			navigate(`/orders/${offer.orderId}`, { replace: true });
		});
	};

	if (state.loading) return <p className={styles.status}>Загрузка...</p>;
	if (state.error) return <p className={styles.status}>{state.error}</p>;

	const { user, profile, canSeeContacts } = state.data;
	const isFreelancer = user.role === 'FREELANCER';

	return (
		<div className={styles.wrapper}>
			<div className="container">
				<CardBg imageSrc={bgImage} className="fullWidthBlock">
					<ProfileHeader />
					<ProfileSummary
						user={user}
						profile={profile}
						isFreelancer={isFreelancer}
						contactsHidden={isPublic && !canSeeContacts}
					>
						{offer && (
							<div className={styles.offerActions}>
								<Button variant="primary" onClick={handleSelect} disabled={busy}>
									Выбрать исполнителем
								</Button>
								<button
									type="button"
									className={styles.rejectBtn}
									onClick={handleReject}
									disabled={busy}
									aria-label="Отклонить отклик"
								>
									×
								</button>
							</div>
						)}
					</ProfileSummary>
					{actionError && (
						<p className={styles.actionError} role="alert">
							{actionError}
						</p>
					)}
				</CardBg>

				<div className={`fullWidthBlock ${styles.content}`}>
					{/* В чужом кабинете нет сделок, избранного и настроек */}
					{!isPublic && <CabinetTabs showEdit={pathname.endsWith('/about')} />}
					<Outlet context={{ user, profile, isFreelancer, isPublic }} />
				</div>
			</div>
		</div>
	);
}
