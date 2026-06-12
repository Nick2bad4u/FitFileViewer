const maxFitBrowserRootFolderLength = 4096;
const maxFitBrowserRelativePathLength = 1024;

function containsControlCharacter(value: string): boolean {
    for (const char of value) {
        const code = char.codePointAt(0);
        if (code !== undefined && (code < 0x20 || code === 0x7f)) {
            return true;
        }
    }
    return false;
}

function looksLikeAbsolutePath(value: string): boolean {
    return (
        /^[A-Za-z]:[/\\]/u.test(value) ||
        /^[/\\]{2}/u.test(value) ||
        value.startsWith("/")
    );
}

export function validateFitBrowserRelativePath(value: unknown): string {
    if (typeof value !== "string") {
        throw new TypeError("Invalid Browser relative path provided");
    }

    const trimmed = value.trim();
    if (trimmed.length > maxFitBrowserRelativePathLength) {
        throw new TypeError("Invalid Browser relative path provided");
    }

    if (containsControlCharacter(trimmed)) {
        throw new TypeError("Invalid Browser relative path provided");
    }

    if (looksLikeAbsolutePath(trimmed)) {
        throw new Error("Browser relative path must stay within root");
    }

    const normalized = trimmed.replaceAll("\\", "/");
    const parts = normalized.split("/").filter((part) => part.length > 0);

    if (parts.some((part) => part === "." || part === "..")) {
        throw new Error("Browser relative path traversal is not allowed");
    }

    return trimmed;
}

export function validateFitBrowserRootFolderPath(value: unknown): string {
    if (typeof value !== "string") {
        throw new TypeError("Invalid Browser root folder provided");
    }

    const trimmed = value.trim();
    if (
        !trimmed ||
        trimmed.length > maxFitBrowserRootFolderLength ||
        containsControlCharacter(trimmed)
    ) {
        throw new TypeError("Invalid Browser root folder provided");
    }

    if (!looksLikeAbsolutePath(trimmed)) {
        throw new Error("Browser root folder must be an absolute path");
    }

    return trimmed;
}
