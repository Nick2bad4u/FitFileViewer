import { validateExternalUrl } from "../../shared/externalUrlPolicy.js";
import { z } from "zod";

type ExternalInvokeChannel = import("../../shared/ipc").ExternalInvokeChannel;
type GyazoServerStartRequest =
    import("../../shared/ipc").GyazoServerStartRequest;
type GyazoServerStartResponse =
    import("../../shared/ipc").GyazoServerStartResponse;
type GyazoServerStopResponse =
    import("../../shared/ipc").GyazoServerStopResponse;
type ShellOpenExternalResponse =
    import("../../shared/ipc").ShellOpenExternalResponse;
type InvokeRequestArgs<Channel extends ExternalInvokeChannel> =
    import("../../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends ExternalInvokeChannel> =
    import("../../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

interface ExternalShell {
    openExternal: (url: string) => Promise<void>;
}

type RegisterExternalIpcHandler<Channel extends ExternalInvokeChannel> = (
    event: unknown,
    ...args: InvokeRequestArgs<Channel>
) =>
    | InvokeResponsePayloadForChannel<Channel>
    | Promise<InvokeResponsePayloadForChannel<Channel>>;

type RegisterExternalIpcCallback = (
    event: unknown,
    ...args: unknown[]
) => unknown;

type RegisterExternalIpcHandle = (
    channel: ExternalInvokeChannel,
    handler: RegisterExternalIpcCallback
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterExternalHandlersOptions {
    logWithContext?: LogWithContext;
    registerIpcHandle: RegisterExternalIpcHandle;
    shellRef?: () => ExternalShell | null | undefined;
    startGyazoOAuthServer?: (
        port?: GyazoServerStartRequest
    ) => Promise<GyazoServerStartResponse>;
    stopGyazoOAuthServer?: () => Promise<GyazoServerStopResponse>;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

// Security: restrict the callback server to non-privileged ports.
// Allow 0 so the OS can choose an ephemeral port.
const gyazoPortSchema = z.coerce
    .number()
    .int()
    .min(0)
    .max(65_535)
    .refine((port) => port === 0 || port >= 1024, {
        message: "Invalid port provided",
    });

/**
 * Registers IPC handlers for external integrations (shell and Gyazo server
 * control).
 */
export function registerExternalHandlers({
    registerIpcHandle,
    shellRef,
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
    logWithContext,
}: RegisterExternalHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    const registerExternalIpcHandle = <Channel extends ExternalInvokeChannel>(
        channel: Channel,
        handler: RegisterExternalIpcHandler<Channel>
    ): void => {
        registerIpcHandle(channel, handler as RegisterExternalIpcCallback);
    };

    registerExternalIpcHandle(
        "shell:openExternal",
        async (_event, url): Promise<ShellOpenExternalResponse> => {
            try {
                const validatedUrl = validateExternalUrl(url);

                const shell = shellRef?.();
                if (!shell || typeof shell.openExternal !== "function") {
                    throw new Error("shell.openExternal unavailable");
                }

                // eslint-disable-next-line sdl/no-electron-untrusted-open-external -- validateExternalUrl allows only https/mailto URLs without credentials.
                await shell.openExternal(validatedUrl);
                return true;
            } catch (error) {
                logWithContext?.("error", "Error in shell:openExternal:", {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        }
    );

    registerExternalIpcHandle(
        "gyazo:server:start",
        async (
            _event,
            port: unknown = 3000
        ): Promise<GyazoServerStartResponse> => {
            try {
                if (typeof startGyazoOAuthServer !== "function") {
                    throw new TypeError("Gyazo OAuth server start unavailable");
                }

                const parsed = gyazoPortSchema.safeParse(port);
                if (!parsed.success) {
                    throw new Error("Invalid port provided");
                }

                return await startGyazoOAuthServer(parsed.data);
            } catch (error) {
                logWithContext?.("error", "Error in gyazo:server:start:", {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        }
    );

    registerExternalIpcHandle(
        "gyazo:server:stop",
        async (): Promise<GyazoServerStopResponse> => {
            try {
                if (typeof stopGyazoOAuthServer !== "function") {
                    throw new TypeError("Gyazo OAuth server stop unavailable");
                }

                return await stopGyazoOAuthServer();
            } catch (error) {
                logWithContext?.("error", "Error in gyazo:server:stop:", {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        }
    );
}
