{
    type RendererIpcEventChannel =
        import("../../shared/ipc").RendererIpcEventChannel;

    interface RendererWindowCandidate {
        isDestroyed?: () => boolean;
        webContents?: {
            isDestroyed?: () => boolean;
            send?: (
                channel: RendererIpcEventChannel,
                ...args: unknown[]
            ) => void;
        };
    }

    type RendererSendWindow = RendererWindowCandidate & {
        webContents: {
            send: (
                channel: RendererIpcEventChannel,
                ...args: unknown[]
            ) => void;
        };
    };

    const { validateWindow } = require("../window/windowValidation") as {
        validateWindow: (
            win?: null | RendererWindowCandidate,
            context?: string
        ) => boolean;
    };

    function hasRendererSend(
        win: RendererWindowCandidate
    ): win is RendererSendWindow {
        return typeof win.webContents?.send === "function";
    }

    /**
     * Sends an IPC message to the renderer only when the target window is still
     * usable.
     */
    function sendToRenderer(
        win: null | RendererWindowCandidate | undefined,
        channel: RendererIpcEventChannel,
        ...args: unknown[]
    ): void {
        if (
            win &&
            validateWindow(win, `IPC send to ${channel}`) &&
            hasRendererSend(win)
        ) {
            win.webContents.send(channel, ...args);
        }
    }

    module.exports = { sendToRenderer };
}
