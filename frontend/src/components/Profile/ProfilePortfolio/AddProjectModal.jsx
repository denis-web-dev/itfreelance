import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PortfolioCardBg from './PortfolioCardBg';
import ActionButton from '../../ui/ActionButton/ActionButton';
import InputForm from '../../InputForm/InputForm';
import { createPortfolioItem, updatePortfolioItem } from '../../../services/portfolioApi';
import { toFieldErrors } from '../../../services/api';
import styles from './AddProjectModal.module.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 МБ, как на сервере

// "github.com/user/repo" -> "https://github.com/user/repo"
const normalizeUrl = (value) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);

const isHttpUrl = (value) => {
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
};

const schema = z.object({
	title: z
		.string()
		.trim()
		.min(2, 'Введите название (от 2 символов)')
		.max(100, 'Название не длиннее 100 символов'),
	projectUrl: z
		.string()
		.trim()
		.min(1, 'Укажите ссылку на проект')
		.max(200, 'Ссылка не длиннее 200 символов')
		.transform(normalizeUrl)
		.refine(isHttpUrl, 'Введите корректную ссылку'),
});

export default function AddProjectModal({ item = null, onClose, onSaved }) {
	const fileInputRef = useRef(null);
	const [file, setFile] = useState(null);
	const [fileError, setFileError] = useState('');
	const [serverError, setServerError] = useState('');

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: { title: item?.title ?? '', projectUrl: item?.projectUrl ?? '' },
	});

	// Превью выбранного файла; освобождаем ссылку, когда файл меняется или окно закрывается
	const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
	useEffect(() => {
		return () => {
			if (filePreview) URL.revokeObjectURL(filePreview);
		};
	}, [filePreview]);
	const previewUrl = filePreview ?? item?.imageUrl ?? null;

	// Закрытие по Esc
	useEffect(() => {
		const onKeyDown = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	const openFileDialog = () => fileInputRef.current?.click();

	const handleFile = (e) => {
		const selected = e.target.files?.[0];
		e.target.value = ''; // чтобы можно было выбрать тот же файл ещё раз
		if (!selected) return;

		if (!ALLOWED_TYPES.includes(selected.type)) {
			setFileError('Допустимы только JPEG, PNG и WebP');
			return;
		}
		if (selected.size > MAX_SIZE) {
			setFileError('Файл больше 5 МБ');
			return;
		}
		setFileError('');
		setFile(selected);
	};

	const onSubmit = async (data) => {
		setServerError('');

		if (!item && !file) {
			setFileError('Выберите изображение проекта');
			return;
		}

		try {
			const payload = { title: data.title, projectUrl: data.projectUrl, image: file ?? undefined };
			const res = item
				? await updatePortfolioItem(item.id, payload)
				: await createPortfolioItem(payload);
			onSaved(res.data.item);
		} catch (error) {
			// Ошибки полей показываем под полями, остальные общей строкой
			let shown = false;
			Object.entries(toFieldErrors(error)).forEach(([field, message]) => {
				if (field === 'title' || field === 'projectUrl') {
					setError(field, { message });
					shown = true;
				}
			});
			if (!shown) setServerError(error.message || 'Не удалось сохранить проект');
		}
	};

	return (
		<div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
			<div
				className={styles.dialog}
				role="dialog"
				aria-modal="true"
				aria-labelledby="project-modal-title"
			>
				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<div className={styles.header}>
						<h2 id="project-modal-title" className={styles.title}>
							{item ? 'Редактирование проекта' : 'Добавление нового проекта'}
						</h2>
						<div className={styles.actions}>
							<button type="submit" className={styles.publishBtn} disabled={isSubmitting}>
								{isSubmitting ? 'Сохранение...' : '✓ Опубликовать'}
							</button>
							<button
								type="button"
								className={styles.closeBtn}
								onClick={onClose}
								aria-label="Закрыть"
							>
								×
							</button>
						</div>
					</div>

					<div className={styles.body}>
						<div className={styles.imageColumn}>
							<div className={styles.drop} onClick={openFileDialog}>
								<PortfolioCardBg className={styles.dropBg} />
								{previewUrl && (
									<img src={previewUrl} alt="Превью проекта" className={styles.preview} />
								)}
								<ActionButton
									variant="add"
									size="medium"
									ariaLabel="Выбрать изображение"
									className={styles.plus}
									onClick={(e) => {
										e.stopPropagation(); // иначе клик сработает и на области, и на кнопке
										openFileDialog();
									}}
								/>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept={ALLOWED_TYPES.join(',')}
								hidden
								onChange={handleFile}
							/>
							<p className={styles.hint}>JPEG, PNG или WebP, до 5 МБ</p>
							{fileError && (
								<p className={styles.error} role="alert">
									{fileError}
								</p>
							)}
						</div>

						<div className={styles.fields}>
							<InputForm
								width="100%"
								placeholder="Название *"
								error={errors.title}
								{...register('title')}
							/>
							<InputForm
								width="100%"
								placeholder="Ссылка на проект *"
								error={errors.projectUrl}
								{...register('projectUrl')}
							/>
							{serverError && (
								<p className={styles.error} role="alert">
									{serverError}
								</p>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
