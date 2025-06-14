/**
 * Copies the contents of a table as a CSV string to the clipboard.
 *
 * This function serializes each row of the table, handling nested objects by stringifying them.
 * It attempts to use the Clipboard API to copy the CSV string, and falls back to using a hidden textarea if necessary.
 *
 * @param {Object} table - The table object to copy. Must have an `objects()` method that returns an array of row objects.
 * @param {string} title - The title for the CSV (currently unused).
 *
 * @throws {Error} Logs an error if the table object does not have an `objects()` method.
 */
export function copyTableAsCSV(table) {
    if (typeof table.objects !== "function") {
        console.error("Invalid table object: missing objects method");
        return;
    }
    const rows = table.objects().map((row) => {
        const newRow = {};
        const cache = new Map();
        Object.keys(row).forEach((key) => {
            const cell = row[key];
            if (typeof cell === "object" && cell !== null) {
                if (cache.has(cell)) {
                    newRow[key] = cache.get(cell);
                } else {
                    const serialized = JSON.stringify(cell);
                    cache.set(cell, serialized);
                    newRow[key] = serialized;
                }
            } else {
                newRow[key] = cell;
            }
        });
        return newRow;
    });
    const flattenedTable = window.aq.from(rows);
    const csvString = flattenedTable.toCSV({ header: true });
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard
            .writeText(csvString)
            .then(() => console.log("Copied CSV to clipboard!"))
            .catch((err) => console.error("Failed to copy CSV:", err));
    } else {
        console.warn("navigator.clipboard.writeText is not supported. Using fallback.");
        // Fallback mechanism
        const textarea = document.createElement("textarea");
        textarea.value = csvString;
        textarea.style.position = "fixed"; // Prevent scrolling to the bottom
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand("copy");
            console.log("Copied CSV to clipboard using fallback!");
        } catch (err) {
            console.error("Failed to copy CSV using fallback:", err);
        }
        document.body.removeChild(textarea);
    }
}
