/**
 * Predefined color schemes for zones
 */
export const chartColorSchemes = {
    classic: {
        hr: ["#4facfe", "#00b7ff", "#00a6ff", "#0095ff", "#0084ff"],
        power: ["#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#e53935", "#c62828", "#b71c1c"],
    },
    vibrant: {
        hr: ["#ff6b6b", "#ffa726", "#ffee58", "#66bb6a", "#42a5f5"],
        power: ["#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50"],
    },
    monochrome: {
        hr: ["#bdbdbd", "#9e9e9e", "#757575", "#616161", "#424242"],
        power: ["#f5f5f5", "#eeeeee", "#e0e0e0", "#bdbdbd", "#9e9e9e", "#757575", "#616161"],
    },
    pastel: {
        hr: ["#a3cef1", "#b6e2d3", "#f6d6ad", "#f7a072", "#eec6e6"],
        power: ["#f9c6c9", "#f7e3af", "#c6e2e9", "#b5ead7", "#e4bad4", "#c7ceea", "#ffdac1"],
    },
    dark: {
        hr: ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
        power: ["#23272e", "#393e46", "#4ecca3", "#eeeeee", "#232931", "#393e46", "#4ecca3"],
    },
    rainbow: {
        hr: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff"],
        power: ["#9400d3", "#4b0082", "#0000ff", "#00ff00", "#ffff00", "#ff7f00", "#ff0000"],
    },
    ocean: {
        hr: ["#0077b6", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8"],
        power: ["#03045e", "#0077b6", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8", "#ade8f4"],
    },
    earth: {
        hr: ["#a0522d", "#cd853f", "#deb887", "#f5deb3", "#fff8dc"],
        power: ["#556b2f", "#6b8e23", "#8fbc8f", "#bdb76b", "#eee8aa", "#f0e68c", "#fafad2"],
    },
    fire: {
        hr: ["#ff6f00", "#ff8f00", "#ffa000", "#ffb300", "#ffc107"],
        power: ["#d84315", "#ff7043", "#ffab91", "#ffd180", "#ffcc80", "#ffb300", "#ff6f00"],
    },
    forest: {
        hr: ["#2e7d32", "#388e3c", "#43a047", "#66bb6a", "#81c784"],
        power: ["#1b5e20", "#388e3c", "#43a047", "#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9"],
    },
    sunset: {
        hr: ["#ffb347", "#ffcc33", "#ff6666", "#ff9966", "#ffb366"],
        power: ["#ff5e62", "#ff9966", "#ffb347", "#ffcc33", "#f7b42c", "#fc575e", "#f7b42c"],
    },
    grayscale: {
        hr: ["#f8f9fa", "#e9ecef", "#dee2e6", "#adb5bd", "#495057"],
        power: ["#212529", "#343a40", "#495057", "#6c757d", "#adb5bd", "#ced4da", "#dee2e6"],
    },
    neon: {
        hr: ["#39ff14", "#faff00", "#00f0ff", "#ff073a", "#ff61f6"],
        power: ["#fe019a", "#fdff00", "#0df9ff", "#08ff08", "#ff073a", "#ff61f6", "#39ff14"],
    },
    autumn: {
        hr: ["#ffb347", "#ff6961", "#fdfd96", "#77dd77", "#aec6cf"],
        power: ["#c23b22", "#ff7f50", "#ffb347", "#fdfd96", "#77dd77", "#aec6cf", "#836953"],
    },
    spring: {
        hr: ["#f6e3b4", "#b4f6c1", "#b4d8f6", "#e3b4f6", "#f6b4d8"],
        power: ["#b4f6c1", "#b4d8f6", "#e3b4f6", "#f6b4d8", "#f6e3b4", "#d8f6b4", "#b4f6e3"],
    },
    // Cycling-specific power color scheme (Coggan's 7 zones)
    cycling: {
        power: [
            "#b3e5fc", // Active Recovery (Z1)
            "#81d4fa", // Endurance (Z2)
            "#4fc3f7", // Tempo (Z3)
            "#0288d1", // Lactate Threshold (Z4)
            "#ffb300", // VO2max (Z5)
            "#e53935", // Anaerobic Capacity (Z6)
            "#8e24aa", // Neuromuscular Power (Z7)
        ],
        hr: ["#b3e5fc", "#81d4fa", "#4fc3f7", "#0288d1", "#ffb300"], // fallback HR colors
    },
    // Runner-specific power color scheme (Stryd 5 zones)
    runner: {
        power: [
            "#b2dfdb", // Easy
            "#4dd0e1", // Moderate
            "#26a69a", // Threshold
            "#ffb74d", // Interval
            "#ef5350", // Repetition/Sprint
        ],
        hr: ["#b2dfdb", "#4dd0e1", "#26a69a", "#ffb74d", "#ef5350"], // fallback HR colors
    },
    // General exercise power color scheme (generic 5 zones)
    exercise: {
        power: [
            "#aed581", // Zone 1 (Very Light)
            "#fff176", // Zone 2 (Light)
            "#ffd54f", // Zone 3 (Moderate)
            "#ffb74d", // Zone 4 (Hard)
            "#e57373", // Zone 5 (Max)
        ],
        hr: ["#aed581", "#fff176", "#ffd54f", "#ffb74d", "#e57373"], // fallback HR colors
    },
    // Add more schemes as needed
};
