import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { authHeader, createUser } from './helpers/auth.js';

// На Windows libvips держит открытые файлы в кэше и не даёт их удалить (EBUSY)
sharp.cache(false);

// Удаление с повторами: Windows иногда освобождает файл не сразу
const cleanDir = (dir) =>
	rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });

const PORTFOLIO = '/api/v1/portfolio';

let uploadsRoot;
const portfolioDir = () => path.join(uploadsRoot, 'portfolio');
const filesOnDisk = () => readdir(portfolioDir()).catch(() => []);

// Тестовые картинки создаём на лету
const png = (width = 40, height = 30) =>
	sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } } })
		.png()
		.toBuffer();

const createFreelancer = (email = 'dev@example.com') => createUser({ email, role: 'FREELANCER' });
const createCustomer = (email = 'customer@example.com') =>
	createUser({ email, role: 'CUSTOMER', fullName: 'Анна Заказчикова' });

const fieldsOf = (res) => (res.body.errors ?? []).map((error) => error.field);

// null означает «поле не отправлять»
const addProject = (
	token,
	{
		title = 'Лендинг для клуба',
		projectUrl = 'https://example.com/work',
		image,
		filename = 'work.png',
		contentType = 'image/png',
	} = {},
) => {
	const req = request(app).post(PORTFOLIO).set(authHeader(token));
	if (title !== null) req.field('title', title);
	if (projectUrl !== null) req.field('projectUrl', projectUrl);
	if (image) req.attach('image', image, { filename, contentType });
	return req;
};

const patchProject = (token, id, { title, projectUrl, image } = {}) => {
	const req = request(app).patch(`${PORTFOLIO}/${id}`).set(authHeader(token));
	if (title !== undefined) req.field('title', title);
	if (projectUrl !== undefined) req.field('projectUrl', projectUrl);
	if (image) req.attach('image', image, { filename: 'new.png', contentType: 'image/png' });
	return req;
};

const listMine = (token) => request(app).get(`${PORTFOLIO}/me`).set(authHeader(token));
const deleteProject = (token, id) =>
	request(app).delete(`${PORTFOLIO}/${id}`).set(authHeader(token));

beforeAll(async () => {
	uploadsRoot = await mkdtemp(path.join(os.tmpdir(), 'itfreelance-uploads-'));
	process.env.UPLOADS_DIR = uploadsRoot;
});

afterAll(async () => {
	await cleanDir(uploadsRoot, { recursive: true, force: true });
	delete process.env.UPLOADS_DIR;
});

beforeEach(async () => {
	// Связанные записи (профиль, портфолио) удаляются каскадом вместе с пользователем
	await prisma.user.deleteMany();
	await cleanDir(portfolioDir(), { recursive: true, force: true });
});

