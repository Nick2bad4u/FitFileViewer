import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_SUMMARY_LAST_DATA_HASH_STATE_PATH = "summary.lastDataHash";

type RendererSummaryStateReader = (path: string) => unknown;
type RendererSummaryStateWriter = (
    path: string,
    value: unknown,
    options?: StateUpdateOptions
) => void;

function normalizeSummaryLastDataHash(value: unknown): string {
    return typeof value === "string" ? value : "";
}

export function getRendererSummaryLastDataHash(): string {
    return normalizeSummaryLastDataHash(
        getState(RENDERER_SUMMARY_LAST_DATA_HASH_STATE_PATH)
    );
}

export function getRendererSummaryLastDataHashFromState(
    readState: RendererSummaryStateReader
): string {
    return normalizeSummaryLastDataHash(
        readState(RENDERER_SUMMARY_LAST_DATA_HASH_STATE_PATH)
    );
}

export function setRendererSummaryLastDataHash(
    dataHash: string,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_SUMMARY_LAST_DATA_HASH_STATE_PATH, dataHash, {
        source: "rendererSummaryState.setLastDataHash",
        ...options,
    });
}

export function setRendererSummaryLastDataHashInState(
    writeState: RendererSummaryStateWriter,
    dataHash: string,
    options: StateUpdateOptions = {}
): void {
    writeState(RENDERER_SUMMARY_LAST_DATA_HASH_STATE_PATH, dataHash, {
        source: "rendererSummaryState.setLastDataHashInState",
        ...options,
    });
}
