/**
 * Converts a six-digit hex color into a CSS rgba() color string.
 */
export function hexToRgba(hex, alpha) {
    const b = Number.parseInt(hex.slice(5, 7), 16),
        g = Number.parseInt(hex.slice(3, 5), 16),
        r = Number.parseInt(hex.slice(1, 3), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
