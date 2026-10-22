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
