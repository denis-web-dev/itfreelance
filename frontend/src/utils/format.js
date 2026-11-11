const numberFormatter = new Intl.NumberFormat('ru-RU');

// 580000 -> "580 000 ₽"
export const formatBudget = (value) => `${numberFormatter.format(value)} ₽`;

// ISO-строка -> "08.12.25", как в макете
export const formatDate = (iso) =>
	new Date(iso).toLocaleDateString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
	});
export const formatNumber = (value) => numberFormatter.format(value);

// 1 год, 2 года, 5 лет
export const formatYears = (n) => {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	let word = 'лет';
	if (abs < 11 || abs > 19) {
		if (last === 1) word = 'год';
		else if (last >= 2 && last <= 4) word = 'года';
	}
	return `${n} ${word}`;
};
// '+79519368777' -> '+7 (951) 936-87-77'; незнакомые значения возвращает как есть
export const formatPhone = (value) => {
	if (!value) return '';
	const digits = value.replace(/\D/g, '');
	if (digits.length !== 11) return value;
	const d = digits.slice(1); // без «7»
	return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
};
