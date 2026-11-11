// "React, Node.js" -> ["React", "Node.js"]
export const parseTags = (value) => {
	if (Array.isArray(value)) {
		return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
	}

	return [
		...new Set(
			(value ?? '')
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean),
		),
	];
};

const toNumberOrNull = (value) => {
	if (value === '' || value == null) return null;
	const number = Number(value);
	return Number.isFinite(number) ? Math.trunc(number) : null;
};

// Форма → API
export const formToApi = (data, isFreelancer) => {
	const base = {
		fullName: data.fullName || null,
		region: data.region || null,
		phone: maskToE164(data.phone),
		sphere: data.sphere || null,
		about: data.about || null,
		site: data.site || null,
		telegram: data.telegram || null,
		vk: data.vk || null,
	};

	if (isFreelancer) {
		return {
			...base,
			experience: data.experience || null,
			rate: toNumberOrNull(data.rate),
			skills: parseTags(data.skills),
			tools: parseTags(data.tools),
		};
	}

	return {
		...base,
		companyName: data.companyName || null,
		marketYears: toNumberOrNull(data.marketYears),
	};
};

// API → форма (skills/tools всегда массивы!)
export const apiToForm = ({ user, profile } = {}) => ({
	fullName: profile?.fullName ?? '',
	email: user?.email ?? '',
	region: profile?.region ?? '',
	phone: profile?.phone ? e164ToMask(profile.phone) : '',
	sphere: profile?.sphere ?? '',
	about: profile?.about ?? '',
	site: profile?.site ?? '',
	telegram: profile?.telegram ?? '',
	vk: profile?.vk ?? '',
	skills: Array.isArray(profile?.skills) ? profile.skills : [],
	tools: Array.isArray(profile?.tools) ? profile.tools : [],
	experience: profile?.experience ?? '',
	rate: profile?.rate != null ? String(profile.rate) : '',
	companyName: profile?.companyName ?? '',
	marketYears: profile?.marketYears != null ? String(profile.marketYears) : '',
});

// "+7 (925) 123-45-67" -> "+79251234567" (E.164, то, что уходит на сервер)
export const maskToE164 = (masked) => {
	if (!masked) return null;
	const digits = masked.replace(/\D/g, '');
	return digits.length === 11 ? `+${digits}` : null;
};

// "+79251234567" -> "+7 (925) 123-45-67" (то, что показывает маска)
export const e164ToMask = (e164) => {
	if (!e164) return '';
	const digits = e164.replace(/\D/g, '');
	if (digits.length !== 11) return e164; // легаси-значение показываем как есть
	const d = digits.slice(1); // убираем 7
	return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
};
