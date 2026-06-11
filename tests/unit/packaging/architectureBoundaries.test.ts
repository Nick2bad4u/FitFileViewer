import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = [
    "electron-app/main",
    "electron-app/main-ui.ts",
    "electron-app/preload",
    "electron-app/preload.ts",
    "electron-app/renderer",
    "electron-app/renderer.ts",
    "electron-app/shared",
    "electron-app/ui",
    "electron-app/utils",
] as const;

const rendererAdjacentRoots = [
    "electron-app/main-ui.ts",
    "electron-app/renderer",
    "electron-app/renderer.ts",
    "electron-app/ui",
] as const;

const preloadRoots = [
    "electron-app/preload",
    "electron-app/preload.ts",
] as const;
const preloadInjectedRequireFiles = [
    "electron-app/preload/preloadEntrypoint.ts",
    "electron-app/preload/preloadBootstrap.ts",
    "electron-app/preload/preloadRuntime.ts",
    "electron-app/preload/preloadModuleLoader.ts",
    "electron-app/preload/preloadAppModuleLoader.ts",
    "electron-app/preload/preloadFileModuleLoader.ts",
    "electron-app/preload/preloadIpcModuleLoader.ts",
    "electron-app/preload/preloadStateModuleLoader.ts",
] as const;
const preloadRuntimeEnvironmentFiles = [
    "electron-app/preload/preloadRuntimeEnvironment.ts",
] as const;
const preloadDomainContractFiles = [
    "electron-app/preload/electronApiFactory.ts",
    "electron-app/preload/preloadModuleTypes.ts",
] as const;

const stateDomainRoots = ["electron-app/utils/state/domain"] as const;
const stateCoreRoots = ["electron-app/utils/state/core"] as const;
const rendererEntrypointFiles = ["electron-app/renderer.ts"] as const;
const rendererMainUiRuntimeEnvironmentFiles = [
    "electron-app/renderer/mainUiRuntimeEnvironment.ts",
] as const;
const playwrightSmokeFiles = ["tests/playwright/app-ui.spec.ts"] as const;
const rendererElectronApiRuntimeSourceFiles = [
    "electron-app/renderer/electronApiStartupHooks.ts",
    "electron-app/utils/app/initialization/rendererEnvironment.ts",
] as const;
const rendererElectronApiRuntimeRegressionTests = [
    "tests/unit/files/import/handleOpenFile.decodePayload.test.ts",
    "tests/unit/files/import/loadSingleOverlayFile.fitPayload.test.ts",
    "tests/unit/files/import/openFitFileFromPath.test.ts",
    "tests/unit/lifecycle/listeners.fitPayload.test.ts",
    "tests/unit/lifecycle/recentFilesContextMenu.fitPayload.test.ts",
    "tests/unit/strictTests/utils/app/lifecycle/listeners.test.ts",
    "tests/unit/strictTests/app/initialization/loadVersionInfo.test.ts",
    "tests/unit/strictTests/rendering/core/showFitData.test.ts",
    "tests/unit/strictTests/ui/modals/aboutModal.test.ts",
    "tests/unit/strictTests/ui/notifications/showUpdateNotification.test.ts",
    "tests/unit/strictTests/ui/main-ui.test.ts",
    "tests/unit/ui/dragDropHandler.fitPayload.test.ts",
    "tests/unit/utils/files/export/copyTableAsCSV.test.ts",
    "tests/unit/utils/files/export/exportUtils.oauthState.test.ts",
    "tests/unit/utils/files/export/exportUtils.test.ts",
    "tests/unit/utils/files/export/exportUtils.ui.test.ts",
    "electron-app/utils/files/export/exportUtils.test.ts",
    "tests/unit/utils/files/import/loadSingleOverlayFile.fallbacks.test.ts",
    "tests/unit/utils/files/import/loadSingleOverlayFile.test.ts",
    "tests/unit/utils/files/import/handleOpenFile.complete.test.ts",
    "tests/unit/utils/files/import/openFitFileFromPath.test.ts",
    "tests/unit/utils/files/import/openFileSelector.test.ts",
    "electron-app/utils/files/import/handleOpenFile.test.ts",
    "tests/unit/utils/app/lifecycle/menuIpcListeners.test.ts",
    "tests/unit/utils/app/events.test.ts",
    "tests/unit/utils/exportUtils.chartExport.test.ts",
    "tests/unit/utils/ui/browser/fileBrowserTab.accessibility.test.ts",
    "tests/unit/utils/ui/browser/initFitBrowserFeatureGate.test.ts",
    "tests/unit/utils/ui/controls/addFullScreenButton.test.ts",
    "tests/unit/utils/ui/links/externalLinkHandlers.test.ts",
    "tests/unit/utils/ui/modals/keyboardShortcutsModal.test.ts",
    "tests/unit/utils/ui/settingsModal.test.ts",
    "tests/unit/utils/state/integration/rendererStateIntegration.test.ts",
    "tests/unit/utils/theming/core/setupTheme.test.ts",
    "tests/unit/utils/theming/core/theme.additional.test.ts",
] as const;
const testSourceRoots = ["tests/unit", "tests/playwright"] as const;

const sourceExtensions = new Set([
    ".cjs",
    ".js",
    ".mjs",
    ".ts",
]);

const allowedLegacyGlobalDataBridgeFiles = new Set<string>();
const allowedGlobalDataWriterFiles = new Set<string>();
const allowedRuntimeGlobalDataMentionFiles = new Set<string>([
    "electron-app/utils/state/core/unifiedStateManager.ts",
]);

const migratedGlobalDataReaderFiles = [
    "electron-app/utils/rendering/helpers/renderSummaryHelpers.ts",
    "electron-app/utils/rendering/helpers/summaryColModal.ts",
    "electron-app/utils/rendering/components/createUserDeviceInfoBox.ts",
    "electron-app/utils/ui/components/createFieldTogglesSection.ts",
    "electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.ts",
    "electron-app/utils/charts/rendering/renderEventMessagesChart.ts",
    "electron-app/utils/charts/rendering/renderLapZoneCharts.ts",
    "electron-app/utils/charts/core/getChartCounts.ts",
    "electron-app/utils/charts/components/chartStatusIndicator.ts",
    "electron-app/utils/app/initialization/chartSettingsRender.ts",
    "electron-app/utils/app/lifecycle/listeners.ts",
    "electron-app/utils/state/core/unifiedStateManager.ts",
    "electron-app/utils/maps/controls/mapLapSelector.ts",
    "electron-app/utils/maps/layers/mapDrawLaps.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/debug/debugSensorInfo.ts",
    "electron-app/utils/ui/controls/createElevationProfileButton.ts",
] as const;
const migratedGlobalDataWriterFreeFiles = [
    "electron-app/utils/app/lifecycle/appActions.ts",
    "electron-app/utils/rendering/core/showFitData.ts",
] as const;
const migratedExplicitFitSliceReaderFiles = [
    "electron-app/utils/app/initialization/chartSettingsRender.ts",
    "electron-app/utils/app/lifecycle/appActions.ts",
    "electron-app/utils/app/lifecycle/listeners.ts",
    "electron-app/utils/charts/core/renderChartDevTools.ts",
    "electron-app/utils/charts/core/renderChartDirectRerender.ts",
    "electron-app/utils/charts/core/renderChartRenderedEvent.ts",
    "electron-app/utils/charts/core/renderChartStateManagement.ts",
    "electron-app/utils/charts/core/renderChartStateView.ts",
    "electron-app/utils/charts/rendering/renderLapZoneCharts.ts",
    "electron-app/utils/charts/theming/chartThemeListener.ts",
    "electron-app/utils/debug/debugSensorInfo.ts",
    "electron-app/utils/formatting/display/formatTooltipData.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/maps/layers/mapDrawLaps.ts",
    "electron-app/utils/rendering/components/createUserDeviceInfoBox.ts",
    "electron-app/utils/rendering/helpers/summaryColModal.ts",
    "electron-app/utils/state/integration/rendererStateIntegration.ts",
    "electron-app/utils/ui/components/createFieldTogglesSection.ts",
    "electron-app/utils/ui/controls/createElevationProfileButton.ts",
    "electron-app/utils/ui/controls/enableTabButtonsDebug.ts",
    "electron-app/utils/ui/tabs/tabStateManager.ts",
    "electron-app/utils/ui/tabs/updateTabVisibility.ts",
] as const;
const rendererUtilsFreeFiles = [
    "electron-app/utils/app/index.ts",
    "electron-app/utils/app/initialization/index.ts",
    "electron-app/utils/state/integration/stateIntegration.ts",
] as const;
const migratedRendererUtilityCallerFiles = [
    "electron-app/utils/files/import/loadOverlayFiles.ts",
    "electron-app/utils/maps/controls/mapActionButtons.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/rendering/components/shownFilesListItemHandlers.ts",
    "electron-app/utils/rendering/core/showFitData.ts",
    "electron-app/utils/ui/modals/openZoneColorPicker.ts",
    "electron-app/utils/ui/tabs/tabStateManagerHandlers.ts",
] as const;
const migratedChartImportFiles = [
    "electron-app/utils/charts/core/createManagedChart.ts",
    "electron-app/utils/charts/core/renderChartPluginRegistration.ts",
    "electron-app/utils/charts/components/createEnhancedChart.ts",
    "electron-app/utils/charts/plugins/addChartHoverEffects.ts",
    "electron-app/utils/charts/rendering/renderLapZoneChart.ts",
    "electron-app/utils/charts/rendering/renderZoneChart.ts",
    "electron-app/utils/data/zones/renderSingleHRZoneBar.ts",
    "electron-app/utils/data/zones/renderSinglePowerZoneBar.ts",
] as const;
const migratedChartRuntimeTestFiles = [
    "tests/unit/charts/renderLapZoneChart.test.ts",
    "tests/unit/strictTests/createEnhancedChart.test.ts",
    "tests/unit/strictTests/renderAltitudeProfileChart.test.ts",
    "tests/unit/strictTests/renderEventMessagesChart.test.ts",
    "tests/unit/strictTests/renderGPSTimeChart.test.ts",
    "tests/unit/strictTests/renderPowerVsHeartRateChart.test.ts",
    "tests/unit/strictTests/renderSpeedVsDistanceChart.test.ts",
    "tests/unit/strictTests/renderZoneChart.test.ts",
    "tests/unit/utils/charts/core/renderChartJS.comprehensive.test.ts",
    "tests/unit/utils/data/zones/renderSingleHRZoneBar.test.ts",
] as const;
const migratedChartNotificationCallerFiles = [
    "electron-app/utils/charts/core/renderChartNotificationHelpers.ts",
    "electron-app/utils/charts/rendering/renderLapZoneChart.ts",
    "electron-app/utils/charts/rendering/renderLapZoneCharts.ts",
    "electron-app/utils/data/zones/renderSingleHRZoneBar.ts",
    "electron-app/utils/data/zones/renderSinglePowerZoneBar.ts",
    "electron-app/utils/ui/modals/openZoneColorPicker.ts",
] as const;
const migratedRendererDebugLoggingStateFiles = [
    "electron-app/utils/charts/plugins/chartBackgroundColorPlugin.ts",
    "electron-app/utils/charts/plugins/chartZoomResetPlugin.ts",
    "electron-app/utils/debug/lastAnimLog.ts",
] as const;
const migratedStateDebugGlobalFreeFiles = [
    "electron-app/utils/debug/stateDevTools.ts",
    "electron-app/utils/state/core/masterStateManager.ts",
    "electron-app/utils/state/integration/stateIntegration.ts",
] as const;
const rendererVendorBrowserPackageImportAllowedFiles = [
    "electron-app/renderer/vendorGlobalsChartData.ts",
    "electron-app/renderer/vendorGlobalsMap.ts",
] as const;
const migratedDataTableImportFiles = [
    "electron-app/utils/rendering/core/renderTable.ts",
] as const;
const migratedRenderTableRuntimeFiles = [
    "electron-app/utils/rendering/core/renderTable.ts",
] as const;
const migratedChartInstanceRegistryFiles = [
    "electron-app/utils/charts/core/renderChartActions.ts",
    "electron-app/utils/charts/core/renderChartDataCharts.ts",
    "electron-app/utils/charts/core/renderChartDataCompletion.ts",
    "electron-app/utils/charts/core/renderChartDevTools.ts",
    "electron-app/utils/charts/core/renderChartExportState.ts",
    "electron-app/utils/charts/core/getChartCounts.ts",
    "electron-app/utils/charts/core/renderChartJS.ts",
    "electron-app/utils/charts/core/renderChartLifecycle.ts",
    "electron-app/utils/charts/core/renderChartPreparedExecution.ts",
    "electron-app/utils/charts/core/renderChartPrimaryFields.ts",
    "electron-app/utils/charts/core/renderChartRuntimeHelpers.ts",
    "electron-app/utils/charts/core/renderChartSessionStart.ts",
    "electron-app/utils/charts/rendering/renderLapZoneCharts.ts",
    "electron-app/utils/charts/rendering/renderZoneChart.ts",
    "electron-app/utils/app/initialization/chartSettingsRender.ts",
    "electron-app/utils/ui/components/createSettingsHeader.ts",
    "electron-app/utils/ui/controls/createInlineZoneColorSelector.ts",
    "electron-app/utils/ui/modals/openZoneColorPicker.ts",
    "electron-app/utils/charts/core/chartStateManager.ts",
    "electron-app/utils/charts/core/chartUpdater.ts",
    "electron-app/utils/charts/core/createManagedChart.ts",
    "electron-app/utils/files/export/exportAllCharts.ts",
] as const;
const migratedDomPurifyRuntimeFiles = [
    "electron-app/utils/dom/sanitizeHtmlAllowlist.ts",
] as const;
const migratedArqueroRuntimeFiles = [
    "electron-app/utils/rendering/helpers/renderSummaryHelpers.ts",
] as const;
const migratedExportZipRuntimeFiles = [
    "electron-app/utils/files/export/exportUtils.ts",
] as const;
const migratedCreatePrintButtonRuntimeFiles = [
    "electron-app/utils/files/export/createPrintButton.ts",
] as const;
const migratedCreateExportGPXButtonRuntimeFiles = [
    "electron-app/utils/files/export/createExportGPXButton.ts",
] as const;
const migratedCreateAddFitFileToMapButtonRuntimeFiles = [
    "electron-app/utils/ui/controls/createAddFitFileToMapButton.ts",
] as const;
const migratedAddExitFullscreenOverlayRuntimeFiles = [
    "electron-app/utils/ui/controls/addExitFullscreenOverlay.ts",
] as const;
const migratedRemoveExitFullscreenOverlayRuntimeFiles = [
    "electron-app/utils/ui/controls/removeExitFullscreenOverlay.ts",
] as const;
const migratedCreatePowerEstimationButtonRuntimeFiles = [
    "electron-app/utils/ui/controls/createPowerEstimationButton.ts",
] as const;
const migratedCreateMarkerCountSelectorRuntimeFiles = [
    "electron-app/utils/ui/controls/createMarkerCountSelector.ts",
] as const;
const migratedCreateDataPointFilterControlRuntimeFiles = [
    "electron-app/utils/ui/controls/createDataPointFilterControl.ts",
] as const;
const migratedCreateHRZoneControlsRuntimeFiles = [
    "electron-app/utils/ui/controls/createHRZoneControls.ts",
] as const;
const migratedCreatePowerZoneControlsRuntimeFiles = [
    "electron-app/utils/ui/controls/createPowerZoneControls.ts",
] as const;
const migratedCreatePowerZoneControlsSimpleRuntimeFiles = [
    "electron-app/utils/ui/controls/createPowerZoneControlsSimple.ts",
] as const;
const migratedDataPointFilterElementFactoryRuntimeFiles = [
    "electron-app/utils/ui/controls/dataPointFilterControl/elementFactory.ts",
] as const;
const migratedDataPointFilterPanelControllerRuntimeFiles = [
    "electron-app/utils/ui/controls/dataPointFilterControl/panelController.ts",
] as const;
const migratedLoadingOverlayRuntimeFiles = [
    "electron-app/utils/ui/components/LoadingOverlay.ts",
] as const;
const migratedSyncRendererLoadingRuntimeFiles = [
    "electron-app/utils/ui/loading/syncRendererLoading.ts",
] as const;
const migratedScreenfullRuntimeFiles = [
    "electron-app/utils/ui/controls/addFullScreenButton.ts",
] as const;
const migratedElectronApiAccessorFiles = [
    "electron-app/main-ui.ts",
    "electron-app/utils/app/initialization/loadVersionInfo.ts",
    "electron-app/utils/app/lifecycle/listeners.ts",
    "electron-app/utils/app/lifecycle/menuIpcListeners.ts",
    "electron-app/utils/app/lifecycle/recentFilesContextMenu.ts",
    "electron-app/utils/files/export/copyTableAsCSV.ts",
    "electron-app/utils/files/export/exportUtils.ts",
    "electron-app/utils/files/import/handleOpenFile.ts",
    "electron-app/utils/files/import/loadSingleOverlayFile.ts",
    "electron-app/utils/files/import/openFitFileFromPath.ts",
    "electron-app/utils/files/import/openFileSelector.ts",
    "electron-app/utils/rendering/core/showFitData.ts",
    "electron-app/utils/state/core/masterStateManager.ts",
    "electron-app/utils/state/integration/mainProcessStateClient.ts",
    "electron-app/utils/state/integration/rendererStateIntegration.ts",
    "electron-app/utils/ui/dragDropHandler.ts",
    "electron-app/utils/ui/browser/fileBrowserTab.ts",
    "electron-app/utils/ui/browser/initFitBrowserFeatureGate.ts",
    "electron-app/utils/ui/controls/addFullScreenButton.ts",
    "electron-app/utils/ui/mainUiDomUtils.ts",
    "electron-app/utils/ui/notifications/showUpdateNotification.ts",
    "electron-app/utils/ui/settingsModal.ts",
    "electron-app/utils/ui/links/externalLinkHandlers.ts",
    "electron-app/utils/theming/core/setupTheme.ts",
    "electron-app/utils/theming/core/theme.ts",
] as const;
const migratedAltFitSenderRuntimeFiles = [
    "electron-app/utils/files/import/sendFitFileToAltFitReader.ts",
] as const;
const migratedLoadSharedConfigurationRuntimeFiles = [
    "electron-app/utils/app/initialization/loadSharedConfiguration.ts",
] as const;
const migratedExternalLinkHandlersRuntimeFiles = [
    "electron-app/utils/ui/links/externalLinkHandlers.ts",
] as const;
const migratedMapActionButtonsRuntimeFiles = [
    "electron-app/utils/maps/controls/mapActionButtons.ts",
] as const;
const migratedOpenFileSelectorRuntimeFiles = [
    "electron-app/utils/files/import/openFileSelector.ts",
] as const;
const migratedFitBrowserFeatureGateRuntimeFiles = [
    "electron-app/utils/ui/browser/initFitBrowserFeatureGate.ts",
] as const;
const migratedCreateElevationProfileButtonRuntimeFiles = [
    "electron-app/utils/ui/controls/createElevationProfileButton.ts",
] as const;
const migratedLazyRenderingRuntimeFiles = [
    "electron-app/utils/app/performance/lazyRenderingUtils.ts",
] as const;
const migratedListenersResizeRuntimeFiles = [
    "electron-app/utils/app/lifecycle/listenersResize.ts",
] as const;
const migratedChartThemeRuntimeFiles = [
    "electron-app/utils/charts/theming/chartThemeUtils.ts",
] as const;
const migratedChartThemeListenerRuntimeFiles = [
    "electron-app/utils/charts/theming/chartThemeListener.ts",
] as const;
const migratedUpdateMapThemeRuntimeFiles = [
    "electron-app/utils/theming/specific/updateMapTheme.ts",
] as const;
const migratedChartStatusCountsRuntimeFiles = [
    "electron-app/utils/charts/components/createChartStatusIndicatorFromCounts.ts",
    "electron-app/utils/charts/components/createGlobalChartStatusIndicatorFromCounts.ts",
] as const;
const migratedGlobalChartStatusRuntimeFiles = [
    "electron-app/utils/charts/components/createGlobalChartStatusIndicator.ts",
] as const;
const migratedGlobalChartStatusUpdaterRuntimeFiles = [
    "electron-app/utils/charts/core/updateGlobalChartStatusIndicator.ts",
] as const;
const migratedChartStatusEventRuntimeFiles = [
    "electron-app/utils/charts/components/chartStatusIndicator.ts",
] as const;
const migratedSummaryColModalViewportRuntimeFiles = [
    "electron-app/utils/rendering/helpers/summaryColModal.ts",
] as const;
const migratedUpdateControlsStateRuntimeFiles = [
    "electron-app/utils/rendering/helpers/updateControlsState.ts",
] as const;
const migratedEnableTabButtonsDebugRuntimeFiles = [
    "electron-app/utils/ui/controls/enableTabButtonsDebug.ts",
] as const;
const migratedEnableTabButtonsRuntimeFiles = [
    "electron-app/utils/ui/controls/enableTabButtons.ts",
] as const;
const migratedEnableTabButtonsHelpersRuntimeFiles = [
    "electron-app/utils/ui/controls/enableTabButtonsHelpers.ts",
] as const;
const migratedUpdateTabVisibilityRuntimeFiles = [
    "electron-app/utils/ui/tabs/updateTabVisibility.ts",
] as const;
const migratedUnifiedControlBarRuntimeFiles = [
    "electron-app/utils/ui/unifiedControlBar.ts",
] as const;
const migratedCreditsMarqueeRuntimeFiles = [
    "electron-app/utils/ui/layout/enhanceCreditsSection.ts",
] as const;
const migratedEnsureChartSettingsDropdownsRuntimeFiles = [
    "electron-app/utils/ui/components/ensureChartSettingsDropdowns.ts",
] as const;
const migratedCreateFieldTogglesSectionRuntimeFiles = [
    "electron-app/utils/ui/components/createFieldTogglesSection.ts",
] as const;
const migratedCreateInlineZoneColorSelectorRuntimeFiles = [
    "electron-app/utils/ui/controls/createInlineZoneColorSelector.ts",
] as const;
const migratedMapLeafletRuntimeFiles = [
    "electron-app/utils/maps/controls/mapActionButtons.ts",
    "electron-app/utils/maps/controls/leafletPluginControls.ts",
    "electron-app/utils/maps/controls/mapMeasureTool.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/maps/layers/mapBaseLayers.ts",
    "electron-app/utils/maps/layers/mapDrawLaps.ts",
    "electron-app/utils/maps/layers/mapIcons.ts",
    "electron-app/utils/maps/layers/mapVectorLayers.ts",
    "electron-app/utils/rendering/components/shownFilesListItemHandlers.ts",
] as const;
const directLeafletRuntimeGlobalLookupAllowedFiles = [] as const;
const leafletCompatibilityGlobalDefinitionAllowedFiles = [] as const;
const directMapLibreBridgeAllowedFiles = [
    "electron-app/utils/maps/layers/mapVectorLayers.ts",
] as const;
const directFitFileRawDataSelectorAllowedFiles = [
    "electron-app/utils/state/domain/activeFitRawDataState.ts",
] as const;

