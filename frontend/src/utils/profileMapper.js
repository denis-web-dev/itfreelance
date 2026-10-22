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
		phone: data.phone || null,
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
	phone: profile?.phone ?? '',
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
