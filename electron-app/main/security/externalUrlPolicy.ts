{
    const { validateExternalUrl } =
        require("../../shared/externalUrlPolicy") as {
            validateExternalUrl: (url: unknown) => string;
        };

    module.exports = {
        validateExternalUrl,
    };
}
