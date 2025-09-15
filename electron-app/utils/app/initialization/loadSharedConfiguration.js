import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";

// Function to load shared configuration from URL
export function loadSharedConfiguration() {
    try {
        const urlParams = new URLSearchParams(window.location.search),
            configParam = urlParams.get("chartConfig");

        if (configParam) {
            const settings = JSON.parse(atob(configParam));

            // Apply settings to localStorage
            Object.keys(settings).forEach((key) => {
                if (key === "visibleFields") {
                    Object.keys(settings.visibleFields).forEach((field) => {
                        localStorage.setItem(`chartjs_field_${field}`, settings.visibleFields[field]);
                    });
                } else if (typeof settings[key] === "boolean") {
                    localStorage.setItem(`chartjs_${key}`, settings[key].toString());
                } else {
                    localStorage.setItem(`chartjs_${key}`, settings[key]);
                }
            });

            showNotification("Chart configuration loaded from URL", "success");

            // Refresh the charts with new settings using modern state management
            setTimeout(() => {
                if (chartStateManager) {
                    chartStateManager.debouncedRender("Configuration loaded from URL");
                } else {
                    renderChartJS(); // Fallback for compatibility
                }
            }, 100);
        }
    } catch (error) {
        console.error("Error loading shared configuration:", error);
        showNotification("Failed to load shared configuration", "warning");
    }
}
