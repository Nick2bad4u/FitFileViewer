#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$installerGuids = @(
    '141b3184-244b-5640-abaf-338415dd90dc', # Stable v29/current NSIS registration.
    '2eccf151-6603-512f-93c6-ea96e8d92a75' # Transitional v30 registration.
)
$registrations = @(
    foreach ($hive in @([Microsoft.Win32.RegistryHive]::CurrentUser, [Microsoft.Win32.RegistryHive]::LocalMachine)) {
        foreach ($view in @([Microsoft.Win32.RegistryView]::Registry32, [Microsoft.Win32.RegistryView]::Registry64)) {
            $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey($hive, $view)
            try {
                foreach ($installerGuid in $installerGuids) {
                    foreach ($keyPath in @("Software\$installerGuid", "Software\Microsoft\Windows\CurrentVersion\Uninstall\$installerGuid")) {
                        $installationKey = $baseKey.OpenSubKey($keyPath, $false)
                        if ($null -ne $installationKey) {
                            try {
                                [PSCustomObject]@{
                                    Hive = $hive.ToString()
                                    View = $view.ToString()
                                    Key = $keyPath
                                    InstallLocation = $installationKey.GetValue('InstallLocation')
                                }
                            } finally {
                                $installationKey.Dispose()
                            }
                        }
                    }
                }
            } finally {
                $baseKey.Dispose()
            }
        }
    }
)
ConvertTo-Json -InputObject $registrations -Compress
