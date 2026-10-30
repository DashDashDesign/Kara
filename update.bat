@echo off
rem Met a jour ce dossier avec la derniere version du depot GitHub (branche main).
rem Le fichier .env (vos cles) n'est jamais touche : il n'est pas dans le depot.
rem Le script se copie dans le dossier temporaire avant de tourner, pour pouvoir se remplacer lui-meme.
if "%~1"=="" (
  copy /y "%~f0" "%TEMP%\kara_update.bat" >nul
  call "%TEMP%\kara_update.bat" "%~dp0"
  exit /b
)
cd /d "%~1"
where git >nul 2>nul
if errorlevel 1 (
  echo Git est necessaire. Installez-le depuis https://git-scm.com puis relancez ce fichier.
  pause
  exit /b 1
)
if not exist ".git" (
  echo Premiere mise a jour : ce dossier est relie au depot GitHub.
  git init -b main >nul
  git remote add origin https://github.com/DashDashDesign/Kara.git
  git fetch origin main
  if errorlevel 1 goto fail
  git reset --hard origin/main
  if errorlevel 1 goto fail
  git branch --set-upstream-to=origin/main main >nul
) else (
  git pull --ff-only origin main
  if errorlevel 1 goto fail
)
echo.
echo Mise a jour terminee.
if not exist ".env" echo Attention : il n'y a pas de fichier .env dans ce dossier.
pause
exit /b 0
:fail
echo.
echo La mise a jour a echoue. Copiez le message ci-dessus et envoyez-le a Claude.
pause
exit /b 1
