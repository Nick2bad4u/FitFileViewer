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

const stateDomainRoots = ["electron-app/utils/state/domain"] as const;
const stateCoreRoots = ["electron-app/utils/state/core"] as const;
const rendererEntrypointFiles = ["electron-app/renderer.ts"] as const;
const playwrightSmokeFiles = ["tests/playwright/app-ui.spec.ts"] as const;

const sourceExtensions = new Set([
    ".cjs",
    ".js",
    ".mjs",
    ".ts",
]);

const allowedLegacyGlobalDataBridgeFiles = new Set<string>();
const allowedGlobalDataWriterFiles = new Set<string>();

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
const migratedScreenfullRuntimeFiles = [
    "electron-app/utils/ui/controls/addFullScreenButton.ts",
] as const;
const migratedElectronApiAccessorFiles = [
    "electron-app/main-ui.ts",
    "electron-app/utils/app/initialization/loadVersionInfo.ts",
    "electron-app/utils/app/lifecycle/menuIpcListeners.ts",
    "electron-app/utils/app/lifecycle/recentFilesContextMenu.ts",
    "electron-app/utils/files/export/exportUtils.ts",
    "electron-app/utils/rendering/core/showFitData.ts",
    "electron-app/utils/state/integration/mainProcessStateClient.ts",
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
const directShowFitDataMapRenderedGlobalPattern =
    /\b(?:window|globalThis|getShowFitDataGlobal\(\)|showFitGlobal)\.isMapRendered\b/u;
const rendererUtilsUsagePattern = /\brendererUtils\b/u;
const migratedRendererUtilityGlobalLookupPattern =
    /\b(?:appGlobal|chartGlobal|window|globalThis|showFitGlobal|windowExt|zoneColorGlobal|getZoneColorSelectorGlobal\(\))\.(?:createTables|invalidateChartRenderCache|renderChartJS|renderMap|renderSummary|setTabButtonsEnabled|setupActiveFileNameMapActions|setupOverlayFileNameMapActions|updateActiveTab|updateOverlayHighlights|updateShownFilesList|updateTabVisibility)\b/u;
const directAltFitGlobalSenderPattern =
    /\b(?:appGlobal|window|globalThis|lifecycleGlobal|showFitGlobal|windowExt|getDragDropGlobal\(\)|getFileOpenGlobal\(\)|getOpenFitFileGlobal\(\))\.sendFitFileToAltFitReader\b/u;
const directOverlayHighlightGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|getWin\(\)|overlayGlobal|getOverlayGlobal\(\)|getMapActionButtonsGlobal\(\))\._highlightedOverlayIdx\b|Object\.defineProperty\(\s*[^,\n]+,\s*["'](?:_highlightedOverlayIdx|updateOverlayHighlights)["']/u;
const directShownFilesListGlobalPattern =
    /\b(?:window|globalThis|windowExt|overlayGlobal|getShownFilesGlobal\(\))\.updateShownFilesList\s*=/u;
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
    /\b(?:window|globalThis|g|getMeasureToolGlobal\(\))\.__ffvMapMeasureEscapeHandler\b|["']__ffvMapMeasureEscapeHandler["']/u;
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
const directChartListenerStateGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal)\.(?:_fitFileViewerChartListener|_fitFileViewerChartListenerAbortController|_fitFileViewerSharedConfigurationListener|_fitFileViewerSharedConfigurationAbortController)\b/u;
const directGyazoStartupTimerGlobalPattern =
    /\b(?:window|globalThis|testGlobals)\.__ffvGyazoStartupTimer\b|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']__ffvGyazoStartupTimer["']/u;
const directResourceManagerGlobalPattern =
    /\b(?:window|globalThis)\.resourceManager\b|\{\s*resourceManager\?:\s*ResourceManager\s*\}\)\.resourceManager/u;
