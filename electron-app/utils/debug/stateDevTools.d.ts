/** Legacy renderer performance monitor used by state integration code. */
export const performanceMonitor: {
    endTimer?: (id: string) => void;
    isEnabled?: boolean | (() => boolean);
    startTimer?: (id: string) => void;
};
