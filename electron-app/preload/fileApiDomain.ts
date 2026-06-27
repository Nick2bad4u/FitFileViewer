type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadFileApiDomain =
    import("./preloadAssemblyTypes").PreloadFileApiDomain;

export function createPreloadFileApiDomain({
    constants,
    createSafeEventHandler,
    createSafeInvokeHandler,
    modules,
}: PreloadApiAssemblyContext): PreloadFileApiDomain {
    const { createFileApi, createFitBrowserApi } = modules;

    return {
        fileApi: createFileApi({
            channels: {
                FILE_READ: constants.CHANNELS.FILE_READ,
                FIT_DECODE: constants.CHANNELS.FIT_DECODE,
                FIT_PARSE: constants.CHANNELS.FIT_PARSE,
                RECENT_FILES_ADD: constants.CHANNELS.RECENT_FILES_ADD,
                RECENT_FILES_GET: constants.CHANNELS.RECENT_FILES_GET,
            },
            createSafeInvokeHandler,
        }),
        fitBrowserApi: createFitBrowserApi({
            channels: {
                FIT_BROWSER_ENABLED_CHANGED:
                    constants.EVENTS.FIT_BROWSER_ENABLED_CHANGED,
                FIT_BROWSER_GET_FOLDER:
                    constants.CHANNELS.FIT_BROWSER_GET_FOLDER,
                FIT_BROWSER_IS_ENABLED:
                    constants.CHANNELS.FIT_BROWSER_IS_ENABLED,
                FIT_BROWSER_LIST_FOLDER:
                    constants.CHANNELS.FIT_BROWSER_LIST_FOLDER,
                FIT_BROWSER_SET_ENABLED:
                    constants.CHANNELS.FIT_BROWSER_SET_ENABLED,
                FIT_BROWSER_SET_FOLDER:
                    constants.CHANNELS.FIT_BROWSER_SET_FOLDER,
            },
            createSafeEventHandler,
            createSafeInvokeHandler,
        }),
    };
}
