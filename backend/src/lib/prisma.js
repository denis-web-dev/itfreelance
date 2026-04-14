// backend/src/lib/prisma.js
// Подключение к базе данных через Prisma

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
