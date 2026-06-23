import { clearElement } from "../../dom/index.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
import { getRenderChartDomHelpersRuntime } from "./renderChartDomHelpersRuntime.js";

const ELEMENT_NODE = 1;
const renderChartDomHelpersRuntime = getRenderChartDomHelpersRuntime();

/**
 * Type guard for element-like DOM nodes that works across jsdom and renderer
 * realms.
 */
export function isElement(maybe: unknown): maybe is HTMLElement {
    return (
        isObjectRecord(maybe) &&
        "nodeType" in maybe &&
        maybe["nodeType"] === ELEMENT_NODE
    );
}

/**
 * Append a child using the broadest available DOM API in mocked test
 * environments.
 */
export function safeAppend(parent: ParentNode, child: Node): void {
    try {
        if (typeof parent.append === "function") {
            parent.append(child);
            return;
        }

        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
            return;
        }

        parent.insertBefore(child, null);
    } catch (error) {
        console.warn("[ChartJS] safeAppend fallback used:", error);
        try {
            parent.insertBefore(child, null);
        } catch {
            // Best-effort compatibility helper; callers already tolerate failure.
        }
    }
}

/**
 * Render a plain no-data chart message without parsing HTML.
 */
export function renderNoDataMessage(
    container: HTMLElement,
    message: string
): void {
    clearElement(container);

    const messageElement = renderChartDomHelpersRuntime.createElement("div");
    messageElement.className = "no-data-message";
    messageElement.textContent = message;

    safeAppend(container, messageElement);
}
