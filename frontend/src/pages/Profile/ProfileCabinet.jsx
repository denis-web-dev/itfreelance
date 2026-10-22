import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile } from '../../services/profileApi';
import CardBg from '../../components/CardBg/CardBg';
import ProfileHeader from '../../components/Profile/ProfileHeader/ProfileHeader';
import ProfileSummary from '../../components/Cabinet/ProfileSummary/ProfileSummary';
import CabinetTabs from '../../components/Cabinet/CabinetTabs/CabinetTabs';
import bgImage from '../../assets/img-header/bg.png';
import styles from './ProfileCabinet.module.css';

export default function ProfileCabinet() {
	const { logout } = useAuth();
	const { pathname } = useLocation();
	const [state, setState] = useState({ loading: true, data: null, error: null });

	useEffect(() => {
		let ignore = false;

		const load = async () => {
			try {
				const result = await getMyProfile();
				if (!ignore) setState({ loading: false, data: result.data, error: null });
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
	}, [logout]);

	if (state.loading) return <p className={styles.status}>Загрузка...</p>;
	if (state.error) return <p className={styles.status}>{state.error}</p>;

	const { user, profile } = state.data;
	const isFreelancer = user.role === 'FREELANCER';

	return (
		<div className={styles.wrapper}>
			<div className="container">
				<CardBg imageSrc={bgImage} className="fullWidthBlock">
					<ProfileHeader />
					<ProfileSummary user={user} profile={profile} isFreelancer={isFreelancer} />
				</CardBg>

				<div className={`fullWidthBlock ${styles.content}`}>
					<CabinetTabs showEdit={pathname.endsWith('/about')} />
					<Outlet context={{ user, profile, isFreelancer }} />
				</div>
			</div>
		</div>
	);
}
