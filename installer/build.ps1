# Builds dist\Kara-Setup.exe on Windows: the app (as in git), a portable Node, Kara.exe and its icon,
# packed by Inno Setup. Used by .github/workflows/installers.yml, and works the same on a PC with Inno Setup 6.
#   powershell -ExecutionPolicy Bypass -File installer\build.ps1 [-Version 1.0.0]
param([string]$Version = '0.1.0')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root 'build\win'
$app = Join-Path $build 'app'
if (Test-Path $build) { Remove-Item -Recurse -Force $build }
New-Item -ItemType Directory -Force $app | Out-Null

# 1. The app as committed (no .env, no keys), without what only developers need.
$commit = (git -C $root rev-parse HEAD).Trim()
$tar = Join-Path $build 'app.tar'
git -C $root archive --format=tar -o $tar HEAD
& (Join-Path $env:WINDIR 'System32\tar.exe') -xf $tar -C $app
if ($LASTEXITCODE -ne 0 -or -not (Test-Path (Join-Path $app 'server.js'))) { throw 'The app could not be unpacked' }
Remove-Item $tar
foreach ($dev in 'test', 'tools', 'worker', 'installer', 'docs', '.github', 'CLAUDE.md', 'wrangler.jsonc', 'apercus.bat', 'update.bat', 'install.ps1', 'install.sh') {
  $p = Join-Path $app $dev
  if (Test-Path $p) { Remove-Item -Recurse -Force $p }
}
Set-Content -Path (Join-Path $app '.version') -Value $commit -NoNewline

# 2. Portable Node (latest 24.x), checked against the official checksums.
$base = 'https://nodejs.org/dist/latest-v24.x'
$sums = (Invoke-WebRequest -UseBasicParsing "$base/SHASUMS256.txt").Content
$line = ($sums -split "`n" | Where-Object { $_ -match 'node-v[\d.]+-win-x64\.zip$' } | Select-Object -First 1).Trim()
$hash, $zipName = $line -split '\s+'
$zip = Join-Path $build $zipName
Invoke-WebRequest -UseBasicParsing "$base/$zipName" -OutFile $zip
if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $hash.ToUpper()) { throw "Node download does not match its checksum" }
Expand-Archive $zip -DestinationPath $build
$nodeDir = Join-Path $app 'node'
New-Item -ItemType Directory -Force $nodeDir | Out-Null
$unzipped = Join-Path $build ($zipName -replace '\.zip$', '')
Copy-Item (Join-Path $unzipped 'node.exe') $nodeDir
Copy-Item (Join-Path $unzipped 'LICENSE') (Join-Path $nodeDir 'LICENSE.txt')
Remove-Item -Recurse -Force $unzipped, $zip

# 3. The icon: the Kara PNG at 256, 48, 32 and 16 px in one .ico (PNG entries).
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Join-Path $root 'public\icons\icon-512.png'))
$pngs = foreach ($s in 256, 48, 32, 16) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($src, 0, 0, $s, $s)
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  , @($s, $ms.ToArray())
}
$src.Dispose()
$ico = Join-Path $build 'kara.ico'
$out = New-Object System.IO.BinaryWriter([System.IO.File]::Create($ico))
$out.Write([UInt16]0); $out.Write([UInt16]1); $out.Write([UInt16]$pngs.Count)
$offset = 6 + 16 * $pngs.Count
foreach ($p in $pngs) {
  $s = $p[0]; $bytes = $p[1]
  $out.Write([byte]($s % 256)); $out.Write([byte]($s % 256)); $out.Write([byte]0); $out.Write([byte]0)
  $out.Write([UInt16]1); $out.Write([UInt16]32); $out.Write([UInt32]$bytes.Length); $out.Write([UInt32]$offset)
  $offset += $bytes.Length
}
foreach ($p in $pngs) { $out.Write([byte[]]$p[1]) }
$out.Close()

# 4. Kara.exe, compiled by the C# compiler that ships with Windows.
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $csc /nologo /codepage:65001 /target:winexe /optimize+ "/win32icon:$ico" "/out:$(Join-Path $app 'Kara.exe')" /r:System.Windows.Forms.dll /r:System.Management.dll (Join-Path $PSScriptRoot 'launcher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Kara.exe did not compile' }

# 5. The installer.
$iscc = @("${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe", "$env:ProgramFiles\Inno Setup 6\ISCC.exe", "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw 'Inno Setup 6 is not installed (https://jrsoftware.org/isinfo.php)' }
& $iscc /Q "/DAppVersion=$Version" "/DBuildDir=$build" "/DOutDir=$(Join-Path $root 'dist')" (Join-Path $PSScriptRoot 'kara.iss')
if ($LASTEXITCODE -ne 0) { throw 'Inno Setup failed' }
Get-Item (Join-Path $root 'dist\Kara-Setup.exe')
