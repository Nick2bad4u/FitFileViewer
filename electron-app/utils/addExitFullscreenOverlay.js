/**
 * Adds an exit fullscreen overlay button to the specified container.
 * The button allows users to exit fullscreen mode and is styled according to the app's theme.
 *
 * @param {HTMLElement} container - The DOM element to which the overlay button will be added.
 * @returns {void}
 * @example
 * // Add exit fullscreen overlay to a chart container
 * addExitFullscreenOverlay(document.getElementById('chart-container'));
 * Uses "themed-btn" and "exit-fullscreen-btn" classes for consistent button styling.
 * See style.css and the project style guide for documentation and usage patterns.
 */
export function addExitFullscreenOverlay(container) {
    const existingOverlay = container.querySelector(".exit-fullscreen-overlay");
    if (existingOverlay) return;
    const exitFullscreenButton = document.createElement("button");
    exitFullscreenButton.className = "exit-fullscreen-overlay themed-btn exit-fullscreen-btn";
    exitFullscreenButton.title = "Exit Fullscreen";
    exitFullscreenButton.innerHTML = `
		<span class="fullscreen-exit-icon" aria-hidden="true">
			<!-- Material Design Exit Fullscreen Icon -->
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-svg">
				<title>Exit Fullscreen Icon</title>
					<path d="M9 19H5V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M19 9H23V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M19 19H23V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M9 9H5V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</span>
	`;
    exitFullscreenButton.onclick = (e) => {
        e.stopPropagation();
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                console.warn("No element is currently in fullscreen mode.");
            }
        } catch (error) {
            console.error("Failed to exit fullscreen mode:", error);
        }
    };
    container.appendChild(exitFullscreenButton);
}
