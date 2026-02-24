/**
 * 🎨 Accent Color System - Quick Reference
 *
 * This file provides code examples for working with the accent color system.
 * Use this as a reference when extending or maintaining the color functionality.
 *
 * NOTE: This is a documentation file with example code snippets.
 * It is not meant to be executed directly and may contain intentional
 * type errors for illustration purposes.
 *
 * @fileoverview Code examples and reference for accent color system
 */

// @ts-nocheck - This is a documentation file with example code

// ============================================================================
// BASIC USAGE - Setting Accent Colors
// ============================================================================

import { getEffectiveAccentColor, resetAccentColor, setAccentColor } from './utils/theming/core/accentColor.js';

// Set a custom accent color (automatically saves to localStorage)
setAccentColor('#ec4899', 'dark'); // Pink for dark theme

// Get the current effective accent color
const currentColor = getEffectiveAccentColor('dark');
console.log('Current accent:', currentColor); // "#ec4899"

// Reset to default color
resetAccentColor('dark'); // Back to #3b82f6 (blue)

// ============================================================================
// QUICK COLOR SWITCHER - How It Works
// ============================================================================

// The quick switcher is initialized in index.html:
/*
<script type="module">
    import { initQuickColorSwitcher } from './utils/ui/quickColorSwitcher.js';
    document.addEventListener('DOMContentLoaded', () => {
        initQuickColorSwitcher();
    });
</script>
*/

// Preset colors are defined in quickColorSwitcher.js:
const PRESET_COLORS = [
    { hex: '#3b82f6', name: 'Blue-tiful' },
    { hex: '#8b5cf6', name: 'Purple Rain' },
    { hex: '#ec4899', name: 'Pink Panther' },
    { hex: '#10b981', name: 'Green Machine' },
    { hex: '#f59e0b', name: 'Golden Hour' },
    { hex: '#ef4444', name: 'Red Hot' },
    { hex: '#06b6d4', name: 'Cyan-tific' },
    { hex: '#f97316', name: 'Orange Crush' },
];

// To add a new preset color, simply add to this array and it will
// automatically appear in the dropdown!

// ============================================================================
// CSS VARIABLES - What Gets Updated
// ============================================================================

// When you call setAccentColor(), these CSS variables are updated:

const cssVariables = {
    '--color-accent': '#ec4899',           // Primary accent
    '--color-accent-rgb': '236, 72, 153',  // For opacity variants
    '--color-accent-secondary': '#d94489', // Darker/lighter variant
    '--color-accent-hover': 'rgba(236, 72, 153, 0.15)', // Hover overlay
    '--color-btn-bg': 'linear-gradient(135deg, #ec4899 0%, #d94489 100%)',
    '--color-btn-bg-solid': '#ec4899',
    '--color-btn-hover': 'linear-gradient(135deg, #f082ac 0%, #e05a9c 100%)',
    '--color-hero-glow': 'rgba(236, 72, 153, 0.28)',
    '--color-hero-glow-strong': 'rgba(236, 72, 153, 0.42)',
    '--color-info': 'rgba(236, 72, 153, 0.35)',
    '--color-modal-bg': 'linear-gradient(135deg, #ec4899 0%, #d94489 100%)',
    '--color-svg-icon-stroke': '#ec4899',
};

// Access these in your CSS:
/*
.my-button {
    background: var(--color-btn-bg);
    color: white;
}

.my-button:hover {
    background: var(--color-btn-hover);
}

.my-accent-border {
    border: 2px solid var(--color-accent);
}

.my-glow-effect {
    box-shadow: 0 0 20px var(--color-hero-glow);
}
*/

// ============================================================================
// PROGRAMMATICALLY TRIGGER COLOR CHANGES
// ============================================================================

// Example: Create a custom color cycling feature
function cycleColors() {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
    let index = 0;

    setInterval(() => {
        setAccentColor(colors[index], 'dark');
        index = (index + 1) % colors.length;
    }, 3000); // Change every 3 seconds
}

// Example: Random color on button click
function setRandomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    setAccentColor(randomColor, 'dark');
}

// Example: Color based on time of day
function setTimeBasedColor() {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
        setAccentColor('#f59e0b', 'dark'); // Morning: Golden
    } else if (hour >= 12 && hour < 17) {
        setAccentColor('#3b82f6', 'dark'); // Afternoon: Blue
    } else if (hour >= 17 && hour < 21) {
        setAccentColor('#f97316', 'dark'); // Evening: Orange
    } else {
        setAccentColor('#8b5cf6', 'dark'); // Night: Purple
    }
}

// ============================================================================
// LISTEN FOR COLOR CHANGES
// ============================================================================

// The system dispatches custom events when colors change
document.addEventListener('accentColorChanged', (event) => {
    console.log('Accent color changed to:', event.detail.color);
    console.log('Theme:', event.detail.theme);
});

// Example: Update a custom element when color changes
class AccentAwareElement extends HTMLElement {
    connectedCallback() {
        this.updateColor();
        document.addEventListener('accentColorChanged', () => this.updateColor());
    }

