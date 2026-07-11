!include "LogicLib.nsh"

!define FFV_V30_INSTALLER_GUID "2eccf151-6603-512f-93c6-ea96e8d92a75"
!define FFV_V30_INSTALL_REGISTRY_KEY "Software\${FFV_V30_INSTALLER_GUID}"
!define FFV_V30_UNINSTALL_REGISTRY_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${FFV_V30_INSTALLER_GUID}"

# v30.0.0 briefly shipped with an installer GUID derived from the modern appId.
# Reuse that installation directory before installing under the stable legacy
# GUID so both v29 and v30 users converge on one registration and one location.
!macro customInit
  !ifndef ONE_CLICK
    ReadRegStr $R8 HKCU "${FFV_V30_INSTALL_REGISTRY_KEY}" InstallLocation
    ${If} $R8 != ""
      StrCpy $hasPerUserInstallation "1"
      StrCpy $hasPerMachineInstallation "0"
      StrCpy $installMode CurrentUser
      SetShellVarContext current
      StrCpy $INSTDIR $R8
    ${Else}
      ReadRegStr $R8 HKLM "${FFV_V30_INSTALL_REGISTRY_KEY}" InstallLocation
      ${If} $R8 != ""
        StrCpy $hasPerUserInstallation "0"
        StrCpy $hasPerMachineInstallation "1"
        StrCpy $installMode all
        SetShellVarContext all
        StrCpy $INSTDIR $R8
      ${EndIf}
    ${EndIf}
  !endif
!macroend

!macro customInstall
  ${If} $installMode == "all"
    DeleteRegKey HKLM "${FFV_V30_UNINSTALL_REGISTRY_KEY}"
    DeleteRegKey HKLM "${FFV_V30_INSTALL_REGISTRY_KEY}"
  ${Else}
    DeleteRegKey HKCU "${FFV_V30_UNINSTALL_REGISTRY_KEY}"
    DeleteRegKey HKCU "${FFV_V30_INSTALL_REGISTRY_KEY}"
  ${EndIf}
!macroend
