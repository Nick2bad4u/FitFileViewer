# Determine repo root (parent of .github)
$repoRoot = Resolve-Path "$PSScriptRoot\.."

Push-Location $repoRoot
try {
    npx git-cliff --config cliff.toml --output CHANGELOG.md
}
catch {
    Write-Error "Failed to update root CHANGELOG.md: $_"
}
finally {
    Pop-Location
}
