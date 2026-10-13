// "React, Node.js" -> ["React", "Node.js"] (без пустых и повторов)
export const parseTags = (value) => [
	...new Set(
		(value ?? '')
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean),
	),
];

export const tagsToString = (tags) => (tags ?? []).join(', ');

const toNumberOrNull = (value) => {
	if (value === '' || value == null) return null;
	const number = Number(value);
	return Number.isFinite(number) ? Math.trunc(number) : null;
};

// Данные формы -> тело запроса к API (только поля своей роли)
export const formToApi = (data, isFreelancer) => ({
	fullName: data.fullName,
	region: data.region,
	phone: data.phone,
	sphere: data.sphere,
	about: data.about,
	site: data.site,
	telegram: data.telegram,
	vk: data.vk,
	skills: parseTags(data.skills),
	tools: parseTags(data.tools),
	...(isFreelancer
		? { experience: data.experience, rate: toNumberOrNull(data.rate) }
		: { companyName: data.companyName, marketYears: toNumberOrNull(data.marketYears) }),
});

// Ответ API -> значения формы
export const apiToForm = ({ user, profile }) => ({
	fullName: profile?.fullName ?? '',
	email: user?.email ?? '',
	region: profile?.region ?? '',
	phone: profile?.phone ?? '',
	sphere: profile?.sphere ?? '',
	about: profile?.about ?? '',
	site: profile?.site ?? '',
	telegram: profile?.telegram ?? '',
	vk: profile?.vk ?? '',
	skills: tagsToString(profile?.skills),
	tools: tagsToString(profile?.tools),
	experience: profile?.experience ?? '',
	rate: profile?.rate != null ? String(profile.rate) : '',
	companyName: profile?.companyName ?? '',
	marketYears: profile?.marketYears != null ? String(profile.marketYears) : '',
});
