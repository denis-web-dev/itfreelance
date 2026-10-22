import styles from './ProfilePortfolio.module.css';
import PortfolioCardBg from './PortfolioCardBg';
import ActionButton from '../../ui/ActionButton/ActionButton';

const isSafeUrl = (url) => /^https?:\/\//i.test(url);

export default function PortfolioCard({
	image,
	title,
	projectUrl,
	onDelete,
	onEdit,
	onAdd,
	isAdd = false,
	readOnly = false,
	id,
}) {
	if (isAdd) {
		return (
			<div className={styles['portfolio-item-add']}>
				<PortfolioCardBg className={styles['portfolio-item-add__bg']} />
				<ActionButton
					variant="add"
					size="medium"
					onClick={onAdd}
					ariaLabel="Добавить работу"
					className={styles['portfolio-item-add__plus']}
				/>
			</div>
		);
	}

	return (
		<div className={styles['portfolio-item']}>
			<PortfolioCardBg className={styles['portfolio-item__bg']} />

			<img src={image} alt={title || ' '} className={styles['portfolio-item__image']} />

			{title && (
				<div className={styles['portfolio-item__title']}>
					<span>{title}</span>
				</div>
			)}

			{projectUrl && isSafeUrl(projectUrl) && (
				<a
					href={projectUrl}
					target="_blank"
					rel="noopener noreferrer nofollow"
					className={styles['portfolio-item__link']}
					aria-label={`Открыть проект «${title}»`}
				>
					↗
				</a>
			)}

			{!readOnly && (
				<div className={styles['portfolio-item__actions']}>
					<ActionButton
						variant="edit"
						size="small"
						onClick={() => onEdit(id)}
						ariaLabel="Редактировать"
					/>
					<ActionButton
						variant="delete"
						size="small"
						onClick={() => onDelete(id)}
						ariaLabel="Удалить"
					/>
				</div>
			)}
		</div>
	);
}
