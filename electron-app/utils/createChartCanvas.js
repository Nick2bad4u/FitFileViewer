// Helper function to create chart canvas element
export function createChartCanvas(field, index) {
	const canvas = document.createElement('canvas');
	canvas.id = `chart-${field}-${index}`;
	canvas.className = 'chart-canvas';
	canvas.setAttribute('role', 'img');
	canvas.setAttribute('aria-label', `Chart for ${field}`);

	// Set responsive canvas dimensions
	canvas.style.width = '100%';
	canvas.style.height = '400px';
	canvas.style.maxHeight = '400px';
	canvas.style.marginBottom = '20px';
	canvas.style.borderRadius = '8px';
	canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

	return canvas;
}
