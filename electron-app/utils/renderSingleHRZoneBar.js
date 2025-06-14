import { detectCurrentTheme } from './chartThemeUtils.js';

/**
 * Renders a single heart rate zone bar (e.g., for a summary or lap)
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object[]} zoneData - Array of zone objects {label, value, color}
 * @param {Object} [options={}] - Chart options (theme, title, etc.)
 * @returns {Chart|null} Chart.js instance or null on error
 */

export function renderSingleHRZoneBar(canvas, zoneData, options = {}) {
	try {
		if (!window.Chart || !canvas || !Array.isArray(zoneData)) {
			throw new Error('Chart.js, canvas, or zoneData missing');
		}
		const theme = detectCurrentTheme();
		console.log('[renderSingleHRZoneBar] Detected theme:', theme);
		const chart = new window.Chart(canvas, {
			type: 'bar',
			data: {
				labels: zoneData.map(z => z.label),
				datasets: [{
					label: options.title || 'Heart Rate Zones',
					data: zoneData.map(z => z.value),
					backgroundColor: zoneData.map(z => z.color || (theme === 'dark' ? '#ef4444' : '#dc2626')),
					borderColor: theme === 'dark' ? '#333' : '#fff',
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: !!options.title,
						text: options.title || 'Heart Rate Zones',
						color: theme === 'dark' ? '#fff' : '#000',
						font: { size: 16, weight: 'bold' }
					},
					tooltip: {
						backgroundColor: theme === 'dark' ? '#222' : '#fff',
						titleColor: theme === 'dark' ? '#fff' : '#000',
						bodyColor: theme === 'dark' ? '#fff' : '#000',
						borderColor: theme === 'dark' ? '#555' : '#ddd',
						borderWidth: 1, callbacks: {
							label: function (context) {
								return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}s`;
							}
						}
					},
					backgroundColorPlugin: {
						backgroundColor: theme === 'dark' ? '#181c24' : '#ffffff'
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Zone',
							color: theme === 'dark' ? '#fff' : '#000'
						},
						ticks: {
							color: theme === 'dark' ? '#fff' : '#000'
						},
						grid: {
							color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
						}
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Time (minutes)',
							color: theme === 'dark' ? '#fff' : '#000'
						},
						ticks: {
							color: theme === 'dark' ? '#fff' : '#000'
						},
						grid: {
							color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
						}
					}
				}
			},
			plugins: [
				'backgroundColorPlugin'
			]
		});
		return chart;
	} catch (error) {
		if (window.showNotification) window.showNotification('Failed to render HR zone bar', 'error');
		console.error('[renderSingleHRZoneBar] Error:', error);
		return null;
	}
}
