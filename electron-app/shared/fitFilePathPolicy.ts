const maxFitFilePathLength = 4096;

function isNonEmptyString(filePath: unknown): filePath is string {
    return typeof filePath === "string" && filePath.trim().length > 0;
}

function isWindowsDriveAbsolutePath(filePath: string): boolean {
    return /^[A-Za-z]:[/\\]/u.test(filePath);
}

function isWindowsUncPath(filePath: string): boolean {
    return filePath.startsWith("\\\\") || filePath.startsWith("//");
}

function isAbsoluteFitFilePath(filePath: string): boolean {
    return (
        filePath.startsWith("/") ||
        isWindowsDriveAbsolutePath(filePath) ||
        isWindowsUncPath(filePath)
    );
}

export function validateFitFilePathInput(filePath: unknown): string {
    if (!isNonEmptyString(filePath)) {
        throw new Error("Invalid file path provided");
    }

    const trimmed = filePath.trim();

    if (trimmed.length > maxFitFilePathLength) {
        throw new Error("Invalid file path provided");
    }

    if (/^\w+:\/\//u.test(trimmed)) {
        throw new Error("Invalid file path provided");
    }

    if (trimmed.includes("\0")) {
        throw new Error("Invalid file path provided");
    }

    if (
        trimmed.startsWith("\\\\?\\") ||
        trimmed.startsWith("\\\\.\\") ||
        trimmed.startsWith("//?/") ||
        trimmed.startsWith("//./")
    ) {
        throw new Error("Invalid file path provided");
    }

    if (!isAbsoluteFitFilePath(trimmed)) {
        throw new Error("Only absolute file paths are allowed");
    }

    return trimmed;
}
