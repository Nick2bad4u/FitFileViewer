import { getThemeColors } from "../../charts/theming/getThemeColors.js";

/**
 * Create the Elevation Profile action button (Map toolbar) which opens a new
 * window rendering elevation charts for each currently loaded FIT file (or the
 * active file if none explicitly loaded as overlays).
 *
 * Implementation notes / typing strategy:
 * - getThemeColors() returns an index-signature based object; due to
 *   noPropertyAccessFromIndexSignature we must use bracket notation.
 * - Many dynamic data objects (window.loadedFitFiles / window.globalData) are
 *   loosely typed; we defensively treat them as any while keeping local
 *   structures documented via JSDoc typedefs.
 * - Guard the popup window (can be blocked and be null) before dereferencing.
 *
 * @returns {HTMLButtonElement}
 */
export function createElevationProfileButton() {
	const btn = /** @type {HTMLButtonElement} */ (document.createElement("button"));
	btn.className = "map-action-btn";
	btn.innerHTML = `
		<iconify-icon icon="flat-color-icons:area-chart" width="18" height="18"></iconify-icon>
		<span>Elevation</span>
	`;
	btn.title = "Show Elevation Profile";

	btn.addEventListener("click", () => {
		/** @type {Array<any>} */
		let fitFiles = [];
		const w = /** @type {any} */ (globalThis);
		if (Array.isArray(w.loadedFitFiles) && w.loadedFitFiles.length > 0) {
			fitFiles = w.loadedFitFiles;
		} else if (w.globalData && Array.isArray(w.globalData.recordMesgs)) {
			fitFiles = [
				{
					data: w.globalData,
					filePath: w.globalData?.cachedFilePath,
				},
			];
		}
		const chartWin = window.open("", "Elevation Profile", "width=900,height=600"),
			isDark = document.body.classList.contains("theme-dark"),
			themeColors = getThemeColors();
		if (!chartWin) {
			// Popup likely blocked; fail silently or optionally notify
			return;
		}
		const chartHtml = `
		<html>
		<head>
			<title>Elevation Profiles</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<script src="./node_modules/chart.js/dist/chart.umd.js"></script>
			<link rel="stylesheet" href="./elevProfile.css">
			<style>
				body {
					margin: 0;
					padding: 0;
					font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
					background: ${themeColors.background};
					color: ${themeColors.text};
				}
				header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 24px 32px 0 32px;
					background: ${themeColors.surface};
					box-shadow: 0 2px 12px ${themeColors.shadowLight};
					border-radius: 0 0 18px 18px;
				}
				#elevChartsContainer {
					display: flex;
					flex-direction: column;
					gap: 32px;
					max-height: 90vh;
					overflow: auto;
					padding: 32px 32px 32px 32px;
				}
				.elev-profile-block {
					background: ${themeColors.surface};
					border-radius: 14px;
					box-shadow: 0 4px 24px ${themeColors.shadowMedium};
					padding: 24px 24px 18px 24px;
					display: flex;
					flex-direction: column;
					align-items: stretch;
					transition: box-shadow 0.2s;
					border: 1px solid ${themeColors.border};
				}
				.elev-profile-block:hover {
					box-shadow: 0 8px 32px ${themeColors.primaryShadow};
					border-color: ${themeColors.primary};
				}
				.elev-profile-label {
					font-weight: 600;
					margin-bottom: 12px;
					font-size: 1.13em;
					color: inherit;
					text-shadow: ${isDark ? "0 0 2px #000, 0 0 1px #000" : "0 0 2px #fff, 0 0 1px #fff"};
					letter-spacing: 0.01em;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.elev-profile-label .dot {
					display: inline-block;
					width: 14px;
					height: 14px;
					border-radius: 50%;
					margin-right: 2px;
					box-shadow: 0 0 0 2px ${themeColors.borderLight}, 0 1px 4px ${themeColors.shadowMedium};
					border: 2px solid ${themeColors.surface};
				}
				.elev-profile-canvas {
					width: 100%;
					min-width: 320px;
					max-width: 100vw;
					height: 200px;
					background: inherit;
					border-radius: 8px;
					box-shadow: 0 2px 8px ${themeColors.shadowLight};
				}
				.no-altitude-data {
					color: ${themeColors.textSecondary};
					font-size: 1em;
					margin-top: 12px;
					text-align: center;
				}
				::-webkit-scrollbar {
					width: 10px;
					background: ${themeColors.surface};
				}
				::-webkit-scrollbar-thumb {
					background: ${themeColors.border};
					border-radius: 6px;
				}
				@media (max-width: 700px) {
					header, #elevChartsContainer { padding: 10px; }
					.elev-profile-block { padding: 12px 8px 10px 8px; }
					.elev-profile-canvas { min-width: 0; }
				}
			</style>
		</head>
		<body class="${isDark ? "theme-dark" : "theme-light"}">
			<header>
				<h2 style="margin:0;font-size:1.5em;font-weight:700;letter-spacing:0.01em;">Elevation Profiles</h2>
				<span style="font-size:1.1em;opacity:0.7;">${fitFiles.length} file${fitFiles.length > 1 ? "s" : ""}</span>
			</header>
			<div id="elevChartsContainer"></div>
			<script>
				const fitFiles = ${JSON.stringify(
			fitFiles.map((f, idx) => ({
				altitudes:
					f?.data?.recordMesgs && Array.isArray(f.data.recordMesgs)
						? /** @type {any[]} */ (f.data.recordMesgs)
							.filter(
								(r) =>
									r && r.positionLat != null && r.positionLong != null && r.altitude != null
							)
							.map((r, i) => ({ x: i, y: r.altitude }))
						: [],
				color:
					window.opener && window.opener.chartOverlayColorPalette
						? window.opener.chartOverlayColorPalette[
						idx % window.opener.chartOverlayColorPalette.length
						]
						: "#1976d2",
				filePath: f.filePath || `File ${idx + 1}`,
			}))
		)};
				const isDark = ${isDark};
				const container = document.getElementById('elevChartsContainer');
				fitFiles.forEach((f, idx) => {
					const div = document.createElement('div');
					div.className = 'elev-profile-block';
					const label = document.createElement('div');
					label.className = 'elev-profile-label';
					const dot = document.createElement('span');
					dot.className = 'dot';
					dot.style.background = f.color;
					label.appendChild(dot);
					const text = document.createElement('span');
					text.textContent = f.filePath;
					label.appendChild(text);
					label.style.color = f.color;
					div.appendChild(label);
					const canvas = document.createElement('canvas');
					canvas.id = 'elevChart_' + idx;
					canvas.className = 'elev-profile-canvas';
					div.appendChild(canvas);
					container.appendChild(div);
					if (f.altitudes.length > 0) {
						const ctx = canvas.getContext('2d');
						new window.Chart(ctx, {
							type: 'line',
							data: {
								labels: f.altitudes.map(a => a.x),
								datasets: [{
									label: 'Altitude',
									data: f.altitudes.map(a => a.y),
									borderColor: f.color,
									backgroundColor: isDark
										? window.Chart.helpers.color(f.color).alpha(0.18).rgbString()
										: window.Chart.helpers.color(f.color).alpha(0.10).rgbString(),
									fill: true,
									pointRadius: 0,
									borderWidth: 2.5,
									tension: 0.22,
									hoverBorderWidth: 3.2,
								}]
							},
							options: {
								maintainAspectRatio: true,
								responsive: true,
								plugins: {
									legend: { display: false },
									tooltip: {
										mode: 'index',
										intersect: false,
										backgroundColor: isDark ? '#23263a' : '#fff',
										titleColor: isDark ? '#fff' : '#222',
										bodyColor: isDark ? '#fff' : '#222',
										borderColor: f.color,
										borderWidth: 1.5,
										padding: 10,
										displayColors: true,
										callbacks: {
											title: function(context) {
												// context[0].label is the point index (seconds)
												const idx = context[0].dataIndex;
												return 'Second: ' + idx + '';
											}
										}
									}
								},
								scales: {
									x: {
										title: { display: true, text: 'Seconds (Point Index)', color: isDark ? '#eee' : '#222', font: { weight: 500 } },
										ticks: { color: isDark ? '#b0b8c9' : '#222', maxTicksLimit: 12, font: { size: 13 } },
										grid: { color: isDark ? '#2e3347' : '#e3e8f0' }
									},
									y: {
										title: { display: true, text: 'Altitude (m)', color: isDark ? '#eee' : '#222', font: { weight: 500 } },
										ticks: { color: isDark ? '#b0b8c9' : '#222', maxTicksLimit: 7, font: { size: 13 } },
										grid: { color: isDark ? '#2e3347' : '#e3e8f0' }
									}
								}
							}
						});
					} else {
						const noData = document.createElement('div');
						noData.textContent = 'No altitude data.';
						noData.className = 'no-altitude-data';
						div.appendChild(noData);
					}
				});
			</script>
		</body>
		</html>
		`;
		chartWin.document.write(chartHtml);
		chartWin.document.close();
	});
	return btn;
}
