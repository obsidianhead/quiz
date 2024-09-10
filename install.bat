@echo off
echo Setting up your environment...

:: Save the current directory (the directory where the script is located)
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

@echo on

:: Step 1: Check if Python is already installed
python --version
if %ERRORLEVEL% neq 0 (
    echo Python is not installed. Downloading and installing Python 3.10 locally...

    :: Download Python 3.10 embeddable package (no installer needed)
    powershell -Command "Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip -OutFile python-3.10.11-embed-amd64.zip"

    :: Extract the Python embeddable package into the current directory
    powershell -Command "Expand-Archive -Path python-3.10.11-embed-amd64.zip -DestinationPath . -Force"

    :: Remove the zip file after extraction
    del python-3.10.11-embed-amd64.zip

    echo Python has been installed locally.
)

:: Step 2: Check if pip is installed
python.exe -m pip --version
if %ERRORLEVEL% neq 0 (
    echo Pip is not installed. Installing pip...

    :: Download the get-pip.py script
    powershell -Command "Invoke-WebRequest -Uri https://bootstrap.pypa.io/get-pip.py -OutFile get-pip.py"

    :: Run get-pip.py to install pip
    python.exe get-pip.py

    :: Clean up the get-pip.py script
    del get-pip.py
) else (
    echo Pip is already installed.
)

:: Step 3: Check if dependencies are already installed
if exist requirements.txt (
    echo Checking if dependencies are installed...
    python.exe -m pip check
    if %ERRORLEVEL% neq 0 (
        echo Installing dependencies from requirements.txt...
        python.exe -m pip install -r requirements.txt
    ) else (
        echo All dependencies are already installed.
    )
) else (
    echo No requirements.txt file found. Skipping dependency installation.
)

:: Step 4: Download the project ZIP file from GitHub
echo Downloading project ZIP from GitHub...
powershell -Command "Invoke-WebRequest -Uri https://github.com/obsidianhead/quiz/archive/refs/heads/master.zip -OutFile project.zip"

:: Step 5: Extract the ZIP file into the current directory (it will create a subfolder like 'quiz-master')
echo Extracting the project into the current directory...
powershell -Command "Expand-Archive -Path project.zip -DestinationPath . -Force"

:: Step 6: Clean up the project ZIP file
echo Cleaning up...
del project.zip

:: Step 7: Find the extracted folder name (assuming it's 'quiz-master')
for /d %%D in (*) do (
    if exist "%%D\README.md" (
        set EXTRACTED_FOLDER=%%D
        echo Project extracted into folder: %%D
    )
)

:: Step 8: Navigate into the extracted folder
cd "%EXTRACTED_FOLDER%"

:: Step 9: Create 'data' and 'assets' directories inside the extracted folder
echo Creating 'data' and 'assets' directories inside the extracted project folder...
mkdir data
mkdir assets

:: Step 10: Navigate into the 'data' directory
cd data

:: Step 11: Download and extract repo1 (CET127) and rename its folder

:: First repository (CET127)
echo Downloading and extracting first repository (CET127)...
powershell -Command "Invoke-WebRequest -Uri https://github.com/obsidianhead/cet127/archive/refs/heads/master.zip -OutFile repo1.zip"
powershell -Command "Expand-Archive -Path repo1.zip -DestinationPath CET127 -Force"
del repo1.zip

:: Move contents of 'cet127-master' to 'CET127' and delete 'cet127-master' folder
echo Moving contents of 'cet127-master' to 'CET127'...
xcopy CET127\cet127-master\* CET127\ /s /e /i /y
rd /s /q CET127\cet127-master

:: Step 12: Download and extract repo2 (EGR170) and rename its folder

:: Second repository (EGR170)
echo Downloading and extracting second repository (EGR170)...
powershell -Command "Invoke-WebRequest -Uri https://github.com/obsidianhead/egr170/archive/refs/heads/master.zip -OutFile repo2.zip"
powershell -Command "Expand-Archive -Path repo2.zip -DestinationPath EGR170 -Force"
del repo2.zip

:: Move contents of 'egr170-master' to 'EGR170' and delete 'egr170-master' folder
echo Moving contents of 'egr170-master' to 'EGR170'...
xcopy EGR170\egr170-master\* EGR170\ /s /e /i /y
rd /s /q EGR170\egr170-master

echo Setup completed. All repositories have been downloaded, extracted, and moved.

pause
