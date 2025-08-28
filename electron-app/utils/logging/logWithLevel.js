/**
 * Typed logging helper to avoid dynamic console[level] index signature errors
 * Provides consistent formatting and optional context object.
 *
 * @typedef {'log'|'info'|'warn'|'error'} LogLevel
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
export function logWithLevel(level, message, context) {
    try {
        const timestamp = new Date().toISOString();
        const prefix = `[FFV]`;
        const base = `${timestamp} ${prefix} ${message}`;
        const hasContext = context && Object.keys(context).length > 0;
        switch (level) {
            case 'info':
                hasContext ? console.info(base, context) : console.info(base); break;
            case 'warn':
                hasContext ? console.warn(base, context) : console.warn(base); break;
            case 'error':
                hasContext ? console.error(base, context) : console.error(base); break;
            default:
                hasContext ? console.log(base, context) : console.log(base);
        }
    } catch {
        // Fallback minimal logging if something unexpected occurs
        console.log('[FFV][logWithLevel] Logging failure');
    }
}
