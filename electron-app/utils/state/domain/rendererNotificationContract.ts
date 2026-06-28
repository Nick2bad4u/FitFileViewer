/** Notification variants rendered by renderer utility helpers. */
export type NotificationType = "error" | "info" | "success" | "warning";

/** Notification state stored for the renderer notification surface. */
export type RendererNotification = {
    message: string;
    timestamp?: number;
    type: NotificationType;
};

export function normalizeRendererNotification(
    value: unknown
): null | RendererNotification {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const message = getNotificationProperty(value, "message");
    const type = getNotificationProperty(value, "type");

    if (typeof message === "string" && isNotificationType(type)) {
        const timestamp = getNotificationProperty(value, "timestamp");

        return typeof timestamp === "number"
            ? {
                  message,
                  timestamp,
                  type,
              }
            : {
                  message,
                  type,
              };
    }

    return null;
}

export function normalizeRendererNotificationUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    for (const key of ["currentNotification", "lastNotification"]) {
        if (key in value) {
            normalizedBranch ??= { ...value };
            normalizedBranch[key] = normalizeRendererNotification(value[key]);
        }
    }

    return normalizedBranch ?? value;
}

function getNotificationProperty(
    value: object,
    key: "message" | "timestamp" | "type"
): unknown {
    return key in value ? value[key as keyof typeof value] : undefined;
}

export function isNotificationType(value: unknown): value is NotificationType {
    return (
        value === "error" ||
        value === "info" ||
        value === "success" ||
        value === "warning"
    );
}
