export function renderMap(): void;
export type RecordMessage = {
    /**
     * - Latitude position (semicircles)
     */
    positionLat: number;
    /**
     * - Longitude position (semicircles)
     */
    positionLong: number;
    /**
     * - Altitude in meters
     */
    altitude?: number;
    /**
     * - Unix timestamp
     */
    timestamp?: number;
    /**
     * - Speed value
     */
    speed?: number;
    /**
     * - Heart rate value
     */
    heartRate?: number;
    /**
     * - Power value
     */
    power?: number;
    /**
     * - Cadence value
     */
    cadence?: number;
    /**
     * - Distance value
     */
    distance?: number;
};
export type GlobalData = {
    /**
     * - Array of record messages
     */
    recordMesgs: RecordMessage[];
    /**
     * - Array of lap messages
     */
    lapMesgs?: any[];
    /**
     * - Cached file path
     */
    cachedFilePath?: string;
};
export type WindowExtensions = {
    /**
     * - Global data object
     */
    globalData: GlobalData;
    /**
     * - Overlay polylines object
     */
    _overlayPolylines: any;
    /**
     * - Leaflet map instance
     */
    _leafletMapInstance: any;
    /**
     * - Original bounds for main polyline
     */
    _mainPolylineOriginalBounds: any;
    /**
     * - Currently highlighted overlay index
     */
    _highlightedOverlayIdx: number;
    /**
     * - Array of loaded FIT files
     */
    loadedFitFiles: any[];
    /**
     * - Function to update overlay highlights
     */
    updateOverlayHighlights: Function;
    /**
     * - Function to update shown files list
     */
    updateShownFilesList: Function;
    /**
     * - Function to render map
     */
    renderMap: Function;
    /**
     * - Function to setup overlay file name map actions
     */
    setupOverlayFileNameMapActions?: Function;
    /**
     * - Function to setup active file name map actions
     */
    setupActiveFileNameMapActions?: Function;
    /**
     * - Leaflet measure control (plugin)
     */
    _measureControl?: any;
    /**
     * - Leaflet draw control (plugin)
     */
    _drawControl?: any;
    /**
     * - FeatureGroup containing user-drawn items
     */
    _drawnItems?: any;
    /**
     * - Leaflet minimap control (plugin)
     */
    _miniMapControl?: any;
    /**
     * - Leaflet library object
     */
    L: any;
};
export type LatLng = {
    /**
     * - Latitude
     */
    lat: number;
    /**
     * - Longitude
     */
    lng: number;
};
//# sourceMappingURL=renderMap.d.ts.map
