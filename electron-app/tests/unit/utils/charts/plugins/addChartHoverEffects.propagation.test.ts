import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const toggleChartFullscreenMock = vi.fn();
const subscribeToChartFullscreenMock = vi.fn(() => vi.fn());
const isChartFullscreenActiveMock = vi.fn(() => false);
const createIconElementMock = vi.fn(() => document.createElement("span"));

vi.mock("../../../../../utils/charts/fullscreen/chartFullscreenManager.js", () => ({
    toggleChartFullscreen: toggleChartFullscreenMock,
    subscribeToChartFullscreen: subscribeToChartFullscreenMock,
    isChartFullscreenActive: isChartFullscreenActiveMock,
}));
vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: () => ({ colors: {} }),
}));
vi.mock("../../../../../utils/ui/icons/iconMappings.js", () => ({
    createIconElement: createIconElementMock,
}));

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

beforeAll(() => {
    if (typeof globalThis.requestAnimationFrame !== "function") {
        globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
            callback(performance.now());
            return 0;
        };
    }
});

afterAll(() => {
    if (originalRequestAnimationFrame) {
        globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as Partial<typeof globalThis>).requestAnimationFrame;
    }
});

describe("addChartHoverEffects ripple propagation", () => {
    let previousChartGlobal: unknown;
    let currentStubChart: {
        canvas: HTMLCanvasElement | null;
        options: { plugins: { legend: Record<string, unknown> } };
        resetZoom: ReturnType<typeof vi.fn>;
        toggleDatasetVisibility: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        previousChartGlobal = (globalThis as Record<string, unknown>).Chart;
        document.body.innerHTML = "";

        const stubLegend = {
            display: true,
            labels: {},
        };
        currentStubChart = {
            canvas: null,
            options: {
                plugins: {
                    legend: stubLegend,
                },
            },
            resetZoom: vi.fn(),
            toggleDatasetVisibility: vi.fn(),
            update: vi.fn(),
        };

        (globalThis as Record<string, unknown>).Chart = {
            getChart: vi.fn(() => currentStubChart),
        };
    });

    afterEach(() => {
        document.body.innerHTML = "";
        toggleChartFullscreenMock.mockReset();
    subscribeToChartFullscreenMock.mockClear();
        isChartFullscreenActiveMock.mockReset();
    createIconElementMock.mockClear();
        if (previousChartGlobal === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (globalThis as Record<string, unknown>).Chart;
        } else {
            (globalThis as Record<string, unknown>).Chart = previousChartGlobal;
        }
    });

    it("stops wrapper click propagation so global listeners do not fire", async () => {
        const { addChartHoverEffects } = await import(
            "../../../../../utils/charts/plugins/addChartHoverEffects.js"
        );
        const container = document.createElement("div");
        const canvas = document.createElement("canvas");
        canvas.className = "chart-canvas";
    currentStubChart.canvas = canvas;
        container.append(canvas);
        document.body.append(container);

        addChartHoverEffects(container, { colors: {} });

        const wrapper = container.querySelector(".chart-wrapper");
        expect(wrapper).toBeInstanceOf(HTMLElement);

        const documentClickSpy = vi.fn();
        document.addEventListener("click", documentClickSpy);
        try {
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                clientX: 10,
                clientY: 20,
                button: 0,
            });
            const stopPropagationSpy = vi.fn();
            // Vitest's jsdom allows reassignment for testing observers
            (event as MouseEvent & { stopPropagation: () => void }).stopPropagation = stopPropagationSpy;

            (wrapper as HTMLElement).dispatchEvent(event);

            expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
            expect(documentClickSpy).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener("click", documentClickSpy);
        }
    });
});
