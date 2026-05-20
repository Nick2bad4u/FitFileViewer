import { clearElement } from "../../dom/index.js";
const ELEMENT_NODE = 1;
/**
 * Type guard for element-like DOM nodes that works across jsdom and renderer
 * realms.
 */
export function isElement(maybe) {
    return (maybe !== null &&
        typeof maybe === "object" &&
        "nodeType" in maybe &&
        maybe.nodeType === ELEMENT_NODE);
}
/**
 * Append a child using the broadest available DOM API in mocked test
 * environments.
 */
export function safeAppend(parent, child) {
    try {
        if (typeof parent.append === "function") {
            parent.append(child);
            return;
        }
        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
            return;
        }
        parent.appendChild(child);
    }
    catch (error) {
        console.warn("[ChartJS] safeAppend fallback used:", error);
        try {
            parent.appendChild(child);
        }
        catch {
            // Best-effort compatibility helper; callers already tolerate failure.
        }
    }
}
/**
 * Render a plain no-data chart message without parsing HTML.
 */
export function renderNoDataMessage(container, message) {
    clearElement(container);
    const messageElement = document.createElement("div");
    messageElement.className = "no-data-message";
    messageElement.textContent = message;
    safeAppend(container, messageElement);
}
