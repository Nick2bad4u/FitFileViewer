import { describe, expect, it } from "vitest";

type FitParserIntegrationModule = {
    FIT_PARSER_OPERATION_ID: "fitFile:decode";
    createFitParserStateAdapters: () => {
        fitFileStateManager: {
            getRecordCount: (messages: unknown) => number;
        };
        performanceMonitor: {
            endTimer: (operationId: string) => null | number;
            getOperationTime: (operationId: string) => null | number;
            isEnabled: boolean;
            startTimer: (operationId: string) => void;
        };
        settingsStateManager: {
            getCategory: (category: string) => unknown;
            updateCategory: (
                category: string,
                value: Record<string, unknown>,
                options?: Record<string, unknown>
            ) => void;
        };
    };
    ensureFitParserStateIntegration: () => Promise<void>;
    resetFitParserStateIntegrationForTests: () => void;
    setFitParserStateAdaptersOverrideForTests: (override: unknown) => void;
};

async function importIntegrationModule(): Promise<FitParserIntegrationModule> {
    return (await import("../../../../../electron-app/main/runtime/fitParserIntegration.js")) as unknown as FitParserIntegrationModule;
}

describe("fitParserIntegration runtime state adapters", () => {
    it("exports the current main-process integration contract", async () => {
        expect.assertions(5);

        const module = await importIntegrationModule();

        expect(module.FIT_PARSER_OPERATION_ID).toBe("fitFile:decode");
        expect(module.createFitParserStateAdapters).toBeTypeOf("function");
        expect(module.ensureFitParserStateIntegration).toBeTypeOf("function");
        expect(module.resetFitParserStateIntegrationForTests).toBeTypeOf(
            "function"
        );
        expect(module.setFitParserStateAdaptersOverrideForTests).toBeTypeOf(
            "function"
        );
    });

    it("keeps parser integration test hooks off globalThis", async () => {
        expect.assertions(2);

        const module = await importIntegrationModule();
        module.setFitParserStateAdaptersOverrideForTests({});
        module.resetFitParserStateIntegrationForTests();

        expect(
            Reflect.has(globalThis, "__fitParserStateAdaptersOverride")
        ).toBe(false);
        expect(
            Reflect.has(globalThis, "__resetFitParserStateIntegrationForTests")
        ).toBe(false);
    });

    it("counts records from known FIT message container shapes", async () => {
        expect.assertions(3);

        const { createFitParserStateAdapters } =
            await importIntegrationModule();
        const { fitFileStateManager } = createFitParserStateAdapters();

        expect(
            fitFileStateManager.getRecordCount({
                recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }],
            })
        ).toBe(2);
        expect(
            fitFileStateManager.getRecordCount({
                records: { length: 3 },
            })
        ).toBe(3);
        expect(fitFileStateManager.getRecordCount(null)).toBe(0);
    });

    it("tracks parser operation timing through the performance adapter", async () => {
        expect.assertions(5);

        const { createFitParserStateAdapters } =
            await importIntegrationModule();
        const { performanceMonitor } = createFitParserStateAdapters();

        expect({ isEnabled: performanceMonitor.isEnabled }).toStrictEqual({
            isEnabled: true,
        });
        expect(performanceMonitor.getOperationTime("decode")).toBeNull();

        performanceMonitor.startTimer("decode");

        expect(performanceMonitor.getOperationTime("decode")).toBeTypeOf(
            "number"
        );
        expect(performanceMonitor.endTimer("decode")).toBeTypeOf("number");
        expect(performanceMonitor.endTimer("missing")).toBeNull();
    });

    it("resolves state integration without rethrowing optional runtime dependency failures", async () => {
        expect.assertions(1);

        const { ensureFitParserStateIntegration } =
            await importIntegrationModule();
        let thrownError: unknown = null;

        try {
            await ensureFitParserStateIntegration();
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBeNull();
    });
});
