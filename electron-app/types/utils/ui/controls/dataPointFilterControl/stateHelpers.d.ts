export function clampPercent(value: any): number;
export function clampRangeValue(value: any, stats: any): any;
export function computeMetricStats(metricKey: any): {
    metric: string;
    metricLabel: string;
    min: number;
    max: number;
    average: number;
    count: number;
    decimals: number;
    step: number;
} | null;
export function computeRangeState(
    metricKey: any,
    currentRangeValues: any,
    options?: {}
):
    | {
          stats: null;
          rangeValues: null;
          sliderValues: null;
      }
    | {
          stats: {
              metric: string;
              metricLabel: string;
              min: number;
              max: number;
              average: number;
              count: number;
              decimals: number;
              step: number;
          };
          rangeValues: {
              min: any;
              max: any;
          };
          sliderValues: {
              min: any;
              max: any;
          };
      };
export function formatMetricValue(value: any, stats: any, decimalsOverride: any): string;
export function formatPercent(value: any): string;
export function getGlobalRecords(): any;
export function resolveInitialConfig(
    defaultMetric: any,
    defaultPercent: any
): {
    enabled: boolean;
    maxValue: any;
    metric: any;
    minValue: any;
    mode: string;
    percent: number;
};
export function toSliderString(value: any, decimals: any): any;
export function updateGlobalFilter(config: any): void;
