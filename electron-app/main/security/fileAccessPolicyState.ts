export interface FileAccessPolicyState {
    approved: Set<string>;
}

const fileAccessPolicyState: FileAccessPolicyState = {
    approved: new Set<string>(),
};

export function getFileAccessPolicyState(): FileAccessPolicyState {
    return fileAccessPolicyState;
}

export function resetFileAccessPolicyState(): void {
    fileAccessPolicyState.approved.clear();
}
