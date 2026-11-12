; NounoursBrowser — installeur Windows (Inno Setup 6)
; Compilé par la CI :  ISCC /DAppVersion=1.0.1 /DStageDir=<dossier> installers\windows\NounoursBrowser.iss
; Installation par utilisateur (sans droits admin) dans %LOCALAPPDATA%\Programs\NounoursBrowser.
; Mise à jour silencieuse (NounoursLauncher) : /VERYSILENT /SUPPRESSMSGBOXES /NORESTART

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef StageDir
  #define StageDir "..\..\build\stage-win"
#endif

[Setup]
AppId={{8F3A2C1E-6B4D-4E8A-9C21-5D7E0B1F4A33}
AppName=NounoursBrowser
AppVersion={#AppVersion}
AppVerName=NounoursBrowser {#AppVersion}
AppPublisher=NounoursCorp
AppPublisherURL=https://nounourscorp.fr
AppSupportURL=https://nounourscorp.fr
VersionInfoVersion={#AppVersion}
VersionInfoCompany=NounoursCorp
VersionInfoDescription=Installeur de NounoursBrowser
DefaultDirName={localappdata}\Programs\NounoursBrowser
; Le dossier a changé en 1.2.0 (« Nounours Browser » → « NounoursBrowser ») : on n'utilise pas l'ancien
UsePreviousAppDir=no
DefaultGroupName=NounoursBrowser
DisableProgramGroupPage=yes
DisableDirPage=yes
DisableReadyPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
OutputDir=..\..\build\release
OutputBaseFilename=NounoursBrowser-{#AppVersion}-win-x64-setup
SetupIconFile=..\..\branding\logo.ico
UninstallDisplayIcon={app}\NounoursBrowser.exe
UninstallDisplayName=NounoursBrowser
WizardStyle=modern
Compression=lzma2/max
LZMANumBlockThreads=4
DiskSpanning=no
SolidCompression=yes
; Le lanceur se ferme dès que le navigateur démarre : rien à fermer pendant une mise à jour
CloseApplications=no
RestartApplications=no
ShowLanguageDialog=no

[Languages]
Name: "fr"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le Bureau"; GroupDescription: "Raccourcis :"

[InstallDelete]
; Repart d'un contenu propre à chaque mise à jour (le profil, lui, est ailleurs et n'est jamais touché).
; Un moteur encore utilisé (navigateur ouvert pendant la mise à jour) ne peut pas être supprimé :
; il est ignoré ici et nettoyé par NounoursBrowser.exe au lancement suivant.
Type: filesandordirs; Name: "{app}\app"
Type: filesandordirs; Name: "{app}\engine-*"
; Ancien nom (versions 1.0 / 1.1) : dossier et raccourcis
Type: filesandordirs; Name: "{localappdata}\Programs\Nounours Browser"
Type: files; Name: "{autoprograms}\Nounours Browser.lnk"
Type: files; Name: "{autodesktop}\Nounours Browser.lnk"

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{autoprograms}\NounoursBrowser"; Filename: "{app}\NounoursBrowser.exe"; Comment: "Navigateur léger NounoursCorp"
Name: "{autodesktop}\NounoursBrowser"; Filename: "{app}\NounoursBrowser.exe"; Tasks: desktopicon

[Registry]
; Déclare NounoursBrowser comme navigateur possible (Paramètres Windows → Applications par défaut)
Root: HKCU; Subkey: "Software\Classes\NounoursBrowserHTML"; ValueType: string; ValueData: "Page web NounoursBrowser"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\NounoursBrowserHTML\DefaultIcon"; ValueType: string; ValueData: "{app}\NounoursBrowser.exe,0"
Root: HKCU; Subkey: "Software\Classes\NounoursBrowserHTML\shell\open\command"; ValueType: string; ValueData: """{app}\NounoursBrowser.exe"" ""%1"""
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser"; ValueType: string; ValueData: "NounoursBrowser"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\DefaultIcon"; ValueType: string; ValueData: "{app}\NounoursBrowser.exe,0"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\shell\open\command"; ValueType: string; ValueData: """{app}\NounoursBrowser.exe"""
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "NounoursBrowser"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "Navigateur léger NounoursCorp"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities"; ValueType: string; ValueName: "ApplicationIcon"; ValueData: "{app}\NounoursBrowser.exe,0"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities\URLAssociations"; ValueType: string; ValueName: "http"; ValueData: "NounoursBrowserHTML"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities\URLAssociations"; ValueType: string; ValueName: "https"; ValueData: "NounoursBrowserHTML"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities\FileAssociations"; ValueType: string; ValueName: ".html"; ValueData: "NounoursBrowserHTML"
Root: HKCU; Subkey: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities\FileAssociations"; ValueType: string; ValueName: ".htm"; ValueData: "NounoursBrowserHTML"
Root: HKCU; Subkey: "Software\RegisteredApplications"; ValueType: string; ValueName: "NounoursBrowser"; ValueData: "Software\Clients\StartMenuInternet\NounoursBrowser\Capabilities"; Flags: uninsdeletevalue

[Run]
Filename: "{app}\NounoursBrowser.exe"; Description: "Lancer NounoursBrowser"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\app"
Type: filesandordirs; Name: "{app}\engine-*"

[Code]
// À la désinstallation, propose de supprimer aussi le profil et le moteur
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var DataDir: String;
begin
  if (CurUninstallStep = usPostUninstall) and not UninstallSilent then
  begin
    DataDir := ExpandConstant('{localappdata}\NounoursBrowser');
    if DirExists(DataDir) and
       (MsgBox('Supprimer aussi votre profil NounoursBrowser (marque-pages, extensions, réglages) et son moteur ?',
               mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES) then
      DelTree(DataDir, True, True, True);
  end;
end;
