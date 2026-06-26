import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import {
    __setTestDeps as setRawTestDeps,
    exportUtils as rawExportUtils,
} from "../../../electron-app/utils/files/export/exportUtils.js";
import type { RendererElectronApiScope } from "../../../electron-app/utils/runtime/electronApiRuntime.js";

type NotificationType = "error" | "info" | "success";

type TestDeps = {
    detectCurrentTheme: () => string;
    showNotification: (
        message: string,
        type: NotificationType
    ) => Promise<void> | void;
};

type ExportUtilsUnderTest = {
    copyChartToClipboard: (
        chart: unknown,
        options?: { electronApiScope?: RendererElectronApiScope }
    ) => Promise<void>;
    copyCombinedChartsToClipboard: (
        charts: unknown,
        options?: { electronApiScope?: RendererElectronApiScope }
    ) => Promise<void>;
    createGyazoAuthModal: (
        authUrl: string,
        state: string,
        resolve: (token: string) => void,
        reject: (reason?: unknown) => void,
        useServer: boolean
    ) => HTMLElement;
    createCombinedChartsImage: (
        charts: unknown,
        filename?: string
    ) => Promise<void>;
    downloadChartAsPNG: (chart: unknown, filename?: string) => Promise<void>;
    getExportThemeBackground: () => string;
    isValidChart: (chart: unknown) => boolean;
    showGyazoAccountManager: () => void;
    showGyazoSetupGuide: () => void;
    showImgurAccountManager: () => void;
    showImgurSetupGuide: () => void;
};

type MockContext = {
    drawImage: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    fillRect: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    fillStyle: string;
};

type CanvasFixture = {
    canvas: HTMLCanvasElement;
    context: MockContext;
    getContext: ReturnType<
        typeof vi.fn<(contextId: string) => CanvasRenderingContext2D | null>
    >;
    toDataURL: ReturnType<
        typeof vi.fn<(type?: string, quality?: number) => string>
    >;
};

type LinkFixture = {
    click: ReturnType<typeof vi.fn<() => void>>;
    link: HTMLAnchorElement;
    remove: ReturnType<typeof vi.fn<() => void>>;
};

type ChartFixture = {
    canvasFixture: CanvasFixture;
    chart: {
        canvas: HTMLCanvasElement;
        data: { datasets: unknown[] };
        destroy: ReturnType<typeof vi.fn<() => void>>;
        options: Record<string, unknown>;
        toBase64Image: ReturnType<
            typeof vi.fn<
                (type?: string, quality?: number, background?: string) => string
            >
        >;
        update: ReturnType<typeof vi.fn<() => void>>;
    };
};

type ClipboardApi = {
    write?: ReturnType<typeof vi.fn<(items: ClipboardItem[]) => Promise<void>>>;
};

type ElectronApiMock = {
    writeClipboardPngDataUrl: ReturnType<
        typeof vi.fn<(dataUrl: string) => boolean | Promise<boolean>>
    >;
};

const dependencyMocks = vi.hoisted(() => ({
    detectCurrentTheme: vi.fn<() => string>(() => "light"),
    getChartSetting: vi.fn<(key: string) => unknown>(() => null),
    showChartSelectionModal: vi.fn<() => void>(),
    showNotification: vi.fn<
        (message: string, type: NotificationType) => Promise<void>
    >(async () => undefined),
}));

vi.mock(
    import("../../../electron-app/utils/ui/components/createSettingsHeader.js"),
    () => ({
        showChartSelectionModal: dependencyMocks.showChartSelectionModal,
    })
);

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: dependencyMocks.showNotification,
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: dependencyMocks.detectCurrentTheme,
    })
);

vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: dependencyMocks.getChartSetting,
    })
);

class MockClipboardItem {
    readonly data: Record<string, Blob | PromiseLike<Blob> | string>;

    constructor(data: Record<string, Blob | PromiseLike<Blob> | string>) {
        this.data = data;
    }

    static supports(): boolean {
        return true;
    }
}

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost",
});

Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: dom.window.document,
});

Object.defineProperty(globalThis, "HTMLCanvasElement", {
    configurable: true,
    value: dom.window.HTMLCanvasElement,
});

Object.defineProperty(globalThis, "HTMLElement", {
    configurable: true,
    value: dom.window.HTMLElement,
});

