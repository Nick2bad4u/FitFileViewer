/**
 * Creates a density toggle control that allows users to switch between spacious and dense table layouts.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.storageKey - The localStorage key to persist the density preference
 * @param {(density: 'spacious' | 'dense') => void} options.onChange - Callback when density changes
 * @param {'spacious' | 'dense'} [options.defaultDensity='spacious'] - Default density mode
 * @param {boolean} [options.showLabel=false] - Whether to show a label next to the button
 * @param {string} [options.labelText='Density:'] - Text for the label
 * @returns {HTMLElement} The density toggle control element (button or container with label)
 *
 * @example
 * const toggle = createDensityToggle({
 *   storageKey: 'summaryTableDensity',
 *   showLabel: true,
 *   onChange: (density) => {
 *     container.classList.toggle('density-dense', density === 'dense');
 *     container.classList.toggle('density-spacious', density === 'spacious');
 *   }
 * });
 */
export function createDensityToggle({ defaultDensity = "spacious", labelText = "Density:", onChange, showLabel = false, storageKey }) {
    // Load saved preference
    let currentDensity = /** @type {'spacious' | 'dense'} */ (
        localStorage.getItem(storageKey) || defaultDensity
    );

    // Create button
    const button = document.createElement("button");
    button.className = "density-toggle-btn";
    button.title = "Toggle table density";

    // Colorful icon elements using iconify-icon
    const spaciousIcon = '<iconify-icon icon="flat-color-icons:view-details" width="18" height="18"></iconify-icon>';
    const denseIcon = '<iconify-icon icon="flat-color-icons:list" width="18" height="18"></iconify-icon>';

    /**
     * Updates the button appearance based on current density
     */
    function updateButton() {
        if (currentDensity === "dense") {
            button.innerHTML = spaciousIcon;
            button.setAttribute("aria-label", "Switch to spacious layout");
            button.title = "Switch to spacious layout";
        } else {
            button.innerHTML = denseIcon;
            button.setAttribute("aria-label", "Switch to dense layout");
            button.title = "Switch to dense layout";
        }
    }

    // Initialize button
    updateButton();

    // Handle click
    button.addEventListener("click", (e) => {
        e.stopPropagation();
        currentDensity = currentDensity === "spacious" ? "dense" : "spacious";
        localStorage.setItem(storageKey, currentDensity);
        updateButton();
        onChange(currentDensity);
    });

    // Trigger initial onChange to apply saved preference
    onChange(currentDensity);

    // If label is requested, wrap button in a container with label
    if (showLabel) {
        const container = document.createElement("div");
        container.className = "density-toggle-container";

        const label = document.createElement("label");
        label.className = "density-toggle-label";
        label.textContent = labelText;

        container.append(label);
        container.append(button);
        return container;
    }

    return button;
}

/**
 * Gets the saved density preference for a given storage key
 * @param {string} storageKey - The localStorage key
 * @param {'spacious' | 'dense'} [defaultDensity='spacious'] - Default if not found
 * @returns {'spacious' | 'dense'} The density preference
 */
export function getDensityPreference(storageKey, defaultDensity = "spacious") {
    const saved = localStorage.getItem(storageKey);
    return /** @type {'spacious' | 'dense'} */ (saved || defaultDensity);
}
