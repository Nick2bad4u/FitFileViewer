import { detectCurrentTheme } from './chartThemeUtils.js';
import { renderLapZoneChart } from './renderLapZoneChart.js';
import { renderSingleHRZoneBar } from './renderSingleHRZoneBar.js';
import { renderSinglePowerZoneBar } from './renderSinglePowerZoneBar.js';

// Lap zone charts renderer - renders 4 different lap zone visualizations
export function renderLapZoneCharts(container) {
	try {
		console.log('[ChartJS] renderLapZoneCharts called');

		if (!window.globalData || !window.globalData.timeInZoneMesgs) {
			console.log('[ChartJS] No timeInZoneMesgs available for lap zone charts');
			return;
		}

		const timeInZoneMesgs = window.globalData.timeInZoneMesgs;
		const lapZoneMsgs = timeInZoneMesgs.filter(msg => msg.referenceMesg === 'lap');
		// Get theme from options or fallback to system
		const theme = detectCurrentTheme();
		console.log('[renderLapZoneCharts] Detected theme:', theme);

		if (lapZoneMsgs.length === 0) {
			console.log('[ChartJS] No lap-specific zone data found');
			return;
		}

		console.log('[ChartJS] Found lap zone data:', lapZoneMsgs);

		// Helper function to parse zone arrays safely
		function safeParseArray(val) {
			if (Array.isArray(val)) return val;
			if (!val || typeof val !== 'string') return [];
			try {
				const clean = val.trim().replace(/^"+|"+$/g, '');
				const arr = JSON.parse(clean);
				if (!Array.isArray(arr)) throw new Error('Not an array');
				return arr;
			} catch {
				return [];
			}
		}

		// Process HR zone data for laps
		const hrZoneData = lapZoneMsgs
			.filter(msg => msg.timeInHrZone)
			.map((msg, index) => {
				const zones = safeParseArray(msg.timeInHrZone);
				return {
					lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
					zones: zones.slice(1).map((value, zoneIndex) => ({
						label: `HR Zone ${zoneIndex + 1}`,
						value: value || 0,
						color: `hsl(${0 + zoneIndex * 30}, 70%, ${60 + zoneIndex * 5}%)`
					}))
				};
			})
			.filter(lap => lap.zones.length > 0);

		// Process Power zone data for laps
		const pwrZoneData = lapZoneMsgs
			.filter(msg => msg.timeInPowerZone)
			.map((msg, index) => {
				const zones = safeParseArray(msg.timeInPowerZone);
				return {
					lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
					zones: zones.slice(1).map((value, zoneIndex) => ({
						label: `Power Zone ${zoneIndex + 1}`,
						value: value || 0,
						color: `hsl(${40 + zoneIndex * 25}, 75%, ${55 + zoneIndex * 3}%)`
					}))
				};
			})
			.filter(lap => lap.zones.length > 0); // Chart 1: Lap HR Zone Distribution (Stacked Bar)
		const hrBarVisible = localStorage.getItem('chartjs_field_hr_zone_bar') !== 'hidden';
		if (hrBarVisible && hrZoneData.length > 0) {
			const canvas1 = document.createElement('canvas');
			canvas1.id = 'chartjs-canvas-lap-hr-zones';
			canvas1.style.marginBottom = '32px';
			canvas1.style.maxHeight = '400px';
			canvas1.style.background = theme === 'dark' ? '#181c24' : '#ffffff';
			canvas1.style.borderRadius = '12px';
			canvas1.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
			container.appendChild(canvas1);

			const hrChart = renderLapZoneChart(canvas1, hrZoneData, {
				title: 'Heart Rate Zone Distribution by Lap',
				theme: theme
			});
			if (hrChart) window._chartjsInstances.push(hrChart);
		}
		// Chart 2: Lap Power Zone Distribution (Stacked Bar)
		const powerBarVisible = localStorage.getItem('chartjs_field_power_zone_bar') !== 'hidden';
		if (powerBarVisible && pwrZoneData.length > 0) {
			const canvas2 = document.createElement('canvas');
			canvas2.id = 'chartjs-canvas-lap-power-zones';
			canvas2.style.marginBottom = '32px';
			canvas2.style.maxHeight = '400px';
			canvas2.style.background = theme === 'dark' ? '#181c24' : '#ffffff';
			canvas2.style.borderRadius = '12px';
			canvas2.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
			container.appendChild(canvas2);

			const pwrChart = renderLapZoneChart(canvas2, pwrZoneData, {
				title: 'Power Zone Distribution by Lap',
				theme: theme
			});
			if (pwrChart) window._chartjsInstances.push(pwrChart);
		}
		// Chart 3: Single Lap HR Zone Bar (first lap or lap with most data)
		if (hrBarVisible && hrZoneData.length > 0) {
			const bestHRLap = hrZoneData.reduce((prev, curr) => curr.zones.reduce((sum, z) => sum + z.value, 0) > prev.zones.reduce((sum, z) => sum + z.value, 0) ? curr : prev
			);

			const canvas3 = document.createElement('canvas');
			canvas3.id = 'chartjs-canvas-single-lap-hr';
			canvas3.style.marginBottom = '32px';
			canvas3.style.maxHeight = '350px';
			canvas3.style.background = theme === 'dark' ? '#181c24' : '#ffffff';
			canvas3.style.borderRadius = '12px';
			canvas3.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
			container.appendChild(canvas3);

			const singleHRChart = renderSingleHRZoneBar(canvas3, bestHRLap.zones, {
				title: `${bestHRLap.lapLabel} - Heart Rate Zones`,
				theme: theme
			});
			if (singleHRChart) window._chartjsInstances.push(singleHRChart);
		}

		// Chart 4: Single Lap Power Zone Bar (first lap or lap with most data)
		if (powerBarVisible && pwrZoneData.length > 0) {
			const bestPwrLap = pwrZoneData.reduce((prev, curr) => curr.zones.reduce((sum, z) => sum + z.value, 0) > prev.zones.reduce((sum, z) => sum + z.value, 0) ? curr : prev
			);

			const canvas4 = document.createElement('canvas');
			canvas4.id = 'chartjs-canvas-single-lap-power';
			canvas4.style.marginBottom = '32px';
			canvas4.style.maxHeight = '350px';
			canvas4.style.background = theme === 'dark' ? '#181c24' : '#ffffff';
			canvas4.style.borderRadius = '12px';
			canvas4.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.18)';
			container.appendChild(canvas4);

			const singlePwrChart = renderSinglePowerZoneBar(canvas4, bestPwrLap.zones, {
				title: `${bestPwrLap.lapLabel} - Power Zones`,
				theme: theme
			});
			if (singlePwrChart) window._chartjsInstances.push(singlePwrChart);
		}

		console.log('[ChartJS] Lap zone charts rendered successfully');
	} catch (error) {
		console.error('[ChartJS] Error rendering lap zone charts:', error);
		if (window.showNotification) {
			window.showNotification('Failed to render lap zone charts', 'error');
		}
	}
}
