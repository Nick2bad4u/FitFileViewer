import { describe, expect, it, vi } from "vitest";

type ThemeColorMap = Record<string, readonly string[] | string>;

const mocks = vi.hoisted(() => ({
    getThemeColors: vi.fn<() => ThemeColorMap>(() => ({})),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
}));

vi.mock(import("../../../../../utils/charts/theming/getThemeColors.js"), () => ({
    getThemeColors: mocks.getThemeColors,
}));

vi.mock(
    import("../../../../../utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

describe("createPrintButton", () => {
    it("creates an accessible print button using theme colors", async () => {
        expect.assertions(5);

        mocks.getThemeColors.mockReturnValue({
            primary: "#111111",
            primaryAlpha: "rgba(17, 17, 17, 0.2)",
            surface: "#eeeeee",
        });

        const { createPrintButton } = await import(
            "../../../../../utils/files/export/createPrintButton.js"
        );

        const button = createPrintButton();
        const svg = button.querySelector("svg");
        const firstRect = svg?.querySelector("rect");

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect([...button.classList]).toStrictEqual([
            "map-action-btn",
            "print-button",
        ]);
        expect(button.getAttribute("aria-label")).toBe("Print or export map");
        expect(button.textContent).toBe("Print");
        expect(firstRect?.getAttribute("stroke")).toBe("#111111");
    });

    it("prints when clicked", async () => {
        expect.assertions(2);

        mocks.getThemeColors.mockReturnValue({});
        const print = vi.fn<() => void>();

        try {
            vi.stubGlobal("print", print);
            const { createPrintButton } = await import(
                "../../../../../utils/files/export/createPrintButton.js"
            );

            const button = createPrintButton();
            button.click();

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(print).toHaveBeenCalledOnce();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("shows a notification when printing fails", async () => {
        expect.assertions(2);

        mocks.getThemeColors.mockReturnValue({});
        mocks.showNotification.mockReset();

        try {
            vi.stubGlobal("print", () => {
                throw new Error("print failed");
            });
            const { createPrintButton } = await import(
                "../../../../../utils/files/export/createPrintButton.js"
            );

            expect(() => createPrintButton().click()).not.toThrow();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Print failed. Please try again.",
                "error"
            );
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