describe('POST /portfolio: добавление проекта', () => {
	it('исполнитель добавляет проект: запись в базе и обработанный файл на диске', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, { image: await png() });

		expect(res.status).toBe(201);
		expect(res.body.data.item).toMatchObject({
			title: 'Лендинг для клуба',
			projectUrl: 'https://example.com/work',
		});
		expect(res.body.data.item.imageUrl).toMatch(/^\/uploads\/portfolio\/[0-9a-f-]{36}\.webp$/);
		expect(res.body.data.item.imageKey).toBeUndefined();
		expect(await prisma.portfolioItem.count({ where: { userId: freelancer.id } })).toBe(1);
		expect(await filesOnDisk()).toHaveLength(1);
	});

	it('заказчик не может добавлять проекты: 403', async () => {
		const customer = await createCustomer();

		const res = await addProject(customer.accessToken, { image: await png() });

		expect(res.status).toBe(403);
		expect(await prisma.portfolioItem.count()).toBe(0);
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('без токена: 401', async () => {
		const res = await request(app).post(PORTFOLIO).field('title', 'Проект');

		expect(res.status).toBe(401);
	});

	it('без изображения: 400', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken);

		expect(res.status).toBe(400);
		expect(await prisma.portfolioItem.count()).toBe(0);
	});

	it('без названия: 400', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, { title: null, image: await png() });

		expect(res.status).toBe(400);
		expect(fieldsOf(res)).toContain('title');
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('ссылка не http и не https (javascript:): 400', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, {
			projectUrl: 'javascript:alert(1)',
			image: await png(),
		});

		expect(res.status).toBe(400);
		expect(fieldsOf(res)).toContain('projectUrl');
		expect(await prisma.portfolioItem.count()).toBe(0);
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('не картинка под видом png: 400, ничего не сохраняется', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, {
			image: Buffer.from('<script>alert(1)</script>'),
		});

		expect(res.status).toBe(400);
		expect(await prisma.portfolioItem.count()).toBe(0);
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('SVG не принимается: 400', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, {
			image: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
			filename: 'work.svg',
			contentType: 'image/svg+xml',
		});

		expect(res.status).toBe(400);
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('файл перекодируется в webp, а метаданные EXIF не сохраняются', async () => {
		const freelancer = await createFreelancer();
		const withExif = await sharp({
			create: { width: 40, height: 30, channels: 3, background: { r: 10, g: 20, b: 30 } },
		})
			.jpeg()
			.withMetadata({ exif: { IFD0: { Copyright: 'secret-author' } } })
			.toBuffer();
		expect(withExif.includes(Buffer.from('secret-author'))).toBe(true);

		const res = await addProject(freelancer.accessToken, {
			image: withExif,
			filename: 'photo.jpg',
			contentType: 'image/jpeg',
		});

		expect(res.status).toBe(201);
		const [file] = await filesOnDisk();
		const saved = await readFile(path.join(portfolioDir(), file));
		expect((await sharp(saved).metadata()).format).toBe('webp');
		expect(saved.includes(Buffer.from('secret-author'))).toBe(false);
	});

	it('большое изображение уменьшается до 1600 пикселей', async () => {
		const freelancer = await createFreelancer();

		const res = await addProject(freelancer.accessToken, { image: await png(3000, 2000) });

		expect(res.status).toBe(201);
		const [file] = await filesOnDisk();
		const saved = await readFile(path.join(portfolioDir(), file));
		const meta = await sharp(saved).metadata();
		expect(Math.max(meta.width, meta.height)).toBeLessThanOrEqual(1600);
	});

	it('userId из тела запроса игнорируется: проект принадлежит автору запроса', async () => {
		const owner = await createFreelancer('owner@example.com');
		const other = await createFreelancer('other@example.com');

		const res = await addProject(owner.accessToken, { image: await png() }).field(
			'userId',
			other.id,
		);

		expect(res.status).toBe(201);
		const saved = await prisma.portfolioItem.findFirst();
		expect(saved.userId).toBe(owner.id);
	});

	it('больше 12 проектов добавить нельзя: 409', async () => {
		const freelancer = await createFreelancer();
		await prisma.portfolioItem.createMany({
			data: Array.from({ length: 12 }, (_, i) => ({
				userId: freelancer.id,
				title: `Проект ${i + 1}`,
				projectUrl: 'https://example.com',
				imageKey: `dummy-${i}.webp`,
			})),
		});

		const res = await addProject(freelancer.accessToken, { image: await png() });

		expect(res.status).toBe(409);
		expect(await prisma.portfolioItem.count()).toBe(12);
		expect(await filesOnDisk()).toHaveLength(0);
	});
});

describe('GET /portfolio/me', () => {
	it('возвращает только мои проекты, новые сверху, без внутреннего ключа файла', async () => {
		const mine = await createFreelancer('mine@example.com');
		const other = await createFreelancer('other@example.com');
		await prisma.portfolioItem.createMany({
			data: [
				{
					userId: mine.id,
					title: 'Старый',
					projectUrl: 'https://example.com/1',
					imageKey: 'a.webp',
					createdAt: new Date('2026-01-01'),
				},
				{
					userId: mine.id,
					title: 'Новый',
					projectUrl: 'https://example.com/2',
					imageKey: 'b.webp',
					createdAt: new Date('2026-02-01'),
				},
				{
					userId: other.id,
					title: 'Чужой',
					projectUrl: 'https://example.com/3',
					imageKey: 'c.webp',
				},
			],
		});

		const res = await listMine(mine.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items.map((item) => item.title)).toEqual(['Новый', 'Старый']);
		expect(res.body.data.items[0].imageUrl).toBe('/uploads/portfolio/b.webp');
		expect(JSON.stringify(res.body)).not.toContain('imageKey');
	});

	it('заказчик: 403', async () => {
		const customer = await createCustomer();

		const res = await listMine(customer.accessToken);

		expect(res.status).toBe(403);
	});

	it('без токена: 401', async () => {
		const res = await request(app).get(`${PORTFOLIO}/me`);

		expect(res.status).toBe(401);
	});
});

