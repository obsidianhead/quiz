@echo off
echo Setting up your environment...

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

:: Step 5: Extract the ZIP file into the current directory
echo Extracting the project...
powershell -Command "Expand-Archive -Path project.zip -DestinationPath . -Force"

:: Step 6: Clean up the project ZIP file
echo Cleaning up...
del project.zip

echo Setup completed. Python and the project have been extracted into the current directory.
pause