Object.defineProperty(globalThis, "HTMLButtonElement", {
    configurable: true,
    value: dom.window.HTMLButtonElement,
});

Object.defineProperty(globalThis, "HTMLInputElement", {
    configurable: true,
    value: dom.window.HTMLInputElement,
});

Object.defineProperty(globalThis, "AbortController", {
    configurable: true,
    value: dom.window.AbortController,
});

Object.defineProperty(globalThis, "AbortSignal", {
    configurable: true,
    value: dom.window.AbortSignal,
});

Object.defineProperty(globalThis, "KeyboardEvent", {
    configurable: true,
    value: dom.window.KeyboardEvent,
});

Object.defineProperty(globalThis, "CanvasRenderingContext2D", {
    configurable: true,
    value: dom.window.CanvasRenderingContext2D,
});

Object.defineProperty(globalThis, "ClipboardItem", {
    configurable: true,
    value: MockClipboardItem,
});

const createRealElement = document.createElement.bind(document);
const exportUtils = rawExportUtils as ExportUtilsUnderTest;
const setTestDeps = setRawTestDeps as (deps: Partial<TestDeps>) => void;
let electronApiMock: ElectronApiMock | undefined;

function createMockContext(): MockContext {
    return {
        drawImage: vi.fn<(...args: unknown[]) => void>(),
        fillRect: vi.fn<(...args: unknown[]) => void>(),
        fillStyle: "",
    };
}

function createCanvasFixture(
    width = 800,
    height = 400,
    dataUrl = "data:image/png;base64,bW9jaw==",
    context: MockContext = createMockContext()
): CanvasFixture {
    const canvas = createRealElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const getContext = vi.fn<
        (contextId: string) => CanvasRenderingContext2D | null
    >((contextId) =>
        contextId === "2d"
            ? (context as unknown as CanvasRenderingContext2D)
            : null
    );
    const toDataURL = vi.fn<(type?: string, quality?: number) => string>(
        () => dataUrl
    );

    Object.defineProperty(canvas, "getContext", {
        configurable: true,
        value: getContext,
    });
    Object.defineProperty(canvas, "toDataURL", {
        configurable: true,
        value: toDataURL,
    });

    return { canvas, context, getContext, toDataURL };
}

function createLinkFixture(): LinkFixture {
    const link = createRealElement("a");
    const click = vi.fn<() => void>();
    const remove = vi.fn<() => void>(() => {
        link.parentNode?.removeChild(link);
    });

    Object.defineProperty(link, "click", {
        configurable: true,
        value: click,
    });
    Object.defineProperty(link, "remove", {
        configurable: true,
        value: remove,
    });

    return { click, link, remove };
}

function createChartFixture(): ChartFixture {
    const canvasFixture = createCanvasFixture();

    return {
        canvasFixture,
        chart: {
            canvas: canvasFixture.canvas,
            data: { datasets: [] },
            destroy: vi.fn<() => void>(),
            options: {},
            toBase64Image: vi.fn<
                (type?: string, quality?: number, background?: string) => string
            >(() => "data:image/png;base64,bW9jaw=="),
            update: vi.fn<() => void>(),
        },
    };
}

function installClipboard(write: ClipboardApi["write"]): void {
    Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: { clipboard: { write } },
        writable: true,
    });
}

function clearElectronApi(): void {
    electronApiMock = undefined;
}

function getElectronApiMock(): ElectronApiMock {
    if (!electronApiMock) {
        throw new Error("electronAPI mock was not installed");
    }

    return electronApiMock;
}

function installElectronApi(api: ElectronApiMock): void {
    electronApiMock = api;
}

function createExportApiScope(api: ElectronApiMock): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function expectCanvasSize(
    canvas: HTMLCanvasElement,
    size: { height: number; width: number }
): void {
    expect({
        height: canvas.height,
        width: canvas.width,
    }).toStrictEqual(size);
}

