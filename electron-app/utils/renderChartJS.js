/**
 * @fileoverview Enhanced Chart.js rendering utility for FIT file data visualization
 * @description Provides comprehensive chart rendering, controls management, and export capabilities
 * for fitness device data visualization in the FitFileViewer Electron application.
 * 
 * Features:
 * - Multiple chart types (line, bar, doughnut) with dynamic data binding
 * - Toggleable controls panel with professional UI
 * - Comprehensive export capabilities (PNG, CSV, JSON, clipboard)
 * - Performance monitoring and error handling
 * - Theme-aware styling and responsive design
 * - Accessibility support with ARIA labels
 * 
 * Dependencies:
 * - Chart.js library (window.Chart)
 * - chartjs-plugin-zoom for interactive zoom/pan
 * - showNotification utility for user feedback
 * - JSZip library (window.JSZip) for ZIP export functionality
 * 
 * @author FitFileViewer Development Team
 * @version 2.0.0
 * @since 1.0.0
 */

// filepath: electron-app/utils/renderChartJS.js
// Enhanced Chart.js rendering for FIT file data with comprehensive export capabilities
// Assumes Chart.js and JSZip are loaded as window.Chart and window.JSZip

/* global JSZip */

import { showNotification } from './showNotification.js';

/**
 * Formats seconds into MM:SS or HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
	if (typeof seconds !== 'number') return '0:00';
	
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	} else {
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
}

/**
 * Extracts and sets up heart rate and power zone data from FIT file
 * @param {Object} globalData - FIT file data object
 */
function setupZoneData(globalData) {
	try {
		if (!globalData) return;

		console.log('[ChartJS] Setting up zone data from globalData:', globalData);
		
		// Extract heart rate and power zones from timeInZoneMesgs
		if (globalData.timeInZoneMesgs && Array.isArray(globalData.timeInZoneMesgs)) {
			console.log('[ChartJS] Found timeInZoneMesgs:', globalData.timeInZoneMesgs.length);
			
			// Debug: Log all timeInZoneMesgs to see what's available
			globalData.timeInZoneMesgs.forEach((zoneMsg, index) => {
				console.log(`[ChartJS] TimeInZone ${index} fields:`, Object.keys(zoneMsg));
				console.log(`[ChartJS] TimeInZone ${index} data:`, zoneMsg);
			});
			
			// Look for session-level zone data (referenceMesg === 'session')
			const sessionZoneData = globalData.timeInZoneMesgs.find(zoneMsg => 
				zoneMsg.referenceMesg === 'session'
			);
			
			if (sessionZoneData) {
				// Process heart rate zones
				if (sessionZoneData.timeInHrZone && Array.isArray(sessionZoneData.timeInHrZone)) {
					console.log('[ChartJS] Found HR zone data in timeInZoneMesgs:', sessionZoneData.timeInHrZone);
					const hrZoneData = sessionZoneData.timeInHrZone
						.map((time, index) => ({
							zone: index + 1,
							time: time || 0,
							label: `Zone ${index + 1}`
						}))
						.filter(zone => zone.time > 0);
					
					if (hrZoneData.length > 0) {
						window.heartRateZones = hrZoneData;
						console.log('[ChartJS] Heart rate zones data set:', hrZoneData);
					}
				} else {
					console.log('[ChartJS] No HR zone data found in session timeInZoneMesgs');
				}
				
				// Process power zones
				if (sessionZoneData.timeInPowerZone && Array.isArray(sessionZoneData.timeInPowerZone)) {
					console.log('[ChartJS] Found power zone data in timeInZoneMesgs:', sessionZoneData.timeInPowerZone);
					const powerZoneData = sessionZoneData.timeInPowerZone
						.map((time, index) => ({
							zone: index + 1,
							time: time || 0,
							label: `Zone ${index + 1}`
						}))
						.filter(zone => zone.time > 0);
					
					if (powerZoneData.length > 0) {
						window.powerZones = powerZoneData;
						console.log('[ChartJS] Power zones data set:', powerZoneData);
					}
				} else {
					console.log('[ChartJS] No power zone data found in session timeInZoneMesgs');
				}
			} else {
				console.log('[ChartJS] No session-level timeInZoneMesgs found');
			}
		} else {
			console.log('[ChartJS] No timeInZoneMesgs found in globalData');
		}
		
		// Fallback: Extract heart rate zones from session messages (legacy approach)
		if (!window.heartRateZones && globalData.sessionMesgs && Array.isArray(globalData.sessionMesgs)) {
			console.log('[ChartJS] Trying legacy session messages for HR zones');
			const sessionWithHrZones = globalData.sessionMesgs.find(session => 
				session.time_in_hr_zone && Array.isArray(session.time_in_hr_zone)
			);
			
			if (sessionWithHrZones && sessionWithHrZones.time_in_hr_zone) {
				console.log('[ChartJS] Found HR zone data in session:', sessionWithHrZones.time_in_hr_zone);
				const hrZoneData = sessionWithHrZones.time_in_hr_zone
					.map((time, index) => ({
						zone: index + 1,
						time: time || 0,
						label: `Zone ${index + 1}`
					}))
					.filter(zone => zone.time > 0);
				
				if (hrZoneData.length > 0) {
					window.heartRateZones = hrZoneData;
					console.log('[ChartJS] Heart rate zones data set from session:', hrZoneData);
				}
			}
		}
		
		// Fallback: Extract power zones from session messages (legacy approach)  
		if (!window.powerZones && globalData.sessionMesgs && Array.isArray(globalData.sessionMesgs)) {
			console.log('[ChartJS] Trying legacy session messages for power zones');
			const sessionWithPowerZones = globalData.sessionMesgs.find(session => 
				session.time_in_power_zone && Array.isArray(session.time_in_power_zone)
			);
			
			if (sessionWithPowerZones && sessionWithPowerZones.time_in_power_zone) {
				console.log('[ChartJS] Found power zone data in session:', sessionWithPowerZones.time_in_power_zone);
				const powerZoneData = sessionWithPowerZones.time_in_power_zone
					.map((time, index) => ({
						zone: index + 1,
						time: time || 0,
						label: `Zone ${index + 1}`
					}))
					.filter(zone => zone.time > 0);
				
				if (powerZoneData.length > 0) {
					window.powerZones = powerZoneData;
					console.log('[ChartJS] Power zones data set from session:', powerZoneData);
				}
			}
		}

		// Also check lap messages for zone data if session data is not available
		if (!window.heartRateZones && !window.powerZones) {
			const lapMesgs = globalData.lapMesgs;
			if (lapMesgs && Array.isArray(lapMesgs) && lapMesgs.length > 0) {
				console.log('[ChartJS] Trying to aggregate zone data from lap messages');
				// Aggregate zone times from all laps
				const hrZoneTimes = [];
				const powerZoneTimes = [];
				
				lapMesgs.forEach(lap => {
					if (lap.time_in_hr_zone && Array.isArray(lap.time_in_hr_zone)) {
						lap.time_in_hr_zone.forEach((time, index) => {
							hrZoneTimes[index] = (hrZoneTimes[index] || 0) + (time || 0);
						});
					}
					
					if (lap.time_in_power_zone && Array.isArray(lap.time_in_power_zone)) {
						lap.time_in_power_zone.forEach((time, index) => {
							powerZoneTimes[index] = (powerZoneTimes[index] || 0) + (time || 0);
						});
					}
				});
				
				// Set up HR zones from lap data
				if (hrZoneTimes.length > 0 && hrZoneTimes.some(time => time > 0)) {
					window.heartRateZones = hrZoneTimes.map((time, index) => ({
						zone: index + 1,
						time: time || 0,
						label: `Zone ${index + 1}`
					})).filter(zone => zone.time > 0);
					
					console.log('[ChartJS] Heart rate zones processed from laps:', window.heartRateZones);
				}
				
				// Set up power zones from lap data
				if (powerZoneTimes.length > 0 && powerZoneTimes.some(time => time > 0)) {
					window.powerZones = powerZoneTimes.map((time, index) => ({
						zone: index + 1,
						time: time || 0,
						label: `Zone ${index + 1}`
					})).filter(zone => zone.time > 0);
					
					console.log('[ChartJS] Power zones processed from laps:', window.powerZones);
				}
			}
		}

	} catch (error) {
		console.error('[ChartJS] Error setting up zone data:', error);
	}
}

// Chart.js plugin registration
if (window.Chart && window.Chart.register && window.Chart.Zoom) {
	window.Chart.register(window.Chart.Zoom);
	console.log('[ChartJS] chartjs-plugin-zoom registered.');
} else if (window.Chart && window.Chart.register && window.chartjsPluginZoom) {
	window.Chart.register(window.chartjsPluginZoom);
	console.log('[ChartJS] chartjs-plugin-zoom registered (window.chartjsPluginZoom).');
} else if (window.Chart && window.Chart.register && window.ChartZoom) {
	window.Chart.register(window.ChartZoom);
	console.log('[ChartJS] chartjs-plugin-zoom registered (window.ChartZoom).');
} else {
	console.warn('[ChartJS] chartjs-plugin-zoom is not loaded. Zoom/pan will be unavailable.');
}

// Listen for a custom event to trigger chart re-render on file load
if (!window._fitFileViewerChartListener) {
	window._fitFileViewerChartListener = true;
	let _fitfileLoadedFired = false;
	window.addEventListener('fitfile-loaded', function () {
		_fitfileLoadedFired = true;
		console.log('[ChartJS] fitfile-loaded event received, re-rendering charts');
		// Re-render charts when a new file is loaded
		renderChartJS();
	});
	// Also listen for file input changes (if any file input exists)
	const fileInputs = document.querySelectorAll('input[type="file"]');
	fileInputs.forEach(input => {
		input.addEventListener('change', function () {
			console.log('[ChartJS] File input changed, re-rendering charts');
			setTimeout(() => {
				window.dispatchEvent(new Event('fitfile-loaded'));
			}, 100); // slight delay to allow file to load
		});
	});
	// Warn if event is not dispatched after file load
	setTimeout(() => {
		if (!_fitfileLoadedFired && (!window._chartjsInstances || window._chartjsInstances.length === 0)) {
			console.warn('[ChartJS] fitfile-loaded event was not dispatched after file load. Charts will not update until you call window.dispatchEvent(new Event("fitfile-loaded")) after loading a new file.');
		}
	}, 2000);
}

// Throttle for animation progress log
let _lastAnimLog = 0;
function throttledAnimLog(msg) {
	const now = Date.now();
	if (now - _lastAnimLog > 200) {
		console.log(msg);
		_lastAnimLog = now;
	}
}

// Helper function to update animation configurations for all charts
function updateChartAnimations(chart, type) {
	if (!chart || !chart.options) return;

	// Update animation configuration
	if (!chart.options.animation) {
		chart.options.animation = {};
	}

	chart.options.animation = {
		...chart.options.animation,
		duration: 1200,
		easing: 'easeInOutQuart',
		onProgress: function (context) {
			if (context && context.currentStep !== undefined && context.numSteps !== undefined) {
				throttledAnimLog(`[ChartJS] ${type} chart animation: ${Math.round((100 * context.currentStep) / context.numSteps)}%`);
			}
		},
		onComplete: function () {
			console.log(`[ChartJS] ${type} chart animation complete`);
		},
	};

	// Add animations configuration based on chart type
	if (!chart.options.animations) {
		chart.options.animations = {};
	}

	if (chart.config.type === 'line') {
		chart.options.animations.tension = {
			duration: 1500,
			easing: 'easeOutQuart',
			from: 0,
			to: 0.4,
		};
	} else if (chart.config.type === 'bar') {
		chart.options.animations.colors = {
			duration: 1000,
			easing: 'easeOutQuart',
		};
	} else if (chart.config.type === 'doughnut') {
		chart.options.animations.animateRotate = true;
		chart.options.animations.animateScale = true;
	}

	return chart;
}

// Enhanced configuration for chart customization
const defaultMaxPoints = 250;
const maxPointsOptions = [1, 10, 25, 50, 100, 200, 250, 500, 700, 1000, 2000, 3000, 5000, 10000, 50000, 100000, 1000000, 'all'];

