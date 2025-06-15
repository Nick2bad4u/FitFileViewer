// Configuration constants
const ZWIFT_MAP_URL = "https://zwiftmap.com/";

export function setupWindowOnload({ toggleTabVisibility, setActiveTab, setupTabButton, displayTables, renderChart, renderMap, renderSummary }) {
    window.onload = () => {
        // Default: show the Map tab
        toggleTabVisibility("content-map");

        // Tab button click handlers (refactored to loop)
        const tabConfig = [
            {
                id: "tab-data",
                content: "content-data",
                handler: () => {
                    if (document.getElementById("tab-data").classList.contains("active")) return;
                    toggleTabVisibility("content-data");
                    setActiveTab("tab-data");
                    // If data is pre-rendered in background, move it to visible container
                    const bg = document.getElementById("background-data-container");
                    const visible = document.getElementById("content-data");
                    if (bg && bg.childNodes.length > 0 && visible) {
                        visible.innerHTML = "";
                        while (bg.firstChild) visible.appendChild(bg.firstChild);
                    } else {
                        if (typeof window.globalData === "object" && window.globalData !== null && Object.keys(window.globalData).length > 0) {
                            window.displayTables(window.globalData);
                        }
                    }
                },
            },
            {
                id: "tab-chartjs",
                content: "content-chartjs",
                handler: () => {
                    if (document.getElementById("tab-chartjs").classList.contains("active")) return;
                    toggleTabVisibility("content-chartjs");
                    setActiveTab("tab-chartjs");
                    if (typeof window.renderChartJS === "function") {
                        window.renderChartJS("chartjs-chart-container");
                    }
                },
            },
            {
                id: "tab-map",
                content: "content-map",
                handler: () => {
                    if (document.getElementById("tab-map").classList.contains("active")) return;
                    toggleTabVisibility("content-map");
                    setActiveTab("tab-map");
                    if (!window.isMapRendered) {
                        window.renderMap();
                        window.isMapRendered = true;
                    }
                },
            },
            {
                id: "tab-summary",
                content: "content-summary",
                handler: () => {
                    if (document.getElementById("tab-summary").classList.contains("active")) return;
                    toggleTabVisibility("content-summary");
                    setActiveTab("tab-summary");
                    if (window.globalData && Object.keys(window.globalData).length > 0) {
                        if (!window.previousGlobalData || JSON.stringify(window.previousGlobalData) !== JSON.stringify(window.globalData)) {
                            window.previousGlobalData = JSON.parse(JSON.stringify(window.globalData));
                            setTimeout(() => {
                                window.renderSummary(window.globalData);
                            }, 0);
                        }
                    }
                },
            },
            {
                id: "tab-altfit",
                content: "content-altfit",
                handler: () => {
                    if (document.getElementById("tab-altfit").classList.contains("active")) return;
                    toggleTabVisibility("content-altfit");
                    setActiveTab("tab-altfit");
                    // Dynamically set iframe src when tab is activated
                    const iframe = document.getElementById("altfit-iframe");
                    if (iframe && !iframe.src.includes("libs/ffv/index.html")) {
                        iframe.src = "libs/ffv/index.html";
                    }
                },
            },
            {
                id: "tab-zwift",
                content: "content-zwift",
                handler: () => {
                    console.debug("[Zwift Tab] Handler called");
                    const tab = document.getElementById("tab-zwift");
                    const content = document.getElementById("content-zwift");
                    console.debug(`[Zwift Tab] tab and content:`, { tab, content });
                    // Return early if the tab is already active to avoid redundant operations
                    if (tab && tab.classList.contains("active")) {
                        console.debug("[Zwift Tab] Already active, returning");
                        return;
                    }
                    toggleTabVisibility("content-zwift");
                    console.debug("[Zwift Tab] Called toggleTabVisibility");
                    setActiveTab("tab-zwift");
                    console.debug("[Zwift Tab] Called setActiveTab");
                    const zwiftIframe = document.getElementById("zwift-iframe");
                    console.debug("[Zwift Tab] zwiftIframe:", zwiftIframe);
                    if (zwiftIframe && zwiftIframe.src !== ZWIFT_MAP_URL) {
                        zwiftIframe.src = ZWIFT_MAP_URL;
                        console.debug("[Zwift Tab] Set zwiftIframe.src");
                    }
                },
            },
        ];

        // Refactor tabConfig.forEach to use a reusable function
        tabConfig.forEach(({ id, handler }) => setupTabButton(id, handler));

        // Alt FIT Reader logic
        const altFitBtn = document.getElementById("altfit-open-btn");
        if (altFitBtn) {
            altFitBtn.onclick = async () => {
                const lib = document.getElementById("fit-lib-select").value;
                const decrypt = document.getElementById("fit-decrypt-select").value;
                const resultDiv = document.getElementById("altfit-result");
                resultDiv.innerHTML = "";
                try {
                    // Placeholder: open file dialog and parse using selected lib/method
                    if (!window.electronAPI || !window.electronAPI.openFileDialog) {
                        resultDiv.innerHTML = '<span class="text-red">Electron API not available.</span>';
                        return;
                    }
                    const file = await window.electronAPI.openFileDialog();
                    if (!file) return;
                    let arrayBuffer = await window.electronAPI.readFile(file);
                    let result;
                    if (lib === "default") {
                        result = await window.electronAPI.parseFitFile(arrayBuffer, {
                            decrypt,
                        });
                    } else {
                        // Placeholder for alternative library logic
                        result = { error: "Alternative FIT library not implemented yet." };
                    }
                    if (result && result.error) {
                        resultDiv.innerHTML = `<span class='text-red'>Error: ${result.error}</span>`;
                    } else {
                        resultDiv.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
                    }
                } catch (err) {
                    resultDiv.innerHTML = `<span class='text-red'>Error: ${err}</span>`;
                }
            };
        }

        // Listen for fitData message from the extension
        window.addEventListener("message", (event) => {
            const message = event.data;
            if (
                message &&
                typeof message === "object" &&
                "type" in message &&
                message.type === "fitData" &&
                "data" in message &&
                typeof message.data === "object"
            ) {
                window.globalData = message.data;
                displayTables(window.globalData);
                const tabChart = document.getElementById("tab-chart");
                const tabMap = document.getElementById("tab-map");
                const tabSummary = document.getElementById("tab-summary");
                if (tabChart && tabChart.classList.contains("active")) {
                    renderChart();
                }
                if (tabMap && tabMap.classList.contains("active")) {
                    renderMap();
                }
                if (tabSummary && tabSummary.classList.contains("active")) {
                    renderSummary(window.globalData);
                }
            }
        });
    };
}
