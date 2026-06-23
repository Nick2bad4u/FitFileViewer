import { chartStateManager } from "./chartStateManager.js";
import {
    getRegisteredChartStateManager,
    registerChartStateManager,
    type RegisteredChartStateManager,
} from "./chartStateManagerRegistry.js";

export function ensureChartStateManagerRegistered(): RegisteredChartStateManager {
    const registeredChartStateManager = getRegisteredChartStateManager();
    if (registeredChartStateManager !== null) {
        return registeredChartStateManager;
    }

    registerChartStateManager(chartStateManager);
    return chartStateManager;
}
