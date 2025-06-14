// Utility function to get field color - updated field names

export function getFieldColor(field) {
	const colorMap = {
		'heartRate': '#EF4444',
		'cadence': '#10B981',
		'speed': '#3B82F6',
		'power': '#F59E0B',
		'altitude': '#8B5CF6',
		'temperature': '#EC4899',
		'grade': '#06B6D4',
		'distance': '#84CC16',
		'enhancedSpeed': '#009688',
		'enhancedAltitude': '#cddc39',
		'resistance': '#795548',
		'flow': '#c42196',
		'grit': '#6e1cbb',
		'positionLat': '#ff5722',
		'positionLong': '#3f51b5',
		'gps_track': '#4caf50'
	};
	return colorMap[field] || '#6B7280';
}