// Comprehensive chart configuration options
const chartOptionsConfig = [
	{
		id: 'maxpoints',
		label: 'Max Points',
		type: 'select',
		options: maxPointsOptions,
		default: defaultMaxPoints,
		description: 'Maximum number of data points to display',
	},
	{
		id: 'chartType',
		label: 'Chart Type',
		type: 'select',
		options: ['line', 'bar', 'scatter', 'area'],
		default: 'line',
		description: 'Type of chart visualization',
	},
	{
		id: 'interpolation',
		label: 'Interpolation',
		type: 'select',
		options: ['linear', 'monotone', 'stepped'],
		default: 'monotone',
		description: 'Line interpolation method',
	},
	{
		id: 'animation',
		label: 'Animation',
		type: 'select',
		options: ['smooth', 'fast', 'none'],
		default: 'smooth',
		description: 'Chart animation style',
	},
	{
		id: 'exportTheme',
		label: 'Export Theme',
		type: 'select',
		options: ['light', 'dark', 'transparent'],
		default: 'light',
		description: 'Background theme for exported images',
	},
	{
		id: 'showGrid',
		label: 'Grid',
		type: 'toggle',
		options: ['on', 'off'],
		default: 'on',
		description: 'Show/hide chart grid lines',
	},
	{
		id: 'showLegend',
		label: 'Legend',
		type: 'toggle',
		options: ['on', 'off'],
		default: 'on',
		description: 'Show/hide chart legend',
	},
	{
		id: 'showTitle',
		label: 'Title',
		type: 'toggle',
		options: ['on', 'off'],
		default: 'on',
		description: 'Show/hide chart titles',
	},
	{
		id: 'showPoints',
		label: 'Data Points',
		type: 'toggle',
		options: ['on', 'off'],
		default: 'off',
		description: 'Show/hide individual data points',
	},
	{
		id: 'showFill',
		label: 'Fill Area',
		type: 'toggle',
		options: ['on', 'off'],
		default: 'on',
		description: 'Fill area under the line',
	},
	{
		id: 'smoothing',
		label: 'Line Smoothing',
		type: 'range',
		min: 0,
		max: 1,
		step: 0.1,
		default: 0.4,
		description: 'Line curve smoothing amount',
	},
];

// Enhanced chart fields with better categorization
const chartFields = [
	'speed',
	'heartRate', 
	'altitude',
	'power',
	'cadence',
	'temperature',
	'distance',
	'enhancedSpeed',
	'enhancedAltitude',
	'resistance',
	'flow',
	'grit',
];

const fieldLabels = {
	speed: 'Speed (m/s)',
	heartRate: 'Heart Rate (bpm)',
	altitude: 'Altitude (m)',
	power: 'Power (W)',
	cadence: 'Cadence (rpm)',
	temperature: 'Temperature (°C)',
	distance: 'Distance (m)',
	enhancedSpeed: 'Enhanced Speed (m/s)',
	enhancedAltitude: 'Enhanced Altitude (m)',
	resistance: 'Resistance',
	flow: 'Flow',
	grit: 'Grit',
};

// Enhanced color scheme with better accessibility
const fieldColors = {
	speed: '#1976d2',
	heartRate: '#e53935',
	altitude: '#43a047',
	power: '#ff9800',
	cadence: '#8e24aa',
	temperature: '#00bcd4',
	distance: '#607d8b',
	enhancedSpeed: '#009688',
	enhancedAltitude: '#cddc39',
	resistance: '#795548',
	flow: '#c42196',
	grit: '#6e1cbb',
};

