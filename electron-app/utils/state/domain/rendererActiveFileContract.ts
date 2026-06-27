export type RendererFileInfoState = {
    displayName: string;
    hasFile: boolean;
    title: string;
};

type RendererFileInfoStateCandidate = Readonly<{
    displayName?: unknown;
    hasFile?: unknown;
    title?: unknown;
}>;

export const DEFAULT_RENDERER_FILE_INFO: RendererFileInfoState = {
    displayName: "",
    hasFile: false,
    title: "",
};

export function normalizeRendererCurrentFile(value: unknown): null | string {
    return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeRendererFileInfo(
    value: Partial<RendererFileInfoState> | unknown
): RendererFileInfoState {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ...DEFAULT_RENDERER_FILE_INFO };
    }

    const record = value as RendererFileInfoStateCandidate;
    return {
        displayName:
            typeof record.displayName === "string" ? record.displayName : "",
        hasFile: record.hasFile === true,
        title: typeof record.title === "string" ? record.title : "",
    };
}

export function normalizeRendererUnloadButtonVisible(value: unknown): boolean {
    return value === true;
}

export function normalizeRendererActiveFileFitFileBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("currentFile" in value)) {
        return value;
    }

    return {
        ...value,
        currentFile: normalizeRendererCurrentFile(value["currentFile"]),
    };
}

export function normalizeRendererActiveFileUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    if ("fileInfo" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["fileInfo"] = normalizeRendererFileInfo(
            value["fileInfo"]
        );
    }

    if ("unloadButtonVisible" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["unloadButtonVisible"] =
            normalizeRendererUnloadButtonVisible(value["unloadButtonVisible"]);
    }

    return normalizedBranch ?? value;
}