const importSpecifierPattern =
    /\b(?:import\s+(?:[^'"]+\s+from\s+)?|export\s+[^'"]+\s+from\s+|require\()\s*["'](?<specifier>[^"']+)["']/gu;
const directGlobalDataWritePattern =
    /(?:\b(?:window|globalThis)\.globalData|\(\s*(?:window|globalThis)\s+as\b[^\n]*?\)\.globalData)\s*=/u;
const directGlobalDataReadPattern =
    /\b(?:window|globalThis)\.globalData\b|\.globalData\b/u;
const directGlobalDataPropertyDefinitionPattern =
    /\bObject\.defineProperty\(\s*(?:window|globalThis)\s*,\s*["']globalData["']/u;
const directGlobalDataReactivePropertyPattern =
    /\bcreateReactiveProperty\(\s*["']globalData["']/u;
const legacyAppStateGlobalDataPattern = /\bAppState\.globalData\b/u;
const legacyAppStateCompatibilityPattern =
    /\b(?:integrationGlobal|globalThis)\.AppState\b|\bAppState\.(?:eventListeners|isChartRendered)\b/u;
const legacyIsChartRenderedGlobalPattern =
    /\b(?:window|globalThis)\.isChartRendered\b|Object\.defineProperty\(\s*globalThis\s*,\s*["']isChartRendered["']/u;
const legacyGlobalDataBridgeFunctionPattern =
    /\bdefineLegacyGlobalDataBridge\b/u;
const globalDataStoreReaderImportPattern =
    /\bimport\s*\{[^}]*\bgetGlobalData\b[^}]*\}\s*from\s*["'][^"']*globalDataStore\.js["']/u;
const globalDataStoreWriterPattern =
    /\bimport\s*\{[^}]*\bsetGlobalData\b[^}]*\}\s*from\s*["'][^"']*globalDataStore\.js["']|\bsetGlobalData\s*\(/u;
const directGlobalDataStateReadPattern =
    /\b(?:getState|getStateMgr\(\)\.getState|stateManager\.getState)\(\s*["']globalData["']\s*\)/u;
const directGlobalDataStateWritePattern =
    /\b(?:setState|getStateMgr\(\)\.setState|stateManager\.setState)\(\s*["']globalData["']\s*,/u;
const runtimeGlobalDataMentionPattern = /\bglobalData\b/u;
const legacyStateHistoryStatePathPattern = /["']__stateHistory["']/u;
const directFitFileRawDataSelectorPattern =
    /\bFitFileSelectors\.getRawData\(\)/u;
const legacyLoadedFitFilesStatePathPattern =
    /["']globalData\.loadedFitFiles["']/u;
const legacyLoadedFitFilesGlobalLookupPattern =
    /\b(?:appGlobal|lifecycleGlobal|overlayGlobal|windowExt|win|window|globalThis)\.loadedFitFiles\b|Reflect\.deleteProperty\(\s*globalThis\s*,\s*["']loadedFitFiles["']\s*\)/u;
const directRendererUtilsGlobalPattern =
    /\b(?:window|globalThis)\.rendererUtils\s*=/u;
const directShowFitDataGlobalPattern =
    /\b(?:window|globalThis)\.showFitData\s*=/u;
const directShowFitDataGlobalDefinitionPattern =
    /\bObject\.defineProperty\(\s*(?:window|globalThis)\s*,\s*["']showFitData["']/u;
const directShowFitDataRendererImportPattern =
    /\bimport\s*\{\s*showFitData\s*\}\s*from\s*["'][^"']*showFitData\.js["']/u;
const directShowFitDataMapRenderedGlobalPattern =
    /\b(?:window|globalThis|getShowFitDataGlobal\(\)|showFitGlobal)\.isMapRendered\b/u;
const rendererUtilsUsagePattern = /\brendererUtils\b/u;
const migratedRendererUtilityGlobalLookupPattern =
    /\b(?:appGlobal|chartGlobal|window|globalThis|showFitGlobal|windowExt|zoneColorGlobal|getZoneColorSelectorGlobal\(\))\.(?:clearZoneColorData|createTables|invalidateChartRenderCache|renderChartJS|renderMap|renderSummary|resetAllSettings|setTabButtonsEnabled|setupActiveFileNameMapActions|setupOverlayFileNameMapActions|updateActiveTab|updateOverlayHighlights|updateInlineZoneColorSelectors|updateShownFilesList|updateTabVisibility)\b/u;
const directAltFitGlobalSenderPattern =
    /\b(?:appGlobal|window|globalThis|lifecycleGlobal|showFitGlobal|windowExt|getDragDropGlobal\(\)|getFileOpenGlobal\(\)|getOpenFitFileGlobal\(\))\.sendFitFileToAltFitReader\b/u;
const directOverlayHighlightGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|getWin\(\)|overlayGlobal|getOverlayGlobal\(\)|getMapActionButtonsGlobal\(\))\._highlightedOverlayIdx\b|Object\.defineProperty\(\s*[^,\n]+,\s*["'](?:_highlightedOverlayIdx|updateOverlayHighlights)["']/u;
const directShownFilesListGlobalPattern =
    /\b(?:window|globalThis|windowExt|overlayGlobal|getShownFilesGlobal\(\))\.updateShownFilesList\s*=/u;
const directOverlayFilesLoaderGlobalPattern =
    /\b(?:window|globalThis|appGlobal|getFileSelectorGlobal\(\))\.loadOverlayFiles\b/u;
const directOverlayTooltipTimeoutGlobalPattern =
    /\b(?:window|globalThis|windowExt|overlayGlobal|getOverlayGlobal\(\)|getShownFilesGlobal\(\))\._overlayTooltipTimeout\b/u;
const directOverlayTooltipTimeoutExpandoPattern = /\b_tooltipTimeout\b/u;
const directChartUpdaterGlobalPattern =
    /\b(?:window|globalThis|windowExt|chartGlobal|globalWindow|lifecycleGlobal|getChartResizeGlobal\(\))\.(?:ChartUpdater|chartUpdater)\b/u;
const directMapMarkerCountGlobalPattern =
    /\b(?:window|globalThis|windowExt|globalRef|win|getWin\(\))\.mapMarkerCount\b/u;
const directMapActionTimerGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|w2|getMapActionButtonsGlobal\(\))\.(?:__centerMainAttempts|__centerRetryHandle|__centerStatusNotified|__mainPolylineHighlightToken)\b/u;
const directMapMeasureControlGlobalPattern =
    /\b(?:window|globalThis|windowExt|overlayGlobal|getShownFilesGlobal\(\))\._measureControl\b/u;
const directLeafletMapInstanceGlobalPattern =
    /\b(?:window|globalThis|windowExt|globals|rendererGlobal|overlayGlobal|getOverlayGlobal\(\)|getMapActionButtonsGlobal\(\))\._leafletMapInstance\b/u;
const directMapPolylineRegistryGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|getWin\(\)|overlayGlobal|getOverlayGlobal\(\)|getMapActionButtonsGlobal\(\))\.(?:_overlayPolylines|_mainPolyline|_mainPolylineOriginalBounds)\b/u;
const directMapActivityLayerGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|getWin\(\))\.(?:_ffvActivityLayerGroup|_ffvDataPointMarkers)\b/u;
const directMapDataPointFilterGlobalPattern =
    /\b(?:window|globalThis|windowExt|win|getWin\(\)|getDataPointFilterGlobal\(\))\.(?:mapDataPointFilter|mapDataPointFilterLastResult)\b/u;
const directActiveMainMapFileGlobalPattern =
    /\b(?:window|globalThis|windowExt|win|getWin\(\))\._activeMainFileIdx\b/u;
const directAddFitOverlayButtonGlobalPattern =
    /\b(?:window|globalThis|globalRef)\.(?:__ffvAddFitOverlayButtonUpdate|__ffvAddFitOverlayButtonUnsubscribe)\b/u;
const directMapThemeToggleGlobalPattern =
    /\b(?:window|globalThis|appGlobal)\.(?:__ffvMapThemeToggleListenersController|__ffvMapThemeToggleListenersInstalled|__ffvMapThemeToggleUpdate|updateMapTheme)\b/u;
const directMapDocumentListenerGlobalPattern =
    /\b(?:window|globalThis|windowExt|appGlobal|getMapDocumentGlobal\(\))\.(?:__ffvLayoutLayersControl|__ffvMapDocumentListenersController|__ffvMapDocumentListenersInstalled|__ffvMapTypeButton|__ffvMapZoomDraggingRef|__ffvRenderMapAbortController)\b/u;
const directMapPluginControlGlobalPattern =
    /\b(?:window|globalThis|windowExt|globals|getMapPluginControlGlobal\(\))\.(?:_drawControl|_drawnItems|_miniMapControl)\b/u;
const directFileBrowserLibraryCacheGlobalPattern =
    /\b(?:window|globalThis|appGlobal|getFitBrowserGlobal\(\))\.__ffvLibraryCache\b/u;
const directFullscreenHandlerGlobalPattern =
    /\b(?:window|globalThis|testGlobal|getFullscreenGlobal\(\))\.(?:__ffvFullscreenKeydownHandler|__ffvNativeFullscreenChangeHandler)\b/u;
const directMenuForwardRegistryGlobalPattern =
    /\b(?:window|globalThis|holder|testGlobal|getMenuIpcGlobal\(\))\.__ffvMenuForwardRegistry\b/u;
const directAppMenuDebugRecentGlobalPattern =
    /\b(?:window|globalThis|getMenuGlobal\(\))\.(?:__FFV_debugMenu|__mockRecentFiles)\b|["'](?:__FFV_debugMenu|__mockRecentFiles)["']/u;
const directPreloadBeforeExitRegistryGlobalPattern =
    /\b(?:window|globalThis|globalScope)\.__ffv_preload_beforeExitRegistry__\b|["']__ffv_preload_beforeExitRegistry__["']/u;
const directAppMenuExportsGlobalPattern =
    /\b(?:window|globalThis|getMenuGlobal\(\))\.__FFV_createAppMenuExports\b|["']__FFV_createAppMenuExports["']/u;
const directFitFileStateManagerGlobalPattern =
    /\b(?:window|globalThis|getFileOpenGlobal\(\)|getOpenFitFileGlobal\(\)|getShowFitDataGlobal\(\))\.__FFV_fitFileStateManager\b|["']__FFV_fitFileStateManager["']/u;
const directMainProcessStateManagerExportsGlobalPattern =
    /\b(?:window|globalThis)\.__FFV_mainProcessStateManagerExports\b|["']__FFV_mainProcessStateManagerExports["']/u;
const directLegacyAppStateHandleGlobalPattern =
    /\b(?:window|globalThis|stateGlobal)\.__appState\b|["']__appState["']/u;
const directFilenameAutoScrollStateExpandoPattern =
    /\b(?:filenameElement|element)\.__ffvFilenameAutoScrollState\b/u;
const directQuickColorSwitcherStateExpandoPattern =
    /\b(?:switcher|element)\.__ffvQuickColorSwitcherState\b/u;
const directMapActionCleanupExpandoPattern =
    /\b(?:activeFileName|activeFileNameElement|element)\.__ffvMapActionCleanup\b/u;
const directLifecycleListenerCleanupExpandoPattern =
    /\b(?:openFileBtn|openButton|button|element|btnAny)\.__ffvLifecycleListenersCleanup\b|["']__ffvLifecycleListenersCleanup["']/u;
const directMapMeasureEscapeHandlerGlobalPattern =
    /\b(?:window|globalThis|g|getMeasureToolGlobal\(\))\.(?:__ffvMapMeasureEscapeHandler|__ffvLeafletMeasureLiteEscapeHandler)\b|["'](?:__ffvMapMeasureEscapeHandler|__ffvLeafletMeasureLiteEscapeHandler)["']/u;
const directLapSelectorMouseupHandlerGlobalPattern =
    /\b(?:window|globalThis|g|getLapSelectorGlobal\(\))\.__ffvLapSelectorMouseupHandler\b|["']__ffvLapSelectorMouseupHandler["']/u;
const directZoneDataGlobalPattern =
    /\b(?:window|globalThis|zoneGlobal|chartGlobal|runtimeGlobal|zoneColorGlobal|getZoneColorSelectorGlobal\(\))\.(?:heartRateZones|powerZones)\b/u;
const directChartNotificationSuppressionGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|notificationGlobal)\.__FFV_suppressNotifications\b|["']__FFV_suppressNotifications["']/u;
const directChartLoadingSuppressionGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.__FFV_suppressLoadingState\b|["']__FFV_suppressLoadingState["']/u;
const directChartDebugGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal|zoneGlobal|debugGlobal|chartHoverGlobal)\.(?:__FFV_debugCharts|__FFV_debugChartsVerbose|__FFV_traceFullscreen)\b/u;
const directChartPluginRegistrationMarkerPattern =
    /\b__ffvPluginsRegistered\b/u;
const directChartListenerStateGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.(?:_fitFileViewerChartListener|_fitFileViewerChartListenerAbortController|_fitFileViewerSharedConfigurationListener|_fitFileViewerSharedConfigurationAbortController)\b/u;
const directChartDevToolsGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal|getFieldToggleGlobal\(\))\.(?:__chartjs_dev|addHoverEffectsToExistingCharts)\b/u;
const directGyazoStartupTimerGlobalPattern =
    /\b(?:window|globalThis|testGlobals)\.__ffvGyazoStartupTimer\b|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']__ffvGyazoStartupTimer["']/u;
const directPrimeTestEnvironmentTimerGlobalPattern =
    /\b(?:window|globalThis|testGlobals)\.(?:__ffvTestKeepalive|__ffvTestRetryTimers)\b|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["'](?:__ffvTestKeepalive|__ffvTestRetryTimers)["']/u;
const directPrimeTestEnvironmentProbeGlobalPattern =
    /\b__ffvTestProbeInstalled\b/u;
const directSessionHandlerMarkerGlobalPattern =
    /\b__ffvSession(?:Permission|Download)HandlersRegistered\b/u;
const directResourceManagerGlobalPattern =
    /\b(?:window|globalThis)\.resourceManager\b|\{\s*resourceManager\?:\s*ResourceManager\s*\}\)\.resourceManager/u;
const directRendererApiExposureGlobalPattern =
    /\b(?:window|globalThis|scope)\.(?:APP_INFO|createExportGPXButton|__resetRendererStateInitializationForTests)\b|Reflect\.set\(\s*scope\s*,\s*["'](?:APP_INFO|createExportGPXButton|__resetRendererStateInitializationForTests)["']/u;
const directStateManagerApiGlobalPattern =
    /\b(?:window|globalThis|globalState|getMasterGlobal\(\))\.__STATE_MANAGER_API__\b|Object\.defineProperty\(\s*globalState\s*,\s*["']__STATE_MANAGER_API__["']/u;
const directMasterStateManagerMockGlobalPattern =
    /\b(?:window|globalThis|getMasterGlobal\(\))\.__FFV_MOCKS__\b|["']__FFV_MOCKS__["']/u;
const directChartControlsStateGlobalPattern =
    /\b(?:window|globalThis|integrationGlobal)\.chartControlsState\b|["']chartControlsState["']/u;
const directStateIntegrationTimerGlobalPattern =
    /\b(?:window|globalThis|integrationGlobal)\.(?:__performanceMonitoringInterval|__persistenceTimeout)\b|["'](?:__performanceMonitoringInterval|__persistenceTimeout)["']/u;
const directStateDebugGlobalPattern =
    /\b(?:window|globalThis|windowExt|globalState|getMasterGlobal\(\))\.(?:__state_debug|__stateDebug)\b|["'](?:__state_debug|__stateDebug)["']/u;
const directSingletonStateSubscriptionsGlobalPattern =
    /\b(?:window|globalThis|globalState)\.__ffvSingletonStateSubscriptions\b|["']__ffvSingletonStateSubscriptions["']/u;
const directFileAccessPolicyStateGlobalPattern =
    /\b(?:window|globalThis|g)\.__ffvFileAccessPolicyState\b|["']__ffvFileAccessPolicyState["']/u;
const directTabButtonsEnabledGlobalPattern =
    /\b(?:window|globalThis|getTabButtonsGlobal\(\)|global\.window)\.tabButtonsCurrentlyEnabled\b|["']tabButtonsCurrentlyEnabled["']/u;
const directTabButtonObserverGlobalPattern =
    /\b(?:window|globalThis|getTabButtonsGlobal\(\)|global\.window)\.tabButtonObserver\b|["']tabButtonObserver["']/u;
const directTabButtonHelperGlobalPattern =
    /\b(?:window|globalThis|getTabButtonsGlobal\(\)|global\.window)\.(?:areTabButtonsEnabled|debugTabButtons|debugTabState|forceEnableTabButtons|forceFixTabButtons|setTabButtonsEnabled|testTabButtonClicks)\b/u;
const directTabStateManagerGlobalPattern =
    /\b(?:window|globalThis)\.tabStateManager\b|\(\s*globalThis\s+as\s+TabStateManagerGlobal\s*\)\.tabStateManager\b/u;
const directTabVitestEnvironmentGlobalPattern =
    /\b__vitest_effective_(?:document|stateManager)__\b/u;
const directVitestObjectKeysThrowGlobalPattern =
    /\b__vitest_object_keys_allow_throw\b/u;
const directChartTabIntegrationGlobalPattern =
    /\b(?:window|globalThis|chartGlobal)\.chartTabIntegration\b|\(\s*globalThis\s+as\s+ChartTabIntegrationGlobal\s*\)\.chartTabIntegration\b/u;
const directChartStateManagerGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.chartStateManager\b|\(\s*globalThis\s+as\s+ChartStateGlobal\s*\)\.chartStateManager\b/u;
const directChartActionsGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.chartActions\b/u;
const directUiStateManagerGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.uiStateManager\b/u;
const directMainUiDragDropHandlerGlobalPattern =
    /\b(?:window|globalThis)\.dragDropHandler\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["']dragDropHandler["']\s*\)/u;
const directDragDropEnableGlobalPattern =
    /\b(?:window|globalThis)\.enableDragAndDrop\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["']enableDragAndDrop["']\s*\)|\benableDragAndDrop\?:/u;
const retiredRendererAmbientGlobalPattern =
    /\b(?:__appState|__DEVELOPMENT__|__persistenceTimeout|__state_debug|_chartjsInstances|_mapThemeListener|aboutModalDevHelpers|AppState|areTabButtonsEnabled|Chart|chartControlsState|ChartUpdater|chartUpdater|chartStateManager|clearZoneColorData|closeKeyboardShortcutsModal|createTables|debugTabButtons|debugTabState|devCleanup|dragDropHandler|enableDragAndDrop|forceEnableTabButtons|forceFixTabButtons|globalData|heartRateZones|injectMenu|L|loadedFitFiles|mapMarkerCount|powerZones|rendererUtils|renderChartJS|renderMap|renderSummary|resetAllSettings|screenfull|setTabButtonsEnabled|showFitData|showKeyboardShortcutsModal|showNotification|tabStateManager|testTabButtonClicks|updateInlineZoneColorSelectors|updateMapTheme)\?:|\bvar\s+(?:__vitest_effective_document__|L)\b/u;
const directMainUiDevelopmentHelperGlobalPattern =
    /\b(?:window|globalThis|getMainUiGlobal\(\)|mainUiGlobal)\.(?:injectMenu|devCleanup)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:injectMenu|devCleanup)["']\s*\)/u;
const directMainProcessDevHelpersGlobalPattern =
    /\b(?:window|globalThis)\.devHelpers\b|Object\.defineProperty\(\s*globalThis\s*,\s*["']devHelpers["']\s*\)|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']devHelpers["']\s*\)/u;
const directElectronHoistedMockGlobalAllowedFiles = new Set([
    "electron-app/main/runtime/electronAccess.ts",
    "electron-app/preload/electronBridge.ts",
    "electron-app/preload/preloadBootstrap.ts",
] as const);
const directElectronHoistedMockGlobalPattern =
    /\b(?:window|globalThis|getMenuGlobal\(\))\.__electronHoistedMock\b|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']__electronHoistedMock["']/u;
const directMenuModalPresenterGlobalPattern =
    /\b(?:window|globalThis|getMenuIpcGlobal\(\)|keyboardShortcutsGlobal|menuGlobal)\.(?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)["']\s*\)/u;
const directSettingsModalGlobalPattern =
    /\b(?:window|globalThis|settingsModalGlobal)\.(?:showSettingsModal|closeSettingsModal)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:showSettingsModal|closeSettingsModal)["']\s*\)/u;
const directAboutModalDevHelperGlobalPattern =
    /\b(?:window|globalThis|aboutGlobal)\.aboutModalDevHelpers\b|["']aboutModalDevHelpers["']/u;
const directActiveFitFileNameGlobalPattern =
    /\b(?:window|globalThis|windowGlobal|summaryGlobal)\.activeFitFileName\b|["']activeFitFileName["']/u;
const directChartConstructorGlobalPattern =
    /\b(?:window|globalThis|runtimeGlobal|chartGlobal|zoneGlobal)\.Chart\b/u;
const directShowNotificationGlobalLookupPattern =
    /\b(?:window|globalThis|chartGlobal|globalRef|runtimeGlobal|zoneColorGlobal|getRuntimeGlobal\(\))\.showNotification\b/u;
const directRendererDevGlobalPattern =
    /\b(?:window|globalThis|rendererGlobal)\.__renderer_dev\b|["']__renderer_dev["']/u;
const rendererDevelopmentDebugGlobalPattern =
    /\b(?:window|globalThis|rendererGlobal)\.(?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)\b|["'](?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)["']/u;
const rawGlobalThisAnyCastPattern = /\(\s*globalThis\s+as\s+any\s*\)/u;
const directDataTableGlobalPattern =
    /\b(?:window|globalThis|tableGlobal|renderTableGlobal)\.(?:\$|jQuery|DataTable)\b|\.jQuery\b/u;
const directRenderTableRuntimeGlobalPattern =
    /\b(?:document|globalThis)\.(?:createElement|getElementById|getComputedStyle|requestAnimationFrame)\b|(?:^|[^\w.])setTimeout\(|\binstanceof\s+(?:HTMLElement|HTMLTableCellElement)\b/u;
const directChartInstanceGlobalPattern = /\b_chartjsInstances\b/u;
const directChartCanvasExpandoPattern = /\b__chartjs\b/u;
const directDomPurifyGlobalPattern =
    /\b(?:window|globalThis|globalRef|testGlobal)\.DOMPurify\b|\bReflect\.get\(\s*globalThis\s*,\s*["']DOMPurify["']\s*\)|\{\s*DOMPurify\?:\s*unknown\s*\}\)\.DOMPurify/u;
const directArqueroGlobalPattern =
    /\b(?:window|globalThis|summaryGlobal|testGlobal)\.(?:aq|arquero)\b|\{\s*(?:aq|arquero)\?:\s*unknown\s*\}\)\.(?:aq|arquero)/u;
const directJSZipGlobalPattern =
    /\b(?:window|globalThis|testGlobal|getExportRuntimeGlobal\(\))\.JSZip\b|\{\s*JSZip\?:\s*unknown\s*\}\)\.JSZip/u;
const directScreenfullGlobalPattern =
    /\b(?:window|globalThis|testGlobal|getFullscreenGlobal\(\))\.screenfull\b|\{\s*screenfull\?:\s*unknown\s*\}\)\.screenfull/u;
const directLeafletGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|win|getWin\(\))\.L\b|\bReflect\.get\(\s*globalThis\s*,\s*["']L["']\s*\)|\{\s*L\?:\s*unknown\s*\}\)\.L/u;
const leafletCompatibilityGlobalDefinitionPattern =
    /\bObject\.defineProperty\(\s*[^,\n]+,\s*["']L["']/u;
const directMapLibreBridgePattern = /\.maplibreGL\b/u;
const bundledBrowserVendorImportPattern =
    /(?:from\s*["']|import\(\s*["']|require\(\s*["'])(?:chart\.js\/auto|chartjs-plugin-zoom|datatables\.net-dt)/u;
const rendererGenericPreloadIpcPattern =
    /\belectronAPI\.(?:invoke|onIpc|send)\b/u;
const localPreloadElectronApiPickPattern = /\bPick<\s*ElectronAPI\s*,/u;
const missingRendererVendorGlobalShimPattern = /\bdefineMissingGlobal\b/u;
const rendererVendorBundleGlobalMarkerPattern =
    /\b__FFV_RENDERER_VENDOR_BUNDLE__\b/u;
const rendererRuntimeGlobalFallbackPattern =
    /\b(?:__fitFileViewerRuntimeGlobalFallbackForTests|runtimeGlobalFallbackFlag|getGlobalRuntimeCandidate|getWindowRuntimeCandidate)\b/u;
const directElectronApiGlobalReadPattern =
    /\b(?:globalThis|window)\.electronAPI\b|\.\s*electronAPI\b|\(\s*globalThis\s+as\s+\{[^}]*electronAPI/u;
const directExternalLinkHandlersRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.open\b/u;
const directMapActionButtonsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:setTimeout|clearTimeout)\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directOpenFileSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|clearTimeout|createElement|queueMicrotask|setTimeout)\b|\bnavigator\.userAgent\b|(?:^|[^\w.])(?:queueMicrotask|setTimeout|clearTimeout)\(/u;
const directFitBrowserFeatureGateRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:querySelector|getElementById)\b|\binstanceof\s+HTMLElement\b/u;
const directCreateElevationProfileButtonRuntimeGlobalPattern =
    /(?<!\.)\b(?:document|globalThis|window)\.(?:body|chartOverlayColorPalette|createElement|createElementNS|open)\b|\bnew\s+AbortController\b/u;
const directAltFitSenderRuntimeGlobalPattern =
    /\bglobalThis\.(?:console|document|location)\b/u;
const directLoadSharedConfigurationRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.location\b/u;
const directLazyRenderingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:innerHeight|innerWidth|requestAnimationFrame|requestIdleCallback|setTimeout)\b|\bdocument\.documentElement\b|\btypeof\s+IntersectionObserver\b|\bnew\s+IntersectionObserver\b|\belement\s+instanceof\s+HTMLElement\b|\breturn\s+setTimeout\(/u;
const directListenersResizeRuntimeGlobalPattern =
    /\b(?:document|window|globalThis)\.|\bReflect\.get\(|\binstanceof\s+(?:Element|HTMLCanvasElement)\b|\bquerySelectorByIdFlexible\(\s*document\b|(?:^|[^\w.])(?:setTimeout|clearTimeout|requestAnimationFrame|cancelAnimationFrame)\(/u;
const directChartThemeRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:document|localStorage|matchMedia)\b|\bdocument\.body\b|\blocalStorage\.getItem\b/u;
const directChartThemeListenerRuntimeGlobalPattern =
    /\bdocument\.body\b|\binstanceof\s+CustomEvent\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directUpdateMapThemeRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|querySelector)\b|\btypeof\s+document\b|\binstanceof\s+HTMLElement\b/u;
const directChartStatusCountsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.inner(?:Height|Width)\b|\bdocument\.querySelector\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directGlobalChartStatusRuntimeGlobalPattern =
    /\bdocument\.querySelector\b|\binstanceof\s+HTMLElement\b/u;
const directGlobalChartStatusUpdaterRuntimeGlobalPattern =
    /\bdocument\.(?:body|querySelector)\b|\binstanceof\s+HTMLElement\b/u;
const directChartStatusEventGlobalPattern =
    /\bdocument\.(?:addEventListener|querySelector)\b|\b(?:globalThis|window)\.addEventListener\(\s*["']fieldToggleChanged["']|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directSummaryColModalViewportGlobalPattern =
    /\b(?:globalThis|window)\.inner(?:Height|Width)\b/u;
const directUpdateControlsStateRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.getComputedStyle\b/u;
const directEnableTabButtonsDebugRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:getComputedStyle|window)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directEnableTabButtonsRuntimeGlobalPattern =
    /\bglobalThis\.window\b|\btypeof\s+MutationObserver\b|\bReflect\.construct\b|\bgetTabButtonsGlobal\(\)|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directEnableTabButtonsHelpersRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:getComputedStyle|window)\b|\bReflect\.get\(\s*document\b|\btypeof\s+document\s*!==/u;
const directUpdateTabVisibilityRuntimeGlobalPattern =
    /\bglobalThis\.(?:document|requestAnimationFrame)\b|\breturn\s+document\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directUnifiedControlBarRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|body|clearTimeout|createElement|querySelector|removeEventListener|setTimeout)\b|\bnew\s+MutationObserver\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directCreditsMarqueeRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|querySelectorAll|removeEventListener)\b|\btypeof\s+ResizeObserver\b|\bnew\s+(?:MutationObserver|ResizeObserver)\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:requestAnimationFrame|cancelAnimationFrame)\(/u;
const directEnsureChartSettingsDropdownsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])setTimeout\(/u;
const directCreateFieldTogglesSectionRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|dispatchEvent|querySelectorAll)\b|\bnew\s+(?:AbortController|CustomEvent)\b|\binstanceof\s+HTMLInputElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directCreateInlineZoneColorSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|dispatchEvent)\b|\bnew\s+(?:AbortController|CustomEvent)\b|\binstanceof\s+(?:HTMLElement|HTMLInputElement|HTMLSelectElement)\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directCreatePrintButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS|print)\b/u;
const directCreateExportGPXButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|createElementNS|setTimeout)\b|\bURL\.(?:createObjectURL|revokeObjectURL)\b/u;
const directCreateAddFitFileToMapButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b|\bnew\s+AbortController\b/u;
const directAddExitFullscreenOverlayRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS|exitFullscreen|fullscreenElement)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b/u;
const directRemoveExitFullscreenOverlayRuntimeGlobalPattern =
    /\binstanceof\s+HTMLElement\b/u;
const directCreatePowerEstimationButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.createElement\b|\bnew\s+AbortController\b/u;
const directCreateMarkerCountSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b|\bnew\s+(?:AbortController|Event)\(/u;
const directCreateDataPointFilterControlRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.createElement\b|\bnew\s+AbortController\b|\btypeof\s+queueMicrotask\b|\bPromise\.resolve\(\)\.then\(/u;
const directCreateHRZoneControlsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directCreatePowerZoneControlsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directCreatePowerZoneControlsSimpleRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directDataPointFilterElementFactoryRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b/u;
const directDataPointFilterPanelControllerRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|body|innerHeight|innerWidth)\b|\bnew\s+AbortController\b|\binstanceof\s+Node\b|(?:^|[^\w.])(?:requestAnimationFrame|cancelAnimationFrame)\(/u;
const directLoadingOverlayRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|createElementNS|querySelector)\b/u;
const directSyncRendererLoadingRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|querySelector|querySelectorAll)\b|\binstanceof\s+(?:HTMLButtonElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement)\b/u;

function normalizeRepositoryPath(filePath: string): string {
    return filePath.replaceAll(path.sep, "/");
}

function collectSourceFiles(relativePath: string): string[] {
    const absolutePath = path.join(process.cwd(), relativePath);
    if (!existsSync(absolutePath)) {
        return [];
    }

    const stat = statSync(absolutePath);
    const normalizedRelativePath = normalizeRepositoryPath(relativePath);

    if (!stat.isDirectory()) {
        return sourceExtensions.has(path.extname(relativePath))
            ? [normalizedRelativePath]
            : [];
    }

    return readdirSync(absolutePath, { withFileTypes: true })
        .flatMap((entry) => {
            const entryPath = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                return collectSourceFiles(entryPath);
            }
            return sourceExtensions.has(path.extname(entry.name))
                ? [normalizeRepositoryPath(entryPath)]
                : [];
        })
        .sort();
}

function readRepositoryFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function getImportSpecifiers(source: string): string[] {
    return [...source.matchAll(importSpecifierPattern)]
        .map((match) => match.groups?.specifier)
        .filter((specifier): specifier is string => Boolean(specifier));
}

function getSourceImportTarget(
    importerPath: string,
    specifier: string,
    knownSourceFiles: ReadonlySet<string>
): null | string {
    if (specifier === "electron" || specifier.startsWith("node:")) {
        return specifier;
    }

    if (!specifier.startsWith(".")) {
        return null;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );
    const candidates = [
        resolvedPath,
        ...[...sourceExtensions].map(
            (extension) => `${resolvedPath}${extension}`
        ),
        ...[...sourceExtensions].map(
            (extension) => `${resolvedPath}/index${extension}`
        ),
    ];

    return (
        candidates.find((candidate) => knownSourceFiles.has(candidate)) ?? null
    );
}

function isMainProcessImportTarget(importTarget: string): boolean {
    return (
        importTarget === "electron" ||
        importTarget.startsWith("node:") ||
        importTarget === "electron-app/main" ||
        importTarget.startsWith("electron-app/main/")
    );
}

function stripComments(source: string): string {
    return source
        .replaceAll(/\/\*[\S\s]*?\*\//gu, "")
        .replaceAll(/^\s*\/\/.*$/gmu, "");
}

function resolvesIntoMainProcessSource(
    importerPath: string,
    specifier: string
): boolean {
    if (specifier === "electron" || specifier.startsWith("node:")) {
        return true;
    }

    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/main" ||
        resolvedPath.startsWith("electron-app/main/")
    );
}

function resolvesIntoAppMainProcessSource(
    importerPath: string,
    specifier: string
): boolean {
    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/main" ||
        resolvedPath.startsWith("electron-app/main/")
    );
}

function resolvesIntoRendererState(
    importerPath: string,
    specifier: string
): boolean {
    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/renderer" ||
        resolvedPath.startsWith("electron-app/renderer/") ||
        resolvedPath === "electron-app/utils/state" ||
        resolvedPath.startsWith("electron-app/utils/state/")
    );
}

function resolvesIntoRendererUtils(
    importerPath: string,
    specifier: string
): boolean {
    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath ===
            "electron-app/utils/app/initialization/rendererUtils" ||
        resolvedPath ===
            "electron-app/utils/app/initialization/rendererUtils.js"
    );
}

function resolvesIntoLegacyUtilities(
    importerPath: string,
    specifier: string
): boolean {
    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/utils/legacy" ||
        resolvedPath.startsWith("electron-app/utils/legacy/")
    );
}

function hasRepositoryFile(relativePath: string): boolean {
    return existsSync(path.join(process.cwd(), relativePath));
}

function collectTransitiveMainProcessImportViolations(
    startFiles: readonly string[]
): string[] {
    const knownSourceFiles = new Set(collectSourceFiles("electron-app"));
    const importGraph = new Map(
        [...knownSourceFiles].map((relativeFile) => [
            relativeFile,
            getImportSpecifiers(readRepositoryFile(relativeFile))
                .map((specifier) => ({
                    specifier,
                    target: getSourceImportTarget(
                        relativeFile,
                        specifier,
                        knownSourceFiles
                    ),
                }))
                .filter(
                    (
                        edge
                    ): edge is {
                        specifier: string;
                        target: string;
                    } => edge.target !== null
                ),
        ])
    );
    const violations: string[] = [];

    for (const startFile of startFiles) {
        const visitedFiles = new Set<string>();
        const stack = [{ chain: [startFile], file: startFile }];

        while (stack.length > 0) {
            const current = stack.pop();
            if (!current || visitedFiles.has(current.file)) {
                continue;
            }
            visitedFiles.add(current.file);

            for (const edge of importGraph.get(current.file) ?? []) {
                if (isMainProcessImportTarget(edge.target)) {
                    violations.push(
                        [
                            ...current.chain,
                            `${edge.specifier} -> ${edge.target}`,
                        ].join(" => ")
                    );
                    continue;
                }

                if (
                    edge.target.startsWith("electron-app/") &&
                    knownSourceFiles.has(edge.target)
                ) {
                    stack.push({
                        chain: [...current.chain, edge.target],
                        file: edge.target,
                    });
                }
            }
        }
    }

    return violations.sort();
}

describe("architecture boundaries", () => {
    it("keeps the temporary compatibility ledger explicit", () => {
        expect.assertions(2);

        const ledger = readRepositoryFile("docs/DEPRECATION_LEDGER.md");
        const requiredSections = [
            "Renderer Global Data Bridge",
            "Legacy AppState Global",
            "Renderer Utility Globals",
            "Vendor Runtime Adapters",
            "Runtime CommonJS Compatibility",
        ];
        const requiredSectionFields = [
            "Current owner",
            "Compatibility callers:",
            "Current status:",
            "Next removal step:",
            "Verification gates:",
            "Exit criteria:",
        ];

        expect(
            [...requiredSections, ...requiredSectionFields].filter(
                (requiredText) => !ledger.includes(requiredText)
            )
        ).toStrictEqual([]);
        expect(
            requiredSections.flatMap((sectionName) => {
                const sectionStart = ledger.indexOf(`## ${sectionName}`);
                if (sectionStart === -1) {
                    return [`${sectionName}: missing section`];
                }

                const nextSectionStart = ledger.indexOf(
                    "\n## ",
                    sectionStart + 1
                );
                const section =
                    nextSectionStart === -1
                        ? ledger.slice(sectionStart)
                        : ledger.slice(sectionStart, nextSectionStart);

                return requiredSectionFields
                    .filter((requiredField) => !section.includes(requiredField))
                    .map(
                        (requiredField) =>
                            `${sectionName}: missing ${requiredField}`
                    );
            })
        ).toStrictEqual([]);
    });

    it("keeps renderer-adjacent source out of main-process-only imports", () => {
        expect.assertions(1);

        const violations = rendererAdjacentRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoMainProcessSource(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps renderer-adjacent import graphs out of main-process-only modules", () => {
        expect.assertions(1);

        const violations = collectTransitiveMainProcessImportViolations(
            rendererAdjacentRoots.flatMap(collectSourceFiles)
        );

        expect(violations).toStrictEqual([]);
    });

    it("keeps preload modules out of app main-process source modules", () => {
        expect.assertions(1);

        const violations = preloadRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoAppMainProcessSource(
                            relativeFile,
                            specifier
                        )
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps preload modules from reaching into renderer state internals", () => {
        expect.assertions(1);

        const violations = preloadRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererState(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps app source off generic renderer preload IPC methods", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !relativeFile.startsWith("electron-app/preload") &&
                    rendererGenericPreloadIpcPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps preload API domain contracts in the shared preload API module", () => {
        expect.assertions(4);

        const localDomainContracts = preloadDomainContractFiles
            .filter((relativeFile) =>
                localPreloadElectronApiPickPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sharedPreloadApiSource = stripComments(
            readRepositoryFile("electron-app/shared/preloadApi.ts")
        );

        expect(localDomainContracts).toStrictEqual([]);
        expect(sharedPreloadApiSource).toContain("export type ElectronFileApi");
        expect(sharedPreloadApiSource).toContain(
            "export type ElectronMenuEventApi"
        );
        expect(sharedPreloadApiSource).toContain(
            "export type ElectronMainStateApi"
        );
    });

    it("keeps the preload event helper free of generic IPC methods", () => {
        expect.assertions(5);

        const preloadEventApiSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadEventApi.ts")
        );

        expect(preloadEventApiSource).not.toMatch(
            /\bfunction\s+(?:invoke|onIpc|send)\b/u
        );
        expect(preloadEventApiSource).not.toContain(
            "shouldAllowGenericIpcBridge"
        );
        expect(preloadEventApiSource).not.toContain(
            "isAllowedGenericInvokeChannel"
        );
        expect(preloadEventApiSource).not.toContain(
            "isAllowedGenericSendChannel"
        );
        expect(preloadEventApiSource).not.toContain(
            "isAllowedRendererIpcEventChannel"
        );
    });

    it("keeps the root preload entrypoint delegated to the preload entrypoint module", () => {
        expect.assertions(10);

        const preloadEntrySource = stripComments(
            readRepositoryFile("electron-app/preload.ts")
        );
        const preloadEntrypointSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadEntrypoint.ts")
        );
        const preloadEntryStatements = preloadEntrySource
            .split(/\r?\n/u)
            .map((line) => line.trim())
            .filter(Boolean);

        expect(preloadEntrySource).toContain(
            'import { startDefaultPreloadEntrypoint } from "./preload/preloadEntrypoint.js";'
        );
        expect(preloadEntrySource).toContain(
            "startDefaultPreloadEntrypoint();"
        );
        expect(preloadEntrySource).not.toContain("require");
        expect(preloadEntrypointSource).toMatch(
            /startPreloadEntrypoint\(\s*require\s*,/u
        );
        expect(preloadEntrypointSource).toContain(
            "loadPreloadRuntimeEnvironment("
        );
        expect(preloadEntrypointSource).not.toContain("globalThis");
        expect(preloadEntrySource).not.toContain(
            'require("./preload/preloadEntrypoint.js")'
        );
        expect(preloadEntrySource).not.toContain("startPreloadScript");
        expect(preloadEntrySource).not.toContain("PreloadModuleRequire");
        expect(preloadEntryStatements).toStrictEqual([
            'import { startDefaultPreloadEntrypoint } from "./preload/preloadEntrypoint.js";',
            "startDefaultPreloadEntrypoint();",
        ]);
    });

    it("keeps preload bootstrap loaders on the injected module require", () => {
        expect.assertions(1);

        const ambientRequirePattern = /\brequire\s*\(/u;
        const violations = preloadInjectedRequireFiles
            .filter((relativeFile) =>
                ambientRequirePattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps preload entry/bootstrap runtime globals behind the preload runtime environment facade", () => {
        expect.assertions(3);

        const runtimeGlobalPattern = /\b(?:console|globalThis|process)\b/u;
        const wiringFiles = [
            "electron-app/preload/preloadEntrypoint.ts",
            "electron-app/preload/preloadBootstrap.ts",
        ] as const;
        const runtimeGlobalViolations = wiringFiles
            .filter((relativeFile) =>
                runtimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(runtimeGlobalViolations).toStrictEqual([]);
        expect(preloadRuntimeEnvironmentFiles).toStrictEqual([
            "electron-app/preload/preloadRuntimeEnvironment.ts",
        ]);
        expect(
            preloadRuntimeEnvironmentFiles.every((relativeFile) =>
                runtimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
        ).toBe(true);
    });

    it("keeps the preload build transform bundling injected require calls", () => {
        expect.assertions(4);

        const bundlePreloadSource = stripComments(
            readRepositoryFile("scripts/bundle-preload.mjs")
        );

        expect(bundlePreloadSource).toContain(
            "preloadInjectedRequireBundlingPlugin"
        );
        expect(bundlePreloadSource).toContain(
            "preload-injected-require-bundling"
        );
        expect(bundlePreloadSource).toContain(
            '.replace(/\\brequireModule\\s*\\(/gu, "require(")'
        );
        expect(bundlePreloadSource).toContain(
            '.replace(/(["\'])\\.\\/preload\\//gu, "$1./")'
        );
    });

    it("keeps state domain modules out of broad renderer utilities", () => {
        expect.assertions(1);

        const violations = stateDomainRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps state core modules out of broad renderer utilities", () => {
        expect.assertions(1);

        const violations = stateCoreRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps globalDataStore imports out of runtime source", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    globalDataStoreReaderImportPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    ) ||
                    globalDataStoreWriterPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps the core state manager free of reactive global property bridges", () => {
        expect.assertions(3);

        const stateManagerSource = stripComments(
            readRepositoryFile("electron-app/utils/state/core/stateManager.ts")
        );

        expect(stateManagerSource).not.toContain(
            "export function createReactiveProperty"
        );
        expect(stateManagerSource).not.toContain(
            "Object.defineProperty(globalThis"
        );
        expect(stateManagerSource).not.toContain("Reflect.get(globalThis");
    });

    it("keeps the legacy appState manager free of reactive descriptor bridges", () => {
        expect.assertions(3);

        const appStateSource = stripComments(
            readRepositoryFile("electron-app/utils/state/domain/appState.ts")
        );

        expect(appStateSource).not.toContain("setupReactiveProperties");
        expect(appStateSource).not.toContain("createReactiveProperty");
        expect(appStateSource).not.toContain("Object.defineProperty");
    });

    it("keeps the legacy appState manager out of the public state-domain barrel", () => {
        expect.assertions(2);

        const domainBarrelSource = stripComments(
            readRepositoryFile("electron-app/utils/state/domain/index.ts")
        );
        const appDomainFacadeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/appDomainState.ts"
            )
        );

        expect(domainBarrelSource).not.toContain("./appState.js");
        expect(appDomainFacadeSource).toContain("./appState.js");
    });

    it("keeps renderer import-time bootstrap off legacy appState manual mocks", () => {
        expect.assertions(2);

        const importTimeBootstrapSource = stripComments(
            readRepositoryFile("electron-app/renderer/importTimeBootstrap.ts")
        );

        expect(importTimeBootstrapSource).not.toContain(
            "state/domain/appState.js"
        );
        expect(importTimeBootstrapSource).not.toContain(
            "touchManualAppStartTime"
        );
    });

    it("keeps renderer core module resolution on the app-domain state facade", () => {
        expect.assertions(2);

        const coreModuleResolutionSource = stripComments(
            readRepositoryFile("electron-app/renderer/coreModuleResolution.ts")
        );

        expect(coreModuleResolutionSource).toContain(
            "state/domain/appDomainState.js"
        );
        expect(coreModuleResolutionSource).not.toContain(
            "state/domain/appState.js"
        );
    });

    it("keeps renderer startup subscriptions behind the app-domain facade", () => {
        expect.assertions(2);

        const rendererEntrypointSource = stripComments(
            readRepositoryFile("electron-app/renderer.ts")
        );
        const stateStartupSource = stripComments(
            readRepositoryFile("electron-app/renderer/stateManagerStartup.ts")
        );

        expect(rendererEntrypointSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(stateStartupSource).toContain("subscribeAppDomainPath");
    });

    it("keeps renderer runtime globals behind the runtime environment facade", () => {
        expect.assertions(7);

        const rendererEntrypointSource = stripComments(
            readRepositoryFile("electron-app/renderer.ts")
        );
        const mainUiSource = stripComments(
            readRepositoryFile("electron-app/main-ui.ts")
        );
        const mainUiRuntimeGlobalPattern = /\bglobalThis\.console\b/u;

        expect(rendererEntrypointSource).toContain("runtimeEnvironment.js");
        expect(rendererEntrypointSource).not.toContain("globalThis.");
        expect(rendererEntrypointSource).not.toContain("document,");
        expect(mainUiSource).toContain(
            "renderer/mainUiRuntimeEnvironment.js"
        );
        expect(mainUiSource).not.toMatch(mainUiRuntimeGlobalPattern);
        expect(rendererMainUiRuntimeEnvironmentFiles).toStrictEqual([
            "electron-app/renderer/mainUiRuntimeEnvironment.ts",
        ]);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                mainUiRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
        ).toBe(true);
    });

    it("keeps Browser feature gating on the active-tab state facade", () => {
        expect.assertions(2);

        const featureGateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/browser/initFitBrowserFeatureGate.ts"
            )
        );

        expect(featureGateSource).toContain("rendererActiveTabState.js");
        expect(featureGateSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps Browser feature-gate DOM APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedFitBrowserFeatureGateRuntimeFiles
            .filter((relativeFile) =>
                directFitBrowserFeatureGateRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const featureGateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/browser/initFitBrowserFeatureGate.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(featureGateSource).toContain(
            "initFitBrowserFeatureGateRuntime.js"
        );
    });

    it("keeps add-FIT overlay button state on the active FIT raw-data facade", () => {
        expect.assertions(2);

        const overlayButtonStateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addFitOverlayButtonState.ts"
            )
        );

        expect(overlayButtonStateSource).toContain("activeFitRawDataState.js");
        expect(overlayButtonStateSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps chart settings dropdowns on the chart-controls state facade", () => {
        expect.assertions(2);

        const chartSettingsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/ensureChartSettingsDropdowns.ts"
            )
        );

        expect(chartSettingsSource).toContain("rendererChartControlsState.js");
        expect(chartSettingsSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps chart settings dropdown browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedEnsureChartSettingsDropdownsRuntimeFiles
            .filter((relativeFile) =>
                directEnsureChartSettingsDropdownsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const chartSettingsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/ensureChartSettingsDropdowns.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartSettingsSource).toContain(
            "ensureChartSettingsDropdownsRuntime.js"
        );
    });

    it("keeps field-toggle browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateFieldTogglesSectionRuntimeFiles
            .filter((relativeFile) =>
                directCreateFieldTogglesSectionRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const fieldTogglesSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/createFieldTogglesSection.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(fieldTogglesSource).toContain(
            "createFieldTogglesSectionRuntime.js"
        );
    });

    it("keeps inline zone selector browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateInlineZoneColorSelectorRuntimeFiles
            .filter((relativeFile) =>
                directCreateInlineZoneColorSelectorRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const inlineZoneSelectorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createInlineZoneColorSelector.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(inlineZoneSelectorSource).toContain(
            "createInlineZoneColorSelectorRuntime.js"
        );
    });

    it("keeps chart controls synchronization on the chart-controls state facade", () => {
        expect.assertions(2);

        const chartControlsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/updateControlsState.ts"
            )
        );

        expect(chartControlsSource).toContain("rendererChartControlsState.js");
        expect(chartControlsSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps chart status raw-data subscriptions on the active FIT facade", () => {
        expect.assertions(2);

        const chartStatusSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/components/chartStatusIndicator.ts"
            )
        );

        expect(chartStatusSource).toContain("activeFitRawDataState.js");
        expect(chartStatusSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps chart tab integration on renderer state facades", () => {
        expect.assertions(4);

        const chartTabIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartTabIntegration.ts"
            )
        );

        expect(chartTabIntegrationSource).toContain("activeFitRawDataState.js");
        expect(chartTabIntegrationSource).toContain("appDomainState.js");
        expect(chartTabIntegrationSource).toContain("rendererActiveTabState.js");
        expect(chartTabIntegrationSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps chart notification state on the chart render-state facade", () => {
        expect.assertions(2);

        const chartNotificationStateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartNotificationState.ts"
            )
        );

        expect(chartNotificationStateSource).toContain(
            "rendererChartRenderState.js"
        );
        expect(chartNotificationStateSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps chart performance monitoring on the chart performance state facade", () => {
        expect.assertions(2);

        const chartPerformanceMonitorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartPerformanceMonitor.ts"
            )
        );

        expect(chartPerformanceMonitorSource).toContain(
            "rendererChartPerformanceState.js"
        );
        expect(chartPerformanceMonitorSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps chart state manager on chart and renderer state facades", () => {
        expect.assertions(3);

        const chartStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartStateManager.ts"
            )
        );

        expect(chartStateManagerSource).toContain("rendererChartRenderState.js");
        expect(chartStateManagerSource).toContain("rendererActiveTabState.js");
        expect(chartStateManagerSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps renderChartJS on the chart state access boundary", () => {
        expect.assertions(2);

        const renderChartSource = stripComments(
            readRepositoryFile("electron-app/utils/charts/core/renderChartJS.ts")
        );

        expect(renderChartSource).toContain("renderChartStateAccess.js");
        expect(renderChartSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps chart render helpers on the chart state access boundary", () => {
        expect.assertions(2);

        const chartCoreStateAccessFile =
            "electron-app/utils/charts/core/renderChartStateAccess.ts";
        const directChartCoreStateImports = collectSourceFiles(
            "electron-app/utils/charts/core"
        )
            .filter((relativeFile) => relativeFile !== chartCoreStateAccessFile)
            .filter((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "state/core/stateManager.js"
                )
            )
            .sort();

        expect(directChartCoreStateImports).toStrictEqual([]);
        expect(
            stripComments(readRepositoryFile(chartCoreStateAccessFile))
        ).toContain("state/core/stateManager.js");
    });

    it("keeps chart settings rerender cache invalidation on the settings facade", () => {
        expect.assertions(4);

        const chartSettingsRenderSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/chartSettingsRender.ts"
            )
        );

        expect(chartSettingsRenderSource).toContain("settingsStateManager.js");
        expect(chartSettingsRenderSource).toContain(
            "chartSettingsRenderRuntime.js"
        );
        expect(chartSettingsRenderSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(chartSettingsRenderSource).not.toContain("globalThis");
    });

    it("keeps tab-button debug reads on renderer state facades", () => {
        expect.assertions(3);

        const tabButtonDebugSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsDebug.ts"
            )
        );

        expect(tabButtonDebugSource).toContain("rendererActiveTabState.js");
        expect(tabButtonDebugSource).toContain("rendererTabButtonsState.js");
        expect(tabButtonDebugSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps tab-button raw-data subscriptions on renderer state facades", () => {
        expect.assertions(3);

        const tabButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtons.ts"
            )
        );

        expect(tabButtonSource).toContain("activeFitRawDataState.js");
        expect(tabButtonSource).toContain("rendererTabButtonsState.js");
        expect(tabButtonSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps settings modal theme writes on the renderer theme state facade", () => {
        expect.assertions(2);

        const settingsModalSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/settingsModal.ts")
        );

        expect(settingsModalSource).toContain("rendererThemeState.js");
        expect(settingsModalSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps theme setup state access on the renderer theme state facade", () => {
        expect.assertions(2);

        const setupThemeSource = stripComments(
            readRepositoryFile("electron-app/utils/theming/core/setupTheme.ts")
        );

        expect(setupThemeSource).toContain("rendererThemeState.js");
        expect(setupThemeSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps tab state-manager support on the renderer state access facade", () => {
        expect.assertions(2);

        const tabStateManagerSupportSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabStateManagerSupport.ts"
            )
        );

        expect(tabStateManagerSupportSource).toContain(
            "rendererStateManagerAccess.js"
        );
        expect(tabStateManagerSupportSource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps active-tab updates on the renderer state access facade", () => {
        expect.assertions(2);

        const updateActiveTabSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/tabs/updateActiveTab.ts")
        );

        expect(updateActiveTabSource).toContain("rendererStateManagerAccess.js");
        expect(updateActiveTabSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps tab visibility updates on the renderer state access facade", () => {
        expect.assertions(2);

        const updateTabVisibilitySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/updateTabVisibility.ts"
            )
        );

        expect(updateTabVisibilitySource).toContain(
            "rendererStateManagerAccess.js"
        );
        expect(updateTabVisibilitySource).not.toContain(
            "state/core/stateManager.js"
        );
    });

    it("keeps FIT data display on renderer state facades", () => {
        expect.assertions(3);

        const showFitDataSource = stripComments(
            readRepositoryFile("electron-app/utils/rendering/core/showFitData.ts")
        );

        expect(showFitDataSource).toContain("rendererActiveFileState.js");
        expect(showFitDataSource).toContain("rendererMapRenderState.js");
        expect(showFitDataSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps map base-layer persistence on the map base-layer state facade", () => {
        expect.assertions(2);

        const renderMapSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/core/renderMap.ts")
        );

        expect(renderMapSource).toContain("mapBaseLayerState.js");
        expect(renderMapSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps file-open handling off direct core state-manager imports", () => {
        expect.assertions(1);

        const handleOpenFileSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/handleOpenFile.ts"
            )
        );

        expect(handleOpenFileSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps migrated runtime callers on explicit FIT state slices", () => {
        expect.assertions(1);

        const violations = migratedExplicitFitSliceReaderFiles
            .filter((relativeFile) =>
                directFitFileRawDataSelectorPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps active FIT raw-data storage on the explicit raw-data state slice", () => {
        expect.assertions(8);

        const globalDataStorePath =
            "electron-app/utils/state/core/globalDataStore.ts";
        const activeFitRawDataStateSource = readRepositoryFile(
            "electron-app/utils/state/domain/activeFitRawDataState.ts"
        );
        const unifiedStateManagerSource = readRepositoryFile(
            "electron-app/utils/state/core/unifiedStateManager.ts"
        );
        const stateManagerDefaultsSource = readRepositoryFile(
            "electron-app/utils/state/core/stateManagerDefaults.ts"
        );

        expect(existsSync(path.join(process.cwd(), globalDataStorePath))).toBe(
            false
        );
        expect(activeFitRawDataStateSource).toContain(
            'const ACTIVE_FIT_RAW_DATA_PATH = "fitFile.rawData";'
        );
        expect(activeFitRawDataStateSource).toContain(
            "setState(ACTIVE_FIT_RAW_DATA_PATH"
        );
        expect(stateManagerDefaultsSource).toContain("rawData: null");
        expect(stateManagerDefaultsSource).not.toContain("globalData: null");
        expect(unifiedStateManagerSource).toContain(
            'const BLOCKED_STATE_PATHS = new Set(["globalData"]);'
        );
        expect(unifiedStateManagerSource).not.toContain(
            "UNSUPPORTED_LEGACY_PATHS"
        );
        expect(unifiedStateManagerSource).not.toContain(
            '"globalData", "fitFile.rawData"'
        );
    });

    it("keeps Playwright smoke state assertions on explicit FIT activity slices", () => {
        expect.assertions(3);

        const violations = playwrightSmokeFiles
            .filter((relativeFile) =>
                directGlobalDataStateReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const smokeSource = readRepositoryFile(playwrightSmokeFiles[0]);

        expect(violations).toStrictEqual([]);
        expect(smokeSource).toContain(
            "./utils/state/domain/fitActivityDataState.js"
        );
        expect(smokeSource).toContain("getActiveFitActivityData");
    });

    it("keeps direct raw FIT data selectors quarantined to the active raw-data domain helper", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !directFitFileRawDataSelectorAllowedFiles.includes(
                        relativeFile as (typeof directFitFileRawDataSelectorAllowedFiles)[number]
                    ) &&
                    directFitFileRawDataSelectorPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps renderer entrypoints on focused bootstrap helpers", () => {
        expect.assertions(1);

        const violations = rendererEntrypointFiles
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps legacy utility imports quarantined to compatibility bridges", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !relativeFile.startsWith("electron-app/utils/legacy/")
            )
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoLegacyUtilities(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated chart renderers on typed Chart.js imports", () => {
        expect.assertions(1);

        const violations = migratedChartImportFiles
            .filter((relativeFile) =>
                directChartConstructorGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated chart tests on the Chart.js runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedChartRuntimeTestFiles
            .filter((relativeFile) =>
                directChartConstructorGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps direct Chart.js global constructor lookups out of runtime source", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                directChartConstructorGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated chart notification callers on typed imports", () => {
        expect.assertions(1);

        const violations = migratedChartNotificationCallerFiles
            .filter((relativeFile) =>
                directShowNotificationGlobalLookupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps shared error handling on explicit notification callbacks", () => {
        expect.assertions(2);

        const errorHandlingSource = stripComments(
            readRepositoryFile("electron-app/utils/errors/errorHandling.ts")
        );

        expect(
            directShowNotificationGlobalLookupPattern.test(errorHandlingSource)
        ).toBe(false);
        expect(errorHandlingSource).toContain("notifyUser");
    });

    it("keeps migrated renderer debug logging callers on typed state", () => {
        expect.assertions(1);

        const violations = migratedRendererDebugLoggingStateFiles
            .filter((relativeFile) =>
                directRendererDevGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps renderer development debug helpers off global surfaces", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                rendererDevelopmentDebugGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated master state monitoring off state debug globals", () => {
        expect.assertions(1);

        const violations = migratedStateDebugGlobalFreeFiles
            .filter((relativeFile) =>
                directStateDebugGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps state development tools on the debug state access facade", () => {
        expect.assertions(2);

        const stateDevToolsSource = stripComments(
            readRepositoryFile("electron-app/utils/debug/stateDevTools.ts")
        );

        expect(stateDevToolsSource).toContain("debugStateAccess.js");
        expect(stateDevToolsSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps app lifecycle actions on the app-actions state facade", () => {
        expect.assertions(2);

        const appActionsSource = stripComments(
            readRepositoryFile("electron-app/utils/app/lifecycle/appActions.ts")
        );

        expect(appActionsSource).toContain("appActionsState.js");
        expect(appActionsSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps migrated state history readers on the typed history API", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                legacyStateHistoryStatePathPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps overlay tooltip timeout state off DOM expandos", () => {
        expect.assertions(1);

        const violations = migratedRendererUtilityCallerFiles
            .filter((relativeFile) =>
                directOverlayTooltipTimeoutExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated chart lifecycle paths on the chart instance registry", () => {
        expect.assertions(1);

        const violations = migratedChartInstanceRegistryFiles
            .filter((relativeFile) =>
                directChartInstanceGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps app source off legacy Chart.js canvas expandos", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                directChartCanvasExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated table renderers on typed DataTables imports", () => {
        expect.assertions(1);

        const violations = migratedDataTableImportFiles
            .filter((relativeFile) =>
                directDataTableGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps table renderer browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedRenderTableRuntimeFiles
            .filter((relativeFile) =>
                directRenderTableRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const renderTableSource = stripComments(
            readRepositoryFile("electron-app/utils/rendering/core/renderTable.ts")
        );

        expect(violations).toStrictEqual([]);
        expect(renderTableSource).toContain("renderTableRuntime.js");
    });

    it("keeps direct DataTables global lookups out of runtime source", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                directDataTableGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps DataTables wired through the runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorChartDataEntry = stripComments(
            readRepositoryFile(
                "electron-app/renderer/vendorGlobalsChartData.ts"
            )
        );

        expect(vendorChartDataEntry).toContain(
            "setDataTableRuntime(DataTable)"
        );
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("DataTable"'
        );
    });

    it("keeps Chart.js wired through the runtime adapter instead of renderer globals", () => {
        expect.assertions(5);

        const vendorChartDataEntry = stripComments(
            readRepositoryFile(
                "electron-app/renderer/vendorGlobalsChartData.ts"
            )
        );

        expect(vendorChartDataEntry).toContain(
            "setChartRuntime(Chart, zoomPlugin)"
        );
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("Chart"'
        );
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("ChartZoom"'
        );
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("chartjsPluginZoom"'
        );
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("Hammer"'
        );
    });

    it("keeps migrated DOM sanitizers on the DOMPurify runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedDomPurifyRuntimeFiles
            .filter((relativeFile) =>
                directDomPurifyGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps DOMPurify wired through the runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/vendorGlobalsCore.ts")
        );

        expect(vendorCoreEntry).toContain("setDomPurifyRuntime(DOMPurify)");
        expect(vendorCoreEntry).not.toContain(
            'defineMissingGlobal("DOMPurify"'
        );
    });

    it("keeps migrated summary renderers on the Arquero runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedArqueroRuntimeFiles
            .filter((relativeFile) =>
                directArqueroGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps Arquero wired through the runtime adapter instead of renderer globals", () => {
        expect.assertions(3);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/vendorGlobalsCore.ts")
        );

        expect(vendorCoreEntry).toContain("setArqueroRuntime(arquero)");
        expect(vendorCoreEntry).not.toContain('defineMissingGlobal("aq"');
        expect(vendorCoreEntry).not.toContain('defineMissingGlobal("arquero"');
    });

    it("keeps migrated ZIP exports on the JSZip runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedExportZipRuntimeFiles
            .filter((relativeFile) =>
                directJSZipGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps JSZip wired through the export runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/vendorGlobalsCore.ts")
        );

        expect(vendorCoreEntry).toContain("setExportZipRuntime(JSZip)");
        expect(vendorCoreEntry).not.toContain('defineMissingGlobal("JSZip"');
    });

    it("keeps print button browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreatePrintButtonRuntimeFiles
            .filter((relativeFile) =>
                directCreatePrintButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createPrintButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/createPrintButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createPrintButtonSource).toContain(
            "createPrintButtonRuntime.js"
        );
    });

    it("keeps GPX export button browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateExportGPXButtonRuntimeFiles
            .filter((relativeFile) =>
                directCreateExportGPXButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createExportGPXButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/createExportGPXButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createExportGPXButtonSource).toContain(
            "createExportGPXButtonRuntime.js"
        );
    });

    it("keeps add-FIT-map button browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateAddFitFileToMapButtonRuntimeFiles
            .filter((relativeFile) =>
                directCreateAddFitFileToMapButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createAddFitFileToMapButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createAddFitFileToMapButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createAddFitFileToMapButtonSource).toContain(
            "createAddFitFileToMapButtonRuntime.js"
        );
    });

    it("keeps exit-fullscreen overlay browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedAddExitFullscreenOverlayRuntimeFiles
            .filter((relativeFile) =>
                directAddExitFullscreenOverlayRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const addExitFullscreenOverlaySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addExitFullscreenOverlay.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(addExitFullscreenOverlaySource).toContain(
            "addExitFullscreenOverlayRuntime.js"
        );
    });

    it("keeps exit-fullscreen overlay removal browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedRemoveExitFullscreenOverlayRuntimeFiles
            .filter((relativeFile) =>
                directRemoveExitFullscreenOverlayRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const removeExitFullscreenOverlaySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/removeExitFullscreenOverlay.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(removeExitFullscreenOverlaySource).toContain(
            "removeExitFullscreenOverlayRuntime.js"
        );
    });

    it("keeps power-estimation button browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreatePowerEstimationButtonRuntimeFiles
            .filter((relativeFile) =>
                directCreatePowerEstimationButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createPowerEstimationButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerEstimationButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createPowerEstimationButtonSource).toContain(
            "createPowerEstimationButtonRuntime.js"
        );
    });

    it("keeps marker-count selector browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateMarkerCountSelectorRuntimeFiles
            .filter((relativeFile) =>
                directCreateMarkerCountSelectorRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createMarkerCountSelectorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createMarkerCountSelector.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createMarkerCountSelectorSource).toContain(
            "createMarkerCountSelectorRuntime.js"
        );
    });

    it("keeps data-point filter control browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateDataPointFilterControlRuntimeFiles
            .filter((relativeFile) =>
                directCreateDataPointFilterControlRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const dataPointFilterControlSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createDataPointFilterControl.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(dataPointFilterControlSource).toContain(
            "createDataPointFilterControlRuntime.js"
        );
    });

    it("keeps HR zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateHRZoneControlsRuntimeFiles
            .filter((relativeFile) =>
                directCreateHRZoneControlsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const hrZoneControlsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createHRZoneControls.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(hrZoneControlsSource).toContain(
            "createHRZoneControlsRuntime.js"
        );
    });

    it("keeps power zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreatePowerZoneControlsRuntimeFiles
            .filter((relativeFile) =>
                directCreatePowerZoneControlsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const powerZoneControlsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerZoneControls.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(powerZoneControlsSource).toContain(
            "createPowerZoneControlsRuntime.js"
        );
    });

    it("keeps simple power zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreatePowerZoneControlsSimpleRuntimeFiles
            .filter((relativeFile) =>
                directCreatePowerZoneControlsSimpleRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const powerZoneControlsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerZoneControlsSimple.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(powerZoneControlsSource).toContain(
            "createPowerZoneControlsSimpleRuntime.js"
        );
    });

    it("keeps data-point filter element creation behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedDataPointFilterElementFactoryRuntimeFiles
            .filter((relativeFile) =>
                directDataPointFilterElementFactoryRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const elementFactorySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/dataPointFilterControl/elementFactory.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(elementFactorySource).toContain("elementFactoryRuntime.js");
    });

    it("keeps data-point filter panel browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedDataPointFilterPanelControllerRuntimeFiles
            .filter((relativeFile) =>
                directDataPointFilterPanelControllerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const panelControllerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/dataPointFilterControl/panelController.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(panelControllerSource).toContain("panelControllerRuntime.js");
    });

    it("keeps loading overlay browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedLoadingOverlayRuntimeFiles
            .filter((relativeFile) =>
                directLoadingOverlayRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const loadingOverlaySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/LoadingOverlay.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(loadingOverlaySource).toContain("LoadingOverlayRuntime.js");
    });

    it("keeps renderer loading sync DOM APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedSyncRendererLoadingRuntimeFiles
            .filter((relativeFile) =>
                directSyncRendererLoadingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const syncRendererLoadingSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/loading/syncRendererLoading.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(syncRendererLoadingSource).toContain(
            "syncRendererLoadingRuntime.js"
        );
    });

    it("keeps migrated fullscreen controls on the screenfull runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedScreenfullRuntimeFiles
            .filter((relativeFile) =>
                directScreenfullGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps screenfull wired through the runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/vendorGlobalsCore.ts")
        );

        expect(vendorCoreEntry).toContain("setScreenfullRuntime(screenfull)");
        expect(vendorCoreEntry).not.toContain(
            'defineMissingGlobal("screenfull"'
        );
    });

    it("keeps migrated renderer Electron API callers on the typed accessor", () => {
        expect.assertions(1);

        const violations = migratedElectronApiAccessorFiles
            .filter((relativeFile) =>
                directElectronApiGlobalReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps external link browser fallbacks behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedExternalLinkHandlersRuntimeFiles
            .filter((relativeFile) =>
                directExternalLinkHandlersRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const externalLinkHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/links/externalLinkHandlers.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(externalLinkHandlersSource).toContain(
            "externalLinkHandlersRuntime.js"
        );
    });

    it("keeps map action timers behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedMapActionButtonsRuntimeFiles
            .filter((relativeFile) =>
                directMapActionButtonsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapActionButtonsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/controls/mapActionButtons.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(mapActionButtonsSource).toContain("mapActionButtonsRuntime.js");
    });

    it("keeps open-file selector browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedOpenFileSelectorRuntimeFiles
            .filter((relativeFile) =>
                directOpenFileSelectorRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const openFileSelectorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/openFileSelector.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(openFileSelectorSource).toContain(
            "openFileSelectorRuntime.js"
        );
    });

    it("keeps elevation profile button browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreateElevationProfileButtonRuntimeFiles
            .filter((relativeFile) =>
                directCreateElevationProfileButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const createElevationProfileButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createElevationProfileButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createElevationProfileButtonSource).toContain(
            "createElevationProfileButtonRuntime.js"
        );
    });

    it("keeps migrated AltFit handoff defaults behind the runtime facade", () => {
        expect.assertions(1);

        const violations = migratedAltFitSenderRuntimeFiles
            .filter((relativeFile) =>
                directAltFitSenderRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps shared configuration URL reads behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedLoadSharedConfigurationRuntimeFiles
            .filter((relativeFile) =>
                directLoadSharedConfigurationRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const loadSharedConfigurationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/loadSharedConfiguration.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(loadSharedConfigurationSource).toContain(
            "loadSharedConfigurationRuntime.js"
        );
    });

    it("keeps lazy rendering browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedLazyRenderingRuntimeFiles
            .filter((relativeFile) =>
                directLazyRenderingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const lazyRenderingUtilsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/performance/lazyRenderingUtils.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(lazyRenderingUtilsSource).toContain("lazyRenderingRuntime.js");
    });

    it("keeps resize listener browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedListenersResizeRuntimeFiles
            .filter((relativeFile) =>
                directListenersResizeRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const listenersResizeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/listenersResize.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(listenersResizeSource).toContain("listenersResizeRuntime.js");
    });

    it("keeps chart theme browser reads behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedChartThemeRuntimeFiles
            .filter((relativeFile) =>
                directChartThemeRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const chartThemeUtilsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/theming/chartThemeUtils.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartThemeUtilsSource).toContain("chartThemeRuntime.js");
    });

    it("keeps chart theme listener browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedChartThemeListenerRuntimeFiles
            .filter((relativeFile) =>
                directChartThemeListenerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const chartThemeListenerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/theming/chartThemeListener.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartThemeListenerSource).toContain(
            "chartThemeListenerRuntime.js"
        );
    });

    it("keeps map theme browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedUpdateMapThemeRuntimeFiles
            .filter((relativeFile) =>
                directUpdateMapThemeRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const updateMapThemeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/specific/updateMapTheme.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateMapThemeSource).toContain("updateMapThemeRuntime.js");
    });

    it("keeps chart status counts browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedChartStatusCountsRuntimeFiles
            .filter((relativeFile) =>
                directChartStatusCountsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedChartStatusCountsRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "chartStatusIndicatorRuntime.js"
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
    });

    it("keeps global chart status DOM lookups behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedGlobalChartStatusRuntimeFiles
            .filter((relativeFile) =>
                directGlobalChartStatusRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedGlobalChartStatusRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "chartStatusIndicatorRuntime.js"
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
    });

    it("keeps global chart status updater DOM lookups behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedGlobalChartStatusUpdaterRuntimeFiles
            .filter((relativeFile) =>
                directGlobalChartStatusUpdaterRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedGlobalChartStatusUpdaterRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "chartStatusIndicatorRuntime.js"
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
    });

    it("keeps chart status field-toggle listeners behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedChartStatusEventRuntimeFiles
            .filter((relativeFile) =>
                directChartStatusEventGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const chartStatusIndicatorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/components/chartStatusIndicator.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartStatusIndicatorSource).toContain(
            "chartStatusIndicatorRuntime.js"
        );
    });

    it("keeps summary column modal viewport reads behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedSummaryColModalViewportRuntimeFiles
            .filter((relativeFile) =>
                directSummaryColModalViewportGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const summaryColModalSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/summaryColModal.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(summaryColModalSource).toContain("summaryColModalRuntime.js");
    });

    it("keeps controls-state computed style reads behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedUpdateControlsStateRuntimeFiles
            .filter((relativeFile) =>
                directUpdateControlsStateRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const updateControlsStateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/updateControlsState.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateControlsStateSource).toContain(
            "updateControlsStateRuntime.js"
        );
    });

    it("keeps tab-button debug runtime checks behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedEnableTabButtonsDebugRuntimeFiles
            .filter((relativeFile) =>
                directEnableTabButtonsDebugRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const enableTabButtonsDebugSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsDebug.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsDebugSource).toContain(
            "enableTabButtonsDebugRuntime.js"
        );
    });

    it("keeps tab-button state browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedEnableTabButtonsRuntimeFiles
            .filter((relativeFile) =>
                directEnableTabButtonsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const enableTabButtonsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtons.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsSource).toContain("enableTabButtonsRuntime.js");
    });

    it("keeps tab-button helper DOM reads behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedEnableTabButtonsHelpersRuntimeFiles
            .filter((relativeFile) =>
                directEnableTabButtonsHelpersRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const enableTabButtonsHelpersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsHelpers.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsHelpersSource).toContain(
            "enableTabButtonsHelpersRuntime.js"
        );
    });

    it("keeps tab visibility browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedUpdateTabVisibilityRuntimeFiles
            .filter((relativeFile) =>
                directUpdateTabVisibilityRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const updateTabVisibilitySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/updateTabVisibility.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateTabVisibilitySource).toContain(
            "updateTabVisibilityRuntime.js"
        );
    });

    it("keeps unified control-bar browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedUnifiedControlBarRuntimeFiles
            .filter((relativeFile) =>
                directUnifiedControlBarRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const unifiedControlBarSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/unifiedControlBar.ts")
        );

        expect(violations).toStrictEqual([]);
        expect(unifiedControlBarSource).toContain(
            "unifiedControlBarRuntime.js"
        );
    });

    it("keeps credits marquee browser APIs behind the runtime facade", () => {
        expect.assertions(2);

        const violations = migratedCreditsMarqueeRuntimeFiles
            .filter((relativeFile) =>
                directCreditsMarqueeRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const enhanceCreditsSectionSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/layout/enhanceCreditsSection.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(enhanceCreditsSectionSource).toContain(
            "enhanceCreditsSectionRuntime.js"
        );
    });

    it("keeps migrated map helpers on the Leaflet runtime adapter", () => {
        expect.assertions(1);

        const violations = migratedMapLeafletRuntimeFiles
            .filter((relativeFile) =>
                directLeafletGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps direct Leaflet global lookups out of runtime source", () => {
        expect.assertions(1);

        const allowed = new Set<string>(
            directLeafletRuntimeGlobalLookupAllowedFiles
        );
        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !allowed.has(relativeFile) &&
                    directLeafletGlobalPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps Leaflet plugins wired through the runtime adapter without a persistent global", () => {
        expect.assertions(11);

        const vendorMapEntry = stripComments(
            readRepositoryFile("electron-app/renderer/vendorGlobalsMap.ts")
        );
        const viteRendererConfig = stripComments(
            readRepositoryFile("vite.renderer.config.mjs")
        );
        const allowed = new Set<string>(
            leafletCompatibilityGlobalDefinitionAllowedFiles
        );
        const globalDefinitionViolations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !allowed.has(relativeFile) &&
                    leafletCompatibilityGlobalDefinitionPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const setLeafletRuntimeIndex = vendorMapEntry.indexOf(
            "setLeafletRuntime(Leaflet)"
        );
        const leafletDrawImportIndex = vendorMapEntry.indexOf(
            'import("leaflet-draw")'
        );

        expect(vendorMapEntry).toContain("setLeafletRuntime(Leaflet)");
        expect(setLeafletRuntimeIndex).toBeGreaterThanOrEqual(0);
        expect(leafletDrawImportIndex).toBeGreaterThan(setLeafletRuntimeIndex);
        expect(vendorMapEntry).not.toContain(
            "installLeafletPluginCompatibilityGlobal"
        );
        expect(vendorMapEntry).not.toContain('defineMissingGlobal("L"');
        expect(globalDefinitionViolations).toStrictEqual([]);
        expect(viteRendererConfig).toContain(
            "fitfileviewer-legacy-leaflet-plugin-runtime"
        );
        expect(viteRendererConfig).toContain(
            'Symbol.for("fitfileviewer.leafletRuntime")'
        );
        expect(viteRendererConfig).toContain(
            "/node_modules/leaflet-draw/dist/leaflet.draw.js"
        );
        expect(viteRendererConfig).toContain(
            "/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js"
        );
        expect(viteRendererConfig).toContain(
            "/node_modules/leaflet-minimap/dist/Control.MiniMap.min.js"
        );
    });

    it("keeps direct MapLibre bridge calls quarantined to the vector-layer adapter", () => {
        expect.assertions(1);

        const allowed = new Set<string>(directMapLibreBridgeAllowedFiles);
        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !allowed.has(relativeFile) &&
                    directMapLibreBridgePattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps bundled browser package imports in renderer vendor entries", () => {
        expect.assertions(1);

        const allowed = new Set<string>(
            rendererVendorBrowserPackageImportAllowedFiles
        );
        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !allowed.has(relativeFile) &&
                    bundledBrowserVendorImportPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps renderer vendor global state shims removed", () => {
        expect.assertions(3);

        const missingGlobalShimViolations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                missingRendererVendorGlobalShimPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const globalMarkerViolations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                rendererVendorBundleGlobalMarkerPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const runtimeGlobalFallbackViolations = [
            ...sourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ]
            .filter((relativeFile) =>
                rendererRuntimeGlobalFallbackPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(missingGlobalShimViolations).toStrictEqual([]);
        expect(globalMarkerViolations).toStrictEqual([]);
        expect(runtimeGlobalFallbackViolations).toStrictEqual([]);
    });

    it("keeps legacy renderer globals behind named compatibility modules", () => {
        expect.assertions(92);

        const scannedFiles = sourceRoots.flatMap(collectSourceFiles);
        const directRuntimeGlobalDataMentions = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedRuntimeGlobalDataMentionFiles.has(relativeFile) &&
                    runtimeGlobalDataMentionPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directGlobalDataWrites = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedLegacyGlobalDataBridgeFiles.has(relativeFile) &&
                    directGlobalDataWritePattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directRendererUtilsGlobals = scannedFiles
            .filter((relativeFile) =>
                directRendererUtilsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directGlobalDataPropertyDefinitions = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedLegacyGlobalDataBridgeFiles.has(relativeFile) &&
                    directGlobalDataPropertyDefinitionPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directGlobalDataReactiveProperties = scannedFiles
            .filter((relativeFile) =>
                directGlobalDataReactivePropertyPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directShowFitDataGlobals = scannedFiles
            .filter((relativeFile) =>
                directShowFitDataGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directShowFitDataMapRenderedGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directShowFitDataMapRenderedGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const legacyAppStateGlobalDataUsages = scannedFiles
            .filter((relativeFile) =>
                legacyAppStateGlobalDataPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const legacyAppStateCompatibilityUsages = scannedFiles
            .filter((relativeFile) =>
                legacyAppStateCompatibilityPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const legacyIsChartRenderedGlobalUsages = scannedFiles
            .filter((relativeFile) =>
                legacyIsChartRenderedGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartControlsStateGlobalUsages = scannedFiles
            .filter((relativeFile) =>
                directChartControlsStateGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directStateIntegrationTimerGlobalUsages = scannedFiles
            .filter((relativeFile) =>
                directStateIntegrationTimerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const legacyGlobalDataBridgeFunctionUsages = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedLegacyGlobalDataBridgeFiles.has(relativeFile) &&
                    legacyGlobalDataBridgeFunctionPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directGlobalDataStateReads = scannedFiles
            .filter((relativeFile) =>
                directGlobalDataStateReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const globalDataWriterQuarantineViolations = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedGlobalDataWriterFiles.has(relativeFile) &&
                    (globalDataStoreWriterPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    ) ||
                        directGlobalDataStateWritePattern.test(
                            stripComments(readRepositoryFile(relativeFile))
                        ))
            )
            .sort();
        const unexpectedLegacyUtilityFiles = collectSourceFiles(
            "electron-app/utils/legacy"
        );
        const migratedGlobalDataReaderViolations =
            migratedGlobalDataReaderFiles.filter((relativeFile) =>
                directGlobalDataReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            );
        const migratedGlobalDataWriterViolations =
            migratedGlobalDataWriterFreeFiles.filter((relativeFile) =>
                globalDataStoreWriterPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            );
        const rendererUtilsFreeViolations = rendererUtilsFreeFiles.filter(
            (relativeFile) =>
                rendererUtilsUsagePattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
        );
        const migratedRendererUtilityCallerViolations =
            migratedRendererUtilityCallerFiles.filter((relativeFile) =>
                migratedRendererUtilityGlobalLookupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            );
        const legacyLoadedFitFilesStatePathUsages = scannedFiles
            .filter((relativeFile) =>
                legacyLoadedFitFilesStatePathPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const legacyLoadedFitFilesGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                legacyLoadedFitFilesGlobalLookupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directAltFitGlobalSenderLookups = scannedFiles
            .filter((relativeFile) =>
                directAltFitGlobalSenderPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directOverlayHighlightGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directOverlayHighlightGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directShownFilesListGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directShownFilesListGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directOverlayFilesLoaderGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directOverlayFilesLoaderGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directOverlayTooltipTimeoutGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directOverlayTooltipTimeoutGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartUpdaterGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartUpdaterGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapMarkerCountGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapMarkerCountGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapActionTimerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapActionTimerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapMeasureControlGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapMeasureControlGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directLeafletMapInstanceGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directLeafletMapInstanceGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapPolylineRegistryGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapPolylineRegistryGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapActivityLayerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapActivityLayerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapDataPointFilterGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapDataPointFilterGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directActiveMainMapFileGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directActiveMainMapFileGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directAddFitOverlayButtonGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directAddFitOverlayButtonGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapThemeToggleGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapThemeToggleGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapDocumentListenerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapDocumentListenerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapPluginControlGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapPluginControlGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directFileBrowserLibraryCacheGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directFileBrowserLibraryCacheGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directFullscreenHandlerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directFullscreenHandlerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMenuForwardRegistryGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMenuForwardRegistryGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directAppMenuDebugRecentGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directAppMenuDebugRecentGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directPreloadBeforeExitRegistryGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directPreloadBeforeExitRegistryGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directAppMenuExportsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directAppMenuExportsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directFitFileStateManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directFitFileStateManagerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMainProcessStateManagerExportsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMainProcessStateManagerExportsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directLegacyAppStateHandleGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directLegacyAppStateHandleGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directFilenameAutoScrollStateExpandoLookups = scannedFiles
            .filter((relativeFile) =>
                directFilenameAutoScrollStateExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directQuickColorSwitcherStateExpandoLookups = scannedFiles
            .filter((relativeFile) =>
                directQuickColorSwitcherStateExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapActionCleanupExpandoLookups = scannedFiles
            .filter((relativeFile) =>
                directMapActionCleanupExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directLifecycleListenerCleanupExpandoLookups = scannedFiles
            .filter((relativeFile) =>
                directLifecycleListenerCleanupExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMapMeasureEscapeHandlerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMapMeasureEscapeHandlerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directLapSelectorMouseupHandlerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directLapSelectorMouseupHandlerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directZoneDataGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directZoneDataGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartNotificationSuppressionGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartNotificationSuppressionGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartLoadingSuppressionGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartLoadingSuppressionGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartDebugGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartDebugGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartPluginRegistrationMarkerLookups = scannedFiles
            .filter((relativeFile) =>
                directChartPluginRegistrationMarkerPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartListenerStateGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartListenerStateGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartDevToolsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartDevToolsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directGyazoStartupTimerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directGyazoStartupTimerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directPrimeTestEnvironmentTimerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directPrimeTestEnvironmentTimerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directPrimeTestEnvironmentProbeGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directPrimeTestEnvironmentProbeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directSessionHandlerMarkerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directSessionHandlerMarkerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directResourceManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directResourceManagerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directRendererApiExposureGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directRendererApiExposureGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directStateManagerApiGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directStateManagerApiGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMasterStateManagerMockGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMasterStateManagerMockGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directSingletonStateSubscriptionsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directSingletonStateSubscriptionsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directFileAccessPolicyStateGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directFileAccessPolicyStateGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directTabButtonsEnabledGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabButtonsEnabledGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directTabButtonObserverGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabButtonObserverGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directTabButtonHelperGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabButtonHelperGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directTabStateManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabStateManagerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directTabVitestEnvironmentGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabVitestEnvironmentGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directVitestObjectKeysThrowGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestObjectKeysThrowGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartTabIntegrationGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartTabIntegrationGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartStateManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartStateManagerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directChartActionsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartActionsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directUiStateManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directUiStateManagerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMainUiDragDropHandlerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMainUiDragDropHandlerGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directDragDropEnableGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directDragDropEnableGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMainUiDevelopmentHelperGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMainUiDevelopmentHelperGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directMainProcessDevHelpersGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMainProcessDevHelpersGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directElectronHoistedMockGlobalLookups = scannedFiles
            .filter(
                (relativeFile) =>
                    !directElectronHoistedMockGlobalAllowedFiles.has(
                        relativeFile
                    ) &&
                    directElectronHoistedMockGlobalPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directMenuModalPresenterGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMenuModalPresenterGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directSettingsModalGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directSettingsModalGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directAboutModalDevHelperGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directAboutModalDevHelperGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const directActiveFitFileNameGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directActiveFitFileNameGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const deletedCompatibilityFiles = [
            "electron-app/renderer/globalApiExposure.ts",
            "electron-app/renderer/leafletPluginCompatibilityGlobal.ts",
            "electron-app/renderer/vendorGlobals.ts",
            "electron-app/utils.ts",
            "electron-app/utils/app/initialization/rendererUtils.ts",
            "electron-app/utils/ui/mainUiGlobals.ts",
            "electron-app/utils/legacy/globalUtilityRegistry.ts",
            "electron-app/utils/legacy/globalUtilityRendering.ts",
            "electron-app/utils/legacy/globalUtilityTheming.ts",
            "electron-app/utils/legacy/globalUtilityUi.ts",
        ].filter(hasRepositoryFile);

        expect(directRuntimeGlobalDataMentions).toStrictEqual([]);
        expect(directGlobalDataWrites).toStrictEqual([]);
        expect(directRendererUtilsGlobals).toStrictEqual([]);
        expect(directGlobalDataPropertyDefinitions).toStrictEqual([]);
        expect(directGlobalDataReactiveProperties).toStrictEqual([]);
        expect(directShowFitDataGlobals).toStrictEqual([]);
        expect(directShowFitDataMapRenderedGlobalLookups).toStrictEqual([]);
        expect(legacyAppStateGlobalDataUsages).toStrictEqual([]);
        expect(legacyAppStateCompatibilityUsages).toStrictEqual([]);
        expect(legacyIsChartRenderedGlobalUsages).toStrictEqual([]);
        expect(directChartControlsStateGlobalUsages).toStrictEqual([]);
        expect(directStateIntegrationTimerGlobalUsages).toStrictEqual([]);
        expect(legacyGlobalDataBridgeFunctionUsages).toStrictEqual([]);
        expect(directGlobalDataStateReads).toStrictEqual([]);
        expect(globalDataWriterQuarantineViolations).toStrictEqual([]);
        expect(unexpectedLegacyUtilityFiles).toStrictEqual([]);
        expect(migratedGlobalDataReaderViolations).toStrictEqual([]);
        expect(migratedGlobalDataWriterViolations).toStrictEqual([]);
        expect(rendererUtilsFreeViolations).toStrictEqual([]);
        expect(migratedRendererUtilityCallerViolations).toStrictEqual([]);
        expect(legacyLoadedFitFilesStatePathUsages).toStrictEqual([]);
        expect(legacyLoadedFitFilesGlobalLookups).toStrictEqual([]);
        expect(directAltFitGlobalSenderLookups).toStrictEqual([]);
        expect(directOverlayHighlightGlobalLookups).toStrictEqual([]);
        expect(directShownFilesListGlobalLookups).toStrictEqual([]);
        expect(directOverlayFilesLoaderGlobalLookups).toStrictEqual([]);
        expect(directOverlayTooltipTimeoutGlobalLookups).toStrictEqual([]);
        expect(directChartUpdaterGlobalLookups).toStrictEqual([]);
        expect(directMapMarkerCountGlobalLookups).toStrictEqual([]);
        expect(directMapActionTimerGlobalLookups).toStrictEqual([]);
        expect(directMapMeasureControlGlobalLookups).toStrictEqual([]);
        expect(directLeafletMapInstanceGlobalLookups).toStrictEqual([]);
        expect(directMapPolylineRegistryGlobalLookups).toStrictEqual([]);
        expect(directMapActivityLayerGlobalLookups).toStrictEqual([]);
        expect(directMapDataPointFilterGlobalLookups).toStrictEqual([]);
        expect(directActiveMainMapFileGlobalLookups).toStrictEqual([]);
        expect(directAddFitOverlayButtonGlobalLookups).toStrictEqual([]);
        expect(directMapThemeToggleGlobalLookups).toStrictEqual([]);
        expect(directMapDocumentListenerGlobalLookups).toStrictEqual([]);
        expect(directMapPluginControlGlobalLookups).toStrictEqual([]);
        expect(directFileBrowserLibraryCacheGlobalLookups).toStrictEqual([]);
        expect(directFullscreenHandlerGlobalLookups).toStrictEqual([]);
        expect(directMenuForwardRegistryGlobalLookups).toStrictEqual([]);
        expect(directAppMenuDebugRecentGlobalLookups).toStrictEqual([]);
        expect(directPreloadBeforeExitRegistryGlobalLookups).toStrictEqual([]);
        expect(directAppMenuExportsGlobalLookups).toStrictEqual([]);
        expect(directFitFileStateManagerGlobalLookups).toStrictEqual([]);
        expect(directMainProcessStateManagerExportsGlobalLookups).toStrictEqual(
            []
        );
        expect(directLegacyAppStateHandleGlobalLookups).toStrictEqual([]);
        expect(directFilenameAutoScrollStateExpandoLookups).toStrictEqual([]);
        expect(directQuickColorSwitcherStateExpandoLookups).toStrictEqual([]);
        expect(directMapActionCleanupExpandoLookups).toStrictEqual([]);
        expect(directLifecycleListenerCleanupExpandoLookups).toStrictEqual([]);
        expect(directMapMeasureEscapeHandlerGlobalLookups).toStrictEqual([]);
        expect(directLapSelectorMouseupHandlerGlobalLookups).toStrictEqual([]);
        expect(directZoneDataGlobalLookups).toStrictEqual([]);
        expect(directChartNotificationSuppressionGlobalLookups).toStrictEqual(
            []
        );
        expect(directChartLoadingSuppressionGlobalLookups).toStrictEqual([]);
        expect(directChartDebugGlobalLookups).toStrictEqual([]);
        expect(directChartPluginRegistrationMarkerLookups).toStrictEqual([]);
        expect(directChartListenerStateGlobalLookups).toStrictEqual([]);
        expect(directChartDevToolsGlobalLookups).toStrictEqual([]);
        expect(directGyazoStartupTimerGlobalLookups).toStrictEqual([]);
        expect(directPrimeTestEnvironmentTimerGlobalLookups).toStrictEqual([]);
        expect(directPrimeTestEnvironmentProbeGlobalLookups).toStrictEqual([]);
        expect(directSessionHandlerMarkerGlobalLookups).toStrictEqual([]);
        expect(directResourceManagerGlobalLookups).toStrictEqual([]);
        expect(directRendererApiExposureGlobalLookups).toStrictEqual([]);
        expect(directStateManagerApiGlobalLookups).toStrictEqual([]);
        expect(directMasterStateManagerMockGlobalLookups).toStrictEqual([]);
        expect(directSingletonStateSubscriptionsGlobalLookups).toStrictEqual(
            []
        );
        expect(directFileAccessPolicyStateGlobalLookups).toStrictEqual([]);
        expect(directTabButtonsEnabledGlobalLookups).toStrictEqual([]);
        expect(directTabButtonObserverGlobalLookups).toStrictEqual([]);
        expect(directTabButtonHelperGlobalLookups).toStrictEqual([]);
        expect(directTabStateManagerGlobalLookups).toStrictEqual([]);
        expect(directTabVitestEnvironmentGlobalLookups).toStrictEqual([]);
        expect(directVitestObjectKeysThrowGlobalLookups).toStrictEqual([]);
        expect(directChartTabIntegrationGlobalLookups).toStrictEqual([]);
        expect(directChartStateManagerGlobalLookups).toStrictEqual([]);
        expect(directChartActionsGlobalLookups).toStrictEqual([]);
        expect(directUiStateManagerGlobalLookups).toStrictEqual([]);
        expect(directMainUiDragDropHandlerGlobalLookups).toStrictEqual([]);
        expect(directDragDropEnableGlobalLookups).toStrictEqual([]);
        expect(directMainUiDevelopmentHelperGlobalLookups).toStrictEqual([]);
        expect(directMainProcessDevHelpersGlobalLookups).toStrictEqual([]);
        expect(directElectronHoistedMockGlobalLookups).toStrictEqual([]);
        expect(directMenuModalPresenterGlobalLookups).toStrictEqual([]);
        expect(directSettingsModalGlobalLookups).toStrictEqual([]);
        expect(directAboutModalDevHelperGlobalLookups).toStrictEqual([]);
        expect(directActiveFitFileNameGlobalLookups).toStrictEqual([]);
        expect(deletedCompatibilityFiles).toStrictEqual([]);
    });

    it("does not recreate the retired showFitData global bridge in tests", () => {
        expect.assertions(1);

        const scannedFiles = testSourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    relativeFile !==
                    "tests/unit/packaging/architectureBoundaries.test.ts"
            );
        const directShowFitDataTestGlobals = scannedFiles
            .filter((relativeFile) => {
                const source = stripComments(readRepositoryFile(relativeFile));
                return (
                    directShowFitDataGlobalPattern.test(source) ||
                    directShowFitDataGlobalDefinitionPattern.test(source)
                );
            })
            .sort();

        expect(directShowFitDataTestGlobals).toStrictEqual([]);
    });

    it("keeps raw globalThis any casts out of source and tests", () => {
        expect.assertions(1);

        const scannedFiles = [...sourceRoots, ...testSourceRoots]
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    relativeFile !==
                    "tests/unit/packaging/architectureBoundaries.test.ts"
            );
        const rawGlobalThisAnyCastFiles = scannedFiles
            .filter((relativeFile) =>
                rawGlobalThisAnyCastPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(rawGlobalThisAnyCastFiles).toStrictEqual([]);
    });

    it("keeps production FIT file entrypoints on the lazy decoded renderer", () => {
        expect.assertions(1);

        const directShowFitDataImports = sourceRoots
            .flatMap(collectSourceFiles)
            .filter((relativeFile) =>
                directShowFitDataRendererImportPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directShowFitDataImports).toStrictEqual([]);
    });

    it("keeps retired renderer globals out of ambient Window declarations", () => {
        expect.assertions(1);

        expect(
            retiredRendererAmbientGlobalPattern.test(
                stripComments(readRepositoryFile("global.d.ts"))
            )
        ).toBe(false);
    });

    it("keeps migrated renderer tests on the registered Electron API runtime", () => {
        expect.assertions(2);

        const directElectronApiGlobals =
            rendererElectronApiRuntimeRegressionTests
                .filter((relativeFile) =>
                    directElectronApiGlobalReadPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
                )
                .sort();
        const missingRuntimeRegistration =
            rendererElectronApiRuntimeRegressionTests
                .filter((relativeFile) => {
                    const source = stripComments(
                        readRepositoryFile(relativeFile)
                    );
                    return (
                        !source.includes(
                            "registerRendererElectronApiCandidate"
                        ) ||
                        !source.includes("resetRendererElectronApiCandidate")
                    );
                })
                .sort();

        expect(directElectronApiGlobals).toStrictEqual([]);
        expect(missingRuntimeRegistration).toStrictEqual([]);
    });

    it("keeps migrated renderer source on the registered Electron API runtime", () => {
        expect.assertions(2);

        const directElectronApiGlobals = rendererElectronApiRuntimeSourceFiles
            .filter((relativeFile) =>
                directElectronApiGlobalReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const missingRuntimeLookup = rendererElectronApiRuntimeSourceFiles
            .filter((relativeFile) => {
                const source = stripComments(readRepositoryFile(relativeFile));
                return !source.includes("getRendererElectronApi");
            })
            .sort();

        expect(directElectronApiGlobals).toStrictEqual([]);
        expect(missingRuntimeLookup).toStrictEqual([]);
    });
});