// Export utilities
const ExportUtils = {
	/**
	 * Gets the theme background color for exports
	 * @returns {string} Background color based on export theme setting
	 */
	getExportThemeBackground() {
		const theme = localStorage.getItem('chartjs_exportTheme') || 'light';
		switch (theme) {
			case 'dark':
				return '#1a1a1a';
			case 'transparent':
				return 'transparent';
			case 'light':
			default:
				return '#ffffff';
		}
	},

	/**
	 * Downloads chart as PNG image with theme-aware background
	 * @param {Chart} chart - Chart.js instance
	 * @param {string} filename - Download filename
	 */
	async downloadChartAsPNG(chart, filename = 'chart.png') {
		try {
			const backgroundColor = this.getExportThemeBackground();
			const link = document.createElement('a');
			link.download = filename;
			link.href = chart.toBase64Image('image/png', 1.0, backgroundColor);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			showNotification(`Chart exported as ${filename}`, 'success');
		} catch (error) {
			console.error('Error exporting chart as PNG:', error);
			showNotification('Failed to export chart as PNG', 'error');
		}
	},

	/**
	 * Creates a combined image of all charts
	 * @param {Array} charts - Array of Chart.js instances
	 * @param {string} filename - Download filename
	 */
	async createCombinedChartsImage(charts, filename = 'combined-charts.png') {
		try {
			if (!charts || charts.length === 0) {
				throw new Error('No charts provided');
			}

			const backgroundColor = this.getExportThemeBackground();
			const combinedCanvas = document.createElement('canvas');
			const ctx = combinedCanvas.getContext('2d');
			
			// Calculate dimensions for grid layout
			const cols = Math.ceil(Math.sqrt(charts.length));
			const rows = Math.ceil(charts.length / cols);
			const chartWidth = 800;
			const chartHeight = 400;
			const padding = 20;
			
			combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
			combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;
			
			// Set background
			if (backgroundColor !== 'transparent') {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
			}

			// Draw each chart onto the combined canvas
			charts.forEach((chart, index) => {
				const col = index % cols;
				const row = Math.floor(index / cols);
				const x = col * (chartWidth + padding);
				const y = row * (chartHeight + padding);
				
				// Create temporary canvas with theme background
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = chartWidth;
				tempCanvas.height = chartHeight;
				const tempCtx = tempCanvas.getContext('2d');
				
				if (backgroundColor !== 'transparent') {
					tempCtx.fillStyle = backgroundColor;
					tempCtx.fillRect(0, 0, chartWidth, chartHeight);
				}
				
				// Draw chart on temp canvas
				tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
				
				// Draw temp canvas onto combined canvas
				ctx.drawImage(tempCanvas, x, y);
			});

			// Download the combined image
			const link = document.createElement('a');
			link.download = filename;
			link.href = combinedCanvas.toDataURL('image/png');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			showNotification('Combined charts exported', 'success');
		} catch (error) {
			console.error('Error creating combined charts image:', error);
			showNotification('Failed to create combined image', 'error');
		}
	},

	/**
	 * Copies chart image to clipboard with theme background
	 * @param {Chart} chart - Chart.js instance
	 */
	async copyChartToClipboard(chart) {
		try {
			const backgroundColor = this.getExportThemeBackground();
			
			// Create canvas with theme background
			const canvas = document.createElement('canvas');
			canvas.width = chart.canvas.width;
			canvas.height = chart.canvas.height;
			const ctx = canvas.getContext('2d');
			
			if (backgroundColor !== 'transparent') {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
			
			ctx.drawImage(chart.canvas, 0, 0);

			canvas.toBlob(async (blob) => {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ 'image/png': blob })
					]);
					showNotification('Chart copied to clipboard', 'success');
				} catch (clipboardError) {
					console.error('Clipboard API failed:', clipboardError);
					showNotification('Failed to copy chart to clipboard', 'error');
				}
			}, 'image/png');
		} catch (error) {
			console.error('Error copying chart to clipboard:', error);
			showNotification('Failed to copy chart to clipboard', 'error');
		}
	},

	/**
	 * Copies combined charts image to clipboard
	 * @param {Array} charts - Array of Chart.js instances
	 */
	async copyCombinedChartsToClipboard(charts) {
		try {
			if (!charts || charts.length === 0) {
				throw new Error('No charts provided');
			}

			const backgroundColor = this.getExportThemeBackground();
			const combinedCanvas = document.createElement('canvas');
			const ctx = combinedCanvas.getContext('2d');
			
			// Calculate dimensions for grid layout
			const cols = Math.ceil(Math.sqrt(charts.length));
			const rows = Math.ceil(charts.length / cols);
			const chartWidth = 800;
			const chartHeight = 400;
			const padding = 20;
			
			combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
			combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;
			
			// Set background
			if (backgroundColor !== 'transparent') {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
			}

			// Draw each chart
			charts.forEach((chart, index) => {
				const col = index % cols;
				const row = Math.floor(index / cols);
				const x = col * (chartWidth + padding);
				const y = row * (chartHeight + padding);
				
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = chartWidth;
				tempCanvas.height = chartHeight;
				const tempCtx = tempCanvas.getContext('2d');
				
				if (backgroundColor !== 'transparent') {
					tempCtx.fillStyle = backgroundColor;
					tempCtx.fillRect(0, 0, chartWidth, chartHeight);
				}
				
				tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
				ctx.drawImage(tempCanvas, x, y);
			});

			// Copy to clipboard
			combinedCanvas.toBlob(async (blob) => {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ 'image/png': blob })
					]);
					showNotification('Combined charts copied to clipboard', 'success');
				} catch (clipboardError) {
					console.error('Clipboard API failed:', clipboardError);
					showNotification('Failed to copy combined charts to clipboard', 'error');
				}
			}, 'image/png');
		} catch (error) {
			console.error('Error copying combined charts to clipboard:', error);
			showNotification('Failed to copy combined charts to clipboard', 'error');
		}
	},

	/**
	 * Uploads image to Imgur and returns URL
	 * @param {string} base64Image - Base64 encoded image
	 * @returns {Promise<string>} Imgur URL
	 */
	async uploadToImgur(base64Image) {
		const clientId = '0046ee9e30ac578'; // User needs to replace this
		
		if (clientId === 'YOUR_IMGUR_CLIENT_ID') {
			throw new Error('Imgur client ID not configured. Please add your Imgur client ID to the ExportUtils.uploadToImgur function.');
		}
		
		try {
			const response = await fetch('https://api.imgur.com/3/image', {
				method: 'POST',
				headers: {
					'Authorization': `Client-ID ${clientId}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					image: base64Image.split(',')[1], // Remove data:image/png;base64, prefix
					type: 'base64',
					title: 'FitFileViewer Chart',
					description: 'Chart exported from FitFileViewer'
				})
			});

			if (!response.ok) {
				throw new Error(`Imgur upload failed: ${response.status}`);
			}

			const data = await response.json();
			if (data.success) {
				return data.data.link;
			} else {
				throw new Error('Imgur upload failed');
			}
		} catch (error) {
			console.error('Error uploading to Imgur:', error);
			throw error;
		}
	},

	/**
	 * Exports chart data as CSV
	 * @param {Array} chartData - Chart data array
	 * @param {string} fieldName - Field name for the data
	 * @param {string} filename - Download filename
	 */
	async exportChartDataAsCSV(chartData, fieldName, filename = 'chart-data.csv') {
		try {
			const headers = ['timestamp', fieldName];
			const csvContent = [
				headers.join(','),
				...chartData.map(point => `${point.x},${point.y}`)
			].join('\n');
			
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			showNotification(`Data exported as ${filename}`, 'success');
		} catch (error) {
			console.error('Error exporting chart data as CSV:', error);
			showNotification('Failed to export chart data', 'error');
		}
	},

	/**
	 * Exports combined chart data as CSV
	 * @param {Array} charts - Array of Chart.js instances
	 * @param {string} filename - Download filename
	 */
	async exportCombinedChartsDataAsCSV(charts, filename = 'combined-charts-data.csv') {
		try {
			if (!charts || charts.length === 0) {
				throw new Error('No charts provided');
			}

			// Get all unique timestamps
			const allTimestamps = new Set();
			charts.forEach(chart => {
				const dataset = chart.data.datasets[0];
				if (dataset && dataset.data) {
					dataset.data.forEach(point => allTimestamps.add(point.x));
				}
			});

			const timestamps = Array.from(allTimestamps).sort();
			
			// Create headers
			const headers = ['timestamp'];
			charts.forEach(chart => {
				const dataset = chart.data.datasets[0];
				const fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
				headers.push(fieldName);
			});

			// Create data rows
			const rows = [headers.join(',')];
			timestamps.forEach(timestamp => {
				const row = [timestamp];
				charts.forEach(chart => {
					const dataset = chart.data.datasets[0];
					const point = dataset?.data?.find(p => p.x === timestamp);
					row.push(point ? point.y : '');
				});
				rows.push(row.join(','));
			});

			const csvContent = rows.join('\n');
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			showNotification(`Combined data exported as ${filename}`, 'success');
		} catch (error) {
			console.error('Error exporting combined chart data as CSV:', error);
			showNotification('Failed to export combined chart data', 'error');
		}
	},

	/**
	 * Exports chart data as JSON
	 * @param {Array} chartData - Chart data array
	 * @param {string} fieldName - Field name for the data
	 * @param {string} filename - Download filename
	 */
	async exportChartDataAsJSON(chartData, fieldName, filename = 'chart-data.json') {
		try {
			const jsonData = {
				field: fieldName,
				data: chartData,
				exportedAt: new Date().toISOString(),
				totalPoints: chartData.length
			};
			
			const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			showNotification(`Data exported as ${filename}`, 'success');
		} catch (error) {
			console.error('Error exporting chart data as JSON:', error);
			showNotification('Failed to export chart data', 'error');
		}
	},

	/**
	 * Exports all charts and data as a ZIP file
	 * @param {Array} charts - Array of Chart.js instances
	 */
	async exportAllAsZip(charts) {
		try {
			if (!charts || charts.length === 0) {
				throw new Error('No charts provided');
			}
		if (typeof JSZip === 'undefined') {
			throw new Error('JSZip library not loaded');
		}

		const zip = new JSZip(); // JSZip is loaded globally via script tag
			const backgroundColor = this.getExportThemeBackground();

			// Add individual chart images
			for (let i = 0; i < charts.length; i++) {
				const chart = charts[i];
				const dataset = chart.data.datasets[0];
				const fieldName = dataset?.label || `chart-${i}`;
				const safeFieldName = fieldName.replace(/[^a-zA-Z0-9]/g, '-');

				// Add chart image
				const canvas = document.createElement('canvas');
				canvas.width = chart.canvas.width;
				canvas.height = chart.canvas.height;
				const ctx = canvas.getContext('2d');
				
				if (backgroundColor !== 'transparent') {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				
				ctx.drawImage(chart.canvas, 0, 0);
				const imageData = canvas.toDataURL('image/png').split(',')[1];
				zip.file(`${safeFieldName}-chart.png`, imageData, { base64: true });

				// Add chart data as CSV
				if (dataset && dataset.data) {
					const headers = ['timestamp', fieldName];
					const csvContent = [
						headers.join(','),
						...dataset.data.map(point => `${point.x},${point.y}`)
					].join('\n');
					zip.file(`${safeFieldName}-data.csv`, csvContent);
				}

				// Add chart data as JSON
				if (dataset && dataset.data) {
					const jsonData = {
						field: fieldName,
						data: dataset.data,
						exportedAt: new Date().toISOString(),
						totalPoints: dataset.data.length,
						chartType: chart.config.type
					};
					zip.file(`${safeFieldName}-data.json`, JSON.stringify(jsonData, null, 2));
				}
			}

			// Add combined charts image
			if (charts.length > 1) {
				const combinedCanvas = document.createElement('canvas');
				const ctx = combinedCanvas.getContext('2d');
				
				const cols = Math.ceil(Math.sqrt(charts.length));
				const rows = Math.ceil(charts.length / cols);
				const chartWidth = 800;
				const chartHeight = 400;
				const padding = 20;
				
				combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
				combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;
				
				if (backgroundColor !== 'transparent') {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
				}

				charts.forEach((chart, index) => {
					const col = index % cols;
					const row = Math.floor(index / cols);
					const x = col * (chartWidth + padding);
					const y = row * (chartHeight + padding);
					
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = chartWidth;
					tempCanvas.height = chartHeight;
					const tempCtx = tempCanvas.getContext('2d');
					
					if (backgroundColor !== 'transparent') {
						tempCtx.fillStyle = backgroundColor;
						tempCtx.fillRect(0, 0, chartWidth, chartHeight);
					}
					
					tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
					ctx.drawImage(tempCanvas, x, y);
				});

				const combinedImageData = combinedCanvas.toDataURL('image/png').split(',')[1];
				zip.file('combined-charts.png', combinedImageData, { base64: true });
			}

			// Add combined CSV data
			await this.addCombinedCSVToZip(zip, charts);

			// Add combined JSON data
			const allChartsData = {
				exportedAt: new Date().toISOString(),
				totalCharts: charts.length,
				charts: charts.map((chart, index) => {
					const dataset = chart.data.datasets[0];
					return {
						field: dataset?.label || `chart-${index}`,
						data: dataset?.data || [],
						type: chart.config.type,
						totalPoints: dataset?.data ? dataset.data.length : 0
					};
				})
			};
			zip.file('combined-data.json', JSON.stringify(allChartsData, null, 2));

			// Generate and download ZIP
			const content = await zip.generateAsync({ type: 'blob' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(content);
			link.download = `fitfile-charts-${new Date().toISOString().split('T')[0]}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			showNotification(`ZIP file with ${charts.length} charts exported`, 'success');
		} catch (error) {
			console.error('Error creating ZIP export:', error);
			showNotification('Failed to create ZIP export', 'error');
		}
	},

	/**
	 * Helper method to add combined CSV data to ZIP
	 * @param {JSZip} zip - JSZip instance
	 * @param {Array} charts - Array of Chart.js instances
	 */
	async addCombinedCSVToZip(zip, charts) {
		try {
			const allTimestamps = new Set();
			charts.forEach(chart => {
				const dataset = chart.data.datasets[0];
				if (dataset && dataset.data) {
					dataset.data.forEach(point => allTimestamps.add(point.x));
				}
			});

			const timestamps = Array.from(allTimestamps).sort();
			
			const headers = ['timestamp'];
			charts.forEach(chart => {
				const dataset = chart.data.datasets[0];
				const fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
				headers.push(fieldName);
			});

			const rows = [headers.join(',')];
			timestamps.forEach(timestamp => {
				const row = [timestamp];
				charts.forEach(chart => {
					const dataset = chart.data.datasets[0];
					const point = dataset?.data?.find(p => p.x === timestamp);
					row.push(point ? point.y : '');
				});
				rows.push(row.join(','));
			});

			const csvContent = rows.join('\n');
			zip.file('combined-data.csv', csvContent);
		} catch (error) {
			console.error('Error adding combined CSV to ZIP:', error);
		}
	},

	/**
	 * Prints the chart with theme background
	 * @param {Chart} chart - Chart.js instance
	 */
	async printChart(chart) {
		try {
			const backgroundColor = this.getExportThemeBackground();
			const printWindow = window.open('', '_blank');
			
			// Create canvas with theme background
			const canvas = document.createElement('canvas');
			canvas.width = chart.canvas.width;
			canvas.height = chart.canvas.height;
			const ctx = canvas.getContext('2d');
			
			if (backgroundColor !== 'transparent') {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
			
			ctx.drawImage(chart.canvas, 0, 0);
			const imgData = canvas.toDataURL('image/png', 1.0);
			
			printWindow.document.write(`
				<html>
					<head>
						<title>Chart Print</title>
						<style>
							body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
							img { max-width: 100%; max-height: 100%; }
						</style>
					</head>
					<body>
						<img src="${imgData}" alt="Chart" />
					</body>
				</html>
			`);
			
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 250);
			
			showNotification('Chart sent to printer', 'success');
		} catch (error) {
			console.error('Error printing chart:', error);
			showNotification('Failed to print chart', 'error');
		}
	},

	/**
	 * Prints multiple charts in a combined format
	 * @param {Array} charts - Array of Chart.js instances
	 */
	printCombinedCharts(charts) {
		try {
			if (!charts || charts.length === 0) {
				showNotification('No charts available to print', 'warning');
				return;
			}

			const backgroundColor = this.getExportThemeBackground();
			const printWindow = window.open('', '_blank');
			let htmlContent = `
				<html>
					<head>
						<title>Charts Print</title>
						<style>
							body { 
								margin: 20px; 
								font-family: Arial, sans-serif; 
								background: ${backgroundColor === 'transparent' ? '#ffffff' : backgroundColor};
								color: ${backgroundColor === '#1a1a1a' ? '#ffffff' : '#000000'};
							}
							.chart { 
								page-break-inside: avoid; 
								margin-bottom: 30px; 
								text-align: center; 
							}
							.chart img { 
								max-width: 100%; 
								height: auto; 
							}
							.chart h3 { 
								margin: 0 0 10px 0; 
								color: ${backgroundColor === '#1a1a1a' ? '#ffffff' : '#333'};
							}
							@media print { 
								.chart { page-break-after: always; } 
								.chart:last-child { page-break-after: avoid; }
							}
						</style>
					</head>
					<body>
						<h1>FIT File Charts</h1>
			`;

			charts.forEach((chart, index) => {
				const dataset = chart.data.datasets[0];
				const fieldName = dataset?.label || `Chart ${index + 1}`;
				
				// Create canvas with theme background
				const canvas = document.createElement('canvas');
				canvas.width = chart.canvas.width;
				canvas.height = chart.canvas.height;
				const ctx = canvas.getContext('2d');
				
				if (backgroundColor !== 'transparent') {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				
				ctx.drawImage(chart.canvas, 0, 0);
				const imgData = canvas.toDataURL('image/png', 1.0);
				
				htmlContent += `
					<div class="chart">
						<h3>${fieldName}</h3>
						<img src="${imgData}" alt="${fieldName} Chart" />
					</div>
				`;
			});

			htmlContent += '</body></html>';
			
			printWindow.document.write(htmlContent);
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 500);
			
			showNotification('Charts sent to printer', 'success');
		} catch (error) {
			console.error('Error printing combined charts:', error);
			showNotification('Failed to print charts', 'error');
		}
	},

	/**
	 * Shares charts as URL with image upload to Imgur
	 */
	async shareChartsAsURL() {
		try {
			const charts = window._chartjsInstances;
			if (!charts || charts.length === 0) {
				showNotification('No charts available to share', 'warning');
				return;
			}

			showNotification('Uploading charts to Imgur...', 'info');

			if (charts.length === 1) {
				// Single chart
				const chart = charts[0];
				const backgroundColor = this.getExportThemeBackground();
				
				const canvas = document.createElement('canvas');
				canvas.width = chart.canvas.width;
				canvas.height = chart.canvas.height;
				const ctx = canvas.getContext('2d');
				
				if (backgroundColor !== 'transparent') {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				
				ctx.drawImage(chart.canvas, 0, 0);
				const base64Image = canvas.toDataURL('image/png', 1.0);
				
				const imgurUrl = await this.uploadToImgur(base64Image);
				
				// Copy URL to clipboard
				await navigator.clipboard.writeText(imgurUrl);
				showNotification('Chart uploaded! URL copied to clipboard', 'success');
			} else {
				// Combined charts
				const backgroundColor = this.getExportThemeBackground();
				const combinedCanvas = document.createElement('canvas');
				const ctx = combinedCanvas.getContext('2d');
				
				const cols = Math.ceil(Math.sqrt(charts.length));
				const rows = Math.ceil(charts.length / cols);
				const chartWidth = 800;
				const chartHeight = 400;
				const padding = 20;
				
				combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
				combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;
				
				if (backgroundColor !== 'transparent') {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
				}

				charts.forEach((chart, index) => {
					const col = index % cols;
					const row = Math.floor(index / cols);
					const x = col * (chartWidth + padding);
					const y = row * (chartHeight + padding);
					
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = chartWidth;
					tempCanvas.height = chartHeight;
					const tempCtx = tempCanvas.getContext('2d');
					
					if (backgroundColor !== 'transparent') {
						tempCtx.fillStyle = backgroundColor;
						tempCtx.fillRect(0, 0, chartWidth, chartHeight);
					}
					
					tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
					ctx.drawImage(tempCanvas, x, y);
				});

				const base64Image = combinedCanvas.toDataURL('image/png', 1.0);
				const imgurUrl = await this.uploadToImgur(base64Image);
				
				// Copy URL to clipboard
				await navigator.clipboard.writeText(imgurUrl);
				showNotification('Combined charts uploaded! URL copied to clipboard', 'success');
			}
		} catch (error) {
			console.error('Error sharing charts as URL:', error);
			if (error.message.includes('Imgur client ID not configured')) {
				showNotification('Imgur client ID not configured. Please update the ExportUtils.uploadToImgur function with your Imgur client ID.', 'error');
			} else {
				showNotification('Failed to share charts. Please try again.', 'error');
			}
		}
	},
};

/**
 * Creates an enhanced settings and control panel for charts
 * @param {HTMLElement|string} targetContainer - Container element or ID
 * @returns {Object} Current settings object
 */
/**
 * State management for the chart controls panel
 */
const chartControlsState = {
	isVisible: false,
	isInitialized: false,
	wrapper: null
};

/**
 * Toggles the visibility of the chart controls panel
 */
function toggleChartControls() {
	const wrapper = document.getElementById('chartjs-settings-wrapper');
	if (!wrapper) {
		console.warn('[ChartJS] Controls panel not found, creating it...');
		ensureChartSettingsDropdowns();
		return;
	}
	
	// First sync to ensure we're starting from the correct state
	syncControlsState();
	
	// Then toggle the state
	chartControlsState.isVisible = !chartControlsState.isVisible;
	wrapper.style.display = chartControlsState.isVisible ? 'block' : 'none';
	
	// Update toggle button text if it exists
	const toggleBtn = document.getElementById('chart-controls-toggle');
	if (toggleBtn) {
		toggleBtn.textContent = chartControlsState.isVisible ? '▼ Hide Controls' : '▶ Show Controls';
		toggleBtn.setAttribute('aria-expanded', chartControlsState.isVisible.toString());
	}
	
	console.log(`[ChartJS] Controls panel ${chartControlsState.isVisible ? 'shown' : 'hidden'}`);
}

/**
 * Creates a toggle button for the chart controls panel
 */
function createControlsToggleButton(container) {
	let toggleBtn = document.getElementById('chart-controls-toggle');
	if (toggleBtn) {
		return toggleBtn; // Already exists
	}
	
	toggleBtn = document.createElement('button');
	toggleBtn.id = 'chart-controls-toggle';
	toggleBtn.className = 'chart-controls-toggle-btn';
	toggleBtn.textContent = '▶ Show Controls';
	toggleBtn.setAttribute('aria-expanded', 'false');
	toggleBtn.setAttribute('aria-controls', 'chartjs-settings-wrapper');
	toggleBtn.style.cssText = `
		background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 20px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		margin-bottom: 16px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		position: relative;
		z-index: 10;
	`;
	
	// Add hover and focus effects
	toggleBtn.addEventListener('mouseenter', () => {
		toggleBtn.style.transform = 'translateY(-2px)';
		toggleBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
	});
	
	toggleBtn.addEventListener('mouseleave', () => {
		toggleBtn.style.transform = 'translateY(0)';
		toggleBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
	});
	
	toggleBtn.addEventListener('click', toggleChartControls);
	
	// Insert before the chart container
	const chartContainer = document.getElementById('chartjs-chart-container');
	if (chartContainer && chartContainer.parentNode) {
		chartContainer.parentNode.insertBefore(toggleBtn, chartContainer);
	} else {
		container.appendChild(toggleBtn);
	}
	
	return toggleBtn;
}

/**
 * Ensures chart settings dropdowns exist and applies styling
 * @param {Element|string} targetContainer - Container element or ID
 * @returns {Object} Current settings object
 */
function ensureChartSettingsDropdowns(targetContainer) {
	let chartContainer = targetContainer
		? typeof targetContainer === 'string'
			? document.getElementById(targetContainer)
			: targetContainer
		: document.getElementById('chartjs-chart-container');
	
	if (!chartContainer) {
		return getDefaultSettings();
	}

	// Create toggle button if it doesn't exist
	createControlsToggleButton(chartContainer.parentNode || document.body);

	// Create main settings wrapper only if it doesn't exist
	let wrapper = document.getElementById('chartjs-settings-wrapper');
	if (!wrapper) {
		wrapper = document.createElement('div');
		wrapper.id = 'chartjs-settings-wrapper';
		wrapper.className = 'chart-settings-panel';
		wrapper.style.display = 'none'; // Hidden by default
		applySettingsPanelStyles(wrapper);
		
		const toggleBtn = document.getElementById('chart-controls-toggle');
		if (toggleBtn && toggleBtn.parentNode) {
			toggleBtn.parentNode.insertBefore(wrapper, toggleBtn.nextSibling);
		} else {
			chartContainer.parentNode.insertBefore(wrapper, chartContainer);
		}
		
		// Initialize settings sections only once
		createSettingsHeader(wrapper);
		createControlsSection(wrapper);
		createExportSection(wrapper);
		createFieldTogglesSection(wrapper);
				chartControlsState.isInitialized = true;
		chartControlsState.wrapper = wrapper;
		console.log('[ChartJS] Controls panel created and hidden by default');
	}

	// Ensure state synchronization - sync internal state with actual DOM state
	syncControlsState();

	return getCurrentSettings();
}

/**
 * Applies modern styling to the settings panel
 */
function applySettingsPanelStyles(wrapper) {
	wrapper.style.cssText = `
		background: linear-gradient(145deg, #1a1f2e 0%, #252b3f 100%);
		border-radius: 16px;
		padding: 20px;
		margin: 16px 0;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
	`;
	
	// Add subtle animated background effect
	const bgEffect = document.createElement('div');
	bgEffect.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
					radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%);
		pointer-events: none;
		z-index: 0;
	`;
	wrapper.appendChild(bgEffect);
}

/**
 * Creates the settings header with title and global actions
 */
function createSettingsHeader(wrapper) {
	// Check if header already exists
	if (wrapper.querySelector('.settings-header')) {
		return;
	}
	
	const header = document.createElement('div');
	header.className = 'settings-header';
	header.style.cssText = `
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
	`;

	const title = document.createElement('h3');
	title.textContent = 'Chart Controls';
	title.style.cssText = `
		margin: 0;
		color: #ffffff;
		font-size: 20px;
		font-weight: 600;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	`;

	const globalActions = document.createElement('div');
	globalActions.className = 'global-actions';
	globalActions.style.cssText = `
		display: flex;
		gap: 8px;
	`;

	// Reset to defaults button
	const resetBtn = createActionButton('↻ Reset', 'Reset all settings to defaults', () => {
		resetAllSettings();
		renderChartJS(wrapper.nextElementSibling);
		showNotification('Settings reset to defaults', 'success');
	});
	
	// Export all charts button
	const exportAllBtn = createActionButton('📦 Export All', 'Export all charts as images', () => {
		exportAllCharts();
	});

	globalActions.appendChild(resetBtn);
	globalActions.appendChild(exportAllBtn);
	header.appendChild(title);
	header.appendChild(globalActions);
	wrapper.appendChild(header);
}

/**
 * Creates the main controls section with dropdowns and sliders
 */
function createControlsSection(wrapper) {
	// Check if controls section already exists
	if (wrapper.querySelector('.controls-section')) {
		return;
	}
	
	const controlsSection = document.createElement('div');
	controlsSection.className = 'controls-section';
	controlsSection.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
	`;

	chartOptionsConfig.forEach((opt) => {
		const controlGroup = createControlGroup(opt);
		controlsSection.appendChild(controlGroup);
	});

	wrapper.appendChild(controlsSection);
}

/**
 * Creates individual control groups for each setting
 */
function createControlGroup(option) {
	const group = document.createElement('div');
	group.className = 'control-group';
	group.style.cssText = `
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	`;

	// Add hover effect
	group.addEventListener('mouseenter', () => {
		group.style.background = 'rgba(255, 255, 255, 0.08)';
		group.style.transform = 'translateY(-2px)';
		group.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
	});
	
	group.addEventListener('mouseleave', () => {
		group.style.background = 'rgba(255, 255, 255, 0.05)';
		group.style.transform = 'translateY(0)';
		group.style.boxShadow = 'none';
	});

	const label = document.createElement('label');
	label.textContent = option.label;
	label.style.cssText = `
		display: block;
		color: #ffffff;
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 14px;
	`;

	if (option.description) {
		const description = document.createElement('div');
		description.textContent = option.description;
		description.style.cssText = `
			color: rgba(255, 255, 255, 0.7);
			font-size: 12px;
			margin-bottom: 12px;
			line-height: 1.4;
		`;
		group.appendChild(description);
	}

	let control;
	if (option.type === 'range') {
		control = createRangeControl(option);
	} else if (option.type === 'toggle') {
		control = createToggleControl(option);
	} else {
		control = createSelectControl(option);
	}

	group.appendChild(label);
	group.appendChild(control);
	return group;
}

/**
 * Creates a range slider control
 */
function createRangeControl(option) {
	const container = document.createElement('div');
	container.style.cssText = `
		position: relative;
	`;

	const slider = document.createElement('input');
	slider.type = 'range';
	slider.id = `chartjs-${option.id}-slider`;
	slider.min = option.min;
	slider.max = option.max;
	slider.step = option.step;
	slider.value = localStorage.getItem(`chartjs_${option.id}`) || option.default;

	slider.style.cssText = `
		width: 100%;
		height: 6px;
		background: linear-gradient(to right, #3b82f6 0%, #3b82f6 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 100%);
		border-radius: 3px;
		outline: none;
		-webkit-appearance: none;
		cursor: pointer;
	`;

	// Style the thumb
	const style = document.createElement('style');
	style.textContent = `
		#${slider.id}::-webkit-slider-thumb {
			-webkit-appearance: none;
			width: 18px;
			height: 18px;
			background: linear-gradient(145deg, #60a5fa, #3b82f6);
			border-radius: 50%;
			cursor: pointer;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
			border: 2px solid #ffffff;
		}
		#${slider.id}::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: linear-gradient(145deg, #60a5fa, #3b82f6);
			border-radius: 50%;
			cursor: pointer;
			border: 2px solid #ffffff;
		}
	`;
	document.head.appendChild(style);

	const valueDisplay = document.createElement('span');
	valueDisplay.textContent = slider.value;
	valueDisplay.style.cssText = `
		position: absolute;
		right: 0;
		top: -24px;
		background: rgba(59, 130, 246, 0.9);
		color: white;
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	`;

	slider.addEventListener('input', (e) => {
		valueDisplay.textContent = e.target.value;
		localStorage.setItem(`chartjs_${option.id}`, e.target.value);
		
		// Update slider background
		const percentage = ((e.target.value - option.min) / (option.max - option.min)) * 100;
		slider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%, rgba(255, 255, 255, 0.2) 100%)`;
		
		// Debounced re-render
		clearTimeout(slider.timeout);
		slider.timeout = setTimeout(() => {
			renderChartJS();
		}, 300);
	});

	// Initialize slider background
	const initialPercentage = ((slider.value - option.min) / (option.max - option.min)) * 100;
	slider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${initialPercentage}%, rgba(255, 255, 255, 0.2) ${initialPercentage}%, rgba(255, 255, 255, 0.2) 100%)`;

	container.appendChild(valueDisplay);
	container.appendChild(slider);
	return container;
}

/**
 * Creates a toggle switch control
 */
function createToggleControl(option) {
	const container = document.createElement('div');
	container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 8px;
	`;

	const toggle = document.createElement('div');
	toggle.className = 'toggle-switch';
	toggle.style.cssText = `
		width: 48px;
		height: 24px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
	`;

	const toggleThumb = document.createElement('div');
	toggleThumb.className = 'toggle-thumb';
	toggleThumb.style.cssText = `
		width: 20px;
		height: 20px;
		background: #ffffff;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	`;

	const currentValue = localStorage.getItem(`chartjs_${option.id}`) || option.default;
	const isOn = currentValue === 'on';
	
	if (isOn) {
		toggle.style.background = 'linear-gradient(145deg, #10b981, #059669)';
		toggleThumb.style.left = '26px';
	}

	const statusText = document.createElement('span');
	statusText.textContent = isOn ? 'On' : 'Off';
	statusText.style.cssText = `
		color: ${isOn ? '#10b981' : 'rgba(255, 255, 255, 0.7)'};
		font-weight: 600;
		font-size: 14px;
		min-width: 24px;
	`;

	toggle.appendChild(toggleThumb);
	
	toggle.addEventListener('click', () => {
		const currentValue = localStorage.getItem(`chartjs_${option.id}`) || option.default;
		const newValue = currentValue === 'on' ? 'off' : 'on';
		const isOn = newValue === 'on';
		
		localStorage.setItem(`chartjs_${option.id}`, newValue);
		
		if (isOn) {
			toggle.style.background = 'linear-gradient(145deg, #10b981, #059669)';
			toggleThumb.style.left = '26px';
			statusText.textContent = 'On';
			statusText.style.color = '#10b981';
		} else {
			toggle.style.background = 'rgba(255, 255, 255, 0.2)';
			toggleThumb.style.left = '2px';
			statusText.textContent = 'Off';
			statusText.style.color = 'rgba(255, 255, 255, 0.7)';
		}
		
		renderChartJS();
	});

	container.appendChild(toggle);
	container.appendChild(statusText);
	return container;
}

/**
 * Creates a select dropdown control
 */
function createSelectControl(option) {
	const select = document.createElement('select');
	select.id = `chartjs-${option.id}-dropdown`;
	select.style.cssText = `
		width: 100%;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.3s ease;
		outline: none;
	`;

	select.addEventListener('focus', () => {
		select.style.borderColor = '#3b82f6';
		select.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
	});

	select.addEventListener('blur', () => {
		select.style.borderColor = 'rgba(255, 255, 255, 0.2)';
		select.style.boxShadow = 'none';
	});

	option.options.forEach((val) => {
		const optionEl = document.createElement('option');
		optionEl.value = val;
		optionEl.textContent = val === 'all' ? 'All Points' : 
							  val === 'on' ? 'Enabled' : 
							  val === 'off' ? 'Disabled' : 
							  String(val).charAt(0).toUpperCase() + String(val).slice(1);
		optionEl.style.background = '#1a1f2e';
		optionEl.style.color = '#ffffff';
		select.appendChild(optionEl);
	});

	const stored = localStorage.getItem(`chartjs_${option.id}`);
	select.value = stored !== null ? stored : option.default;

	// Mouse wheel support for maxpoints
	if (option.id === 'maxpoints') {
		select.addEventListener('wheel', (e) => {
			e.preventDefault();
			const idx = option.options.indexOf(select.value === 'all' ? 'all' : Number(select.value));
			let newIdx = idx + (e.deltaY > 0 ? 1 : -1);
			if (newIdx < 0) newIdx = 0;
			if (newIdx >= option.options.length) newIdx = option.options.length - 1;
			select.value = option.options[newIdx];
			select.dispatchEvent(new Event('change'));
		}, { passive: false });
	}

	select.addEventListener('change', (e) => {
		localStorage.setItem(`chartjs_${option.id}`, e.target.value);
		renderChartJS();
	});

	return select;
}

/**
 * Shows a modal to select which chart(s) to use for an action
 * @param {string} actionType - Type of action (copy, save, print, etc.)
 * @param {Function} singleCallback - Callback for single chart selection
 * @param {Function} combinedCallback - Callback for combined charts action
 */
function showChartSelectionModal(actionType, singleCallback, combinedCallback) {
	const charts = window._chartjsInstances;
	if (!charts || charts.length === 0) {
		showNotification('No charts available', 'warning');
		return;
	}

	if (charts.length === 1) {
		// Only one chart, execute single callback directly
		singleCallback(charts[0]);
		return;
	}

	// Create modal overlay
	const overlay = document.createElement('div');
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10000;
	`;

	// Create modal content
	const modal = document.createElement('div');
	modal.style.cssText = `
		background: #2a2a2a;
		border-radius: 12px;
		padding: 24px;
		max-width: 500px;
		width: 90%;
		max-height: 70vh;
		overflow-y: auto;
		border: 1px solid #444;
	`;

	// Modal title
	const title = document.createElement('h3');
	title.textContent = `Select Chart to ${actionType}`;
	title.style.cssText = `
		margin: 0 0 16px 0;
		color: #ffffff;
		text-align: center;
	`;

	// Chart selection list
	const chartList = document.createElement('div');
	chartList.style.cssText = `
		margin-bottom: 20px;
	`;

	charts.forEach((chart, index) => {
		const dataset = chart.data.datasets[0];
		const fieldName = dataset?.label || `Chart ${index + 1}`;
		
		const chartItem = document.createElement('button');
		chartItem.textContent = `📊 ${fieldName}`;
		chartItem.style.cssText = `
			display: block;
			width: 100%;
			padding: 12px;
			margin-bottom: 8px;
			background: rgba(59, 130, 246, 0.1);
			border: 1px solid rgba(59, 130, 246, 0.3);
			border-radius: 8px;
			color: #ffffff;
			cursor: pointer;
			font-size: 14px;
			text-align: left;
			transition: all 0.3s ease;
		`;

		chartItem.addEventListener('mouseenter', () => {
			chartItem.style.background = 'rgba(59, 130, 246, 0.2)';
		});

		chartItem.addEventListener('mouseleave', () => {
			chartItem.style.background = 'rgba(59, 130, 246, 0.1)';
		});

		chartItem.addEventListener('click', () => {
			document.body.removeChild(overlay);
			singleCallback(chart);
		});

		chartList.appendChild(chartItem);
	});

	// Combined option
	const combinedItem = document.createElement('button');
	combinedItem.textContent = `🔗 All Charts Combined (${charts.length} charts)`;
	combinedItem.style.cssText = `
		display: block;
		width: 100%;
		padding: 12px;
		margin-bottom: 16px;
		background: rgba(168, 85, 247, 0.1);
		border: 1px solid rgba(168, 85, 247, 0.3);
		border-radius: 8px;
		color: #ffffff;
		cursor: pointer;
		font-size: 14px;
		text-align: left;
		transition: all 0.3s ease;
	`;

	combinedItem.addEventListener('mouseenter', () => {
		combinedItem.style.background = 'rgba(168, 85, 247, 0.2)';
	});

	combinedItem.addEventListener('mouseleave', () => {
		combinedItem.style.background = 'rgba(168, 85, 247, 0.1)';
	});

	combinedItem.addEventListener('click', () => {
		document.body.removeChild(overlay);
		combinedCallback(charts);
	});

	// Cancel button
	const cancelButton = document.createElement('button');
	cancelButton.textContent = 'Cancel';
	cancelButton.style.cssText = `
		width: 100%;
		padding: 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #ffffff;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.3s ease;
	`;

	cancelButton.addEventListener('click', () => {
		document.body.removeChild(overlay);
	});

	// ESC key handler
	const handleEscape = (e) => {
		if (e.key === 'Escape') {
			document.body.removeChild(overlay);
			document.removeEventListener('keydown', handleEscape);
		}
	};
	document.addEventListener('keydown', handleEscape);

	// Click outside to close
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			document.body.removeChild(overlay);
		}
	});

	// Assemble modal
	modal.appendChild(title);
	modal.appendChild(chartList);
	modal.appendChild(combinedItem);
	modal.appendChild(cancelButton);
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
}

/**
 * Creates the export section with various export options
 */
function createExportSection(wrapper) {
	// Check if export section already exists
	if (wrapper.querySelector('.export-section')) {
		return;
	}
	
	const exportSection = document.createElement('div');
	exportSection.className = 'export-section';
	exportSection.style.cssText = `
		background: rgba(59, 130, 246, 0.1);
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
		border: 1px solid rgba(59, 130, 246, 0.2);
		position: relative;
		z-index: 1;
	`;

	const exportTitle = document.createElement('h4');
	exportTitle.textContent = 'Export & Share';
	exportTitle.style.cssText = `
		margin: 0 0 12px 0;
		color: #60a5fa;
		font-size: 16px;
		font-weight: 600;
	`;

	const exportGrid = document.createElement('div');
	exportGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
	`;

	const exportButtons = [
		{ 
			icon: '📷', 
			text: 'Save PNG', 
			action: () => showChartSelectionModal(
				'Save as PNG',
				(chart) => {
					const dataset = chart.data.datasets[0];
					const fieldName = dataset?.label || 'chart';
					const filename = `${fieldName.replace(/\s+/g, '-').toLowerCase()}-chart.png`;
					ExportUtils.downloadChartAsPNG(chart, filename);
				},
				(charts) => ExportUtils.createCombinedChartsImage(charts, 'combined-charts.png')
			)
		},
		{ 
			icon: '📋', 
			text: 'Copy Image', 
			action: () => showChartSelectionModal(
				'Copy to Clipboard',
				(chart) => ExportUtils.copyChartToClipboard(chart),
				(charts) => ExportUtils.copyCombinedChartsToClipboard(charts)
			)
		},
		{ 
			icon: '📊', 
			text: 'Export CSV', 
			action: () => showChartSelectionModal(
				'Export as CSV',
				(chart) => {
					const dataset = chart.data.datasets[0];
					if (dataset && dataset.data) {
						const fieldName = dataset.label || 'chart';
						const filename = `${fieldName.replace(/\s+/g, '-').toLowerCase()}-data.csv`;
						ExportUtils.exportChartDataAsCSV(dataset.data, fieldName, filename);
					}
				},
				(charts) => ExportUtils.exportCombinedChartsDataAsCSV(charts, 'combined-charts-data.csv')
			)
		},
		{ 
			icon: '📄', 
			text: 'Export JSON', 
			action: () => showChartSelectionModal(
				'Export as JSON',
				(chart) => {
					const dataset = chart.data.datasets[0];
					if (dataset && dataset.data) {
						const fieldName = dataset.label || 'chart';
						const filename = `${fieldName.replace(/\s+/g, '-').toLowerCase()}-data.json`;
						ExportUtils.exportChartDataAsJSON(dataset.data, fieldName, filename);
					}
				},
				(charts) => {
					const allChartsData = {
						exportedAt: new Date().toISOString(),
						charts: charts.map((chart, index) => {
							const dataset = chart.data.datasets[0];
							return {
								field: dataset?.label || `chart-${index}`,
								data: dataset?.data || [],
								type: chart.config.type,
								totalPoints: dataset?.data ? dataset.data.length : 0
							};
						})
					};
					const blob = new Blob([JSON.stringify(allChartsData, null, 2)], { 
						type: 'application/json;charset=utf-8;' 
					});
					const link = document.createElement('a');
					link.href = URL.createObjectURL(blob);
					link.download = 'combined-charts-data.json';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					showNotification('Combined chart data exported as JSON', 'success');
				}
			)
		},		{ 
			icon: '🖨️', 
			text: 'Print', 
			action: () => showChartSelectionModal(
				'Print',
				(chart) => ExportUtils.printChart(chart),
				(charts) => ExportUtils.printCombinedCharts(charts)
			)
		},
		{ 
			icon: '�', 
			text: 'Export ZIP', 
			action: () => {
				const charts = window._chartjsInstances;
				if (!charts || charts.length === 0) {
					showNotification('No charts available to export', 'warning');
					return;
				}
				ExportUtils.exportAllAsZip(charts);
			}
		},		{ 
			icon: '🔗', 
			text: 'Share URL', 
			action: () => ExportUtils.shareChartsAsURL()
		},
	];

	exportButtons.forEach(btn => {
		const button = createActionButton(`${btn.icon} ${btn.text}`, `${btn.text} for charts`, btn.action, 'export-btn');
		exportGrid.appendChild(button);
	});

	exportSection.appendChild(exportTitle);
	exportSection.appendChild(exportGrid);
	wrapper.appendChild(exportSection);
}

/**
 * Creates the field toggles section for showing/hiding specific metrics
 */
function createFieldTogglesSection(wrapper) {
	// Check if fields section already exists
	if (wrapper.querySelector('.fields-section')) {
		return;
	}
	
	const fieldsSection = document.createElement('div');
	fieldsSection.className = 'fields-section';
	fieldsSection.style.cssText = `
		background: rgba(168, 85, 247, 0.1);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid rgba(168, 85, 247, 0.2);
		position: relative;
		z-index: 1;
	`;

	const fieldsTitle = document.createElement('h4');
	fieldsTitle.textContent = 'Visible Metrics';
	fieldsTitle.style.cssText = `
		margin: 0 0 12px 0;
		color: #c084fc;
		font-size: 16px;
		font-weight: 600;
	`;

	const fieldsGrid = document.createElement('div');
	fieldsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	`;

	// Add field toggles
	chartFields.forEach(field => {
		const fieldToggle = createFieldToggle(field);
		fieldsGrid.appendChild(fieldToggle);
	});

	fieldsSection.appendChild(fieldsTitle);
	fieldsSection.appendChild(fieldsGrid);
	wrapper.appendChild(fieldsSection);
}

/**
 * Creates individual field toggle controls
 */
function createFieldToggle(field) {
	const container = document.createElement('div');
	container.className = 'field-toggle';
	container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	`;

	// Toggle switch
	const toggle = document.createElement('input');
	toggle.type = 'checkbox';
	toggle.id = `field-toggle-${field}`;
	toggle.checked = localStorage.getItem(`chartjs_field_${field}`) !== 'hidden';
	toggle.style.cssText = `
		width: 18px;
		height: 18px;
		cursor: pointer;
	`;

	// Field label
	const label = document.createElement('label');
	label.textContent = fieldLabels[field] || field;
	label.htmlFor = `field-toggle-${field}`;
	label.style.cssText = `
		flex: 1;
		color: #ffffff;
		font-size: 14px;
		cursor: pointer;
	`;

	// Color picker
	const colorPicker = document.createElement('input');
	colorPicker.type = 'color';
	colorPicker.value = localStorage.getItem(`chartjs_color_${field}`) || fieldColors[field] || '#1976d2';
	colorPicker.style.cssText = `
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		background: none;
	`;

	// Event listeners
	toggle.addEventListener('change', () => {
		const visibility = toggle.checked ? 'visible' : 'hidden';
		localStorage.setItem(`chartjs_field_${field}`, visibility);
		renderChartJS();
	});

	colorPicker.addEventListener('change', () => {
		localStorage.setItem(`chartjs_color_${field}`, colorPicker.value);
		renderChartJS();
	});

	// Hover effects
	container.addEventListener('mouseenter', () => {
		container.style.background = 'rgba(255, 255, 255, 0.08)';
		container.style.transform = 'translateY(-1px)';
	});

	container.addEventListener('mouseleave', () => {
		container.style.background = 'rgba(255, 255, 255, 0.05)';
		container.style.transform = 'translateY(0)';
	});

	container.appendChild(toggle);
	container.appendChild(label);
	container.appendChild(colorPicker);
	return container;
}

/**
 * Creates styled action buttons
 */
function createActionButton(text, title, onClick, className = '') {
	const button = document.createElement('button');
	button.textContent = text;
	button.title = title;
	button.className = className;
	button.style.cssText = `
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
		color: #ffffff;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
		white-space: nowrap;
	`;

	button.addEventListener('mouseenter', () => {
		button.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))';
		button.style.transform = 'translateY(-1px)';
		button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
	});

	button.addEventListener('mouseleave', () => {
		button.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
		button.style.transform = 'translateY(0)';
		button.style.boxShadow = 'none';
	});

	button.addEventListener('click', onClick);
	return button;
}

/**
 * Gets default settings object
 */
function getDefaultSettings() {
	const settings = {};
	chartOptionsConfig.forEach((opt) => {
		settings[opt.id] = opt.default;
	});
	settings.colors = { ...fieldColors };
	return settings;
}

/**
 * Gets current settings from localStorage and DOM
 */
function getCurrentSettings() {
	const settings = {};
	chartOptionsConfig.forEach((opt) => {
		const stored = localStorage.getItem(`chartjs_${opt.id}`);
		if (opt.type === 'range') {
			settings[opt.id] = stored !== null ? parseFloat(stored) : opt.default;
		} else if (opt.id === 'maxpoints') {
			settings[opt.id] = stored !== null ? (stored === 'all' ? 'all' : parseInt(stored, 10)) : opt.default;
		} else {
			settings[opt.id] = stored !== null ? stored : opt.default;
		}
	});
	
	// Get color settings
	settings.colors = {};
	chartFields.forEach((field) => {
		const stored = localStorage.getItem(`chartjs_color_${field}`);
		settings.colors[field] = stored || fieldColors[field] || '#1976d2';
	});
	
	return settings;
}

/**
 * Resets all settings to defaults
 */
function resetAllSettings() {
	chartOptionsConfig.forEach((opt) => {
		localStorage.removeItem(`chartjs_${opt.id}`);
	});
	chartFields.forEach((field) => {
		localStorage.removeItem(`chartjs_color_${field}`);
		localStorage.removeItem(`chartjs_field_${field}`);
	});
}

// Global export functions for the settings panel
function exportAllCharts() {
	if (!window._chartjsInstances || window._chartjsInstances.length === 0) {
		showNotification('No charts available to export', 'warning');
		return;
	}

	try {
		window._chartjsInstances.forEach((chart, index) => {
			const field = chart.data.datasets[0]?.label || `chart-${index}`;
			const filename = `${field.replace(/\s+/g, '-').toLowerCase()}-chart.png`;
			ExportUtils.downloadChartAsPNG(chart, filename);
		});
		showNotification(`Exported ${window._chartjsInstances.length} charts`, 'success');
	} catch (error) {		console.error('Error exporting all charts:', error);
		showNotification('Failed to export charts', 'error');
	}
}

// Function to load shared configuration from URL
function loadSharedConfiguration() {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const configParam = urlParams.get('chartConfig');
		
		if (configParam) {
			const settings = JSON.parse(atob(configParam));
			
			// Apply settings to localStorage
			Object.keys(settings).forEach(key => {
				if (key === 'visibleFields') {
					Object.keys(settings.visibleFields).forEach(field => {
						localStorage.setItem(`chartjs_field_${field}`, settings.visibleFields[field]);
					});
				} else if (typeof settings[key] === 'boolean') {
					localStorage.setItem(`chartjs_${key}`, settings[key].toString());
				} else {
					localStorage.setItem(`chartjs_${key}`, settings[key]);
				}
			});
			
			showNotification('Chart configuration loaded from URL', 'success');
			
			// Refresh the charts with new settings
			setTimeout(() => {
				renderChartJS();
			}, 100);
		}
	} catch (error) {
		console.error('Error loading shared configuration:', error);
		showNotification('Failed to load shared configuration', 'warning');
	}
}

