export type RendererDomValidationLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

interface RequiredDomElementAlternative {
    readonly id: string;
    readonly name: string;
}

const requiredDomElementAlternatives: readonly (readonly RequiredDomElementAlternative[])[] =
    [
        [
            { id: "open_file_btn", name: "Open File button" },
            { id: "openFileBtn", name: "Open File button" },
            { id: "file_input", name: "File input" },
            { id: "fileInput", name: "File input" },
        ],
        [
            { id: "notification", name: "Notification container" },
            {
                id: "notification-container",
                name: "Notification container",
            },
        ],
        [
            { id: "loading_overlay", name: "Loading overlay" },
            { id: "loadingOverlay", name: "Loading overlay" },
            { id: "loading", name: "Loading overlay" },
        ],
    ];

export function getMissingRendererDomElementGroups(
    documentRef: Document
): string[] {
    const missingGroups: string[] = [];

    for (const group of requiredDomElementAlternatives) {
        const found = group.some(
            ({ id }) => documentRef.querySelector(`#${id}`) !== null
        );
        if (!found) {
            missingGroups.push(group[0]?.name ?? "Unknown UI element");
        }
    }

    return missingGroups;
}

export function validateRendererDomElements(
    documentRef: Document,
    logRenderer: RendererDomValidationLogger
): boolean {
    const missingGroups = getMissingRendererDomElementGroups(documentRef);

    if (missingGroups.length > 0) {
        logRenderer(
            "warn",
            "[Renderer] Some UI elements were not found:",
            missingGroups.join(", ")
        );
    }

    return true;
}
