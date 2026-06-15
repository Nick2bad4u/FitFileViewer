const forbiddenMainStatePathSegments: ReadonlySet<string> = new Set([
    "__proto__",
    "constructor",
    "prototype",
]);
const mainStatePathSegmentPattern = /^[\w:-]+$/u;
const maxMainStatePathLength = 512;
const maxMainStatePathSegmentLength = 128;

interface MainStatePathValidationOptions {
    allowUndefined?: boolean;
}

function normalizeMainStateString(value: unknown): string | undefined {
    return typeof value === "string" ? value.trim() : undefined;
}

export function isSafeMainStateOperationId(value: unknown): value is string {
    const operationId = normalizeMainStateString(value);
    return (
        operationId !== undefined &&
        operationId.length > 0 &&
        operationId.length <= maxMainStatePathSegmentLength &&
        !forbiddenMainStatePathSegments.has(operationId) &&
        mainStatePathSegmentPattern.test(operationId)
    );
}

export function isSafeMainStatePath(value: unknown): value is string {
    const path = normalizeMainStateString(value);
    if (!path || path.length > maxMainStatePathLength) {
        return false;
    }

    const segments = path.split(".");
    for (const segment of segments) {
        if (
            !segment ||
            segment.length > maxMainStatePathSegmentLength ||
            forbiddenMainStatePathSegments.has(segment) ||
            !mainStatePathSegmentPattern.test(segment)
        ) {
            return false;
        }
    }

    return true;
}

export function validateMainStateOperationIdInput(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError("Invalid main-state operation id provided");
    }

    const operationId = value.trim();
    if (forbiddenMainStatePathSegments.has(operationId)) {
        throw new Error("Unsafe main-state operation id provided");
    }

    if (!isSafeMainStateOperationId(operationId)) {
        throw new TypeError("Invalid main-state operation id provided");
    }

    return operationId;
}

export function validateMainStatePathInput(
    value: unknown,
    options: MainStatePathValidationOptions = {}
): string | undefined {
    if (value === undefined && options.allowUndefined === true) {
        return undefined;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError("Invalid main-state path provided");
    }

    const path = value.trim();
    const segments = path.split(".");

    if (
        segments.some((segment) => forbiddenMainStatePathSegments.has(segment))
    ) {
        throw new Error("Unsafe main-state path provided");
    }

    if (!isSafeMainStatePath(path)) {
        throw new TypeError("Invalid main-state path provided");
    }

    return path;
}
