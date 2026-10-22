import { useEffect, useState } from 'react';
import PortfolioCard from './PortfolioCard';
import AddProjectModal from './AddProjectModal';
import { getMyPortfolio, deletePortfolioItem } from '../../../services/portfolioApi';
import styles from './ProfilePortfolio.module.css';

const MAX_ITEMS = 12; // как на сервере
const MIN_SLOTS = 8; // сколько ячеек показываем в режиме редактирования

export default function ProfilePortfolio({ readOnly = false }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	// null: окно закрыто; { item: null }: добавление; { item }: редактирование
	const [modal, setModal] = useState(null);

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			try {
				const res = await getMyPortfolio({ signal: controller.signal });
				setItems(res.data.items);
			} catch (e) {
				if (e.name === 'AbortError') return;
				setError(e.message || 'Не удалось загрузить портфолио');
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		load();
		return () => controller.abort();
	}, []);

	const handleSaved = (saved) => {
		setItems((prev) =>
			prev.some((i) => i.id === saved.id)
				? prev.map((i) => (i.id === saved.id ? saved : i))
				: [saved, ...prev],
		);
		setModal(null);
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Удалить проект из портфолио?')) return;
		try {
			await deletePortfolioItem(id);
			setItems((prev) => prev.filter((i) => i.id !== id));
			setError('');
		} catch (e) {
			setError(e.message || 'Не удалось удалить проект');
		}
	};

	const openCreate = () => setModal({ item: null });
	const openEdit = (id) => setModal({ item: items.find((i) => i.id === id) ?? null });

	const canAdd = !readOnly && items.length < MAX_ITEMS;
	const emptySlots = canAdd ? Math.max(1, MIN_SLOTS - items.length) : 0;

	return (
		<div className={styles.profilePortfolio}>
			<div className={styles.portfolioHeader}>
				<h2 className={styles.profileTitle}>Портфолио</h2>
				{canAdd && (
					<button type="button" className={styles.addProjectBtn} onClick={openCreate}>
						+ Добавить проект
					</button>
				)}
			</div>

			{error && (
				<p className={styles.portfolioError} role="alert">
					{error}
				</p>
			)}

			{loading ? (
				<p>Загрузка...</p>
			) : readOnly && items.length === 0 ? (
				<p>Пока нет проектов</p>
			) : (
				<div className={styles.profileGrid}>
					{items.map((item) => (
						<PortfolioCard
							key={item.id}
							id={item.id}
							image={item.imageUrl}
							title={item.title}
							projectUrl={item.projectUrl}
							readOnly={readOnly}
							onDelete={handleDelete}
							onEdit={openEdit}
						/>
					))}

					{Array.from({ length: emptySlots }, (_, i) => (
						<PortfolioCard key={`empty-${i}`} isAdd onAdd={openCreate} />
					))}
				</div>
			)}

			{!readOnly && modal && (
				<AddProjectModal item={modal.item} onClose={() => setModal(null)} onSaved={handleSaved} />
			)}
		</div>
	);
}
