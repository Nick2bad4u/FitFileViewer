/**
 * Minimal shape description to avoid importing chart.js types.
 * @typedef {Object} MinimalChart
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx
 * @property {Function} [isZoomedOrPanned]
 * @property {Function} [resetZoom]
 * @property {Object.<string,any>} [_zoomResetBtnBounds]
 * @property {Object.<string,any>} [options]
 */
/**
 * @typedef {Object} ChartEventArgs
 * @property {{ type:string, native?: any }} event
 */
/**
 * Zoom reset plugin with defensive guards and minimal typing.
 * @type {{ id:string, afterDraw:(chart:MinimalChart)=>void, afterEvent:(chart:MinimalChart, args:ChartEventArgs)=>void }}
 */
export const chartZoomResetPlugin: {
    id: string;
    afterDraw: (chart: MinimalChart) => void;
    afterEvent: (chart: MinimalChart, args: ChartEventArgs) => void;
};
/**
 * Minimal shape description to avoid importing chart.js types.
 */
export type MinimalChart = {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    isZoomedOrPanned?: Function;
    resetZoom?: Function;
    _zoomResetBtnBounds?: {
        [x: string]: any;
    };
    options?: {
        [x: string]: any;
    };
};
export type ChartEventArgs = {
    event: {
        type: string;
        native?: any;
    };
};
//# sourceMappingURL=chartZoomResetPlugin.d.ts.map
