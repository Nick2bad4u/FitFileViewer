/**
 * Notification variants supported by the renderer notification utility.
 */
export type NotificationType = "error" | "info" | "success" | "warning";

/**
 * Action button shown inside a notification.
 */
export interface NotificationAction {
    className?: string;
    onClick?: () => void;
    text: string;
}

/**
 * Options accepted by the renderer notification utility.
 */
export interface NotificationOptions {
    actions?: readonly NotificationAction[];
    icon?: string;
    onClick?: () => void;
    persistent?: boolean;
}

export function showNotification(
    message: string,
    type?: NotificationType,
    duration?: null | number,
    options?: NotificationOptions
): Promise<void>;
