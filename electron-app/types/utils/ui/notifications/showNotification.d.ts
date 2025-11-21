/**
 * Test-only helper to reset internal notification state between tests.
 * Not intended for production use.
 */
export function __testResetNotifications(): void;
/**
 * Clears all notifications from the queue and hides current notification
 */
export function clearAllNotifications(): void;
/**
 * Enhanced notification display with animations, icons, and queue management
 * @param {string} message - The message to display in the notification
 * @param {string} [type='info'] - The type of notification ('info', 'error', 'success', 'warning')
 * @param {number} [duration] - Duration in milliseconds (uses type default if not specified)
 * @param {Object} [options] - Additional options
 * @param {string} [options.icon] - Custom icon to override default
 * @param {boolean} [options.persistent] - If true, notification won't auto-hide
 * @param {Function} [options.onClick] - Callback when notification is clicked
 * @param {NotificationAction[]} [options.actions] - Action buttons
 * @returns {Promise<void>} Promise that resolves when notification is shown
 */
/**
 * @param {string} message
 * @param {keyof typeof NOTIFICATION_TYPES} [type="info"]
 * @param {number} [duration]
 * @param {NotificationOptions} [options]
 * @returns {Promise<void>}
 */
export function showNotification(
    message: string,
    type?: keyof typeof NOTIFICATION_TYPES,
    duration?: number,
    options?: NotificationOptions
): Promise<void>;
export namespace notify {
    function error(message: string, duration?: number, options?: Object): Promise<void>;
    function info(message: string, duration?: number, options?: Object): Promise<void>;
    function persistent(message: string, type?: string, options?: Object): Promise<void>;
    function success(message: string, duration?: number, options?: Object): Promise<void>;
    function warning(message: string, duration?: number, options?: Object): Promise<void>;
    function withActions(
        message: string,
        type?: string,
        actions?: NotificationAction[],
        options?: Object
    ): Promise<void>;
}
export type NotificationTypeConfig = {
    icon: string;
    duration: number;
    ariaLabel: string;
};
export type NotificationAction = {
    text: string;
    onClick?: () => void;
    className?: string;
};
export type NotificationOptions = {
    icon?: string;
    persistent?: boolean;
    onClick?: Function;
    actions?: NotificationAction[];
};
export type QueuedNotification = {
    message: string;
    type: keyof typeof NOTIFICATION_TYPES;
    duration: number | null;
    icon: string;
    ariaLabel: string;
    onClick: Function | undefined;
    actions: NotificationAction[];
    timestamp: number;
    resolveShown: (() => void) | undefined;
};
export type NotificationElement = HTMLElement & {
    hideTimeout?: number;
};
/**
 * Notification type map
 * @type {{info:NotificationTypeConfig,success:NotificationTypeConfig,error:NotificationTypeConfig,warning:NotificationTypeConfig}}
 */
declare const NOTIFICATION_TYPES: {
    info: NotificationTypeConfig;
    success: NotificationTypeConfig;
    error: NotificationTypeConfig;
    warning: NotificationTypeConfig;
};
/**
 * @typedef {Object} NotificationTypeConfig
 * @property {string} icon
 * @property {number} duration
 * @property {string} ariaLabel
 */
/**
 * @typedef {Object} NotificationAction
 * @property {string} text
 * @property {()=>void} [onClick]
 * @property {string} [className]
 */
/**
 * @typedef {Object} NotificationOptions
 * @property {string} [icon]
 * @property {boolean} [persistent]
 * @property {Function} [onClick]
 * @property {NotificationAction[]} [actions]
 */
/**
 * @typedef {Object} QueuedNotification
 * @property {string} message
 * @property {keyof typeof NOTIFICATION_TYPES} type
 * @property {number|null} duration
 * @property {string} icon
 * @property {string} ariaLabel
 * @property {Function|undefined} onClick
 * @property {NotificationAction[]} actions
 * @property {number} timestamp
 * @property {(() => void) | undefined} resolveShown
 */
/**
 * @typedef {HTMLElement & { hideTimeout?: number }} NotificationElement
 */
/** @type {QueuedNotification[]} */
export let isShowingNotification: QueuedNotification[];
export const notificationQueue: any[];
/**
 * Processes the notification queue, showing notifications one at a time
 */
export function processNotificationQueue(): Promise<void>;
export {};
//# sourceMappingURL=showNotification.d.ts.map
