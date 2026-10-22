import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder } from '../../services/ordersApi';
import { toFieldErrors } from '../../services/api';
import { ORDER_TOOLS } from '../../constants/tools';
import { formatBudget } from '../../utils/format';
import TagInput from '../TagInput/TagInput';
import SaveButton from '../ui/SaveButton/SaveButton';
import styles from './CreateOrderModal.module.css';

const MAX_BUDGET = 100_000_000;
const MAX_STAGES = 10;
const DESCRIPTION_LIMIT = 1000;
const EMPTY_STAGE = { title: '', budget: '' };

const todayIso = () => new Date().toISOString().slice(0, 10);
// "50 000" -> "50000"
const clean = (value = '') => value.replace(/\s/g, '');
const sumStages = (list = []) =>
	list.reduce((sum, item) => sum + (Number(clean(item?.budget)) || 0), 0);

const checkBudget = (value) => {
	if (!/^\d+$/.test(value)) return 'Укажите бюджет целым числом';
	if (Number(value) < 100) return 'Минимальный бюджет 100 ₽';
	if (Number(value) > MAX_BUDGET) return 'Бюджет слишком большой';
	return null;
};

// Правила совпадают с бэкендом (order.schema.js); описание по макету до 1000 символов
const schema = z
	.object({
		title: z
			.string()
			.trim()
			.min(5, 'Название не короче 5 символов')
			.max(150, 'Название не длиннее 150 символов'),
		tools: z
			.array(z.string())
			.min(1, 'Укажите хотя бы один инструмент')
			.max(20, 'Не более 20 инструментов'),
		deadline: z
			.string()
			.refine((value) => value === '' || value >= todayIso(), 'Дедлайн не может быть в прошлом'),
		budget: z.string(),
		description: z
			.string()
			.trim()
			.min(20, 'Описание не короче 20 символов')
			.max(DESCRIPTION_LIMIT, `Описание не длиннее ${DESCRIPTION_LIMIT} символов`),
		hasStages: z.boolean(),
		stages: z.array(z.object({ title: z.string(), budget: z.string() })),
	})
	.superRefine((data, ctx) => {
		const addIssue = (message, path) => ctx.addIssue({ code: 'custom', message, path });

		// Без этапов проверяем общий бюджет
		if (!data.hasStages) {
			const problem = checkBudget(clean(data.budget));
			if (problem) addIssue(problem, ['budget']);
			return;
		}

		// С этапами бюджет считается как сумма этапов
		if (data.stages.length < 2) addIssue('Нужно минимум 2 этапа', ['stages']);
		data.stages.forEach((item, index) => {
			if (item.title.trim().length < 2) {
				addIssue('Название этапа не короче 2 символов', ['stages', index, 'title']);
			}
			const problem = checkBudget(clean(item.budget));
			if (problem) addIssue(problem, ['stages', index, 'budget']);
		});
		if (sumStages(data.stages) > MAX_BUDGET) addIssue('Бюджет слишком большой', ['budget']);
	});

function TextField({ label, placeholder, error, inputProps, withIcon = false }) {
	return (
		<div className={styles.field}>
			<input
				className={clsx(styles.input, error && styles.inputError)}
				placeholder={placeholder ?? label}
				aria-label={label}
				{...inputProps}
			/>
			<span className={clsx(styles.hint, withIcon && styles.hintShifted)}>{label}</span>
			{error && <p className={styles.error}>{error}</p>}
		</div>
	);
}

