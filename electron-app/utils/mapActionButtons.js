// Utility to create map action buttons for Print/Export and GPX Export
export function createPrintButton() {
    const printBtn = document.createElement("button");
    printBtn.className = "map-action-btn";
    printBtn.innerHTML =
        '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="12" width="12" height="5" rx="1" fill="#1976d2"/><rect x="4" y="3" width="12" height="7" rx="1" fill="#90caf9"/><rect x="7" y="15" width="6" height="2" rx="1" fill="#fff"/></svg> <span>Print/Export</span>';
    printBtn.title = "Print or export the current map view";
    printBtn.onclick = () => {
        window.print();
    };
    return printBtn;
}

export function createExportGPXButton() {
    const exportBtn = document.createElement("button");
    exportBtn.className = "map-action-btn";
    exportBtn.innerHTML =
        '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><path d="M10 2v12M10 14l-4-4m4 4l4-4" stroke="#1976d2" stroke-width="2" fill="none"/><rect x="4" y="16" width="12" height="2" rx="1" fill="#1976d2"/></svg> <span>Export GPX</span>';
    exportBtn.title = "Export the current track as a GPX file";
    exportBtn.onclick = () => {
        if (!window.globalData || !window.globalData.recordMesgs || !Array.isArray(window.globalData.recordMesgs)) return;
        const coords = window.globalData.recordMesgs
            .filter((row) => row.positionLat != null && row.positionLong != null)
            .map((row) => [Number((row.positionLat / 2 ** 31) * 180), Number((row.positionLong / 2 ** 31) * 180)]);
        let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FitFileViewer">\n<trk><name>Exported Track</name><trkseg>`;
        coords.forEach((c) => {
            gpx += `\n<trkpt lat="${c[0]}" lon="${c[1]}"/>`;
        });
        gpx += "\n</trkseg></trk></gpx>";
        const blob = new Blob([gpx], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "track.gpx";
        a.click();
        URL.revokeObjectURL(url);
    };
    return exportBtn;
}

export function createElevationProfileButton() {
    const btn = document.createElement("button");
    btn.className = "map-action-btn";
    btn.innerHTML =
        '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><polyline points="2,16 6,10 10,14 14,6 18,12" fill="none" stroke="#1976d2" stroke-width="2"/><circle cx="2" cy="16" r="1.5" fill="#1976d2"/><circle cx="6" cy="10" r="1.5" fill="#1976d2"/><circle cx="10" cy="14" r="1.5" fill="#1976d2"/><circle cx="14" cy="6" r="1.5" fill="#1976d2"/><circle cx="18" cy="12" r="1.5" fill="#1976d2"/></svg> <span>Elevation</span>';
    btn.title = "Show Elevation Profile";

    btn.onclick = () => {
        let fitFiles = [];
        if (window.loadedFitFiles && window.loadedFitFiles.length > 0) {
            fitFiles = window.loadedFitFiles;
        } else if (window.globalData && window.globalData.recordMesgs) {
            fitFiles = [
                {
                    data: window.globalData,
                    filePath: window.globalData?.cachedFilePath,
                },
            ];
        }
        const isDark = document.body.classList.contains("theme-dark");
        const chartWin = window.open("", "Elevation Profile", "width=900,height=600");
        let chartHtml = `
		<html>
		<head>
			<title>Elevation Profiles</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<script src="./libs/chartjs-latest.js"></script>
			<link rel="stylesheet" href="./elevProfile.css">
			<style>
				body {
					margin: 0;
					padding: 0;
					font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
					background: ${isDark ? "#181a23" : "#f7f9fb"};
					color: ${isDark ? "#f3f6fa" : "#23263a"};
				}
				header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 24px 32px 0 32px;
					background: ${isDark ? "#23263a" : "#fff"};
					box-shadow: 0 2px 12px #0001;
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
					background: ${isDark ? "#23263a" : "#fff"};
					border-radius: 14px;
					box-shadow: 0 4px 24px #0002;
					padding: 24px 24px 18px 24px;
					display: flex;
					flex-direction: column;
					align-items: stretch;
					transition: box-shadow 0.2s;
					border: 1px solid ${isDark ? "#2e3347" : "#e3e8f0"};
				}
				.elev-profile-block:hover {
					box-shadow: 0 8px 32px #1976d233;
					border-color: ${isDark ? "#40c4ff" : "#1976d2"};
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
					box-shadow: 0 0 0 2px #fff3, 0 1px 4px #0002;
					border: 2px solid ${isDark ? "#23263a" : "#fff"};
				}
				.elev-profile-canvas {
					width: 100%;
					min-width: 320px;
					max-width: 100vw;
					height: 200px;
					background: inherit;
					border-radius: 8px;
					box-shadow: 0 2px 8px #0001;
				}
				.no-altitude-data {
					color: ${isDark ? "#b0b8c9" : "#888"};
					font-size: 1em;
					margin-top: 12px;
					text-align: center;
				}
				::-webkit-scrollbar {
					width: 10px;
					background: ${isDark ? "#23263a" : "#e3e8f0"};
				}
				::-webkit-scrollbar-thumb {
					background: ${isDark ? "#2e3347" : "#cfd8dc"};
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
                        filePath: f.filePath || `File ${idx + 1}`,
                        altitudes:
                            f.data && f.data.recordMesgs
                                ? f.data.recordMesgs
                                      .filter((r) => r.positionLat != null && r.positionLong != null && r.altitude != null)
                                      .map((r, i) => ({ x: i, y: r.altitude }))
                                : [],
                        color:
                            window.opener && window.opener.overlayColorPalette
                                ? window.opener.overlayColorPalette[idx % window.opener.overlayColorPalette.length]
                                : "#1976d2",
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
    };
    return btn;
}

// --- Loading overlay for file loading progress ---
function showLoadingOverlay(progressText, fileName = "") {
    let overlay = document.getElementById("fitfile-loading-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "fitfile-loading-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(30,34,40,0.85)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "99999";
        overlay.style.color = "#fff";
        overlay.style.fontSize = "1.3em";
        overlay.innerHTML = `
			<div style="display:flex;flex-direction:column;align-items:center;">
				<div class="modern-spinner" style="margin-bottom:22px;width:54px;height:54px;">
					<style>
					@keyframes fitfile-spin { 100% { transform: rotate(360deg); } }
					.modern-spinner {
						display: inline-block;
						position: relative;
					}
					.modern-spinner svg {
						animation: fitfile-spin 1.1s linear infinite;
						display: block;
					}
					</style>
					<svg viewBox="0 0 50 50" width="54" height="54">
						<circle cx="25" cy="25" r="20" fill="none" stroke="#40c4ff" stroke-width="5" opacity="0.18"/>
						<circle cx="25" cy="25" r="20" fill="none" stroke="#40c4ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 94.2"/>
					</svg>
				</div>
				<div id="fitfile-loading-text" style="font-size:1.15em;font-weight:500;margin-bottom:6px;">Loading...</div>
				<div id="fitfile-loading-filename" style="font-size:0.98em;color:#b3e5fc;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
			</div>
		`;
        document.body.appendChild(overlay);
    }
    const textDiv = document.getElementById("fitfile-loading-text");
    if (textDiv) textDiv.textContent = progressText || "Loading...";
    const fileDiv = document.getElementById("fitfile-loading-filename");
    if (fileDiv) fileDiv.textContent = fileName ? `File: ${fileName}` : "";
}
function hideLoadingOverlay() {
    const overlay = document.getElementById("fitfile-loading-overlay");
    if (overlay) overlay.remove();
}

export function createAddFitFileToMapButton() {
    const addOverlayBtn = document.createElement("button");
    addOverlayBtn.className = "map-action-btn";
    addOverlayBtn.innerHTML =
        '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><path d="M10 2v16M2 10h16" stroke="#1976d2" stroke-width="2" fill="none"/></svg> <span>Add FIT File(s) to Map</span>';
    addOverlayBtn.title = "Overlay one or more FIT files on the map (points and tooltips will be shown)";
    addOverlayBtn.onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".fit";
        input.multiple = true;
        input.style.display = "none";
        input.onchange = async (e) => {
            if (!e.target.files) return; // Ensure files are valid
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                showLoadingOverlay("Loading 0 / " + files.length + " files...");
                let loaded = 0;
                const invalidFiles = [];
                for (const file of files) {
                    showLoadingOverlay("Loading " + (loaded + 1) + " / " + files.length + " files...", file.name);
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.onload = async function (event) {
                            const arrayBuffer = event.target.result;
                            if (arrayBuffer && window.electronAPI && window.electronAPI.decodeFitFile) {
                                const fitData = await window.electronAPI.decodeFitFile(arrayBuffer);
                                if (fitData && !fitData.error) {
                                    if (!window.loadedFitFiles || window.loadedFitFiles.length === 0) {
                                        if (window.globalData && window.globalData.recordMesgs) {
                                            window.loadedFitFiles = [
                                                {
                                                    data: window.globalData,
                                                    filePath: window.globalData?.cachedFilePath,
                                                },
                                            ];
                                        }
                                    }
                                    if (!window.loadedFitFiles.some((f) => f.filePath?.toLowerCase() === file.name.toLowerCase())) {
                                        const validLocationCount = Array.isArray(fitData.recordMesgs)
                                            ? fitData.recordMesgs.filter(
                                                  (r) => typeof r.positionLat === "number" && typeof r.positionLong === "number"
                                              ).length
                                            : 0;
                                        if (
                                            fitData &&
                                            Array.isArray(fitData.recordMesgs) &&
                                            fitData.recordMesgs.length > 0 &&
                                            validLocationCount > 0
                                        ) {
                                            window.loadedFitFiles.push({
                                                data: fitData,
                                                filePath: file.name,
                                            });
                                            if (window.renderMap) window.renderMap();
                                            if (window.updateShownFilesList) window.updateShownFilesList();
                                        } else {
                                            invalidFiles.push(file.name);
                                        }
                                    } else {
                                        alert("This FIT file is already added as an overlay: " + file.name);
                                    }
                                } else {
                                    alert("Failed to parse FIT file: " + file.name + " - " + (fitData.error || "Unknown error"));
                                }
                            }
                            loaded++;
                            showLoadingOverlay("Loading " + loaded + " / " + files.length + " files...", file.name);
                            resolve();
                        };
                        reader.readAsArrayBuffer(file);
                    });
                }
                hideLoadingOverlay();
                if (invalidFiles.length > 0) {
                    alert(`The following files have no valid location data:\n${invalidFiles.join("\n")}`);
                }
            }
        };
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    };
    return addOverlayBtn;
}

// Export the overlay color palette for use in map rendering
export const overlayColorPalette = (function shuffleAndFilter(array) {
    // Remove duplicates
    let unique = Array.from(new Set(array));

    // Helper to compute color distance in RGB space
    function colorDistance(c1, c2) {
        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3)
                hex = hex
                    .split("")
                    .map((x) => x + x)
                    .join("");
            const num = parseInt(hex, 16);
            return [num >> 16, (num >> 8) & 255, num & 255];
        }
        const [r1, g1, b1] = hexToRgb(c1);
        const [r2, g2, b2] = hexToRgb(c2);
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    // Filter out colors that are too similar (distance < 80)
    const filtered = [];
    unique.forEach((color) => {
        if (filtered.every((existing) => colorDistance(color, existing) >= 80)) {
            filtered.push(color);
        }
    });

    // Shuffle for randomness
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered;
})([
    "#00adad",
    "#bf3b00",
    "#0028bf",
    "#960f51",
    "#00bf7e",
    "#83b200",
    "#e70000",
    "#0054bf",
    "#9b0025",
    "#1100be",
    "#ac9201",
    "#0091bf",
    "#ff1989",
    "#004cff",
    "#ff473b",
    "#0029ff",
    "#ff4051",
    "#00e8bb",
    "#ff1a00",
    "#0015ff",
    "#8900fc",
    "#007f54",
    "#4c7700",
    "#006efb",
    "#e21649",
    "#00c2ff",
]);

export function createShownFilesList() {
    const container = document.createElement("div");
    container.className = "shown-files-list";
    container.style.margin = "8px 0";
    container.style.fontSize = "0.95em";
    container.style.border = "1px solid #bbb";
    container.style.borderRadius = "6px";
    container.style.padding = "6px 10px";
    container.style.maxWidth = "350px";
    container.style.overflow = "auto";
    container.style.maxHeight = "80px";
    container.innerHTML = '<b>Extra Files shown on map:</b><ul id="shown-files-ul" style="margin:0; padding-left:18px;"></ul>';

    function applyTheme() {
        const isDark = document.body.classList.contains("theme-dark");
        container.style.background = isDark ? "rgba(30,34,40,0.92)" : "rgba(255,255,255,0.92)";
        container.style.color = isDark ? "#eee" : "#222";
        container.style.border = isDark ? "1px solid #444" : "1px solid #bbb";
    }
    applyTheme();
    document.body.addEventListener("themechange", applyTheme);

    // Helper: Check color contrast (returns true if color is accessible on the given background)
    function isColorAccessible(fg, bg, filter = "") {
        // fg, bg: CSS color strings (e.g., '#fff', 'rgb(30,34,40)')
        // filter: CSS filter string (e.g., 'invert(0.92) ...')
        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3)
                hex = hex
                    .split("")
                    .map((x) => x + x)
                    .join("");
            const num = parseInt(hex, 16);
            return [num >> 16, (num >> 8) & 255, num & 255];
        }
        function parseColor(str) {
            if (str.startsWith("#")) return hexToRgb(str);
            const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
            return [255, 255, 255];
        }
        // If a filter is provided, simulate the filtered color using a temp element
        let fgColor = fg;
        if (filter) {
            const temp = document.createElement("span");
            temp.style.color = fg;
            temp.style.filter = filter;
            temp.style.display = "none";
            document.body.appendChild(temp);
            fgColor = getComputedStyle(temp).color;
            document.body.removeChild(temp);
        }
        const [r1, g1, b1] = parseColor(fgColor);
        const [r2, g2, b2] = parseColor(bg);
        // Relative luminance
        function lum(r, g, b) {
            [r, g, b] = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722;
        }
        const L1 = lum(r1, g1, b1) + 0.05,
            L2 = lum(r2, g2, b2) + 0.05;
        const ratio = L1 > L2 ? L1 / L2 : L2 / L1;
        return ratio >= 3.5; // WCAG AA for UI text
    }

    window.updateShownFilesList = function () {
        const ul = container.querySelector("#shown-files-ul");
        ul.innerHTML = "";
        let anyOverlays = false;
        // Remove main file clickable entry (undo previous change)
        // Only show overlays in the list
        if (window.loadedFitFiles && window.loadedFitFiles.length > 1) {
            window.loadedFitFiles.forEach((f, idx) => {
                if (idx === 0) return; // skip main file
                anyOverlays = true;
                const li = document.createElement("li");
                li.style.position = "relative";
                li.textContent = "File: " + (f.filePath || "(unknown)");
                const colorIdx = idx % overlayColorPalette.length;
                const color = overlayColorPalette[colorIdx];
                const isDark = document.body.classList.contains("theme-dark");
                let filter = "";
                if (isDark) {
                    filter = "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)";
                    li.style.filter = filter;
                }
                const bg = isDark ? "rgb(30,34,40)" : "#fff";
                li.style.color = color;
                li.style.filter = filter;
                li.style.textShadow = isDark ? "0 0 2px #000, 0 0 1px #000, 0 0 1px #000" : "0 0 2px #fff, 0 0 1px #fff, 0 0 1px #fff";
                // Improved: check accessibility using the filtered color as actually rendered
                let filteredColor = color;
                if (filter) {
                    const temp = document.createElement("span");
                    temp.style.color = color;
                    temp.style.filter = filter;
                    temp.style.display = "none";
                    document.body.appendChild(temp);
                    filteredColor = getComputedStyle(temp).color;
                    document.body.removeChild(temp);
                }
                let showWarning = !isColorAccessible(filteredColor, bg);
                let fullPath = f.filePath || "(unknown)";
                li.style.cursor = "pointer";

                // Add remove (X) button, only visible on hover
                const removeBtn = document.createElement("span");
                removeBtn.textContent = "×";
                removeBtn.title = "Remove this overlay";
                removeBtn.style.position = "absolute";
                removeBtn.style.right = "6px";
                removeBtn.style.top = "2px";
                removeBtn.style.fontWeight = "bold";
                removeBtn.style.fontSize = "1.1em";
                removeBtn.style.color = isDark ? "#ff5252" : "#e53935";
                removeBtn.style.background = "transparent";
                removeBtn.style.border = "none";
                removeBtn.style.cursor = "pointer";
                removeBtn.style.opacity = "0";
                removeBtn.style.transition = "opacity 0.15s";
                removeBtn.onmouseenter = (ev) => {
                    removeBtn.style.opacity = "1";
                    ev.stopPropagation();
                };
                removeBtn.onmouseleave = (ev) => {
                    removeBtn.style.opacity = "0";
                    ev.stopPropagation();
                };
                removeBtn.onclick = (ev) => {
                    ev.stopPropagation();
                    if (window.loadedFitFiles) {
                        window.loadedFitFiles.splice(idx, 1);
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(() => {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    }
                };
                li.appendChild(removeBtn);

                li.onclick = () => {
                    window._highlightedOverlayIdx = idx;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    if (li._tooltipRemover) li._tooltipRemover();
                    // Bring the overlay polyline to front and flash highlight
                    if (window._overlayPolylines && window._overlayPolylines[idx]) {
                        const polyline = window._overlayPolylines[idx];
                        if (polyline.bringToFront) polyline.bringToFront();
                        // --- Also bring overlay markers to front ---
                        if (window.L && window.L.CircleMarker && polyline._map && polyline._map._layers) {
                            Object.values(polyline._map._layers).forEach((layer) => {
                                if (
                                    layer instanceof window.L.CircleMarker &&
                                    layer.options &&
                                    polyline.options &&
                                    layer.options.color === polyline.options.color
                                ) {
                                    if (layer.bringToFront) layer.bringToFront();
                                }
                            });
                        }
                        const polyElem = polyline.getElement && polyline.getElement();
                        if (polyElem) {
                            polyElem.style.transition = "filter 0.2s";
                            polyElem.style.filter = "drop-shadow(0 0 16px " + (polyline.options.color || "#1976d2") + ")";
                            setTimeout(() => {
                                if (window._highlightedOverlayIdx === idx) {
                                    polyElem.style.filter = "drop-shadow(0 0 8px " + (polyline.options.color || "#1976d2") + ")";
                                }
                            }, 250);
                            // Center and fit map to this overlay
                            if (polyline.getBounds && window._leafletMapInstance) {
                                window._leafletMapInstance.fitBounds(polyline.getBounds(), {
                                    padding: [20, 20],
                                });
                            }
                        }
                    }
                };

                li._tooltipTimeout = null;
                li._tooltipRemover = null;
                li.onmouseenter = (e) => {
                    window._highlightedOverlayIdx = idx;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    removeBtn.style.opacity = "1";

                    // Tooltip delay and singleton logic
                    if (window._overlayTooltipTimeout) clearTimeout(window._overlayTooltipTimeout);
                    // Remove any existing tooltip immediately
                    const oldTooltips = document.querySelectorAll(".overlay-filename-tooltip");
                    oldTooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                    if (li._tooltipRemover) li._tooltipRemover();

                    window._overlayTooltipTimeout = setTimeout(() => {
                        // Only show if still hovered
                        if (window._highlightedOverlayIdx !== idx) return;
                        let tooltip = document.createElement("div");
                        tooltip.className = "overlay-filename-tooltip";
                        tooltip.style.position = "fixed";
                        tooltip.style.zIndex = 9999;
                        tooltip.style.pointerEvents = "none";
                        tooltip.style.background = isDark ? "#23263a" : "#fff";
                        tooltip.style.color = isDark ? "#fff" : "#222";
                        tooltip.style.border = "1px solid " + (isDark ? "#444" : "#bbb");
                        tooltip.style.borderRadius = "4px";
                        tooltip.style.padding = "6px 10px";
                        tooltip.style.fontSize = "0.95em";
                        tooltip.style.boxShadow = "0 2px 8px #0003";
                        let html = "<b>File:</b> " + fullPath;
                        if (showWarning) {
                            html += '<br><span style="color:#eab308;">⚠️ This color may be hard to read in this theme.</span>';
                        }
                        tooltip.innerHTML = html;
                        document.body.appendChild(tooltip);
                        const moveTooltip = (evt) => {
                            const pad = 12;
                            let x = evt.clientX + pad;
                            let y = evt.clientY + pad;
                            if (x + tooltip.offsetWidth > window.innerWidth) x = window.innerWidth - tooltip.offsetWidth - pad;
                            if (y + tooltip.offsetHeight > window.innerHeight) y = window.innerHeight - tooltip.offsetHeight - pad;
                            tooltip.style.left = x + "px";
                            tooltip.style.top = y + "px";
                        };
                        moveTooltip(e);
                        window.addEventListener("mousemove", moveTooltip);
                        li._tooltipRemover = () => {
                            window.removeEventListener("mousemove", moveTooltip);
                            if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
                        };
                    }, 350);
                };
                li.onmouseleave = () => {
                    window._highlightedOverlayIdx = null;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    removeBtn.style.opacity = "0";
                    if (window._overlayTooltipTimeout) {
                        clearTimeout(window._overlayTooltipTimeout);
                        window._overlayTooltipTimeout = null;
                    }
                    if (li._tooltipRemover) li._tooltipRemover();
                    // Remove any lingering tooltips from the DOM
                    setTimeout(() => {
                        const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                        tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                    }, 10);
                };
                ul.appendChild(li);
            });
            // Add Clear All button if overlays exist
            if (anyOverlays && !ul.parentNode.querySelector(".overlay-clear-all-btn")) {
                const clearAll = document.createElement("button");
                clearAll.textContent = "Clear All";
                clearAll.className = "overlay-clear-all-btn";
                clearAll.style.margin = "8px 0 0 0";
                clearAll.style.padding = "3px 12px";
                clearAll.style.fontSize = "0.95em";
                clearAll.style.background = "#e53935";
                clearAll.style.color = "#fff";
                clearAll.style.border = "none";
                clearAll.style.borderRadius = "4px";
                clearAll.style.cursor = "pointer";
                clearAll.style.float = "right";
                clearAll.title = "Remove all overlays from the map";
                clearAll.onclick = (ev) => {
                    ev.stopPropagation();
                    if (window.loadedFitFiles) {
                        window.loadedFitFiles.splice(1);
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(() => {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    }
                };
                ul.parentNode.appendChild(clearAll);
            }
            container.style.display = "";
        } else {
            container.style.display = "none";
        }
    };
    // Hide initially if no overlays
    if (!(window.loadedFitFiles && window.loadedFitFiles.length > 1)) {
        container.style.display = "none";
    }

    return container;
}

export function getOverlayFileName(idx) {
    if (window.loadedFitFiles && window.loadedFitFiles[idx] && window.loadedFitFiles[idx].filePath) {
        return window.loadedFitFiles[idx].filePath;
    }
    return "";
}

export function createMarkerCountSelector(onChange) {
    const container = document.createElement("div");
    container.className = "map-action-btn marker-count-container";

    const label = document.createElement("label");
    label.textContent = "Data Points:";
    label.setAttribute("for", "marker-count-select");
    label.className = "marker-count-label";

    const select = document.createElement("select");
    select.id = "marker-count-select";
    select.className = "marker-count-select";

    const options = [10, 25, 50, 100, 200, 500, 1000, "All"];
    options.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val === "All" ? "all" : val;
        opt.textContent = val;
        select.appendChild(opt);
    });

    // Set initial value from global or default
    let initial;
    const validOptions = [10, 25, 50, 100, 200, 500, 1000, "all"];
    if (window.mapMarkerCount === undefined) {
        window.mapMarkerCount = 50;
        initial = 50;
    } else if (window.mapMarkerCount === 0) {
        initial = "all";
    } else if (validOptions.includes(window.mapMarkerCount)) {
        initial = window.mapMarkerCount;
    } else {
        initial = 50; // Fallback to default if unsupported value
        window.mapMarkerCount = 50;
    }
    select.value = initial;

    select.onchange = function () {
        let val = select.value;
        if (val === "all") {
            window.mapMarkerCount = 0;
        } else {
            window.mapMarkerCount = parseInt(val, 10);
        }
        if (typeof onChange === "function") onChange(window.mapMarkerCount);
        if (window.updateShownFilesList) window.updateShownFilesList();
    };

    // Add mouse wheel support for changing marker count
    select.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            const options = Array.from(select.options);
            let idx = select.selectedIndex;
            if (e.deltaY > 0 && idx < options.length - 1) {
                select.selectedIndex = idx + 1;
                select.dispatchEvent(new Event("change", { bubbles: false, cancelable: true, composed: false }));
            } else if (e.deltaY < 0 && idx > 0) {
                select.selectedIndex = idx - 1;
                select.dispatchEvent(new Event("change", { bubbles: false, cancelable: true, composed: false }));
            }
        },
        { passive: false }
    );

    container.appendChild(label);
    container.appendChild(select);

    return container;
}

// --- Make #activeFileName clickable and highlightable, always ---
function setupActiveFileNameMapActions() {
    const activeFileName = document.getElementById("activeFileName");
    if (!activeFileName) {
        console.log("[FFV] #activeFileName not found in DOM");
        return;
    }
    activeFileName.style.cursor = "pointer";
    activeFileName.title = "Click to center map on main file";
    // Remove any previous listeners to avoid stacking
    activeFileName.onclick = null;
    activeFileName.onmouseenter = null;
    activeFileName.onmouseleave = null;

    activeFileName.onclick = () => {
        console.log("[FFV] #activeFileName clicked");
        // Switch to map tab if not active
        const mapTabBtn = document.querySelector('[data-tab="map"]');
        if (mapTabBtn && !mapTabBtn.classList.contains("active")) {
            console.log("[FFV] Switching to map tab");
            mapTabBtn.click();
        }
        setTimeout(() => {
            // Always zoom to ONLY the main file polyline, never all overlays
            const idx = 0;
            console.log("[FFV] Attempting to zoom to main polyline.");
            console.log("[FFV] window._overlayPolylines:", window._overlayPolylines);
            if (window._overlayPolylines && window._overlayPolylines[idx]) {
                window._highlightedOverlayIdx = idx;
                if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                const polyline = window._overlayPolylines[idx];
                if (polyline.bringToFront) polyline.bringToFront();
                if (window.L && window.L.CircleMarker && polyline._map && polyline._map._layers) {
                    Object.values(polyline._map._layers).forEach((layer) => {
                        if (
                            layer instanceof window.L.CircleMarker &&
                            layer.options &&
                            polyline.options &&
                            layer.options.color === polyline.options.color
                        ) {
                            if (layer.bringToFront) layer.bringToFront();
                        }
                    });
                }
                const polyElem = polyline.getElement && polyline.getElement();
                if (polyElem) {
                    polyElem.style.transition = "filter 0.2s";
                    polyElem.style.filter = "drop-shadow(0 0 16px " + (polyline.options.color || "#1976d2") + ")";
                    setTimeout(() => {
                        if (window._highlightedOverlayIdx === idx) {
                            polyElem.style.filter = "drop-shadow(0 0 8px " + (polyline.options.color || "#1976d2") + ")";
                        }
                    }, 250);
                }
                // --- CRITICAL: Only fitBounds to the main polyline, never all overlays ---
                if (window._leafletMapInstance) {
                    let bounds = null;
                    if (
                        window._mainPolylineOriginalBounds &&
                        window._mainPolylineOriginalBounds.isValid &&
                        window._mainPolylineOriginalBounds.isValid()
                    ) {
                        bounds = window._mainPolylineOriginalBounds;
                        console.log("[FFV] Using window._mainPolylineOriginalBounds for fitBounds:", bounds);
                    } else if (polyline.getBounds) {
                        bounds = polyline.getBounds();
                        console.warn("[FFV] window._mainPolylineOriginalBounds missing or invalid, falling back to polyline.getBounds():", bounds);
                    } else {
                        console.warn("[FFV] No valid bounds found for main polyline.");
                    }
                    if (bounds && bounds.isValid && bounds.isValid()) {
                        console.log("[FFV] Calling fitBounds with:", bounds, { padding: [20, 20] });
                        window._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });
                        setTimeout(() => {
                            try {
                                const center = window._leafletMapInstance.getCenter();
                                const zoom = window._leafletMapInstance.getZoom();
                                console.log("[FFV] After fitBounds: map center:", center, "zoom:", zoom);
                            } catch (err) {
                                console.warn("[FFV] Error getting map center/zoom after fitBounds:", err);
                            }
                        }, 200);
                    } else {
                        console.warn("[FFV] fitBounds: bounds are missing or invalid:", bounds);
                    }
                } else {
                    if (!window._leafletMapInstance) console.warn("[FFV] window._leafletMapInstance is missing");
                }
                // Log overlays for debugging
                if (window.loadedFitFiles) {
                    console.log("[FFV] loadedFitFiles count:", window.loadedFitFiles.length, window.loadedFitFiles);
                }
            } else {
                console.log("[FFV] No main polyline found in window._overlayPolylines[0]");
                console.log("[FFV] window._overlayPolylines:", window._overlayPolylines);
            }
        }, 0);
    };
    activeFileName.onmouseenter = () => {
        console.log("[FFV] #activeFileName mouseenter");
        window._highlightedOverlayIdx = 0;
        if (window.updateOverlayHighlights) window.updateOverlayHighlights();
    };
    activeFileName.onmouseleave = () => {
        console.log("[FFV] #activeFileName mouseleave");
        window._highlightedOverlayIdx = null;
        if (window.updateOverlayHighlights) window.updateOverlayHighlights();
    };
}

// --- MutationObserver to keep #activeFileName interactive even if replaced ---
(function observeActiveFileName() {
    const parent = document.getElementById("activeFileName")?.parentNode;
    if (!parent) {
        console.log("[FFV] #activeFileName parent not found for MutationObserver");
        return;
    }
    const observer = new MutationObserver(() => {
        console.log("[FFV] MutationObserver: childList changed, reapplying setupActiveFileNameMapActions");
        setupActiveFileNameMapActions();
    });
    observer.observe(parent, { childList: true, subtree: false });
    // Also re-apply on DOMContentLoaded just in case
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("[FFV] DOMContentLoaded: running setupActiveFileNameMapActions");
            setupActiveFileNameMapActions();
        });
    } else {
        setupActiveFileNameMapActions();
    }
})();

// Also rerun after overlays update
window._setupActiveFileNameMapActions = setupActiveFileNameMapActions;

// Patch updateShownFilesList to always call setupActiveFileNameMapActions
const origUpdateShownFilesList = window.updateShownFilesList;
window.updateShownFilesList = function () {
    if (origUpdateShownFilesList) origUpdateShownFilesList.apply(this, arguments);
    console.log("[FFV] updateShownFilesList: running setupActiveFileNameMapActions");
    setupActiveFileNameMapActions();
};
