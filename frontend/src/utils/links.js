const toSafeUrl = (value) => {
	const text = (value ?? '').trim();
	if (!text) return null;

	let candidate = text;
	if (!/^https?:\/\//i.test(text)) {
		// любая другая схема (javascript:, data: и т.д.) запрещена
		if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text)) return null;
		candidate = `https://${text.replace(/^\/+/, '')}`;
	}

	try {
		const url = new URL(candidate);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
	} catch {
		return null;
	}
};

export { toSafeUrl };

// "@name" -> https://t.me/name
export const telegramUrl = (value) => {
	const text = (value ?? '').trim();
	return text.startsWith('@') ? toSafeUrl(`t.me/${text.slice(1)}`) : toSafeUrl(text);
};