function setupDomHarness(): {
    chartFixture: ChartFixture;
    queueCanvas: (...fixtures: CanvasFixture[]) => void;
    queueLink: (...fixtures: LinkFixture[]) => void;
} {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    clearElectronApi();
    document.body.replaceChildren();

    dependencyMocks.detectCurrentTheme.mockReturnValue("light");
    dependencyMocks.getChartSetting.mockReturnValue(null);
    dependencyMocks.showNotification.mockResolvedValue(undefined);
    setTestDeps({
        detectCurrentTheme: dependencyMocks.detectCurrentTheme,
        showNotification: dependencyMocks.showNotification,
    });

    const chartFixture = createChartFixture();
    const canvasQueue: CanvasFixture[] = [];
    const linkQueue: LinkFixture[] = [];

    vi.spyOn(document, "createElement").mockImplementation(
        (tagName: string, options?: ElementCreationOptions): HTMLElement => {
            if (tagName === "canvas") {
                return (canvasQueue.shift() ?? chartFixture.canvasFixture)
                    .canvas;
            }

            if (tagName === "a") {
                return (linkQueue.shift() ?? createLinkFixture()).link;
            }

            return createRealElement(tagName, options);
        }
    );

    return {
        chartFixture,
        queueCanvas: (...fixtures) => {
            canvasQueue.push(...fixtures);
        },
        queueLink: (...fixtures) => {
            linkQueue.push(...fixtures);
        },
    };
}

