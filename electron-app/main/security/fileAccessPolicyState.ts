{
    interface FileAccessPolicyState {
        approved: Set<string>;
    }

    const fileAccessPolicyState: FileAccessPolicyState = {
        approved: new Set<string>(),
    };

    function getFileAccessPolicyState(): FileAccessPolicyState {
        return fileAccessPolicyState;
    }

    function resetFileAccessPolicyState(): void {
        fileAccessPolicyState.approved.clear();
    }

    module.exports = {
        getFileAccessPolicyState,
        resetFileAccessPolicyState,
    };
}
