const is_nan = Number.isNaN;

const abs_with_time = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' });
const abs_with_year = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const format_abs_date = (time: string | number) => {
	const date = new Date(time);

	if (is_nan(date.getTime())) {
		return 'N/A';
	}

	return abs_with_year.format(date);
};

export const format_abs_date_time = (time: string | number) => {
	const date = new Date(time);

	if (is_nan(date.getTime())) {
		return 'N/A';
	}

	return abs_with_time.format(date);
};