// Load shared configuration on page load
if (typeof window !== 'undefined') {
	window.addEventListener('DOMContentLoaded', loadSharedConfiguration);
}

// Enhanced zoom reset plugin
const zoomResetPlugin = {
	id: 'zoomResetPlugin',
	afterDraw(chart) {
		if (!chart.isZoomedOrPanned || !chart.isZoomedOrPanned()) return;
		const ctx = chart.ctx;
		const canvas = chart.canvas;
		const btnW = 100, btnH = 30;
		const x = canvas.width - btnW - 12;
		const y = 12;
		
		ctx.save();
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
		ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(x, y, btnW, btnH, 8);
		ctx.fill();
		ctx.stroke();
		
		ctx.globalAlpha = 1;
		ctx.font = 'bold 12px system-ui';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('🔄 Reset Zoom', x + btnW / 2, y + btnH / 2);
		ctx.restore();
		
		// Store button bounds for click detection
		chart._zoomResetBtnBounds = { x, y, w: btnW, h: btnH };
	},
	
	afterEvent(chart, args) {
		if (!chart.isZoomedOrPanned || !chart.isZoomedOrPanned()) return;
		const e = args.event.native;
		if (!e) return;
		
		const canvas = chart.canvas;
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		const btn = chart._zoomResetBtnBounds;
		
		if (!btn) return;
		
		if ((args.event.type === 'click' || args.event.type === 'touchend') && 
			mouseX >= btn.x && mouseX <= btn.x + btn.w && 
			mouseY >= btn.y && mouseY <= btn.y + btn.h) {
			
			if (e.stopPropagation) e.stopPropagation();
			if (e.preventDefault) e.preventDefault();
			
			if (typeof chart.resetZoom === 'function') {
				chart.resetZoom();
				showNotification('Chart zoom reset', 'success');
			}
		}
	},
};

