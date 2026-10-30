@echo off
rem Images d apercu des menus et des modeles, faites dans le cloud (cles KIE et fal de l app).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est necessaire. Installez-le depuis https://nodejs.org puis relancez ce fichier.
  pause
  exit /b 1
)
echo Images d apercu, faites dans le cloud (payant).
echo   1 : menus, essai de 5 images avec Seedream 5 Flash (KIE, sinon fal ; quelques centimes l image)
echo   2 : menus et inspirations, toutes les images qui manquent (environ 104 images avec Seedream 5 Flash)
echo   3 : modeles, le meme personnage avec chaque modele (environ 17 images, KIE sinon fal, de quelques centimes a 0,15 dollar l image)
echo   4 : importer les vignettes deja faites sur Magnific (gratuit, avant le 31 octobre)
choice /c 1234 /n /m "Votre choix, 1, 2, 3 ou 4 : "
if errorlevel 4 (node tools\previews.js --import) else if errorlevel 3 (node tools\previews.js --models) else if errorlevel 2 (node tools\previews.js --all) else (node tools\previews.js)
echo.
echo Les images sont dans public\previews. Rechargez l app (start.bat) pour les voir.
choice /c ON /n /m "Envoyer les images sur GitHub pour les voir aussi en ligne ? O ou N : "
if errorlevel 2 goto end
git add -A public/previews tools
rem A name for the commit even when Git has none on this computer.
git -c user.name="Kara" -c user.email="previews@kara.local" commit -m "Preview images"
git push origin HEAD:main
if errorlevel 1 (echo L envoi a echoue. Copiez le message ci-dessus et envoyez-le a Claude.) else (echo Envoye. Le site se met a jour dans une a deux minutes.)
:end
pause