const directRendererApiExposureGlobalPattern =
    /\b(?:window|globalThis|scope)\.(?:APP_INFO|createExportGPXButton|__resetRendererStateInitializationForTests)\b|Reflect\.set\(\s*scope\s*,\s*["'](?:APP_INFO|createExportGPXButton|__resetRendererStateInitializationForTests)["']/u;
const directStateManagerApiGlobalPattern =
    /\b(?:window|globalThis|globalState|getMasterGlobal\(\))\.__STATE_MANAGER_API__\b|Object\.defineProperty\(\s*globalState\s*,\s*["']__STATE_MANAGER_API__["']/u;
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
const directTabStateManagerGlobalPattern =
    /\b(?:window|globalThis)\.tabStateManager\b|\(\s*globalThis\s+as\s+TabStateManagerGlobal\s*\)\.tabStateManager\b/u;
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
const directMainUiDevelopmentHelperGlobalPattern =
    /\b(?:window|globalThis|getMainUiGlobal\(\)|mainUiGlobal)\.(?:injectMenu|devCleanup)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:injectMenu|devCleanup)["']\s*\)/u;
const directMenuModalPresenterGlobalPattern =
    /\b(?:window|globalThis|getMenuIpcGlobal\(\)|keyboardShortcutsGlobal|menuGlobal)\.(?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)["']\s*\)/u;
const directAboutModalDevHelperGlobalPattern =
    /\b(?:window|globalThis|aboutGlobal)\.aboutModalDevHelpers\b|["']aboutModalDevHelpers["']/u;
const directActiveFitFileNameGlobalPattern =
    /\b(?:window|globalThis|windowGlobal|summaryGlobal)\.activeFitFileName\b|["']activeFitFileName["']/u;
const directChartConstructorGlobalPattern =
    /\b(?:window|globalThis|runtimeGlobal|chartGlobal|zoneGlobal)\.Chart\b/u;
const directRendererDevGlobalPattern =
    /\b(?:window|globalThis|rendererGlobal)\.__renderer_dev\b|["']__renderer_dev["']/u;
const directDataTableGlobalPattern =
    /\b(?:window|globalThis|tableGlobal|renderTableGlobal)\.(?:\$|jQuery|DataTable)\b|\.jQuery\b/u;
const directChartInstanceGlobalPattern = /\b_chartjsInstances\b/u;
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
const missingRendererVendorGlobalShimPattern = /\bdefineMissingGlobal\b/u;
const rendererVendorBundleGlobalMarkerPattern =
    /\b__FFV_RENDERER_VENDOR_BUNDLE__\b/u;
const rendererRuntimeGlobalFallbackPattern =
    /\b(?:__fitFileViewerRuntimeGlobalFallbackForTests|runtimeGlobalFallbackFlag|getGlobalRuntimeCandidate|getWindowRuntimeCandidate)\b/u;
const directElectronApiGlobalReadPattern =
    /\b(?:globalThis|window)\.electronAPI\b|\.\s*electronAPI\b|\(\s*globalThis\s+as\s+\{[^}]*electronAPI/u;

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
            "Vendor Globals",
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
        expect.assertions(7);

        const preloadEntrySource = stripComments(
            readRepositoryFile("electron-app/preload.ts")
        );
        const preloadEntrypointSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadEntrypoint.ts")
        );

        expect(preloadEntrySource).toContain(
            'import { startDefaultPreloadEntrypoint } from "./preload/preloadEntrypoint.js";'
        );
        expect(preloadEntrySource).toContain(
            "startDefaultPreloadEntrypoint();"
        );
        expect(preloadEntrySource).not.toContain("require");
        expect(preloadEntrypointSource).toContain(
            "startPreloadEntrypoint(require,"
        );
        expect(preloadEntrySource).not.toContain(
            'require("./preload/preloadEntrypoint.js")'
        );
        expect(preloadEntrySource).not.toContain("startPreloadScript");
        expect(preloadEntrySource).not.toContain("PreloadModuleRequire");
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
        expect.assertions(7);

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
            'const UNSUPPORTED_LEGACY_PATHS = new Set(["globalData"]);'
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
        expect.assertions(74);

        const scannedFiles = sourceRoots.flatMap(collectSourceFiles);
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
        const directChartListenerStateGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartListenerStateGlobalPattern.test(
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
        const directTabStateManagerGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabStateManagerGlobalPattern.test(
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
        const directMainUiDevelopmentHelperGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directMainUiDevelopmentHelperGlobalPattern.test(
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
        expect(directChartListenerStateGlobalLookups).toStrictEqual([]);
        expect(directGyazoStartupTimerGlobalLookups).toStrictEqual([]);
        expect(directResourceManagerGlobalLookups).toStrictEqual([]);
        expect(directRendererApiExposureGlobalLookups).toStrictEqual([]);
        expect(directStateManagerApiGlobalLookups).toStrictEqual([]);
        expect(directSingletonStateSubscriptionsGlobalLookups).toStrictEqual(
            []
        );
        expect(directFileAccessPolicyStateGlobalLookups).toStrictEqual([]);
        expect(directTabButtonsEnabledGlobalLookups).toStrictEqual([]);
        expect(directTabStateManagerGlobalLookups).toStrictEqual([]);
        expect(directChartTabIntegrationGlobalLookups).toStrictEqual([]);
        expect(directChartStateManagerGlobalLookups).toStrictEqual([]);
        expect(directChartActionsGlobalLookups).toStrictEqual([]);
        expect(directUiStateManagerGlobalLookups).toStrictEqual([]);
        expect(directMainUiDragDropHandlerGlobalLookups).toStrictEqual([]);
        expect(directMainUiDevelopmentHelperGlobalLookups).toStrictEqual([]);
        expect(directMenuModalPresenterGlobalLookups).toStrictEqual([]);
        expect(directAboutModalDevHelperGlobalLookups).toStrictEqual([]);
        expect(directActiveFitFileNameGlobalLookups).toStrictEqual([]);
        expect(deletedCompatibilityFiles).toStrictEqual([]);
    });
});