describe("exportUtils chart export helpers", () => {
    /* eslint-disable vitest/prefer-to-be, vitest/prefer-to-be-falsy, vitest/prefer-to-be-truthy -- test-signal requires exact boolean assertions. */
    describe("export provider modal accessibility", () => {
        it("gives the Imgur settings modal dialog semantics and traps focus", async () => {
            expect.assertions(10);

            setupDomHarness();
            const opener = createRealElement("button");
            opener.textContent = "Open Imgur settings";
            document.body.append(opener);
            opener.focus();

            try {
                exportUtils.showImgurAccountManager();
                await Promise.resolve();

                const modal = document.querySelector(
                    ".imgur-account-manager-modal"
                );
                const clientIdInput =
                    document.querySelector("#imgur-client-id");
                const closeButton = document.querySelector("#imgur-close");

                expect(modal).toBeInstanceOf(HTMLElement);
                expect(clientIdInput).toBeInstanceOf(HTMLInputElement);
                expect(closeButton).toBeInstanceOf(HTMLButtonElement);

                const modalElement = modal as HTMLElement;

                expect(modalElement.getAttribute("role")).toBe("dialog");
                expect(modalElement.getAttribute("aria-modal")).toBe("true");
                expect(
                    modalElement.getAttribute("aria-labelledby")
                ).toBeTruthy();
                expect(document.activeElement).toBe(clientIdInput);

                document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        bubbles: true,
                        key: "Tab",
                        shiftKey: true,
                    })
                );

                expect(document.activeElement).toBe(closeButton);

                document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        bubbles: true,
                        key: "Escape",
                    })
                );

                expect(
                    document.querySelector(".imgur-account-manager-modal")
                ).toBe(null);
                expect(document.activeElement).toBe(opener);
            } finally {
                document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        bubbles: true,
                        key: "Escape",
                    })
                );
            }
        });

        it("applies dialog semantics to export provider setup and auth modals", async () => {
            expect.assertions(10);

            setupDomHarness();

            try {
                exportUtils.showGyazoSetupGuide();
                exportUtils.showImgurSetupGuide();
                const authOverlay = exportUtils.createGyazoAuthModal(
                    "https://gyazo.com/oauth/authorize",
                    "state",
                    vi.fn<(token: string) => void>(),
                    vi.fn<(reason?: unknown) => void>(),
                    false
                );
                document.body.append(authOverlay);
                await Promise.resolve();

                const dialogs = [
                    ...document.querySelectorAll("[role='dialog']"),
                ];

                expect(dialogs).toHaveLength(3);
                for (const dialog of dialogs) {
                    expect(dialog.getAttribute("aria-modal")).toBe("true");
                    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
                    expect(dialog.hasAttribute("aria-hidden")).toBe(false);
                }
            } finally {
                document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        bubbles: true,
                        key: "Escape",
                    })
                );
            }
        });
    });

    describe("isValidChart function", () => {
        it("returns false for null chart", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(exportUtils.isValidChart(null)).toStrictEqual(false);
        });

        it("returns false for undefined chart", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(exportUtils.isValidChart(undefined)).toStrictEqual(false);
        });

        it("returns false for chart without canvas", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(
                exportUtils.isValidChart({ data: {}, options: {} })
            ).toStrictEqual(false);
        });

        it("returns false for chart with canvas but no dimensions", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(
                exportUtils.isValidChart({ canvas: { height: 0, width: 0 } })
            ).toStrictEqual(false);
        });

        it("returns true for valid chart", () => {
            expect.assertions(1);

            const { chartFixture } = setupDomHarness();

            expect(exportUtils.isValidChart(chartFixture.chart)).toStrictEqual(
                true
            );
        });

        it("returns false for chart with invalid canvas width", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(
                exportUtils.isValidChart({ canvas: { height: 400, width: 0 } })
            ).toStrictEqual(false);
        });

        it("returns false for chart with invalid canvas height", () => {
            expect.assertions(1);

            setupDomHarness();

            expect(
                exportUtils.isValidChart({ canvas: { height: 0, width: 800 } })
            ).toStrictEqual(false);
        });
    });
    /* eslint-enable vitest/prefer-to-be, vitest/prefer-to-be-falsy, vitest/prefer-to-be-truthy */

    describe("getExportThemeBackground function", () => {
        it("returns light background when no export theme is set", () => {
            expect.assertions(2);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue(null);
            dependencyMocks.detectCurrentTheme.mockReturnValue("light");

            expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");
            expect(dependencyMocks.detectCurrentTheme).toHaveBeenCalledOnce();
        });

        it("returns dark background for dark theme", () => {
            expect.assertions(1);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("dark");

            expect(exportUtils.getExportThemeBackground()).toBe("#1a1a1a");
        });

        it("returns light background for light theme", () => {
            expect.assertions(1);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("light");

            expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");
        });

        it("returns transparent background for transparent theme", () => {
            expect.assertions(1);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("transparent");

            expect(exportUtils.getExportThemeBackground()).toBe("transparent");
        });

        it("detects dark background for auto theme", () => {
            expect.assertions(2);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("auto");
            dependencyMocks.detectCurrentTheme.mockReturnValue("dark");

            expect(exportUtils.getExportThemeBackground()).toBe("#1a1a1a");
            expect(dependencyMocks.detectCurrentTheme).toHaveBeenCalledOnce();
        });

        it("detects light background for auto theme", () => {
            expect.assertions(2);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("auto");
            dependencyMocks.detectCurrentTheme.mockReturnValue("light");

            expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");
            expect(dependencyMocks.detectCurrentTheme).toHaveBeenCalledOnce();
        });

        it("falls back to light for unknown theme values", () => {
            expect.assertions(2);

            setupDomHarness();
            dependencyMocks.getChartSetting.mockReturnValue("unknown-theme");

            expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");
            expect(dependencyMocks.detectCurrentTheme).not.toHaveBeenCalled();
        });
    });

    describe("downloadChartAsPNG function", () => {
        it("downloads chart with default filename", async () => {
            expect.assertions(5);

            const { chartFixture, queueLink } = setupDomHarness();
            const linkFixture = createLinkFixture();
            queueLink(linkFixture);

            await exportUtils.downloadChartAsPNG(chartFixture.chart);

            expect(linkFixture.link.download).toBe("chart.png");
            expect(linkFixture.link.href).toBe(
                "data:image/png;base64,bW9jaw=="
            );
            expect(linkFixture.link).toHaveProperty("isConnected", false);
            expect(chartFixture.chart.toBase64Image).toHaveBeenCalledWith(
                "image/png",
                1,
                "#ffffff"
            );
            expect(linkFixture.click).toHaveBeenCalledOnce();
        });

        it("downloads chart with custom filename", async () => {
            expect.assertions(2);

            const { chartFixture, queueLink } = setupDomHarness();
            const linkFixture = createLinkFixture();
            queueLink(linkFixture);

            await exportUtils.downloadChartAsPNG(
                chartFixture.chart,
                "custom-chart.png"
            );

            expect(linkFixture.link.download).toBe("custom-chart.png");
            expect(linkFixture.click).toHaveBeenCalledOnce();
        });

        it("notifies when chart image conversion fails", async () => {
            expect.assertions(2);

            const { chartFixture } = setupDomHarness();
            chartFixture.chart.toBase64Image.mockImplementation(() => {
                throw new Error("Canvas error");
            });

            await exportUtils.downloadChartAsPNG(chartFixture.chart);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to export chart as PNG",
                "error"
            );
        });
    });

    describe("createCombinedChartsImage function", () => {
        it("notifies for empty charts array", async () => {
            expect.assertions(2);

            setupDomHarness();

            await exportUtils.createCombinedChartsImage([]);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to create combined image",
                "error"
            );
        });

        it("notifies for null charts parameter", async () => {
            expect.assertions(2);

            setupDomHarness();

            await exportUtils.createCombinedChartsImage(null);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to create combined image",
                "error"
            );
        });

        it("creates combined image for single chart", async () => {
            expect.assertions(4);

            const { chartFixture, queueCanvas, queueLink } = setupDomHarness();
            const combinedCanvas = createCanvasFixture(
                0,
                0,
                "data:image/png;base64,Y29tYmluZWQ="
            );
            const linkFixture = createLinkFixture();
            queueCanvas(combinedCanvas);
            queueLink(linkFixture);

            await exportUtils.createCombinedChartsImage([chartFixture.chart]);

            expectCanvasSize(combinedCanvas.canvas, {
                height: 400,
                width: 800,
            });
            expect(linkFixture.link.download).toBe("combined-charts.png");
            expect(linkFixture.link.href).toBe(
                "data:image/png;base64,Y29tYmluZWQ="
            );
            expect(linkFixture.click).toHaveBeenCalledOnce();
        });

        it("creates combined image for multiple charts", async () => {
            expect.assertions(2);

            const { chartFixture, queueCanvas, queueLink } = setupDomHarness();
            const combinedCanvas = createCanvasFixture(
                0,
                0,
                "data:image/png;base64,Y29tYmluZWQ="
            );
            const linkFixture = createLinkFixture();
            queueCanvas(
                combinedCanvas,
                createCanvasFixture(),
                createCanvasFixture(),
                createCanvasFixture(),
                createCanvasFixture()
            );
            queueLink(linkFixture);

            await exportUtils.createCombinedChartsImage([
                chartFixture.chart,
                chartFixture.chart,
                chartFixture.chart,
                chartFixture.chart,
            ]);

            expectCanvasSize(combinedCanvas.canvas, {
                height: 820,
                width: 1620,
            });
            expect(linkFixture.link.href).toBe(
                "data:image/png;base64,Y29tYmluZWQ="
            );
        });

        it("notifies when combined canvas context creation fails", async () => {
            expect.assertions(2);

            const { chartFixture, queueCanvas } = setupDomHarness();
            const combinedCanvas = createCanvasFixture();
            combinedCanvas.getContext.mockReturnValue(null);
            queueCanvas(combinedCanvas);

            await exportUtils.createCombinedChartsImage([chartFixture.chart]);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to create combined image",
                "error"
            );
        });
    });

    describe("copyChartToClipboard function", () => {
        it("copies valid chart to browser clipboard", async () => {
            expect.assertions(4);

            const { chartFixture, queueCanvas } = setupDomHarness();
            const exportCanvas = createCanvasFixture();
            const writeClipboard = vi.fn<
                (items: ClipboardItem[]) => Promise<void>
            >(async () => undefined);
            queueCanvas(exportCanvas);
            installClipboard(writeClipboard);

            await exportUtils.copyChartToClipboard(chartFixture.chart);

            expect(exportCanvas.context.fillStyle).toBe("#ffffff");
            expect(writeClipboard).toHaveBeenCalledOnce();
            expect(exportCanvas.toDataURL).toHaveBeenCalledWith("image/png", 1);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Chart copied to clipboard",
                "success"
            );
        });

        it("notifies for invalid chart", async () => {
            expect.assertions(2);

            setupDomHarness();

            await exportUtils.copyChartToClipboard(null);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to copy chart to clipboard: Invalid chart instance provided",
                "error"
            );
        });

        it("notifies when Electron and browser clipboard writes fail", async () => {
            expect.assertions(4);

            const { chartFixture, queueCanvas } = setupDomHarness();
            const exportCanvas = createCanvasFixture();
            const writeClipboard = vi.fn<
                (items: ClipboardItem[]) => Promise<void>
            >(async () => {
                throw new Error("Permission denied");
            });
            const electronApi = {
                writeClipboardPngDataUrl: vi.fn<(dataUrl: string) => boolean>(
                    () => false
                ),
            };
            installElectronApi(electronApi);
            queueCanvas(exportCanvas);
            installClipboard(writeClipboard);

            await exportUtils.copyChartToClipboard(chartFixture.chart, {
                electronApiScope: createExportApiScope(electronApi),
            });

            expect(exportCanvas.context.fillStyle).toBe("#ffffff");
            expect(
                getElectronApiMock().writeClipboardPngDataUrl
            ).toHaveBeenCalledWith("data:image/png;base64,bW9jaw==");
            expect(writeClipboard).toHaveBeenCalledOnce();
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to copy chart to clipboard",
                "error"
            );
        });
    });

    describe("copyCombinedChartsToClipboard function", () => {
        it("notifies for empty charts array", async () => {
            expect.assertions(3);

            setupDomHarness();

            await exportUtils.copyCombinedChartsToClipboard([]);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to copy combined charts to clipboard",
                "error"
            );
            expect(
                dependencyMocks.showNotification.mock.calls.map(
                    ([_message, type]) => type
                )
            ).not.toContain("success");
        });

        it("notifies for null charts parameter", async () => {
            expect.assertions(2);

            setupDomHarness();

            await exportUtils.copyCombinedChartsToClipboard(null);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to copy combined charts to clipboard",
                "error"
            );
        });

        it("copies combined charts through the Electron bridge", async () => {
            expect.assertions(4);

            const { chartFixture, queueCanvas } = setupDomHarness();
            const combinedCanvas = createCanvasFixture(
                0,
                0,
                "data:image/png;base64,Y29tYmluZWQ="
            );
            const electronApi = {
                writeClipboardPngDataUrl: vi.fn<(dataUrl: string) => boolean>(
                    () => true
                ),
            };
            installElectronApi(electronApi);
            queueCanvas(combinedCanvas, createCanvasFixture());

            await exportUtils.copyCombinedChartsToClipboard(
                [chartFixture.chart],
                { electronApiScope: createExportApiScope(electronApi) }
            );

            expect(combinedCanvas.context.fillStyle).toBe("#ffffff");
            expect(
                getElectronApiMock().writeClipboardPngDataUrl
            ).toHaveBeenCalledWith("data:image/png;base64,Y29tYmluZWQ=");
            expectCanvasSize(combinedCanvas.canvas, {
                height: 400,
                width: 800,
            });
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Combined charts copied to clipboard",
                "success"
            );
        });
    });

    describe("error handling and edge cases", () => {
        it("notifies when combined chart canvas context is missing", async () => {
            expect.assertions(2);

            const { chartFixture, queueCanvas } = setupDomHarness();
            const combinedCanvas = createCanvasFixture();
            combinedCanvas.getContext.mockReturnValue(null);
            queueCanvas(combinedCanvas);

            await exportUtils.createCombinedChartsImage([chartFixture.chart]);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to create combined image",
                "error"
            );
        });

        it("skips fillRect for transparent background in combined charts", async () => {
            expect.assertions(3);

            const { chartFixture, queueCanvas, queueLink } = setupDomHarness();
            const combinedCanvas = createCanvasFixture(
                0,
                0,
                "data:image/png;base64,Y29tYmluZWQ="
            );
            const linkFixture = createLinkFixture();
            dependencyMocks.getChartSetting.mockReturnValue("transparent");
            queueCanvas(combinedCanvas, createCanvasFixture());
            queueLink(linkFixture);

            await exportUtils.createCombinedChartsImage([chartFixture.chart]);

            expect(combinedCanvas.context.fillRect).not.toHaveBeenCalled();
            expect(linkFixture.link.href).toBe(
                "data:image/png;base64,Y29tYmluZWQ="
            );
            expect(linkFixture.click).toHaveBeenCalledOnce();
        });

        it("notifies when a chart is missing toBase64Image", async () => {
            expect.assertions(2);

            const { chartFixture } = setupDomHarness();
            const invalidChart = {
                canvas: chartFixture.chart.canvas,
                data: {},
                options: {},
            };

            await exportUtils.downloadChartAsPNG(invalidChart);

            expect(document.body.childElementCount).toBe(0);
            expect(dependencyMocks.showNotification).toHaveBeenCalledWith(
                "Failed to export chart as PNG",
                "error"
            );
        });
    });
});