// Helper function to create chart canvas element
function createChartCanvas(field, index) {
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

// Enhanced chart creation function
function createEnhancedChart(canvas, options) {
	const {
		field,
		chartData,
		chartType,
		interpolation,
		animationStyle,
		showGrid,
		showLegend,
		showTitle,
		showPoints,
		showFill,
		smoothing,
		customColors,
		zoomPluginConfig,
		fieldLabels
	} = options;

	try {
		// Get field color
		const fieldColor = customColors[field] || getFieldColor(field);
		
		// Configure dataset based on chart type
		const dataset = {
			label: fieldLabels[field] || field,
			data: chartData,
			borderColor: fieldColor,
			backgroundColor: showFill ? hexToRgba(fieldColor, 0.2) : 'transparent',
			pointBackgroundColor: fieldColor,
			pointBorderColor: fieldColor,
			pointRadius: showPoints ? 3 : 0,
			pointHoverRadius: 5,
			fill: showFill,
			tension: smoothing / 100,
			borderWidth: 2
		};

		// Adjust dataset for chart type
		if (chartType === 'bar') {
			dataset.backgroundColor = fieldColor;
			dataset.borderWidth = 1;
		} else if (chartType === 'scatter') {
			dataset.showLine = false;
			dataset.pointRadius = 4;
		}

		// Chart configuration
		const config = {
			type: chartType === 'area' ? 'line' : chartType,
			data: {
				datasets: [dataset]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				plugins: {
					legend: {
						display: showLegend,
						position: 'top',
						labels: {
							usePointStyle: true,
							font: {
								size: 12
							}
						}
					},
					title: {
						display: showTitle,
						text: fieldLabels[field] || field,
						font: {
							size: 16,
							weight: 'bold'
						},
						padding: 20
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: fieldColor,
						borderWidth: 1,
						cornerRadius: 6,
						displayColors: true,
						callbacks: {
							title: function(context) {
								return context[0].label;
							},
							label: function(context) {
								const value = context.parsed.y;
								const unit = getFieldUnit(field);
								return `${context.dataset.label}: ${formatValue(value, field)}${unit}`;
							}
						}
					},
					zoom: zoomPluginConfig
				},				scales: {
					x: {
						type: 'linear',
						display: true,
						grid: {
							display: showGrid,
							color: 'rgba(0, 0, 0, 0.1)'
						},
						title: {
							display: true,
							text: 'Time (seconds)',
							font: {
								size: 12,
								weight: 'bold'
							}
						},
						ticks: {
							callback: function(value) {
								// Format seconds as MM:SS or HH:MM:SS
								return formatTime(value);
							}
						}
					},
					y: {
						display: true,
						grid: {
							display: showGrid,
							color: 'rgba(0, 0, 0, 0.1)'
						},
						title: {
							display: true,
							text: `${fieldLabels[field] || field} ${getFieldUnit(field)}`,
							font: {
								size: 12,
								weight: 'bold'
							}
						}
					}
				},
				animation: {
					duration: animationStyle === 'none' ? 0 : 
							 animationStyle === 'fast' ? 500 : 
							 animationStyle === 'slow' ? 2000 : 1000,
					easing: interpolation
				}
			},
			plugins: [zoomResetPlugin]
		};
		// Create and return chart
		const chart = new window.Chart(canvas, config);
		
		// Apply enhanced animation configurations
		if (chart && animationStyle !== 'none') {
			updateChartAnimations(chart, field);
		}
		
		return chart;
		
	} catch (error) {
		console.error(`[ChartJS] Error creating chart for ${field}:`, error);
		showNotification(`Error creating chart for ${field}`, 'error', 5000);
		return null;
	}
}

// Event messages chart renderer
function renderEventMessagesChart(container, options, startTime) {
	try {
		const eventMesgs = window.globalData?.eventMesgs;
		if (!eventMesgs || !Array.isArray(eventMesgs) || eventMesgs.length === 0) {
			return;
		}

		const canvas = createChartCanvas('events', 'events');
		container.appendChild(canvas);
		// Prepare event data with relative timestamps
		const eventData = eventMesgs.map(event => {
			let timestamp = event.timestamp || event.time || 0;
			
			// Convert to relative seconds from start time
			if (timestamp && startTime) {
				let eventTimestamp;
				let startTimestamp;
				
				// Handle different timestamp formats
				if (timestamp instanceof Date) {
					eventTimestamp = timestamp.getTime() / 1000; // Convert to seconds
				} else if (typeof timestamp === 'number') {
					// Check if timestamp is in milliseconds or seconds
					eventTimestamp = timestamp > 1000000000000 ? timestamp / 1000 : timestamp;
				} else {
					return { x: 0, y: 1, event: event.event || event.message || event.eventType || 'Event' };
				}
				
				if (startTime instanceof Date) {
					startTimestamp = startTime.getTime() / 1000; // Convert to seconds
				} else if (typeof startTime === 'number') {
					// Check if startTime is in milliseconds or seconds
					startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
				} else {
					return { x: 0, y: 1, event: event.event || event.message || event.eventType || 'Event' };
				}
				
				// Convert to relative seconds
				timestamp = Math.round(eventTimestamp - startTimestamp);
			}
			
			return {
				x: timestamp,
				y: 1, // Events are just markers
				event: event.event || event.message || event.eventType || 'Event'
			};
		});

		const config = {
			type: 'scatter',
			data: {
				datasets: [{
					label: 'Events',
					data: eventData,
					backgroundColor: 'rgba(255, 99, 132, 0.8)',
					borderColor: 'rgba(255, 99, 132, 1)',
					pointRadius: 6,
					pointHoverRadius: 8
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: options.showLegend
					},
					title: {
						display: options.showTitle,
						text: 'Event Messages',
						font: { size: 16, weight: 'bold' }
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const point = context.raw;
								return point.event || 'Event';
							}
						}
					},
					zoom: options.zoomPluginConfig
				},				scales: {
					x: {
						type: 'linear',
						display: true,
						grid: { display: options.showGrid },
						title: { display: true, text: 'Time (seconds)' },
						ticks: {
							callback: function(value) {
								// Format seconds as MM:SS or HH:MM:SS
								return formatTime(value);
							}
						}
					},
					y: {
						display: false
					}
				}
			}
		};

		const chart = new window.Chart(canvas, config);
		if (chart) {
			// Apply enhanced animation configurations
			updateChartAnimations(chart, 'Event Messages');
			window._chartjsInstances.push(chart);
		}
	} catch (error) {
		console.error('[ChartJS] Error rendering event messages chart:', error);
	}
}

