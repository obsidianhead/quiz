@echo off
setlocal enabledelayedexpansion

REM Confirmation prompt
echo Are you sure you want to run the build process? (Y/N)
choice /c YN /n /m "Press Y to proceed or N to cancel."
if errorlevel 2 (
    echo Build process canceled.
    exit /b 0
)

REM Read and increment build version
set "versionFile=version.txt"
if not exist "%versionFile%" (
    echo 1 > "%versionFile%"  REM Create version.txt if it doesn't exist with starting version 1
)

REM Read the current version from version.txt
set /p buildVersion=<%versionFile%
if "%buildVersion%"=="" set buildVersion=0

REM Increment the version number
set /a buildVersion+=1

REM Update version.txt with the new version
echo %buildVersion% > "%versionFile%"

echo Current build version: %buildVersion%

REM Set build directory with version inside the build folder
set "mainBuildDir=build"
set "buildDir=%mainBuildDir%\build_v%buildVersion%"

REM Set database file version name
set "newDbFile=quiz_v%buildVersion%.db"

REM Create the main build folder if it doesn't exist
if not exist "%mainBuildDir%" (
    mkdir "%mainBuildDir%"
    echo Main build folder "%mainBuildDir%" created
)

REM Create the versioned build directory and html subfolders
set "htmlDir=%buildDir%\html"
set "cssDir=%htmlDir%\css"
set "jsDir=%htmlDir%\js"
set "imagesDir=%htmlDir%\images"

if not exist "%htmlDir%" mkdir "%htmlDir%"
if not exist "%cssDir%" mkdir "%cssDir%"
if not exist "%jsDir%" mkdir "%jsDir%"
if not exist "%imagesDir%" mkdir "%imagesDir%"

REM Copy files to the appropriate html subfolders
copy index.html "%htmlDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy index.html & exit /b 1
copy script.js "%jsDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy script.js & exit /b 1
copy styles.css "%cssDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy styles.css & exit /b 1
REM Copy images (if any)
if exist images\*.* copy images\*.* "%imagesDir%\" >nul

REM Copy and rename the database file to html folder
copy "db\quiz.db" "%htmlDir%\%newDbFile%" >nul
if %errorlevel% neq 0 (
    echo Failed to copy and rename quiz.db to %newDbFile%
    exit /b 1
)

REM --- Create local and production subfolders with the same structure ---
set "localDir=build\local\html"
set "prodDir=build\production\html"
set "localCssDir=%localDir%\css"
set "localJsDir=%localDir%\js"
set "localImagesDir=%localDir%\images"
set "prodCssDir=%prodDir%\css"
set "prodJsDir=%prodDir%\js"
set "prodImagesDir=%prodDir%\images"

if not exist "%localDir%" mkdir "%localDir%"
if not exist "%localCssDir%" mkdir "%localCssDir%"
if not exist "%localJsDir%" mkdir "%localJsDir%"
if not exist "%localImagesDir%" mkdir "%localImagesDir%"
if not exist "%prodDir%" mkdir "%prodDir%"
if not exist "%prodCssDir%" mkdir "%prodCssDir%"
if not exist "%prodJsDir%" mkdir "%prodJsDir%"
if not exist "%prodImagesDir%" mkdir "%prodImagesDir%"

REM Copy files to local build
copy index.html "%localDir%\" >nul
copy styles.css "%localCssDir%\" >nul
copy script.js "%localJsDir%\" >nul
copy "%htmlDir%\%newDbFile%" "%localDir%\" >nul
if exist images\*.* copy images\*.* "%localImagesDir%\" >nul
REM Set local DB base URL and DB file name in script.js
powershell -Command "(Get-Content '%localJsDir%\script.js') -replace 'DB_BASE_URL', '.' -replace 'DB_FILE_NAME', '%newDbFile%' | Set-Content '%localJsDir%\script.js'"

REM Copy files to production build
copy index.html "%prodDir%\" >nul
copy styles.css "%prodCssDir%\" >nul
copy script.js "%prodJsDir%\" >nul
copy "%htmlDir%\%newDbFile%" "%prodDir%\" >nul
if exist images\*.* copy images\*.* "%prodImagesDir%\" >nul
REM Set Azure DB base URL and DB file name in script.js
powershell -Command "(Get-Content '%prodJsDir%\script.js') -replace 'DB_BASE_URL', 'https://quizstore.blob.core.windows.net/database' -replace 'DB_FILE_NAME', '%newDbFile%' | Set-Content '%prodJsDir%\script.js'"

echo Local and production builds created in %localDir% and %prodDir%.

pause

REM Serve the latest build using the new script
call serve-latest-build.bat
