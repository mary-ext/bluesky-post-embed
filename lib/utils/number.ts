const long = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });

export const format_compact = (value: number) => {
	if (value < 1_000) {
		return '' + value;
	}

	if (value < 100_000) {
		return long.format(value);
	}

	return compact.format(value);
};
