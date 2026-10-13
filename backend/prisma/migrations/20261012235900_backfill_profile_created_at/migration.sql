-- Исправление данных: у профилей, созданных до миграции extend_profile,
-- createdAt и updatedAt получили время применения миграции вместо реального.

-- 1. Не редактировавшиеся профили: updatedAt совпадает с createdAt,
--    ставим время регистрации пользователя
UPDATE "profiles" AS p
SET "updatedAt" = u."createdAt"
FROM "users" AS u
WHERE p."userId" = u."id"
  AND p."updatedAt" = p."createdAt"
  AND p."createdAt" > u."createdAt";

-- 2. Время создания профиля = время регистрации пользователя
UPDATE "profiles" AS p
SET "createdAt" = u."createdAt"
FROM "users" AS u
WHERE p."userId" = u."id"
  AND p."createdAt" > u."createdAt";
