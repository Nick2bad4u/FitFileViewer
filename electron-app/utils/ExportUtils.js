import { showChartSelectionModal } from "./createSettingsHeader.js";
import { showNotification } from "./showNotification.js";

/* global JSZip */

// Export utilities
export const ExportUtils = {
    /**
     * Gets the theme background color for exports
     * @returns {string} Background color based on export theme setting
     */
    getExportThemeBackground() {
        const theme = localStorage.getItem("chartjs_exportTheme") || "light";
        switch (theme) {
            case "dark":
                return "#1a1a1a";
            case "transparent":
                return "transparent";
            case "light":
            default:
                return "#ffffff";
        }
    },

    /**
     * Downloads chart as PNG image with theme-aware background
     * @param {Chart} chart - Chart.js instance
     * @param {string} filename - Download filename
     */ async downloadChartAsPNG(chart, filename = "chart.png") {
        try {
            const backgroundColor = ExportUtils.getExportThemeBackground();
            const link = document.createElement("a");
            link.download = filename;
            link.href = chart.toBase64Image("image/png", 1.0, backgroundColor);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification(`Chart exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart as PNG:", error);
            showNotification("Failed to export chart as PNG", "error");
        }
    },

    /**
     * Creates a combined image of all charts
     * @param {Array} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */ async createCombinedChartsImage(charts, filename = "combined-charts.png") {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = ExportUtils.getExportThemeBackground();
            const combinedCanvas = document.createElement("canvas");
            const ctx = combinedCanvas.getContext("2d");

            // Calculate dimensions for grid layout
            const cols = Math.ceil(Math.sqrt(charts.length));
            const rows = Math.ceil(charts.length / cols);
            const chartWidth = 800;
            const chartHeight = 400;
            const padding = 20;

            combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
            combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

            // Set background
            if (backgroundColor !== "transparent") {
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
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = chartWidth;
                tempCanvas.height = chartHeight;
                const tempCtx = tempCanvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    tempCtx.fillStyle = backgroundColor;
                    tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                }

                // Draw chart on temp canvas
                tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);

                // Draw temp canvas onto combined canvas
                ctx.drawImage(tempCanvas, x, y);
            });

            // Download the combined image
            const link = document.createElement("a");
            link.download = filename;
            link.href = combinedCanvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification("Combined charts exported", "success");
        } catch (error) {
            console.error("Error creating combined charts image:", error);
            showNotification("Failed to create combined image", "error");
        }
    },

    /**
     * Copies chart image to clipboard with theme background
     * @param {Chart} chart - Chart.js instance
     */ async copyChartToClipboard(chart) {
        try {
            const backgroundColor = ExportUtils.getExportThemeBackground();

            // Create canvas with theme background
            const canvas = document.createElement("canvas");
            canvas.width = chart.canvas.width;
            canvas.height = chart.canvas.height;
            const ctx = canvas.getContext("2d");

            if (backgroundColor !== "transparent") {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(chart.canvas, 0, 0);

            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    showNotification("Chart copied to clipboard", "success");
                } catch (clipboardError) {
                    console.error("Clipboard API failed:", clipboardError);
                    showNotification("Failed to copy chart to clipboard", "error");
                }
            }, "image/png");
        } catch (error) {
            console.error("Error copying chart to clipboard:", error);
            showNotification("Failed to copy chart to clipboard", "error");
        }
    },

    /**
     * Copies combined charts image to clipboard
     * @param {Array} charts - Array of Chart.js instances
     */
    async copyCombinedChartsToClipboard(charts) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = ExportUtils.getExportThemeBackground();
            const combinedCanvas = document.createElement("canvas");
            const ctx = combinedCanvas.getContext("2d");

            // Calculate dimensions for grid layout
            const cols = Math.ceil(Math.sqrt(charts.length));
            const rows = Math.ceil(charts.length / cols);
            const chartWidth = 800;
            const chartHeight = 400;
            const padding = 20;

            combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
            combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

            // Set background
            if (backgroundColor !== "transparent") {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
            }

            // Draw each chart
            charts.forEach((chart, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = col * (chartWidth + padding);
                const y = row * (chartHeight + padding);

                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = chartWidth;
                tempCanvas.height = chartHeight;
                const tempCtx = tempCanvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    tempCtx.fillStyle = backgroundColor;
                    tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                }

                tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                ctx.drawImage(tempCanvas, x, y);
            });

            // Copy to clipboard
            combinedCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    showNotification("Combined charts copied to clipboard", "success");
                } catch (clipboardError) {
                    console.error("Clipboard API failed:", clipboardError);
                    showNotification("Failed to copy combined charts to clipboard", "error");
                }
            }, "image/png");
        } catch (error) {
            console.error("Error copying combined charts to clipboard:", error);
            showNotification("Failed to copy combined charts to clipboard", "error");
        }
    },

    /**
     * Uploads image to Imgur and returns URL
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Imgur URL
     */
    async uploadToImgur(base64Image) {
        const clientId = "0046ee9e30ac578"; // User needs to replace this

        if (clientId === "YOUR_IMGUR_CLIENT_ID") {
            throw new Error("Imgur client ID not configured. Please add your Imgur client ID to the ExportUtils.uploadToImgur function.");
        }

        try {
            const response = await fetch("https://api.imgur.com/3/image", {
                method: "POST",
                headers: {
                    Authorization: `Client-ID ${clientId}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: base64Image.split(",")[1], // Remove data:image/png;base64, prefix
                    type: "base64",
                    title: "FitFileViewer Chart",
                    description: "Chart exported from FitFileViewer",
                }),
            });

            if (!response.ok) {
                throw new Error(`Imgur upload failed: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                return data.data.link;
            } else {
                throw new Error("Imgur upload failed");
            }
        } catch (error) {
            console.error("Error uploading to Imgur:", error);
            throw error;
        }
    },

    /**
     * Exports chart data as CSV
     * @param {Array} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    async exportChartDataAsCSV(chartData, fieldName, filename = "chart-data.csv") {
        try {
            const headers = ["timestamp", fieldName];
            const csvContent = [headers.join(","), ...chartData.map((point) => `${point.x},${point.y}`)].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as CSV:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /**
     * Exports combined chart data as CSV
     * @param {Array} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */
    async exportCombinedChartsDataAsCSV(charts, filename = "combined-charts-data.csv") {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            // Get all unique timestamps
            const allTimestamps = new Set();
            charts.forEach((chart) => {
                const dataset = chart.data.datasets[0];
                if (dataset && dataset.data) {
                    dataset.data.forEach((point) => allTimestamps.add(point.x));
                }
            });

            const timestamps = Array.from(allTimestamps).sort();

            // Create headers
            const headers = ["timestamp"];
            charts.forEach((chart) => {
                const dataset = chart.data.datasets[0];
                const fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            });

            // Create data rows
            const rows = [headers.join(",")];
            timestamps.forEach((timestamp) => {
                const row = [timestamp];
                charts.forEach((chart) => {
                    const dataset = chart.data.datasets[0];
                    const point = dataset?.data?.find((p) => p.x === timestamp);
                    row.push(point ? point.y : "");
                });
                rows.push(row.join(","));
            });

            const csvContent = rows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`Combined data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting combined chart data as CSV:", error);
            showNotification("Failed to export combined chart data", "error");
        }
    },

    /**
     * Exports chart data as JSON
     * @param {Array} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    async exportChartDataAsJSON(chartData, fieldName, filename = "chart-data.json") {
        try {
            const jsonData = {
                field: fieldName,
                data: chartData,
                exportedAt: new Date().toISOString(),
                totalPoints: chartData.length,
            };

            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as JSON:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /**
     * Exports all charts and data as a ZIP file
     * @param {Array} charts - Array of Chart.js instances
     */
    async exportAllAsZip(charts) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }
            if (typeof JSZip === "undefined") {
                throw new Error("JSZip library not loaded");
            }

            const zip = new JSZip(); // JSZip is loaded globally via script tag
            const backgroundColor = ExportUtils.getExportThemeBackground();

            // Add individual chart images
            for (let i = 0; i < charts.length; i++) {
                const chart = charts[i];
                const dataset = chart.data.datasets[0];
                const fieldName = dataset?.label || `chart-${i}`;
                const safeFieldName = fieldName.replace(/[^a-zA-Z0-9]/g, "-");

                // Add chart image
                const canvas = document.createElement("canvas");
                canvas.width = chart.canvas.width;
                canvas.height = chart.canvas.height;
                const ctx = canvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(chart.canvas, 0, 0);
                const imageData = canvas.toDataURL("image/png").split(",")[1];
                zip.file(`${safeFieldName}-chart.png`, imageData, { base64: true });

                // Add chart data as CSV
                if (dataset && dataset.data) {
                    const headers = ["timestamp", fieldName];
                    const csvContent = [headers.join(","), ...dataset.data.map((point) => `${point.x},${point.y}`)].join("\n");
                    zip.file(`${safeFieldName}-data.csv`, csvContent);
                }

                // Add chart data as JSON
                if (dataset && dataset.data) {
                    const jsonData = {
                        field: fieldName,
                        data: dataset.data,
                        exportedAt: new Date().toISOString(),
                        totalPoints: dataset.data.length,
                        chartType: chart.config.type,
                    };
                    zip.file(`${safeFieldName}-data.json`, JSON.stringify(jsonData, null, 2));
                }
            }

            // Add combined charts image
            if (charts.length > 1) {
                const combinedCanvas = document.createElement("canvas");
                const ctx = combinedCanvas.getContext("2d");

                const cols = Math.ceil(Math.sqrt(charts.length));
                const rows = Math.ceil(charts.length / cols);
                const chartWidth = 800;
                const chartHeight = 400;
                const padding = 20;

                combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

                if (backgroundColor !== "transparent") {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                }

                charts.forEach((chart, index) => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = col * (chartWidth + padding);
                    const y = row * (chartHeight + padding);

                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = chartWidth;
                    tempCanvas.height = chartHeight;
                    const tempCtx = tempCanvas.getContext("2d");

                    if (backgroundColor !== "transparent") {
                        tempCtx.fillStyle = backgroundColor;
                        tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                    }

                    tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                    ctx.drawImage(tempCanvas, x, y);
                });

                const combinedImageData = combinedCanvas.toDataURL("image/png").split(",")[1];
                zip.file("combined-charts.png", combinedImageData, { base64: true });
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
                        totalPoints: dataset?.data ? dataset.data.length : 0,
                    };
                }),
            };
            zip.file("combined-data.json", JSON.stringify(allChartsData, null, 2));

            // Generate and download ZIP
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `fitfile-charts-${new Date().toISOString().split("T")[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`ZIP file with ${charts.length} charts exported`, "success");
        } catch (error) {
            console.error("Error creating ZIP export:", error);
            showNotification("Failed to create ZIP export", "error");
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
            charts.forEach((chart) => {
                const dataset = chart.data.datasets[0];
                if (dataset && dataset.data) {
                    dataset.data.forEach((point) => allTimestamps.add(point.x));
                }
            });

            const timestamps = Array.from(allTimestamps).sort();

            const headers = ["timestamp"];
            charts.forEach((chart) => {
                const dataset = chart.data.datasets[0];
                const fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            });

            const rows = [headers.join(",")];
            timestamps.forEach((timestamp) => {
                const row = [timestamp];
                charts.forEach((chart) => {
                    const dataset = chart.data.datasets[0];
                    const point = dataset?.data?.find((p) => p.x === timestamp);
                    row.push(point ? point.y : "");
                });
                rows.push(row.join(","));
            });

            const csvContent = rows.join("\n");
            zip.file("combined-data.csv", csvContent);
        } catch (error) {
            console.error("Error adding combined CSV to ZIP:", error);
        }
    },

    /**
     * Prints the chart with theme background
     * @param {Chart} chart - Chart.js instance
     */ async printChart(chart) {
        try {
            const backgroundColor = ExportUtils.getExportThemeBackground();
            const printWindow = window.open("", "_blank");

            // Create canvas with theme background
            const canvas = document.createElement("canvas");
            canvas.width = chart.canvas.width;
            canvas.height = chart.canvas.height;
            const ctx = canvas.getContext("2d");

            if (backgroundColor !== "transparent") {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(chart.canvas, 0, 0);
            const imgData = canvas.toDataURL("image/png", 1.0);

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

            showNotification("Chart sent to printer", "success");
        } catch (error) {
            console.error("Error printing chart:", error);
            showNotification("Failed to print chart", "error");
        }
    },

    /**
     * Prints multiple charts in a combined format
     * @param {Array} charts - Array of Chart.js instances
     */
    printCombinedCharts(charts) {
        try {
            if (!charts || charts.length === 0) {
                showNotification("No charts available to print", "warning");
                return;
            }

            const backgroundColor = ExportUtils.getExportThemeBackground();
            const printWindow = window.open("", "_blank");
            let htmlContent = `
				<html>
					<head>
						<title>Charts Print</title>
						<style>
							body { 
								margin: 20px; 
								font-family: Arial, sans-serif; 
								background: ${backgroundColor === "transparent" ? "#ffffff" : backgroundColor};
								color: ${backgroundColor === "#1a1a1a" ? "#ffffff" : "#000000"};
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
								color: ${backgroundColor === "#1a1a1a" ? "#ffffff" : "#333"};
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
                const canvas = document.createElement("canvas");
                canvas.width = chart.canvas.width;
                canvas.height = chart.canvas.height;
                const ctx = canvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(chart.canvas, 0, 0);
                const imgData = canvas.toDataURL("image/png", 1.0);

                htmlContent += `
					<div class="chart">
						<h3>${fieldName}</h3>
						<img src="${imgData}" alt="${fieldName} Chart" />
					</div>
				`;
            });

            htmlContent += "</body></html>";

            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

            showNotification("Charts sent to printer", "success");
        } catch (error) {
            console.error("Error printing combined charts:", error);
            showNotification("Failed to print charts", "error");
        }
    },
    /**
     * Shares charts as URL with image upload to Imgur
     */
    async shareChartsAsURL() {
        showChartSelectionModal(
            "share URL",
            // Single chart callback
            async (chartIndex) => {
                try {
                    const charts = window._chartjsInstances;
                    if (!charts || chartIndex >= charts.length) {
                        showNotification("Chart not found", "error");
                        return;
                    }

                    const chart = charts[chartIndex];
                    showNotification("Uploading chart to Imgur...", "info");

                    const backgroundColor = ExportUtils.getExportThemeBackground();

                    const canvas = document.createElement("canvas");
                    canvas.width = chart.canvas.width;
                    canvas.height = chart.canvas.height;
                    const ctx = canvas.getContext("2d");

                    if (backgroundColor !== "transparent") {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    ctx.drawImage(chart.canvas, 0, 0);
                    const base64Image = canvas.toDataURL("image/png", 1.0);

                    const imgurUrl = await ExportUtils.uploadToImgur(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(imgurUrl);
                    showNotification("Chart uploaded! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing single chart as URL:", error);
                    if (error.message.includes("Imgur client ID not configured")) {
                        showNotification(
                            "Imgur client ID not configured. Please update the ExportUtils.uploadToImgur function with your Imgur client ID.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share chart. Please try again.", "error");
                    }
                }
            },
            // Combined charts callback
            async () => {
                try {
                    const charts = window._chartjsInstances;
                    if (!charts || charts.length === 0) {
                        showNotification("No charts available to share", "warning");
                        return;
                    }

                    showNotification("Uploading combined charts to Imgur...", "info");

                    const backgroundColor = ExportUtils.getExportThemeBackground();
                    const combinedCanvas = document.createElement("canvas");
                    const ctx = combinedCanvas.getContext("2d");

                    const cols = Math.ceil(Math.sqrt(charts.length));
                    const rows = Math.ceil(charts.length / cols);
                    const chartWidth = 800;
                    const chartHeight = 400;
                    const padding = 20;

                    combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                    combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

                    if (backgroundColor !== "transparent") {
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                    }

                    charts.forEach((chart, index) => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = col * (chartWidth + padding);
                        const y = row * (chartHeight + padding);

                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = chartWidth;
                        tempCanvas.height = chartHeight;
                        const tempCtx = tempCanvas.getContext("2d");

                        if (backgroundColor !== "transparent") {
                            tempCtx.fillStyle = backgroundColor;
                            tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                        }

                        tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                        ctx.drawImage(tempCanvas, x, y);
                    });

                    const base64Image = combinedCanvas.toDataURL("image/png", 1.0);
                    const imgurUrl = await ExportUtils.uploadToImgur(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(imgurUrl);
                    showNotification("Combined charts uploaded! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing combined charts as URL:", error);
                    if (error.message.includes("Imgur client ID not configured")) {
                        showNotification(
                            "Imgur client ID not configured. Please update the ExportUtils.uploadToImgur function with your Imgur client ID.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share charts. Please try again.", "error");
                    }
                }
            }
        );
    },
}; // Global export functions for the settings panel

export function exportAllCharts() {
    if (!window._chartjsInstances || window._chartjsInstances.length === 0) {
        showNotification("No charts available to export", "warning");
        return;
    }

    try {
        window._chartjsInstances.forEach((chart, index) => {
            const field = chart.data.datasets[0]?.label || `chart-${index}`;
            const filename = `${field.replace(/\s+/g, "-").toLowerCase()}-chart.png`;
            ExportUtils.downloadChartAsPNG(chart, filename);
        });
        showNotification(`Exported ${window._chartjsInstances.length} charts`, "success");
    } catch (error) {
        console.error("Error exporting all charts:", error);
        showNotification("Failed to export charts", "error");
    }
}
