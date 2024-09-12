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

REM Azure Blob Storage Upload
set "storageAccountName=quizstore"
set "containerName=database"
set "resourceGroup=hgtc"
set "sasToken=se=2024-09-15T00%%3A00Z&sp=rw&spr=https&sv=2022-11-02&ss=b&srt=o&sig=Ub7GjXVH7LxZ8qoZHFQlbig34F9jxh6xzR%%2BPSsKTlew%%3D"

echo Uploading files to Azure Blob Storage...

az storage blob upload --account-name %storageAccountName% --container-name %containerName% --name "quiz.db" --file ".\db\quiz.db" --sas-token %sasToken%

echo Build and upload completed.
pause

echo Build completed
pause