    updateColor() {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-accent');
        this.style.borderColor = color;
    }
}
customElements.define('accent-aware', AccentAwareElement);

// ============================================================================
// VALIDATE COLORS
// ============================================================================

// The system includes built-in validation
function validateColor(color) {
    // Hex color format: #RRGGBB
    const hexRegex = /^#[0-9A-Fa-f]{6}$/i;
    return hexRegex.test(color);
}

// Example usage:
if (validateColor('#ec4899')) {
    setAccentColor('#ec4899', 'dark'); // Valid ✓
}

if (!validateColor('pink')) {
    console.error('Invalid color format'); // Invalid ✗
}

// ============================================================================
// COLOR MANIPULATION UTILITIES
// ============================================================================

// Darken a color by a percentage
function darkenColor(rgb, percent) {
    return rgb.map(value => Math.round(value * (1 - percent / 100)));
}

// Lighten a color by a percentage
function lightenColor(rgb, percent) {
    return rgb.map(value => Math.round(value + (255 - value) * (percent / 100)));
}

// Convert hex to RGB
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

// Example: Create a custom darker variant
const pink = hexToRgb('#ec4899'); // [236, 72, 153]
const darkerPink = darkenColor(pink, 15); // [200, 61, 130]
const darkerPinkHex = rgbToHex(...darkerPink); // "#c83d82"

// ============================================================================
// ADVANCED: CUSTOM THEMES
// ============================================================================

// Create a complete custom theme
const customTheme = {
    name: 'Ocean Sunset',
    dark: {
        accent: '#06b6d4', // Cyan
        secondary: '#0891b2',
        background: '#0f172a',
        text: '#f1f5f9',
    },
    light: {
        accent: '#0284c7', // Darker cyan
        secondary: '#0369a1',
        background: '#f8fafc',
        text: '#0f172a',
    }
};

// Apply custom theme
function applyCustomTheme(theme, mode) {
    setAccentColor(theme[mode].accent, mode);
    // Apply other theme properties...
}

// ============================================================================
// DEBUGGING
// ============================================================================

// Check current CSS variable values
function debugAccentColors() {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    console.log('=== Accent Color Debug ===');
    console.log('--color-accent:', style.getPropertyValue('--color-accent'));
    console.log('--color-accent-rgb:', style.getPropertyValue('--color-accent-rgb'));
    console.log('--color-accent-secondary:', style.getPropertyValue('--color-accent-secondary'));
    console.log('--color-btn-bg:', style.getPropertyValue('--color-btn-bg'));

    // Check localStorage
    console.log('Stored color:', localStorage.getItem('ffv-accent-color'));
}

// Run in console: debugAccentColors()

// ============================================================================
// TESTING HELPERS
// ============================================================================

// Test all preset colors
async function testAllPresets() {
    const presets = PRESET_COLORS;

    for (const preset of presets) {
        console.log(`Testing ${preset.name} (${preset.hex})`);
        setAccentColor(preset.hex, 'dark');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
    }

    resetAccentColor('dark'); // Reset to default
    console.log('All presets tested!');
}

// ============================================================================
// BEST PRACTICES
// ============================================================================

/*
✅ DO:
- Use CSS variables for all accent-related styling
- Call setAccentColor() for any programmatic color changes
- Validate colors before setting them
- Use meaningful color names in UI
- Test colors in both dark and light themes
- Provide a reset option

❌ DON'T:
- Hardcode accent colors in CSS (use variables instead)
- Bypass setAccentColor() and modify CSS directly
- Use colors that don't meet accessibility standards
- Assume color preference persistence (always check)
- Modify accentColor.js without understanding the system

📝 NOTES:
- Colors are stored in localStorage as hex strings
- The system automatically generates color variations
- CSS variables update instantly on color change
- Theme switching reapplies accent colors
- All changes are scoped to the current theme (dark/light)
*/

// ============================================================================
// EXPORT FOR USE
// ============================================================================

export {
    darkenColor,
    debugAccentColors,
    getEffectiveAccentColor,
    hexToRgb,
    lightenColor,
    resetAccentColor,
    rgbToHex,
    setAccentColor,
    testAllPresets,
    validateColor,
};

// ============================================================================
// QUICK REFERENCE SUMMARY
// ============================================================================

/*
🎨 SET COLOR:       setAccentColor('#ec4899', 'dark')
🔍 GET COLOR:       getEffectiveAccentColor('dark')
🔄 RESET COLOR:     resetAccentColor('dark')
✅ VALIDATE:        validateColor('#ec4899')
🎯 CSS VAR:         var(--color-accent)
💾 STORAGE KEY:     'ffv-accent-color'
📡 EVENT:           'accentColorChanged'
🐛 DEBUG:           debugAccentColors()

📚 Full Documentation: /docs/ACCENT_COLOR_SYSTEM.md
👤 User Guide: /docs/COLOR_SWITCHER_USER_GUIDE.md
✅ Completion Report: /docs/ACCENT_COLOR_COMPLETION_REPORT.md
*/
