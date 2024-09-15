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

REM Create the versioned build directory if it doesn't exist
if not exist "%buildDir%" (
    mkdir "%buildDir%"
    echo Build folder "%buildDir%" created
) else (
    echo Build folder "%buildDir%" already exists, proceeding with file copy...
)

REM Copy files to the versioned build directory
copy index.html "%buildDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy index.html & exit /b 1
copy script.js "%buildDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy script.js & exit /b 1
copy styles.css "%buildDir%\" >nul
if %errorlevel% neq 0 echo Failed to copy styles.css & exit /b 1

REM Copy and rename the database file
copy "db\quiz.db" "%buildDir%\%newDbFile%" >nul
if %errorlevel% neq 0 (
    echo Failed to copy and rename quiz.db to %newDbFile%
    exit /b 1
)

REM Replace quiz.db, isLocalMode, and forceDBDownload in script.js in the build folder
set "oldDbName=quiz.db"
set "newDbName=%newDbFile%"
set "oldLocalMode=true"
set "newLocalMode=false"
set "oldForceDB=true"
set "newForceDB=true"

REM Use PowerShell to replace all instances in script.js
powershell -Command "(Get-Content '%buildDir%\script.js') -replace '%oldDbName%', '%newDbName%' -replace '%oldLocalMode%', '%newLocalMode%' -replace '%oldForceDB%', '%newForceDB%' | Set-Content '%buildDir%\script.js'"

if %errorlevel% neq 0 (
    echo Failed to update script.js with new database name, local mode, and forceDBDownload values.
    exit /b 1
)

echo Build completed successfully in "%buildDir%" with version %buildVersion%.

pause
