import { describe, expect, it, vi } from "vitest";

import { exportUtils } from "../../../../../electron-app/utils/files/export/exportUtils.js";

type PrintWindowDouble = Pick<
    Window,
    "close" | "document" | "focus" | "opener" | "print" | "setTimeout"
>;

function createPrintWindowDouble() {
    const printDocument = document.implementation.createHTMLDocument(""),
        printWindow: PrintWindowDouble = {
            close: vi.fn<Window["close"]>(),
            document: printDocument,
            focus: vi.fn<Window["focus"]>(),
            opener: window,
            print: vi.fn<Window["print"]>(),
            setTimeout: ((handler: TimerHandler) => {
                if (typeof handler === "function") {
                    handler();
                }

                return 1;
            }) as Window["setTimeout"],
        };

    return { printDocument, printWindow };
}

describe("exportUtils print windows", () => {
    it("prints a chart by building the popup document with DOM APIs", async () => {
        expect.assertions(7);

        const { printDocument, printWindow } = createPrintWindowDouble(),
            closeDocumentSpy = vi.spyOn(printDocument, "close"),
            openSpy = vi
                .spyOn(window, "open")
                .mockReturnValue(printWindow as unknown as Window),
            canvasContext = {
                drawImage: vi.fn<CanvasRenderingContext2D["drawImage"]>(),
                fillRect: vi.fn<CanvasRenderingContext2D["fillRect"]>(),
                fillStyle: "",
            } as unknown as CanvasRenderingContext2D,
            getContextSpy = vi
                .spyOn(HTMLCanvasElement.prototype, "getContext")
                .mockReturnValue(canvasContext),
            toDataUrlSpy = vi
                .spyOn(HTMLCanvasElement.prototype, "toDataURL")
                .mockReturnValue("data:image/png;base64,AAAA"),
            chartCanvas = document.createElement("canvas");

        chartCanvas.width = 320;
        chartCanvas.height = 180;

        try {
            await exportUtils.printChart({ canvas: chartCanvas });
            const imageElement =
                printDocument.querySelector<HTMLImageElement>("#ffv-print-img");
            imageElement?.dispatchEvent(new Event("load"));

            expect(openSpy).toHaveBeenCalledWith(
                "",
                "_blank",
                "noopener,noreferrer"
            );
            expect(printDocument.body.querySelectorAll("img")).toHaveLength(1);
            expect(imageElement?.getAttribute("alt")).toBe("Chart");
            expect(imageElement?.getAttribute("src")).toBe(
                "data:image/png;base64,AAAA"
            );
            expect(printDocument.querySelector("script")).not.toBeInstanceOf(
                HTMLScriptElement
            );
            expect(closeDocumentSpy).toHaveBeenCalledWith();
            expect(printWindow.print).toHaveBeenCalledWith();
        } finally {
            closeDocumentSpy.mockRestore();
            openSpy.mockRestore();
            getContextSpy.mockRestore();
            toDataUrlSpy.mockRestore();
        }
    });
});
