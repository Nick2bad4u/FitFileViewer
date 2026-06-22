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
const migratedMainUiSummarySelectorRuntimeFiles = [
    "electron-app/renderer/mainUiSummaryColumnSelector.ts",
] as const;
const migratedRendererApplicationStartupRuntimeFiles = [
    "electron-app/renderer/applicationStartup.ts",
] as const;
const migratedRendererApplicationLifecycleWiringRuntimeFiles = [
    "electron-app/renderer/applicationLifecycleWiring.ts",
] as const;
const migratedRendererFileInputStartupRuntimeFiles = [
    "electron-app/renderer/fileInputWiring.ts",
    "electron-app/renderer/fileInputStartup.ts",
] as const;
const migratedRendererTestOnlyBootstrapRuntimeFiles = [
    "electron-app/renderer/testOnlyBootstrap.ts",
] as const;
const migratedRendererVendorBundleLoaderRuntimeFiles = [
    "electron-app/renderer/vendorBundleLoader.ts",
] as const;
const migratedRenderSummaryRuntimeFiles = [
    "electron-app/utils/rendering/helpers/renderSummaryHelpers.ts",
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
    "tests/unit/lifecycle/listeners.test.ts",
    "tests/unit/lifecycle/listeners.fitPayload.test.ts",
    "tests/unit/lifecycle/menuIpcKeyboardShortcuts.test.ts",
    "tests/unit/lifecycle/recentFilesContextMenu.fitPayload.test.ts",
    "tests/unit/utils/state/core/masterStateManager.comprehensive.test.ts",
    "tests/unit/strictTests/utils/app/lifecycle/listeners.test.ts",
    "tests/unit/strictTests/app/initialization/loadVersionInfo.test.ts",
    "tests/unit/strictTests/rendering/core/showFitData.test.ts",
    "tests/unit/strictTests/ui/modals/aboutModal.test.ts",
    "tests/unit/strictTests/ui/notifications/showUpdateNotification.test.ts",
    "tests/unit/strictTests/ui/main-ui.test.ts",
    "tests/unit/main-ui.startup.test.ts",
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
const migratedRendererDevelopmentDebugToolsRuntimeFiles = [
    "electron-app/renderer/developmentDebugTools.ts",
] as const;
const migratedStateDebugGlobalFreeFiles = [
    "electron-app/utils/debug/stateDevTools.ts",
    "electron-app/utils/state/core/masterStateManager.ts",
    "electron-app/utils/state/integration/stateIntegration.ts",
] as const;
const migratedStateIntegrationRuntimeFiles = [
    "electron-app/utils/state/integration/stateIntegration.ts",
] as const;
const migratedStateDevToolsRuntimeFiles = [
    "electron-app/utils/debug/stateDevTools.ts",
] as const;
const migratedRendererStateIntegrationRuntimeFiles = [
    "electron-app/utils/state/integration/rendererStateIntegration.ts",
] as const;
const rendererVendorBrowserPackageImportAllowedFiles = [
    "electron-app/renderer/rendererVendorChartData.ts",
    "electron-app/renderer/rendererVendorCore.ts",
    "electron-app/renderer/rendererVendorMap.ts",
] as const;
const migratedDataTableImportFiles = [
    "electron-app/utils/rendering/core/renderTable.ts",
] as const;
const migratedRenderTableRuntimeFiles = [
    "electron-app/utils/rendering/core/renderTable.ts",
] as const;
const migratedChartInstanceRegistryFiles = [
    "electron-app/utils/charts/core/renderChartActions.ts",
    "electron-app/utils/charts/core/renderChartCompletion.ts",
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
const migratedChartStateManagerRuntimeFiles = [
    "electron-app/utils/charts/core/chartStateManager.ts",
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
const migratedNetworkUtilsRuntimeFiles = [
    "electron-app/utils/net/networkUtils.ts",
] as const;
const migratedPerformanceUtilsRuntimeFiles = [
    "electron-app/utils/app/performance/performanceUtils.ts",
] as const;
const migratedCancellationTokenRuntimeFiles = [
    "electron-app/utils/app/async/cancellationToken.ts",
] as const;
const migratedChartHoverEffectsRuntimeFiles = [
    "electron-app/utils/charts/plugins/addChartHoverEffects.ts",
] as const;
const migratedCopyTableAsCSVRuntimeFiles = [
    "electron-app/utils/files/export/copyTableAsCSV.ts",
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
const migratedOpenPowerEstimationSettingsModalRuntimeFiles = [
    "electron-app/utils/ui/modals/openPowerEstimationSettingsModal.ts",
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
const migratedAddFullScreenButtonRuntimeFiles = [
    "electron-app/utils/ui/controls/addFullScreenButton.ts",
    "electron-app/utils/ui/controls/addFullScreenButtonRuntime.ts",
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
const migratedSettingsModalRuntimeFiles = [
    "electron-app/utils/ui/settingsModal.ts",
] as const;
const migratedDragDropHandlerRuntimeFiles = [
    "electron-app/utils/ui/dragDropHandler.ts",
] as const;
const migratedKeyboardShortcutsModalRuntimeFiles = [
    "electron-app/utils/ui/modals/keyboardShortcutsModal.ts",
] as const;
const migratedAboutModalRuntimeFiles = [
    "electron-app/utils/ui/modals/aboutModal.ts",
] as const;
const migratedShowNotificationRuntimeFiles = [
    "electron-app/utils/ui/notifications/showNotification.ts",
] as const;
const migratedNotificationTimerRuntimeFiles = [
    "electron-app/utils/ui/notifications/showUpdateNotification.ts",
    "electron-app/utils/ui/notifications/syncRendererNotifications.ts",
] as const;
const migratedAltFitSenderRuntimeFiles = [
    "electron-app/utils/files/import/sendFitFileToAltFitReader.ts",
] as const;
const migratedLoadSharedConfigurationRuntimeFiles = [
    "electron-app/utils/app/initialization/loadSharedConfiguration.ts",
] as const;
const migratedGetCurrentSettingsRuntimeFiles = [
    "electron-app/utils/app/initialization/getCurrentSettings.ts",
] as const;
const migratedExternalLinkHandlersRuntimeFiles = [
    "electron-app/utils/ui/links/externalLinkHandlers.ts",
] as const;
const migratedMapActionButtonsRuntimeFiles = [
    "electron-app/utils/maps/controls/mapActionButtons.ts",
] as const;
const migratedMapDocumentListenersRuntimeFiles = [
    "electron-app/utils/maps/core/mapDocumentListeners.ts",
] as const;
const mapDocumentListenersRuntimeSourceFile =
    "electron-app/utils/maps/core/mapDocumentListenersRuntime.ts";
const migratedMapFullscreenControlRuntimeFiles = [
    "electron-app/utils/maps/controls/mapFullscreenControl.ts",
] as const;
const mapFullscreenControlRuntimeSourceFile =
    "electron-app/utils/maps/controls/mapFullscreenControlRuntime.ts";
const migratedMapMeasureToolRuntimeFiles = [
    "electron-app/utils/maps/controls/mapMeasureTool.ts",
] as const;
const mapMeasureToolRuntimeSourceFile =
    "electron-app/utils/maps/controls/mapMeasureToolRuntime.ts";
const migratedMapLapSelectorRuntimeFiles = [
    "electron-app/utils/maps/controls/mapLapSelector.ts",
] as const;
const mapLapSelectorRuntimeSourceFile =
    "electron-app/utils/maps/controls/mapLapSelectorRuntime.ts";
const migratedMapDrawLapsRuntimeFiles = [
    "electron-app/utils/maps/layers/mapDrawLaps.ts",
] as const;
const migratedOpenFileSelectorRuntimeFiles = [
    "electron-app/utils/files/import/openFileSelector.ts",
] as const;
const migratedLoadSingleOverlayFileRuntimeFiles = [
    "electron-app/utils/files/import/loadSingleOverlayFile.ts",
] as const;
const migratedLoadOverlayFilesRuntimeFiles = [
    "electron-app/utils/files/import/loadOverlayFiles.ts",
] as const;
const migratedFitBrowserFeatureGateRuntimeFiles = [
    "electron-app/utils/ui/browser/initFitBrowserFeatureGate.ts",
] as const;
const migratedFileBrowserTabRuntimeFiles = [
    "electron-app/utils/ui/browser/fileBrowserTab.ts",
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
const migratedThemeCoreRuntimeFiles = [
    "electron-app/utils/theming/core/theme.ts",
] as const;
const migratedSetupThemeRuntimeFiles = [
    "electron-app/utils/theming/core/setupTheme.ts",
] as const;
const migratedChartThemeListenerRuntimeFiles = [
    "electron-app/utils/charts/theming/chartThemeListener.ts",
] as const;
const migratedMapThemeToggleRuntimeFiles = [
    "electron-app/utils/theming/specific/createMapThemeToggle.ts",
    "electron-app/utils/theming/specific/mapThemeToggleState.ts",
] as const;
const mapThemeToggleRuntimeSourceFile =
    "electron-app/utils/theming/specific/mapThemeToggleRuntime.ts";
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
const migratedChartListenerStateRuntimeFiles = [
    "electron-app/utils/charts/core/chartListenerState.ts",
] as const;
const migratedRenderChartDirectRerenderRuntimeFiles = [
    "electron-app/utils/charts/core/renderChartDirectRerender.ts",
] as const;
const migratedRenderChartRequestListenerRuntimeFiles = [
    "electron-app/utils/charts/core/renderChartRequestListener.ts",
] as const;
const migratedRenderChartStartupRuntimeFiles = [
    "electron-app/utils/charts/core/renderChartStartup.ts",
] as const;
const migratedRenderChartJsTimerRuntimeFiles = [
    "electron-app/utils/charts/core/renderChartJS.ts",
] as const;
const migratedRenderChartTimerRuntimeFiles = [
    "electron-app/utils/charts/core/renderChartCachePrewarm.ts",
    "electron-app/utils/charts/core/renderChartDebounce.ts",
    "electron-app/utils/charts/core/renderChartNotificationFlow.ts",
    "electron-app/utils/charts/core/renderChartTiming.ts",
] as const;
const migratedSummaryColModalViewportRuntimeFiles = [
    "electron-app/utils/rendering/helpers/summaryColModal.ts",
] as const;
const migratedUserDeviceInfoBoxRuntimeFiles = [
    "electron-app/utils/rendering/components/createUserDeviceInfoBox.ts",
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
const migratedTabStateManagerHandlersRuntimeFiles = [
    "electron-app/utils/ui/tabs/tabStateManagerHandlers.ts",
] as const;
const migratedUnifiedControlBarRuntimeFiles = [
    "electron-app/utils/ui/unifiedControlBar.ts",
] as const;
const migratedQuickColorSwitcherRuntimeFiles = [
    "electron-app/utils/ui/quickColorSwitcher.ts",
] as const;
const quickColorSwitcherRuntimeSourceFile =
    "electron-app/utils/ui/quickColorSwitcherRuntime.ts";
const migratedShownFilesListRuntimeFiles = [
    "electron-app/utils/rendering/components/createShownFilesList.ts",
    "electron-app/utils/rendering/components/shownFilesListItemHandlers.ts",
    "electron-app/utils/rendering/components/shownFilesListTooltipState.ts",
] as const;
const shownFilesListRuntimeSourceFile =
    "electron-app/utils/rendering/components/shownFilesListRuntime.ts";
const migratedCreditsMarqueeRuntimeFiles = [
    "electron-app/utils/ui/layout/enhanceCreditsSection.ts",
] as const;
const migratedEnsureChartSettingsDropdownsRuntimeFiles = [
    "electron-app/utils/ui/components/ensureChartSettingsDropdowns.ts",
] as const;
const migratedCreateSettingsHeaderRuntimeFiles = [
    "electron-app/utils/ui/components/createSettingsHeader.ts",
] as const;
const migratedCreateFieldTogglesSectionRuntimeFiles = [
    "electron-app/utils/ui/components/createFieldTogglesSection.ts",
] as const;
const migratedCreateInlineZoneColorSelectorRuntimeFiles = [
    "electron-app/utils/ui/controls/createInlineZoneColorSelector.ts",
] as const;
const migratedOpenZoneColorPickerRuntimeFiles = [
    "electron-app/utils/ui/modals/openZoneColorPicker.ts",
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
const debugSensorInfoTestGlobalDataMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']globalData["']\s*\)|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']globalData["']/u;
const unifiedStateManagerGlobalDataTestMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']globalData["']\s*\)|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']globalData["']/u;
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
const loadedFitFilesTestGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*(?:globalThis|testGlobal)\s*,\s*["']loadedFitFiles["']\s*\)|\b(?:globalThis|testGlobal)\.loadedFitFiles\s*=/u;
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
const directCreateAppMenuTestFixtureGlobalPattern =
    /\b(?:CreateAppMenuTestGlobal|getCreateAppMenuTestGlobal|__(?:clipboardWrites|electronClipboardWriteSpy|electronMockFixture|electronSendSpy|electronShellOpenSpy|electronShellShowSpy|ipcCalls|shellOpenCalls|shellRevealCalls))\b/u;
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
const directChartThemeConfigGlobalPattern =
    /\b(?:window|globalThis|chartGlobal|runtimeGlobal|chartHoverGlobal)\.getThemeConfig\b/u;
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
const directStateIntegrationRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearInterval|clearTimeout|localStorage|performance|setInterval|setTimeout)\b|(?:^|[^\w.])(?:clearInterval|clearTimeout|setInterval|setTimeout)\(|\b(?:Date|performance)\.(?:now|memory)\b|\btypeof\s+(?:localStorage|performance)\b/u;
const directStateIntegrationRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearInterval|clearTimeout|dateNow|setInterval|setTimeout)[^;\n]*\?\?\s*(?:globalThis\.(?:clearInterval|clearTimeout|setInterval|setTimeout)|Date\.now)/u;
const directStateIntegrationRuntimeAmbientGetterPattern =
    /\bget\s+(?:clearInterval|clearTimeout|localStorage|performance|setInterval|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:clearInterval|clearTimeout|localStorage|performance|setInterval|setTimeout)\b/u;
const directStateStorageRuntimeAmbientGetterPattern =
    /\bget\s+localStorage\s*\(\)\s*\{|\breturn\s+globalThis\.localStorage\b/u;
const directStatePerformanceHistoryGlobalPattern =
    /\b_statePerformance\b|\bStatePerformanceGlobal\b|\bstateGlobal\s*=\s*globalThis/u;
const directStateDevToolsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearInterval|setInterval)\b|(?:^|[^\w.])(?:clearInterval|setInterval)\(/u;
const directStateDevToolsRuntimeAmbientIntervalFallbackPattern =
    /\bscope\.(?:clearInterval|setInterval)\s*\?\?\s*globalThis\.(?:clearInterval|setInterval)\b|\bglobalThis\.(?:clearInterval|setInterval)\s*\(/u;
const directRendererStateIntegrationRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directRendererStateIntegrationRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directRendererStateIntegrationRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|clearTimeout|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|clearTimeout|setTimeout)\b/u;
const stateDevToolsTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*(?:STATE_DEBUG_GLOBAL|["']__stateDebug["'])\s*\)|\bglobalThis\.__stateDebug\s*=/u;
const stateIntegrationRetiredGlobalMutationPattern =
    /\bReflect\.(?:set|deleteProperty)\(\s*globalThis\s*,\s*["'](?:AppState|__DEVELOPMENT__|__performanceMonitoringInterval|__persistenceTimeout|__state_debug|chartControlsState|globalData|isChartRendered)["']\s*\)|\bObject\.defineProperty\(\s*globalThis\s*,\s*["'](?:AppState|__DEVELOPMENT__|__performanceMonitoringInterval|__persistenceTimeout|__state_debug|chartControlsState|globalData|isChartRendered)["']|(?:globalThis|testGlobal)\.(?:AppState|__DEVELOPMENT__|__performanceMonitoringInterval|__persistenceTimeout|__state_debug|chartControlsState|globalData|isChartRendered)\s*=/u;
const stateIntegrationBrowserGlobalFixtureMutationPattern =
    /\bglobalThis\.localStorage\s*=|\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:localStorage|performance)["']\s*(?:,|\))|\bReflect\.deleteProperty\(\s*globalThis\.performance\s*,\s*["']memory["']\s*\)/u;
const masterStateManagerTestDirectGlobalFixtureMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*(?:key|["'](?:__DEVELOPMENT__|addEventListener|clearInterval|dispatchEvent|document|getComputedStyle|localStorage|location|performance|setInterval|window)["'])\s*\)/u;
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
const directVitestObjectKeysWrapperMarkerPattern = /\b__isObjectKeysWrapper\b/u;
const directVitestDocumentNativeMethodsGlobalPattern =
    /\b__vitest_doc_native_methods\b/u;
const directVitestDocumentRealignmentAssignmentPattern =
    /\b(?:globalThis|curWin)\.document\s*=/u;
const directVitestCreateElectronMocksGlobalPattern = /\bcreateElectronMocks\b/u;
const directVitestInlineWebStorageMockPattern =
    /\b(?:StorageMock|ensureSafeLocalStorage|ensureSafeSessionStorage)\b|\b(?:globalThis|w)\.(?:Storage|localStorage|sessionStorage)\s*=/u;
const directVitestTimerTrackingGlobalPattern =
    /\b__vitest_(?:tracked_(?:timeouts|intervals|dom_listeners)|timers_wrapped)\b/u;
const directVitestTimerWrapperAssignmentPattern =
    /\bglobalThis\.(?:clearInterval|clearTimeout|setInterval|setTimeout)\s*=/u;
const directVitestDistResolverGlobalPattern =
    /\b__fitFileViewerVitestDistResolverInstalled\b/u;
const directVitestWrappedEventListenerMarkerPattern = /\b__vitest_wrapped\b/u;
const directVitestNavigationHistoryExpandoPattern =
    /\b__ffvNavigationHistory\b/u;
const directVitestWindowEventTargetFallbackPattern =
    /\bwindow\.(?:addEventListener|removeEventListener|dispatchEvent)\s*=|\btypeof\s+window\.dispatchEvent\s*!==\s*["']function["']/u;
const directVitestHTMLElementGlobalBridgePattern =
    /\bglobal\.HTMLElement\s*=\s*window\.HTMLElement\b/u;
const directVitestWindowConsoleGroupPatchPattern =
    /\bwindow\.console\.group(?:Collapsed|End)?\s*=/u;
const directVitestWindowConsoleAssignmentPattern = /\bwindow\.console\s*=/u;
const directVitestEnvConsoleMethodAssignmentPattern =
    /\bconsole\.(?:error|warn)\s*=/u;
const directVitestProcessNextTickSetupAssignmentPattern =
    /\b(?:globalThis|g)\.process\s*=|\b(?:globalThis|g)\.process\.nextTick\s*=|\b\.process\.nextTick\s*=/u;
const directRuntimeEnvironmentTestConsoleAssignmentPattern =
    /\b(?:global|globalThis)\.console\s*=/u;
const directPreloadSourceExecutionGlobalDeletePattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,/u;
const directPlaywrightWindowOpenMutationPattern =
    /\bwindow\.open\s*=|\bReflect\.deleteProperty\(\s*window\s*,\s*["']open["']\s*\)/u;
const handleOpenFileCompleteTestDirectProcessAssignmentPattern =
    /\bglobalThis\.process\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']process["']\s*\)/u;
const processEnvironmentTestDirectProcessDeletePattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']process["']\s*\)/u;
const exportUtilsOauthStateTestDirectCryptoDeletePattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']crypto["']\s*\)/u;
const loadSharedConfigurationTestDirectUrlSearchParamsAssignmentPattern =
    /\b(?:global|globalThis)\.URLSearchParams\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']URLSearchParams["']\s*\)/u;
const directVitestTabButtonObserverCleanupPattern = /\btabButtonObserver\b/u;
const directVitestChartDevToolsGlobalCleanupPattern = /\b__chartjs_dev\b/u;
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
const mainUiTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:cleanupEventListeners|devCleanup|injectMenu|renderChartJS|showFitData)["']\s*\)|\b(?:globalThis|mainUiGlobal)\.(?:cleanupEventListeners|devCleanup|injectMenu|renderChartJS|showFitData)\s*=/u;
const zoneColorPickerTestRetiredGlobalMutationPattern =
    /\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:clearZoneColorData|renderChartJS|updateInlineZoneColorSelectors)["']\s*(?:,|\))|\bglobalThis\.(?:clearZoneColorData|renderChartJS|updateInlineZoneColorSelectors)\s*=/u;
const keyboardShortcutsModalTestRetiredGlobalMutationPattern =
    /\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:closeKeyboardShortcutsModal|showKeyboardShortcutsModal)["']\s*(?:,|\))|\bglobalThis\.(?:closeKeyboardShortcutsModal|showKeyboardShortcutsModal)\s*=/u;
const keyboardShortcutsModalTestDirectAnimationFrameStubPattern =
    /\bvi\.stubGlobal\(\s*["'](?:cancelAnimationFrame|requestAnimationFrame)["']/u;
const settingsModalTestRetiredGlobalMutationPattern =
    /\bdelete\s*\(\s*globalThis\s+as[\s\S]{0,120}?\)\.(?:closeSettingsModal|showSettingsModal)\b|\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:closeSettingsModal|showSettingsModal)["']\s*(?:,|\))|\bglobalThis\.(?:closeSettingsModal|showSettingsModal)\s*=/u;
const lifecycleListenersTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:copyTableAsCSV|createExportGPXButton|globalData|renderChartJS|sendFitFileToAltFitReader)["']\s*\)|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']createExportGPXButton["']\s*,|\b(?:globalThis|window)\.(?:copyTableAsCSV|createExportGPXButton|globalData|renderChartJS|sendFitFileToAltFitReader)\s*=/u;
const lifecycleListenersTestDirectPrintAssignmentPattern =
    /\bwindow\.print\s*=/u;
const appEventsTestRetiredFitDataGlobalMutationPattern =
    /\b(?:globalData|loadedFitFiles)\?:|\bObject\.defineProperty\(\s*(?:globalThis|globalAny|testGlobal)\s*,\s*["'](?:globalData|loadedFitFiles)["']|\bdelete\s+(?:globalAny|testGlobal)\.(?:globalData|loadedFitFiles)\b|\b(?:globalThis|globalAny|testGlobal)\.(?:globalData|loadedFitFiles)\s*=/u;
const typedFitDataTestRetiredGlobalCleanupPattern =
    /\b(?:globalData|loadedFitFiles)\?:|\bdelete\s+(?:appGlobal|currentWindow|testWindow\(\)|getTestWindow\(\))\.(?:globalData|loadedFitFiles)\b|\b(?:appGlobal|currentWindow|testWindow\(\)|getTestWindow\(\))\.(?:globalData|loadedFitFiles)\s*=/u;
const chartSettingsDropdownsTestRetiredGlobalDataFixturePattern =
    /\bstate\[\s*["']globalData["']\s*\]|\bseedGlobalData\b/u;
const renderMapStrictTestRetiredFitGlobalFixturePattern =
    /\bRenderMapWindow\b|\b(?:window|w)\.(?:globalData|loadedFitFiles)\b/u;
const updateTabVisibilityRawDataTestRetiredGlobalDataPattern =
    /\bcurrentGlobalData\b|\bglobalDataCallback\b|\bgetState\s*:\s*mockGetState[\s\S]*?\b["']globalData["']|updateTabVisibility\.globalDataState\.test\.ts/u;
const updateTabVisibilityTestDirectBrowserGlobalAssignmentPattern =
    /\b(?:globalThis|global)\.(?:document|window)\s*=(?!=)|\(\s*global\s+as\s+any\s*\)\.(?:document|window)\s*=(?!=)|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:document|window)["']\s*\)/u;
const tabStateManagerRegressionTestRetiredGlobalDataFixturePattern =
    /\bglobalData:\s*\{[^}]*recordMesgs|\bglobalData:\s*(?:null|undefined)|\(\{\s*expectedDisabled,\s*globalData\s*\}\)|updateTabAvailability\(globalData/u;
const tabButtonStateIntegrationRetiredGlobalDataFixturePattern =
    /\|\s*["']globalData["']|\bglobalData:\s*null/u;
const strictMainUiTestRetiredGlobalDataFixturePattern =
    /\bglobalData:\s*undefined|\bmockState\[\s*["']globalData["']\s*\]/u;
const computedStateManagerTestRetiredGlobalDataFixturePattern =
    /\bglobalData(?:\.(?:missing|test))?\b/u;
const createShownFilesListTestRetiredLeafletGlobalPattern =
    /\bwindowMock\.L\b|\(\s*global\.window\s+as\s+any\s*\)\.L\b|\b(?:window|globalThis)\.L\b/u;
const tabButtonsTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:areTabButtonsEnabled|debugTabButtons|debugTabState|forceEnableTabButtons|forceFixTabButtons|setTabButtonsEnabled|tabButtonObserver|testTabButtonClicks)["']\s*\)|\bdelete\s*\(\s*global\s+as\s+any\s*\)\.window\.tabButtonsCurrentlyEnabled\b|\bdelete\s*\(\s*globalThis\s+as[\s\S]{0,160}?\)\.tabButtonsCurrentlyEnabled\b|\b(?:globalThis|global\.window)\.(?:areTabButtonsEnabled|debugTabButtons|debugTabState|forceEnableTabButtons|forceFixTabButtons|setTabButtonsEnabled|tabButtonObserver|tabButtonsCurrentlyEnabled|testTabButtonClicks)\s*=/u;
const tabButtonsTestDirectBrowserGlobalFixtureAssignmentPattern =
    /\bglobalThis\.(?:getComputedStyle|MutationObserver|window)\s*=(?!=)|\b(?:global|\(\s*global\s+as\s+any\s*\))\.window\s*=(?!=)|\bglobal\.MutationObserver\s*=(?!=)|\bglobal\.window\.MutationObserver\s*=(?!=)|\bReflect\.deleteProperty\(\s*globalThis(?:\.window)?\s*,\s*["'](?:getComputedStyle|MutationObserver|window)["']\s*\)/u;
const chartTabIntegrationTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']chartTabIntegration["']\s*\)|\bglobalThis\.chartTabIntegration\s*=/u;
const renderChartRuntimeHelpersTestRetiredGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:chartActions|chartStateManager)["']\s*\)|\bObject\.defineProperty\(\s*globalThis\s*,\s*["'](?:chartActions|chartStateManager)["']|(?:globalThis|chartGlobal|runtimeGlobal)\.(?:chartActions|chartStateManager)\s*=/u;
const renderChartRuntimeHelpersTestDirectProcessWindowDeletePattern =
    /\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:process|window)["']\s*\)/u;
const directMainProcessDevHelpersGlobalPattern =
    /\b(?:window|globalThis)\.devHelpers\b|Object\.defineProperty\(\s*globalThis\s*,\s*["']devHelpers["']\s*\)|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']devHelpers["']\s*\)/u;
const mainProcessDevHelpersTestRetiredGlobalMutationPattern =
    /\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["']devHelpers["']\s*(?:,|\))|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']devHelpers["']|\bglobalThis\.devHelpers\s*=/u;
const directElectronHoistedMockGlobalAllowedFiles = new Set<string>();
const directElectronHoistedMockGlobalPattern =
    /\b(?:window|globalThis|getMenuGlobal\(\))\.__electronHoistedMock\b|Reflect\.(?:get|set|deleteProperty)\(\s*globalThis\s*,\s*["']__electronHoistedMock["']/u;
const directMenuModalPresenterGlobalPattern =
    /\b(?:window|globalThis|getMenuIpcGlobal\(\)|keyboardShortcutsGlobal|menuGlobal)\.(?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:showAccentColorPicker|showKeyboardShortcutsModal|closeKeyboardShortcutsModal)["']\s*\)/u;
const directSettingsModalGlobalPattern =
    /\b(?:window|globalThis|settingsModalGlobal)\.(?:showSettingsModal|closeSettingsModal)\b|\bReflect\.(?:get|set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:showSettingsModal|closeSettingsModal)["']\s*\)/u;
const directSettingsModalTimingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\b|(?:^|[^\w.])(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\(/u;
const directModalRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\(/u;
const directDragDropHandlerTimingRuntimeGlobalPattern =
    /\bnew\s+AbortController\b|\b(?:globalThis|window)\.(?:cancelAnimationFrame|requestAnimationFrame)\b|(?:^|[^\w.])(?:cancelAnimationFrame|requestAnimationFrame)\(/u;
const directDragDropHandlerRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|cancelAnimationFrame|requestAnimationFrame)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|cancelAnimationFrame|requestAnimationFrame)\b/u;
const directKeyboardShortcutsModalTimingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\b|(?:^|[^\w.])(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\(/u;
const directAboutModalTimingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\b|(?:^|[^\w.])(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\(/u;
const directShowNotificationTimingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\b|(?:^|[^\w.])(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\(/u;
const directShowNotificationRuntimeAmbientGetterPattern =
    /\bget\s+(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout|window)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout|window)\b/u;
const directNotificationTimerRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directNotificationTimerRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directAboutModalDevHelperGlobalPattern =
    /\b(?:window|globalThis|aboutGlobal)\.aboutModalDevHelpers\b|["']aboutModalDevHelpers["']/u;
const aboutModalTestDirectRequestAnimationFrameAssignmentPattern =
    /\bglobalThis\.requestAnimationFrame\s*=|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']requestAnimationFrame["']\s*,|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']requestAnimationFrame["']\s*\)|\bvi\.stubGlobal\(\s*["']requestAnimationFrame["']/u;
const showNotificationStrictTestDirectRequestAnimationFrameAssignmentPattern =
    /\bwindow\.requestAnimationFrame\s*=/u;
const settingsStateManagerTestDirectConsoleAssignmentPattern =
    /\bglobal\.console\s*=/u;
const directSettingsStateCoreRuntimeGlobalPattern =
    /\bnew\s+AbortController\b|\b(?:globalThis|window)\.addEventListener\b|\bglobalThis\??\.localStorage\b|(?:^|[^\w.])localStorage\./u;
const directSettingsStateCoreRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|addEventListener|localStorage)\b|\bscope:\s*SettingsStateCoreRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultSettingsStateCoreRuntimeScope:\s*SettingsStateCoreRuntimeScope\s*=\s*globalThis\b/u;
const handleOpenFileTestDirectConsoleMethodAssignmentPattern =
    /\bconsole\.(?:error|info|log|warn)\s*=/u;
const dataPointFilterStateHelpersTestDirectConsoleAssignmentPattern =
    /\bconsole\.error\s*=/u;
const renderSingleHrZoneBarTestDirectGlobalFixtureAssignmentPattern =
    /\b(?:testGlobal|global)\.(?:console|document|HTMLCanvasElement|HTMLElement|window)\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,/u;
const renderAltitudeProfileChartTestDirectGlobalFixtureAssignmentPattern =
    /\b(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\s*=|\bdelete\s+(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\b/u;
const renderSpeedVsDistanceChartTestDirectGlobalFixtureAssignmentPattern =
    /\b(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\s*=|\bdelete\s+(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\b/u;
const renderPowerVsHeartRateChartTestDirectGlobalFixtureAssignmentPattern =
    /\b(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\s*=|\bdelete\s+(?:global|getChartTestGlobal\(\))\.(?:console|document|HTMLCanvasElement|HTMLElement|localStorage|window)\b/u;
const renderEventMessagesChartTestDirectWindowAssignmentPattern =
    /\bglobal\.window\s*=/u;
const directActiveFitFileNameGlobalPattern =
    /\b(?:window|globalThis|windowGlobal|summaryGlobal)\.activeFitFileName\b|["']activeFitFileName["']/u;
const renderSummaryTestActiveFitFileNameMutationPattern =
    /\bObject\.defineProperty\(\s*window\s*,\s*["']activeFitFileName["']|Reflect\.deleteProperty\(\s*window\s*,\s*["']activeFitFileName["']\s*\)|\b(?:window|globalThis)\.activeFitFileName\s*=/u;
const tabStateManagerTestRetiredRendererGlobalMutationPattern =
    /\bdelete\s*\(\s*window\s+as\s+unknown\s+as\s+Record<string,\s*unknown>\s*\)\.renderSummary\b|\bReflect\.(?:deleteProperty|set)\(\s*window\s*,\s*["']renderSummary["']\s*(?:,|\))|\bwindow\.renderSummary\s*=/u;
const tabStateManagerTestDirectConsoleMethodAssignmentPattern =
    /\bconsole\.(?:error|log|warn)\s*=/u;
const enableTabButtonsTestDirectConsoleMethodAssignmentPattern =
    /\bconsole\.(?:log|warn)\s*=/u;
const chartStatusIndicatorTestDirectConsoleMethodAssignmentPattern =
    /\bconsole\.error\s*=/u;
const directChartConstructorGlobalPattern =
    /\b(?:window|globalThis|runtimeGlobal|chartGlobal|zoneGlobal)\.Chart\b/u;
const listenersResizeChartGlobalMutationPattern =
    /\bReflect\.(?:set|deleteProperty)\(\s*globalThis\s*,\s*["'](?:Chart|renderChart|renderChartJS)["']\s*\)|\b(?:globalThis|chartGlobal)\.(?:Chart|renderChart|renderChartJS)\s*=/u;
const renderChartJSComprehensiveTestRetiredGlobalMutationPattern =
    /\bReflect\.(?:set|deleteProperty)\(\s*globalThis\s*,\s*["'](?:Chart|ChartZoom|chartjsPluginZoom)["']\s*(?:,|\))|\bObject\.defineProperty\(\s*globalThis\s*,\s*["'](?:Chart|ChartZoom|chartjsPluginZoom)["']|\bglobalThis\.(?:Chart|ChartZoom|chartjsPluginZoom)\s*=/u;
const renderChartJSComprehensiveTestDirectBrowserFixtureAssignmentPattern =
    /\b(?:global|globalThis|utils)\.(?:document|window|performance|Node|requestAnimationFrame|cancelAnimationFrame|matchMedia|setTimeout|clearTimeout|addEventListener)\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:addEventListener|cancelAnimationFrame|clearTimeout|document|matchMedia|Node|performance|requestAnimationFrame|setTimeout|window)["']\s*\)/u;
const chartZoomResetPluginTestDirectCanvasConstructorFixturePattern =
    /\bObject\.defineProperty\(\s*globalThis\s*,\s*["']CanvasRenderingContext2D["']\s*,|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']CanvasRenderingContext2D["']\s*\)/u;
const renderChartJSStateApiTestRetiredGlobalMutationPattern =
    /\bObject\.defineProperty\(\s*window\s*,\s*["']Chart["']|\bReflect\.(?:deleteProperty|set)\(\s*window\s*,\s*["']Chart["']\s*(?:,|\))|\bwindow\.Chart\s*=/u;
const strictChartTestDirectGlobalFixtureMutationPattern =
    /\bglobalThis\.(?:window|document|HTMLCanvasElement|HTMLElement|console|localStorage)\s*=|\bdelete\s+(?:globalThis|zoneGlobal)\.(?:window|document|HTMLCanvasElement|HTMLElement|console|localStorage)\b|\bReflect\.deleteProperty\(\s*globalThis\s*,/u;
const chartZoneColorUtilsTestDirectLocalStorageAssignmentPattern =
    /\bglobalThis\.localStorage\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']localStorage["']\s*\)/u;
const stateMiddlewareBranchesTestDirectLocalStorageMethodAssignmentPattern =
    /\blocalStorage\.setItem\s*=|\blocalStorage\.__proto__/u;
const renderChartJSStateApiTestRetiredGlobalDataFixturePattern =
    /\bgetMockStateValue[\s\S]*?\b["']globalData["']|\bglobalMockState\.data\.set\(\s*["']globalData["']|globalData which means hasValidData/u;
const renderLapZoneChartsTestRetiredGlobalDataFixturePattern =
    /\bLapZoneGlobalData\b|\blapZoneGlobalData\b|\bsetLapZoneGlobalData\b|global data validation|managed globalData/u;
const directShowNotificationGlobalLookupPattern =
    /\b(?:window|globalThis|chartGlobal|globalRef|runtimeGlobal|zoneColorGlobal|getRuntimeGlobal\(\))\.showNotification\b/u;
const directAccentColorPickerRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const errorHandlingPerformanceMonitorGlobalLookupPattern =
    /\bglobalRef\.performanceMonitor\b|\bperformanceMonitor\?:\s*\{/u;
const directErrorHandlingRuntimeGlobalPattern = /\bnew\s+AbortController\b/u;
const directErrorHandlingRuntimeAmbientGetterPattern =
    /\bget\s+AbortController\s*\(\)\s*\{|\breturn\s+globalThis\.AbortController\b/u;
const directErrorHandlingEventTargetGlobalPattern =
    /\bconst\s+globalRef\s*=\s*globalThis\b|\bglobalRef\.addEventListener\b/u;
const errorHandlingTestDirectPerformanceMonitorFixturePattern =
    /\bglobalRef\.performanceMonitor\s*=|\bReflect\.deleteProperty\(\s*globalRef\s*,\s*["']performanceMonitor["']\s*\)/u;
const directRendererDevGlobalPattern =
    /\b(?:window|globalThis|rendererGlobal)\.__renderer_dev\b|["']__renderer_dev["']/u;
const rendererDevelopmentDebugGlobalPattern =
    /\b(?:window|globalThis|rendererGlobal)\.(?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)\b|["'](?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)["']/u;
const directRendererDevelopmentDebugToolsRuntimeGlobalPattern =
    /\bReflect\.get\(\s*globalThis\s*,\s*["'](?:location|navigator|performance)["']\s*\)|\bglobalThis\.(?:location|navigator|performance)\b|\b(?:navigator|performance)\.(?:cookieEnabled|hardwareConcurrency|language|memory|onLine|platform|userAgent)\b/u;
const directRendererDevelopmentDebugToolsRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.(?:location|navigator|performance)\b/u;
const directRendererDevelopmentDebugToolsRuntimeAmbientScopePattern =
    /\bscope\.(?:location|navigator|performance)\b|\bReflect\.get\(\s*scope\s*,\s*["'](?:location|navigator|performance)["']\s*\)|\bscope:\s*RendererDevelopmentDebugToolsRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultRendererDevelopmentDebugToolsRuntimeScope:\s*RendererDevelopmentDebugToolsRuntimeScope\s*=\s*globalThis\b/u;
const rendererDevelopmentDebugGlobalMutationPattern =
    /\bReflect\.(?:set|deleteProperty)\(\s*(?:window|globalThis)\s*,\s*["'](?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)["']\s*\)|\b(?:window|globalThis)\.(?:__renderer_dev|__renderer_debug|__sensorDebug|__debugChartFormatting)\s*=/u;
const rawGlobalThisAnyCastPattern = /\(\s*globalThis\s+as\s+any\s*\)/u;
const directDataTableGlobalPattern =
    /\b(?:window|globalThis|tableGlobal|renderTableGlobal)\.(?:\$|jQuery|DataTable)\b|\.jQuery\b/u;
const directRenderTableRuntimeGlobalPattern =
    /\b(?:document|globalThis)\.(?:createElement|getElementById|getComputedStyle|requestAnimationFrame)\b|(?:^|[^\w.])setTimeout\(|\binstanceof\s+(?:HTMLElement|HTMLTableCellElement)\b/u;
const directRenderTableRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directChartInstanceGlobalPattern = /\b_chartjsInstances\b/u;
const directChartCanvasExpandoPattern = /\b__chartjs\b/u;
const directDomPurifyGlobalPattern =
    /\b(?:window|globalThis|globalRef|testGlobal)\.DOMPurify\b|\bReflect\.get\(\s*globalThis\s*,\s*["']DOMPurify["']\s*\)|\{\s*DOMPurify\?:\s*unknown\s*\}\)\.DOMPurify/u;
const directDomHelpersRuntimeGlobalPattern = /\bnew\s+AbortController\b/u;
const directDomHelpersRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directArqueroGlobalPattern =
    /\b(?:window|globalThis|summaryGlobal|testGlobal)\.(?:aq|arquero)\b|\{\s*(?:aq|arquero)\?:\s*unknown\s*\}\)\.(?:aq|arquero)/u;
const directJSZipGlobalPattern =
    /\b(?:window|globalThis|testGlobal|getExportRuntimeGlobal\(\))\.JSZip\b|\{\s*JSZip\?:\s*unknown\s*\}\)\.JSZip/u;
const directScreenfullGlobalPattern =
    /\b(?:window|globalThis|testGlobal|getFullscreenGlobal\(\))\.screenfull\b|\{\s*screenfull\?:\s*unknown\s*\}\)\.screenfull/u;
const directAddFullScreenButtonRuntimeGlobalPattern =
    /\bnew\s+AbortController\b|\b(?:document|globalThis|window)\.(?:addEventListener|removeEventListener)\(/u;
const directLeafletGlobalPattern =
    /\b(?:window|globalThis|windowExt|w|win|getWin\(\))\.L\b|\bReflect\.get\(\s*globalThis\s*,\s*["']L["']\s*\)|\{\s*L\?:\s*unknown\s*\}\)\.L/u;
const leafletCompatibilityGlobalDefinitionPattern =
    /\bObject\.defineProperty\(\s*[^,\n]+,\s*["']L["']/u;
const leafletRuntimeTestGlobalMutationPattern =
    /\bReflect\.deleteProperty\(\s*(?:globalThis|window)\s*,\s*["'](?:L|Leaflet)["']\s*\)|\bObject\.defineProperty\(\s*(?:globalThis|window)\s*,\s*["'](?:L|Leaflet)["']\s*,|\b(?:globalThis|window)\.(?:L|Leaflet)\s*=/u;
const mapDrawLapsTestDirectWindowFixtureMutationPattern =
    /\btestGlobal\.window\s*=|\bdelete\s+testGlobal\.window\b/u;
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
    /\b(?:globalThis|window)\.electronAPI\b|\.\s*electronAPI\b|\(\s*globalThis\s+as\s+\{[^}]*electronAPI|\b(?:Reflect\.deleteProperty|Object\.defineProperty)\(\s*(?:globalThis|window)\s*,\s*["']electronAPI["']/u;
const electronApiRuntimeTestDirectGlobalFixturePattern =
    /\bObject\.defineProperty\(\s*globalThis\s*,\s*["']electronAPI["']\s*,|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']electronAPI["']\s*\)/u;
const mainUiDomUtilsTestDirectElectronApiGlobalFixturePattern =
    /\bObject\.defineProperty\(\s*globalThis\s*,\s*(?:ELECTRON_API_PROPERTY|["']electronAPI["'])\s*,|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*(?:ELECTRON_API_PROPERTY|["']electronAPI["'])\s*\)/u;
const directMainUiDomUtilsRuntimeGlobalPattern = /\bnew\s+AbortController\b/u;
const directMainUiDomUtilsRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directEventListenerManagerRuntimeGlobalPattern =
    /\bnew\s+AbortController\b|\bglobalThis\.window\b/u;
const directEventListenerManagerRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.(?:AbortController|window)\b/u;
const preloadTestDirectElectronApiGlobalFixturePattern =
    /\b(?:Object\.defineProperty|Reflect\.deleteProperty)\(\s*globalThis\s*,/u;
const directExternalLinkHandlersRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.open\b/u;
const directExternalLinkHandlersRuntimeAmbientGetterPattern =
    /\bget\s+open\s*\(\)\s*\{|\breturn\s+globalThis\.open\b/u;
const directMapActionButtonsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:setTimeout|clearTimeout)\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directMapActionButtonsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directMapDocumentListenersRuntimeGlobalPattern =
    /\bdocument\.addEventListener\b|\b(?:globalThis|window)\.addEventListener\b|\bglobalThis\.window\b|\bnew\s+AbortController\b/u;
const directMapFullscreenControlRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:setTimeout|clearTimeout)\b|\bdocument\.addEventListener\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directMapFullscreenControlRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directMapMeasureToolRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:setTimeout|clearTimeout)\b|\bdocument\.(?:addEventListener|removeEventListener)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directMapMeasureToolRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directMapLapSelectorRuntimeGlobalPattern =
    /\bdocument\.(?:addEventListener|removeEventListener)\b|\bnew\s+AbortController\b/u;
const directMapDrawLapsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:setTimeout|clearTimeout)\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directMapDrawLapsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directOpenFileSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|clearTimeout|createElement|queueMicrotask|setTimeout)\b|\bnew\s+AbortController\b|\bnavigator\.userAgent\b|(?:^|[^\w.])(?:queueMicrotask|setTimeout|clearTimeout)\(/u;
const directOpenFileSelectorRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|queueMicrotask|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|queueMicrotask|setTimeout)\b|\bglobalThis\.(?:clearTimeout|queueMicrotask|setTimeout)\s*\(/u;
const directLoadSingleOverlayFileRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directLoadOverlayFilesRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.navigator\b|\bnavigator\.hardwareConcurrency\b/u;
const directFitBrowserFeatureGateRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:querySelector|getElementById)\b|\binstanceof\s+HTMLElement\b/u;
const directFitBrowserFeatureGateRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.(?:document|HTMLElement)\b/u;
const directFileBrowserTabRuntimeGlobalPattern = /\bnew\s+AbortController\b/u;
const directFileBrowserTabRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directCreateElevationProfileButtonRuntimeGlobalPattern =
    /(?<!\.)\b(?:document|globalThis|window)\.(?:body|chartOverlayColorPalette|createElement|createElementNS|open)\b|\bnew\s+AbortController\b/u;
const directCreateElevationProfileButtonRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.AbortController\b/u;
const directCreateElevationProfileButtonRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|chartOverlayColorPalette|document|open)\s*\(\)\s*\{|\breturn\s+(?:\(globalThis\s+as\s+ElevationProfileButtonGlobalScope\)|globalThis)\.(?:AbortController|chartOverlayColorPalette|document|open)\b/u;
const directAltFitSenderRuntimeGlobalPattern =
    /\bglobalThis\.(?:console|document|location)\b|\bnew\s+AbortController\b/u;
const directLoadSharedConfigurationRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|location|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directLoadSharedConfigurationRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directGetCurrentSettingsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directGetCurrentSettingsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directLazyRenderingRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:innerHeight|innerWidth|requestAnimationFrame|requestIdleCallback|setTimeout)\b|\bdocument\.documentElement\b|\btypeof\s+IntersectionObserver\b|\bnew\s+IntersectionObserver\b|\belement\s+instanceof\s+HTMLElement\b|\breturn\s+setTimeout\(/u;
const directLazyRenderingRuntimeAmbientFallbackPattern =
    /\bscope\.setTimeout\s*\?\?\s*globalThis\.setTimeout\b/u;
const directLazyRenderingRuntimeAmbientGetterPattern =
    /\bget\s+(?:document|HTMLElement|innerHeight|innerWidth|IntersectionObserver|requestAnimationFrame|requestIdleCallback|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:document|HTMLElement|innerHeight|innerWidth|IntersectionObserver|requestAnimationFrame|requestIdleCallback|setTimeout)\b/u;
const directListenersResizeRuntimeGlobalPattern =
    /\b(?:document|window|globalThis)\.|\bReflect\.get\(|\bnew\s+AbortController\b|\binstanceof\s+(?:Element|HTMLCanvasElement)\b|\bquerySelectorByIdFlexible\(\s*document\b|(?:^|[^\w.])(?:setTimeout|clearTimeout|requestAnimationFrame|cancelAnimationFrame)\(/u;
const directListenersResizeRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directChartThemeRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:document|localStorage|matchMedia)\b|\bdocument\.body\b|\blocalStorage\.getItem\b/u;
const directThemeCoreRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|matchMedia|setTimeout|window)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(|\bnew\s+AbortController\b/u;
const directThemeCoreRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directSetupThemeRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directSetupThemeRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const updateActiveTabFallbackDirectGlobalFixtureMutationPattern =
    /\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:document|window)["']\s*(?:,|\))/u;
const themeAdditionalTestDirectGlobalFixtureMutationPattern =
    /\bReflect\.(?:deleteProperty|set)\(\s*globalThis\s*,\s*["'](?:getComputedStyle|localStorage|matchMedia)["']\s*(?:,|\))/u;
const uiStateManagerTestDirectMatchMediaMutationPattern =
    /\bObject\.defineProperty\(\s*globalThis\s*,\s*["']matchMedia["']\s*,|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["']matchMedia["']\s*\)/u;
const directUiStateManagerBrowserRuntimePattern =
    /\bnew\s+AbortController\b|\bglobalThis\.(?:matchMedia|window)\b|\bwindow\.addEventListener\b/u;
const directChartThemeListenerRuntimeGlobalPattern =
    /\bdocument\.body\b|\binstanceof\s+CustomEvent\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directChartThemeListenerRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|CustomEvent|clearTimeout|setTimeout)[^;\n]*\?\?\s*globalThis\.(?:AbortController|CustomEvent|clearTimeout|setTimeout)\b/u;
const directMapThemeToggleRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|clearTimeout|dispatchEvent|setTimeout)\b|\bnew\s+(?:AbortController|CustomEvent)\b|\btypeof\s+document\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directMapThemeToggleRuntimeAmbientFallbackPattern =
    /\bscope\.(?:CustomEvent|clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:CustomEvent|clearTimeout|setTimeout)\b/u;
const directUpdateMapThemeRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|querySelector)\b|\bnew\s+AbortController\b|\btypeof\s+document\b|\binstanceof\s+HTMLElement\b/u;
const directChartStatusCountsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.inner(?:Height|Width)\b|\bdocument\.querySelector\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directChartStatusIndicatorRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|HTMLElement|addEventListener|clearTimeout|document|innerHeight|innerWidth|setTimeout)\b|\bscope\.(?:AbortController|HTMLElement|clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:AbortController|HTMLElement|clearTimeout|setTimeout)\b/u;
const directGlobalChartStatusRuntimeGlobalPattern =
    /\bdocument\.querySelector\b|\binstanceof\s+HTMLElement\b/u;
const directGlobalChartStatusUpdaterRuntimeGlobalPattern =
    /\bdocument\.(?:body|querySelector)\b|\binstanceof\s+HTMLElement\b/u;
const directChartStatusEventGlobalPattern =
    /\bdocument\.(?:addEventListener|querySelector)\b|\b(?:globalThis|window)\.addEventListener\(\s*["']fieldToggleChanged["']|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const chartStatusIndicatorTestDirectBrowserFixtureAssignmentPattern =
    /\b(?:globalThis|global|testGlobal)\.(?:addEventListener|customElements|document|HTMLElement|setTimeout|window)\s*=|\b(?:document|window)\.addEventListener\s*=|\bReflect\.deleteProperty\(\s*(?:globalThis|document|window)\s*,/u;
const directChartListenerStateAbortControllerPattern =
    /\bnew\s+AbortController\b/u;
const directChartListenerStateRuntimeAmbientControllerPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directRenderChartDirectRerenderRuntimeGlobalPattern =
    /\bdocument\.querySelector\b|\btypeof\s+document\b|\binstanceof\s+HTMLElement\b/u;
const directRenderChartRequestListenerRuntimeGlobalPattern =
    /\bdocument\.(?:body|querySelector)\b|\bglobalThis\.(?:addEventListener|CustomEvent|HTMLElement)\b|\binstanceof\s+CustomEvent\b/u;
const directRenderChartStartupRuntimeGlobalPattern =
    /\bglobalThis\.(?:addEventListener|window)\b/u;
const directRenderChartJsTimerRuntimeGlobalPattern =
    /(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directRenderChartTimerRuntimeGlobalPattern =
    /(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directMainUiSummarySelectorRuntimeGlobalPattern =
    /\bdocument\.querySelector\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])setTimeout\(/u;
const directMainUiSummarySelectorRuntimeAmbientFallbackPattern =
    /\bscope\.(?:document|HTMLElement|setTimeout)\b|\bscope:\s*MainUiSummaryColumnSelectorRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultMainUiSummaryColumnSelectorRuntimeScope:\s*MainUiSummaryColumnSelectorRuntimeScope\s*=\s*globalThis\b/u;
const directRendererApplicationStartupRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directRendererApplicationStartupRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:AbortController|clearTimeout|setTimeout)\b|\breturn\s+globalThis\.(?:AbortController|clearTimeout|setTimeout)\b/u;
const directRendererApplicationLifecycleWiringRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directRendererApplicationLifecycleWiringRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directRendererFileInputStartupRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directRendererFileInputStartupRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directRendererTestOnlyBootstrapRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directRendererTestOnlyBootstrapRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.AbortController\b/u;
const directLastAnimLogRuntimeGlobalPattern =
    /\bDate\.now\b|\bperformance\.now\b/u;
const directLastAnimLogRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.performance\b/u;
const directRuntimeAmbientClockFallbackPattern =
    /\?\?\s*(?:Date\.now\(\)|globalThis\.performance\.now\(\))/u;
const directRenderChartJSRuntimeAmbientGetterPattern =
    /\bget\s+(?:CustomEventConstructor|performance|window)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:performance|window)\b/u;
const directRendererVendorBundleLoaderRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|clearTimeout|createElement|head|querySelector|removeEventListener|setTimeout)\b|\bDate\.now\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directRendererVendorBundleLoaderRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|now|setTimeout)(?:\?\.\(\))?\s*\?\?\s*(?:globalThis\.(?:clearTimeout|setTimeout)|Date\.now\(\))/u;
const directRendererVendorBundleLoaderRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|addEventListener|clearTimeout|document|HTMLScriptElement|removeEventListener|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|addEventListener|clearTimeout|document|HTMLScriptElement|removeEventListener|setTimeout)\b/u;
const directNetworkUtilsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:fetch|clearTimeout|setTimeout|AbortController)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:fetch|clearTimeout|setTimeout)\(/u;
const directNetworkUtilsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|clearTimeout|fetch|setTimeout)\s*\?\?\s*globalThis\.(?:AbortController|clearTimeout|fetch|setTimeout)\b|\breturn\s+globalThis\.(?:AbortController|clearTimeout|fetch|setTimeout)\b/u;
const directPerformanceUtilsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelIdleCallback|clearTimeout|requestIdleCallback|setTimeout)\b|(?<!function\s)(?<![\w.])(?:cancelIdleCallback|clearTimeout|requestIdleCallback|setTimeout)\(|\bDate\.now\(/u;
const directPerformanceUtilsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:cancelIdleCallback|clearTimeout|dateNow|requestIdleCallback|setTimeout)\b|\bscope:\s*PerformanceUtilsRuntimeScope\s*=\s*globalThis\b|\bPerformanceUtilsRuntimeScope\s*=\s*globalThis\b|\?\?\s*globalThis\b/u;
const directCancellationTokenRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directCancellationTokenRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\breturn\s+globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directChartHoverEffectsRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:requestAnimationFrame|setTimeout)\b|(?<![\w.])(?:requestAnimationFrame|setTimeout)\(|\bnew\s+AbortController\b/u;
const directChartHoverEffectsRuntimeAmbientFallbackPattern =
    /\bglobalThis\.setTimeout\s*\(|\bscope\.setTimeout\s*\?\?\s*globalThis\.setTimeout\b/u;
const directChartStateManagerRuntimeGlobalPattern =
    /\bdocument\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directSummaryColModalViewportGlobalPattern =
    /\b(?:globalThis|window)\.inner(?:Height|Width)\b|\bnew\s+AbortController\b/u;
const directRenderSummarySchedulingRuntimeGlobalPattern =
    /\bglobalThis\.(?:addEventListener|cancelAnimationFrame|requestAnimationFrame)\b|\bnew\s+AbortController\b/u;
const directUserDeviceInfoBoxRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directUpdateControlsStateRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.getComputedStyle\b/u;
const directUpdateControlsStateRuntimeAmbientGetterPattern =
    /\bget\s+getComputedStyle\s*\(\)\s*\{|\breturn\s+globalThis\.getComputedStyle\b/u;
const directEnableTabButtonsDebugRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:getComputedStyle|window)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directEnableTabButtonsDebugRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:AbortController|clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directEnableTabButtonsRuntimeGlobalPattern =
    /\bglobalThis\.window\b|\btypeof\s+MutationObserver\b|\bReflect\.construct\b|\bgetTabButtonsGlobal\(\)|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directEnableTabButtonsRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
const directEnableTabButtonsHelpersRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:getComputedStyle|window)\b|\bReflect\.get\(\s*document\b|\btypeof\s+document\s*!==/u;
const directUpdateTabVisibilityRuntimeGlobalPattern =
    /\bglobalThis\.(?:document|requestAnimationFrame)\b|\breturn\s+document\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directUpdateTabVisibilityRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|document|requestAnimationFrame|setTimeout)\b|\bscope:\s*UpdateTabVisibilityRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultUpdateTabVisibilityRuntimeScope:\s*UpdateTabVisibilityRuntimeScope\s*=\s*globalThis\b/u;
const directTabStateManagerHandlersRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\b|(?:^|[^\w.])(?:cancelAnimationFrame|clearTimeout|requestAnimationFrame|setTimeout)\(/u;
const directTabStateManagerHandlersRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directUnifiedControlBarRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|body|clearTimeout|createElement|querySelector|removeEventListener|setTimeout)\b|\bnew\s+(?:AbortController|MutationObserver)\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directUnifiedControlBarRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|clearTimeout|document|eventTarget|HTMLElement|MutationObserver|setTimeout)\b|\bscope:\s*UnifiedControlBarRuntimeScope\s*=\s*globalThis\b|\bUnifiedControlBarRuntimeScope\s*=\s*globalThis\b|\?\?\s*globalThis\b/u;
const directQuickColorSwitcherRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|clearTimeout|setTimeout)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directQuickColorSwitcherRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|clearTimeout|document|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|clearTimeout|document|setTimeout)\b/u;
const directQuickColorSwitcherRuntimeAmbientTimerFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directShownFilesListRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:addEventListener|clearTimeout|innerHeight|innerWidth|setTimeout)\b|\bdocument\.body\.addEventListener\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directShownFilesListRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|addEventListener|clearTimeout|document|innerHeight|innerWidth|setTimeout)\b|\bscope:\s*ShownFilesListRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultShownFilesListRuntimeScope:\s*ShownFilesListRuntimeScope\s*=\s*globalThis\b|\?\?\s*globalThis\b|\bglobalThis\.(?:addEventListener|clearTimeout|setTimeout)\s*\(/u;
const directCreditsMarqueeRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|querySelectorAll|removeEventListener)\b|\btypeof\s+ResizeObserver\b|\bnew\s+(?:AbortController|MutationObserver|ResizeObserver)\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])(?:requestAnimationFrame|cancelAnimationFrame)\(/u;
const directCreditsMarqueeRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|cancelAnimationFrame|document|eventTarget|HTMLElement|MutationObserver|requestAnimationFrame|ResizeObserver)\b|\bscope:\s*CreditsMarqueeRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultCreditsMarqueeRuntimeScope:\s*CreditsMarqueeRuntimeScope\s*=\s*globalThis\b|\?\?\s*globalThis\b/u;
const creditsMarqueeTestDirectGlobalFixtureMutationPattern =
    /\bglobalThis\.ResizeObserver\s*=|\bObject\.defineProperty\(\s*globalThis\s*,\s*["']ResizeObserver["']\s*,|\bReflect\.deleteProperty\([\s\S]{0,120}["'](?:ResizeObserver|requestAnimationFrame|cancelAnimationFrame)["']\s*\)|\bvi\.stubGlobal\(\s*["'](?:ResizeObserver|requestAnimationFrame|cancelAnimationFrame)["']/u;
const directEnsureChartSettingsDropdownsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|(?:^|[^\w.])setTimeout\(/u;
const directEnsureChartSettingsDropdownsRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|document|HTMLElement|setTimeout)\b|\bscope:\s*EnsureChartSettingsDropdownsRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultEnsureChartSettingsDropdownsRuntimeScope:\s*EnsureChartSettingsDropdownsRuntimeScope\s*=\s*globalThis\b/u;
const directCreateSettingsHeaderRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|\bnew\s+AbortController\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
const directCreateSettingsHeaderRuntimeAmbientFallbackPattern =
    /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b/u;
const directCreateFieldTogglesSectionRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|dispatchEvent|querySelectorAll)\b|\bnew\s+(?:AbortController|CustomEvent)\b|\binstanceof\s+HTMLInputElement\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directCreateFieldTogglesSectionRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|CustomEvent|HTMLInputElement|clearTimeout|dispatchEvent|document|setTimeout)\b|\bscope:\s*CreateFieldTogglesSectionRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultCreateFieldTogglesSectionRuntimeScope:\s*CreateFieldTogglesSectionRuntimeScope\s*=\s*globalThis\b/u;
const directCreateInlineZoneColorSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|dispatchEvent)\b|\bnew\s+(?:AbortController|CustomEvent)\b|\binstanceof\s+(?:HTMLElement|HTMLInputElement|HTMLSelectElement)\b|(?:^|[^\w.])(?:setTimeout|clearTimeout)\(/u;
const directCreateInlineZoneColorSelectorRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|CustomEvent|HTMLElement|HTMLInputElement|HTMLSelectElement|dispatchEvent|document|setTimeout)\b|\bscope:\s*CreateInlineZoneColorSelectorRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultCreateInlineZoneColorSelectorRuntimeScope:\s*CreateInlineZoneColorSelectorRuntimeScope\s*=\s*globalThis\b/u;
const directOpenZoneColorPickerRuntimeGlobalPattern =
    /\b(?:globalThis|window)\.dispatchEvent\b|\bnew\s+CustomEvent\b/u;
const directOpenZoneColorPickerRuntimeAmbientFallbackPattern =
    /\bscope\.(?:CustomEvent|dispatchEvent|document)\b|\bscope:\s*OpenZoneColorPickerRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultOpenZoneColorPickerRuntimeScope:\s*OpenZoneColorPickerRuntimeScope\s*=\s*globalThis\b/u;
const directCreatePrintButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS|print)\b|\bnew\s+AbortController\b/u;
const directCopyTableAsCSVRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|execCommand)\b|\bnavigator\.clipboard\b/u;
const directCreateExportGPXButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|createElementNS|setTimeout)\b|\bURL\.(?:createObjectURL|revokeObjectURL)\b|\bnew\s+AbortController\b/u;
const directCreateExportGPXButtonRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|document|setTimeout|URL)\b|\bscope:\s*CreateExportGPXButtonRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultCreateExportGPXButtonRuntimeScope:\s*CreateExportGPXButtonRuntimeScope\s*=\s*globalThis\b/u;
const directCreateAddFitFileToMapButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b|\bnew\s+AbortController\b/u;
const directCreateAddFitFileToMapButtonRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.AbortController\b/u;
const directCreateAddFitFileToMapButtonRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|document)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|document)\b/u;
const directAddExitFullscreenOverlayRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS|exitFullscreen|fullscreenElement)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b/u;
const directAddExitFullscreenOverlayRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.(?:AbortController|HTMLElement)\b/u;
const directAddExitFullscreenOverlayRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|document)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|document)\b/u;
const directRemoveExitFullscreenOverlayRuntimeGlobalPattern =
    /\binstanceof\s+HTMLElement\b/u;
const directRemoveExitFullscreenOverlayRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.HTMLElement\b/u;
const directRemoveExitFullscreenOverlayRuntimeAmbientGetterPattern =
    /\bget\s+document\s*\(\)\s*\{|\breturn\s+globalThis\.document\b/u;
const directCreatePowerEstimationButtonRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.createElement\b|\bnew\s+AbortController\b/u;
const directCreatePowerEstimationButtonRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.AbortController\b/u;
const directCreatePowerEstimationButtonRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|document)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|document)\b/u;
const directOpenPowerEstimationSettingsModalRuntimeGlobalPattern =
    /\bnew\s+AbortController\b/u;
const directCreateMarkerCountSelectorRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b|\bnew\s+(?:AbortController|Event)\(/u;
const directCreateMarkerCountSelectorRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.(?:AbortController|Event)\b/u;
const directCreateMarkerCountSelectorRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|document|Event)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|document|Event)\b/u;
const directCreateDataPointFilterControlRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.createElement\b|\bnew\s+AbortController\b|\btypeof\s+queueMicrotask\b|\bPromise\.resolve\(\)\.then\(/u;
const createDataPointFilterControlTestDirectAsyncGlobalAssignmentPattern =
    /\bglobalThis\.(?:cancelAnimationFrame|queueMicrotask|requestAnimationFrame)\s*=|\bReflect\.deleteProperty\(\s*globalThis\s*,\s*["'](?:cancelAnimationFrame|queueMicrotask|requestAnimationFrame)["']\s*\)/u;
const directCreateHRZoneControlsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directCreatePowerZoneControlsRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directCreatePowerZoneControlsSimpleRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|querySelector)\b|\bnew\s+AbortController\b|\binstanceof\s+HTMLElement\b|\blocalStorage\.(?:getItem|setItem)\b/u;
const directZoneControlsRuntimeAmbientFallbackPattern =
    /\?\?\s*globalThis\.(?:AbortController|localStorage)\b/u;
const directZoneControlsRuntimeAmbientGetterPattern =
    /\bget\s+(?:AbortController|document|HTMLElement|localStorage)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:AbortController|document|HTMLElement|localStorage)\b/u;
const directDataPointFilterElementFactoryRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:createElement|createElementNS)\b/u;
const directDataPointFilterElementFactoryRuntimeAmbientFallbackPattern =
    /\bscope\.document\b|\bscope:\s*DataPointFilterElementFactoryRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultDataPointFilterElementFactoryRuntimeScope:\s*DataPointFilterElementFactoryRuntimeScope\s*=\s*globalThis\b/u;
const directDataPointFilterPanelControllerRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:addEventListener|body|innerHeight|innerWidth)\b|\bnew\s+AbortController\b|\binstanceof\s+Node\b|(?:^|[^\w.])(?:requestAnimationFrame|cancelAnimationFrame)\(/u;
const directDataPointFilterPanelControllerRuntimeAmbientFallbackPattern =
    /\bscope\.(?:AbortController|cancelAnimationFrame|document|Node|requestAnimationFrame|viewport)\b|\bscope:\s*DataPointFilterPanelControllerRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultDataPointFilterPanelControllerRuntimeScope:\s*DataPointFilterPanelControllerRuntimeScope\s*=\s*globalThis\b|\bdocument\?\.defaultView\b|\?\?\s*globalThis\b/u;
const directLoadingOverlayRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|createElement|createElementNS|querySelector)\b/u;
const directLoadingOverlayRuntimeAmbientGetterPattern =
    /\breturn\s+globalThis\.document\b/u;
const directSyncRendererLoadingRuntimeGlobalPattern =
    /\b(?:document|globalThis|window)\.(?:body|querySelector|querySelectorAll)\b|\binstanceof\s+(?:HTMLButtonElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement)\b/u;
const directSyncRendererLoadingRuntimeAmbientFallbackPattern =
    /\bscope:\s*SyncRendererLoadingRuntimeScope\s*=\s*globalThis\b|\bglobalThis\s*\[\s*name\s*\]|\bscope\.(?:document|HTMLButtonElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement)\b|\bscope\.document\?\.defaultView\b/u;

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

    it("keeps preload before-exit tracking off global registries", () => {
        expect.assertions(3);

        const source = stripComments(
            readRepositoryFile("electron-app/preload/beforeExitHandler.ts")
        );

        expect(source).toContain("new WeakMap<");
        expect(source).not.toContain("Symbol.for");
        expect(source).not.toContain("__ffv_preload_beforeExitRegistry__");
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
        expect.assertions(7);

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
        expect(sharedPreloadApiSource).toContain(
            "export type ElectronGyazoExternalApi"
        );
        expect(sharedPreloadApiSource).toContain(
            "export type ElectronShellExternalApi"
        );
        expect(sharedPreloadApiSource).toContain(
            "export type ElectronDialogApi"
        );
    });

    it("keeps preload shell and Gyazo external APIs split in external assembly", () => {
        expect.assertions(19);

        const apiAssemblySource = stripComments(
            readRepositoryFile("electron-app/preload/apiAssembly.ts")
        );
        const externalApiDomainSource = stripComments(
            readRepositoryFile("electron-app/preload/externalApiDomain.ts")
        );
        const electronApiFactorySource = stripComments(
            readRepositoryFile("electron-app/preload/electronApiFactory.ts")
        );
        const electronApiDomainsSource = stripComments(
            readRepositoryFile("electron-app/preload/electronApiDomains.ts")
        );
        const moduleTypesSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleTypes.ts")
        );

        expect(hasRepositoryFile("electron-app/preload/appApiDomain.ts")).toBe(
            false
        );
        expect(hasRepositoryFile("electron-app/preload/externalApi.ts")).toBe(
            false
        );
        expect(apiAssemblySource).toContain("createPreloadExternalApiDomain");
        expect(apiAssemblySource).toContain("createPreloadClipboardApiDomain");
        expect(apiAssemblySource).not.toContain("require(");
        expect(externalApiDomainSource).toContain("createGyazoExternalApi");
        expect(externalApiDomainSource).toContain("createShellExternalApi");
        expect(externalApiDomainSource).not.toContain("createExternalApi");
        expect(electronApiFactorySource).toContain("gyazoExternalApi");
        expect(electronApiFactorySource).toContain("shellExternalApi");
        expect(electronApiFactorySource).toContain("electronApiDomains.js");
        expect(electronApiFactorySource).not.toContain(
            "function createElectronApiExternalDomain"
        );
        expect(electronApiDomainsSource).toContain(
            "createElectronApiExternalDomain"
        );
        expect(electronApiDomainsSource).toContain(
            "createElectronApiFileDomain"
        );
        expect(electronApiDomainsSource).toContain(
            "createElectronApiMenuDomain"
        );
        expect(electronApiDomainsSource).toContain(
            "createElectronApiStateDomain"
        );
        expect(electronApiDomainsSource).toContain(
            "export interface ElectronApiFactoryOptions"
        );
        expect(moduleTypesSource).toContain("ElectronShellExternalApi");
        expect(moduleTypesSource).toContain("createPreloadApiAssemblyContext");
    });

    it("keeps preload API assembly domains on named source exports", () => {
        const assemblyDomainExports = [
            [
                "electron-app/preload/clipboardApiDomain.ts",
                "createPreloadClipboardApiDomain",
            ],
            [
                "electron-app/preload/developerApiDomain.ts",
                "createPreloadDeveloperApiDomain",
            ],
            [
                "electron-app/preload/diagnosticsApiDomain.ts",
                "createPreloadDiagnosticsApiDomain",
            ],
            [
                "electron-app/preload/externalApiDomain.ts",
                "createPreloadExternalApiDomain",
            ],
            [
                "electron-app/preload/fileApiDomain.ts",
                "createPreloadFileApiDomain",
            ],
            [
                "electron-app/preload/stateApiDomain.ts",
                "createPreloadStateApiDomain",
            ],
            [
                "electron-app/preload/systemApiDomain.ts",
                "createPreloadSystemApiDomain",
            ],
        ] as const;

        expect.assertions(assemblyDomainExports.length * 2);

        for (const [filePath, exportName] of assemblyDomainExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export function ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload app API leaf factories on named source exports", () => {
        const appApiFactoryExports = [
            ["electron-app/preload/apiDiagnostics.ts", "createApiDiagnostics"],
            ["electron-app/preload/appInfoApi.ts", "createAppInfoApi"],
            [
                "electron-app/preload/clipboardBridge.ts",
                "createClipboardBridge",
            ],
            ["electron-app/preload/fileApi.ts", "createFileApi"],
            ["electron-app/preload/fitBrowserApi.ts", "createFitBrowserApi"],
            [
                "electron-app/preload/gyazoExternalApi.ts",
                "createGyazoExternalApi",
            ],
            [
                "electron-app/preload/shellExternalApi.ts",
                "createShellExternalApi",
            ],
            ["electron-app/preload/mainStateApi.ts", "createMainStateApi"],
            [
                "electron-app/preload/mainStateBridge.ts",
                "createMainStateBridge",
            ],
            ["electron-app/preload/themeApi.ts", "createThemeApi"],
        ] as const;

        expect.assertions(appApiFactoryExports.length * 2);

        for (const [filePath, exportName] of appApiFactoryExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export function ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload runtime utility helpers on named source exports", () => {
        const runtimeUtilityExports = [
            [
                "electron-app/preload/devtoolsMenuApi.ts",
                "createDevtoolsMenuApi",
            ],
            ["electron-app/preload/environment.ts", "isPreloadDevelopmentMode"],
            ["electron-app/preload/environment.ts", "isPreloadElectronRuntime"],
            ["electron-app/preload/ipcHelpers.ts", "createPreloadIpcHelpers"],
            [
                "electron-app/preload/environment.ts",
                "shouldEnforceGenericIpcAllowlist",
            ],
            ["electron-app/preload/logger.ts", "createPreloadLogger"],
            [
                "electron-app/preload/preloadRuntimeEnvironment.ts",
                "getDefaultPreloadRuntimeEnvironment",
            ],
            ["electron-app/preload/validators.ts", "createPreloadValidators"],
        ] as const;

        expect.assertions(runtimeUtilityExports.length * 2);

        for (const [filePath, exportName] of runtimeUtilityExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export function ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload event API factories on named source exports", () => {
        const eventApiFactoryExports = [
            [
                "electron-app/preload/ipcEventApiDomain.ts",
                "createPreloadIpcEventApiDomain",
            ],
            ["electron-app/preload/menuEventApi.ts", "createMenuEventApi"],
            [
                "electron-app/preload/preloadEventApi.ts",
                "createPreloadEventApi",
            ],
        ] as const;

        expect.assertions(eventApiFactoryExports.length * 2);

        for (const [filePath, exportName] of eventApiFactoryExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export function ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload catalog and assembly context helpers on named source exports", () => {
        const supportExports = [
            [
                "electron-app/preload/apiAssemblyContext.ts",
                "createPreloadApiAssemblyContext",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiAppInfoDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiClipboardDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiDeveloperDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiDiagnosticsDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiExternalDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiFileDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiMenuDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiDomains.ts",
                "createElectronApiStateDomain",
                "function",
            ],
            [
                "electron-app/preload/electronApiFactory.ts",
                "createElectronApi",
                "function",
            ],
            [
                "electron-app/preload/electronBridge.ts",
                "resolvePreloadElectronBridge",
                "function",
            ],
            [
                "electron-app/preload/beforeExitHandler.ts",
                "registerPreloadBeforeExitHandler",
                "function",
            ],
            [
                "electron-app/preload/developmentToolsGlobal.ts",
                "DEVELOPMENT_TOOLS_GLOBAL_NAME",
                "const",
            ],
            [
                "electron-app/preload/developmentToolsGlobal.ts",
                "exposeDevelopmentToolsGlobal",
                "function",
            ],
            [
                "electron-app/preload/electronApiExposure.ts",
                "exposeElectronApi",
                "function",
            ],
            [
                "electron-app/preload/electronApiExposure.ts",
                "getApiStructure",
                "function",
            ],
            [
                "electron-app/preload/ipcBridgeCatalog.ts",
                "PRELOAD_CHANNELS",
                "const",
            ],
            [
                "electron-app/preload/ipcBridgeCatalog.ts",
                "PRELOAD_EVENTS",
                "const",
            ],
            [
                "electron-app/preload/ipcBridgeCatalog.ts",
                "isAllowedUpdateEventName",
                "function",
            ],
        ] as const;

        expect.assertions(supportExports.length * 2);

        for (const [
            filePath,
            exportName,
            exportKind,
        ] of supportExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export ${exportKind} ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload runtime loaders on named source exports", () => {
        const loaderExports = [
            [
                "electron-app/preload/apiAssembly.ts",
                "assemblePreloadApi",
                "const",
            ],
            [
                "electron-app/preload/apiAssembly.ts",
                "createPreloadConstants",
                "function",
            ],
            [
                "electron-app/preload/preloadApiAssemblyModuleLoader.ts",
                "loadPreloadApiAssemblyModules",
                "function",
            ],
            [
                "electron-app/preload/preloadAppModuleLoader.ts",
                "loadPreloadAppModules",
                "function",
            ],
            [
                "electron-app/preload/preloadBootstrap.ts",
                "startPreloadScript",
                "function",
            ],
            [
                "electron-app/preload/preloadFileModuleLoader.ts",
                "loadPreloadFileModules",
                "function",
            ],
            [
                "electron-app/preload/preloadIpcModuleLoader.ts",
                "loadPreloadIpcModules",
                "function",
            ],
            [
                "electron-app/preload/preloadModuleLoader.ts",
                "loadPreloadModules",
                "function",
            ],
            [
                "electron-app/preload/preloadPolicyModuleLoader.ts",
                "loadPreloadPolicyModules",
                "function",
            ],
            [
                "electron-app/preload/preloadRuntime.ts",
                "createPreloadRuntime",
                "function",
            ],
            [
                "electron-app/preload/preloadStateModuleLoader.ts",
                "loadPreloadStateModules",
                "function",
            ],
        ] as const;

        expect.assertions(loaderExports.length * 2);

        for (const [
            filePath,
            exportName,
            exportKind,
        ] of loaderExports) {
            const source = stripComments(readRepositoryFile(filePath));

            expect(source).toContain(`export ${exportKind} ${exportName}`);
            expect(source).not.toContain("module.exports");
        }
    });

    it("keeps preload TypeScript source free of source-level CommonJS exports", () => {
        expect.assertions(1);

        const preloadCommonJsExportFiles = collectSourceFiles(
            "electron-app/preload"
        ).filter((relativeFile) =>
            stripComments(readRepositoryFile(relativeFile)).includes(
                "module.exports"
            )
        );

        expect(preloadCommonJsExportFiles).toStrictEqual([]);
    });

    it("keeps shared TypeScript source free of source-level CommonJS exports", () => {
        expect.assertions(1);

        const sharedCommonJsExportFiles = collectSourceFiles(
            "electron-app/shared"
        ).filter((relativeFile) =>
            stripComments(readRepositoryFile(relativeFile)).includes(
                "module.exports"
            )
        );

        expect(sharedCommonJsExportFiles).toStrictEqual([]);
    });

    it("keeps the FIT parser source and facade free of source-level CommonJS exports", () => {
        expect.assertions(3);

        const parserSource = stripComments(
            readRepositoryFile("electron-app/fitParser.ts")
        );
        const parserFacadeSource = stripComments(
            readRepositoryFile("electron-app/main/runtime/fitParserFacade.ts")
        );

        expect(parserSource).not.toContain("module.exports");
        expect(parserFacadeSource).not.toContain("module.exports");
        expect(parserFacadeSource).not.toContain('require("../../fitParser")');
    });

    it("keeps migrated main state source modules off source-level CommonJS exports", () => {
        expect.assertions(13);

        const appStateSource = stripComments(
            readRepositoryFile("electron-app/main/state/appState.ts")
        );
        const constantsSource = stripComments(
            readRepositoryFile("electron-app/main/constants.ts")
        );
        const gyazoStartupTimerSource = stripComments(
            readRepositoryFile(
                "electron-app/main/app/gyazoStartupTimerState.ts"
            )
        );
        const primeTestEnvironmentSource = stripComments(
            readRepositoryFile(
                "electron-app/main/runtime/primeTestEnvironment.ts"
            )
        );
        const stateIntegrationBarrelSource = stripComments(
            readRepositoryFile("electron-app/utils/state/integration/index.ts")
        );
        const appEventHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/app/setupApplicationEventHandlers.ts"
            )
        );

        expect(appStateSource).not.toContain("module.exports");
        expect(appStateSource).not.toContain(
            'require("../../utils/state/integration/mainProcessStateManager")'
        );
        expect(constantsSource).not.toContain("module.exports");
        expect(gyazoStartupTimerSource).not.toContain("module.exports");
        expect(primeTestEnvironmentSource).not.toContain("module.exports");
        expect(primeTestEnvironmentSource).not.toContain(
            'require("../state/appState")'
        );
        expect(stateIntegrationBarrelSource).not.toContain("module.exports");
        expect(stateIntegrationBarrelSource).not.toContain(
            'require("./mainProcessStateManager.js")'
        );
        expect(appEventHandlersSource).not.toContain("module.exports");
        expect(appEventHandlersSource).not.toContain('require("../constants")');
        expect(appEventHandlersSource).not.toContain(
            'require("../state/appState")'
        );
        expect(appEventHandlersSource).not.toContain(
            'require("./gyazoStartupTimerState")'
        );
        expect(appEventHandlersSource).toContain("startGyazoOAuthServer");
    });

    it("keeps migrated main IPC payload and policy modules off source-level CommonJS exports", () => {
        expect.assertions(49);

        const fileReadPayloadSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/fileReadPayload.ts")
        );
        const fitIpcPayloadSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/fitIpcPayload.ts")
        );
        const fileAccessPolicySource = stripComments(
            readRepositoryFile("electron-app/main/security/fileAccessPolicy.ts")
        );
        const fileAccessPolicyStateSource = stripComments(
            readRepositoryFile(
                "electron-app/main/security/fileAccessPolicyState.ts"
            )
        );
        const registerFileSystemHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerFileSystemHandlers.ts"
            )
        );
        const registerFitFileHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerFitFileHandlers.ts"
            )
        );
        const registerBrowserHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerBrowserHandlers.ts"
            )
        );
        const registerDialogHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerDialogHandlers.ts"
            )
        );
        const registerRecentFileHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerRecentFileHandlers.ts"
            )
        );
        const setupIpcHandlersSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/setupIPCHandlers.ts")
        );
        const ipcRegistrySource = stripComments(
            readRepositoryFile("electron-app/main/ipc/ipcRegistry.ts")
        );
        const ipcSenderPolicySource = stripComments(
            readRepositoryFile("electron-app/main/security/ipcSenderPolicy.ts")
        );
        const mainProcessStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/mainProcessStateManager.ts"
            )
        );
        const registerClipboardHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerClipboardHandlers.ts"
            )
        );
        const registerExternalHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerExternalHandlers.ts"
            )
        );
        const registerInfoHandlersSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/registerInfoHandlers.ts")
        );

        expect(fileReadPayloadSource).not.toContain("module.exports");
        expect(fitIpcPayloadSource).not.toContain("module.exports");
        expect(fileAccessPolicySource).not.toContain("module.exports");
        expect(fileAccessPolicyStateSource).not.toContain("module.exports");
        expect(fileAccessPolicySource).not.toContain(
            'require("./fileAccessPolicyState")'
        );
        expect(registerFileSystemHandlersSource).not.toContain(
            'require("./fileReadPayload")'
        );
        expect(registerFileSystemHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(registerFitFileHandlersSource).not.toContain(
            'require("./fitIpcPayload")'
        );
        expect(registerFileSystemHandlersSource).not.toContain(
            "module.exports"
        );
        expect(registerFileSystemHandlersSource).not.toContain(
            'require("zod")'
        );
        expect(registerFileSystemHandlersSource).toContain(
            'import { z } from "zod"'
        );
        expect(registerFitFileHandlersSource).not.toContain("module.exports");
        expect(registerBrowserHandlersSource).not.toContain("module.exports");
        expect(registerDialogHandlersSource).not.toContain("module.exports");
        expect(registerRecentFileHandlersSource).not.toContain(
            "module.exports"
        );
        expect(registerClipboardHandlersSource).not.toContain("module.exports");
        expect(registerExternalHandlersSource).not.toContain("module.exports");
        expect(registerClipboardHandlersSource).not.toContain('require("zod")');
        expect(registerExternalHandlersSource).not.toContain('require("zod")');
        expect(registerClipboardHandlersSource).toContain(
            'import { z } from "zod"'
        );
        expect(registerExternalHandlersSource).toContain(
            'import { z } from "zod"'
        );
        expect(registerInfoHandlersSource).not.toContain("module.exports");
        expect(ipcRegistrySource).not.toContain("module.exports");
        expect(ipcSenderPolicySource).not.toContain("module.exports");
        expect(ipcRegistrySource).not.toContain(
            'require("../security/ipcSenderPolicy")'
        );
        expect(registerBrowserHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(registerDialogHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(registerRecentFileHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerBrowserHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerDialogHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerFileSystemHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerFitFileHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerRecentFileHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerClipboardHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerExternalHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./registerInfoHandlers")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("./ipcRegistry")'
        );
        expect(mainProcessStateManagerSource).not.toContain(
            'require("../../../main/ipc/ipcRegistry")'
        );
        expect(fileReadPayloadSource).toContain("export function");
        expect(fitIpcPayloadSource).toContain("export function");
        expect(fileAccessPolicySource).toContain("export function");
        expect(fileAccessPolicyStateSource).toContain("export function");
        expect(registerClipboardHandlersSource).toContain("export function");
        expect(registerExternalHandlersSource).toContain("export function");
        expect(registerInfoHandlersSource).toContain("export function");
        expect(ipcRegistrySource).toContain("export function");
        expect(ipcSenderPolicySource).toContain("export function");
        expect(mainProcessStateManagerSource).toContain(
            "registerGenericIpcHandle"
        );
    });

    it("keeps main-process state-manager timing behind the runtime adapter", () => {
        expect.assertions(17);

        const mainProcessStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/mainProcessStateManager.ts"
            )
        );
        const mainProcessStateRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/mainProcessStateRuntime.ts"
            )
        );
        const directMainProcessStateManagerTimingGlobalPattern =
            /\b(?:globalThis|window)\.(?:clearTimeout|performance|setTimeout)\b|\bperformance\.now\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(/u;
        const directMainProcessStateRuntimeAmbientTimerFallbackPattern =
            /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
        const directMainProcessStateRuntimeAmbientGetterPattern =
            /\bget\s+(?:clearTimeout|performance|setTimeout)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:clearTimeout|performance|setTimeout)\b/u;

        expect(mainProcessStateManagerSource).toContain(
            "mainProcessStateRuntime.js"
        );
        expect(mainProcessStateManagerSource).not.toContain(
            "globalThis.performance"
        );
        expect(mainProcessStateManagerSource).not.toContain("performance.now");
        expect(mainProcessStateManagerSource).toContain("monotonicNowMs");
        expect(mainProcessStateManagerSource).toContain("setTimeout");
        expect(
            directMainProcessStateManagerTimingGlobalPattern.test(
                mainProcessStateManagerSource
            )
        ).toBe(false);
        expect(mainProcessStateRuntimeSource).not.toMatch(
            directMainProcessStateRuntimeAmbientTimerFallbackPattern
        );
        expect(mainProcessStateRuntimeSource).not.toMatch(
            directRuntimeAmbientClockFallbackPattern
        );
        expect(mainProcessStateRuntimeSource).not.toMatch(
            directMainProcessStateRuntimeAmbientGetterPattern
        );
        expect(mainProcessStateRuntimeSource).toContain(
            "mainProcessStateRuntime requires setTimeout"
        );
        expect(mainProcessStateRuntimeSource).toContain(
            "mainProcessStateRuntime requires a clock"
        );
        expect(mainProcessStateRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mainProcessStateRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(mainProcessStateRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(mainProcessStateRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(mainProcessStateRuntimeSource).not.toContain(
            "scope.performance"
        );
        expect(mainProcessStateRuntimeSource).not.toContain("scope.setTimeout");
    });

    it("keeps migrated main runtime helpers off source-level CommonJS exports", () => {
        expect.assertions(183);

        const mainSource = stripComments(
            readRepositoryFile("electron-app/main.ts")
        );
        const logWithContextSource = stripComments(
            readRepositoryFile("electron-app/main/logging/logWithContext.ts")
        );
        const safeCreateAppMenuSource = stripComments(
            readRepositoryFile("electron-app/main/menu/safeCreateAppMenu.ts")
        );
        const setupBlockedRequestsSource = stripComments(
            readRepositoryFile(
                "electron-app/main/security/setupBlockedRequests.ts"
            )
        );
        const electronAccessSource = stripComments(
            readRepositoryFile("electron-app/main/runtime/electronAccess.ts")
        );
        const appStateSource = stripComments(
            readRepositoryFile("electron-app/main/state/appState.ts")
        );
        const sendToRendererSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/sendToRenderer.ts")
        );
        const windowValidationSource = stripComments(
            readRepositoryFile("electron-app/main/window/windowValidation.ts")
        );
        const exposeDevHelpersSource = stripComments(
            readRepositoryFile("electron-app/main/dev/exposeDevHelpers.ts")
        );
        const getThemeFromRendererSource = stripComments(
            readRepositoryFile(
                "electron-app/main/theme/getThemeFromRenderer.ts"
            )
        );
        const setupAutoUpdaterSource = stripComments(
            readRepositoryFile("electron-app/main/updater/setupAutoUpdater.ts")
        );
        const autoUpdaterAccessSource = stripComments(
            readRepositoryFile("electron-app/main/updater/autoUpdaterAccess.ts")
        );
        const nodeModulesSource = stripComments(
            readRepositoryFile("electron-app/main/runtime/nodeModules.ts")
        );
        const electronConfAccessSource = stripComments(
            readRepositoryFile(
                "electron-app/main/runtime/electronConfAccess.ts"
            )
        );
        const fitParserIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/main/runtime/fitParserIntegration.ts"
            )
        );
        const initializeApplicationSource = stripComments(
            readRepositoryFile(
                "electron-app/main/runtime/initializeApplication.ts"
            )
        );
        const bootstrapMainWindowSource = stripComments(
            readRepositoryFile(
                "electron-app/main/window/bootstrapMainWindow.ts"
            )
        );
        const initializeMainWindowSource = stripComments(
            readRepositoryFile(
                "electron-app/main/window/initializeMainWindow.ts"
            )
        );
        const windowStateUtilsSource = stripComments(
            readRepositoryFile("electron-app/windowStateUtils.ts")
        );
        const setupApplicationEventHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/app/setupApplicationEventHandlers.ts"
            )
        );
        const setupMenuAndEventHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/menu/setupMenuAndEventHandlers.ts"
            )
        );
        const setupIpcHandlersSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/setupIPCHandlers.ts")
        );
        const registerBrowserHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/main/ipc/registerBrowserHandlers.ts"
            )
        );
        const registerInfoHandlersSource = stripComments(
            readRepositoryFile("electron-app/main/ipc/registerInfoHandlers.ts")
        );
        const gyazoOAuthServerSource = stripComments(
            readRepositoryFile("electron-app/main/oauth/gyazoOAuthServer.ts")
        );
        const fileAccessPolicySource = stripComments(
            readRepositoryFile("electron-app/main/security/fileAccessPolicy.ts")
        );
        const ipcSenderPolicySource = stripComments(
            readRepositoryFile("electron-app/main/security/ipcSenderPolicy.ts")
        );
        const setupMainLifecycleSource = stripComments(
            readRepositoryFile(
                "electron-app/main/runtime/setupMainLifecycle.ts"
            )
        );
        const createAppMenuSource = stripComments(
            readRepositoryFile("electron-app/utils/app/menu/createAppMenu.ts")
        );
        const createAppMenuIndexSource = stripComments(
            readRepositoryFile("electron-app/utils/app/menu/index.ts")
        );
        const recentFilesSource = stripComments(
            readRepositoryFile("electron-app/utils/files/recent/recentFiles.ts")
        );
        const masterStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/masterStateManager.ts"
            )
        );
        const mainProcessStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/mainProcessStateManager.ts"
            )
        );

        expect(mainSource).not.toContain("module.exports");
        expect(mainSource).not.toContain("mainRequire");
        expect(mainSource).not.toContain("require(");
        expect(logWithContextSource).not.toContain("module.exports");
        expect(safeCreateAppMenuSource).not.toContain("module.exports");
        expect(createAppMenuSource).not.toContain(
            'Reflect.get(globalThis, "process")'
        );
        expect(mainProcessStateManagerSource).not.toContain(
            'Reflect.get(globalThis, "process")'
        );
        expect(createAppMenuSource).toContain("getProcessEnvironmentValue");
        expect(mainProcessStateManagerSource).toContain(
            "getProcessEnvironmentValue"
        );
        expect(mainProcessStateManagerSource).toContain(
            "../../runtime/processEnvironment.js"
        );
        expect(logWithContextSource).not.toContain("globalThis.process");
        expect(safeCreateAppMenuSource).not.toContain("globalThis.process");
        expect(windowStateUtilsSource).not.toContain("globalThis.process");
        expect(windowStateUtilsSource).not.toContain(
            'Reflect.get(globalThis, "process")'
        );
        expect(logWithContextSource).toContain("getProcessEnvironmentValue");
        expect(safeCreateAppMenuSource).toContain("getProcessEnvironmentValue");
        expect(windowStateUtilsSource).toContain("getProcessEnvironmentValue");
        expect(logWithContextSource).toContain(
            "../../utils/runtime/processEnvironment.js"
        );
        expect(safeCreateAppMenuSource).toContain(
            "../../utils/runtime/processEnvironment.js"
        );
        expect(setupBlockedRequestsSource).not.toContain("module.exports");
        expect(electronAccessSource).not.toContain("module.exports");
        expect(electronAccessSource).not.toContain("export default");
        expect(sendToRendererSource).not.toContain("module.exports");
        expect(windowValidationSource).not.toContain("module.exports");
        expect(getThemeFromRendererSource).not.toContain("module.exports");
        expect(setupAutoUpdaterSource).not.toContain("module.exports");
        expect(autoUpdaterAccessSource).not.toContain("module.exports");
        expect(autoUpdaterAccessSource).not.toContain("export default");
        expect(nodeModulesSource).not.toContain("module.exports");
        expect(nodeModulesSource).not.toContain("export default");
        expect(nodeModulesSource).toContain(
            'import * as fsModule from "node:fs"'
        );
        expect(nodeModulesSource).toContain(
            'import * as httpModule from "node:http"'
        );
        expect(nodeModulesSource).toContain(
            'import * as pathModule from "node:path"'
        );
        expect(nodeModulesSource).not.toContain(
            'loadNodeModule<FileSystemModule>("node:fs")'
        );
        expect(nodeModulesSource).not.toContain(
            'loadNodeModule<FileSystemModule>("fs")'
        );
        expect(nodeModulesSource).not.toContain(
            'loadNodeModule<HttpModule>("http")'
        );
        expect(nodeModulesSource).not.toContain(
            'loadNodeModule<HttpModule>("node:http")'
        );
        expect(electronConfAccessSource).not.toContain("module.exports");
        expect(electronConfAccessSource).not.toContain("export default");
        expect(electronAccessSource).toContain(
            'import * as electronModule from "electron"'
        );
        expect(electronAccessSource).not.toContain('require("electron")');
        expect(electronAccessSource).not.toContain(
            'loadNodeModule("electron")'
        );
        expect(autoUpdaterAccessSource).not.toContain(
            'require("electron-updater")'
        );
        expect(autoUpdaterAccessSource).not.toContain(
            'loadNodeModule("electron-updater")'
        );
        expect(autoUpdaterAccessSource).toContain(
            'await import("electron-updater")'
        );
        expect(initializeApplicationSource).not.toContain("module.exports");
        expect(setupIpcHandlersSource).not.toContain("module.exports");
        expect(gyazoOAuthServerSource).not.toContain("module.exports");
        expect(setupMainLifecycleSource).not.toContain("module.exports");
        expect(exposeDevHelpersSource).not.toContain("module.exports");
        expect(bootstrapMainWindowSource).not.toContain("module.exports");
        expect(initializeMainWindowSource).not.toContain("module.exports");
        expect(fitParserIntegrationSource).not.toContain("module.exports");
        expect(mainProcessStateManagerSource).not.toContain("module.exports");
        expect(masterStateManagerSource).not.toContain("module.exports");
        expect(masterStateManagerSource).not.toContain(
            'require("node:module")'
        );
        expect(masterStateManagerSource).not.toContain("getCjsRequire");
        expect(masterStateManagerSource).not.toContain("getNodeModuleCache");
        expect(masterStateManagerSource).not.toContain("require.cache");
        expect(masterStateManagerSource).not.toContain(
            "getModuleExportsFromCache"
        );
        expect(masterStateManagerSource).toContain(
            "getModuleExportsFromOverride"
        );
        expect(setupMenuAndEventHandlersSource).not.toContain("module.exports");
        expect(windowStateUtilsSource).not.toContain("module.exports");
        expect(createAppMenuSource).not.toContain("module.exports");
        expect(createAppMenuIndexSource).not.toContain("require(");
        expect(recentFilesSource).not.toContain("module.exports");
        expect(recentFilesSource).not.toContain("require(");
        expect(windowValidationSource).not.toContain(
            'require("../state/appState")'
        );
        expect(windowValidationSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(safeCreateAppMenuSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(setupAutoUpdaterSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(sendToRendererSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(exposeDevHelpersSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(exposeDevHelpersSource).not.toContain(
            'require("../state/appState")'
        );
        expect(getThemeFromRendererSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(setupAutoUpdaterSource).not.toContain(
            'require("../ipc/sendToRenderer")'
        );
        expect(setupAutoUpdaterSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(setupAutoUpdaterSource).not.toContain(
            'require("../runtime/electronAccess")'
        );
        expect(setupAutoUpdaterSource).not.toContain(
            'require("./autoUpdaterAccess")'
        );
        expect(setupAutoUpdaterSource).not.toContain('require("electron-log")');
        expect(setupAutoUpdaterSource).toContain(
            'import electronLog from "electron-log"'
        );
        expect(electronConfAccessSource).not.toContain(
            'loadNodeModule<ElectronConfModuleLike<TStore>>("electron-conf")'
        );
        expect(appStateSource).not.toContain('require("electron-conf")');
        expect(fitParserIntegrationSource).not.toContain(
            'require("electron-conf")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("electron-conf")'
        );
        expect(createAppMenuSource).not.toContain('require("electron-conf")');
        expect(registerBrowserHandlersSource).not.toContain(
            'require("electron-conf")'
        );
        expect(registerInfoHandlersSource).not.toContain(
            'require("electron-conf")'
        );
        expect(appStateSource).toContain("createElectronConf");
        expect(fitParserIntegrationSource).toContain("createElectronConf");
        expect(setupMenuAndEventHandlersSource).toContain("createElectronConf");
        expect(createAppMenuSource).toContain("createElectronConf");
        expect(initializeApplicationSource).not.toContain(
            'require("../constants")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../state/appState")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../ipc/sendToRenderer")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../theme/getThemeFromRenderer")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../updater/setupAutoUpdater")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../updater/autoUpdaterAccess")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../menu/safeCreateAppMenu")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../runtime/electronAccess")'
        );
        expect(initializeApplicationSource).not.toContain(
            'require("../window/bootstrapMainWindow")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../ipc/sendToRenderer")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../updater/autoUpdaterAccess")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../constants")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../ipc/ipcRegistry")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../security/fileAccessPolicy")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("../state/appState")'
        );
        expect(setupMenuAndEventHandlersSource).not.toContain(
            'require("./safeCreateAppMenu")'
        );
        expect(gyazoOAuthServerSource).not.toContain(
            'require("../ipc/sendToRenderer")'
        );
        expect(gyazoOAuthServerSource).not.toContain(
            'require("../state/appState")'
        );
        expect(gyazoOAuthServerSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(gyazoOAuthServerSource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(fileAccessPolicySource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(ipcSenderPolicySource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(ipcSenderPolicySource).not.toContain('require("node:url")');
        expect(setupIpcHandlersSource).not.toContain('require("../constants")');
        expect(setupIpcHandlersSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../menu/safeCreateAppMenu")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../oauth/gyazoOAuthServer")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../runtime/electronAccess")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../state/appState")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../theme/getThemeFromRenderer")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../runtime/fitParserIntegration")'
        );
        expect(setupIpcHandlersSource).not.toContain(
            'require("../../utils/files/recent/recentFiles")'
        );
        expect(fitParserIntegrationSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(fitParserIntegrationSource).not.toContain(
            'require("../constants")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../runtime/nodeModules")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../logging/logWithContext")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../menu/safeCreateAppMenu")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../oauth/gyazoOAuthServer")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../theme/getThemeFromRenderer")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../window/windowValidation")'
        );
        expect(setupApplicationEventHandlersSource).not.toContain(
            'require("../../windowStateUtils")'
        );
        expect(bootstrapMainWindowSource).not.toContain(
            'require("../../windowStateUtils")'
        );
        expect(initializeMainWindowSource).not.toContain(
            'require("../windowStateUtils")'
        );
        expect(initializeMainWindowSource).not.toContain(
            'require("../../windowStateUtils")'
        );
        expect(setupBlockedRequestsSource).not.toContain(
            'require("../runtime/electronAccess")'
        );
        expect(setupMainLifecycleSource).not.toContain(
            'require("../security/setupBlockedRequests")'
        );
        expect(createAppMenuSource).not.toContain(
            'require("../../../main/runtime/electronAccess")'
        );
        expect(createAppMenuSource).not.toContain(
            'require("../../../utils/files/recent/recentFiles")'
        );
        expect(createAppMenuSource).not.toContain(
            'require("../../../main/security/fileAccessPolicy")'
        );
        expect(safeCreateAppMenuSource).not.toContain(
            'require("../../utils/app/menu/createAppMenu")'
        );
        expect(mainProcessStateManagerSource).not.toContain(
            'require("../../../main/runtime/electronAccess")'
        );
        expect(logWithContextSource).toContain(
            "export function logWithContext"
        );
        expect(safeCreateAppMenuSource).toContain(
            "export function safeCreateAppMenu"
        );
        expect(setupBlockedRequestsSource).toContain(
            "export function setupBlockedRequests"
        );
        expect(electronAccessSource).toContain("export function getElectron");
        expect(sendToRendererSource).toContain(
            "export function sendToRenderer"
        );
        expect(windowValidationSource).toContain(
            "export function isWindowUsable"
        );
        expect(windowValidationSource).toContain(
            "export function validateWindow"
        );
        expect(getThemeFromRendererSource).toContain(
            "export async function getThemeFromRenderer"
        );
        expect(setupAutoUpdaterSource).toContain(
            "export function setupAutoUpdater"
        );
        expect(autoUpdaterAccessSource).toContain(
            "export async function resolveAutoUpdaterAsync"
        );
        expect(autoUpdaterAccessSource).not.toContain(
            "export function resolveAutoUpdaterSync"
        );
        expect(nodeModulesSource).toContain("export const path");
        expect(nodeModulesSource).toContain("export const fs");
        expect(nodeModulesSource).toContain("export function httpRef");
        expect(nodeModulesSource).not.toContain(
            "export function loadNodeModule"
        );
        expect(electronConfAccessSource).toContain(
            "export function createElectronConf"
        );
        expect(mainSource).not.toContain("defaultExport");
        expect(mainSource).not.toContain("export default");
        expect(initializeApplicationSource).toContain(
            "export async function initializeApplication"
        );
        expect(bootstrapMainWindowSource).toContain(
            "export function bootstrapMainWindow"
        );
        expect(initializeMainWindowSource).toContain(
            "export function initializeMainWindow"
        );
        expect(windowStateUtilsSource).toContain(
            "export function createWindow"
        );
        expect(windowStateUtilsSource).toContain(
            "export function getWindowState"
        );
        expect(recentFilesSource).toContain("export function loadRecentFiles");
        expect(fitParserIntegrationSource).toContain(
            "export const FIT_PARSER_OPERATION_ID"
        );
        expect(fitParserIntegrationSource).toContain(
            "export function createFitParserStateAdapters"
        );
        expect(fitParserIntegrationSource).toContain(
            "export async function ensureFitParserStateIntegration"
        );
        expect(setupIpcHandlersSource).toContain(
            "export function setupIPCHandlers"
        );
        expect(setupMenuAndEventHandlersSource).toContain(
            "export function setupMenuAndEventHandlers"
        );
        expect(createAppMenuSource).toContain("export function createAppMenu");
        expect(createAppMenuIndexSource).toContain("export { createAppMenu }");
        expect(gyazoOAuthServerSource).toContain(
            "export async function startGyazoOAuthServer"
        );
        expect(gyazoOAuthServerSource).toContain(
            "export async function stopGyazoOAuthServer"
        );
        expect(setupMainLifecycleSource).toContain(
            "export function setupMainLifecycle"
        );
        expect(exposeDevHelpersSource).toContain(
            "export function exposeDevHelpers"
        );
    });

    it("keeps ordinary preload unit tests on native source imports", () => {
        expect.assertions(2);

        const directSourceRequireTestFiles = collectSourceFiles("tests/unit")
            .filter(
                (relativeFile) =>
                    relativeFile !==
                    "tests/unit/packaging/architectureBoundaries.test.ts"
            )
            .filter((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "createPreloadSourceRequire"
                )
            )
            .sort();

        expect(directSourceRequireTestFiles).toStrictEqual([]);

        const commonJsPreloadTestFiles = collectSourceFiles("tests/unit")
            .filter((relativeFile) =>
                /^tests\/unit\/preload.*\.test\.ts$/u.test(relativeFile)
            )
            .filter((relativeFile) =>
                /\b(?:createRequire|preloadSourceRequire)\b/u.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(commonJsPreloadTestFiles).toStrictEqual([]);
    });

    it("keeps the obsolete preload cache-injection debug test deleted", () => {
        expect.assertions(1);

        expect(hasRepositoryFile("tests/unit/preload.debug.test.ts")).toBe(
            false
        );
    });

    it("keeps preload policy unit tests on native source imports", () => {
        expect.assertions(1);

        const policyTestFiles = [
            "tests/unit/preload.devtoolsMenuPolicy.test.ts",
            "tests/unit/preload.fitBrowserPathPolicy.test.ts",
            "tests/unit/preload.fitFilePathPolicy.test.ts",
            "tests/unit/preload.mainStatePathPolicy.test.ts",
        ];
        const commonJsPolicyTestLoads = policyTestFiles
            .filter((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "createRequire"
                )
            )
            .sort();

        expect(commonJsPolicyTestLoads).toStrictEqual([]);
    });

    it("keeps the preload module-mock fixture on native source imports", () => {
        expect.assertions(1);

        const moduleMockSource = stripComments(
            readRepositoryFile("tests/vitest/helpers/preloadModuleMocks.ts")
        );

        expect(moduleMockSource).not.toContain("createPreloadSourceRequire");
    });

    it("keeps preload IPC policy dependencies injected through the module registry", () => {
        expect.assertions(6);

        const devtoolsMenuApiSource = stripComments(
            readRepositoryFile("electron-app/preload/devtoolsMenuApi.ts")
        );
        const ipcHelpersSource = stripComments(
            readRepositoryFile("electron-app/preload/ipcHelpers.ts")
        );
        const policyModuleLoaderSource = stripComments(
            readRepositoryFile(
                "electron-app/preload/preloadPolicyModuleLoader.ts"
            )
        );
        const moduleTypesSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleTypes.ts")
        );

        expect(devtoolsMenuApiSource).not.toContain("require(");
        expect(ipcHelpersSource).not.toContain("require(");
        expect(policyModuleLoaderSource).toContain(
            "../shared/devtoolsMenuPolicy.js"
        );
        expect(policyModuleLoaderSource).toContain(
            "../shared/mainStatePathPolicy.js"
        );
        expect(moduleTypesSource).toContain("validateExternalUrl");
        expect(moduleTypesSource).toContain("validateMainStatePathInput");
    });

    it("keeps preload state leaf modules on native imports", () => {
        expect.assertions(5);

        const stateModuleLoaderSource = stripComments(
            readRepositoryFile(
                "electron-app/preload/preloadStateModuleLoader.ts"
            )
        );
        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );

        expect(stateModuleLoaderSource).toContain(
            'import { createMainStateApi } from "./mainStateApi.js";'
        );
        expect(stateModuleLoaderSource).toContain(
            'import { createMainStateBridge } from "./mainStateBridge.js";'
        );
        expect(stateModuleLoaderSource).not.toContain("requireModule");
        expect(moduleLoaderSource).toContain("loadPreloadStateModules()");
        expect(moduleLoaderSource).not.toContain(
            "loadPreloadStateModules({ requireModule })"
        );
    });

    it("keeps preload file leaf modules on native imports", () => {
        expect.assertions(5);

        const fileModuleLoaderSource = stripComments(
            readRepositoryFile(
                "electron-app/preload/preloadFileModuleLoader.ts"
            )
        );
        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );

        expect(fileModuleLoaderSource).toContain(
            'import { createFileApi } from "./fileApi.js";'
        );
        expect(fileModuleLoaderSource).toContain(
            'import { createFitBrowserApi } from "./fitBrowserApi.js";'
        );
        expect(fileModuleLoaderSource).not.toContain("requireModule");
        expect(moduleLoaderSource).toContain("loadPreloadFileModules()");
        expect(moduleLoaderSource).not.toContain(
            "loadPreloadFileModules({ requireModule })"
        );
    });

    it("keeps preload app leaf modules on native imports", () => {
        expect.assertions(13);

        const appModuleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadAppModuleLoader.ts")
        );
        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );

        expect(appModuleLoaderSource).toContain(
            'import { createApiDiagnostics } from "./apiDiagnostics.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createAppInfoApi } from "./appInfoApi.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { registerPreloadBeforeExitHandler } from "./beforeExitHandler.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createClipboardBridge } from "./clipboardBridge.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createDevtoolsMenuApi } from "./devtoolsMenuApi.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { exposeDevelopmentToolsGlobal } from "./developmentToolsGlobal.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { isPreloadDevelopmentMode } from "./environment.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createGyazoExternalApi } from "./gyazoExternalApi.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createShellExternalApi } from "./shellExternalApi.js";'
        );
        expect(appModuleLoaderSource).toContain(
            'import { createThemeApi } from "./themeApi.js";'
        );
        expect(appModuleLoaderSource).not.toContain("requireModule");
        expect(moduleLoaderSource).toContain("loadPreloadAppModules()");
        expect(moduleLoaderSource).not.toContain(
            "loadPreloadAppModules({ requireModule })"
        );
    });

    it("keeps preload API assembly modules on native imports", () => {
        expect.assertions(12);

        const apiAssemblyModuleLoaderSource = stripComments(
            readRepositoryFile(
                "electron-app/preload/preloadApiAssemblyModuleLoader.ts"
            )
        );
        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );

        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadApiAssemblyContext } from "./apiAssemblyContext.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadClipboardApiDomain } from "./clipboardApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadDeveloperApiDomain } from "./developerApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadDiagnosticsApiDomain } from "./diagnosticsApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadExternalApiDomain } from "./externalApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadFileApiDomain } from "./fileApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadIpcEventApiDomain } from "./ipcEventApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadStateApiDomain } from "./stateApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).toContain(
            'import { createPreloadSystemApiDomain } from "./systemApiDomain.js";'
        );
        expect(apiAssemblyModuleLoaderSource).not.toContain("requireModule");
        expect(moduleLoaderSource).toContain("loadPreloadApiAssemblyModules()");
        expect(moduleLoaderSource).not.toContain(
            "loadPreloadApiAssemblyModules({ requireModule })"
        );
    });

    it("keeps preload IPC modules on native imports", () => {
        expect.assertions(12);

        const ipcModuleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadIpcModuleLoader.ts")
        );
        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );

        expect(ipcModuleLoaderSource).toContain(
            'import { resolvePreloadElectronBridge } from "./electronBridge.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { exposeElectronApi } from "./electronApiExposure.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { shouldEnforceGenericIpcAllowlist } from "./environment.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { createPreloadIpcHelpers } from "./ipcHelpers.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import * as ipcBridgeCatalog from "./ipcBridgeCatalog.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { createPreloadLogger } from "./logger.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { createMenuEventApi } from "./menuEventApi.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { createPreloadEventApi } from "./preloadEventApi.js";'
        );
        expect(ipcModuleLoaderSource).toContain(
            'import { createPreloadValidators } from "./validators.js";'
        );
        expect(ipcModuleLoaderSource).not.toContain("requireModule");
        expect(moduleLoaderSource).toContain("loadPreloadIpcModules()");
        expect(moduleLoaderSource).not.toContain(
            "loadPreloadIpcModules({ requireModule })"
        );
    });

    it("keeps the preload module loader on native loader imports", () => {
        expect.assertions(10);

        const moduleLoaderSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadModuleLoader.ts")
        );
        const runtimeSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadRuntime.ts")
        );

        expect(moduleLoaderSource).toContain(
            'import { loadPreloadApiAssemblyModules } from "./preloadApiAssemblyModuleLoader.js";'
        );
        expect(moduleLoaderSource).toContain(
            'import { loadPreloadAppModules } from "./preloadAppModuleLoader.js";'
        );
        expect(moduleLoaderSource).toContain(
            'import { loadPreloadFileModules } from "./preloadFileModuleLoader.js";'
        );
        expect(moduleLoaderSource).toContain(
            'import { loadPreloadIpcModules } from "./preloadIpcModuleLoader.js";'
        );
        expect(moduleLoaderSource).toContain(
            'import { loadPreloadPolicyModules } from "./preloadPolicyModuleLoader.js";'
        );
        expect(moduleLoaderSource).toContain(
            'import { loadPreloadStateModules } from "./preloadStateModuleLoader.js";'
        );
        expect(moduleLoaderSource).not.toContain("requireModule");
        expect(runtimeSource).toContain("loadPreloadModules()");
        expect(runtimeSource).not.toContain(
            "loadPreloadModules({ requireModule })"
        );
        expect(moduleLoaderSource).not.toContain("./preload/");
    });

    it("keeps the preload runtime on native composition imports", () => {
        expect.assertions(11);

        const runtimeSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadRuntime.ts")
        );

        expect(runtimeSource).toContain(
            'import { assemblePreloadApi, createPreloadConstants } from "./apiAssembly.js";'
        );
        expect(runtimeSource).toContain(
            'import { createElectronApi } from "./electronApiFactory.js";'
        );
        expect(runtimeSource).toContain(
            'import { loadPreloadModules } from "./preloadModuleLoader.js";'
        );
        expect(runtimeSource).toContain("createPreloadRuntime()");
        expect(runtimeSource).toContain("loadPreloadModules()");
        expect(runtimeSource).not.toContain("PreloadModuleRequire");
        expect(runtimeSource).not.toContain("CreatePreloadRuntimeOptions");
        expect(runtimeSource).not.toContain("requireModule");
        expect(runtimeSource).not.toContain(
            "const { loadPreloadModules } = requireModule"
        );
        expect(runtimeSource).not.toContain(
            "const { createElectronApi } = requireModule"
        );
        expect(runtimeSource).not.toContain(
            "const { assemblePreloadApi, createPreloadConstants } = requireModule"
        );
    });

    it("keeps the preload bootstrap on native runtime imports", () => {
        expect.assertions(9);

        const bootstrapSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadBootstrap.ts")
        );

        expect(bootstrapSource).toContain(
            'import { createPreloadRuntime } from "./preloadRuntime.js";'
        );
        expect(bootstrapSource).toContain(
            'import { getDefaultPreloadRuntimeEnvironment } from "./preloadRuntimeEnvironment.js";'
        );
        expect(bootstrapSource).toContain("createPreloadRuntime()");
        expect(bootstrapSource).not.toContain("requireModule");
        expect(bootstrapSource).not.toContain(
            "createPreloadRuntime({ requireModule })"
        );
        expect(bootstrapSource).not.toContain("runtime.requireModule");
        expect(bootstrapSource).not.toContain(
            "const { createPreloadRuntime } = requireModule"
        );
        expect(bootstrapSource).not.toContain(
            "const { getDefaultPreloadRuntimeEnvironment } = requireModule"
        );
        expect(bootstrapSource).not.toContain(
            "resolvePreloadRuntimeEnvironment({\n        consoleRef,\n        globalScope,\n        processRef,\n        requireModule,"
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
        expect.assertions(11);

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
        expect(preloadEntrypointSource).toContain("startPreloadEntrypoint();");
        expect(preloadEntrypointSource).toContain(
            'import { startPreloadScript } from "./preloadBootstrap.js";'
        );
        expect(preloadEntrypointSource).not.toContain("require");
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

    it("keeps the preload entrypoint on native bootstrap imports", () => {
        expect.assertions(7);

        const preloadEntrypointSource = stripComments(
            readRepositoryFile("electron-app/preload/preloadEntrypoint.ts")
        );

        expect(preloadEntrypointSource).toContain(
            'import { startPreloadScript } from "./preloadBootstrap.js";'
        );
        expect(preloadEntrypointSource).toContain("startPreloadScript({");
        expect(preloadEntrypointSource).not.toContain("require");
        expect(preloadEntrypointSource).not.toContain(
            "loadPreloadRuntimeEnvironment"
        );
        expect(preloadEntrypointSource).not.toContain("loadPreloadBootstrap");
        expect(preloadEntrypointSource).not.toContain(
            "createPreloadEntrypointRequire"
        );
        expect(preloadEntrypointSource).not.toContain(
            "isCannotFindModuleError"
        );
    });

    it("keeps preload source free of ambient require calls", () => {
        expect.assertions(1);

        const ambientRequirePattern = /\brequire\s*\(/u;
        const violations = preloadRoots
            .flatMap(collectSourceFiles)
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

    it("keeps the preload build free of the retired injected require transform", () => {
        expect.assertions(5);

        const bundlePreloadSource = stripComments(
            readRepositoryFile("scripts/bundle-preload.mjs")
        );

        expect(bundlePreloadSource).toContain('external: ["electron"]');
        expect(bundlePreloadSource).not.toContain(
            "preloadInjectedRequireBundlingPlugin"
        );
        expect(bundlePreloadSource).not.toContain(
            "preload-injected-require-bundling"
        );
        expect(bundlePreloadSource).not.toContain("requireModule");
        expect(bundlePreloadSource).not.toContain(
            '.replace(/(["\'])\\.\\/preload\\//gu, "$1./")'
        );
    });

    it("keeps root package CLI scripts on native ESM resolution", () => {
        expect.assertions(1);

        const rootPackageCliScripts = [
            "scripts/build-docs.mjs",
            "scripts/build-runtime.mjs",
            "scripts/ensure-macos-builder-deps.mjs",
            "scripts/ensure-electron-binary.mjs",
            "scripts/run-electron-builder.mjs",
            "scripts/run-electron.mjs",
            "scripts/run-eslint.mjs",
            "scripts/update-deps.mjs",
        ];
        const violations = rootPackageCliScripts
            .filter((relativeFile) =>
                /\b(?:createRequire|require\.resolve)\b/u.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps migrated packaging and main tests off avoidable CJS loading", () => {
        expect.assertions(1);

        const migratedTestFiles = [
            "tests/unit/main.test.ts",
            "tests/unit/packaging/electronBuilderConfig.test.ts",
            "tests/unit/packaging/electronBuilderFiles.test.ts",
        ];
        const violations = migratedTestFiles
            .filter((relativeFile) =>
                /\b(?:createRequire|require\.resolve|require\s*\()/u.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
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
        expect.assertions(9);

        const stateManagerSource = stripComments(
            readRepositoryFile("electron-app/utils/state/core/stateManager.ts")
        );
        const stateStorageRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/stateStorageRuntime.ts"
            )
        );

        expect(stateManagerSource).not.toContain(
            "export function createReactiveProperty"
        );
        expect(stateManagerSource).not.toContain(
            "Object.defineProperty(globalThis"
        );
        expect(stateManagerSource).not.toContain("Reflect.get(globalThis");
        expect(stateManagerSource).not.toContain("localStorage.");
        expect(stateManagerSource).toContain("stateStorageRuntime.js");
        expect(stateStorageRuntimeSource).not.toMatch(
            directStateStorageRuntimeAmbientGetterPattern
        );
        expect(stateStorageRuntimeSource).toContain(
            "defaultStateStorageRuntimeScope"
        );
        expect(stateStorageRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(stateStorageRuntimeSource).not.toContain("scope.localStorage");
    });

    it("keeps state persistence middleware storage access behind the runtime facade", () => {
        expect.assertions(3);

        const stateMiddlewareSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/stateMiddleware.ts"
            )
        );

        expect(stateMiddlewareSource).not.toContain("localStorage.");
        expect(stateMiddlewareSource).toContain("stateStorageRuntime.js");
        expect(stateMiddlewareSource).toContain("stateStorageRuntime.setItem");
    });

    it("keeps state middleware performance history off global object storage", () => {
        expect.assertions(3);

        const scannedFiles = [
            "electron-app/utils/state/core/stateMiddleware.ts",
            "tests/unit/stateMiddleware.branches.test.ts",
            "tests/unit/utils/state/core/stateMiddleware.comprehensive.test.ts",
        ];
        const violations = scannedFiles
            .filter((relativeFile) =>
                directStatePerformanceHistoryGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const stateMiddlewareSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/stateMiddleware.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(stateMiddlewareSource).toContain("getStatePerformanceHistory");
        expect(stateMiddlewareSource).toContain("resetStatePerformanceHistory");
    });

    it("keeps generic storage utilities on provider-based ambient storage lookup", () => {
        expect.assertions(10);

        const storageUtilsSource = stripComments(
            readRepositoryFile("electron-app/utils/storage/storageUtils.ts")
        );
        const storageUtilsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/storage/storageUtilsRuntime.ts"
            )
        );

        expect(storageUtilsSource).not.toContain(
            "const scope = globalThis as GlobalWithStorage"
        );
        expect(storageUtilsSource).not.toContain("type GlobalWithStorage");
        expect(storageUtilsSource).not.toContain("Reflect.get(globalThis");
        expect(storageUtilsSource).toContain("defaultStorageProvider");
        expect(storageUtilsSource).toContain("storageUtilsRuntime.js");
        expect(storageUtilsRuntimeSource).toContain(
            "defaultStorageUtilsRuntimeScope"
        );
        expect(storageUtilsSource).toContain(
            "storageUtilsRuntime.getDefaultStorage()"
        );
        expect(storageUtilsRuntimeSource).toContain(
            'Reflect.get(globalThis, "localStorage")'
        );
        expect(storageUtilsRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(storageUtilsRuntimeSource).not.toContain("scope.localStorage");
    });

    it("keeps the legacy appState domain manager removed", () => {
        expect.assertions(1);

        expect(
            hasRepositoryFile("electron-app/utils/state/domain/appState.ts")
        ).toBe(false);
    });

    it("keeps the legacy appState manager out of public state-domain entry points", () => {
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
        expect(appDomainFacadeSource).not.toContain("./appState.js");
    });

    it("keeps renderer import-time bootstrap off legacy appState test overrides", () => {
        expect.assertions(3);

        const importTimeBootstrapSource = stripComments(
            readRepositoryFile("electron-app/renderer/importTimeBootstrap.ts")
        );

        expect(importTimeBootstrapSource).not.toContain(
            "state/domain/appState.js"
        );
        expect(importTimeBootstrapSource).not.toContain(
            "touchManualAppStartTime"
        );
        expect(importTimeBootstrapSource).not.toContain("Manual");
    });

    it("keeps renderer core module resolution on the app-domain state facade", () => {
        expect.assertions(7);

        const coreModuleResolutionSource = stripComments(
            readRepositoryFile("electron-app/renderer/coreModuleResolution.ts")
        );

        expect(coreModuleResolutionSource).toContain(
            "state/domain/appDomainState.js"
        );
        expect(coreModuleResolutionSource).not.toContain(
            "state/domain/appState.js"
        );
        expect(coreModuleResolutionSource).not.toContain(
            "__vitest_manual_mocks__"
        );
        expect(coreModuleResolutionSource).not.toContain(
            "resolveExactManualMock"
        );
        expect(coreModuleResolutionSource).not.toContain("resolveManualMock");
        expect(coreModuleResolutionSource).not.toContain(
            "toManualMockPathSuffix"
        );
        expect(coreModuleResolutionSource).not.toContain("globalThis");
    });

    it("keeps export utility test overrides off manual mock registries", () => {
        expect.assertions(4);

        const exportUtilsSource = stripComments(
            readRepositoryFile("electron-app/utils/files/export/exportUtils.ts")
        );

        expect(exportUtilsSource).toContain("__setTestDeps");
        expect(exportUtilsSource).not.toContain("__vitest_manual_mocks__");
        expect(exportUtilsSource).not.toContain(
            "setExportUtilsTestModuleOverrides"
        );
        expect(exportUtilsSource).not.toContain("resolveManualMock");
    });

    it("keeps export utility browser runtime access behind the runtime facade", () => {
        expect.assertions(46);

        const exportUtilsSource = stripComments(
            readRepositoryFile("electron-app/utils/files/export/exportUtils.ts")
        );
        const exportUtilsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/exportUtilsRuntime.ts"
            )
        );
        const exportUtilsRuntimeScopeSource = exportUtilsRuntimeSource.slice(
            exportUtilsRuntimeSource.indexOf(
                "export interface ExportUtilsRuntimeScope"
            ),
            exportUtilsRuntimeSource.indexOf(
                "export interface ExportUtilsRuntime {"
            )
        );

        expect(exportUtilsSource).toContain("exportUtilsRuntime.js");
        expect(exportUtilsSource).toContain("confirmDangerousAction");
        expect(exportUtilsSource).toContain("createAbortController");
        expect(exportUtilsSource).toContain("getSecureRandomScope");
        expect(exportUtilsSource).toContain("getStorage");
        expect(exportUtilsSource).toContain("openPrintWindow");
        expect(exportUtilsSource).toContain("addDocumentKeydownListener");
        expect(exportUtilsSource).not.toContain("Reflect.get(globalThis");
        expect(exportUtilsSource).not.toContain("globalThis.window");
        expect(exportUtilsSource).not.toContain("globalThis.localStorage");
        expect(exportUtilsSource).not.toContain("document.addEventListener");
        expect(exportUtilsSource).not.toContain(
            "function getSecureRandomGlobal"
        );
        expect(exportUtilsSource).not.toContain("return globalThis;");
        expect(exportUtilsSource).toContain("getDefaultExportStorage");
        expect(exportUtilsSource).not.toContain("window?.confirm");
        expect(exportUtilsSource).not.toMatch(/\bwindow\.open\s*\(/u);
        expect(exportUtilsSource).not.toMatch(/\bnew\s+AbortController\b/u);
        expect(exportUtilsRuntimeSource).toContain(
            "defaultExportUtilsRuntimeScope"
        );
        expect(exportUtilsRuntimeSource).toContain("getConfirmDangerousAction");
        expect(exportUtilsRuntimeSource).toContain("getOpenPrintWindow");
        expect(exportUtilsRuntimeSource).toContain("getSecureRandomCrypto");
        expect(exportUtilsRuntimeSource).toContain("getStorage");
        expect(exportUtilsRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "exportUtils requires a document event-target runtime"
        );
        expect(exportUtilsRuntimeSource).not.toContain("globalThis.window");
        expect(exportUtilsRuntimeSource).not.toContain("getWindow");
        expect(exportUtilsRuntimeSource).not.toContain(
            'Pick<Window, "confirm" | "open">'
        );
        expect(exportUtilsRuntimeSource).not.toContain(
            "scope: ExportUtilsRuntimeScope = globalThis"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly confirmDangerousAction?:"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly crypto?:"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(exportUtilsRuntimeScopeSource).not.toContain(
            "readonly openPrintWindow?:"
        );
        expect(exportUtilsRuntimeSource).not.toContain("scope.AbortController");
        expect(exportUtilsRuntimeSource).not.toContain(
            "scope.confirmDangerousAction"
        );
        expect(exportUtilsRuntimeSource).not.toContain("scope.crypto");
        expect(exportUtilsRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(exportUtilsRuntimeSource).not.toContain("scope.localStorage");
        expect(exportUtilsRuntimeSource).not.toContain("scope.openPrintWindow");
        expect(exportUtilsRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "return scope.getConfirmDangerousAction?.();"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "return scope.getDocumentEventTarget?.();"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "return scope.getOpenPrintWindow?.();"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "const cryptoObject = scope.getSecureRandomCrypto?.();"
        );
        expect(exportUtilsRuntimeSource).toContain(
            "const storage = scope.getStorage?.();"
        );
    });

    it("keeps renderChartJS comprehensive tests off module-cache require bridges", () => {
        expect.assertions(4);

        const renderChartJsComprehensiveTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/utils/charts/core/renderChartJS.comprehensive.test.ts"
            )
        );

        expect(renderChartJsComprehensiveTestSource).not.toMatch(
            /\b(?:createRequire|requireCjs|require\s*\()/u
        );
        expect(renderChartJsComprehensiveTestSource).not.toContain(
            "utils.require"
        );
        expect(renderChartJsComprehensiveTestSource).not.toContain(
            "moduleCache"
        );
        expect(renderChartJsComprehensiveTestSource).toContain("vi.doMock");
    });

    it("keeps createAppMenu Electron test fixtures module-local", () => {
        expect.assertions(4);

        const createAppMenuTestSource = stripComments(
            readRepositoryFile("tests/unit/menu/createAppMenu.test.ts")
        );

        expect(createAppMenuTestSource).not.toMatch(
            directCreateAppMenuTestFixtureGlobalPattern
        );
        expect(createAppMenuTestSource).toContain("let electronMockFixture");
        expect(createAppMenuTestSource).not.toMatch(
            /\b(?:createRequire|requireCjs|require\s*\()/u
        );
        expect(createAppMenuTestSource).not.toMatch(
            directAppMenuExportsGlobalPattern
        );
    });

    it("keeps IPC sender-policy tests on native module imports", () => {
        expect.assertions(3);

        const ipcSenderPolicyTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/main/ipc/ipcRegistry.senderPolicy.test.ts"
            )
        );

        expect(ipcSenderPolicyTestSource).not.toMatch(
            /\b(?:createRequire|requireCjs|require\s*\()/u
        );
        expect(ipcSenderPolicyTestSource).toContain("setElectronOverride");
        expect(ipcSenderPolicyTestSource).toContain(
            "../../../../electron-app/main/runtime/electronAccess.js"
        );
    });

    it("keeps strict Electron main-handler tests on native module imports", () => {
        expect.assertions(3);

        const mainHandlersStrictTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/strictTests/electron/main.handlers.strict.test.ts"
            )
        );

        expect(mainHandlersStrictTestSource).not.toMatch(
            /\b(?:createRequire|requireCjs|require\s*\()/u
        );
        expect(mainHandlersStrictTestSource).toContain("setElectronOverride");
        expect(mainHandlersStrictTestSource).toContain(
            "../../../../electron-app/main/security/fileAccessPolicy.js"
        );
    });

    it("keeps main-process state-manager tests off global require patches", () => {
        expect.assertions(4);

        const mainProcessStateManagerTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/utils/state/integration/mainProcessStateManager.test.ts"
            )
        );

        expect(mainProcessStateManagerTestSource).not.toMatch(
            /\b(?:createRequire|requireCjs|require\s*\()/u
        );
        expect(mainProcessStateManagerTestSource).not.toContain(
            "global.require"
        );
        expect(mainProcessStateManagerTestSource).not.toContain(
            "require.cache"
        );
        expect(mainProcessStateManagerTestSource).toContain(
            "setElectronOverride"
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
        expect.assertions(26);

        const rendererEntrypointSource = stripComments(
            readRepositoryFile("electron-app/renderer.ts")
        );
        const rendererRuntimeEnvironmentSource = stripComments(
            readRepositoryFile("electron-app/renderer/runtimeEnvironment.ts")
        );
        const mainUiSource = stripComments(
            readRepositoryFile("electron-app/main-ui.ts")
        );
        const mainUiStartupSource = stripComments(
            readRepositoryFile("electron-app/renderer/mainUiStartup.ts")
        );
        const mainUiRuntimeGlobalPattern = /\bglobalThis\.console\b/u;
        const mainUiUnloadRuntimeGlobalPattern = /\bDate\.now\b/u;
        const mainUiUnloadFlowSource = stripComments(
            readRepositoryFile("electron-app/renderer/mainUiUnloadFlow.ts")
        );
        const mainUiRuntimeEnvironmentSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/mainUiRuntimeEnvironment.ts"
            )
        );
        const mainUiRuntimeEnvironmentScopeSource =
            mainUiRuntimeEnvironmentSource.slice(
                mainUiRuntimeEnvironmentSource.indexOf(
                    "export interface MainUiRuntimeEnvironmentScope"
                ),
                mainUiRuntimeEnvironmentSource.indexOf(
                    "const defaultMainUiRuntimeEnvironmentScope"
                )
            );

        expect(rendererEntrypointSource).toContain("runtimeEnvironment.js");
        expect(rendererEntrypointSource).not.toContain("globalThis.");
        expect(rendererEntrypointSource).not.toContain("document,");
        expect(rendererRuntimeEnvironmentSource).not.toContain(
            "scope: Window & typeof globalThis = globalThis.window"
        );
        expect(rendererRuntimeEnvironmentSource).toContain(
            "defaultRendererRuntimeEnvironmentScope"
        );
        expect(rendererRuntimeEnvironmentSource).toContain(
            "getRendererScope: () => globalThis as RendererRuntimeScope"
        );
        expect(rendererRuntimeEnvironmentSource).toContain(
            "readonly rendererGlobal: Window & typeof globalThis"
        );
        expect(rendererRuntimeEnvironmentSource).not.toContain(
            "readonly windowTarget"
        );
        expect(rendererRuntimeEnvironmentSource).not.toContain(
            "readonly scope: typeof globalThis"
        );
        expect(rendererRuntimeEnvironmentSource).not.toContain(
            "globalThis.window"
        );
        expect(rendererRuntimeEnvironmentSource).not.toContain("getWindow: ()");
        expect(rendererRuntimeEnvironmentSource).toContain(
            "renderer runtime environment requires a renderer scope"
        );
        expect(mainUiSource).toContain("renderer/mainUiStartup.js");
        expect(mainUiSource).not.toMatch(mainUiRuntimeGlobalPattern);
        expect(mainUiStartupSource).toContain("mainUiRuntimeEnvironment.js");
        expect(mainUiUnloadFlowSource).toContain("mainUiRuntimeEnvironment.js");
        expect(mainUiUnloadFlowSource).not.toMatch(
            mainUiUnloadRuntimeGlobalPattern
        );
        expect(rendererMainUiRuntimeEnvironmentFiles).toStrictEqual([
            "electron-app/renderer/mainUiRuntimeEnvironment.ts",
        ]);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "defaultMainUiRuntimeEnvironmentScope"
                )
            )
        ).toBe(true);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "getConsole: () => globalThis.console"
                )
            )
        ).toBe(true);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "dateNow: () => Date.now()"
                )
            )
        ).toBe(true);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                mainUiRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
        ).toBe(true);
        expect(
            rendererMainUiRuntimeEnvironmentFiles.every((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "main UI runtime environment requires a console reference"
                )
            )
        ).toBe(true);
        expect(mainUiRuntimeEnvironmentScopeSource).not.toContain(
            "readonly consoleRef?:"
        );
        expect(mainUiRuntimeEnvironmentSource).not.toContain(
            "scope.consoleRef"
        );
        expect(mainUiRuntimeEnvironmentSource).toContain(
            "const consoleRef = scope.getConsole?.();"
        );
    });

    it("keeps startup initializer document access behind its runtime provider", () => {
        expect.assertions(10);

        const initStartupSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/initStartup.ts")
        );
        const initStartupRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/initStartupRuntime.ts")
        );

        expect(initStartupSource).toContain("initStartupRuntime.js");
        expect(initStartupSource).not.toMatch(
            /\baddEventListenerWithCleanup\(\s*document\s*,/u
        );
        expect(initStartupSource).not.toContain("globalThis.document");
        expect(initStartupRuntimeSource).toContain(
            "defaultInitStartupRuntimeScope"
        );
        expect(initStartupRuntimeSource).toContain(
            "getDocumentTarget: () => globalThis.document"
        );
        expect(initStartupRuntimeSource).not.toContain(
            "scope: InitStartupRuntimeScope = globalThis"
        );
        expect(initStartupRuntimeSource).not.toContain(
            "readonly documentTarget?:"
        );
        expect(initStartupRuntimeSource).not.toContain("scope.documentTarget");
        expect(initStartupRuntimeSource).toContain(
            "readonly getDocumentTarget?:"
        );
        expect(initStartupRuntimeSource).toContain(
            "return scope.getDocumentTarget?.();"
        );
    });

    it("keeps renderer environment default scope behind a provider", () => {
        expect.assertions(10);

        const rendererEnvironmentSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/rendererEnvironment.ts"
            )
        );
        const rendererEnvironmentRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/rendererEnvironmentRuntime.ts"
            )
        );

        expect(rendererEnvironmentSource).toContain(
            "rendererEnvironmentRuntime.js"
        );
        expect(rendererEnvironmentSource).toContain(
            "getDefaultRendererEnvironmentScope()"
        );
        expect(rendererEnvironmentSource).not.toContain("return globalThis");
        expect(rendererEnvironmentSource).not.toContain(
            "globalScope: object = globalThis"
        );
        expect(rendererEnvironmentSource).not.toContain(
            "isDevelopmentMode(globalScope: object = globalThis)"
        );
        expect(rendererEnvironmentRuntimeSource).toContain(
            "defaultRendererEnvironmentRuntimeScope"
        );
        expect(rendererEnvironmentRuntimeSource).toContain(
            "getGlobalScope: () => globalThis"
        );
        expect(rendererEnvironmentRuntimeSource).not.toContain(
            "readonly globalScope?:"
        );
        expect(rendererEnvironmentRuntimeSource).not.toContain(
            "scope.globalScope"
        );
        expect(rendererEnvironmentRuntimeSource).not.toContain(
            "scope: RendererEnvironmentRuntimeScope = globalThis"
        );
    });

    it("keeps main-ui as an entrypoint-only startup bridge", () => {
        expect.assertions(5);

        const mainUiSource = stripComments(
            readRepositoryFile("electron-app/main-ui.ts")
        );
        const importStatements = mainUiSource.match(/^import\s.+$/gmu) ?? [];

        expect(importStatements).toStrictEqual([
            'import { initializeMainUiStartup } from "./renderer/mainUiStartup.js";',
        ]);
        expect(mainUiSource).toContain("await initializeMainUiStartup()");
        expect(mainUiSource).toContain(
            "export const { mainUiDragDropHandler }"
        );
        expect(mainUiSource).toContain(
            "export const { requestMainUiMenuInjection }"
        );
        expect(mainUiSource).toContain(
            "export const { runMainUiDevelopmentCleanup }"
        );
    });

    it("keeps main-ui summary selector DOM timers behind its runtime facade", () => {
        expect.assertions(14);

        const violations = migratedMainUiSummarySelectorRuntimeFiles
            .filter((relativeFile) =>
                directMainUiSummarySelectorRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedMainUiSummarySelectorRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "mainUiSummaryColumnSelectorRuntime.js"
                    )
            )
            .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/mainUiSummaryColumnSelectorRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain(
            "defaultMainUiSummaryColumnSelectorRuntimeScope"
        );
        expect(runtimeSource).not.toMatch(
            directMainUiSummarySelectorRuntimeAmbientFallbackPattern
        );
        expect(runtimeSource).not.toContain(
            "scope: MainUiSummaryColumnSelectorRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "const defaultMainUiSummaryColumnSelectorRuntimeScope: MainUiSummaryColumnSelectorRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain("readonly document?:");
        expect(runtimeSource).not.toContain("readonly HTMLElement?:");
        expect(runtimeSource).not.toContain("readonly setTimeout?:");
        expect(runtimeSource).not.toContain("scope.document");
        expect(runtimeSource).not.toContain("scope.HTMLElement");
        expect(runtimeSource).not.toContain("scope.setTimeout");
        expect(runtimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(runtimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
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
        expect.assertions(13);

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
        const featureGateRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/browser/initFitBrowserFeatureGateRuntime.ts"
            )
        );
        const featureGateRuntimeScopeSource = featureGateRuntimeSource.slice(
            featureGateRuntimeSource.indexOf(
                "export interface FitBrowserFeatureGateRuntimeScope"
            ),
            featureGateRuntimeSource.indexOf(
                "export interface FitBrowserFeatureGateRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(featureGateSource).toContain(
            "initFitBrowserFeatureGateRuntime.js"
        );
        expect(featureGateRuntimeSource).toContain(
            "defaultFitBrowserFeatureGateRuntimeScope"
        );
        expect(featureGateRuntimeSource).not.toMatch(
            directFitBrowserFeatureGateRuntimeAmbientGetterPattern
        );
        expect(featureGateRuntimeSource).not.toContain(
            "FitBrowserFeatureGateRuntimeScope =\n    globalThis"
        );
        expect(featureGateRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(featureGateRuntimeScopeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(featureGateRuntimeSource).not.toContain("scope.document");
        expect(featureGateRuntimeSource).not.toContain("scope.HTMLElement");
        expect(featureGateRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(featureGateRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(featureGateRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(featureGateRuntimeSource).toContain(
            "scope.getHTMLElement?.() ?? runtimeDocument?.defaultView?.HTMLElement"
        );
    });

    it("keeps Browser tab listener abort-controller creation behind the runtime facade", () => {
        expect.assertions(10);

        const violations = migratedFileBrowserTabRuntimeFiles
            .filter((relativeFile) =>
                directFileBrowserTabRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const browserTabSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/browser/fileBrowserTab.ts"
            )
        );
        const browserTabRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/browser/fileBrowserTabRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(browserTabSource).toContain("fileBrowserTabRuntime.js");
        expect(browserTabSource).toContain("createAbortController");
        expect(browserTabRuntimeSource).toContain(
            "defaultFileBrowserTabRuntimeScope"
        );
        expect(browserTabRuntimeSource).not.toMatch(
            directFileBrowserTabRuntimeAmbientGetterPattern
        );
        expect(browserTabRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(browserTabRuntimeSource).not.toContain(
            "FileBrowserTabRuntimeScope = globalThis"
        );
        expect(browserTabRuntimeSource).not.toContain("scope.AbortController");
        expect(browserTabRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(browserTabRuntimeSource).toContain(
            "scope.getAbortController?.()"
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
        expect.assertions(18);

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
        const chartSettingsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/ensureChartSettingsDropdownsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartSettingsSource).toContain(
            "ensureChartSettingsDropdownsRuntime.js"
        );
        expect(chartSettingsRuntimeSource).not.toMatch(
            directEnsureChartSettingsDropdownsRuntimeAmbientFallbackPattern
        );
        expect(chartSettingsRuntimeSource).toContain(
            "defaultEnsureChartSettingsDropdownsRuntimeScope"
        );
        expect(chartSettingsRuntimeSource).not.toContain(
            "scope: EnsureChartSettingsDropdownsRuntimeScope = globalThis"
        );
        expect(chartSettingsRuntimeSource).not.toContain(
            "const defaultEnsureChartSettingsDropdownsRuntimeScope: EnsureChartSettingsDropdownsRuntimeScope = globalThis"
        );
        expect(chartSettingsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(chartSettingsRuntimeSource).not.toContain("readonly document?:");
        expect(chartSettingsRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(chartSettingsRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(chartSettingsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(chartSettingsRuntimeSource).not.toContain("scope.document");
        expect(chartSettingsRuntimeSource).not.toContain("scope.HTMLElement");
        expect(chartSettingsRuntimeSource).not.toContain("scope.setTimeout");
        expect(chartSettingsRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(chartSettingsRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(chartSettingsRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(chartSettingsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
    });

    it("keeps settings-header timers and abort controllers behind the runtime facade", () => {
        expect.assertions(22);

        const violations = migratedCreateSettingsHeaderRuntimeFiles
            .filter((relativeFile) =>
                directCreateSettingsHeaderRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const settingsHeaderSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/createSettingsHeader.ts"
            )
        );
        const settingsHeaderRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/createSettingsHeaderRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(settingsHeaderSource).toContain(
            "createSettingsHeaderRuntime.js"
        );
        expect(settingsHeaderSource).toContain("createAbortController");
        expect(settingsHeaderSource).toContain("addDocumentKeydownListener");
        expect(settingsHeaderSource).not.toContain("document.addEventListener");
        expect(settingsHeaderRuntimeSource).not.toMatch(
            directCreateSettingsHeaderRuntimeAmbientFallbackPattern
        );
        expect(settingsHeaderRuntimeSource).toContain(
            "defaultCreateSettingsHeaderRuntimeScope"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "scope: CreateSettingsHeaderRuntimeScope = globalThis"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "const defaultCreateSettingsHeaderRuntimeScope: CreateSettingsHeaderRuntimeScope = globalThis"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(settingsHeaderRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(settingsHeaderRuntimeSource).not.toContain("scope.clearTimeout");
        expect(settingsHeaderRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(settingsHeaderRuntimeSource).not.toContain("scope.setTimeout");
        expect(settingsHeaderRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(settingsHeaderRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(settingsHeaderRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(settingsHeaderRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(settingsHeaderRuntimeSource).toContain(
            "createSettingsHeader requires a document event-target runtime"
        );
    });

    it("keeps field-toggle browser APIs behind the runtime facade", () => {
        expect.assertions(20);

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
        const fieldTogglesRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/createFieldTogglesSectionRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(fieldTogglesSource).toContain(
            "createFieldTogglesSectionRuntime.js"
        );
        expect(fieldTogglesRuntimeSource).not.toMatch(
            directCreateFieldTogglesSectionRuntimeAmbientFallbackPattern
        );
        expect(fieldTogglesRuntimeSource).toContain(
            "defaultCreateFieldTogglesSectionRuntimeScope"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "scope: CreateFieldTogglesSectionRuntimeScope = globalThis"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "const defaultCreateFieldTogglesSectionRuntimeScope: CreateFieldTogglesSectionRuntimeScope = globalThis"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly dispatchEvent?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain("readonly document?:");
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly HTMLInputElement?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(fieldTogglesRuntimeSource).not.toContain("scope.document");
        expect(fieldTogglesRuntimeSource).not.toContain("scope.dispatchEvent");
        expect(fieldTogglesRuntimeSource).not.toContain("scope.setTimeout");
        expect(fieldTogglesRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(fieldTogglesRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(fieldTogglesRuntimeSource).toContain(
            "getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis)"
        );
        expect(fieldTogglesRuntimeSource).toContain(
            "createFieldTogglesSection requires a setTimeout runtime"
        );
    });

    it("keeps inline zone selector browser APIs behind the runtime facade", () => {
        expect.assertions(22);

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
        const inlineZoneSelectorRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createInlineZoneColorSelectorRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(inlineZoneSelectorSource).toContain(
            "createInlineZoneColorSelectorRuntime.js"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toMatch(
            directCreateInlineZoneColorSelectorRuntimeAmbientFallbackPattern
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "defaultCreateInlineZoneColorSelectorRuntimeScope"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "scope: CreateInlineZoneColorSelectorRuntimeScope = globalThis"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "const defaultCreateInlineZoneColorSelectorRuntimeScope: CreateInlineZoneColorSelectorRuntimeScope = globalThis"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly dispatchEvent?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly HTMLInputElement?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly HTMLSelectElement?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain("scope.document");
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "scope.dispatchEvent"
        );
        expect(inlineZoneSelectorRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis)"
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(inlineZoneSelectorRuntimeSource).toContain(
            "createInlineZoneColorSelector requires a setTimeout runtime"
        );
    });

    it("keeps zone color picker event APIs behind the runtime facade", () => {
        expect.assertions(15);

        const violations = migratedOpenZoneColorPickerRuntimeFiles
            .filter((relativeFile) =>
                directOpenZoneColorPickerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const zoneColorPickerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/openZoneColorPicker.ts"
            )
        );
        const zoneColorPickerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/openZoneColorPickerRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(zoneColorPickerSource).toContain(
            "openZoneColorPickerRuntime.js"
        );
        expect(zoneColorPickerRuntimeSource).not.toMatch(
            directOpenZoneColorPickerRuntimeAmbientFallbackPattern
        );
        expect(zoneColorPickerRuntimeSource).toContain(
            "defaultOpenZoneColorPickerRuntimeScope"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "scope: OpenZoneColorPickerRuntimeScope = globalThis"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "const defaultOpenZoneColorPickerRuntimeScope: OpenZoneColorPickerRuntimeScope = globalThis"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "readonly dispatchEvent?:"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain("scope.CustomEvent");
        expect(zoneColorPickerRuntimeSource).not.toContain(
            "scope.dispatchEvent"
        );
        expect(zoneColorPickerRuntimeSource).not.toContain("scope.document");
        expect(zoneColorPickerRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(zoneColorPickerRuntimeSource).toContain(
            "getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis)"
        );
        expect(zoneColorPickerRuntimeSource).toContain(
            "openZoneColorPicker requires a dispatchEvent runtime"
        );
    });

    it("keeps chart controls synchronization on the chart-controls state facade", () => {
        expect.assertions(3);

        const chartControlsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/updateControlsState.ts"
            )
        );
        const stateIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/stateIntegration.ts"
            )
        );

        expect(chartControlsSource).toContain("rendererChartControlsState.js");
        expect(chartControlsSource).not.toContain("state/core/stateManager.js");
        expect(stateIntegrationSource).not.toContain(
            "migrateChartControlsState"
        );
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
        expect.assertions(20);

        const chartTabIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartTabIntegration.ts"
            )
        );
        const chartTabIntegrationRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartTabIntegrationRuntime.ts"
            )
        );
        const chartTabIntegrationRuntimeScopeSource =
            chartTabIntegrationRuntimeSource.slice(
                chartTabIntegrationRuntimeSource.indexOf(
                    "export interface ChartTabIntegrationRuntimeScope"
                ),
                chartTabIntegrationRuntimeSource.indexOf(
                    "export interface ChartTabIntegrationRuntime"
                )
            );

        expect(chartTabIntegrationSource).toContain("activeFitRawDataState.js");
        expect(chartTabIntegrationSource).toContain("appDomainState.js");
        expect(chartTabIntegrationSource).toContain(
            "rendererActiveTabState.js"
        );
        expect(chartTabIntegrationSource).toContain(
            "chartTabIntegrationRuntime.js"
        );
        expect(chartTabIntegrationSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(chartTabIntegrationSource).not.toContain(
            "document.querySelector"
        );
        expect(chartTabIntegrationSource).not.toContain(
            "instanceof HTMLElement"
        );
        expect(chartTabIntegrationSource).not.toContain("cleanup()");
        expect(chartTabIntegrationRuntimeSource).toContain(
            "defaultChartTabIntegrationRuntimeScope"
        );
        expect(chartTabIntegrationRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(chartTabIntegrationRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(chartTabIntegrationRuntimeSource).not.toContain(
            "scope: ChartTabIntegrationRuntimeScope = globalThis"
        );
        expect(chartTabIntegrationRuntimeSource).not.toContain(
            "ChartTabIntegrationRuntimeScope = globalThis"
        );
        expect(chartTabIntegrationRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(chartTabIntegrationRuntimeScopeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(chartTabIntegrationRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(chartTabIntegrationRuntimeSource).not.toContain(
            "scope.HTMLElement"
        );
        expect(chartTabIntegrationRuntimeSource).toContain(
            "scope.getHTMLElement?.()"
        );
        expect(chartTabIntegrationRuntimeSource).toContain(
            "scope.getDocument?.()?.defaultView?.HTMLElement"
        );
        expect(chartTabIntegrationRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
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
        expect.assertions(4);

        const chartStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartStateManager.ts"
            )
        );

        expect(chartStateManagerSource).toContain(
            "rendererChartRenderState.js"
        );
        expect(chartStateManagerSource).toContain("rendererActiveTabState.js");
        expect(chartStateManagerSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(chartStateManagerSource).not.toContain("cleanup()");
    });

    it("keeps chart state manager browser APIs behind the runtime facade", () => {
        expect.assertions(23);

        const violations = migratedChartStateManagerRuntimeFiles
            .filter((relativeFile) =>
                directChartStateManagerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedChartStateManagerRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "chartStateManagerRuntime.js"
                    )
            )
            .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartStateManagerRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain("defaultChartStateManagerRuntimeScope");
        expect(runtimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(runtimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(runtimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(runtimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(runtimeSource).not.toContain(
            "scope: ChartStateManagerRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "ChartStateManagerRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain("readonly clearTimeout?:");
        expect(runtimeSource).not.toContain("readonly document?:");
        expect(runtimeSource).not.toContain("readonly HTMLElement?:");
        expect(runtimeSource).not.toContain("readonly setTimeout?:");
        expect(runtimeSource).not.toContain("scope.clearTimeout");
        expect(runtimeSource).not.toContain("scope.document");
        expect(runtimeSource).not.toContain("scope.HTMLElement");
        expect(runtimeSource).not.toContain("scope.setTimeout");
        expect(runtimeSource).toContain(
            "const clearTimeout = scope.getClearTimeout?.();"
        );
        expect(runtimeSource).toContain(
            "const document = scope.getDocument?.();"
        );
        expect(runtimeSource).toContain("scope.getDocument?.()?.querySelector");
        expect(runtimeSource).toContain(
            "const HTMLElementConstructor = scope.getHTMLElement?.();"
        );
        expect(runtimeSource).toContain(
            "const setTimeout = scope.getSetTimeout?.();"
        );
        expect(runtimeSource).toContain(
            "ChartStateManager requires setTimeout"
        );
    });

    it("keeps renderChartJS on chart state access and runtime boundaries", () => {
        expect.assertions(23);

        const renderChartSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartJS.ts"
            )
        );
        const renderChartRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartJSRuntime.ts"
            )
        );
        const renderChartRenderSettingsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartRenderSettings.ts"
            )
        );

        expect(renderChartSource).toContain("renderChartStateAccess.js");
        expect(renderChartSource).toContain("renderChartJSRuntime.js");
        expect(renderChartSource).not.toContain("state/core/stateManager.js");
        expect(renderChartSource).not.toContain("globalThis.window");
        expect(renderChartSource).not.toContain("globalThis.CustomEvent");
        expect(renderChartSource).not.toContain("performance.now");
        expect(renderChartSource).not.toContain("Date.now");
        expect(renderChartRuntimeSource).not.toMatch(
            directRuntimeAmbientClockFallbackPattern
        );
        expect(renderChartRuntimeSource).not.toMatch(
            directRenderChartJSRuntimeAmbientGetterPattern
        );
        expect(renderChartRuntimeSource).toContain(
            "renderChartJSRuntime requires dateNow"
        );
        expect(renderChartRuntimeSource).toContain(
            "defaultRenderChartJSRuntimeScope"
        );
        expect(renderChartRuntimeSource).toContain(
            'getIsRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(renderChartRuntimeSource).not.toContain(
            "readonly CustomEventConstructor?:"
        );
        expect(renderChartRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(renderChartRuntimeSource).not.toContain(
            "scope.CustomEventConstructor"
        );
        expect(renderChartRuntimeSource).not.toContain("scope.performance");
        expect(renderChartRuntimeSource).not.toContain(
            "readonly isRendererScope?:"
        );
        expect(renderChartRuntimeSource).not.toContain("scope.isRendererScope");
        expect(renderChartRuntimeSource).not.toContain(
            "getWindow: () => globalThis.window"
        );
        expect(renderChartRuntimeSource).not.toContain(
            "globalThis.CustomEvent"
        );
        expect(renderChartRuntimeSource).toContain("getCustomEventConstructor");
        expect(renderChartRenderSettingsSource).not.toContain("Date.now");
        expect(renderChartRenderSettingsSource).toContain(
            "processedAt: number"
        );
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
        expect.assertions(16);

        const chartSettingsRenderSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/chartSettingsRender.ts"
            )
        );
        const chartSettingsRenderRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/chartSettingsRenderRuntime.ts"
            )
        );
        const chartSettingsRenderRuntimeScopeSource =
            chartSettingsRenderRuntimeSource.slice(
                chartSettingsRenderRuntimeSource.indexOf(
                    "export interface ChartSettingsRenderRuntimeScope"
                ),
                chartSettingsRenderRuntimeSource.indexOf(
                    "function getCustomEventConstructor"
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
        expect(chartSettingsRenderSource).not.toContain("new CustomEvent");
        expect(chartSettingsRenderSource).toContain("createRenderRequestEvent");
        expect(chartSettingsRenderRuntimeSource).toContain(
            "defaultChartSettingsRenderRuntimeScope"
        );
        expect(chartSettingsRenderRuntimeScopeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(chartSettingsRenderRuntimeScopeSource).not.toContain(
            "readonly dispatchEvent:"
        );
        expect(chartSettingsRenderRuntimeSource).not.toContain(
            "scope.CustomEvent"
        );
        expect(chartSettingsRenderRuntimeSource).not.toContain(
            "eventTarget: scope"
        );
        expect(chartSettingsRenderRuntimeSource).not.toContain(
            "ChartSettingsRenderRuntimeScope =\n    globalThis"
        );
        expect(chartSettingsRenderRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(chartSettingsRenderRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(chartSettingsRenderRuntimeSource).toContain(
            "const CustomEventConstructor = scope.getCustomEvent?.();"
        );
        expect(chartSettingsRenderRuntimeSource).toContain(
            "const eventTarget = scope.getEventTarget?.();"
        );
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
        expect(tabButtonDebugSource).not.toContain(
            "state/core/stateManager.js"
        );
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

    it("keeps keyboard-shortcuts modal timing APIs behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedKeyboardShortcutsModalRuntimeFiles
            .filter((relativeFile) =>
                directKeyboardShortcutsModalTimingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const keyboardShortcutsModalSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/keyboardShortcutsModal.ts"
            )
        );
        const keyboardShortcutsModalRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/keyboardShortcutsModalRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(keyboardShortcutsModalSource).toContain(
            "keyboardShortcutsModalRuntime.js"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toMatch(
            directModalRuntimeAmbientTimerFallbackPattern
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "defaultKeyboardShortcutsModalRuntimeScope"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "scope: KeyboardShortcutsModalRuntimeScope = globalThis"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "const defaultKeyboardShortcutsModalRuntimeScope: KeyboardShortcutsModalRuntimeScope =\n    globalThis"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(keyboardShortcutsModalRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(keyboardShortcutsModalRuntimeSource).toContain(
            "keyboardShortcutsModalRuntime requires a setTimeout runtime"
        );
    });

    it("keeps about modal timing APIs behind the runtime facade", () => {
        expect.assertions(25);

        const violations = migratedAboutModalRuntimeFiles
            .filter((relativeFile) =>
                directAboutModalTimingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const aboutModalSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/modals/aboutModal.ts")
        );
        const aboutModalRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/aboutModalRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(aboutModalSource).toContain("aboutModalRuntime.js");
        expect(aboutModalSource).toContain("aboutModalRuntime.getDocument()");
        expect(aboutModalSource).not.toMatch(
            /\baddEventListenerWithCleanup\(\s*document\s*,\s*["']DOMContentLoaded["']/u
        );
        expect(aboutModalSource).not.toContain(
            'typeof document !== "undefined"'
        );
        expect(aboutModalRuntimeSource).not.toMatch(
            directModalRuntimeAmbientTimerFallbackPattern
        );
        expect(aboutModalRuntimeSource).toContain(
            "defaultAboutModalRuntimeScope"
        );
        expect(aboutModalRuntimeSource).not.toContain(
            "scope: AboutModalRuntimeScope = globalThis"
        );
        expect(aboutModalRuntimeSource).not.toContain(
            "const defaultAboutModalRuntimeScope: AboutModalRuntimeScope = globalThis"
        );
        expect(aboutModalRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(aboutModalRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(aboutModalRuntimeSource).not.toContain("readonly document?:");
        expect(aboutModalRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(aboutModalRuntimeSource).not.toContain("readonly setTimeout?:");
        expect(aboutModalRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(aboutModalRuntimeSource).not.toContain("scope.clearTimeout");
        expect(aboutModalRuntimeSource).not.toContain("scope.document");
        expect(aboutModalRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(aboutModalRuntimeSource).not.toContain("scope.setTimeout");
        expect(aboutModalRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(aboutModalRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(aboutModalRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(aboutModalRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(aboutModalRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(aboutModalRuntimeSource).toContain(
            "aboutModalRuntime requires a setTimeout runtime"
        );
    });

    it("keeps settings modal timing APIs behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedSettingsModalRuntimeFiles
            .filter((relativeFile) =>
                directSettingsModalTimingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const settingsModalSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/settingsModal.ts")
        );
        const settingsModalRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/settingsModalRuntime.ts")
        );

        expect(violations).toStrictEqual([]);
        expect(settingsModalSource).toContain("settingsModalRuntime.js");
        expect(settingsModalRuntimeSource).not.toMatch(
            directModalRuntimeAmbientTimerFallbackPattern
        );
        expect(settingsModalRuntimeSource).toContain(
            "defaultSettingsModalRuntimeScope"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "scope: SettingsModalRuntimeScope = globalThis"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "const defaultSettingsModalRuntimeScope: SettingsModalRuntimeScope = globalThis"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(settingsModalRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(settingsModalRuntimeSource).not.toContain("scope.clearTimeout");
        expect(settingsModalRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(settingsModalRuntimeSource).not.toContain("scope.setTimeout");
        expect(settingsModalRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(settingsModalRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(settingsModalRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(settingsModalRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(settingsModalRuntimeSource).toContain(
            "settingsModalRuntime requires a setTimeout runtime"
        );
    });

    it("keeps drag-drop animation-frame APIs and listener cleanup behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedDragDropHandlerRuntimeFiles
            .filter((relativeFile) =>
                directDragDropHandlerTimingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const dragDropHandlerSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/dragDropHandler.ts")
        );
        const dragDropHandlerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/dragDropHandlerRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(dragDropHandlerSource).toContain("dragDropHandlerRuntime.js");
        expect(dragDropHandlerSource).toContain("createAbortController");
        expect(dragDropHandlerSource).toContain("getDocument");
        expect(dragDropHandlerSource).toContain("getEventTarget");
        expect(dragDropHandlerSource).not.toContain("globalThis");
        expect(dragDropHandlerRuntimeSource).not.toMatch(
            directDragDropHandlerRuntimeAmbientGetterPattern
        );
        expect(dragDropHandlerRuntimeSource).toContain(
            "defaultDragDropHandlerRuntimeScope"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(dragDropHandlerRuntimeSource).not.toContain("scope.document");
        expect(dragDropHandlerRuntimeSource).not.toContain("scope.eventTarget");
        expect(dragDropHandlerRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(dragDropHandlerRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
    });

    it("keeps renderer notification timing APIs behind the runtime facade", () => {
        expect.assertions(15);

        const violations = migratedShowNotificationRuntimeFiles
            .filter((relativeFile) =>
                directShowNotificationTimingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const notificationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/notifications/showNotification.ts"
            )
        );
        const notificationRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/notifications/showNotificationRuntime.ts"
            )
        );
        const notificationRuntimeScopeSource = notificationRuntimeSource.slice(
            notificationRuntimeSource.indexOf(
                "export type ShowNotificationRuntimeScope = {"
            ),
            notificationRuntimeSource.indexOf(
                "export type ShowNotificationRuntime = {"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(notificationSource).toContain("showNotificationRuntime.js");
        expect(notificationRuntimeSource).not.toMatch(
            directShowNotificationRuntimeAmbientGetterPattern
        );
        expect(notificationRuntimeSource).toContain(
            "defaultShowNotificationRuntimeScope"
        );
        expect(notificationRuntimeScopeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(notificationRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(notificationRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(notificationRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(notificationRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(notificationRuntimeSource).not.toContain("scope.clearTimeout");
        expect(notificationRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(notificationRuntimeSource).not.toContain("scope.setTimeout");
        expect(notificationRuntimeSource).not.toContain("globalThis.window");
        expect(notificationRuntimeSource).not.toContain("getWindow");
        expect(notificationRuntimeSource).not.toContain(
            "ShowNotificationWindowRuntime"
        );
    });

    it("keeps update and state-synced notification timers behind the runtime facade", () => {
        expect.assertions(11);

        const violations = migratedNotificationTimerRuntimeFiles
            .filter((relativeFile) => {
                const source = stripComments(readRepositoryFile(relativeFile));
                return (
                    directNotificationTimerRuntimeGlobalPattern.test(source) ||
                    !source.includes("notificationTimerRuntime.js")
                );
            })
            .sort();
        const notificationTimerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/notifications/notificationTimerRuntime.ts"
            )
        );
        const notificationTimerRuntimeScopeSource =
            notificationTimerRuntimeSource.slice(
                notificationTimerRuntimeSource.indexOf(
                    "export interface NotificationTimerRuntimeScope"
                ),
                notificationTimerRuntimeSource.indexOf(
                    "export interface NotificationTimerRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(notificationTimerRuntimeSource).toContain(
            "defaultNotificationTimerRuntimeScope"
        );
        expect(notificationTimerRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(notificationTimerRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(notificationTimerRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(notificationTimerRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(notificationTimerRuntimeSource).not.toContain(
            "NotificationTimerRuntimeScope =\n    globalThis"
        );
        expect(notificationTimerRuntimeSource).not.toMatch(
            directNotificationTimerRuntimeAmbientGetterPattern
        );
        expect(notificationTimerRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(notificationTimerRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(notificationTimerRuntimeSource).toContain(
            "const scheduleTimer = scope.getSetTimeout?.();"
        );
    });

    it("keeps theme setup state access on the renderer theme state facade", () => {
        expect.assertions(2);

        const setupThemeSource = stripComments(
            readRepositoryFile("electron-app/utils/theming/core/setupTheme.ts")
        );

        expect(setupThemeSource).toContain("rendererThemeState.js");
        expect(setupThemeSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps tab state-manager support on typed state and document access", () => {
        expect.assertions(13);

        const tabStateManagerSupportSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabStateManagerSupport.ts"
            )
        );
        const tabStateManagerDocSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabStateManagerDoc.ts"
            )
        );
        const tabDocumentRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabDocumentRuntime.ts"
            )
        );
        const tabDocumentRuntimeScopeSource = tabDocumentRuntimeSource.slice(
            tabDocumentRuntimeSource.indexOf(
                "export interface TabDocumentRuntimeScope"
            ),
            tabDocumentRuntimeSource.indexOf(
                "export interface TabDocumentRuntime"
            )
        );

        expect(tabStateManagerSupportSource).toContain(
            "rendererStateManagerAccess.js"
        );
        expect(tabStateManagerSupportSource).toContain("tabDocumentRuntime.js");
        expect(tabStateManagerDocSource).toContain("tabDocumentRuntime.js");
        expect(tabStateManagerSupportSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(tabStateManagerSupportSource).not.toContain(
            "globalThis.document"
        );
        expect(tabStateManagerDocSource).not.toContain("globalThis.document");
        expect(tabDocumentRuntimeSource).toContain(
            "defaultTabDocumentRuntimeScope"
        );
        expect(tabDocumentRuntimeSource).not.toContain(
            "scope: TabDocumentRuntimeScope = globalThis"
        );
        expect(tabDocumentRuntimeSource).not.toContain(
            "const defaultTabDocumentRuntimeScope: TabDocumentRuntimeScope = globalThis"
        );
        expect(tabDocumentRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(tabDocumentRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(tabDocumentRuntimeSource).not.toContain("scope.document");
        expect(tabDocumentRuntimeSource).toContain(
            "const candidate = scope.getDocument?.();"
        );
    });

    it("keeps active-tab updates on typed state access and runtime document resolution", () => {
        expect.assertions(14);

        const updateActiveTabSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/tabs/updateActiveTab.ts")
        );
        const updateActiveTabRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/updateActiveTabRuntime.ts"
            )
        );

        expect(updateActiveTabSource).toContain(
            "rendererStateManagerAccess.js"
        );
        expect(updateActiveTabSource).toContain("updateActiveTabRuntime.js");
        expect(updateActiveTabSource).not.toContain(
            "state/core/stateManager.js"
        );
        expect(updateActiveTabSource).not.toContain("globalThis.document");
        expect(updateActiveTabSource).not.toContain("globalThis.window");
        expect(updateActiveTabRuntimeSource).toContain(
            "defaultUpdateActiveTabRuntimeScope"
        );
        expect(updateActiveTabRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(updateActiveTabRuntimeSource).not.toContain(
            "scope: UpdateActiveTabRuntimeScope = globalThis"
        );
        expect(updateActiveTabRuntimeSource).not.toContain(
            "UpdateActiveTabRuntimeScope = globalThis"
        );
        expect(updateActiveTabRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(updateActiveTabRuntimeSource).not.toContain("scope.document");
        expect(updateActiveTabRuntimeSource).not.toContain("getScopeDocument");
        expect(updateActiveTabRuntimeSource).not.toContain("scope.window");
        expect(updateActiveTabRuntimeSource).not.toContain("window?:");
    });

    it("keeps active-tab fallback tests on descriptor-scoped browser fixtures", () => {
        expect.assertions(1);

        expect(
            updateActiveTabFallbackDirectGlobalFixtureMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/updateActiveTab.fallbacks.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps additional theme tests on descriptor-scoped browser fixtures", () => {
        expect.assertions(1);

        expect(
            themeAdditionalTestDirectGlobalFixtureMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/theming/core/theme.additional.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps UI state manager theme tests on descriptor-scoped matchMedia fixtures", () => {
        expect.assertions(1);

        expect(
            uiStateManagerTestDirectMatchMediaMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/state/domain/uiStateManager.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps UI state manager browser runtime access behind the runtime adapter", () => {
        expect.assertions(22);

        const uiStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/uiStateManager.ts"
            )
        );
        const uiStateManagerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/uiStateManagerRuntime.ts"
            )
        );

        expect(uiStateManagerSource).toContain("uiStateManagerRuntime.js");
        expect(uiStateManagerSource).toContain("createAbortController");
        expect(uiStateManagerSource).toContain("addWindowEventListener");
        expect(uiStateManagerSource).toContain("getSystemThemeMediaQuery");
        expect(
            directUiStateManagerBrowserRuntimePattern.test(uiStateManagerSource)
        ).toBe(false);
        expect(uiStateManagerRuntimeSource).toContain(
            "defaultUIStateManagerRuntimeScope"
        );
        expect(uiStateManagerRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(uiStateManagerRuntimeSource).toContain(
            'typeof globalThis.addEventListener === "function"'
        );
        expect(uiStateManagerRuntimeSource).toContain(
            "getMatchMedia: () => globalThis.matchMedia"
        );
        expect(uiStateManagerRuntimeSource).toContain(
            "getViewportState: () => globalThis"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "scope: UIStateManagerRuntimeScope = globalThis"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "UIStateManagerRuntimeScope = globalThis"
        );
        expect(uiStateManagerRuntimeSource).not.toContain("scope.window");
        expect(uiStateManagerRuntimeSource).not.toContain("readonly window?:");
        expect(uiStateManagerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "readonly matchMedia?:"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "readonly viewportState?:"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(uiStateManagerRuntimeSource).not.toContain("scope.eventTarget");
        expect(uiStateManagerRuntimeSource).not.toContain(
            "scope.matchMedia ??"
        );
        expect(uiStateManagerRuntimeSource).not.toContain(
            "scope.viewportState"
        );
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

    it("keeps FIT data display on renderer state facades and runtime adapters", () => {
        expect.assertions(29);

        const showFitDataSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/core/showFitData.ts"
            )
        );
        const showFitDataRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/core/showFitDataRuntime.ts"
            )
        );
        const runtimeScopeSource = showFitDataRuntimeSource.slice(
            showFitDataRuntimeSource.indexOf(
                "export interface ShowFitDataRuntimeScope"
            ),
            showFitDataRuntimeSource.indexOf(
                "export interface ShowFitDataRuntime"
            )
        );

        expect(showFitDataSource).toContain("showFitDataRuntime.js");
        expect(showFitDataSource).toContain("getShowFitDataRuntime");
        expect(showFitDataSource).toContain("rendererActiveFileState.js");
        expect(showFitDataSource).toContain("rendererMapRenderState.js");
        expect(showFitDataSource).not.toContain("state/core/stateManager.js");
        expect(showFitDataSource).not.toContain("resetRenderStates");
        expect(showFitDataSource).not.toMatch(
            /\bglobalThis\.(?:matchMedia|scrollTo)\b|(?:^|[^\w.])queueMicrotask\(/u
        );
        expect(showFitDataSource).not.toMatch(
            /\bglobalThis\.dispatchEvent\b|\bnew\s+CustomEvent\b/u
        );
        expect(showFitDataSource).toContain("showFitDataRuntime.dispatchEvent");
        expect(showFitDataRuntimeSource).toContain(
            "defaultShowFitDataRuntimeScope"
        );
        expect(showFitDataRuntimeSource).not.toContain(
            "scope: ShowFitDataRuntimeScope = globalThis"
        );
        expect(showFitDataRuntimeSource).not.toContain(
            "const defaultShowFitDataRuntimeScope: ShowFitDataRuntimeScope = globalThis"
        );
        expect(showFitDataRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(showFitDataRuntimeSource).toContain(
            "getDispatchEvent: () => globalThis.dispatchEvent"
        );
        expect(showFitDataRuntimeSource).toContain(
            "getMatchMedia: () => globalThis.matchMedia"
        );
        expect(showFitDataRuntimeSource).toContain(
            "getQueueMicrotask: () => globalThis.queueMicrotask"
        );
        expect(showFitDataRuntimeSource).toContain(
            "getScrollTo: () => globalThis.scrollTo"
        );
        expect(runtimeScopeSource).not.toContain("readonly CustomEvent?:");
        expect(runtimeScopeSource).not.toContain("readonly dispatchEvent?:");
        expect(runtimeScopeSource).not.toContain("readonly matchMedia?:");
        expect(runtimeScopeSource).not.toContain("readonly queueMicrotask?:");
        expect(runtimeScopeSource).not.toContain("readonly scrollTo?:");
        expect(showFitDataRuntimeSource).not.toContain("scope.CustomEvent");
        expect(showFitDataRuntimeSource).not.toContain("scope.dispatchEvent");
        expect(showFitDataRuntimeSource).not.toContain("scope.matchMedia");
        expect(showFitDataRuntimeSource).not.toContain("scope.queueMicrotask");
        expect(showFitDataRuntimeSource).not.toContain("scope.scrollTo");
        expect(showFitDataRuntimeSource).toContain(
            "return scope.getMatchMedia?.();"
        );
        expect(showFitDataRuntimeSource).toContain(
            "return scope.getScrollTo?.();"
        );
    });

    it("keeps map base-layer persistence on the map base-layer state facade", () => {
        expect.assertions(2);

        const renderMapSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/core/renderMap.ts")
        );

        expect(renderMapSource).toContain("mapBaseLayerState.js");
        expect(renderMapSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps render-map timing and abort controllers behind the runtime adapter", () => {
        expect.assertions(23);

        const renderMapSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/core/renderMap.ts")
        );
        const renderMapRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/core/renderMapRuntime.ts"
            )
        );
        const renderMapRuntimeScopeSource = renderMapRuntimeSource.slice(
            renderMapRuntimeSource.indexOf(
                "export interface RenderMapRuntimeScope"
            ),
            renderMapRuntimeSource.indexOf(
                "export interface RenderMapRuntime {"
            )
        );
        const directRenderMapTimingGlobalPattern =
            /\b(?:globalThis|window)\.(?:requestAnimationFrame|clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:requestAnimationFrame|clearTimeout|setTimeout)\(|\bnew\s+AbortController\b/u;
        const directRenderMapRuntimeAmbientTimerFallbackPattern =
            /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;

        expect(renderMapSource).toContain("renderMapRuntime.js");
        expect(renderMapSource).toContain("createAbortController");
        expect(directRenderMapTimingGlobalPattern.test(renderMapSource)).toBe(
            false
        );
        expect(renderMapRuntimeSource).toContain(
            "defaultRenderMapRuntimeScope"
        );
        expect(renderMapRuntimeSource).not.toContain(
            "scope: RenderMapRuntimeScope = globalThis"
        );
        expect(renderMapRuntimeSource).not.toContain(
            "const defaultRenderMapRuntimeScope: RenderMapRuntimeScope = globalThis"
        );
        expect(renderMapRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(renderMapRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(renderMapRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(renderMapRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(renderMapRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(renderMapRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(renderMapRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(renderMapRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(renderMapRuntimeSource).not.toContain("scope.AbortController");
        expect(renderMapRuntimeSource).not.toContain("scope.clearTimeout");
        expect(renderMapRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(renderMapRuntimeSource).not.toContain("scope.setTimeout");
        expect(renderMapRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(renderMapRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(renderMapRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(renderMapRuntimeSource).not.toMatch(
            directRenderMapRuntimeAmbientTimerFallbackPattern
        );
        expect(renderMapRuntimeSource).toContain(
            "renderMap requires a setTimeout runtime"
        );
    });

    it("keeps file-open handling off direct core state-manager imports", () => {
        expect.assertions(1);

        const handleOpenFileSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/handleOpenFile.ts"
            )
        );

        expect(handleOpenFileSource).not.toContain(
            "state/core/stateManager.js"
        );
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

    it("keeps state-manager defaults on scoped runtime access", () => {
        expect.assertions(13);

        const stateManagerDefaultsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/stateManagerDefaults.ts"
            )
        );
        const stateManagerDefaultsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/stateManagerDefaultsRuntime.ts"
            )
        );
        const stateManagerDefaultsRuntimeAmbientGetterPattern =
            /\bget\s+(?:document|performance)\s*\(\)\s*\{|\breturn\s+globalThis\.(?:document|performance)\b/u;

        expect(stateManagerDefaultsSource).toContain(
            "stateManagerDefaultsRuntime.js"
        );
        expect(stateManagerDefaultsSource).not.toContain(
            "globalThis.performance"
        );
        expect(stateManagerDefaultsSource).not.toContain("Date.now");
        expect(stateManagerDefaultsSource).not.toContain("typeof document");
        expect(stateManagerDefaultsSource).not.toContain("document.title");
        expect(stateManagerDefaultsRuntimeSource).not.toMatch(
            directRuntimeAmbientClockFallbackPattern
        );
        expect(stateManagerDefaultsRuntimeSource).not.toMatch(
            stateManagerDefaultsRuntimeAmbientGetterPattern
        );
        expect(stateManagerDefaultsRuntimeSource).toContain(
            "stateManagerDefaultsRuntime requires a clock"
        );
        expect(stateManagerDefaultsRuntimeSource).toContain(
            "defaultStateManagerDefaultsRuntimeScope"
        );
        expect(stateManagerDefaultsRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(stateManagerDefaultsRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(stateManagerDefaultsRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(stateManagerDefaultsRuntimeSource).not.toContain(
            "scope.performance"
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

    it("keeps Playwright popup fixtures descriptor-scoped", () => {
        expect.assertions(1);

        const directWindowOpenMutations = playwrightSmokeFiles
            .filter((relativeFile) =>
                directPlaywrightWindowOpenMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directWindowOpenMutations).toStrictEqual([]);
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

    it("keeps resize listener tests from mutating legacy chart globals", () => {
        expect.assertions(1);

        expect(
            listenersResizeChartGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/app/lifecycle/listenersResize.test.ts"
                    )
                )
            )
        ).toBe(false);
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

    it("keeps shared error handling on explicit notification callbacks and typed telemetry", () => {
        expect.assertions(13);

        const errorHandlingSource = stripComments(
            readRepositoryFile("electron-app/utils/errors/errorHandling.ts")
        );
        const errorHandlingRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/errors/errorHandlingRuntime.ts"
            )
        );

        expect(
            directShowNotificationGlobalLookupPattern.test(errorHandlingSource)
        ).toBe(false);
        expect(
            errorHandlingPerformanceMonitorGlobalLookupPattern.test(
                errorHandlingSource
            )
        ).toBe(false);
        expect(
            directErrorHandlingRuntimeGlobalPattern.test(errorHandlingSource)
        ).toBe(false);
        expect(
            directErrorHandlingEventTargetGlobalPattern.test(
                errorHandlingSource
            )
        ).toBe(false);
        expect(errorHandlingSource).toContain("notifyUser");
        expect(errorHandlingSource).toContain("errorHandlingRuntime.js");
        expect(errorHandlingRuntimeSource).toContain("getGlobalEventTarget");
        expect(errorHandlingRuntimeSource).not.toMatch(
            directErrorHandlingRuntimeAmbientGetterPattern
        );
        expect(errorHandlingRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(errorHandlingRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(errorHandlingRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(errorHandlingRuntimeSource).not.toContain("scope.eventTarget");
        expect(errorHandlingRuntimeSource).toContain(
            "defaultErrorHandlingRuntimeScope"
        );
    });

    it("keeps accent color picker listener abort-controller creation behind the runtime facade", () => {
        expect.assertions(14);

        const accentColorPickerSource = stripComments(
            readRepositoryFile("electron-app/ui/modals/accentColorPicker.ts")
        );
        const accentColorPickerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/ui/modals/accentColorPickerRuntime.ts"
            )
        );

        expect(
            directAccentColorPickerRuntimeGlobalPattern.test(
                accentColorPickerSource
            )
        ).toBe(false);
        expect(accentColorPickerSource).toContain(
            "accentColorPickerRuntime.js"
        );
        expect(accentColorPickerSource).toContain("createAbortController");
        expect(accentColorPickerSource).toContain("addDocumentKeydownListener");
        expect(accentColorPickerSource).not.toContain(
            "document.addEventListener"
        );
        expect(accentColorPickerRuntimeSource).toContain(
            "defaultAccentColorPickerRuntimeScope"
        );
        expect(accentColorPickerRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(accentColorPickerRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(accentColorPickerRuntimeSource).toContain(
            "accentColorPicker requires a document event-target runtime"
        );
        expect(accentColorPickerRuntimeSource).not.toContain(
            "scope: AccentColorPickerRuntimeScope = globalThis"
        );
        expect(accentColorPickerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(accentColorPickerRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(accentColorPickerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(accentColorPickerRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
    });

    it("keeps error handling tests off ambient performance monitor fixtures", () => {
        expect.assertions(1);

        expect(
            errorHandlingTestDirectPerformanceMonitorFixturePattern.test(
                stripComments(
                    readRepositoryFile("tests/unit/utils/errorHandling.test.ts")
                )
            )
        ).toBe(false);
    });

    it("keeps migrated renderer debug logging callers on typed state", () => {
        expect.assertions(2);

        const violations = migratedRendererDebugLoggingStateFiles
            .filter((relativeFile) =>
                directRendererDevGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
        expect(
            migratedRendererDebugLoggingStateFiles.filter((relativeFile) =>
                stripComments(readRepositoryFile(relativeFile)).includes(
                    "globalThis.window"
                )
            )
        ).toStrictEqual([]);
    });

    it("keeps renderer debug logging runtime checks behind the debug runtime adapter", () => {
        expect.assertions(9);

        for (const relativeFile of migratedRendererDebugLoggingStateFiles) {
            expect(stripComments(readRepositoryFile(relativeFile))).toContain(
                "rendererDebugRuntime.js"
            );
        }

        const rendererDebugRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/debug/rendererDebugRuntime.ts"
            )
        );

        expect(rendererDebugRuntimeSource).toContain(
            "defaultRendererDebugRuntimeScope"
        );
        expect(rendererDebugRuntimeSource).not.toContain(
            "const defaultRendererDebugRuntimeScope: RendererDebugRuntimeScope = globalThis"
        );
        expect(rendererDebugRuntimeSource).toContain(
            'Reflect.has(globalThis, "document")'
        );
        expect(rendererDebugRuntimeSource).not.toContain(
            "readonly isRendererScope?:"
        );
        expect(rendererDebugRuntimeSource).not.toContain(
            "scope.isRendererScope"
        );
        expect(rendererDebugRuntimeSource).not.toContain(
            "getWindow: () => globalThis.window"
        );
    });

    it("keeps animation debug logging clocks behind the runtime facade", () => {
        expect.assertions(12);

        const lastAnimLogSource = stripComments(
            readRepositoryFile("electron-app/utils/debug/lastAnimLog.ts")
        );
        const lastAnimLogRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/debug/lastAnimLogRuntime.ts")
        );

        expect(
            directLastAnimLogRuntimeGlobalPattern.test(lastAnimLogSource)
        ).toBe(false);
        expect(lastAnimLogSource).toContain("lastAnimLogRuntime.js");
        expect(lastAnimLogRuntimeSource).not.toMatch(
            directRuntimeAmbientClockFallbackPattern
        );
        expect(lastAnimLogRuntimeSource).not.toMatch(
            directLastAnimLogRuntimeAmbientGetterPattern
        );
        expect(lastAnimLogRuntimeSource).not.toContain("readonly dateNow?:");
        expect(lastAnimLogRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(lastAnimLogRuntimeSource).not.toContain("scope.dateNow");
        expect(lastAnimLogRuntimeSource).not.toContain("scope.performance");
        expect(lastAnimLogRuntimeSource).toContain(
            "getDateNow: () => Date.now"
        );
        expect(lastAnimLogRuntimeSource).toContain(
            "getPerformanceNow: getDefaultPerformanceNow"
        );
        expect(lastAnimLogRuntimeSource).toContain(
            "lastAnimLogRuntime requires dateNow"
        );
        expect(lastAnimLogRuntimeSource).toContain(
            "lastAnimLogRuntime requires performance.now"
        );
    });

    it("keeps animation debug logging tests off renderer dev globals", () => {
        expect.assertions(1);

        expect(
            directRendererDevGlobalPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/debug/lastAnimLog.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps strict renderer startup tests off renderer dev globals", () => {
        expect.assertions(1);

        expect(
            directRendererDevGlobalPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/electron/renderer.strict.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps renderer development debug tests from mutating retired debug globals", () => {
        expect.assertions(1);

        expect(
            rendererDevelopmentDebugGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/renderer/developmentDebugTools.test.ts"
                    )
                )
            )
        ).toBe(false);
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

    it("keeps state devtools tests from mutating retired state debug globals", () => {
        expect.assertions(1);

        expect(
            stateDevToolsTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/debug/stateDevTools.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps state integration tests from mutating retired state globals", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/utils/state/integration/stateIntegration.simple.test.ts",
            "tests/unit/utils/state/integration/stateIntegration.comprehensive.test.ts",
        ]
            .filter((relativeFile) =>
                stateIntegrationRetiredGlobalMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps state integration tests on descriptor-scoped browser fixtures", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/utils/state/integration/stateIntegration.simple.test.ts",
            "tests/unit/utils/state/integration/stateIntegration.comprehensive.test.ts",
        ]
            .filter((relativeFile) =>
                stateIntegrationBrowserGlobalFixtureMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps master state manager tests on descriptor-scoped global fixtures", () => {
        expect.assertions(1);

        expect(
            masterStateManagerTestDirectGlobalFixtureMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/state/core/masterStateManager.comprehensive.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps master state manager browser runtime access behind the runtime adapter", () => {
        expect.assertions(39);

        const masterStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/masterStateManager.ts"
            )
        );
        const masterStateRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/masterStateRuntime.ts"
            )
        );

        expect(masterStateManagerSource).toContain("masterStateRuntime.js");
        expect(masterStateManagerSource).toContain("createAbortController");
        expect(masterStateManagerSource).toContain("addDocumentEventListener");
        expect(masterStateManagerSource).not.toMatch(
            /\bnew\s+AbortController\b/u
        );
        expect(masterStateManagerSource).not.toContain("globalThis.window");
        expect(masterStateManagerSource).not.toContain("globalThis.location");
        expect(masterStateManagerSource).not.toContain(
            "globalThis.addEventListener"
        );
        expect(masterStateManagerSource).not.toContain(
            "globalThis.dispatchEvent"
        );
        expect(masterStateManagerSource).not.toContain(
            "window.addEventListener"
        );
        expect(masterStateManagerSource).not.toContain(
            "document.addEventListener"
        );
        expect(masterStateManagerSource).toContain("stateStorageRuntime.js");
        expect(masterStateManagerSource).not.toContain("localStorage.");
        expect(masterStateRuntimeSource).toContain(
            "defaultMasterStateRuntimeScope"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "scope: MasterStateRuntimeScope = globalThis"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "const defaultMasterStateRuntimeScope: MasterStateRuntimeScope = globalThis"
        );
        expect(masterStateRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(masterStateRuntimeSource).toContain(
            "getAddEventListener: () => globalThis.addEventListener"
        );
        expect(masterStateRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(masterStateRuntimeSource).toContain(
            'Reflect.get(globalThis, "__DEVELOPMENT__") === true'
        );
        expect(masterStateRuntimeSource).toContain(
            "getDispatchEvent: () => globalThis.dispatchEvent"
        );
        expect(masterStateRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(masterStateRuntimeSource).toContain(
            "getLocation: () => globalThis.location"
        );
        expect(masterStateRuntimeSource).not.toContain("globalThis.window");
        expect(masterStateRuntimeSource).not.toContain("getWindow");
        expect(masterStateRuntimeSource).toContain(
            "getScopeDevelopmentFlag(scope) === true"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly __DEVELOPMENT__?:"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly dispatchEvent?:"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(masterStateRuntimeSource).not.toContain("readonly location?:");
        expect(masterStateRuntimeSource).not.toContain("scope.__DEVELOPMENT__");
        expect(masterStateRuntimeSource).not.toContain("scope.AbortController");
        expect(masterStateRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(masterStateRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(masterStateRuntimeSource).not.toContain("scope.dispatchEvent");
        expect(masterStateRuntimeSource).not.toContain("scope.eventTarget");
        expect(masterStateRuntimeSource).not.toContain("scope.location");
    });

    it("keeps computed state manager theme media reads behind the runtime adapter", () => {
        expect.assertions(9);

        const computedStateManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/computedStateManager.ts"
            )
        );
        const computedStateManagerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/core/computedStateManagerRuntime.ts"
            )
        );

        expect(computedStateManagerSource).toContain(
            "computedStateManagerRuntime.js"
        );
        expect(computedStateManagerSource).toContain("isDarkSchemePreferred");
        expect(computedStateManagerSource).not.toContain(
            "globalThis.matchMedia"
        );
        expect(computedStateManagerSource).not.toContain(
            "prefers-color-scheme: dark"
        );
        expect(computedStateManagerRuntimeSource).toContain(
            "defaultComputedStateManagerRuntimeScope"
        );
        expect(computedStateManagerRuntimeSource).not.toContain(
            "scope: ComputedStateManagerRuntimeScope = globalThis"
        );
        expect(computedStateManagerRuntimeSource).toContain("getMatchMedia");
        expect(computedStateManagerRuntimeSource).not.toContain(
            "readonly matchMedia?:"
        );
        expect(computedStateManagerRuntimeSource).not.toContain(
            "scope.matchMedia"
        );
    });

    it("keeps state development tools on typed state and runtime access", () => {
        expect.assertions(5);

        const stateDevToolsSource = stripComments(
            readRepositoryFile("electron-app/utils/debug/stateDevTools.ts")
        );

        expect(stateDevToolsSource).toContain("debugStateAccess.js");
        expect(stateDevToolsSource).toContain("stateDevToolsRuntime.js");
        expect(stateDevToolsSource).not.toContain("state/core/stateManager.js");
        expect(stateDevToolsSource).not.toContain("globalThis.window");
        expect(stateDevToolsSource).not.toContain("globalThis.location");
    });

    it("keeps state development tools interval APIs behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedStateDevToolsRuntimeFiles
            .filter((relativeFile) =>
                directStateDevToolsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const stateDevToolsSource = stripComments(
            readRepositoryFile("electron-app/utils/debug/stateDevTools.ts")
        );
        const stateDevToolsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/debug/stateDevToolsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(stateDevToolsSource).toContain("stateDevToolsRuntime.js");
        expect(stateDevToolsRuntimeSource).not.toMatch(
            directStateDevToolsRuntimeAmbientIntervalFallbackPattern
        );
        expect(stateDevToolsRuntimeSource).toContain(
            "defaultStateDevToolsRuntimeScope"
        );
        expect(stateDevToolsRuntimeSource).not.toContain(
            "scope: StateDevToolsRuntimeScope = globalThis"
        );
        expect(stateDevToolsRuntimeSource).not.toContain(
            "const defaultStateDevToolsRuntimeScope: StateDevToolsRuntimeScope = globalThis"
        );
        expect(stateDevToolsRuntimeSource).toContain(
            "getClearInterval: () => globalThis.clearInterval"
        );
        expect(stateDevToolsRuntimeSource).toContain(
            'getIsRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(stateDevToolsRuntimeSource).toContain(
            "getSetInterval: () => globalThis.setInterval"
        );
        expect(stateDevToolsRuntimeSource).not.toContain(
            "readonly clearInterval?:"
        );
        expect(stateDevToolsRuntimeSource).not.toContain("readonly location?:");
        expect(stateDevToolsRuntimeSource).not.toContain(
            "readonly setInterval?:"
        );
        expect(stateDevToolsRuntimeSource).not.toContain("scope.clearInterval");
        expect(stateDevToolsRuntimeSource).not.toContain("scope.location");
        expect(stateDevToolsRuntimeSource).not.toContain("scope.setInterval");
        expect(stateDevToolsRuntimeSource).not.toContain(
            "readonly isRendererScope?:"
        );
        expect(stateDevToolsRuntimeSource).not.toContain(
            "scope.isRendererScope"
        );
        expect(stateDevToolsRuntimeSource).not.toContain(
            "getWindow: () => globalThis.window"
        );
        expect(stateDevToolsRuntimeSource).toContain(
            "stateDevToolsRuntime requires setInterval"
        );
    });

    it("keeps state integration runtime APIs behind the runtime facade", () => {
        expect.assertions(17);

        const violations = migratedStateIntegrationRuntimeFiles
            .filter((relativeFile) =>
                directStateIntegrationRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const stateIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/stateIntegration.ts"
            )
        );
        const stateIntegrationRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/stateIntegrationRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(stateIntegrationSource).toContain("stateIntegrationRuntime.js");
        expect(stateIntegrationRuntimeSource).not.toMatch(
            directStateIntegrationRuntimeAmbientFallbackPattern
        );
        expect(stateIntegrationRuntimeSource).not.toMatch(
            directStateIntegrationRuntimeAmbientGetterPattern
        );
        expect(stateIntegrationRuntimeSource).toContain(
            "stateIntegrationRuntime requires setTimeout"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly clearInterval?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly setInterval?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "scope.clearInterval"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "scope.localStorage"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "scope.performance"
        );
        expect(stateIntegrationRuntimeSource).not.toContain(
            "scope.setInterval"
        );
        expect(stateIntegrationRuntimeSource).not.toContain("scope.setTimeout");
    });

    it("keeps renderer state integration timers and abort controllers behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedRendererStateIntegrationRuntimeFiles
            .filter((relativeFile) =>
                directRendererStateIntegrationRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const rendererStateIntegrationSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/rendererStateIntegration.ts"
            )
        );
        const rendererStateIntegrationRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/integration/rendererStateIntegrationRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(rendererStateIntegrationSource).toContain(
            "rendererStateIntegrationRuntime.js"
        );
        expect(rendererStateIntegrationSource).toContain(
            "createAbortController"
        );
        expect(rendererStateIntegrationSource).toContain(
            "addDocumentClickListener"
        );
        expect(rendererStateIntegrationSource).not.toContain(
            "document.addEventListener"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toMatch(
            directRendererStateIntegrationRuntimeAmbientTimerFallbackPattern
        );
        expect(rendererStateIntegrationRuntimeSource).not.toMatch(
            directRendererStateIntegrationRuntimeAmbientGetterPattern
        );
        expect(rendererStateIntegrationRuntimeSource).toContain(
            "defaultRendererStateIntegrationRuntimeScope"
        );
        expect(rendererStateIntegrationRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(rendererStateIntegrationRuntimeSource).toContain(
            "rendererStateIntegration requires a document event-target runtime"
        );
        expect(rendererStateIntegrationRuntimeSource).toContain(
            "rendererStateIntegration requires a setTimeout runtime"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(rendererStateIntegrationRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
    });

    it("keeps app lifecycle actions on the app-actions state facade", () => {
        expect.assertions(2);

        const appActionsSource = stripComments(
            readRepositoryFile("electron-app/utils/app/lifecycle/appActions.ts")
        );

        expect(appActionsSource).toContain("appActionsState.js");
        expect(appActionsSource).not.toContain("state/core/stateManager.js");
    });

    it("keeps resource manager window cleanup and timer clearing behind the runtime adapter", () => {
        expect.assertions(19);

        const resourceManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/resourceManager.ts"
            )
        );
        const resourceManagerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/resourceManagerRuntime.ts"
            )
        );
        const directResourceManagerRuntimeGlobalPattern =
            /\b(?:globalThis|window)\.(?:clearTimeout|addEventListener)\b|(?:^|[^\w.])clearTimeout\(/u;
        const directResourceManagerRuntimeAmbientTimerFallbackPattern =
            /\bscope\.clearTimeout\s*\?\?\s*globalThis\.clearTimeout\b|\bglobalThis\.clearTimeout\s*\(/u;

        expect(resourceManagerSource).toContain("resourceManagerRuntime.js");
        expect(resourceManagerSource).not.toContain("globalThis.window");
        expect(resourceManagerSource).not.toContain("window.addEventListener");
        expect(resourceManagerSource).not.toContain("AbortController");
        expect(
            directResourceManagerRuntimeGlobalPattern.test(
                resourceManagerSource
            )
        ).toBe(false);
        expect(resourceManagerRuntimeSource).not.toMatch(
            directResourceManagerRuntimeAmbientTimerFallbackPattern
        );
        expect(resourceManagerRuntimeSource).toContain(
            "defaultResourceManagerRuntimeScope"
        );
        expect(resourceManagerRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(resourceManagerRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(resourceManagerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(resourceManagerRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(resourceManagerRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(resourceManagerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(resourceManagerRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(resourceManagerRuntimeSource).not.toContain("scope.eventTarget");
        expect(resourceManagerRuntimeSource).not.toContain(
            "scope: ResourceManagerRuntimeScope = globalThis"
        );
        expect(resourceManagerRuntimeSource).not.toContain("scope.window");
        expect(resourceManagerRuntimeSource).not.toContain(
            "WindowListenerTarget"
        );
        expect(resourceManagerRuntimeSource).toContain(
            "resourceManager requires clearTimeout"
        );
    });

    it("keeps recent-files context-menu viewport, focus timers, and abort controllers behind the runtime adapter", () => {
        expect.assertions(30);

        const recentFilesContextMenuSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/recentFilesContextMenu.ts"
            )
        );
        const recentFilesContextMenuRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/recentFilesContextMenuRuntime.ts"
            )
        );
        const runtimeScopeSource = recentFilesContextMenuRuntimeSource.slice(
            recentFilesContextMenuRuntimeSource.indexOf(
                "export interface RecentFilesContextMenuRuntimeScope"
            ),
            recentFilesContextMenuRuntimeSource.indexOf(
                "export type RecentFilesContextMenuTimer"
            )
        );
        const directRecentFilesContextMenuRuntimeGlobalPattern =
            /\b(?:globalThis|window)\.(?:clearTimeout|innerHeight|innerWidth|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(|\bnew\s+AbortController\b/u;
        const directRecentFilesContextMenuAmbientTimerFallbackPattern =
            /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;

        expect(recentFilesContextMenuSource).toContain(
            "recentFilesContextMenuRuntime.js"
        );
        expect(recentFilesContextMenuSource).toContain("createAbortController");
        expect(recentFilesContextMenuSource).toContain(
            "addDocumentMousedownListener"
        );
        expect(recentFilesContextMenuSource).not.toContain(
            "document.addEventListener"
        );
        expect(recentFilesContextMenuSource).not.toContain("globalThis.window");
        expect(recentFilesContextMenuSource).not.toContain("window.innerWidth");
        expect(recentFilesContextMenuSource).not.toContain(
            "window.innerHeight"
        );
        expect(
            directRecentFilesContextMenuRuntimeGlobalPattern.test(
                recentFilesContextMenuSource
            )
        ).toBe(false);
        expect(recentFilesContextMenuRuntimeSource).not.toMatch(
            directRecentFilesContextMenuAmbientTimerFallbackPattern
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "defaultRecentFilesContextMenuRuntimeScope"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "getViewport: () => ({"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope: RecentFilesContextMenuRuntimeScope = globalThis"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "RecentFilesContextMenuRuntimeScope = globalThis"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.window"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "recent files context menu requires a document event-target runtime"
        );
        expect(recentFilesContextMenuRuntimeSource).toContain(
            "recent files context menu requires a setTimeout runtime"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain("readonly clearTimeout?:");
        expect(runtimeScopeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(runtimeScopeSource).not.toContain("readonly setTimeout?:");
        expect(runtimeScopeSource).not.toContain("readonly viewport?:");
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(recentFilesContextMenuRuntimeSource).not.toContain(
            "scope.viewport"
        );
    });

    it("keeps lifecycle listener cleanup timers and abort controllers behind the runtime adapter", () => {
        expect.assertions(26);

        const lifecycleListenersSource = stripComments(
            readRepositoryFile("electron-app/utils/app/lifecycle/listeners.ts")
        );
        const lifecycleListenersRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/listenersRuntime.ts"
            )
        );
        const directLifecycleListenersTimerGlobalPattern =
            /\b(?:globalThis|window)\.(?:clearTimeout|setTimeout)\b|(?:^|[^\w.])(?:clearTimeout|setTimeout)\(|\bnew\s+AbortController\b/u;
        const directLifecycleListenersAmbientTimerFallbackPattern =
            /\bscope\.(?:clearTimeout|setTimeout)\s*\?\?\s*globalThis\.(?:clearTimeout|setTimeout)\b|\bglobalThis\.(?:clearTimeout|setTimeout)\s*\(/u;
        const directLifecycleListenersAmbientScopePattern =
            /\bscope\.(?:AbortController|clearTimeout|print|process|setTimeout)\b|\bscope:\s*LifecycleListenersRuntimeScope\s*=\s*globalThis\b|\bconst\s+defaultLifecycleListenersRuntimeScope:\s*LifecycleListenersRuntimeScope\s*=\s*globalThis\b/u;

        expect(lifecycleListenersSource).toContain("listenersRuntime.js");
        expect(lifecycleListenersSource).toContain("createAbortController");
        expect(lifecycleListenersSource).not.toContain("lifecycleGlobal");
        expect(lifecycleListenersSource).toContain(
            "runtime.isTestEnvironment()"
        );
        expect(lifecycleListenersSource).toContain("lifecycleRuntime.print()");
        expect(
            directLifecycleListenersTimerGlobalPattern.test(
                lifecycleListenersSource
            )
        ).toBe(false);
        expect(lifecycleListenersRuntimeSource).not.toMatch(
            directLifecycleListenersAmbientTimerFallbackPattern
        );
        expect(lifecycleListenersRuntimeSource).not.toMatch(
            directLifecycleListenersAmbientScopePattern
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "defaultLifecycleListenersRuntimeScope"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "scope: LifecycleListenersRuntimeScope = globalThis"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "lifecycle listeners require a setTimeout runtime"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "readonly print?:"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "readonly process?:"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(lifecycleListenersRuntimeSource).not.toContain("scope.print");
        expect(lifecycleListenersRuntimeSource).not.toContain("scope.process");
        expect(lifecycleListenersRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "getPrint: getGlobalPrint"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "getProcess: getGlobalProcess"
        );
        expect(lifecycleListenersRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
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
        expect.assertions(10);

        const violations = migratedChartInstanceRegistryFiles
            .filter((relativeFile) =>
                directChartInstanceGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const renderChartRuntimeHelpersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartRuntimeHelpers.ts"
            )
        );
        const renderChartRuntimeHelpersRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartRuntimeHelpersRuntime.ts"
            )
        );
        const renderChartRuntimeHelpersRuntimeScopeSource =
            renderChartRuntimeHelpersRuntimeSource.slice(
                renderChartRuntimeHelpersRuntimeSource.indexOf(
                    "export interface RenderChartRuntimeHelpersRuntimeScope"
                ),
                renderChartRuntimeHelpersRuntimeSource.indexOf(
                    "export interface RenderChartRuntimeHelpersRuntime"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(renderChartRuntimeHelpersSource).not.toContain(
            "getGlobalChartActions"
        );
        expect(renderChartRuntimeHelpersSource).toContain(
            "renderChartRuntimeHelpersRuntime.js"
        );
        expect(renderChartRuntimeHelpersSource).not.toContain(
            "return globalThis"
        );
        expect(renderChartRuntimeHelpersRuntimeSource).toContain(
            "defaultRenderChartRuntimeHelpersRuntimeScope"
        );
        expect(renderChartRuntimeHelpersRuntimeSource).toContain(
            "getChartRuntimeEnvironment: () => globalThis"
        );
        expect(renderChartRuntimeHelpersRuntimeSource).not.toContain(
            "scope: RenderChartRuntimeHelpersRuntimeScope = globalThis"
        );
        expect(renderChartRuntimeHelpersRuntimeScopeSource).not.toContain(
            "readonly chartRuntimeEnvironment?:"
        );
        expect(renderChartRuntimeHelpersRuntimeSource).not.toContain(
            "scope.chartRuntimeEnvironment"
        );
        expect(renderChartRuntimeHelpersRuntimeSource).toContain(
            "return scope.getChartRuntimeEnvironment?.();"
        );
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

    it("keeps renderer development debug runtime metadata behind the runtime facade", () => {
        expect.assertions(14);

        const violations = migratedRendererDevelopmentDebugToolsRuntimeFiles
            .filter((relativeFile) =>
                directRendererDevelopmentDebugToolsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const developmentDebugToolsSource = stripComments(
            readRepositoryFile("electron-app/renderer/developmentDebugTools.ts")
        );
        const developmentDebugToolsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/developmentDebugToolsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(developmentDebugToolsSource).toContain(
            "developmentDebugToolsRuntime.js"
        );
        expect(developmentDebugToolsRuntimeSource).toContain(
            "defaultRendererDevelopmentDebugToolsRuntimeScope"
        );
        expect(developmentDebugToolsRuntimeSource).not.toMatch(
            directRendererDevelopmentDebugToolsRuntimeAmbientGetterPattern
        );
        expect(developmentDebugToolsRuntimeSource).not.toMatch(
            directRendererDevelopmentDebugToolsRuntimeAmbientScopePattern
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "readonly location?:"
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "readonly navigator?:"
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "readonly performance?:"
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "scope.location"
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "scope.navigator"
        );
        expect(developmentDebugToolsRuntimeSource).not.toContain(
            "scope.performance"
        );
        expect(developmentDebugToolsRuntimeSource).toContain(
            "getLocation: () => globalThis.location"
        );
        expect(developmentDebugToolsRuntimeSource).toContain(
            "getNavigator: () => globalThis.navigator"
        );
        expect(developmentDebugToolsRuntimeSource).toContain(
            "getPerformance: () => globalThis.performance"
        );
    });

    it("keeps table renderer browser APIs behind the runtime facade", () => {
        expect.assertions(34);

        const violations = migratedRenderTableRuntimeFiles
            .filter((relativeFile) =>
                directRenderTableRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const renderTableSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/core/renderTable.ts"
            )
        );
        const renderTableRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/core/renderTableRuntime.ts"
            )
        );
        const renderTableRuntimeScopeSource = renderTableRuntimeSource.slice(
            renderTableRuntimeSource.indexOf(
                "export interface RenderTableRuntimeScope"
            ),
            renderTableRuntimeSource.indexOf(
                "export interface RenderTableRuntime {"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(renderTableSource).toContain("renderTableRuntime.js");
        expect(renderTableRuntimeSource).not.toMatch(
            directRenderTableRuntimeAmbientTimerFallbackPattern
        );
        expect(renderTableRuntimeSource).toContain(
            "defaultRenderTableRuntimeScope"
        );
        expect(renderTableRuntimeSource).not.toContain(
            "scope: RenderTableRuntimeScope = globalThis"
        );
        expect(renderTableRuntimeSource).not.toContain(
            "const defaultRenderTableRuntimeScope: RenderTableRuntimeScope = globalThis"
        );
        expect(renderTableRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(renderTableRuntimeSource).toContain(
            "getComputedStyleFunction: () => globalThis.getComputedStyle"
        );
        expect(renderTableRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(renderTableRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(renderTableRuntimeSource).toContain(
            "getHTMLTableCellElement: () => globalThis.HTMLTableCellElement"
        );
        expect(renderTableRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(renderTableRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly getComputedStyle?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly HTMLTableCellElement?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(renderTableRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(renderTableRuntimeSource).not.toContain("scope.clearTimeout");
        expect(renderTableRuntimeSource).not.toContain("scope.document");
        expect(renderTableRuntimeSource).not.toContain(
            "scope.getComputedStyle;"
        );
        expect(renderTableRuntimeSource).not.toContain("scope.HTMLElement");
        expect(renderTableRuntimeSource).not.toContain(
            "scope.HTMLTableCellElement"
        );
        expect(renderTableRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(renderTableRuntimeSource).not.toContain("scope.setTimeout");
        expect(renderTableRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "return scope.getComputedStyleFunction?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "return scope.getHTMLElement?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "return scope.getHTMLTableCellElement?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(renderTableRuntimeSource).toContain(
            "renderTable requires a setTimeout runtime"
        );
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
                "electron-app/renderer/rendererVendorChartData.ts"
            )
        );

        expect(vendorChartDataEntry).toContain("dataTableRuntime: DataTable");
        expect(vendorChartDataEntry).not.toContain(
            'defineMissingGlobal("DataTable"'
        );
    });

    it("keeps Chart.js wired through the runtime adapter instead of renderer globals", () => {
        expect.assertions(6);

        const vendorChartDataEntry = stripComments(
            readRepositoryFile(
                "electron-app/renderer/rendererVendorChartData.ts"
            )
        );

        expect(vendorChartDataEntry).toContain("chartRuntime: Chart");
        expect(vendorChartDataEntry).toContain("chartZoomPlugin: zoomPlugin");
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

    it("keeps Chart.js and DataTables runtime adapters off global symbol registries", () => {
        expect.assertions(11);

        const chartRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/charts/core/chartRuntime.ts")
        );
        const chartInstanceRegistrySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartInstanceRegistry.ts"
            )
        );
        const dataTableRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/core/dataTableRuntime.ts"
            )
        );
        const rendererVendorSharedSource = stripComments(
            readRepositoryFile("electron-app/renderer/rendererVendorShared.ts")
        );

        expect(chartRuntimeSource).not.toContain("Symbol.for");
        expect(chartRuntimeSource).not.toContain("globalThis");
        expect(chartInstanceRegistrySource).not.toContain("Symbol.for");
        expect(chartInstanceRegistrySource).not.toContain("globalThis");
        expect(dataTableRuntimeSource).not.toContain("Symbol.for");
        expect(dataTableRuntimeSource).not.toContain("globalThis");
        expect(rendererVendorSharedSource).not.toContain("Symbol.for");
        expect(rendererVendorSharedSource).not.toContain("globalThis");
        expect(rendererVendorSharedSource).not.toContain("new CustomEvent");
        expect(rendererVendorSharedSource).not.toContain("globalThis &");
        expect(rendererVendorSharedSource).not.toContain(
            "rendererVendorRuntimePayloads"
        );
    });

    it("keeps core vendor runtime adapters off global symbol registries", () => {
        expect.assertions(8);

        const coreRuntimeSources = [
            "electron-app/utils/dom/domPurifyRuntime.ts",
            "electron-app/utils/files/export/exportZipRuntime.ts",
            "electron-app/utils/rendering/helpers/arqueroRuntime.ts",
            "electron-app/utils/ui/controls/screenfullRuntime.ts",
        ].map((relativeFile) =>
            stripComments(readRepositoryFile(relativeFile))
        );

        for (const source of coreRuntimeSources) {
            expect(source).not.toContain("Symbol.for");
            expect(source).not.toContain("globalThis");
        }
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

    it("keeps DOM helper listener cleanup behind the runtime facade", () => {
        expect.assertions(8);

        const domHelpersSource = stripComments(
            readRepositoryFile("electron-app/utils/dom/domHelpers.ts")
        );
        const domHelpersRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/dom/domHelpersRuntime.ts")
        );

        expect(
            directDomHelpersRuntimeGlobalPattern.test(domHelpersSource)
        ).toBe(false);
        expect(domHelpersSource).toContain("domHelpersRuntime.js");
        expect(domHelpersRuntimeSource).toContain(
            "defaultDomHelpersRuntimeScope"
        );
        expect(domHelpersRuntimeSource).not.toContain(
            "const defaultDomHelpersRuntimeScope: DomHelpersRuntimeScope = globalThis"
        );
        expect(domHelpersRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(domHelpersRuntimeSource).not.toMatch(
            directDomHelpersRuntimeAmbientGetterPattern
        );
        expect(domHelpersRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(domHelpersRuntimeSource).not.toContain("scope.AbortController");
    });

    it("keeps DOMPurify wired through the runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/rendererVendorCore.ts")
        );

        expect(vendorCoreEntry).toContain("domPurifyRuntime: DOMPurify");
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
            readRepositoryFile("electron-app/renderer/rendererVendorCore.ts")
        );

        expect(vendorCoreEntry).toContain("arqueroRuntime: arquero");
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
            readRepositoryFile("electron-app/renderer/rendererVendorCore.ts")
        );

        expect(vendorCoreEntry).toContain("exportZipRuntime: JSZip");
        expect(vendorCoreEntry).not.toContain('defineMissingGlobal("JSZip"');
    });

    it("keeps print button browser APIs behind the runtime facade", () => {
        expect.assertions(18);

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
        const createPrintButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/createPrintButtonRuntime.ts"
            )
        );
        const runtimeScopeSource = createPrintButtonRuntimeSource.slice(
            createPrintButtonRuntimeSource.indexOf(
                "export interface CreatePrintButtonRuntimeScope"
            ),
            createPrintButtonRuntimeSource.indexOf(
                "export interface CreatePrintButtonRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createPrintButtonSource).toContain(
            "createPrintButtonRuntime.js"
        );
        expect(createPrintButtonSource).toContain("createAbortController");
        expect(createPrintButtonRuntimeSource).toContain(
            "defaultCreatePrintButtonRuntimeScope"
        );
        expect(createPrintButtonRuntimeSource).not.toContain(
            "scope: CreatePrintButtonRuntimeScope = globalThis"
        );
        expect(createPrintButtonRuntimeSource).not.toContain(
            "CreatePrintButtonRuntimeScope =\n    globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly print?:");
        expect(createPrintButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createPrintButtonRuntimeSource).not.toContain("scope.document");
        expect(createPrintButtonRuntimeSource).not.toContain("scope.print");
        expect(createPrintButtonRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(createPrintButtonRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(createPrintButtonRuntimeSource).toContain(
            "getPrint: () => globalThis.print"
        );
        expect(createPrintButtonRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(createPrintButtonRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(createPrintButtonRuntimeSource).toContain(
            "scope.getPrint?.()?.();"
        );
    });

    it("keeps CSV clipboard browser APIs behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedCopyTableAsCSVRuntimeFiles
            .filter((relativeFile) =>
                directCopyTableAsCSVRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const copyTableAsCSVSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/copyTableAsCSV.ts"
            )
        );
        const copyTableAsCSVRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/copyTableAsCSVRuntime.ts"
            )
        );
        const runtimeScopeSource = copyTableAsCSVRuntimeSource.slice(
            copyTableAsCSVRuntimeSource.indexOf(
                "export interface CopyTableAsCSVRuntimeScope"
            ),
            copyTableAsCSVRuntimeSource.indexOf(
                "export interface CopyTableAsCSVRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(copyTableAsCSVSource).toContain("copyTableAsCSVRuntime.js");
        expect(copyTableAsCSVRuntimeSource).toContain(
            "defaultCopyTableAsCSVRuntimeScope"
        );
        expect(copyTableAsCSVRuntimeSource).not.toContain(
            "scope: CopyTableAsCSVRuntimeScope = globalThis"
        );
        expect(copyTableAsCSVRuntimeSource).not.toContain(
            "CopyTableAsCSVRuntimeScope =\n    globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly navigator?:");
        expect(copyTableAsCSVRuntimeSource).not.toContain("scope.document");
        expect(copyTableAsCSVRuntimeSource).not.toContain("scope.navigator");
        expect(copyTableAsCSVRuntimeSource).toContain(
            "getClipboard: () => globalThis.navigator.clipboard"
        );
        expect(copyTableAsCSVRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(copyTableAsCSVRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(copyTableAsCSVRuntimeSource).toContain(
            "const clipboard = scope.getClipboard?.();"
        );
    });

    it("keeps GPX export button browser APIs behind the runtime facade", () => {
        expect.assertions(19);

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
        const createExportGPXButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/export/createExportGPXButtonRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createExportGPXButtonSource).toContain(
            "createExportGPXButtonRuntime.js"
        );
        expect(createExportGPXButtonSource).toContain("createAbortController");
        expect(createExportGPXButtonRuntimeSource).not.toMatch(
            directCreateExportGPXButtonRuntimeAmbientFallbackPattern
        );
        expect(createExportGPXButtonRuntimeSource).toContain(
            "defaultCreateExportGPXButtonRuntimeScope"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "scope: CreateExportGPXButtonRuntimeScope = globalThis"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "const defaultCreateExportGPXButtonRuntimeScope: CreateExportGPXButtonRuntimeScope = globalThis"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "readonly URL?:"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(createExportGPXButtonRuntimeSource).not.toContain("scope.URL");
        expect(createExportGPXButtonRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(createExportGPXButtonRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(createExportGPXButtonRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(createExportGPXButtonRuntimeSource).toContain(
            "getURL: () => globalThis.URL"
        );
    });

    it("keeps add-FIT-map button browser APIs behind the runtime facade", () => {
        expect.assertions(10);

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
        const createAddFitFileToMapButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createAddFitFileToMapButtonRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createAddFitFileToMapButtonRuntimeSource).not.toMatch(
            directCreateAddFitFileToMapButtonRuntimeAmbientFallbackPattern
        );
        expect(createAddFitFileToMapButtonRuntimeSource).not.toMatch(
            directCreateAddFitFileToMapButtonRuntimeAmbientGetterPattern
        );
        expect(createAddFitFileToMapButtonSource).toContain(
            "createAddFitFileToMapButtonRuntime.js"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(createAddFitFileToMapButtonRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
    });

    it("keeps exit-fullscreen overlay browser APIs behind the runtime facade", () => {
        expect.assertions(11);

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
        const addExitFullscreenOverlayRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addExitFullscreenOverlayRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(addExitFullscreenOverlaySource).toContain(
            "addExitFullscreenOverlayRuntime.js"
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toMatch(
            directAddExitFullscreenOverlayRuntimeAmbientFallbackPattern
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toMatch(
            directAddExitFullscreenOverlayRuntimeAmbientGetterPattern
        );
        expect(addExitFullscreenOverlayRuntimeSource).toContain(
            "defaultAddExitFullscreenOverlayRuntimeScope"
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(addExitFullscreenOverlayRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(addExitFullscreenOverlayRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(addExitFullscreenOverlayRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
    });

    it("keeps exit-fullscreen overlay removal browser APIs behind the runtime facade", () => {
        expect.assertions(9);

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
        const removeExitFullscreenOverlayRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/removeExitFullscreenOverlayRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(removeExitFullscreenOverlaySource).toContain(
            "removeExitFullscreenOverlayRuntime.js"
        );
        expect(removeExitFullscreenOverlayRuntimeSource).not.toMatch(
            directRemoveExitFullscreenOverlayRuntimeAmbientFallbackPattern
        );
        expect(removeExitFullscreenOverlayRuntimeSource).not.toMatch(
            directRemoveExitFullscreenOverlayRuntimeAmbientGetterPattern
        );
        expect(removeExitFullscreenOverlayRuntimeSource).toContain(
            "defaultRemoveExitFullscreenOverlayRuntimeScope"
        );
        expect(removeExitFullscreenOverlayRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(removeExitFullscreenOverlayRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(removeExitFullscreenOverlayRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(removeExitFullscreenOverlayRuntimeSource).toContain(
            "runtimeDocument: Readonly<Document>"
        );
    });

    it("keeps power-estimation button browser APIs behind the runtime facade", () => {
        expect.assertions(10);

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
        const createPowerEstimationButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerEstimationButtonRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createPowerEstimationButtonRuntimeSource).not.toMatch(
            directCreatePowerEstimationButtonRuntimeAmbientFallbackPattern
        );
        expect(createPowerEstimationButtonRuntimeSource).not.toMatch(
            directCreatePowerEstimationButtonRuntimeAmbientGetterPattern
        );
        expect(createPowerEstimationButtonSource).toContain(
            "createPowerEstimationButtonRuntime.js"
        );
        expect(createPowerEstimationButtonRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(createPowerEstimationButtonRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(createPowerEstimationButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createPowerEstimationButtonRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(createPowerEstimationButtonRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(createPowerEstimationButtonRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
    });

    it("keeps power-estimation settings modal listener abort-controller creation behind the runtime facade", () => {
        expect.assertions(16);

        const violations = migratedOpenPowerEstimationSettingsModalRuntimeFiles
            .filter((relativeFile) =>
                directOpenPowerEstimationSettingsModalRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const powerEstimationSettingsModalSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/openPowerEstimationSettingsModal.ts"
            )
        );
        const powerEstimationSettingsModalRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/modals/openPowerEstimationSettingsModalRuntime.ts"
            )
        );
        const runtimeScopeSource =
            powerEstimationSettingsModalRuntimeSource.slice(
                powerEstimationSettingsModalRuntimeSource.indexOf(
                    "export interface OpenPowerEstimationSettingsModalRuntimeScope"
                ),
                powerEstimationSettingsModalRuntimeSource.indexOf(
                    "export interface OpenPowerEstimationSettingsModalRuntime"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(powerEstimationSettingsModalSource).toContain(
            "openPowerEstimationSettingsModalRuntime.js"
        );
        expect(powerEstimationSettingsModalSource).toContain(
            "createAbortController"
        );
        expect(powerEstimationSettingsModalSource).toContain(
            "addDocumentKeydownListener"
        );
        expect(powerEstimationSettingsModalSource).not.toContain(
            "document.addEventListener"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "defaultOpenPowerEstimationSettingsModalRuntimeScope"
        );
        expect(powerEstimationSettingsModalRuntimeSource).not.toContain(
            "scope: OpenPowerEstimationSettingsModalRuntimeScope = globalThis"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(powerEstimationSettingsModalRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(powerEstimationSettingsModalRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(powerEstimationSettingsModalRuntimeSource).toContain(
            "return scope.getDocumentEventTarget?.();"
        );
    });

    it("keeps marker-count selector browser APIs behind the runtime facade", () => {
        expect.assertions(14);

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
        const createMarkerCountSelectorRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createMarkerCountSelectorRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(createMarkerCountSelectorSource).toContain(
            "createMarkerCountSelectorRuntime.js"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toMatch(
            directCreateMarkerCountSelectorRuntimeAmbientFallbackPattern
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toMatch(
            directCreateMarkerCountSelectorRuntimeAmbientGetterPattern
        );
        expect(createMarkerCountSelectorRuntimeSource).toContain(
            "defaultCreateMarkerCountSelectorRuntimeScope"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "readonly Event?:"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(createMarkerCountSelectorRuntimeSource).not.toContain(
            "scope.Event"
        );
        expect(createMarkerCountSelectorRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(createMarkerCountSelectorRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(createMarkerCountSelectorRuntimeSource).toContain(
            "getEvent: () => globalThis.Event"
        );
    });

    it("keeps data-point filter control browser APIs behind the runtime facade", () => {
        expect.assertions(17);

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
        const dataPointFilterControlRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createDataPointFilterControlRuntime.ts"
            )
        );
        const runtimeScopeSource = dataPointFilterControlRuntimeSource.slice(
            dataPointFilterControlRuntimeSource.indexOf(
                "export interface CreateDataPointFilterControlRuntimeScope"
            ),
            dataPointFilterControlRuntimeSource.indexOf(
                "export interface CreateDataPointFilterControlRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(dataPointFilterControlSource).toContain(
            "createDataPointFilterControlRuntime.js"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "defaultCreateDataPointFilterControlRuntimeScope"
        );
        expect(dataPointFilterControlRuntimeSource).not.toContain(
            "scope: CreateDataPointFilterControlRuntimeScope = globalThis"
        );
        expect(dataPointFilterControlRuntimeSource).not.toContain(
            "CreateDataPointFilterControlRuntimeScope =\n    globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly queueMicrotask?:");
        expect(dataPointFilterControlRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(dataPointFilterControlRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(dataPointFilterControlRuntimeSource).not.toContain(
            "scope.queueMicrotask"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "getQueueMicrotask: () => globalThis.queueMicrotask"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(dataPointFilterControlRuntimeSource).toContain(
            "const microtaskScheduler = scope.getQueueMicrotask?.();"
        );
    });

    it("keeps data-point filter control tests on descriptor-scoped async fixtures", () => {
        expect.assertions(1);

        expect(
            createDataPointFilterControlTestDirectAsyncGlobalAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/controls/createDataPointFilterControl.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps HR zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(12);

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
        const hrZoneControlsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createHRZoneControlsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(hrZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientFallbackPattern
        );
        expect(hrZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientGetterPattern
        );
        expect(hrZoneControlsSource).toContain(
            "createHRZoneControlsRuntime.js"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(hrZoneControlsRuntimeSource).not.toContain("scope.document");
        expect(hrZoneControlsRuntimeSource).not.toContain("scope.HTMLElement");
        expect(hrZoneControlsRuntimeSource).not.toContain("scope.localStorage");
    });

    it("keeps power zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(12);

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
        const powerZoneControlsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerZoneControlsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(powerZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientFallbackPattern
        );
        expect(powerZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientGetterPattern
        );
        expect(powerZoneControlsSource).toContain(
            "createPowerZoneControlsRuntime.js"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain("scope.document");
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.HTMLElement"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.localStorage"
        );
    });

    it("keeps simple power zone controls browser APIs behind the runtime facade", () => {
        expect.assertions(12);

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
        const powerZoneControlsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createPowerZoneControlsSimpleRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(powerZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientFallbackPattern
        );
        expect(powerZoneControlsRuntimeSource).not.toMatch(
            directZoneControlsRuntimeAmbientGetterPattern
        );
        expect(powerZoneControlsSource).toContain(
            "createPowerZoneControlsSimpleRuntime.js"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain("scope.document");
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.HTMLElement"
        );
        expect(powerZoneControlsRuntimeSource).not.toContain(
            "scope.localStorage"
        );
    });

    it("keeps data-point filter element creation behind the runtime facade", () => {
        expect.assertions(10);

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
        const elementFactoryRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/dataPointFilterControl/elementFactoryRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(elementFactorySource).toContain("elementFactoryRuntime.js");
        expect(elementFactoryRuntimeSource).toContain(
            "defaultDataPointFilterElementFactoryRuntimeScope"
        );
        expect(elementFactoryRuntimeSource).not.toMatch(
            directDataPointFilterElementFactoryRuntimeAmbientFallbackPattern
        );
        expect(elementFactoryRuntimeSource).not.toContain(
            "scope: DataPointFilterElementFactoryRuntimeScope = globalThis"
        );
        expect(elementFactoryRuntimeSource).not.toContain(
            "const defaultDataPointFilterElementFactoryRuntimeScope: DataPointFilterElementFactoryRuntimeScope = globalThis"
        );
        expect(elementFactoryRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(elementFactoryRuntimeSource).not.toContain("scope.document");
        expect(elementFactoryRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(elementFactoryRuntimeSource).toContain("scope.getDocument?.()");
    });

    it("keeps data-point filter panel browser APIs behind the runtime facade", () => {
        expect.assertions(24);

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
        const panelControllerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/dataPointFilterControl/panelControllerRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(panelControllerSource).toContain("panelControllerRuntime.js");
        expect(panelControllerRuntimeSource).toContain(
            "defaultDataPointFilterPanelControllerRuntimeScope"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "scope: DataPointFilterPanelControllerRuntimeScope = globalThis"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "const defaultDataPointFilterPanelControllerRuntimeScope: DataPointFilterPanelControllerRuntimeScope =\n    globalThis"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(panelControllerRuntimeSource).not.toContain("readonly Node?:");
        expect(panelControllerRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "readonly viewport?:"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(panelControllerRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(panelControllerRuntimeSource).not.toContain("scope.document");
        expect(panelControllerRuntimeSource).not.toContain("scope.Node");
        expect(panelControllerRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(panelControllerRuntimeSource).not.toContain("scope.viewport");
        expect(panelControllerRuntimeSource).not.toContain("defaultView");
        expect(panelControllerRuntimeSource).not.toMatch(
            directDataPointFilterPanelControllerRuntimeAmbientFallbackPattern
        );
        expect(panelControllerRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(panelControllerRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(panelControllerRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(panelControllerRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(panelControllerRuntimeSource).toContain(
            "getViewport: () => globalThis"
        );
    });

    it("keeps loading overlay browser APIs behind the runtime facade", () => {
        expect.assertions(10);

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
        const loadingOverlayRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/components/LoadingOverlayRuntime.ts"
            )
        );
        const loadingOverlayRuntimeScopeSource =
            loadingOverlayRuntimeSource.slice(
                loadingOverlayRuntimeSource.indexOf(
                    "export interface LoadingOverlayRuntimeScope"
                ),
                loadingOverlayRuntimeSource.indexOf(
                    "export interface LoadingOverlayRuntime"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(loadingOverlaySource).toContain("LoadingOverlayRuntime.js");
        expect(loadingOverlayRuntimeSource).toContain(
            "defaultLoadingOverlayRuntimeScope"
        );
        expect(loadingOverlayRuntimeSource).not.toMatch(
            directLoadingOverlayRuntimeAmbientGetterPattern
        );
        expect(loadingOverlayRuntimeSource).not.toContain(
            "LoadingOverlayRuntimeScope =\n    globalThis"
        );
        expect(loadingOverlayRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(loadingOverlayRuntimeSource).not.toContain("scope.document");
        expect(loadingOverlayRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(loadingOverlayRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(loadingOverlayRuntimeSource).toContain(
            "LoadingOverlay requires a document runtime"
        );
    });

    it("keeps renderer loading sync DOM APIs behind the runtime facade", () => {
        expect.assertions(26);

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
        const syncRendererLoadingRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/loading/syncRendererLoadingRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(syncRendererLoadingSource).toContain(
            "syncRendererLoadingRuntime.js"
        );
        expect(syncRendererLoadingRuntimeSource).not.toMatch(
            directSyncRendererLoadingRuntimeAmbientFallbackPattern
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "defaultSyncRendererLoadingRuntimeScope"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "getHTMLButtonElement: () => globalThis.HTMLButtonElement"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "getHTMLInputElement: () => globalThis.HTMLInputElement"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "getHTMLSelectElement: () => globalThis.HTMLSelectElement"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "getHTMLTextAreaElement: () => globalThis.HTMLTextAreaElement"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope: SyncRendererLoadingRuntimeScope = globalThis"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "SyncRendererLoadingRuntimeScope = globalThis"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "readonly HTMLButtonElement?:"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "readonly HTMLInputElement?:"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "readonly HTMLSelectElement?:"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "readonly HTMLTextAreaElement?:"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope.HTMLButtonElement"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope.HTMLInputElement"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope.HTMLSelectElement"
        );
        expect(syncRendererLoadingRuntimeSource).not.toContain(
            "scope.HTMLTextAreaElement"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "return scope.getHTMLButtonElement?.();"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "return scope.getHTMLInputElement?.();"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "return scope.getHTMLSelectElement?.();"
        );
        expect(syncRendererLoadingRuntimeSource).toContain(
            "return scope.getHTMLTextAreaElement?.();"
        );
    });

    it("keeps migrated fullscreen controls on the screenfull runtime adapter", () => {
        expect.assertions(4);

        const violations = migratedScreenfullRuntimeFiles
            .filter((relativeFile) =>
                directScreenfullGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const fullscreenButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addFullScreenButton.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(fullscreenButtonSource).toContain("setupFullscreenListeners");
        expect(fullscreenButtonSource).not.toContain("setupDOMContentLoaded");
        expect(fullscreenButtonSource).not.toContain("Legacy DOM setup");
    });

    it("keeps fullscreen button listener abort-controller creation behind the runtime facade", () => {
        expect.assertions(16);

        const violations = migratedAddFullScreenButtonRuntimeFiles
            .filter((relativeFile) =>
                directAddFullScreenButtonRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const fullscreenButtonSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addFullScreenButton.ts"
            )
        );
        const fullscreenButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/addFullScreenButtonRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(fullscreenButtonSource).toContain(
            "addFullScreenButtonRuntime.js"
        );
        expect(fullscreenButtonSource).toContain("createAbortController");
        expect(fullscreenButtonRuntimeSource).toContain(
            "defaultAddFullScreenButtonRuntimeScope"
        );
        expect(fullscreenButtonRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(fullscreenButtonRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(fullscreenButtonRuntimeSource).toContain(
            "isAddFullScreenButtonEventTarget(globalThis)"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "readonly globalEventTarget?:"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "scope.globalEventTarget"
        );
        expect(fullscreenButtonRuntimeSource).not.toContain("windowTarget");
        expect(fullscreenButtonRuntimeSource).not.toContain("documentTarget");
        expect(fullscreenButtonRuntimeSource).not.toContain(
            "scope: AddFullScreenButtonRuntimeScope = {"
        );
    });

    it("keeps screenfull wired through the runtime adapter instead of a renderer global", () => {
        expect.assertions(2);

        const vendorCoreEntry = stripComments(
            readRepositoryFile("electron-app/renderer/rendererVendorCore.ts")
        );

        expect(vendorCoreEntry).toContain("screenfullRuntime: screenfull");
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

    it("keeps renderer Electron API registration on explicit candidates only", () => {
        expect.assertions(8);

        const registrationSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/electronApiRegistration.ts"
            )
        );
        const installerSource = registrationSource.slice(
            registrationSource.indexOf(
                "export function installRendererElectronApiRegistration"
            ),
            registrationSource.indexOf(
                "export function registerRendererElectronAPI"
            )
        );

        expect(installerSource).toContain(
            "registerRendererElectronAPI(options.electronApiCandidate, options)"
        );
        expect(installerSource).not.toContain(
            'Reflect.get(options.scope, "electronAPI")'
        );
        expect(registrationSource).not.toContain("__vitest_manual_mocks__");
        expect(registrationSource).not.toContain(
            "installRendererElectronAPIProxy"
        );
        expect(registrationSource).not.toContain(
            "startRendererElectronAPITestPolling"
        );
        expect(registrationSource).not.toContain(
            "registerRendererElectronPollingCleanup"
        );
        expect(registrationSource).not.toContain(
            "Object.defineProperty = function"
        );
        expect(registrationSource).not.toContain(
            "installElectronAPIDefinePropertyInterceptor"
        );
    });

    it("keeps external link browser fallbacks behind the runtime facade", () => {
        expect.assertions(8);

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
        const externalLinkHandlersRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/links/externalLinkHandlersRuntime.ts"
            )
        );
        const runtimeScopeSource = externalLinkHandlersRuntimeSource.slice(
            externalLinkHandlersRuntimeSource.indexOf(
                "export interface ExternalLinkHandlersRuntimeScope"
            ),
            externalLinkHandlersRuntimeSource.indexOf(
                "export interface ExternalLinkHandlersRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(externalLinkHandlersSource).toContain(
            "externalLinkHandlersRuntime.js"
        );
        expect(externalLinkHandlersRuntimeSource).not.toMatch(
            directExternalLinkHandlersRuntimeAmbientGetterPattern
        );
        expect(externalLinkHandlersRuntimeSource).toContain(
            "defaultExternalLinkHandlersRuntimeScope"
        );
        expect(runtimeScopeSource).not.toContain("readonly open?:");
        expect(externalLinkHandlersRuntimeSource).not.toContain("scope.open");
        expect(externalLinkHandlersRuntimeSource).toContain(
            "return scope.getOpen?.();"
        );
        expect(externalLinkHandlersRuntimeSource).toContain(
            "getOpen: () => globalThis.open"
        );
    });

    it("keeps map action timers behind the runtime facade", () => {
        expect.assertions(13);

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
        const mapActionButtonsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/controls/mapActionButtonsRuntime.ts"
            )
        );
        const mapActionButtonsRuntimeScopeSource =
            mapActionButtonsRuntimeSource.slice(
                mapActionButtonsRuntimeSource.indexOf(
                    "export interface MapActionButtonsRuntimeScope"
                ),
                mapActionButtonsRuntimeSource.indexOf(
                    "export interface MapActionButtonsRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(mapActionButtonsSource).toContain("mapActionButtonsRuntime.js");
        expect(mapActionButtonsRuntimeSource).toContain(
            "defaultMapActionButtonsRuntimeScope"
        );
        expect(mapActionButtonsRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mapActionButtonsRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(mapActionButtonsRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(mapActionButtonsRuntimeSource).not.toContain("scope.setTimeout");
        expect(mapActionButtonsRuntimeSource).not.toContain(
            "scope: MapActionButtonsRuntimeScope = globalThis"
        );
        expect(mapActionButtonsRuntimeSource).not.toContain(
            "MapActionButtonsRuntimeScope =\n    globalThis"
        );
        expect(mapActionButtonsRuntimeSource).not.toMatch(
            directMapActionButtonsRuntimeAmbientFallbackPattern
        );
        expect(mapActionButtonsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(mapActionButtonsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(mapActionButtonsRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps map document listeners behind the runtime facade", () => {
        expect.assertions(21);

        const violations = migratedMapDocumentListenersRuntimeFiles
            .filter((relativeFile) =>
                directMapDocumentListenersRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapDocumentListenersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/core/mapDocumentListeners.ts"
            )
        );
        const mapDocumentListenersRuntimeSource = stripComments(
            readRepositoryFile(mapDocumentListenersRuntimeSourceFile)
        );
        const mapDocumentListenersRuntimeScopeSource =
            mapDocumentListenersRuntimeSource.slice(
                mapDocumentListenersRuntimeSource.indexOf(
                    "export interface MapDocumentListenersRuntimeScope"
                ),
                mapDocumentListenersRuntimeSource.indexOf(
                    "export interface MapDocumentListenersRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(mapDocumentListenersSource).toContain(
            "mapDocumentListenersRuntime.js"
        );
        expect(mapDocumentListenersSource).toContain("createAbortController");
        expect(mapDocumentListenersRuntimeSource).toContain(
            "defaultMapDocumentListenersRuntimeScope"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "getResizeTarget: () => globalThis"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "scope: MapDocumentListenersRuntimeScope = globalThis"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "MapDocumentListenersRuntimeScope = globalThis"
        );
        expect(mapDocumentListenersRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mapDocumentListenersRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(mapDocumentListenersRuntimeScopeSource).not.toContain(
            "readonly resizeTarget?:"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "scope.resizeTarget"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "const runtimeResizeTarget = scope.getResizeTarget?.();"
        );
        expect(mapDocumentListenersRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain("scope.window");
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "globalThis.document.addEventListener"
        );
        expect(mapDocumentListenersRuntimeSource).not.toContain(
            "globalThis.window"
        );
    });

    it("keeps map fullscreen-control timers behind the runtime facade", () => {
        expect.assertions(22);

        const violations = migratedMapFullscreenControlRuntimeFiles
            .filter((relativeFile) =>
                directMapFullscreenControlRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapFullscreenControlSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/controls/mapFullscreenControl.ts"
            )
        );
        const mapFullscreenControlRuntimeSource = stripComments(
            readRepositoryFile(mapFullscreenControlRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(mapFullscreenControlSource).toContain(
            "mapFullscreenControlRuntime.js"
        );
        expect(mapFullscreenControlSource).toContain("createAbortController");
        expect(mapFullscreenControlRuntimeSource).toContain(
            "defaultMapFullscreenControlRuntimeScope"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "scope: MapFullscreenControlRuntimeScope = globalThis"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(mapFullscreenControlRuntimeSource).not.toMatch(
            directMapFullscreenControlRuntimeAmbientFallbackPattern
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(mapFullscreenControlRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(mapFullscreenControlRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
    });

    it("keeps map measure-tool timers behind the runtime facade", () => {
        expect.assertions(24);

        const violations = migratedMapMeasureToolRuntimeFiles
            .filter((relativeFile) =>
                directMapMeasureToolRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapMeasureToolSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/controls/mapMeasureTool.ts"
            )
        );
        const mapMeasureToolRuntimeSource = stripComments(
            readRepositoryFile(mapMeasureToolRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(mapMeasureToolSource).toContain("mapMeasureToolRuntime.js");
        expect(mapMeasureToolSource).toContain("createAbortController");
        expect(mapMeasureToolRuntimeSource).toContain(
            "defaultMapMeasureToolRuntimeScope"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "scope: MapMeasureToolRuntimeScope = globalThis"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "MapMeasureToolRuntimeScope = globalThis"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mapMeasureToolRuntimeSource).not.toContain("scope.clearTimeout");
        expect(mapMeasureToolRuntimeSource).not.toContain("scope.document");
        expect(mapMeasureToolRuntimeSource).not.toContain("scope.setTimeout");
        expect(mapMeasureToolRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(mapMeasureToolRuntimeSource).not.toMatch(
            directMapMeasureToolRuntimeAmbientFallbackPattern
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(mapMeasureToolRuntimeSource).toContain(
            "runtimeDocument.removeEventListener"
        );
    });

    it("keeps map lap-selector document listeners behind the runtime facade", () => {
        expect.assertions(17);

        const violations = migratedMapLapSelectorRuntimeFiles
            .filter((relativeFile) =>
                directMapLapSelectorRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapLapSelectorSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/controls/mapLapSelector.ts"
            )
        );
        const mapLapSelectorRuntimeSource = stripComments(
            readRepositoryFile(mapLapSelectorRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(mapLapSelectorSource).toContain("mapLapSelectorRuntime.js");
        expect(mapLapSelectorSource).toContain("createAbortController");
        expect(mapLapSelectorRuntimeSource).toContain(
            "defaultMapLapSelectorRuntimeScope"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain(
            "scope: MapLapSelectorRuntimeScope = globalThis"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain(
            "MapLapSelectorRuntimeScope = globalThis"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mapLapSelectorRuntimeSource).not.toContain("scope.document");
        expect(mapLapSelectorRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "runtimeDocument.removeEventListener"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "mapLapSelector requires a document runtime"
        );
        expect(mapLapSelectorRuntimeSource).toContain(
            "mapLapSelector requires an AbortController runtime"
        );
    });

    it("keeps map draw-laps timers behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedMapDrawLapsRuntimeFiles
            .filter((relativeFile) =>
                directMapDrawLapsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapDrawLapsSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/layers/mapDrawLaps.ts")
        );
        const mapDrawLapsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/maps/layers/mapDrawLapsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(mapDrawLapsSource).toContain("mapDrawLapsRuntime.js");
        expect(mapDrawLapsRuntimeSource).toContain(
            "defaultMapDrawLapsRuntimeScope"
        );
        expect(mapDrawLapsRuntimeSource).not.toContain(
            "scope: MapDrawLapsRuntimeScope = globalThis"
        );
        expect(mapDrawLapsRuntimeSource).not.toContain(
            "const defaultMapDrawLapsRuntimeScope: MapDrawLapsRuntimeScope = globalThis"
        );
        expect(mapDrawLapsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(mapDrawLapsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(mapDrawLapsRuntimeSource).not.toMatch(
            directMapDrawLapsRuntimeAmbientFallbackPattern
        );
        expect(mapDrawLapsRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mapDrawLapsRuntimeSource).not.toContain("readonly setTimeout?:");
        expect(mapDrawLapsRuntimeSource).not.toContain("scope.clearTimeout");
        expect(mapDrawLapsRuntimeSource).not.toContain("scope.setTimeout");
        expect(mapDrawLapsRuntimeSource).toContain(
            "const setTimeoutRef = getScopeSetTimeout(scope);"
        );
    });

    it("keeps open-file selector browser APIs behind the runtime facade", () => {
        expect.assertions(25);

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
        const openFileSelectorRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/openFileSelectorRuntime.ts"
            )
        );
        const openFileSelectorRuntimeScopeSource =
            openFileSelectorRuntimeSource.slice(
                openFileSelectorRuntimeSource.indexOf(
                    "export interface OpenFileSelectorRuntimeScope"
                ),
                openFileSelectorRuntimeSource.indexOf(
                    "export interface OpenFileSelectorRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(openFileSelectorSource).toContain("openFileSelectorRuntime.js");
        expect(openFileSelectorSource).toContain("createAbortController");
        expect(openFileSelectorRuntimeSource).not.toMatch(
            directOpenFileSelectorRuntimeAmbientFallbackPattern
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "defaultOpenFileSelectorRuntimeScope"
        );
        expect(openFileSelectorRuntimeSource).not.toContain(
            "scope: OpenFileSelectorRuntimeScope = globalThis"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "openFileSelector requires a setTimeout runtime"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly navigator?:"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly queueMicrotask?:"
        );
        expect(openFileSelectorRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(openFileSelectorRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(openFileSelectorRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(openFileSelectorRuntimeSource).not.toContain("scope.document");
        expect(openFileSelectorRuntimeSource).not.toContain("scope.navigator");
        expect(openFileSelectorRuntimeSource).not.toContain(
            "scope.queueMicrotask"
        );
        expect(openFileSelectorRuntimeSource).not.toContain("scope.setTimeout");
        expect(openFileSelectorRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "getNavigator: () => globalThis.navigator"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "getQueueMicrotask: () => globalThis.queueMicrotask"
        );
        expect(openFileSelectorRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
    });

    it("keeps overlay file load concurrency metadata behind the runtime facade", () => {
        expect.assertions(9);

        const violations = migratedLoadOverlayFilesRuntimeFiles
            .filter((relativeFile) =>
                directLoadOverlayFilesRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const loadOverlayFilesSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/loadOverlayFiles.ts"
            )
        );
        const loadOverlayFilesRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/loadOverlayFilesRuntime.ts"
            )
        );
        const loadOverlayFilesRuntimeScopeSource =
            loadOverlayFilesRuntimeSource.slice(
                loadOverlayFilesRuntimeSource.indexOf(
                    "export interface LoadOverlayFilesRuntimeScope"
                ),
                loadOverlayFilesRuntimeSource.indexOf(
                    "export interface LoadOverlayFilesRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(loadOverlayFilesSource).toContain("loadOverlayFilesRuntime.js");
        expect(loadOverlayFilesRuntimeSource).toContain(
            "defaultLoadOverlayFilesRuntimeScope"
        );
        expect(loadOverlayFilesRuntimeScopeSource).not.toContain(
            "readonly navigator?:"
        );
        expect(loadOverlayFilesRuntimeSource).not.toContain("scope.navigator");
        expect(loadOverlayFilesRuntimeSource).not.toContain(
            "scope: LoadOverlayFilesRuntimeScope = globalThis"
        );
        expect(loadOverlayFilesRuntimeSource).not.toContain(
            "LoadOverlayFilesRuntimeScope =\n    globalThis"
        );
        expect(loadOverlayFilesRuntimeSource).toContain(
            "getNavigator: () => globalThis.navigator"
        );
        expect(loadOverlayFilesRuntimeSource).toContain(
            "return scope.getNavigator?.()?.hardwareConcurrency;"
        );
    });

    it("keeps single-overlay FileReader abort-controller creation behind the runtime facade", () => {
        expect.assertions(11);

        const violations = migratedLoadSingleOverlayFileRuntimeFiles
            .filter((relativeFile) =>
                directLoadSingleOverlayFileRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const loadSingleOverlayFileSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/loadSingleOverlayFile.ts"
            )
        );
        const loadSingleOverlayFileRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/loadSingleOverlayFileRuntime.ts"
            )
        );
        const runtimeScopeSource = loadSingleOverlayFileRuntimeSource.slice(
            loadSingleOverlayFileRuntimeSource.indexOf(
                "export interface LoadSingleOverlayFileRuntimeScope"
            ),
            loadSingleOverlayFileRuntimeSource.indexOf(
                "export interface LoadSingleOverlayFileRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(loadSingleOverlayFileSource).toContain(
            "loadSingleOverlayFileRuntime.js"
        );
        expect(loadSingleOverlayFileSource).toContain("createAbortController");
        expect(loadSingleOverlayFileRuntimeSource).toContain(
            "defaultLoadSingleOverlayFileRuntimeScope"
        );
        expect(loadSingleOverlayFileRuntimeSource).not.toContain(
            "scope: LoadSingleOverlayFileRuntimeScope = globalThis"
        );
        expect(loadSingleOverlayFileRuntimeSource).not.toContain(
            "LoadSingleOverlayFileRuntimeScope =\n    globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(loadSingleOverlayFileRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(loadSingleOverlayFileRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(loadSingleOverlayFileRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(loadSingleOverlayFileRuntimeSource).toContain(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    });

    it("keeps elevation profile button browser APIs behind the runtime facade", () => {
        expect.assertions(15);

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
        const createElevationProfileButtonRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/createElevationProfileButtonRuntime.ts"
            )
        );
        const runtimeScopeSource =
            createElevationProfileButtonRuntimeSource.slice(
                createElevationProfileButtonRuntimeSource.indexOf(
                    "export interface CreateElevationProfileButtonRuntimeScope"
                ),
                createElevationProfileButtonRuntimeSource.indexOf(
                    "export interface CreateElevationProfileButtonRuntime"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(createElevationProfileButtonRuntimeSource).not.toMatch(
            directCreateElevationProfileButtonRuntimeAmbientFallbackPattern
        );
        expect(createElevationProfileButtonRuntimeSource).not.toMatch(
            directCreateElevationProfileButtonRuntimeAmbientGetterPattern
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain(
            "readonly chartOverlayColorPalette?:"
        );
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly open?:");
        expect(createElevationProfileButtonRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(createElevationProfileButtonRuntimeSource).not.toContain(
            "scope.chartOverlayColorPalette"
        );
        expect(createElevationProfileButtonRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(createElevationProfileButtonRuntimeSource).not.toContain(
            "scope.open"
        );
        expect(createElevationProfileButtonRuntimeSource).toContain(
            "return scope.getDocument?.();"
        );
        expect(createElevationProfileButtonRuntimeSource).toContain(
            "return scope.getOpen?.();"
        );
        expect(createElevationProfileButtonRuntimeSource).toContain(
            "return scope.getChartOverlayColorPalette?.();"
        );
        expect(createElevationProfileButtonSource).toContain(
            "createElevationProfileButtonRuntime.js"
        );
    });

    it("keeps migrated AltFit handoff defaults behind the runtime facade", () => {
        expect.assertions(19);

        const violations = migratedAltFitSenderRuntimeFiles
            .filter((relativeFile) =>
                directAltFitSenderRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        const altFitSenderSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/sendFitFileToAltFitReader.ts"
            )
        );
        const altFitSenderRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/files/import/altFitSenderRuntime.ts"
            )
        );
        const runtimeScopeSource = altFitSenderRuntimeSource.slice(
            altFitSenderRuntimeSource.indexOf(
                "interface AltFitSenderRuntimeScope"
            ),
            altFitSenderRuntimeSource.indexOf(
                "const defaultAltFitSenderRuntimeScope"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(altFitSenderSource).toContain("altFitSenderRuntime.js");
        expect(altFitSenderSource).toContain("createAbortController");
        expect(altFitSenderRuntimeSource).toContain(
            "defaultAltFitSenderRuntimeScope"
        );
        expect(altFitSenderRuntimeSource).not.toContain(
            "const defaultAltFitSenderRuntimeScope: AltFitSenderRuntimeScope = globalThis"
        );
        expect(altFitSenderRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(altFitSenderRuntimeSource).toContain(
            "getConsole: () => globalThis.console"
        );
        expect(altFitSenderRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(altFitSenderRuntimeSource).toContain(
            "getLocation: () => globalThis.location"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeScopeSource).not.toContain("readonly console?:");
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly location?:");
        expect(altFitSenderRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(altFitSenderRuntimeSource).not.toContain("scope.console");
        expect(altFitSenderRuntimeSource).not.toContain("scope.document");
        expect(altFitSenderRuntimeSource).not.toContain("scope.location");
        expect(altFitSenderRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(altFitSenderRuntimeSource).toContain(
            "return scope.getLocation?.();"
        );
    });

    it("keeps shared configuration URL reads behind the runtime facade", () => {
        expect.assertions(18);

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
        const loadSharedConfigurationRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/loadSharedConfigurationRuntime.ts"
            )
        );
        const loadSharedConfigurationRuntimeScopeSource =
            loadSharedConfigurationRuntimeSource.slice(
                loadSharedConfigurationRuntimeSource.indexOf(
                    "export interface LoadSharedConfigurationRuntimeScope"
                ),
                loadSharedConfigurationRuntimeSource.indexOf(
                    "const defaultLoadSharedConfigurationRuntimeScope"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(loadSharedConfigurationSource).toContain(
            "loadSharedConfigurationRuntime.js"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toMatch(
            directLoadSharedConfigurationRuntimeAmbientFallbackPattern
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "defaultLoadSharedConfigurationRuntimeScope"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toContain(
            "scope: LoadSharedConfigurationRuntimeScope = globalThis"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toContain(
            "LoadSharedConfigurationRuntimeScope =\n    globalThis"
        );
        expect(loadSharedConfigurationRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(loadSharedConfigurationRuntimeScopeSource).not.toContain(
            "readonly location?:"
        );
        expect(loadSharedConfigurationRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toContain(
            "scope.location"
        );
        expect(loadSharedConfigurationRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "getLocation: () => globalThis.location"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "scope.getLocation?.()?.search"
        );
        expect(loadSharedConfigurationRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps current settings reset timers behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedGetCurrentSettingsRuntimeFiles
            .filter((relativeFile) =>
                directGetCurrentSettingsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const getCurrentSettingsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/getCurrentSettings.ts"
            )
        );
        const getCurrentSettingsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/initialization/getCurrentSettingsRuntime.ts"
            )
        );
        const getCurrentSettingsRuntimeScopeSource =
            getCurrentSettingsRuntimeSource.slice(
                getCurrentSettingsRuntimeSource.indexOf(
                    "export interface GetCurrentSettingsRuntimeScope"
                ),
                getCurrentSettingsRuntimeSource.indexOf(
                    "export interface GetCurrentSettingsRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(getCurrentSettingsSource).toContain(
            "getCurrentSettingsRuntime.js"
        );
        expect(getCurrentSettingsRuntimeSource).not.toMatch(
            directGetCurrentSettingsRuntimeAmbientFallbackPattern
        );
        expect(getCurrentSettingsRuntimeSource).toContain(
            "defaultGetCurrentSettingsRuntimeScope"
        );
        expect(getCurrentSettingsRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(getCurrentSettingsRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(getCurrentSettingsRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(getCurrentSettingsRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(getCurrentSettingsRuntimeSource).not.toContain(
            "scope: GetCurrentSettingsRuntimeScope = globalThis"
        );
        expect(getCurrentSettingsRuntimeSource).not.toContain(
            "GetCurrentSettingsRuntimeScope =\n    globalThis"
        );
        expect(getCurrentSettingsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(getCurrentSettingsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(getCurrentSettingsRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps lazy rendering browser APIs behind the runtime facade", () => {
        expect.assertions(22);

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
        const lazyRenderingRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/performance/lazyRenderingRuntime.ts"
            )
        );
        const lazyRenderingRuntimeScopeSource =
            lazyRenderingRuntimeSource.slice(
                lazyRenderingRuntimeSource.indexOf(
                    "export interface LazyRenderingRuntimeScope"
                ),
                lazyRenderingRuntimeSource.indexOf(
                    "export interface LazyRenderingViewport"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(lazyRenderingUtilsSource).toContain("lazyRenderingRuntime.js");
        expect(lazyRenderingRuntimeSource).not.toMatch(
            directLazyRenderingRuntimeAmbientFallbackPattern
        );
        expect(lazyRenderingRuntimeSource).not.toMatch(
            directLazyRenderingRuntimeAmbientGetterPattern
        );
        expect(lazyRenderingRuntimeSource).toContain(
            "const timeout = getScopeSetTimeout(scope);"
        );
        expect(lazyRenderingRuntimeSource).toContain(
            "defaultLazyRenderingRuntimeScope"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly innerHeight?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly innerWidth?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly IntersectionObserver?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly requestIdleCallback?:"
        );
        expect(lazyRenderingRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(lazyRenderingRuntimeSource).not.toContain("scope.document");
        expect(lazyRenderingRuntimeSource).not.toContain("scope.HTMLElement");
        expect(lazyRenderingRuntimeSource).not.toContain("scope.innerHeight");
        expect(lazyRenderingRuntimeSource).not.toContain("scope.innerWidth");
        expect(lazyRenderingRuntimeSource).not.toContain(
            "scope.IntersectionObserver"
        );
        expect(lazyRenderingRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(lazyRenderingRuntimeSource).not.toContain(
            "scope.requestIdleCallback"
        );
        expect(lazyRenderingRuntimeSource).not.toContain("scope.setTimeout");
    });

    it("keeps resize listener browser APIs behind the runtime facade", () => {
        expect.assertions(45);

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
        const listenersResizeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/lifecycle/listenersResizeRuntime.ts"
            )
        );
        const listenersResizeRuntimeScopeSource =
            listenersResizeRuntimeSource.slice(
                listenersResizeRuntimeSource.indexOf(
                    "export interface ListenersResizeRuntimeScope"
                ),
                listenersResizeRuntimeSource.indexOf(
                    "export interface ListenersResizeRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(listenersResizeSource).toContain("listenersResizeRuntime.js");
        expect(listenersResizeSource).toContain("createAbortController");
        expect(listenersResizeRuntimeSource).not.toMatch(
            directListenersResizeRuntimeAmbientTimerFallbackPattern
        );
        expect(listenersResizeRuntimeSource).toContain(
            "defaultListenersResizeRuntimeScope"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getElement: () => globalThis.Element"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getHTMLCanvasElement: () => globalThis.HTMLCanvasElement"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getResizeTarget: () => globalThis"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope: ListenersResizeRuntimeScope = globalThis"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "ListenersResizeRuntimeScope = globalThis"
        );
        expect(listenersResizeRuntimeSource).not.toContain("scope.window");
        expect(listenersResizeRuntimeSource).toContain(
            "listenersResize requires a setTimeout runtime"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly Element?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly HTMLCanvasElement?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly resizeTarget?:"
        );
        expect(listenersResizeRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(listenersResizeRuntimeSource).not.toContain("scope.document");
        expect(listenersResizeRuntimeSource).not.toContain("scope.Element");
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.HTMLCanvasElement"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(listenersResizeRuntimeSource).not.toContain(
            "scope.resizeTarget"
        );
        expect(listenersResizeRuntimeSource).not.toContain("scope.setTimeout");
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getAbortController?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getCancelAnimationFrame?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getClearTimeout?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getDocument?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getElement?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getHTMLCanvasElement?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getRequestAnimationFrame?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getResizeTarget?.();"
        );
        expect(listenersResizeRuntimeSource).toContain(
            "return scope.getSetTimeout?.();"
        );
    });

    it("keeps chart theme browser reads behind the runtime facade", () => {
        expect.assertions(14);

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
        const chartThemeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/theming/chartThemeRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartThemeUtilsSource).toContain("chartThemeRuntime.js");
        expect(chartThemeRuntimeSource).toContain(
            "defaultChartThemeRuntimeScope"
        );
        expect(chartThemeRuntimeSource).not.toContain(
            "scope: ChartThemeRuntimeScope = globalThis"
        );
        expect(chartThemeRuntimeSource).not.toContain(
            "const defaultChartThemeRuntimeScope: ChartThemeRuntimeScope = globalThis"
        );
        expect(chartThemeRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(chartThemeRuntimeSource).toContain(
            "getLocalStorage: () => globalThis.localStorage"
        );
        expect(chartThemeRuntimeSource).toContain(
            "getMatchMedia: () => globalThis.matchMedia"
        );
        expect(chartThemeRuntimeSource).not.toContain("readonly document?:");
        expect(chartThemeRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(chartThemeRuntimeSource).not.toContain("readonly matchMedia?:");
        expect(chartThemeRuntimeSource).not.toContain("scope.document");
        expect(chartThemeRuntimeSource).not.toContain("scope.localStorage");
        expect(chartThemeRuntimeSource).not.toContain("scope.matchMedia");
    });

    it("keeps core theme transition timers behind the runtime facade", () => {
        expect.assertions(32);

        const violations = migratedThemeCoreRuntimeFiles
            .filter((relativeFile) =>
                directThemeCoreRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const themeCoreSource = stripComments(
            readRepositoryFile("electron-app/utils/theming/core/theme.ts")
        );
        const themeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/core/themeRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(themeCoreSource).toContain("themeRuntime.js");
        expect(themeCoreSource).toContain("createAbortController");
        expect(themeCoreSource).toContain("getSystemThemeMediaQuery");
        expect(themeCoreSource).toContain("getGlobalEventTarget");
        expect(themeRuntimeSource).toContain("defaultThemeRuntimeScope");
        expect(themeRuntimeSource).not.toContain(
            "scope: ThemeRuntimeScope = globalThis"
        );
        expect(themeRuntimeSource).not.toContain(
            "const defaultThemeRuntimeScope: ThemeRuntimeScope = globalThis"
        );
        expect(themeRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(themeRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(themeRuntimeSource).toContain(
            "getMatchMedia: getDefaultMatchMedia"
        );
        expect(themeRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(themeRuntimeSource).toContain(
            "getGlobalEventTarget: getDefaultEventTarget"
        );
        expect(themeRuntimeSource).not.toContain("readonly AbortController?:");
        expect(themeRuntimeSource).not.toContain("readonly clearTimeout?:");
        expect(themeRuntimeSource).not.toContain(
            "readonly globalEventTarget?:"
        );
        expect(themeRuntimeSource).not.toMatch(
            /export interface ThemeRuntimeScope \{(?:(?!\n\})[\s\S])*readonly matchMedia\?:/
        );
        expect(themeRuntimeSource).not.toContain("readonly setTimeout?:");
        expect(themeRuntimeSource).not.toContain("scope.AbortController");
        expect(themeRuntimeSource).not.toContain("scope.clearTimeout");
        expect(themeRuntimeSource).not.toContain("scope.globalEventTarget");
        expect(themeRuntimeSource).not.toContain("scope.matchMedia");
        expect(themeRuntimeSource).not.toContain("scope.setTimeout");
        expect(themeRuntimeSource).not.toContain("globalThis.window");
        expect(themeRuntimeSource).not.toContain("getWindowEventTarget");
        expect(themeRuntimeSource).not.toContain("getWindow?:");
        expect(themeRuntimeSource).not.toContain("getWindow: ()");
        expect(themeRuntimeSource).not.toContain("getEventTarget:");
        expect(themeRuntimeSource).not.toContain("eventTarget?: EventTarget");
        expect(themeRuntimeSource).not.toContain("type ThemeWindowTarget");
        expect(themeRuntimeSource).not.toMatch(
            directThemeCoreRuntimeAmbientTimerFallbackPattern
        );
        expect(themeRuntimeSource).toContain(
            "theme core requires a setTimeout runtime"
        );
    });

    it("keeps setup theme fetch timers behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedSetupThemeRuntimeFiles
            .filter((relativeFile) =>
                directSetupThemeRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const setupThemeSource = stripComments(
            readRepositoryFile("electron-app/utils/theming/core/setupTheme.ts")
        );
        const setupThemeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/core/setupThemeRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(setupThemeSource).toContain("setupThemeRuntime.js");
        expect(setupThemeRuntimeSource).toContain(
            "defaultSetupThemeRuntimeScope"
        );
        expect(setupThemeRuntimeSource).not.toContain(
            "scope: SetupThemeRuntimeScope = globalThis"
        );
        expect(setupThemeRuntimeSource).not.toContain(
            "const defaultSetupThemeRuntimeScope: SetupThemeRuntimeScope = globalThis"
        );
        expect(setupThemeRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(setupThemeRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(setupThemeRuntimeSource).not.toMatch(
            directSetupThemeRuntimeAmbientFallbackPattern
        );
        expect(setupThemeRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(setupThemeRuntimeSource).not.toContain("readonly setTimeout?:");
        expect(setupThemeRuntimeSource).not.toContain("scope.clearTimeout");
        expect(setupThemeRuntimeSource).not.toContain("scope.setTimeout");
        expect(setupThemeRuntimeSource).toContain(
            "const setTimeoutRef = getScopeSetTimeout(scope);"
        );
    });

    it("keeps chart theme listener browser APIs behind the runtime facade", () => {
        expect.assertions(21);

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
        const chartThemeListenerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/theming/chartThemeListenerRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartThemeListenerSource).toContain(
            "chartThemeListenerRuntime.js"
        );
        expect(chartThemeListenerRuntimeSource).not.toMatch(
            directChartThemeListenerRuntimeAmbientFallbackPattern
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "defaultChartThemeListenerRuntimeScope"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "ChartThemeListenerRuntimeScope = globalThis"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "scope.CustomEvent"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(chartThemeListenerRuntimeSource).not.toContain("scope.document");
        expect(chartThemeListenerRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(chartThemeListenerRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps map theme toggle browser APIs behind the runtime facade", () => {
        expect.assertions(28);

        const violations = migratedMapThemeToggleRuntimeFiles
            .filter((relativeFile) =>
                directMapThemeToggleRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const mapThemeToggleStateSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/specific/mapThemeToggleState.ts"
            )
        );
        const mapThemeToggleSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/specific/createMapThemeToggle.ts"
            )
        );
        const mapThemeToggleRuntimeSource = stripComments(
            readRepositoryFile(mapThemeToggleRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(mapThemeToggleStateSource).toContain("mapThemeToggleRuntime.js");
        expect(mapThemeToggleStateSource).toContain("createAbortController");
        expect(mapThemeToggleStateSource).toContain("addDocumentListener");
        expect(mapThemeToggleSource).toContain("createMapThemeChangedEvent");
        expect(mapThemeToggleSource).toContain("dispatchDocumentEvent");
        expect(mapThemeToggleRuntimeSource).toContain(
            "createMapThemeChangedEvent"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "defaultMapThemeToggleRuntimeScope"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "scope: MapThemeToggleRuntimeScope = globalThis"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "const defaultMapThemeToggleRuntimeScope: MapThemeToggleRuntimeScope = globalThis"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "readonly CustomEvent?:"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mapThemeToggleRuntimeSource).not.toContain("scope.CustomEvent");
        expect(mapThemeToggleRuntimeSource).not.toContain("scope.clearTimeout");
        expect(mapThemeToggleRuntimeSource).not.toContain("scope.document");
        expect(mapThemeToggleRuntimeSource).not.toContain("scope.setTimeout");
        expect(mapThemeToggleRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(mapThemeToggleRuntimeSource).not.toMatch(
            directMapThemeToggleRuntimeAmbientFallbackPattern
        );
        expect(mapThemeToggleRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps map theme browser APIs behind the runtime facade", () => {
        expect.assertions(19);

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
        const updateMapThemeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/theming/specific/updateMapThemeRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateMapThemeSource).toContain("updateMapThemeRuntime.js");
        expect(updateMapThemeSource).toContain("createAbortController");
        expect(updateMapThemeRuntimeSource).toContain(
            "defaultUpdateMapThemeRuntimeScope"
        );
        expect(updateMapThemeRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(updateMapThemeRuntimeSource).toContain(
            "getBeforeUnloadTarget: () => globalThis"
        );
        expect(updateMapThemeRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(updateMapThemeRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "scope: UpdateMapThemeRuntimeScope = globalThis"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "UpdateMapThemeRuntimeScope = globalThis"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "readonly beforeUnloadTarget?:"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(updateMapThemeRuntimeSource).not.toContain(
            "scope.beforeUnloadTarget"
        );
        expect(updateMapThemeRuntimeSource).not.toContain("scope.document");
        expect(updateMapThemeRuntimeSource).not.toContain("scope.HTMLElement");
        expect(updateMapThemeRuntimeSource).not.toContain("scope.window");
    });

    it("keeps chart status counts browser APIs behind the runtime facade", () => {
        expect.assertions(36);

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
        const chartStatusIndicatorRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/components/chartStatusIndicatorRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(chartStatusIndicatorRuntimeSource).not.toMatch(
            directChartStatusIndicatorRuntimeAmbientFallbackPattern
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "defaultChartStatusIndicatorRuntimeScope"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getAddEventListener: () => globalThis.addEventListener"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "getViewport: () => ({"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope: ChartStatusIndicatorRuntimeScope = globalThis"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "ChartStatusIndicatorRuntimeScope = globalThis"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly innerHeight?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly innerWidth?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.HTMLElement"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.innerHeight"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.innerWidth"
        );
        expect(chartStatusIndicatorRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "return scope.getHTMLElement?.();"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "return scope.getViewport?.() ?? { height: 0, width: 0 };"
        );
        expect(chartStatusIndicatorRuntimeSource).toContain(
            "chartStatusIndicator requires a setTimeout runtime"
        );
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
        const sourcesMissingRuntime =
            migratedGlobalChartStatusUpdaterRuntimeFiles
                .filter(
                    (relativeFile) =>
                        !stripComments(
                            readRepositoryFile(relativeFile)
                        ).includes("chartStatusIndicatorRuntime.js")
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

    it("keeps chart listener AbortController creation behind the runtime facade", () => {
        expect.assertions(11);

        const violations = migratedChartListenerStateRuntimeFiles
            .filter((relativeFile) =>
                directChartListenerStateAbortControllerPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedChartListenerStateRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "chartListenerStateRuntime.js"
                    )
            )
            .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/chartListenerStateRuntime.ts"
            )
        );
        const runtimeScopeSource = runtimeSource.slice(
            runtimeSource.indexOf(
                "export interface ChartListenerStateRuntimeScope"
            ),
            runtimeSource.indexOf("export interface ChartListenerStateRuntime")
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).not.toMatch(
            directChartListenerStateRuntimeAmbientControllerPattern
        );
        expect(runtimeSource).toContain(
            "defaultChartListenerStateRuntimeScope"
        );
        expect(runtimeSource).not.toContain(
            "scope: ChartListenerStateRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "ChartListenerStateRuntimeScope =\n    globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly AbortController?:");
        expect(runtimeSource).not.toContain("scope.AbortController");
        expect(runtimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(runtimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(runtimeSource).toContain(
            "chartListenerState requires an AbortController"
        );
    });

    it("keeps direct chart rerender DOM lookups behind the runtime facade", () => {
        expect.assertions(14);

        const violations = migratedRenderChartDirectRerenderRuntimeFiles
            .filter((relativeFile) =>
                directRenderChartDirectRerenderRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime =
            migratedRenderChartDirectRerenderRuntimeFiles
                .filter(
                    (relativeFile) =>
                        !stripComments(
                            readRepositoryFile(relativeFile)
                        ).includes("renderChartDirectRerenderRuntime.js")
                )
                .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartDirectRerenderRuntime.ts"
            )
        );
        const runtimeScopeSource = runtimeSource.slice(
            runtimeSource.indexOf(
                "export interface RenderChartDirectRerenderRuntimeScope"
            ),
            runtimeSource.indexOf(
                "export interface RenderChartDirectRerenderRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain(
            "defaultRenderChartDirectRerenderRuntimeScope"
        );
        expect(runtimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(runtimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(runtimeSource).not.toContain(
            "scope: RenderChartDirectRerenderRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "RenderChartDirectRerenderRuntimeScope = globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly HTMLElement?:");
        expect(runtimeSource).not.toContain("scope.document");
        expect(runtimeSource).not.toContain("scope.HTMLElement");
        expect(runtimeSource).toContain("scope.getHTMLElement?.()");
        expect(runtimeSource).toContain(
            "scope.getDocument?.()?.defaultView?.HTMLElement"
        );
        expect(runtimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
    });

    it("keeps chart request listener browser APIs behind the runtime facade", () => {
        expect.assertions(21);

        const violations = migratedRenderChartRequestListenerRuntimeFiles
            .filter((relativeFile) =>
                directRenderChartRequestListenerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime =
            migratedRenderChartRequestListenerRuntimeFiles
                .filter(
                    (relativeFile) =>
                        !stripComments(
                            readRepositoryFile(relativeFile)
                        ).includes("renderChartRequestListenerRuntime.js")
                )
                .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartRequestListenerRuntime.ts"
            )
        );
        const runtimeScopeSource = runtimeSource.slice(
            runtimeSource.indexOf(
                "export interface RenderChartRequestListenerRuntimeScope"
            ),
            runtimeSource.indexOf(
                "export interface RenderChartRequestListenerRuntime"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain(
            "defaultRenderChartRequestListenerRuntimeScope"
        );
        expect(runtimeSource).toContain(
            "getAddEventListener: () => globalThis.addEventListener"
        );
        expect(runtimeSource).toContain(
            "getCustomEvent: () => globalThis.CustomEvent"
        );
        expect(runtimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(runtimeSource).toContain(
            "getHTMLElement: () => globalThis.HTMLElement"
        );
        expect(runtimeSource).not.toContain(
            "scope: RenderChartRequestListenerRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "RenderChartRequestListenerRuntimeScope = globalThis"
        );
        expect(runtimeScopeSource).not.toContain("readonly addEventListener?:");
        expect(runtimeScopeSource).not.toContain("readonly CustomEvent?:");
        expect(runtimeScopeSource).not.toContain("readonly document?:");
        expect(runtimeScopeSource).not.toContain("readonly HTMLElement?:");
        expect(runtimeSource).not.toContain("scope.addEventListener");
        expect(runtimeSource).not.toContain("scope.CustomEvent");
        expect(runtimeSource).not.toContain("scope.document");
        expect(runtimeSource).not.toContain("scope.HTMLElement");
        expect(runtimeSource).toContain(
            "const addEventListener = scope.getAddEventListener?.();"
        );
        expect(runtimeSource).toContain("scope.getCustomEvent?.()");
        expect(runtimeSource).toContain(
            "const runtimeDocument = scope.getDocument?.();"
        );
        expect(runtimeSource).toContain("scope.getHTMLElement?.()");
    });

    it("keeps chart startup browser APIs behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedRenderChartStartupRuntimeFiles
            .filter((relativeFile) =>
                directRenderChartStartupRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedRenderChartStartupRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "renderChartStartupRuntime.js"
                    )
            )
            .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartStartupRuntime.ts"
            )
        );
        const runtimeScopeSource = runtimeSource.slice(
            runtimeSource.indexOf(
                "export interface RenderChartStartupRuntimeScope"
            ),
            runtimeSource.indexOf("export interface RenderChartStartupRuntime")
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain(
            "defaultRenderChartStartupRuntimeScope"
        );
        expect(runtimeSource).toContain(
            "getAddEventListener: () => globalThis.addEventListener"
        );
        expect(runtimeSource).toContain(
            'isRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(runtimeSource).not.toContain(
            "scope: RenderChartStartupRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "RenderChartStartupRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain("scope.window");
        expect(runtimeSource).not.toContain("window?:");
        expect(runtimeSource).toContain(
            "renderChartStartup requires addEventListener"
        );
        expect(runtimeScopeSource).not.toContain("readonly addEventListener?:");
        expect(runtimeSource).not.toContain("scope.addEventListener");
        expect(runtimeSource).toContain(
            "return scope.getAddEventListener?.();"
        );
    });

    it("keeps renderChartJS timer APIs behind chart timer helpers", () => {
        expect.assertions(2);

        const violations = migratedRenderChartJsTimerRuntimeFiles
            .filter((relativeFile) =>
                directRenderChartJsTimerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedRenderChartJsTimerRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "renderChartDebounce.js"
                    )
            )
            .sort();

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
    });

    it("keeps chart helper timer APIs behind the timer runtime facade", () => {
        expect.assertions(13);

        const violations = migratedRenderChartTimerRuntimeFiles
            .filter((relativeFile) =>
                directRenderChartTimerRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedRenderChartTimerRuntimeFiles
            .filter(
                (relativeFile) =>
                    !stripComments(readRepositoryFile(relativeFile)).includes(
                        "renderChartTimerRuntime.js"
                    )
            )
            .sort();
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/core/renderChartTimerRuntime.ts"
            )
        );
        const runtimeScopeSource = runtimeSource.slice(
            runtimeSource.indexOf(
                "export interface RenderChartTimerRuntimeScope"
            ),
            runtimeSource.indexOf("export interface RenderChartTimerRuntime {")
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(runtimeSource).toContain("defaultRenderChartTimerRuntimeScope");
        expect(runtimeScopeSource).not.toContain("readonly clearTimeout?:");
        expect(runtimeScopeSource).not.toContain("readonly setTimeout?:");
        expect(runtimeSource).not.toContain("scope.clearTimeout");
        expect(runtimeSource).not.toContain("scope.setTimeout");
        expect(runtimeSource).not.toContain(
            "scope: RenderChartTimerRuntimeScope = globalThis"
        );
        expect(runtimeSource).not.toContain(
            "RenderChartTimerRuntimeScope =\n    globalThis"
        );
        expect(runtimeSource).toContain(
            "render chart timers require setTimeout"
        );
        expect(runtimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(runtimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(runtimeSource).toContain(
            "const setTimeout = scope.getSetTimeout?.();"
        );
    });

    it("keeps summary column modal viewport reads behind the runtime facade", () => {
        expect.assertions(16);

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
        const summaryColModalRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/summaryColModalRuntime.ts"
            )
        );
        const summaryColModalRuntimeScopeSource =
            summaryColModalRuntimeSource.slice(
                summaryColModalRuntimeSource.indexOf(
                    "export interface SummaryColModalRuntimeScope"
                ),
                summaryColModalRuntimeSource.indexOf(
                    "export interface SummaryColModalViewport"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(summaryColModalSource).toContain("summaryColModalRuntime.js");
        expect(summaryColModalSource).toContain("createAbortController");
        expect(summaryColModalRuntimeSource).toContain(
            "defaultSummaryColModalRuntimeScope"
        );
        expect(summaryColModalRuntimeSource).not.toContain(
            "scope: SummaryColModalRuntimeScope = globalThis"
        );
        expect(summaryColModalRuntimeSource).not.toContain(
            "SummaryColModalRuntimeScope =\n    globalThis"
        );
        expect(summaryColModalRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(summaryColModalRuntimeScopeSource).not.toContain(
            "readonly innerHeight?:"
        );
        expect(summaryColModalRuntimeScopeSource).not.toContain(
            "readonly innerWidth?:"
        );
        expect(summaryColModalRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(summaryColModalRuntimeSource).not.toContain("scope.innerHeight");
        expect(summaryColModalRuntimeSource).not.toContain("scope.innerWidth");
        expect(summaryColModalRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(summaryColModalRuntimeSource).toContain(
            "height: globalThis.innerHeight"
        );
        expect(summaryColModalRuntimeSource).toContain(
            "width: globalThis.innerWidth"
        );
        expect(summaryColModalRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
    });

    it("keeps user/device info box listener cleanup behind the runtime facade", () => {
        expect.assertions(10);

        const violations = migratedUserDeviceInfoBoxRuntimeFiles
            .filter((relativeFile) =>
                directUserDeviceInfoBoxRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const userDeviceInfoBoxSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/components/createUserDeviceInfoBox.ts"
            )
        );
        const userDeviceInfoBoxRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/components/createUserDeviceInfoBoxRuntime.ts"
            )
        );
        const userDeviceInfoBoxRuntimeScopeSource =
            userDeviceInfoBoxRuntimeSource.slice(
                userDeviceInfoBoxRuntimeSource.indexOf(
                    "export interface UserDeviceInfoBoxRuntimeScope"
                ),
                userDeviceInfoBoxRuntimeSource.indexOf(
                    "export interface UserDeviceInfoBoxRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(userDeviceInfoBoxSource).toContain(
            "createUserDeviceInfoBoxRuntime.js"
        );
        expect(userDeviceInfoBoxSource).toContain("createAbortController");
        expect(userDeviceInfoBoxRuntimeSource).toContain(
            "defaultUserDeviceInfoBoxRuntimeScope"
        );
        expect(userDeviceInfoBoxRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(userDeviceInfoBoxRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(userDeviceInfoBoxRuntimeSource).not.toContain(
            "scope: UserDeviceInfoBoxRuntimeScope = globalThis"
        );
        expect(userDeviceInfoBoxRuntimeSource).not.toContain(
            "UserDeviceInfoBoxRuntimeScope =\n    globalThis"
        );
        expect(userDeviceInfoBoxRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(userDeviceInfoBoxRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
    });

    it("keeps render-summary scheduling APIs behind the runtime facade", () => {
        expect.assertions(18);

        const violations = migratedRenderSummaryRuntimeFiles
            .filter((relativeFile) =>
                directRenderSummarySchedulingRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const renderSummarySource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/renderSummaryHelpers.ts"
            )
        );
        const renderSummaryRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/renderSummaryRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(renderSummarySource).toContain("renderSummaryRuntime.js");
        expect(renderSummarySource).toContain("createAbortController");
        expect(renderSummaryRuntimeSource).toContain(
            "defaultRenderSummaryRuntimeScope"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "scope: RenderSummaryRuntimeScope = globalThis"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "const defaultRenderSummaryRuntimeScope: RenderSummaryRuntimeScope = globalThis"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(renderSummaryRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(renderSummaryRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(renderSummaryRuntimeSource).toContain(
            "getAddEventListener: () => globalThis.addEventListener"
        );
        expect(renderSummaryRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(renderSummaryRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
    });

    it("keeps controls-state computed style reads behind the runtime facade", () => {
        expect.assertions(4);

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
        const updateControlsStateRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/helpers/updateControlsStateRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateControlsStateSource).toContain(
            "updateControlsStateRuntime.js"
        );
        expect(updateControlsStateRuntimeSource).not.toMatch(
            directUpdateControlsStateRuntimeAmbientGetterPattern
        );
        expect(updateControlsStateRuntimeSource).toContain(
            "defaultUpdateControlsStateRuntimeScope"
        );
    });

    it("keeps tab-button debug runtime checks behind the runtime facade", () => {
        expect.assertions(26);

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
        const enableTabButtonsDebugRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsDebugRuntime.ts"
            )
        );
        const enableTabButtonsDebugRuntimeScopeSource =
            enableTabButtonsDebugRuntimeSource.slice(
                enableTabButtonsDebugRuntimeSource.indexOf(
                    "export interface EnableTabButtonsDebugRuntimeScope"
                ),
                enableTabButtonsDebugRuntimeSource.indexOf(
                    "export interface EnableTabButtonsDebugRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsDebugSource).toContain(
            "enableTabButtonsDebugRuntime.js"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toMatch(
            directEnableTabButtonsDebugRuntimeAmbientFallbackPattern
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "defaultEnableTabButtonsDebugRuntimeScope"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "getComputedStyleFunction: () => globalThis.getComputedStyle"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            'isRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope: EnableTabButtonsDebugRuntimeScope = globalThis"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "EnableTabButtonsDebugRuntimeScope = globalThis"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope.window"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain("window?:");
        expect(enableTabButtonsDebugRuntimeScopeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(enableTabButtonsDebugRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(enableTabButtonsDebugRuntimeScopeSource).not.toContain(
            "readonly getComputedStyle?:"
        );
        expect(enableTabButtonsDebugRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope.getComputedStyle;"
        );
        expect(enableTabButtonsDebugRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "return scope.getComputedStyleFunction?.();"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "const clearTimer = scope.getClearTimeout?.();"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "const scheduleTimer = scope.getSetTimeout?.();"
        );
        expect(enableTabButtonsDebugRuntimeSource).toContain(
            "enableTabButtonsDebug requires a setTimeout runtime"
        );
    });

    it("keeps tab-button state browser APIs behind the runtime facade", () => {
        expect.assertions(24);

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
        const enableTabButtonsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsRuntime.ts"
            )
        );
        const enableTabButtonsRuntimeScopeSource =
            enableTabButtonsRuntimeSource.slice(
                enableTabButtonsRuntimeSource.indexOf(
                    "export interface EnableTabButtonsRuntimeScope"
                ),
                enableTabButtonsRuntimeSource.indexOf(
                    "export interface EnableTabButtonsRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsSource).toContain("enableTabButtonsRuntime.js");
        expect(enableTabButtonsRuntimeSource).not.toMatch(
            directEnableTabButtonsRuntimeAmbientTimerFallbackPattern
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "defaultEnableTabButtonsRuntimeScope"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "getMutationObserver: () => globalThis.MutationObserver"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            'isRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "scope: EnableTabButtonsRuntimeScope = globalThis"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "EnableTabButtonsRuntimeScope = globalThis"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain("scope.window");
        expect(enableTabButtonsRuntimeSource).not.toContain("window?:");
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "EnableTabButtonsRuntimeWindow"
        );
        expect(enableTabButtonsRuntimeScopeSource).not.toContain(
            "readonly compatibilityMutationObserver?:"
        );
        expect(enableTabButtonsRuntimeScopeSource).not.toContain(
            "readonly MutationObserver?:"
        );
        expect(enableTabButtonsRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(enableTabButtonsRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "scope.compatibilityMutationObserver"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "scope.MutationObserver"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(enableTabButtonsRuntimeSource).not.toContain("scope.setTimeout");
        expect(enableTabButtonsRuntimeSource).toContain(
            "const candidate = scope.getMutationObserver?.();"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "const clearTimer = scope.getClearTimeout?.();"
        );
        expect(enableTabButtonsRuntimeSource).toContain(
            "enableTabButtons requires a setTimeout runtime"
        );
    });

    it("keeps tab-button helper DOM reads behind the runtime facade", () => {
        expect.assertions(16);

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
        const enableTabButtonsHelpersRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/controls/enableTabButtonsHelpersRuntime.ts"
            )
        );
        const enableTabButtonsHelpersRuntimeScopeSource =
            enableTabButtonsHelpersRuntimeSource.slice(
                enableTabButtonsHelpersRuntimeSource.indexOf(
                    "export interface EnableTabButtonsHelpersRuntimeScope"
                ),
                enableTabButtonsHelpersRuntimeSource.indexOf(
                    "export interface EnableTabButtonsHelpersRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(enableTabButtonsHelpersSource).toContain(
            "enableTabButtonsHelpersRuntime.js"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            "defaultEnableTabButtonsHelpersRuntimeScope"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            "getComputedStyleFunction: () => globalThis.getComputedStyle"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            'isRendererScope: () => Reflect.has(globalThis, "document")'
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain(
            "scope: EnableTabButtonsHelpersRuntimeScope = globalThis"
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain(
            "EnableTabButtonsHelpersRuntimeScope = globalThis"
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain(
            "scope.window"
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain("window?:");
        expect(enableTabButtonsHelpersRuntimeScopeSource).not.toContain(
            "readonly document?:"
        );
        expect(enableTabButtonsHelpersRuntimeScopeSource).not.toContain(
            "readonly getComputedStyle?:"
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(enableTabButtonsHelpersRuntimeSource).not.toContain(
            "scope.getComputedStyle;"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            "return scope.getDocument?.();"
        );
        expect(enableTabButtonsHelpersRuntimeSource).toContain(
            "return scope.getComputedStyleFunction?.();"
        );
    });

    it("keeps tab visibility browser APIs behind the runtime facade", () => {
        expect.assertions(19);

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
        const updateTabVisibilityRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/updateTabVisibilityRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(updateTabVisibilitySource).toContain(
            "updateTabVisibilityRuntime.js"
        );
        expect(updateTabVisibilityRuntimeSource).not.toMatch(
            directUpdateTabVisibilityRuntimeAmbientTimerFallbackPattern
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "defaultUpdateTabVisibilityRuntimeScope"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "scope: UpdateTabVisibilityRuntimeScope = globalThis"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "const defaultUpdateTabVisibilityRuntimeScope: UpdateTabVisibilityRuntimeScope = globalThis"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "scope.document"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(updateTabVisibilityRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(updateTabVisibilityRuntimeSource).toContain(
            "updateTabVisibility requires a setTimeout runtime"
        );
    });

    it("keeps renderer application startup browser primitives behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedRendererApplicationStartupRuntimeFiles
            .filter((relativeFile) =>
                directRendererApplicationStartupRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const applicationStartupSource = stripComments(
            readRepositoryFile("electron-app/renderer/applicationStartup.ts")
        );
        const runtimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/applicationStartupRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(applicationStartupSource).toContain(
            "applicationStartupRuntime.js"
        );
        expect(runtimeSource).not.toMatch(
            directRendererApplicationStartupRuntimeAmbientFallbackPattern
        );
        expect(runtimeSource).toContain(
            "defaultRendererApplicationStartupRuntimeScope"
        );
        expect(runtimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(runtimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(runtimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(runtimeSource).not.toContain("readonly AbortController?:");
        expect(runtimeSource).not.toContain("readonly clearTimeout?:");
        expect(runtimeSource).not.toContain("readonly setTimeout?:");
        expect(runtimeSource).not.toContain("scope.AbortController");
        expect(runtimeSource).not.toContain("scope.clearTimeout");
        expect(runtimeSource).not.toContain("scope.setTimeout");
    });

    it("keeps renderer application lifecycle abort controllers behind the runtime facade", () => {
        expect.assertions(10);

        const violations =
            migratedRendererApplicationLifecycleWiringRuntimeFiles
                .filter((relativeFile) =>
                    directRendererApplicationLifecycleWiringRuntimeGlobalPattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
                )
                .sort();
        const lifecycleWiringSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/applicationLifecycleWiring.ts"
            )
        );
        const lifecycleWiringRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/applicationLifecycleWiringRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(lifecycleWiringSource).toContain(
            "applicationLifecycleWiringRuntime.js"
        );
        expect(lifecycleWiringSource).toContain(
            "globalEventTarget: RendererApplicationLifecycleGlobalEventTarget"
        );
        expect(lifecycleWiringSource).not.toContain("windowTarget");
        expect(lifecycleWiringSource).not.toContain(
            "RendererApplicationLifecycleWindow"
        );
        expect(lifecycleWiringRuntimeSource).toContain(
            "defaultRendererApplicationLifecycleWiringRuntimeScope"
        );
        expect(lifecycleWiringRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(lifecycleWiringRuntimeSource).not.toMatch(
            directRendererApplicationLifecycleWiringRuntimeAmbientGetterPattern
        );
        expect(lifecycleWiringRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(lifecycleWiringRuntimeSource).not.toContain(
            "scope.AbortController"
        );
    });

    it("keeps renderer file-input abort controllers behind the runtime facade", () => {
        expect.assertions(11);

        const violations = migratedRendererFileInputStartupRuntimeFiles
            .filter((relativeFile) =>
                directRendererFileInputStartupRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const fileInputStartupSource = stripComments(
            readRepositoryFile("electron-app/renderer/fileInputStartup.ts")
        );
        const fileInputWiringSource = stripComments(
            readRepositoryFile("electron-app/renderer/fileInputWiring.ts")
        );
        const fileInputStartupRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/fileInputStartupRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(fileInputStartupSource).toContain("fileInputStartupRuntime.js");
        expect(fileInputStartupSource).toContain(
            "globalEventTarget: RendererFileInputEventTarget"
        );
        expect(fileInputStartupSource).not.toContain("windowTarget");
        expect(fileInputWiringSource).toContain("globalEventTarget");
        expect(fileInputWiringSource).not.toContain("windowTarget");
        expect(fileInputStartupRuntimeSource).toContain(
            "defaultRendererFileInputStartupRuntimeScope"
        );
        expect(fileInputStartupRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(fileInputStartupRuntimeSource).not.toMatch(
            directRendererFileInputStartupRuntimeAmbientGetterPattern
        );
        expect(fileInputStartupRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(fileInputStartupRuntimeSource).not.toContain(
            "scope.AbortController"
        );
    });

    it("keeps renderer test-only bootstrap abort controllers behind the runtime facade", () => {
        expect.assertions(9);

        const violations = migratedRendererTestOnlyBootstrapRuntimeFiles
            .filter((relativeFile) =>
                directRendererTestOnlyBootstrapRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const testOnlyBootstrapSource = stripComments(
            readRepositoryFile("electron-app/renderer/testOnlyBootstrap.ts")
        );
        const testOnlyBootstrapRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/testOnlyBootstrapRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(testOnlyBootstrapSource).toContain(
            "testOnlyBootstrapRuntime.js"
        );
        expect(testOnlyBootstrapSource).toContain("globalEventTarget");
        expect(testOnlyBootstrapSource).not.toContain("windowTarget");
        expect(testOnlyBootstrapRuntimeSource).toContain(
            "defaultRendererTestOnlyBootstrapRuntimeScope"
        );
        expect(testOnlyBootstrapRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(testOnlyBootstrapRuntimeSource).not.toMatch(
            directRendererTestOnlyBootstrapRuntimeAmbientGetterPattern
        );
        expect(testOnlyBootstrapRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(testOnlyBootstrapRuntimeSource).not.toContain(
            "scope.AbortController"
        );
    });

    it("keeps renderer vendor loader browser APIs behind the runtime facade", () => {
        expect.assertions(22);

        const violations = migratedRendererVendorBundleLoaderRuntimeFiles
            .filter((relativeFile) =>
                directRendererVendorBundleLoaderRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const vendorBundleLoaderSource = stripComments(
            readRepositoryFile("electron-app/renderer/vendorBundleLoader.ts")
        );
        const vendorBundleLoaderRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/vendorBundleLoaderRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(vendorBundleLoaderSource).toContain(
            "vendorBundleLoaderRuntime.js"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toMatch(
            directRendererVendorBundleLoaderRuntimeAmbientFallbackPattern
        );
        expect(vendorBundleLoaderRuntimeSource).not.toMatch(
            directRendererVendorBundleLoaderRuntimeAmbientGetterPattern
        );
        expect(vendorBundleLoaderRuntimeSource).toContain(
            "renderer vendor loader requires a setTimeout runtime"
        );
        expect(vendorBundleLoaderRuntimeSource).toContain(
            "getNow: () => Date.now"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly HTMLScriptElement?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain("readonly now?:");
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly removeEventListener?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain("scope.document");
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.HTMLScriptElement"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain("scope.now");
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.removeEventListener"
        );
        expect(vendorBundleLoaderRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
    });

    it("keeps network fetch and timeout APIs behind the runtime facade", () => {
        expect.assertions(18);

        const violations = migratedNetworkUtilsRuntimeFiles
            .filter((relativeFile) =>
                directNetworkUtilsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const networkUtilsSource = stripComments(
            readRepositoryFile("electron-app/utils/net/networkUtils.ts")
        );
        const networkUtilsRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/net/networkUtilsRuntime.ts")
        );

        expect(violations).toStrictEqual([]);
        expect(networkUtilsSource).toContain("networkUtilsRuntime.js");
        expect(networkUtilsRuntimeSource).not.toMatch(
            directNetworkUtilsRuntimeAmbientFallbackPattern
        );
        expect(networkUtilsRuntimeSource).toContain(
            "defaultNetworkUtilsRuntimeScope"
        );
        expect(networkUtilsRuntimeSource).not.toContain(
            "const defaultNetworkUtilsRuntimeScope: NetworkUtilsRuntimeScope = globalThis"
        );
        expect(networkUtilsRuntimeSource).toContain(
            "getFetch: () => globalThis.fetch"
        );
        expect(networkUtilsRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(networkUtilsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(networkUtilsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(networkUtilsRuntimeSource).toContain(
            "const fetchRef = getScopeFetch(scope);"
        );
        expect(networkUtilsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(networkUtilsRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(networkUtilsRuntimeSource).not.toContain("readonly fetch?:");
        expect(networkUtilsRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(networkUtilsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(networkUtilsRuntimeSource).not.toContain("scope.clearTimeout");
        expect(networkUtilsRuntimeSource).not.toContain("scope.fetch");
        expect(networkUtilsRuntimeSource).not.toContain("scope.setTimeout");
    });

    it("keeps app performance scheduling APIs behind the runtime facade", () => {
        expect.assertions(17);

        const violations = migratedPerformanceUtilsRuntimeFiles
            .filter((relativeFile) =>
                directPerformanceUtilsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const performanceUtilsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/performance/performanceUtils.ts"
            )
        );
        const performanceUtilsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/performance/performanceUtilsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(performanceUtilsSource).toContain("performanceUtilsRuntime.js");
        expect(performanceUtilsRuntimeSource).not.toMatch(
            directPerformanceUtilsRuntimeAmbientFallbackPattern
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "readonly cancelIdleCallback?:"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "readonly dateNow?:"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "readonly requestIdleCallback?:"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "scope.cancelIdleCallback"
        );
        expect(performanceUtilsRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(performanceUtilsRuntimeSource).not.toContain("scope.dateNow");
        expect(performanceUtilsRuntimeSource).not.toContain(
            "scope.requestIdleCallback"
        );
        expect(performanceUtilsRuntimeSource).not.toContain("scope.setTimeout");
        expect(performanceUtilsRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(performanceUtilsRuntimeSource).toContain(
            "getDateNow: () => Date.now"
        );
        expect(performanceUtilsRuntimeSource).toContain(
            "getRequestIdleCallback: getDefaultRequestIdleCallback"
        );
        expect(performanceUtilsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
    });

    it("keeps async cancellation timers behind the runtime facade", () => {
        expect.assertions(13);

        const violations = migratedCancellationTokenRuntimeFiles
            .filter((relativeFile) =>
                directCancellationTokenRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const cancellationTokenSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/async/cancellationToken.ts"
            )
        );
        const cancellationTokenRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/app/async/cancellationTokenRuntime.ts"
            )
        );
        const cancellationTokenRuntimeScopeSource =
            cancellationTokenRuntimeSource.slice(
                cancellationTokenRuntimeSource.indexOf(
                    "export interface CancellationTokenRuntimeScope"
                ),
                cancellationTokenRuntimeSource.indexOf(
                    "export interface CancellationTokenRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(cancellationTokenSource).toContain(
            "cancellationTokenRuntime.js"
        );
        expect(cancellationTokenRuntimeSource).not.toMatch(
            directCancellationTokenRuntimeAmbientFallbackPattern
        );
        expect(cancellationTokenRuntimeSource).toContain(
            "defaultCancellationTokenRuntimeScope"
        );
        expect(cancellationTokenRuntimeSource).not.toContain(
            "CancellationTokenRuntimeScope =\nglobalThis"
        );
        expect(cancellationTokenRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(cancellationTokenRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(cancellationTokenRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(cancellationTokenRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(cancellationTokenRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(cancellationTokenRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(cancellationTokenRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(cancellationTokenRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps chart hover effect scheduling behind the runtime facade", () => {
        expect.assertions(31);

        const violations = migratedChartHoverEffectsRuntimeFiles
            .filter((relativeFile) =>
                directChartHoverEffectsRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const chartHoverEffectsSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/plugins/addChartHoverEffects.ts"
            )
        );
        const chartHoverEffectsRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/charts/plugins/addChartHoverEffectsRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(chartHoverEffectsSource).toContain(
            "addChartHoverEffectsRuntime.js"
        );
        expect(chartHoverEffectsSource).toContain("createAbortController");
        expect(chartHoverEffectsSource).toContain("addDocumentKeydownListener");
        expect(chartHoverEffectsSource).toContain("addDocumentEventListener");
        expect(chartHoverEffectsSource).not.toContain(
            "document.addEventListener"
        );
        expect(chartHoverEffectsSource).not.toContain(
            "document.removeEventListener"
        );
        expect(chartHoverEffectsRuntimeSource).not.toMatch(
            directChartHoverEffectsRuntimeAmbientFallbackPattern
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "defaultChartHoverEffectsRuntimeScope"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "scope: ChartHoverEffectsRuntimeScope = globalThis"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "ChartHoverEffectsRuntimeScope = globalThis"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "readonly documentEventTarget?:"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain("scope.document");
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(chartHoverEffectsRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "scope.getDocumentEventTarget?.()"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "const AbortControllerConstructor = scope.getAbortController?.();"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "scope.getRequestAnimationFrame?.()"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "chart hover effects require a setTimeout runtime"
        );
        expect(chartHoverEffectsRuntimeSource).toContain(
            "chart hover effects require a document event-target runtime"
        );
    });

    it("keeps tab-state map invalidation timing behind the runtime facade", () => {
        expect.assertions(23);

        const violations = migratedTabStateManagerHandlersRuntimeFiles
            .filter((relativeFile) =>
                directTabStateManagerHandlersRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const tabStateManagerHandlersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabStateManagerHandlers.ts"
            )
        );
        const tabStateManagerHandlersRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/tabs/tabStateManagerHandlersRuntime.ts"
            )
        );
        const tabStateManagerHandlersRuntimeScopeSource =
            tabStateManagerHandlersRuntimeSource.slice(
                tabStateManagerHandlersRuntimeSource.indexOf(
                    "export interface TabStateManagerHandlersRuntimeScope"
                ),
                tabStateManagerHandlersRuntimeSource.indexOf(
                    "export interface TabStateManagerHandlersRuntime {"
                )
            );

        expect(violations).toStrictEqual([]);
        expect(tabStateManagerHandlersSource).toContain(
            "tabStateManagerHandlersRuntime.js"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toMatch(
            directTabStateManagerHandlersRuntimeAmbientTimerFallbackPattern
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "defaultTabStateManagerHandlersRuntimeScope"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "scope: TabStateManagerHandlersRuntimeScope = globalThis"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "TabStateManagerHandlersRuntimeScope =\nglobalThis"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "tabStateManagerHandlers requires a setTimeout runtime"
        );
        expect(tabStateManagerHandlersRuntimeScopeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(tabStateManagerHandlersRuntimeScopeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(tabStateManagerHandlersRuntimeScopeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(tabStateManagerHandlersRuntimeScopeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(tabStateManagerHandlersRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "getCancelAnimationFrame: () => globalThis.cancelAnimationFrame"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "getClearTimeout: () => globalThis.clearTimeout"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "getRequestAnimationFrame: () => globalThis.requestAnimationFrame"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "scope.getCancelAnimationFrame?.()?.(handle);"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "const clearTimeoutRef = scope.getClearTimeout?.();"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "const requestAnimationFrameRef = scope.getRequestAnimationFrame?.();"
        );
        expect(tabStateManagerHandlersRuntimeSource).toContain(
            "const setTimeoutRef = scope.getSetTimeout?.();"
        );
    });

    it("keeps unified control-bar browser APIs behind the runtime facade", () => {
        expect.assertions(24);

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
        const unifiedControlBarRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/unifiedControlBarRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(unifiedControlBarSource).toContain(
            "unifiedControlBarRuntime.js"
        );
        expect(unifiedControlBarSource).toContain("createAbortController");
        expect(unifiedControlBarRuntimeSource).not.toMatch(
            directUnifiedControlBarRuntimeAmbientFallbackPattern
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly MutationObserver?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain("scope.document");
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.eventTarget"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.HTMLElement"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.MutationObserver"
        );
        expect(unifiedControlBarRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "getMutationObserver: () => globalThis.MutationObserver"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "getSetTimeout: () => globalThis.setTimeout"
        );
        expect(unifiedControlBarRuntimeSource).toContain(
            "unifiedControlBar requires a setTimeout runtime"
        );
    });

    it("keeps quick color switcher timers behind the runtime facade", () => {
        expect.assertions(17);

        const violations = migratedQuickColorSwitcherRuntimeFiles
            .filter((relativeFile) =>
                directQuickColorSwitcherRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const quickColorSwitcherSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/quickColorSwitcher.ts")
        );
        const quickColorSwitcherRuntimeSource = stripComments(
            readRepositoryFile(quickColorSwitcherRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(quickColorSwitcherSource).toContain(
            "quickColorSwitcherRuntime.js"
        );
        expect(quickColorSwitcherSource).toContain("createAbortController");
        expect(quickColorSwitcherSource).toContain("addDocumentClickListener");
        expect(quickColorSwitcherRuntimeSource).toContain(
            "const runtimeDocument = getDocument(scope);"
        );
        expect(quickColorSwitcherRuntimeSource).toContain(
            "defaultQuickColorSwitcherRuntimeScope"
        );
        expect(quickColorSwitcherRuntimeSource).not.toMatch(
            directQuickColorSwitcherRuntimeAmbientGetterPattern
        );
        expect(quickColorSwitcherRuntimeSource).not.toMatch(
            directQuickColorSwitcherRuntimeAmbientTimerFallbackPattern
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "scope.clearTimeout"
        );
        expect(quickColorSwitcherRuntimeSource).not.toContain("scope.document");
        expect(quickColorSwitcherRuntimeSource).not.toContain(
            "scope.setTimeout"
        );
        expect(quickColorSwitcherRuntimeSource).toContain(
            "quickColorSwitcher requires a setTimeout runtime"
        );
    });

    it("keeps shown-files list browser APIs behind the runtime facade", () => {
        expect.assertions(28);

        const violations = migratedShownFilesListRuntimeFiles
            .filter((relativeFile) =>
                directShownFilesListRuntimeGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const sourcesMissingRuntime = migratedShownFilesListRuntimeFiles
            .filter((relativeFile) => {
                const source = stripComments(readRepositoryFile(relativeFile));
                return !source.includes("shownFilesListRuntime.js");
            })
            .sort();
        const shownFilesListRuntimeSource = stripComments(
            readRepositoryFile(shownFilesListRuntimeSourceFile)
        );

        expect(violations).toStrictEqual([]);
        expect(sourcesMissingRuntime).toStrictEqual([]);
        expect(shownFilesListRuntimeSource).toContain(
            "const body = scope.getDocument?.()?.body;"
        );
        expect(shownFilesListRuntimeSource).toContain(
            "defaultShownFilesListRuntimeScope"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "scope: ShownFilesListRuntimeScope = globalThis"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "const defaultShownFilesListRuntimeScope: ShownFilesListRuntimeScope =\n    globalThis"
        );
        expect(shownFilesListRuntimeSource).not.toMatch(
            directShownFilesListRuntimeAmbientFallbackPattern
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly clearTimeout?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly innerHeight?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly innerWidth?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "readonly setTimeout?:"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(shownFilesListRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(shownFilesListRuntimeSource).not.toContain("scope.clearTimeout");
        expect(shownFilesListRuntimeSource).not.toContain("scope.document");
        expect(shownFilesListRuntimeSource).not.toContain("scope.innerHeight");
        expect(shownFilesListRuntimeSource).not.toContain("scope.innerWidth");
        expect(shownFilesListRuntimeSource).not.toContain("scope.setTimeout");
        expect(shownFilesListRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(shownFilesListRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(shownFilesListRuntimeSource).toContain(
            "shownFilesList requires a setTimeout runtime"
        );
        const shownFilesItemHandlerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/components/shownFilesListItemHandlers.ts"
            )
        );
        expect(shownFilesItemHandlerSource).toContain("createAbortController");
        expect(shownFilesItemHandlerSource).toContain("getViewport");
        const createShownFilesListSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/rendering/components/createShownFilesList.ts"
            )
        );
        expect(createShownFilesListSource).toContain("createAbortController");
        expect(createShownFilesListSource).toContain(
            "addBodyThemeChangeListener"
        );
    });

    it("keeps credits marquee browser APIs behind the runtime facade", () => {
        expect.assertions(25);

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
        const creditsMarqueeRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/layout/enhanceCreditsSectionRuntime.ts"
            )
        );

        expect(violations).toStrictEqual([]);
        expect(enhanceCreditsSectionSource).toContain(
            "enhanceCreditsSectionRuntime.js"
        );
        expect(enhanceCreditsSectionSource).toContain("createAbortController");
        expect(creditsMarqueeRuntimeSource).toContain(
            "defaultCreditsMarqueeRuntimeScope"
        );
        expect(creditsMarqueeRuntimeSource).not.toMatch(
            directCreditsMarqueeRuntimeAmbientFallbackPattern
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope: CreditsMarqueeRuntimeScope = globalThis"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "const defaultCreditsMarqueeRuntimeScope: CreditsMarqueeRuntimeScope = globalThis"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly cancelAnimationFrame?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly document?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly HTMLElement?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly MutationObserver?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly requestAnimationFrame?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "readonly ResizeObserver?:"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope.cancelAnimationFrame"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain("scope.document");
        expect(creditsMarqueeRuntimeSource).not.toContain("scope.eventTarget");
        expect(creditsMarqueeRuntimeSource).not.toContain("scope.HTMLElement");
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope.MutationObserver"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope.requestAnimationFrame"
        );
        expect(creditsMarqueeRuntimeSource).not.toContain(
            "scope.ResizeObserver"
        );
        expect(creditsMarqueeRuntimeSource).toContain(
            "getDocument: () => globalThis.document"
        );
        expect(creditsMarqueeRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
    });

    it("keeps credits marquee tests on explicit runtime fixtures", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/utils/ui/layout/enhanceCreditsSection.test.ts",
            "tests/unit/strictTests/ui/layout/enhanceCreditsSection.test.ts",
        ]
            .filter((relativeFile) =>
                creditsMarqueeTestDirectGlobalFixtureMutationPattern.test(
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

    it("keeps Leaflet plugins wired through the runtime adapter without a public compatibility global", () => {
        expect.assertions(48);

        const vendorMapEntry = stripComments(
            readRepositoryFile("electron-app/renderer/rendererVendorMap.ts")
        );
        const vendorMapRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/rendererVendorMapRuntime.ts"
            )
        );
        const leafletRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/core/leafletRuntime.ts")
        );
        const leafletMeasureLiteRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/leafletMeasureLiteRuntime.js"
            )
        );
        const viteRendererConfig = stripComments(
            readRepositoryFile("vite.renderer.config.mjs")
        );
        const vitestSetupSource = stripComments(
            readRepositoryFile("tests/vitest/setupVitest.mjs")
        );
        const renderMapSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/core/renderMap.ts")
        );
        const mapDrawLapsSource = stripComments(
            readRepositoryFile("electron-app/utils/maps/layers/mapDrawLaps.ts")
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
            'import("fitfileviewer:leaflet-draw-runtime")'
        );

        expect(vendorMapEntry).toContain(
            'import LeafletMiniMap from "leaflet-minimap"'
        );
        expect(vendorMapEntry).toContain("rendererVendorMapRuntime.js");
        expect(vendorMapEntry).toContain("setLeafletRuntime(Leaflet)");
        expect(vendorMapEntry).toContain("leafletRuntime: Leaflet");
        expect(vendorMapEntry).toContain(
            'import("fitfileviewer:leaflet-draw-runtime")'
        );
        expect(setLeafletRuntimeIndex).toBeGreaterThanOrEqual(0);
        expect(leafletDrawImportIndex).toBeGreaterThan(setLeafletRuntimeIndex);
        expect(vendorMapEntry).not.toContain('import("leaflet-draw")');
        expect(vendorMapEntry).not.toContain("leaflet.markercluster");
        expect(vendorMapEntry).not.toContain("globalThis.document");
        expect(vendorMapRuntimeSource).toContain(
            "defaultRendererVendorMapRuntimeScope"
        );
        expect(vendorMapRuntimeSource).not.toContain(
            "scope: RendererVendorMapRuntimeScope = globalThis"
        );
        expect(vendorMapRuntimeSource).not.toContain("readonly document?:");
        expect(vendorMapRuntimeSource).not.toContain("readonly globalScope?:");
        expect(vendorMapRuntimeSource).not.toContain("scope.document");
        expect(vendorMapRuntimeSource).not.toContain("scope.globalScope");
        expect(leafletMeasureLiteRuntimeSource).toContain(
            "getDocumentEventTarget: () => globalThis.document"
        );
        expect(leafletMeasureLiteRuntimeSource).not.toContain(
            "scope.documentEventTarget"
        );
        expect(leafletMeasureLiteRuntimeSource).toContain(
            "return scope.getDocumentEventTarget?.();"
        );
        expect(leafletRuntimeSource).not.toContain("Symbol.for");
        expect(leafletRuntimeSource).not.toContain("globalThis");
        expect(vendorMapEntry).not.toContain("setLegacyLeafletPluginRuntime");
        expect(vendorMapEntry).not.toContain(
            "installLeafletPluginCompatibilityGlobal"
        );
        expect(vendorMapEntry).not.toContain('defineMissingGlobal("L"');
        expect(vendorMapEntry).toContain("deleteCompatibilityGlobal");
        expect(vendorMapEntry).not.toContain("Reflect.deleteProperty");
        expect(globalDefinitionViolations).toStrictEqual([]);
        expect(viteRendererConfig).toContain(
            'const leafletDrawRuntimeModuleId = "fitfileviewer:leaflet-draw-runtime"'
        );
        expect(viteRendererConfig).toContain(
            'import.meta.resolve("leaflet-draw")'
        );
        expect(viteRendererConfig).toContain('"const L = Leaflet;"');
        expect(viteRendererConfig).not.toContain(
            "fitfileviewer-legacy-leaflet-plugin-runtime"
        );
        expect(viteRendererConfig).not.toContain("transform(code");
        expect(viteRendererConfig).not.toContain("resolveLeafletRuntime");
        expect(viteRendererConfig).not.toContain("legacyLeafletPluginRuntime");
        expect(viteRendererConfig).not.toContain("Symbol.for");
        expect(viteRendererConfig).not.toContain("globalThis");
        expect(viteRendererConfig).not.toContain(
            "/node_modules/leaflet-draw/dist/leaflet.draw.js"
        );
        expect(viteRendererConfig).not.toContain("leaflet.markercluster");
        expect(renderMapSource).not.toContain("markerClusterGroup");
        expect(mapDrawLapsSource).not.toContain("markerClusterGroup");
        expect(viteRendererConfig).not.toContain(
            "/node_modules/leaflet-minimap/dist/Control.MiniMap.min.js"
        );
        expect(vendorMapEntry).not.toContain('import("leaflet-minimap")');
        expect(vitestSetupSource).not.toContain("markerClusterGroup");
        expect(vitestSetupSource).not.toContain("setLeafletRuntime");
        expect(vitestSetupSource).not.toContain("leafletRuntime.js");
        expect(vitestSetupSource).not.toContain("leafletMock");
        expect(vitestSetupSource).not.toContain('vi.mock("leaflet"');
        expect(vitestSetupSource).not.toContain("maplibreGL");
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
        expect.assertions(93);

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
        const directChartThemeConfigGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directChartThemeConfigGlobalPattern.test(
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
            "docs/MOCK_COMMONJS_IN_ESM.md",
            "electron-app/main/security/externalUrlPolicy.ts",
            "electron-app/renderer/globalApiExposure.ts",
            "electron-app/renderer/leafletPluginCompatibilityGlobal.ts",
            "electron-app/renderer/rendererVendor.ts",
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
        expect(directChartThemeConfigGlobalLookups).toStrictEqual([]);
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

    it("keeps debug sensor tests from mutating retired globalData", () => {
        expect.assertions(1);

        expect(
            debugSensorInfoTestGlobalDataMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/debug/debugSensorInfo.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps unified state manager globalData tests from mutating retired globals", () => {
        expect.assertions(1);

        expect(
            unifiedStateManagerGlobalDataTestMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/state/core/unifiedStateManager.globalDataStore.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps computed state manager tests off retired globalData fixtures", () => {
        expect.assertions(1);

        expect(
            computedStateManagerTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/state/core/computedStateManager.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps loaded FIT file state tests from mutating retired globals", () => {
        expect.assertions(1);

        expect(
            loadedFitFilesTestGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/state/domain/loadedFitFilesState.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps main UI startup tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/main-ui.startup.test.ts",
            "tests/unit/strictTests/ui/main-ui.test.ts",
        ]
            .filter((relativeFile) =>
                mainUiTestRetiredGlobalMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps strict main UI tests off retired FIT data fixtures", () => {
        expect.assertions(1);

        expect(
            strictMainUiTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/ui/main-ui.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps zone-color picker tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        expect(
            zoneColorPickerTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/modals/openZoneColorPicker.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps keyboard-shortcuts modal tests from mutating retired renderer globals", () => {
        expect.assertions(2);

        const keyboardShortcutsModalTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/utils/ui/modals/keyboardShortcutsModal.test.ts"
            )
        );

        expect(
            keyboardShortcutsModalTestRetiredGlobalMutationPattern.test(
                keyboardShortcutsModalTestSource
            )
        ).toBe(false);
        expect(
            keyboardShortcutsModalTestDirectAnimationFrameStubPattern.test(
                keyboardShortcutsModalTestSource
            )
        ).toBe(false);
    });

    it("keeps settings modal tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        expect(
            settingsModalTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/settingsModal.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps render-summary tests from mutating retired active FIT filename globals", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/utils/rendering/helpers/renderSummaryHelpers.test.ts",
            "tests/unit/strictTests/rendering/core/renderSummary_and_helpers.test.ts",
        ]
            .filter((relativeFile) =>
                renderSummaryTestActiveFitFileNameMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps main-process tests from mutating retired dev helper globals", () => {
        expect.assertions(1);

        expect(
            mainProcessDevHelpersTestRetiredGlobalMutationPattern.test(
                stripComments(readRepositoryFile("tests/unit/main.test.ts"))
            )
        ).toBe(false);
    });

    it("keeps tab-state manager tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        expect(
            tabStateManagerTestRetiredRendererGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/tabs/tabStateManager.behavior.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps tab-state manager tests on scoped console spies", () => {
        expect.assertions(1);

        expect(
            tabStateManagerTestDirectConsoleMethodAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/tabs/tabStateManager.behavior.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps tab-button behavior tests on scoped console spies", () => {
        expect.assertions(1);

        expect(
            enableTabButtonsTestDirectConsoleMethodAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/enableTabButtons.behavior.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps renderChartJS comprehensive tests from mutating retired Chart.js globals", () => {
        expect.assertions(1);

        expect(
            renderChartJSComprehensiveTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/core/renderChartJS.comprehensive.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps renderChartJS comprehensive tests on scoped browser fixtures", () => {
        expect.assertions(1);

        expect(
            renderChartJSComprehensiveTestDirectBrowserFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/core/renderChartJS.comprehensive.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps chart zoom reset plugin tests on scoped canvas constructor fixtures", () => {
        expect.assertions(1);

        expect(
            chartZoomResetPluginTestDirectCanvasConstructorFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/plugins/chartZoomResetPlugin.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps renderChartJS state API tests from mutating retired Chart.js globals", () => {
        expect.assertions(1);

        expect(
            renderChartJSStateApiTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/renderChartJS.stateApi.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps strict about modal tests on descriptor-scoped animation fixtures", () => {
        expect.assertions(1);

        expect(
            aboutModalTestDirectRequestAnimationFrameAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/ui/modals/aboutModal.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps strict notification tests off direct animation fixture assignment", () => {
        expect.assertions(1);

        expect(
            showNotificationStrictTestDirectRequestAnimationFrameAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/utils/ui/notifications/showNotification.branches.strict.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps settings state manager tests off direct console global assignment", () => {
        expect.assertions(1);

        expect(
            settingsStateManagerTestDirectConsoleAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/state/domain/settingsStateManager.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps settings state storage runtime globals behind the runtime facade", () => {
        expect.assertions(20);

        const settingsStateCoreSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/settingsStateCore.ts"
            )
        );
        const settingsStateCoreRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/settingsStateCoreRuntime.ts"
            )
        );
        const settingsStateHelpersSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/state/domain/settingsStateHelpers.ts"
            )
        );

        expect(
            directSettingsStateCoreRuntimeGlobalPattern.test(
                settingsStateCoreSource
            )
        ).toBe(false);
        expect(settingsStateCoreSource).toContain(
            "settingsStateCoreRuntime.js"
        );
        expect(settingsStateCoreSource).toContain("addStorageEventListener");
        expect(settingsStateCoreSource).toContain("createAbortController");
        expect(settingsStateCoreSource).toContain("getLocalStorage");
        expect(settingsStateHelpersSource).toContain("stateStorageRuntime.js");
        expect(settingsStateHelpersSource).toContain("stateStorageRuntime");
        expect(settingsStateHelpersSource).not.toContain("localStorage.");
        expect(settingsStateCoreRuntimeSource).toContain(
            "defaultSettingsStateCoreRuntimeScope"
        );
        expect(settingsStateCoreRuntimeSource).not.toMatch(
            directSettingsStateCoreRuntimeAmbientFallbackPattern
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "scope: SettingsStateCoreRuntimeScope = globalThis"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "const defaultSettingsStateCoreRuntimeScope: SettingsStateCoreRuntimeScope = globalThis"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "readonly addEventListener?:"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "readonly localStorage?:"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "scope.addEventListener"
        );
        expect(settingsStateCoreRuntimeSource).not.toContain(
            "scope.localStorage"
        );
        expect(settingsStateCoreRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(settingsStateCoreRuntimeSource).toContain(
            "getLocalStorage: () => globalThis.localStorage"
        );
    });

    it("keeps handle-open-file tests on scoped console spies", () => {
        expect.assertions(1);

        expect(
            handleOpenFileTestDirectConsoleMethodAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "electron-app/utils/files/import/handleOpenFile.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps data-point filter state helper tests on scoped console spies", () => {
        expect.assertions(1);

        expect(
            dataPointFilterStateHelpersTestDirectConsoleAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/controls/dataPointFilterControl/stateHelpers.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps chart status indicator tests on scoped console spies", () => {
        expect.assertions(1);

        expect(
            chartStatusIndicatorTestDirectConsoleMethodAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/components/chartStatusIndicator.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps single HR zone bar tests on scoped browser and console fixtures", () => {
        expect.assertions(1);

        expect(
            renderSingleHrZoneBarTestDirectGlobalFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/data/zones/renderSingleHRZoneBar.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps event messages chart tests off direct window global assignment", () => {
        expect.assertions(1);

        expect(
            renderEventMessagesChartTestDirectWindowAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/renderEventMessagesChart.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps altitude profile chart tests on scoped browser and console fixtures", () => {
        expect.assertions(1);

        expect(
            renderAltitudeProfileChartTestDirectGlobalFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/renderAltitudeProfileChart.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps speed-vs-distance chart tests on scoped browser and console fixtures", () => {
        expect.assertions(1);

        expect(
            renderSpeedVsDistanceChartTestDirectGlobalFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/renderSpeedVsDistanceChart.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps power-vs-heart-rate chart tests on scoped browser and console fixtures", () => {
        expect.assertions(1);

        expect(
            renderPowerVsHeartRateChartTestDirectGlobalFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/renderPowerVsHeartRateChart.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps strict chart tests on descriptor-scoped global fixtures", () => {
        expect.assertions(1);

        const scannedFiles = [
            "tests/unit/strictTests/createEnhancedChart.test.ts",
            "tests/unit/strictTests/renderZoneChart.test.ts",
        ];
        const directStrictChartGlobalFixtureMutations = scannedFiles
            .filter((relativeFile) =>
                strictChartTestDirectGlobalFixtureMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directStrictChartGlobalFixtureMutations).toStrictEqual([]);
    });

    it("keeps chart zone color tests on descriptor-scoped localStorage fixtures", () => {
        expect.assertions(1);

        expect(
            chartZoneColorUtilsTestDirectLocalStorageAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/data/zones/chartZoneColorUtils.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps state middleware branch tests on scoped storage spies", () => {
        expect.assertions(1);

        expect(
            stateMiddlewareBranchesTestDirectLocalStorageMethodAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/stateMiddleware.branches.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps chart status indicator tests on descriptor-scoped browser fixtures", () => {
        expect.assertions(1);

        expect(
            chartStatusIndicatorTestDirectBrowserFixtureAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/components/chartStatusIndicator.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps renderChartJS state API tests on active raw FIT data fixtures", () => {
        expect.assertions(1);

        expect(
            renderChartJSStateApiTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/renderChartJS.stateApi.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps lap-zone chart tests on active FIT data fixtures", () => {
        expect.assertions(1);

        expect(
            renderLapZoneChartsTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/renderLapZoneCharts.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps lifecycle listener tests from mutating retired renderer globals", () => {
        expect.assertions(2);

        const lifecycleListenerTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/strictTests/utils/app/lifecycle/listeners.test.ts"
            )
        );

        expect(
            lifecycleListenersTestRetiredGlobalMutationPattern.test(
                lifecycleListenerTestSource
            )
        ).toBe(false);
        expect(
            lifecycleListenersTestDirectPrintAssignmentPattern.test(
                lifecycleListenerTestSource
            )
        ).toBe(false);
    });

    it("keeps app event tests from mutating retired FIT-data globals", () => {
        expect.assertions(1);

        expect(
            appEventsTestRetiredFitDataGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile("tests/unit/utils/app/events.test.ts")
                )
            )
        ).toBe(false);
    });

    it("keeps typed FIT-data tests from cleaning retired globals", () => {
        expect.assertions(1);

        const violations = [
            "tests/unit/utils/charts/theming/chartThemeListener.test.ts",
            "tests/unit/utils/files/export/createExportGPXButton.test.ts",
            "tests/unit/utils/rendering/components/createUserDeviceInfoBox.test.ts",
        ]
            .filter((relativeFile) =>
                typedFitDataTestRetiredGlobalCleanupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps chart settings dropdown tests on typed FIT raw-data fixtures", () => {
        expect.assertions(1);

        expect(
            chartSettingsDropdownsTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/ensureChartSettingsDropdowns.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps strict render-map tests on typed FIT state fixtures", () => {
        expect.assertions(1);

        expect(
            renderMapStrictTestRetiredFitGlobalFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/strictTests/maps/core/renderMap.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps map draw laps tests on descriptor-scoped window fixtures", () => {
        expect.assertions(1);

        expect(
            mapDrawLapsTestDirectWindowFixtureMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/maps/layers/mapDrawLaps.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps tab visibility raw-data tests off retired globalData fixtures", () => {
        expect.assertions(3);

        const tabVisibilityRawDataTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/utils/updateTabVisibility.fitRawDataState.test.ts"
            )
        );

        expect(
            existsSync(
                path.join(
                    process.cwd(),
                    "tests/unit/utils/updateTabVisibility.globalDataState.test.ts"
                )
            )
        ).toBe(false);
        expect(
            updateTabVisibilityRawDataTestRetiredGlobalDataPattern.test(
                tabVisibilityRawDataTestSource
            )
        ).toBe(false);
        expect(
            updateTabVisibilityTestDirectBrowserGlobalAssignmentPattern.test(
                tabVisibilityRawDataTestSource
            )
        ).toBe(false);
    });

    it("keeps tab-state manager regressions on raw FIT data fixtures", () => {
        expect.assertions(1);

        expect(
            tabStateManagerRegressionTestRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/tabStateManager.regressions.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps tab-button integration tests on raw FIT data state", () => {
        expect.assertions(1);

        expect(
            tabButtonStateIntegrationRetiredGlobalDataFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/integration/tabs/tabButtonState.integration.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps tab-button tests from mutating retired renderer globals", () => {
        expect.assertions(2);

        const tabButtonBehaviorTestSource = stripComments(
            readRepositoryFile(
                "tests/unit/utils/enableTabButtons.behavior.test.ts"
            )
        );

        expect(
            tabButtonsTestRetiredGlobalMutationPattern.test(
                tabButtonBehaviorTestSource
            )
        ).toBe(false);
        expect(
            tabButtonsTestDirectBrowserGlobalFixtureAssignmentPattern.test(
                tabButtonBehaviorTestSource
            )
        ).toBe(false);
    });

    it("keeps chart-tab integration tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        expect(
            chartTabIntegrationTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/charts/core/chartTabIntegration.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps render chart runtime helper tests from mutating retired renderer globals", () => {
        expect.assertions(1);

        expect(
            renderChartRuntimeHelpersTestRetiredGlobalMutationPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/charts/core/renderChartRuntimeHelpers.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps render chart runtime helper process and window fixtures descriptor-scoped", () => {
        expect.assertions(1);

        expect(
            renderChartRuntimeHelpersTestDirectProcessWindowDeletePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/charts/core/renderChartRuntimeHelpers.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps retired renderer compatibility globals out of ordinary tests", () => {
        expect.assertions(1);

        const scannedFiles = testSourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    relativeFile !==
                    "tests/unit/packaging/architectureBoundaries.test.ts"
            );
        const directRetiredRendererTestGlobals = scannedFiles
            .filter((relativeFile) => {
                const source = stripComments(readRepositoryFile(relativeFile));
                return (
                    directAppMenuExportsGlobalPattern.test(source) ||
                    directChartNotificationSuppressionGlobalPattern.test(
                        source
                    ) ||
                    directChartLoadingSuppressionGlobalPattern.test(source)
                );
            })
            .sort();

        expect(directRetiredRendererTestGlobals).toStrictEqual([]);
    });

    it("keeps Leaflet-focused tests from mutating retired global adapters", () => {
        expect.assertions(1);

        const scannedFiles = [
            "tests/unit/utils/maps/core/leafletRuntime.test.ts",
            "tests/unit/strictTests/maps/controls/mapActionButtons.test.ts",
        ];
        const leafletRuntimeGlobalMutationTests = scannedFiles
            .filter((relativeFile) =>
                leafletRuntimeTestGlobalMutationPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(leafletRuntimeGlobalMutationTests).toStrictEqual([]);
    });

    it("keeps shown-files list tests on explicit Leaflet runtime fixtures", () => {
        expect.assertions(1);

        expect(
            createShownFilesListTestRetiredLeafletGlobalPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/rendering/components/createShownFilesList.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("does not recreate the retired Object.keys throw-through test global", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directObjectKeysThrowGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestObjectKeysThrowGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directObjectKeysThrowGlobalLookups).toStrictEqual([]);
    });

    it("does not recreate the retired Object.keys wrapper marker in setup", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directObjectKeysWrapperMarkerLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestObjectKeysWrapperMarkerPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directObjectKeysWrapperMarkerLookups).toStrictEqual([]);
    });

    it("does not recreate the retired document-native-methods test global", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directDocumentNativeMethodsGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestDocumentNativeMethodsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directDocumentNativeMethodsGlobalLookups).toStrictEqual([]);
    });

    it("keeps setup document realignment behind the descriptor helper", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directDocumentRealignmentAssignments = scannedFiles
            .filter((relativeFile) =>
                directVitestDocumentRealignmentAssignmentPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directDocumentRealignmentAssignments).toStrictEqual([]);
    });

    it("does not recreate the unused Electron mock factory test global", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directCreateElectronMocksGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestCreateElectronMocksGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directCreateElectronMocksGlobalLookups).toStrictEqual([]);
    });

    it("keeps Web Storage setup behind the dedicated Vitest shim", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const inlineWebStorageMocks = scannedFiles
            .filter((relativeFile) =>
                directVitestInlineWebStorageMockPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(inlineWebStorageMocks).toStrictEqual([]);
    });

    it("does not recreate timer and listener tracking globals in setup", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directTimerTrackingGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestTimerTrackingGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directTimerTrackingGlobalLookups).toStrictEqual([]);
    });

    it("keeps setup timer wrappers behind the descriptor helper", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directTimerWrapperAssignments = scannedFiles
            .filter((relativeFile) =>
                directVitestTimerWrapperAssignmentPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directTimerWrapperAssignments).toStrictEqual([]);
    });

    it("does not recreate the dist resolver install global in setup", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directDistResolverGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestDistResolverGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directDistResolverGlobalLookups).toStrictEqual([]);
    });

    it("does not recreate the effective document test globals", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directEffectiveDocumentGlobalLookups = scannedFiles
            .filter((relativeFile) =>
                directTabVitestEnvironmentGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directEffectiveDocumentGlobalLookups).toStrictEqual([]);
    });

    it("does not mark event listener wrappers with expando properties", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directWrappedEventListenerMarkerLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestWrappedEventListenerMarkerPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directWrappedEventListenerMarkerLookups).toStrictEqual([]);
    });

    it("does not store navigation history on Location expandos", () => {
        expect.assertions(1);

        const scannedFiles = [
            ...testSourceRoots.flatMap(collectSourceFiles),
            "tests/vitest/setupVitest.mjs",
        ].filter(
            (relativeFile) =>
                relativeFile !==
                "tests/unit/packaging/architectureBoundaries.test.ts"
        );
        const directNavigationHistoryExpandoLookups = scannedFiles
            .filter((relativeFile) =>
                directVitestNavigationHistoryExpandoPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directNavigationHistoryExpandoLookups).toStrictEqual([]);
    });

    it("does not recreate broad window event-target fallbacks in setup", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directWindowEventTargetFallbacks = scannedFiles
            .filter((relativeFile) =>
                directVitestWindowEventTargetFallbackPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directWindowEventTargetFallbacks).toStrictEqual([]);
    });

    it("does not bridge jsdom HTMLElement onto the Node global in setup", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directHTMLElementGlobalBridge = scannedFiles
            .filter((relativeFile) =>
                directVitestHTMLElementGlobalBridgePattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directHTMLElementGlobalBridge).toStrictEqual([]);
    });

    it("does not patch window console group helpers separately in setup", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directWindowConsoleGroupPatches = scannedFiles
            .filter((relativeFile) =>
                directVitestWindowConsoleGroupPatchPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directWindowConsoleGroupPatches).toStrictEqual([]);
    });

    it("keeps Vitest setup window console alignment descriptor-scoped", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directWindowConsoleAssignments = scannedFiles
            .filter((relativeFile) =>
                directVitestWindowConsoleAssignmentPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directWindowConsoleAssignments).toStrictEqual([]);
    });

    it("keeps Vitest env setup console filters descriptor-scoped", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/env-setup.mjs"];
        const directConsoleMethodAssignments = scannedFiles
            .filter((relativeFile) =>
                directVitestEnvConsoleMethodAssignmentPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directConsoleMethodAssignments).toStrictEqual([]);
    });

    it("keeps preload runtime tests from direct console global assignment", () => {
        expect.assertions(1);

        const scannedFiles = [
            "tests/unit/preload.sourceExecution.test.ts",
            "tests/unit/preload.preloadRuntimeEnvironment.test.ts",
            "tests/unit/renderer/mainUiRuntimeEnvironment.test.ts",
        ];
        const directConsoleGlobalAssignments = scannedFiles
            .filter((relativeFile) =>
                directRuntimeEnvironmentTestConsoleAssignmentPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directConsoleGlobalAssignments).toStrictEqual([]);
    });

    it("keeps preload source execution console fixture restores descriptor-only", () => {
        expect.assertions(1);

        expect(
            directPreloadSourceExecutionGlobalDeletePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/preload.sourceExecution.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps preload source tests on module-local Electron API exposure maps", () => {
        expect.assertions(1);

        const scannedFiles = [
            "tests/unit/preload.development-mode.test.ts",
            "tests/unit/preload.edgeCases.test.ts",
        ];
        const directGlobalFixtures = scannedFiles
            .filter((relativeFile) =>
                preloadTestDirectElectronApiGlobalFixturePattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directGlobalFixtures).toStrictEqual([]);
    });

    it("keeps handle-open-file complete tests on descriptor-scoped process fixtures", () => {
        expect.assertions(1);

        expect(
            handleOpenFileCompleteTestDirectProcessAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/files/import/handleOpenFile.complete.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps process environment tests on descriptor-scoped process restores", () => {
        expect.assertions(1);

        expect(
            processEnvironmentTestDirectProcessDeletePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/runtime/processEnvironment.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps OAuth state tests on descriptor-scoped crypto restores", () => {
        expect.assertions(1);

        expect(
            exportUtilsOauthStateTestDirectCryptoDeletePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/files/export/exportUtils.oauthState.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps shared configuration tests on descriptor-scoped URLSearchParams fixtures", () => {
        expect.assertions(1);

        expect(
            loadSharedConfigurationTestDirectUrlSearchParamsAssignmentPattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/app/initialization/loadSharedConfiguration.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("does not clean retired tab-button observer globals in setup", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directTabButtonObserverCleanup = scannedFiles
            .filter((relativeFile) =>
                directVitestTabButtonObserverCleanupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directTabButtonObserverCleanup).toStrictEqual([]);
    });

    it("does not clean retired Chart.js devtools globals in setup", () => {
        expect.assertions(1);

        const scannedFiles = ["tests/vitest/setupVitest.mjs"];
        const directChartDevToolsGlobalCleanup = scannedFiles
            .filter((relativeFile) =>
                directVitestChartDevToolsGlobalCleanupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();

        expect(directChartDevToolsGlobalCleanup).toStrictEqual([]);
    });

    it("keeps process nextTick setup behind descriptor-scoped setup helpers", () => {
        expect.assertions(4);

        const vitestSetupSource = stripComments(
            readRepositoryFile("tests/vitest/setupVitest.mjs")
        );

        expect(vitestSetupSource).toContain("function ensureProcessNextTick()");
        expect(vitestSetupSource).toContain(
            "function setRuntimeProcessObject("
        );
        expect(vitestSetupSource).toContain("function setProcessNextTick(");
        expect(
            directVitestProcessNextTickSetupAssignmentPattern.test(
                vitestSetupSource
            )
        ).toBe(false);
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
        expect.assertions(6);

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
        const electronApiStartupHooksSource = stripComments(
            readRepositoryFile(
                "electron-app/renderer/electronApiStartupHooks.ts"
            )
        );

        expect(directElectronApiGlobals).toStrictEqual([]);
        expect(missingRuntimeLookup).toStrictEqual([]);
        expect(electronApiStartupHooksSource).not.toContain(
            "scope: typeof globalThis = globalThis"
        );
        expect(electronApiStartupHooksSource).not.toContain(
            "defaultElectronApiStartupHooksScope"
        );
        expect(electronApiStartupHooksSource).not.toContain(
            "getElectronApiScope: () => globalThis"
        );
        expect(electronApiStartupHooksSource).not.toContain(
            'getElectronAPI: () => Reflect.get(globalThis, "electronAPI")'
        );
    });

    it("keeps Electron API runtime ambient tests on scoped global fixtures", () => {
        expect.assertions(8);

        const electronApiRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/runtime/electronApiRuntime.ts"
            )
        );

        expect(
            electronApiRuntimeTestDirectGlobalFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/runtime/electronApiRuntime.test.ts"
                    )
                )
            )
        ).toBe(false);
        expect(electronApiRuntimeSource).not.toContain(
            "scope: RendererElectronApiScope = globalThis"
        );
        expect(electronApiRuntimeSource).toContain(
            "defaultRendererElectronApiScope"
        );
        expect(electronApiRuntimeSource).toContain(
            'getElectronAPI: () => Reflect.get(globalThis, "electronAPI")'
        );
        expect(electronApiRuntimeSource).not.toContain(
            "readonly electronAPI?:"
        );
        expect(electronApiRuntimeSource).not.toContain("scope.electronAPI");
        expect(electronApiRuntimeSource).not.toContain(
            "getWindow: () => globalThis.window"
        );
        expect(electronApiRuntimeSource).not.toContain("getWindowElectronApi");
    });

    it("keeps main UI DOM utility tests on scoped Electron API fixtures", () => {
        expect.assertions(1);

        expect(
            mainUiDomUtilsTestDirectElectronApiGlobalFixturePattern.test(
                stripComments(
                    readRepositoryFile(
                        "tests/unit/utils/ui/mainUiDomUtils.test.ts"
                    )
                )
            )
        ).toBe(false);
    });

    it("keeps main UI DOM utility listener cleanup behind the runtime facade", () => {
        expect.assertions(9);

        const mainUiDomUtilsSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/mainUiDomUtils.ts")
        );
        const mainUiDomUtilsRuntimeSource = stripComments(
            readRepositoryFile("electron-app/utils/ui/mainUiDomUtilsRuntime.ts")
        );

        expect(
            directMainUiDomUtilsRuntimeGlobalPattern.test(mainUiDomUtilsSource)
        ).toBe(false);
        expect(mainUiDomUtilsSource).toContain("mainUiDomUtilsRuntime.js");
        expect(mainUiDomUtilsRuntimeSource).toContain(
            "defaultMainUiDomUtilsRuntimeScope"
        );
        expect(mainUiDomUtilsRuntimeSource).not.toMatch(
            directMainUiDomUtilsRuntimeAmbientGetterPattern
        );
        expect(mainUiDomUtilsRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(mainUiDomUtilsRuntimeSource).not.toContain(
            "MainUiDomUtilsRuntimeScope = globalThis"
        );
        expect(mainUiDomUtilsRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(mainUiDomUtilsRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(mainUiDomUtilsRuntimeSource).toContain(
            "scope.getAbortController?.()"
        );
    });

    it("keeps event listener manager cleanup behind the runtime facade", () => {
        expect.assertions(13);

        const eventListenerManagerSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/events/eventListenerManager.ts"
            )
        );
        const eventListenerManagerRuntimeSource = stripComments(
            readRepositoryFile(
                "electron-app/utils/ui/events/eventListenerManagerRuntime.ts"
            )
        );

        expect(
            directEventListenerManagerRuntimeGlobalPattern.test(
                eventListenerManagerSource
            )
        ).toBe(false);
        expect(eventListenerManagerSource).toContain(
            "eventListenerManagerRuntime.js"
        );
        expect(eventListenerManagerSource).toContain("getDefaultEventTarget");
        expect(eventListenerManagerRuntimeSource).toContain(
            "defaultEventListenerManagerRuntimeScope"
        );
        expect(eventListenerManagerRuntimeSource).toContain(
            "getEventTarget: () => globalThis"
        );
        expect(eventListenerManagerRuntimeSource).toContain(
            "getAbortController: () => globalThis.AbortController"
        );
        expect(eventListenerManagerRuntimeSource).not.toContain(
            "EventListenerManagerRuntimeScope = globalThis"
        );
        expect(eventListenerManagerRuntimeSource).not.toContain("scope.window");
        expect(eventListenerManagerRuntimeSource).not.toMatch(
            directEventListenerManagerRuntimeAmbientGetterPattern
        );
        expect(eventListenerManagerRuntimeSource).not.toContain(
            "readonly AbortController?:"
        );
        expect(eventListenerManagerRuntimeSource).not.toContain(
            "readonly eventTarget?:"
        );
        expect(eventListenerManagerRuntimeSource).not.toContain(
            "scope.AbortController"
        );
        expect(eventListenerManagerRuntimeSource).not.toContain(
            "scope.eventTarget"
        );
    });
});
