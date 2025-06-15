import { getThemeColors } from './getThemeColors.js';
import { showNotification } from './showNotification.js';

/**
 * Creates a print/export button for the map
 * @returns {HTMLButtonElement} The configured print button
 */

export function createPrintButton() {
    try {
        const printBtn = document.createElement("button");
        printBtn.className = "map-action-btn";

        const themeColors = getThemeColors();
        printBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <rect x="5" y="7" width="14" height="8" rx="2" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="1.5"/>
            <rect x="7" y="3" width="10" height="4" rx="1" fill="${themeColors.primaryLight}" stroke="${themeColors.primary}" stroke-width="1"/>
            <rect x="8" y="16" width="8" height="3" rx="1" fill="${themeColors.primary}"/>
            <circle cx="17" cy="11" r="1" fill="${themeColors.primary}"/>
            </svg>
            <span>Print/Export</span>
        `;

        printBtn.title = "Print or export the current map view";
        printBtn.setAttribute('aria-label', 'Print or export map');

        printBtn.addEventListener('click', () => {
            try {
                window.print();
            } catch (error) {
                console.error('[MapActions] Print failed:', error);
                showNotification('Print failed. Please try again.', 'error');
            }
        });

        return printBtn;
    } catch (error) {
        console.error('[MapActions] Failed to create print button:', error);
        throw error;
    }
}
