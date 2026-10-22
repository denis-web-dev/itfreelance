import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import clsx from 'clsx';
import Button from '../../../components/Button/Button';
import CreateOrderModal from '../../../components/CreateOrderModal/CreateOrderModal';
import styles from './Tabs.module.css';

const SUBTABS = {
	CUSTOMER: [
		{ id: 'active', label: 'Активные' },
		{ id: 'waiting', label: 'Ожидают исполнителя' },
		{ id: 'done', label: 'Завершённые' },
	],
	FREELANCER: [
		{ id: 'active', label: 'Активные' },
		{ id: 'done', label: 'Завершённые' },
		{ id: 'rejected', label: 'Отклонённые' },
	],
};

export default function DealsTab() {
	const { user } = useOutletContext();
	const isCustomer = user.role === 'CUSTOMER';
	const subtabs = SUBTABS[user.role] ?? SUBTABS.FREELANCER;

	const [activeId, setActiveId] = useState(subtabs[0].id);
	const [isModalOpen, setModalOpen] = useState(false);
	const [notice, setNotice] = useState('');

	const handleCreated = () => {
		setModalOpen(false);
		setActiveId('waiting');
		setNotice('Заказ опубликован: исполнители увидят его в разделе «Заказы»');
	};

	return (
		<section className={styles.card}>
			<div className={styles.headingRow}>
				<h2 className={styles.heading}>Сделки</h2>
				{isCustomer && (
					<Button variant="primary" onClick={() => setModalOpen(true)}>
						+ Добавить заказ
					</Button>
				)}
			</div>

			<div className={styles.subtabs} role="tablist">
				{subtabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={tab.id === activeId}
						className={clsx(styles.subtab, tab.id === activeId && styles.subtabActive)}
						onClick={() => setActiveId(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{notice && (
				<p className={styles.notice} role="status">
					{notice}
				</p>
			)}

			{/* Списки сделок и своих заказов появятся вместе с модулем сделок и эндпоинтом /orders/mine */}
			<p className={styles.empty}>Здесь пока ничего нет</p>

			{isModalOpen && (
				<CreateOrderModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />
			)}
		</section>
	);
}
