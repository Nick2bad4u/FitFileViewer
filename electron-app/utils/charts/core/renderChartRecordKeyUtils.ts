type FieldReadKeyCache = {
    readKeys?: Map<string, string>;
};

/** Resolves which record-message key should be read for a configured chart field. */
export function resolveRecordFieldKey(
    cache: FieldReadKeyCache | null | undefined,
    recordMesgs: readonly unknown[],
    field: string
): string {
    if (cache?.readKeys instanceof Map) {
        const cached = cache.readKeys.get(field);
        if (typeof cached === "string") {
            return cached;
        }
    }

    const snake = field.replaceAll(/([A-Z])/g, "_$1").toLowerCase();
    let resolved = field;

    const limit = Math.min(
        50,
        Array.isArray(recordMesgs) ? recordMesgs.length : 0
    );

    for (let i = 0; i < limit; i += 1) {
        const row = recordMesgs[i];
        if (!row || typeof row !== "object") {
            continue;
        }

        if (field in row) {
            resolved = field;
            break;
        }

        if (snake in row) {
            resolved = snake;
            break;
        }
    }

    if (cache?.readKeys instanceof Map) {
        cache.readKeys.set(field, resolved);
    }

    return resolved;
}
