; Kara for Windows: one setup file, no admin rights, nothing else to install.
; Built by installer\build.ps1, which passes AppVersion, BuildDir and OutDir.

#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

[Setup]
AppId={{6B0E8C1F-4A7D-4E5B-9C21-0D3F5A8B7E44}
AppName=Kara
AppVersion={#AppVersion}
AppVerName=Kara {#AppVersion}
AppPublisher=Dash Dash
AppPublisherURL=https://dashdash.design
AppSupportURL=https://github.com/DashDashDesign/Kara
DefaultDirName={localappdata}\Programs\Kara
DisableDirPage=auto
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir={#OutDir}
OutputBaseFilename=Kara-Setup
SetupIconFile={#BuildDir}\kara.ico
UninstallDisplayIcon={app}\Kara.exe
UninstallDisplayName=Kara
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
LicenseFile={#BuildDir}\app\LICENSE

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "fr"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#BuildDir}\app\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{autoprograms}\Kara"; Filename: "{app}\Kara.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\Kara"; Filename: "{app}\Kara.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\Kara.exe"; Description: "{cm:LaunchProgram,Kara}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: files; Name: "{app}\.version"
