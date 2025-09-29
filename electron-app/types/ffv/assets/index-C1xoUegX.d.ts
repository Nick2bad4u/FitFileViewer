export { hs as default };
declare function hs(e: any, t: any, i: any): Promise<{
    errors: never[];
    devErrors: never[];
    messages: {};
    definitions: never[];
    developerFields: any[];
    developerDataFields: Mn;
    fileHeaders: never[];
    issues: never[];
    fileType: undefined;
    hrMerged: boolean;
    geoData: {
        waypoints: any;
        positions: any;
        sessions: any;
        lines: any;
        laps: any;
    } | null;
    streamIndex: {
        files: {};
        invalidRecords: Set<any>;
        newRecords: never[];
        fileIdRecords: never[];
    };
    mergedRecords: any;
}>;
declare class Mn {
    definitions: {};
    addDeveloperDataId(t: any): void;
    addFieldDescription(t: any): void;
    lookupDeveloperDataField(t: any): any;
    getDefinitions(): any[];
}
//# sourceMappingURL=index-C1xoUegX.d.ts.map