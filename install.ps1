# Kara: one-line install for Windows (PowerShell).
#   irm https://raw.githubusercontent.com/DashDashDesign/Kara/main/install.ps1 | iex
# Downloads the latest version into %LOCALAPPDATA%\CharacterDesigner, keeps your .env (your keys),
# adds a desktop shortcut and starts the app. Run it again to update.

$ErrorActionPreference = 'Stop'
$repo = 'DashDashDesign/Kara'
$dest = Join-Path $env:LOCALAPPDATA 'CharacterDesigner'

Write-Host ''
Write-Host 'Kara: install' -ForegroundColor Green

# 1. Node.js 18 or newer
function Get-NodeMajor {
  try { return [int]((& node -v) -replace '^v(\d+).*', '$1') } catch { return 0 }
}
if ((Get-NodeMajor) -lt 18) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host 'Installing Node.js LTS (winget)...'
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  }
  if ((Get-NodeMajor) -lt 18) {
    Write-Host 'Node.js 18 or newer is needed. Install it from https://nodejs.org, then run this command again.' -ForegroundColor Yellow
    return
  }
}

# 2. Latest version of the app
$tmp = Join-Path $env:TEMP ('kara-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
$zip = Join-Path $tmp 'app.zip'
Write-Host 'Downloading the app...'
# The exact latest version, remembered in .version so the app's Update button knows where it stands.
$sha = $null
try { $sha = (Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/commits/main" -Headers @{ 'User-Agent' = 'kara' }).sha } catch { }
$ref = if ($sha) { $sha } else { 'refs/heads/main' }
Invoke-WebRequest -UseBasicParsing -Uri "https://codeload.github.com/$repo/zip/$ref" -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1

# 3. Copy over the old version; .env and the files you added stay where they are.
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path (Join-Path $src.FullName '*') -Destination $dest -Recurse -Force
Remove-Item -Recurse -Force $tmp
if ($sha) { Set-Content -Path (Join-Path $dest '.version') -Value $sha -NoNewline }

# 4. Desktop shortcut
try {
  $shell = New-Object -ComObject WScript.Shell
  $link = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'Kara.lnk'))
  $link.TargetPath = Join-Path $dest 'start.bat'
  $link.WorkingDirectory = $dest
  $link.Save()
} catch {
  Write-Host 'No desktop shortcut (not allowed here). Start the app with start.bat in the folder below.'
}

Write-Host "Installed in $dest" -ForegroundColor Green
Write-Host 'Starting: the app opens at http://localhost:3210 (close this window to stop it).'
Set-Location $dest
& (Join-Path $dest 'start.bat')
