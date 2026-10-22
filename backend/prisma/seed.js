// ТОЛЬКО для dev-базы. В реальной работе рейтинг будет считаться из отзывов
await prisma.profile.update({
	where: { userId: customer.id },
	data: { ratingAvg: 4.9, ratingCount: 10 },
});
