[CmdletBinding()]
param(
    [int]$keepLast,
    [switch]$deleteTags
)

# Requires: gh CLI authenticated and in the correct repo directory

# Configurable parameters
$KeepLastReleases = 5  # Default number of most recent releases to keep

if ($keepLast) {
    $KeepLastReleases = $keepLast
}

# Get all releases
$json = gh release list --limit 1000 --json tagName,publishedAt
Write-Verbose "RAW JSON OUTPUT:"
Write-Verbose $json
$releases = $json | ConvertFrom-Json
Write-Verbose "RELEASE COUNT: $($releases.Count)"

# Remove empty array case
if (-not $releases -or $releases.Count -eq 0) {
    Write-Output "No releases found after JSON parse."
    exit
}

# Filter out releases with invalid or missing publishedAt
$releases = $releases | Where-Object { $_.publishedAt }
Write-Verbose "RELEASE COUNT after filter: $($releases.Count)"

# Now sort by publish date (oldest first)
$releases = $releases | Sort-Object { [datetime]$_.publishedAt }
Write-Verbose ("RELEASES after sort: $($releases | ForEach-Object { $_.tagName + ' ' + $_.publishedAt } | Out-String)")

# Find the first release for each major version
$firstMajors = @{}
foreach ($release in $releases) {
    if ($release.tagName -match '^v?(\d+)\.') {
        $major = $matches[1]
        if (-not $firstMajors.ContainsKey($major)) {
            $firstMajors[$major] = $release
        }
    }
}
$firstMajorReleases = $firstMajors.Values

# Get the last X releases (newest)
$lastX = $releases | Select-Object -Last $KeepLastReleases

# Combine tags to keep
$keepTags = @($firstMajorReleases | ForEach-Object { $_.tagName }) + ($lastX | ForEach-Object { $_.tagName }) | Select-Object -Unique

# Find releases to delete
$toDelete = $releases | Where-Object { $keepTags -notcontains $_.tagName }

Write-Verbose "DEBUG: Total releases: $($releases.Count)"
Write-Verbose "DEBUG: Keep tags: $($keepTags -join ', ')"
Write-Verbose ("DEBUG: To delete: " + ((($toDelete | ForEach-Object { $_.tagName }) -join ', ')))

if ($toDelete.Count -eq 0) {
    Write-Output "No releases to delete."
    exit
}

Write-Output "The following releases will be deleted:"
$toDelete | ForEach-Object { Write-Output $_.tagName }

$confirmation = Read-Host "Do you want to proceed with deleting these releases? (y/n)"
if ($confirmation -eq 'y') {
    Write-Verbose "DEBUG: Git tags before deletion:"
    git tag | ForEach-Object { Write-Verbose $_ }
    foreach ($release in $toDelete) {
        Write-Output "Deleting $($release.tagName)..."
        gh release delete $release.tagName --yes
        if ($deleteTags) {
            Write-Output "Deleting tag $($release.tagName)..."
            git tag -d $release.tagName 2>$null
            git push origin :refs/tags/$($release.tagName)
        }
    }
    Write-Verbose "DEBUG: Git tags after release/tag deletion:"
    git tag | ForEach-Object { Write-Verbose $_ }
    # Also check for tags that exist but have no release (orphans)
    if ($deleteTags) {
        # Re-fetch releases after deletion to get the current state
        $jsonAfter = gh release list --limit 1000 --json tagName,publishedAt
        $releasesAfter = $jsonAfter | ConvertFrom-Json
        $releaseTagsAfter = $releasesAfter | ForEach-Object { $_.tagName.Trim().ToLower() }
        $releaseTagsNoV = $releaseTagsAfter | ForEach-Object { $_.TrimStart('v') }
        $allTags = git tag | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim().ToLower() }
        Write-Verbose "DEBUG: All tags: $($allTags -join ', ')"
        Write-Verbose "DEBUG: Release tags after: $($releaseTagsAfter -join ', ')"
        Write-Verbose "DEBUG: Release tags no v: $($releaseTagsNoV -join ', ')"
        $orphanTags = @()
        foreach ($tag in $allTags) {
            $tagNoV = $tag.TrimStart('v')
            if (($releaseTagsAfter -notcontains $tag) -and ($releaseTagsNoV -notcontains $tagNoV)) {
                $orphanTags += $tag
            }
        }
        if ($orphanTags) {
            Write-Output "Deleting orphan tags with no release:"
            $orphanTags | ForEach-Object { Write-Output $_ }
            foreach ($tag in $orphanTags) {
                git tag -d $tag 2>$null
                git push origin :refs/tags/$tag
            }
        } else {
            Write-Output "No orphan tags found."
        }
    }
    Write-Output "Deletion complete."
}
else {
    Write-Output "Aborted. No releases were deleted."
}