export default function CreateOrderModal({ onClose, onCreated }) {
	const { logout } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [status, setStatus] = useState(null);

	const {
		register,
		handleSubmit,
		setError,
		control,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			title: '',
			tools: [],
			deadline: '',
			budget: '',
			description: '',
			hasStages: false,
			stages: [],
		},
	});
	const { fields, append, remove, replace } = useFieldArray({ control, name: 'stages' });

	const hasStages = useWatch({ control, name: 'hasStages' });
	const stages = useWatch({ control, name: 'stages' });
	const description = useWatch({ control, name: 'description' });
	const stagesTotal = sumStages(stages);

	const handleClose = () => {
		if (!isSaving) onClose();
	};

	const onSubmit = async (data) => {
		setIsSaving(true);
		setStatus(null);

		try {
			const payload = {
				title: data.title,
				description: data.description,
				tools: data.tools,
				budget: data.hasStages ? sumStages(data.stages) : Number(clean(data.budget)),
			};
			if (data.deadline) payload.deadline = data.deadline;
			if (data.hasStages) {
				payload.stages = data.stages.map((item) => ({
					title: item.title.trim(),
					budget: Number(clean(item.budget)),
				}));
			}

			await createOrder(payload);
			onCreated();
		} catch (error) {
			if (error.status === 401) {
				logout();
				return;
			}
			// Ошибки сервера показываем под нужными полями
			const fieldErrors = Object.entries(toFieldErrors(error));
			fieldErrors.forEach(([field, message]) => setError(field, { message }));
			setStatus(fieldErrors.length ? 'Проверьте выделенные поля' : error.message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open onClose={handleClose} className={styles.root}>
			<div className={styles.backdrop} aria-hidden="true" />
			<div className={styles.container}>
				<DialogPanel className={styles.panel}>
					<form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
						<div className={styles.header}>
							<DialogTitle className={styles.title}>Добавление нового заказа</DialogTitle>
							<button type="submit" className={styles.publishSmall} disabled={isSaving}>
								✓ Опубликовать
							</button>
							<button
								type="button"
								className={styles.close}
								onClick={handleClose}
								aria-label="Закрыть"
							>
								<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
									<path
										d="M2 2l10 10M12 2L2 12"
										stroke="#fff"
										strokeWidth="2.4"
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</div>

						<TextField
							label="Название"
							placeholder="Название *"
							error={errors.title?.message}
							inputProps={register('title')}
						/>

						<Controller
							name="tools"
							control={control}
							render={({ field }) => (
								<TagInput
									label="Инструменты"
									placeholder="Инструменты *"
									value={field.value}
									onChange={field.onChange}
									error={errors.tools?.message}
									suggestions={ORDER_TOOLS}
								/>
							)}
						/>

						<TextField
							label="Дедлайн"
							withIcon
							error={errors.deadline?.message}
							inputProps={{ ...register('deadline'), type: 'date', min: todayIso() }}
						/>

						{hasStages ? (
							<div className={styles.field}>
								<input
									className={styles.input}
									readOnly
									value={stagesTotal ? formatBudget(stagesTotal) : ''}
									placeholder="Сумма этапов"
									aria-label="Бюджет"
								/>
								<span className={styles.hint}>Бюджет</span>
								{errors.budget && <p className={styles.error}>{errors.budget.message}</p>}
							</div>
						) : (
							<TextField
								label="Бюджет"
								placeholder="Бюджет, ₽ *"
								error={errors.budget?.message}
								inputProps={{ ...register('budget'), inputMode: 'numeric' }}
							/>
						)}

						<div className={styles.field}>
							<textarea
								className={clsx(styles.textarea, errors.description && styles.inputError)}
								placeholder="Описание *"
								maxLength={DESCRIPTION_LIMIT}
								aria-label="Описание"
								{...register('description')}
							/>
							<span className={styles.counter}>
								{description?.length ?? 0}/{DESCRIPTION_LIMIT}
							</span>
							{errors.description && <p className={styles.error}>{errors.description.message}</p>}
						</div>

						<div className={styles.checkRow}>
							<label className={styles.checkLabel}>
								<input
									type="checkbox"
									className={styles.checkbox}
									{...register('hasStages', {
										onChange: (event) => {
											if (event.target.checked && fields.length === 0) {
												replace([EMPTY_STAGE, EMPTY_STAGE]);
											}
										},
									})}
								/>
								Разделить проект на этапы
							</label>
							<span className={styles.checkHint}>(рекомендуется для крупных заказов)</span>
						</div>

						{hasStages && (
							<>
								{errors.stages?.message && <p className={styles.error}>{errors.stages.message}</p>}
								<div className={styles.stages}>
									{fields.map((field, index) => (
										<div key={field.id} className={styles.stage}>
											<div className={styles.stageHead}>
												<span className={styles.stageTitle}>Этап {index + 1}</span>
												{index >= 2 && (
													<button
														type="button"
														className={styles.stageRemove}
														onClick={() => remove(index)}
													>
														Удалить
													</button>
												)}
											</div>
											<TextField
												label="Название"
												error={errors.stages?.[index]?.title?.message}
												inputProps={register(`stages.${index}.title`)}
											/>
											<TextField
												label="Бюджет"
												placeholder="Бюджет, ₽"
												error={errors.stages?.[index]?.budget?.message}
												inputProps={{
													...register(`stages.${index}.budget`),
													inputMode: 'numeric',
												}}
											/>
										</div>
									))}
									{fields.length < MAX_STAGES && (
										<div>
											<button
												type="button"
												className={styles.addStage}
												onClick={() => append(EMPTY_STAGE)}
											>
												+ Добавить этап
											</button>
										</div>
									)}
								</div>
							</>
						)}

						{status && (
							<p className={styles.noticeError} role="alert">
								{status}
							</p>
						)}

						<SaveButton type="submit" isLoading={isSaving}>
							Опубликовать
						</SaveButton>
					</form>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
