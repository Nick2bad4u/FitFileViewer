import { renderAltitudeProfileChart } from './renderAltitudeProfileChart.js';
import { renderPowerVsHeartRateChart } from './renderPowerVsHeartRateChart.js';
import { renderSpeedVsDistanceChart } from './renderSpeedVsDistanceChart.js';

// Performance analysis charts renderer

export function renderPerformanceAnalysisCharts(container, data, labels, options) {
	try {
		console.log('[ChartJS] renderPerformanceAnalysisCharts called');

		// Render speed vs distance chart
		renderSpeedVsDistanceChart(container, data, options);

		// Render power vs heart rate chart
		renderPowerVsHeartRateChart(container, data, options);

		// Render altitude profile with gradient chart
		renderAltitudeProfileChart(container, data, labels, options);

	} catch (error) {
		console.error('[ChartJS] Error rendering performance analysis charts:', error);
	}
}
