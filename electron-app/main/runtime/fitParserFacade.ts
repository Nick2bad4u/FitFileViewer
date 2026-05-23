{
    type FitParserModule = import("../../shared/fitParser").FitParserModule;

    let fitParserModule: FitParserModule | undefined;

    function getFitParserModule(): FitParserModule {
        fitParserModule ??= require("../../fitParser") as FitParserModule;
        return fitParserModule;
    }

    module.exports = { getFitParserModule };
}
