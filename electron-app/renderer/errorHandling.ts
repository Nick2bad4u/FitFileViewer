export type RendererErrorLogger = (level: "error", ...args: unknown[]) => void;

type RendererShowNotification = (
    message: string,
    type?: string,
    timeout?: number
) => unknown;

interface RendererErrorCoreModules {
    showNotification?: RendererShowNotification | unknown;
}

interface RendererErrorHandlingOptions {
    getCoreModules: () => Promise<RendererErrorCoreModules>;
    logRenderer: RendererErrorLogger;
}

type RendererErrorLike = Readonly<{
    readonly message?: unknown;
}>;

export interface RendererErrorEventHandlers {
    handleUncaughtError: (event: ErrorEvent) => Promise<void>;
    handleUnhandledRejection: (event: PromiseRejectionEvent) => Promise<void>;
    onUncaughtErrorEvent: (event: Event) => void;
    onUnhandledRejectionEvent: (event: Event) => void;
}

export function createRendererErrorEventHandlers(
    options: RendererErrorHandlingOptions
): RendererErrorEventHandlers {
    const handleUncaughtError = async (event: ErrorEvent): Promise<void> => {
        options.logRenderer("error", "[Renderer] Uncaught error:", event.error);

        try {
            const coreModules = await options.getCoreModules();
            const { showNotification } = coreModules;

            if (typeof showNotification === "function") {
                showNotification(
                    `Critical error: ${getRendererErrorMessage(event.error)}`,
                    "error",
                    7000
                );
            }
        } catch (notifyError) {
            options.logRenderer(
                "error",
                "[Renderer] Failed to show error notification:",
                notifyError
            );
        }
    };

    const handleUnhandledRejection = async (
        event: PromiseRejectionEvent
    ): Promise<void> => {
        options.logRenderer(
            "error",
            "[Renderer] Unhandled promise rejection:",
            event.reason
        );

        try {
            const coreModules = await options.getCoreModules();
            const { showNotification } = coreModules;

            if (typeof showNotification === "function") {
                showNotification(
                    `Application error: ${getRendererErrorMessage(event.reason)}`,
                    "error",
                    5000
                );
            }
        } catch (notifyError) {
            options.logRenderer(
                "error",
                "[Renderer] Failed to show error notification:",
                notifyError
            );
        }

        event.preventDefault();
    };

    return {
        handleUncaughtError,
        handleUnhandledRejection,
        onUncaughtErrorEvent(event: Event): void {
            void handleUncaughtError(event as ErrorEvent);
        },
        onUnhandledRejectionEvent(event: Event): void {
            void handleUnhandledRejection(event as PromiseRejectionEvent);
        },
    };
}

export function getRendererErrorMessage(errorLike: unknown): string {
    const { message } = toRendererErrorLike(errorLike);

    return typeof message === "string" && message.length > 0
        ? message
        : "Unknown error";
}

function toRendererErrorLike(value: unknown): RendererErrorLike {
    return typeof value === "object" && value !== null ? value : {};
}