describe('PATCH /portfolio/:id: изменение', () => {
	it('меняет название, остальное не затрагивается', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });
		const id = created.body.data.item.id;

		const res = await patchProject(freelancer.accessToken, id, { title: 'Новое название' });

		expect(res.status).toBe(200);
		expect(res.body.data.item).toMatchObject({
			title: 'Новое название',
			projectUrl: 'https://example.com/work',
		});
		expect(await filesOnDisk()).toHaveLength(1);
	});

	it('замена картинки: старый файл удаляется, новый сохраняется', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });
		const [oldFile] = await filesOnDisk();

		const res = await patchProject(freelancer.accessToken, created.body.data.item.id, {
			image: await png(50, 50),
		});

		expect(res.status).toBe(200);
		const files = await filesOnDisk();
		expect(files).toHaveLength(1);
		expect(files[0]).not.toBe(oldFile);
		expect(res.body.data.item.imageUrl).toContain(files[0]);
	});

	it('чужой проект изменить нельзя: 404, данные не меняются', async () => {
		const owner = await createFreelancer('owner@example.com');
		const other = await createFreelancer('other@example.com');
		const created = await addProject(owner.accessToken, { image: await png() });

		const res = await patchProject(other.accessToken, created.body.data.item.id, {
			title: 'Взлом',
		});

		expect(res.status).toBe(404);
		const saved = await prisma.portfolioItem.findFirst();
		expect(saved.title).toBe('Лендинг для клуба');
	});

	it('заказчик: 403', async () => {
		const customer = await createCustomer();

		const res = await patchProject(customer.accessToken, 'any-id', { title: 'Взлом' });

		expect(res.status).toBe(403);
	});

	it('пустой запрос: 400', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });

		const res = await patchProject(freelancer.accessToken, created.body.data.item.id);

		expect(res.status).toBe(400);
	});

	it('некорректная ссылка: 400, данные не меняются', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });

		const res = await patchProject(freelancer.accessToken, created.body.data.item.id, {
			projectUrl: 'javascript:alert(1)',
		});

		expect(res.status).toBe(400);
		const saved = await prisma.portfolioItem.findFirst();
		expect(saved.projectUrl).toBe('https://example.com/work');
	});
});

describe('DELETE /portfolio/:id: удаление', () => {
	it('удаляет запись и файл с диска', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });
		expect(await filesOnDisk()).toHaveLength(1);

		const res = await deleteProject(freelancer.accessToken, created.body.data.item.id);

		expect(res.status).toBe(200);
		expect(await prisma.portfolioItem.count()).toBe(0);
		expect(await filesOnDisk()).toHaveLength(0);
	});

	it('чужой проект удалить нельзя: 404, запись и файл остаются', async () => {
		const owner = await createFreelancer('owner@example.com');
		const other = await createFreelancer('other@example.com');
		const created = await addProject(owner.accessToken, { image: await png() });

		const res = await deleteProject(other.accessToken, created.body.data.item.id);

		expect(res.status).toBe(404);
		expect(await prisma.portfolioItem.count()).toBe(1);
		expect(await filesOnDisk()).toHaveLength(1);
	});

	it('заказчик: 403', async () => {
		const customer = await createCustomer();

		const res = await deleteProject(customer.accessToken, 'any-id');

		expect(res.status).toBe(403);
	});

	it('повторное удаление: 404', async () => {
		const freelancer = await createFreelancer();
		const created = await addProject(freelancer.accessToken, { image: await png() });
		const id = created.body.data.item.id;
		await deleteProject(freelancer.accessToken, id);

		const res = await deleteProject(freelancer.accessToken, id);

		expect(res.status).toBe(404);
	});
});
