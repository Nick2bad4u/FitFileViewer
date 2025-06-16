# Use Push-Location/Pop-Location for safe directory changes and error handling

$folders = @(
    "..",
    "electron-app",
    "icons",
    "..\libs",
    "..\screenshots",
    "..\tests",
    "..\utils"
)

foreach ($folder in $folders) {
    Push-Location $folder
    try {
        npx git-cliff --output CHANGELOG.md
    }
    catch {
        Write-Error "Failed to update CHANGELOG.md in ${folder}: $_"
    }
    finally {
        Pop-Location
    }
}
npx git-cliff --output CHANGELOG.md

# Update libs CHANGELOG.md
Set-Location ..\libs
npx git-cliff --output CHANGELOG.md

# Update screenshots CHANGELOG.md
Set-Location ..\screenshots
npx git-cliff --output CHANGELOG.md

# Update tests CHANGELOG.md
Set-Location ..\tests
npx git-cliff --output CHANGELOG.md

# Update utils CHANGELOG.md
Set-Location ..\utils
npx git-cliff --output CHANGELOG.md