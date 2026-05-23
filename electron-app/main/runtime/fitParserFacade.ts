{
    type FitParserModule = import("../../types/fitParser").FitParserModule;

    let fitParserModule: FitParserModule | undefined;

    function getFitParserModule(): FitParserModule {
        fitParserModule ??= require("../../fitParser") as FitParserModule;
        return fitParserModule;
    }

    module.exports = { getFitParserModule };
}