// Time in zone charts renderer
function renderTimeInZoneCharts(container, options) {
	try {
		console.log('[ChartJS] renderTimeInZoneCharts called');
		console.log('[ChartJS] window.heartRateZones:', window.heartRateZones);
		console.log('[ChartJS] window.powerZones:', window.powerZones);
		
		// Check for heart rate zone data
		if (window.heartRateZones && Array.isArray(window.heartRateZones) && window.heartRateZones.length > 0) {
			console.log('[ChartJS] Rendering HR zone chart with data:', window.heartRateZones);
			renderZoneChart(container, 'Heart Rate Zones', window.heartRateZones, 'heart-rate-zones', options);
		} else {
			console.log('[ChartJS] No HR zone data available for chart');
		}

		// Check for power zone data
		if (window.powerZones && Array.isArray(window.powerZones) && window.powerZones.length > 0) {
			console.log('[ChartJS] Rendering power zone chart with data:', window.powerZones);
			renderZoneChart(container, 'Power Zones', window.powerZones, 'power-zones', options);
		} else {
			console.log('[ChartJS] No power zone data available for chart');
		}
	} catch (error) {
		console.error('[ChartJS] Error rendering time in zone charts:', error);
	}
}

// Helper function to render individual zone chart
function renderZoneChart(container, title, zoneData, chartId, options) {
	console.log(`[ChartJS] renderZoneChart called for ${title} with data:`, zoneData);
	
	const canvas = createChartCanvas(chartId, chartId);
	container.appendChild(canvas);

	const colors = [
		'#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
		'#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
	];

	const config = {
		type: 'doughnut',
		data: {
			labels: zoneData.map((zone, i) => `Zone ${i + 1}`),
			datasets: [{
				data: zoneData.map(zone => zone.time || 0),
				backgroundColor: colors.slice(0, zoneData.length),
				borderColor: '#000',
				borderWidth: 3,
				borderAlign: 'center',
				borderRadius: 4,
				borderJoinStyle: 'round',
				hoverBackgroundColor: colors.slice(0, zoneData.length).map(color => {
					// Lighten the color on hover
					const r = parseInt(color.slice(1, 3), 16);
					const g = parseInt(color.slice(3, 5), 16);
					const b = parseInt(color.slice(5, 7), 16);
					return `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, 0.9)`;
				}),
				hoverBorderColor: '#ffffff',
				hoverBorderWidth: 4,
				hoverOffset: 8,
				offset: 2,
				spacing: 2,
				rotation: -90, // Start from top
				circumference: 360, // Full circle
				weight: 1
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			// Creates a nice donut hole
			radius: '90%',
			plugins: {
				legend: {
					display: options.showLegend,
					position: 'right',
					labels: {
						display: true,
						font: {
							size: 14,
							weight: '600',
						},
						padding: 20,
						usePointStyle: true,
						pointStyle: 'circle',
						generateLabels: function(chart) {
							const data = chart.data;
							if (data.labels.length && data.datasets.length) {
								const dataset = data.datasets[0];
								const total = dataset.data.reduce((a, b) => a + b, 0);
								
								return data.labels.map((label, i) => {
									const value = dataset.data[i];
									const percentage = ((value / total) * 100).toFixed(1);
									const meta = chart.getDatasetMeta(0);
									const hidden = meta.data[i] && meta.data[i].hidden;
									
									return {
										text: `${label}: ${formatTime(value)} (${percentage}%)`,
										fillStyle: hidden ? 'rgba(128, 128, 128, 0.5)' : dataset.backgroundColor[i],
										strokeStyle: hidden ? 'rgba(128, 128, 128, 0.8)' : dataset.borderColor,
										lineWidth: dataset.borderWidth,
										index: i,
										fontColor: hidden ? 'rgba(128, 128, 128, 0.8)' : dataset.backgroundColor[i],
										hidden: hidden
									};
								});
							}
							return [];
						}
					},
					onClick: function(e, legendItem, legend) {
						const index = legendItem.index;
						const chart = legend.chart;
						const meta = chart.getDatasetMeta(0);
						
						// Toggle visibility
						meta.data[index].hidden = !meta.data[index].hidden;
						chart.update();
					}
				},
				title: {
					display: options.showTitle,
					text: title,
					font: { size: 18, weight: 'bold' },
					position: 'top',
					align: 'center',
					padding: {
						top: 10,
						bottom: 20
					}
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.9)',
					titleColor: '#ffffff',
					bodyColor: '#ffffff',
					borderColor: '#ffffff',
					borderWidth: 1,
					cornerRadius: 8,
					displayColors: true,
					usePointStyle: true,
					callbacks: {
						title: function(context) {
							return context[0].label;
						},
						label: function(context) {
							const total = context.dataset.data.reduce((a, b) => a + b, 0);
							const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
							const timeFormatted = formatTime(context.parsed);
							return [
								`Time: ${timeFormatted}`,
								`Percentage: ${percentage}%`
							];
						},
						labelColor: function(context) {
							return {
								borderColor: context.dataset.borderColor,
								backgroundColor: context.dataset.backgroundColor[context.dataIndex],
								borderWidth: 2,
								borderRadius: 2
							};
						}
					}
				}
			},
			animation: {
				animateRotate: true,
				animateScale: true,
				duration: 2000,
				easing: 'easeOutQuart'
			},
			interaction: {
				intersect: false,
				mode: 'point'
			},
			elements: {
				arc: {
					borderWidth: 3,
					borderColor: '#ffffff',
					hoverBorderWidth: 4
				}
			}
		}
	};

	console.log(`[ChartJS] Creating zone chart with config:`, config);
	const chart = new window.Chart(canvas, config);
	if (chart) {
		console.log(`[ChartJS] Zone chart created successfully for ${title}`);
		window._chartjsInstances.push(chart);
	} else {
		console.error(`[ChartJS] Failed to create zone chart for ${title}`);
	}
}

// Helper function to render lap-by-lap zone analysis bar chart
function renderLapZoneChart(canvas, lapZoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(lapZoneData)) {
            throw new Error('Chart.js, canvas, or lapZoneData missing');
        }
        const theme = options.theme || (document.documentElement.dataset.theme || 'light');
        
        // Get unique zone labels from the first lap that has zones
        const firstLapWithZones = lapZoneData.find(lap => lap.zones && lap.zones.length > 0);
        if (!firstLapWithZones) {
            throw new Error('No lap data with zones found');
        }
        const zoneLabels = firstLapWithZones.zones.map(z => z.label);
        const numZones = zoneLabels.length;
        
        // Create one dataset per zone (stacked across laps)
        const datasets = [];
        for (let zoneIndex = 0; zoneIndex < numZones; zoneIndex++) {
            const zoneLabel = zoneLabels[zoneIndex];
            const zoneColor = firstLapWithZones.zones[zoneIndex]?.color || `hsl(${zoneIndex * 45}, 70%, 60%)`;
            
            datasets.push({
                label: zoneLabel,
                data: lapZoneData.map(lap => {
                    const zone = lap.zones?.[zoneIndex];
                    return zone ? zone.value : 0;
                }),
                backgroundColor: zoneColor,
                borderColor: theme === 'dark' ? '#333' : '#fff',
                borderWidth: 1,
                stack: 'zones'
            });
        }
        
        // Labels are lap names
        const lapLabels = lapZoneData.map(lap => lap.lapLabel || 'Lap');
        
        const chart = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: lapLabels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            color: theme === 'dark' ? '#fff' : '#000',
                            font: { size: 12 }
                        }
                    },
                    title: { 
                        display: !!options.title, 
                        text: options.title || 'Zone Distribution by Lap',
                        color: theme === 'dark' ? '#fff' : '#000',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: theme === 'dark' ? '#222' : '#fff',
                        titleColor: theme === 'dark' ? '#fff' : '#000',
                        bodyColor: theme === 'dark' ? '#fff' : '#000',
                        borderColor: theme === 'dark' ? '#555' : '#ddd',
                        borderWidth: 1,
                        callbacks: {
                            footer: function(tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach(item => total += item.parsed.y);
                                return `Total: ${total.toFixed(1)}s`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        title: { 
                            display: true, 
                            text: 'Lap',
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
                        stacked: true,
                        beginAtZero: true, 
                        title: { 
                            display: true, 
                            text: 'Time (seconds)',
                            color: theme === 'dark' ? '#fff' : '#000'
                        },
                        ticks: {
                            color: theme === 'dark' ? '#fff' : '#000'
                        },
                        grid: {
                            color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        return chart;
    } catch (error) {
        if (window.showNotification) window.showNotification('Failed to render lap zone chart', 'error');
        console.error('[renderLapZoneChart] Error:', error);
        return null;
    }
}

/**
 * Renders a single power zone bar (e.g., for a summary or lap)
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object[]} zoneData - Array of zone objects {label, value, color}
 * @param {Object} [options={}] - Chart options (theme, title, etc.)
 * @returns {Chart|null} Chart.js instance or null on error
 */
export function renderSinglePowerZoneBar(canvas, zoneData, options = {}) {
    try {
        if (!window.Chart || !canvas || !Array.isArray(zoneData)) {
            throw new Error('Chart.js, canvas, or zoneData missing');
        }
        const theme = options.theme || (document.documentElement.dataset.theme || 'light');
        const chart = new window.Chart(canvas, {
            type: 'bar',
            data: {
                labels: zoneData.map(z => z.label),
                datasets: [{
                    label: options.title || 'Power Zones',
                    data: zoneData.map(z => z.value),
                    backgroundColor: zoneData.map(z => z.color || (theme === 'dark' ? '#f59e42' : '#fbbf24')),
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
                        text: options.title || 'Power Zones',
                        color: theme === 'dark' ? '#fff' : '#000',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        backgroundColor: theme === 'dark' ? '#222' : '#fff',
                        titleColor: theme === 'dark' ? '#fff' : '#000',
                        bodyColor: theme === 'dark' ? '#fff' : '#000',
                        borderColor: theme === 'dark' ? '#555' : '#ddd',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}s`;
                            }
                        }
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
                            text: 'Time (seconds)',
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
            }
        });
        return chart;
    } catch (error) {
        if (window.showNotification) window.showNotification('Failed to render power zone bar', 'error');
        console.error('[renderSinglePowerZoneBar] Error:', error);
        return null;
    }
}

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
        const theme = options.theme || (document.documentElement.dataset.theme || 'light');
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
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}s`;
                            }
                        }
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
                            text: 'Time (seconds)',
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
            }
        });
        return chart;
    } catch (error) {
        if (window.showNotification) window.showNotification('Failed to render HR zone bar', 'error');
        console.error('[renderSingleHRZoneBar] Error:', error);
        return null;
    }
}

// Utility function to convert hex to rgba
function hexToRgba(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Utility function to get field color
function getFieldColor(field) {
	const colorMap = {
		'heart_rate': '#EF4444',
		'cadence': '#10B981',
		'speed': '#3B82F6',
		'power': '#F59E0B',
		'altitude': '#8B5CF6',
		'temperature': '#EC4899',
		'grade': '#06B6D4',
		'distance': '#84CC16'
	};
	return colorMap[field] || '#6B7280';
}

// Utility function to get field unit
function getFieldUnit(field) {
	const unitMap = {
		'heart_rate': ' bpm',
		'cadence': ' rpm',
		'speed': ' km/h',
		'power': ' W',
		'altitude': ' m',
		'temperature': '°C',
		'grade': '%',
		'distance': ' km'
	};
	return unitMap[field] || '';
}

// Utility function to format values
function formatValue(value, field) {
	if (typeof value !== 'number') return 'N/A';
	
	switch (field) {
		case 'speed':
		case 'distance':
		case 'altitude':
			return value.toFixed(1);
		case 'grade':
			return value.toFixed(2);
		case 'power':
		case 'heart_rate':
		case 'cadence':
			return Math.round(value);
		case 'temperature':
			return value.toFixed(1);
		default:
			return value.toFixed(2);
	}
}

/**
 * Process and set up zone data from FIT file for chart rendering
 * Extracts time in zone data from session messages and sets global variables
 */
/**
 * Main chart rendering function with comprehensive error handling and performance monitoring
 * @param {Element|string} targetContainer - Container element or ID for chart rendering
 * @returns {boolean} Success status of the rendering operation
 */
export function renderChartJS(targetContainer) {
	console.log('[ChartJS] Starting chart rendering...');
	const performanceStart = performance.now();

	try {
		// Initialize chart instances array
		if (!window._chartjsInstances) {
			window._chartjsInstances = [];
		}

		// Destroy existing chart instances with error handling
		window._chartjsInstances.forEach((chart, index) => {
			try {
				if (chart && typeof chart.destroy === 'function') {
					chart.destroy();
				}
			} catch (destroyError) {
				console.warn(`[ChartJS] Error destroying chart ${index}:`, destroyError);
			}
		});
		window._chartjsInstances = [];

		// Validate Chart.js availability
		if (!window.Chart) {
			const error = 'Chart.js library is not loaded or not available';
			console.error(`[ChartJS] ${error}`);
			showNotification('Chart library not available', 'error');
			return false;
		}

		// Validate FIT file data availability
		if (!window.globalData || typeof window.globalData !== 'object') {
			console.warn('[ChartJS] No FIT file data available');
			showNotification('No FIT file data available for chart rendering', 'warning');
			return false;
		}
		// Setup zone data from FIT file
		setupZoneData(window.globalData);

		// Validate record messages (main time-series data)
		const recordMesgs = window.globalData.recordMesgs;
		if (!recordMesgs || !Array.isArray(recordMesgs) || recordMesgs.length === 0) {
			console.warn('[ChartJS] No record messages found in FIT data');
			showNotification('No chartable data found in this FIT file', 'info');
			
			// Still render the UI but show a helpful message
			const container = document.getElementById('content-chart');
			if (container) {
				container.innerHTML = `
					<div class="chart-placeholder" style="
						text-align: center; 
						padding: 40px; 
						color: var(--text-secondary, #666);
						background: var(--bg-secondary, #f8f9fa);
						border-radius: 12px;
						margin: 20px 0;
					">
						<h3 style="color: var(--text-primary, #333); margin-bottom: 16px;">No Chart Data Available</h3>
						<p style="margin-bottom: 8px;">This FIT file does not contain time-series data that can be charted.</p>
						<p style="margin-bottom: 0;">Try loading a FIT file from a fitness activity or workout.</p>
					</div>
				`;
			}
			return false;
		}

		console.log(`[ChartJS] Found ${recordMesgs.length} data points to process`);
		
		// Get the actual start time from the first record message
		let activityStartTime = null;
		if (recordMesgs.length > 0 && recordMesgs[0].timestamp) {
			activityStartTime = recordMesgs[0].timestamp;
			console.log('[ChartJS] Activity start time:', activityStartTime);
		}
		
		const result = renderChartsWithData(targetContainer, recordMesgs, activityStartTime);
		
		// Log performance timing
		const performanceEnd = performance.now();
		console.log(`[ChartJS] Chart rendering completed in ${(performanceEnd - performanceStart).toFixed(2)}ms`);
		
		return result;
		
	} catch (error) {
		console.error('[ChartJS] Critical error in chart rendering:', error);
		showNotification('Failed to render charts due to an error', 'error');
		
		// Try to show error information to user
		const container = document.getElementById('content-chart') || targetContainer;
		if (container) {
			container.innerHTML = `
				<div class="chart-error" style="
					text-align: center; 
 
					padding: 40px; 
					color: #dc3545;
					background: #f8d7da;
					border: 1px solid #f5c6cb;
					border-radius: 12px;
					margin: 20px 0;
				">
					<h3 style="margin-bottom: 16px;">Chart Rendering Error</h3>
					<p style="margin-bottom: 8px;">An error occurred while rendering the charts.</p>
					<details style="text-align: left; margin-top: 16px;">
						<summary style="cursor: pointer; font-weight: bold;">Error Details</summary>
						<pre style="background: #fff; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 12px; overflow-x: auto;">${error.stack || error.message}</pre>
					</details>
				</div>
			`;
		}
		return false;
	}
}

/**
 * Renders charts with validated data
 * @private
 */
function renderChartsWithData(targetContainer, recordMesgs, startTime) {
	let renderCount = 0;

	// Ensure settings dropdowns exist
	ensureChartSettingsDropdowns(targetContainer);
	
	// Get chart container
	let chartContainer = targetContainer
		? typeof targetContainer === 'string'
			? document.getElementById(targetContainer)
			: targetContainer
		: document.getElementById('chartjs-chart-container');
	
	if (!chartContainer) {
		chartContainer = document.createElement('div');
		chartContainer.id = 'chartjs-chart-container';
		chartContainer.style.cssText = `
			margin-top: 20px;
			padding: 20px;
			background: rgba(0, 0, 0, 0.05);
			border-radius: 12px;
		`;
		
		const settingsWrapper = document.getElementById('chartjs-settings-wrapper');
		if (settingsWrapper && settingsWrapper.parentNode) {
			settingsWrapper.parentNode.insertBefore(chartContainer, settingsWrapper.nextSibling);
		} else {
			document.body.appendChild(chartContainer);
		}
	}

	// Clear existing charts
	chartContainer.innerHTML = '';

	// Get current settings
	const settings = getCurrentSettings();
	const {
		maxpoints: maxPoints,
		chartType,
		interpolation,
		animation: animationStyle,
		showGrid,
		showLegend,
		showTitle,
		showPoints,
		showFill,
		smoothing,
		colors: customColors
	} = settings;

	// Convert boolean settings from strings
	const boolSettings = {
		showGrid: showGrid !== 'off',
		showLegend: showLegend !== 'off',
		showTitle: showTitle !== 'off',
		showPoints: showPoints === 'on',
		showFill: showFill === 'on'
	};

	// Prepare zoom plugin config
	const zoomPluginConfig = {
		pan: {

			enabled: true,
			mode: 'x'
		},
		zoom: {
			wheel: {
				enabled: true
			},
			pinch: {
				enabled: true
			},
			mode: 'x'
		}	};	// Process data
	const data = recordMesgs; // Use the record messages
	const labels = data.map((row, i) => {
		// Convert timestamp to relative seconds from start time
		if (row.timestamp && startTime) {
			let timestamp;
			let startTimestamp;
			
			// Handle different timestamp formats
			if (row.timestamp instanceof Date) {
				timestamp = row.timestamp.getTime() / 1000; // Convert to seconds
			} else if (typeof row.timestamp === 'number') {
				// Check if timestamp is in milliseconds (very large number) or seconds
				timestamp = row.timestamp > 1000000000000 ? row.timestamp / 1000 : row.timestamp;			} else {
				return i; // fallback to index if timestamp is invalid
			}
			
			if (typeof startTime === 'number') {
				startTimestamp = startTime > 1000000000000 ? startTime / 1000 : startTime;
			} else if (startTime instanceof Date) {
				startTimestamp = startTime.getTime() / 1000;
			} else {
				return i; // fallback to index if startTime is invalid
			}
			
			return Math.round(timestamp - startTimestamp);
		}
		return i; // fallback to index
	});

	// Define fields to process for charts
	const chartFields = ['speed', 'cadence', 'heart_rate', 'power', 'altitude', 'temperature', 'distance'];
	let visibleFieldCount = 0;

	// Process each field
	chartFields.forEach((field) => {
		// Check field visibility
		const visibility = localStorage.getItem(`chartjs_field_${field}`);
		if (visibility === 'hidden') {
			return; // Skip this field
		}

		// Extract numeric data
		const numericData = data.map(row => {
			if (row[field] !== undefined && row[field] !== null) {
				const value = parseFloat(row[field]);
				return isNaN(value) ? null : value;
			}
			return null;
		});

		// Skip if no valid data
		if (numericData.every(val => val === null)) {
			return;
		}

		visibleFieldCount++;
		const canvas = createChartCanvas(field, visibleFieldCount);
		chartContainer.appendChild(canvas);

		// Prepare chart data for enhanced chart
		let chartData = data.map((row, i) => ({
			x: labels[i],
			y: row[field] ?? null
		})).filter(point => point.y !== null);

		// Apply data point limiting
		if (maxPoints !== 'all' && chartData.length > maxPoints) {
			const step = Math.ceil(chartData.length / maxPoints);
			chartData = chartData.filter((_, i) => i % step === 0);
		}

		// Create enhanced chart
		const chart = createEnhancedChart(canvas, {
			field,
			chartData,
			chartType,
			interpolation,
			animationStyle,
			showGrid: boolSettings.showGrid,
			showLegend: boolSettings.showLegend,
			showTitle: boolSettings.showTitle,
			showPoints: boolSettings.showPoints,
			showFill: boolSettings.showFill,
			smoothing,
			customColors,
			zoomPluginConfig,
			fieldLabels
		});

		if (chart) {
			window._chartjsInstances.push(chart);
			renderCount++;
		}
	});

	// Render additional chart types
	renderEventMessagesChart(chartContainer, { 
		showGrid: boolSettings.showGrid, 
		showLegend: boolSettings.showLegend, 
		showTitle: boolSettings.showTitle, 
		zoomPluginConfig 
	}, startTime);
		renderTimeInZoneCharts(chartContainer, { 
		showGrid: boolSettings.showGrid, 
		showLegend: boolSettings.showLegend, 
		showTitle: boolSettings.showTitle, 
		zoomPluginConfig 
	});

	// Render lap zone charts
	renderLapZoneCharts(chartContainer, { 
		showGrid: boolSettings.showGrid, 
		showLegend: boolSettings.showLegend, 
		showTitle: boolSettings.showTitle, 
		zoomPluginConfig 
	});

	// Handle no charts case
	if (renderCount === 0 && visibleFieldCount === 0) {
		chartContainer.innerHTML = '<div class="no-data-message">No visible metrics selected. Enable metrics in the "Visible Metrics" section above.</div>';
	} else if (renderCount === 0) {
		chartContainer.innerHTML = '<div class="no-data-message">No suitable numeric data available for selected chart type.</div>';
	}
	// Performance logging
	const endTime = performance.now();
	console.log(`[ChartJS] Rendered ${renderCount} charts in ${(endTime - startTime).toFixed(2)}ms`);
	
	// Show completion notification for multiple charts
	if (renderCount > 1) {
		showNotification(`Rendered ${renderCount} charts successfully`, 'success', 3000);
	}
	
	return true;
}

// Lap zone charts renderer - renders 4 different lap zone visualizations
function renderLapZoneCharts(container, options = {}) {
	try {
		console.log('[ChartJS] renderLapZoneCharts called');
		
		if (!window.globalData || !window.globalData.timeInZoneMesgs) {
			console.log('[ChartJS] No timeInZoneMesgs available for lap zone charts');
			return;
		}

		const timeInZoneMesgs = window.globalData.timeInZoneMesgs;
		const lapZoneMsgs = timeInZoneMesgs.filter(msg => msg.referenceMesg === 'lap');
		
		// Get theme from options or fallback to system
		const theme = options.theme || (document.documentElement.dataset.theme || 'dark');
		
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
			.filter(lap => lap.zones.length > 0);
		// Chart 1: Lap HR Zone Distribution (Stacked Bar)
		if (hrZoneData.length > 0) {
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
		if (pwrZoneData.length > 0) {
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
		if (hrZoneData.length > 0) {
			const bestHRLap = hrZoneData.reduce((prev, curr) => 
				curr.zones.reduce((sum, z) => sum + z.value, 0) > prev.zones.reduce((sum, z) => sum + z.value, 0) ? curr : prev
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
		if (pwrZoneData.length > 0) {
			const bestPwrLap = pwrZoneData.reduce((prev, curr) => 
				curr.zones.reduce((sum, z) => sum + z.value, 0) > prev.zones.reduce((sum, z) => sum + z.value, 0) ? curr : prev
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

// Utility function to create rounded rectangle path
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
	if (typeof radius === 'undefined') {
		radius = 5;
	} else if (Object.prototype.toString.call(radius) === '[object Number]') {
		radius = { tl: radius, tr: radius, br: radius, bl: radius };
	} else {
		const { tl = 0, tr = 0, br = 0, bl = 0 } = radius;
		radius = { tl, tr, br, bl };
	}

	this.beginPath();
	this.moveTo(x + radius.tl, y);
	this.lineTo(x + width - radius.tr, y);
	this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	this.lineTo(x + width, y + height - radius.br);
	this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	this.lineTo(x + radius.bl, y + height);
	this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	this.lineTo(x, y + radius.tl);
	this.quadraticCurveTo(x, y, x + radius.tl, y);
	this.closePath();
	return this;
};

/**
 * Synchronizes the controls state with DOM - useful for fixing state inconsistencies
 */
export function syncControlsState() {
	const wrapper = document.getElementById('chartjs-settings-wrapper');
	const toggleBtn = document.getElementById('chart-controls-toggle');
	
	if (!wrapper || !toggleBtn) {
		return;
	}
	
	// Get the actual visibility from the DOM
	const computedStyle = window.getComputedStyle(wrapper);
	const isActuallyVisible = wrapper.style.display !== 'none' && 
							  computedStyle.display !== 'none' && 
							  wrapper.offsetParent !== null;
	
	// Update internal state to match DOM reality
	chartControlsState.isVisible = isActuallyVisible;
	
	// Update toggle button to reflect actual state
	toggleBtn.textContent = chartControlsState.isVisible ? '▼ Hide Controls' : '▶ Show Controls';
	toggleBtn.setAttribute('aria-expanded', chartControlsState.isVisible.toString());
	
	// Ensure wrapper display matches internal state
	wrapper.style.display = chartControlsState.isVisible ? 'block' : 'none';
	
	console.log(`[ChartJS] State synchronized - controls are ${chartControlsState.isVisible ? 'visible' : 'hidden'}`);
}

/**
 * Module initialization complete
 * 
 * This module provides comprehensive Chart.js integration for FitFileViewer with:
 * - ✅ Toggleable controls panel (hidden by default)
 * - ✅ Professional error handling and user feedback  
 * - ✅ Performance monitoring and optimization
 * - ✅ Multiple export formats (PNG, CSV, JSON, clipboard)
 * - ✅ Accessibility support and keyboard navigation
 * - ✅ Theme-aware styling with CSS custom properties
 * - ✅ Memory management and cleanup utilities
 * - ✅ Comprehensive JSDoc documentation
 * - ✅ Development debugging utilities
 * 
 * Usage:
 *   import { renderChartJS } from './utils/renderChartJS.js';
 *   renderChartJS(); // Renders charts for current FIT data
 *   window.toggleChartControls(); // Show/hide controls panel
 * 
 * Global Development Access:
 *   window.__chartjs_dev.getChartStatistics(); // Get chart info
 *   window.__chartjs_dev.destroyAllCharts(); // Cleanup all charts
 */
