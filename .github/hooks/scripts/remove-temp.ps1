#Requires -Version 5.1
<#
.SYNOPSIS
    Removes all contents of the temp directory.
.DESCRIPTION
    Deletes all files and subdirectories within the ./temp folder forcefully.
.EXAMPLE
    .\remove-temp.ps1
#>

[CmdletBinding(SupportsShouldProcess)]
param ()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$tempPath = [System.IO.Path]::GetFullPath((Join-Path -Path $PSScriptRoot -ChildPath '..\..\..\temp'))

if (Test-Path -LiteralPath $tempPath) {
    Write-Verbose "Removing contents of: $tempPath"
    Get-ChildItem -LiteralPath $tempPath -Force |
        Remove-Item -Recurse -Force -WhatIf:$WhatIfPreference
    Write-Verbose 'Temp directory cleaned successfully.'
} else {
    Write-Verbose "Temp directory not found, nothing to clean: $tempPath"
}
