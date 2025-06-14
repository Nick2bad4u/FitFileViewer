import { detectCurrentTheme } from './chartThemeUtils.js';
import { createChartCanvas } from './createChartCanvas.js';
import { formatTime } from './formatTime.js';

// Altitude profile with gradient visualization
export function renderAltitudeProfileChart(container, data, labels, options) {
	try {
		const hasAltitude = data.some(row => (row.altitude !== undefined && row.altitude !== null) ||
			(row.enhancedAltitude !== undefined && row.enhancedAltitude !== null));

		if (!hasAltitude) {
			return;
		}

		const visibility = localStorage.getItem('chartjs_field_altitude_profile');
		if (visibility === 'hidden') {
			return;
		}

		const currentTheme = detectCurrentTheme();

		let chartData = data.map((row, index) => {
			const altitude = row.enhancedAltitude || row.altitude;

			if (altitude !== undefined && altitude !== null) {
				return {
					x: labels[index],
					y: altitude
				};
			}
			return null;
		}).filter(point => point !== null);

		if (chartData.length === 0) return;

		// Apply data point limiting
		if (options.maxPoints !== 'all' && chartData.length > options.maxPoints) {
			const step = Math.ceil(chartData.length / options.maxPoints);
			chartData = chartData.filter((_, i) => i % step === 0);
		}

		const canvas = createChartCanvas('altitude-profile', 'altitude-profile');
		canvas.style.background = currentTheme === 'dark' ? '#181c24' : '#ffffff';
		canvas.style.borderRadius = '12px';
		canvas.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
		container.appendChild(canvas);

		const config = {
			type: 'line',
			data: {
				datasets: [{
					label: 'Altitude Profile',
					data: chartData,
					backgroundColor: 'rgba(67, 160, 71, 0.3)',
					borderColor: 'rgba(67, 160, 71, 1)',
					pointRadius: 0,
					pointHoverRadius: 4,
					borderWidth: 2,
					fill: 'origin',
					tension: 0.1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: options.showLegend,
						labels: { color: currentTheme === 'dark' ? '#fff' : '#000' }
					},
					title: {
						display: options.showTitle,
						text: 'Altitude Profile',
						font: { size: 16, weight: 'bold' },
						color: currentTheme === 'dark' ? '#fff' : '#000'
					},
					tooltip: {
						backgroundColor: currentTheme === 'dark' ? '#222' : '#fff',
						titleColor: currentTheme === 'dark' ? '#fff' : '#000',
						bodyColor: currentTheme === 'dark' ? '#fff' : '#000',
						borderColor: currentTheme === 'dark' ? '#555' : '#ddd',
						borderWidth: 1,
						callbacks: {
							title: function (context) {
								return `Time: ${formatTime(context[0].parsed.x)}`;
							},
							label: function (context) {
								return `Altitude: ${context.parsed.y.toFixed(1)} m`;
							}
						}
					},
					backgroundColorPlugin: {
						backgroundColor: currentTheme === 'dark' ? '#181c24' : '#ffffff'
					}
				},
				scales: {
					x: {
						type: 'linear',
						display: true,
						grid: {
							display: options.showGrid,
							color: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
						},
						title: {
							display: true,
							text: 'Time (minutes)',
							color: currentTheme === 'dark' ? '#fff' : '#000'
						},
						ticks: {
							color: currentTheme === 'dark' ? '#fff' : '#000',
							callback: function (value) {
								return formatTime(value);
							}
						}
					},
					y: {
						type: 'linear',
						display: true,
						grid: {
							display: options.showGrid,
							color: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
						},
						title: {
							display: true,
							text: 'Altitude (m)',
							color: currentTheme === 'dark' ? '#fff' : '#000'
						},
						ticks: { color: currentTheme === 'dark' ? '#fff' : '#000' }
					}
				}
			},
			plugins: ['backgroundColorPlugin']
		};

		const chart = new window.Chart(canvas, config);
		if (chart) {
			window._chartjsInstances.push(chart);
			console.log('[ChartJS] Altitude Profile chart created successfully');
		}

	} catch (error) {
		console.error('[ChartJS] Error rendering altitude profile chart:', error);
	}
}
