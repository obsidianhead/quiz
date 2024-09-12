@echo off
REM Create the build directory if it doesn't exist
if not exist build (
    mkdir build
    echo Build folder created
)

REM Copy index.html and script.js to the build folder
copy index.html build\
copy script.js build\
copy styles.css build\

echo Build completed
pause