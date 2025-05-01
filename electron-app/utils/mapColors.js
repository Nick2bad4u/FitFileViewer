// Utility for lap color selection
export function getLapColor(lapIdx) {
	const palette = [
		'#ff5722',
		'#2196f3',
		'#4caf50',
		'#e91e63',
		'#ff9800',
		'#9c27b0',
		'#00bcd4',
		'#8bc34a',
		'#ffc107',
		'#3f51b5',
		'#f44336',
		'#009688',
		'#cddc39',
		'#607d8b',
		'#795548',
		'#673ab7',
		'#b71c1c',
		'#1b5e20',
		'#0d47a1',
		'#fbc02d',
		'#8d6e63',
		'#c2185b',
		'#1976d2',
		'#388e3c',
		'#f57c00',
		'#7b1fa2',
		'#0288d1',
		'#2c6c6d',
		'#d32f2f',
		'#388e3c',
		'#f57c00',
	];
	if (lapIdx === 'all') return 'blue';
	return palette[Number(lapIdx) % palette.length];
}
