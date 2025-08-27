# deploy.ps1
# PowerShell script to deploy build/local/html contents to a remote VPS using scp
# Assumes 'daniel' owns the target folder; no sudo required

param(
    [string]$RemoteUser = "daniel",
    [string]$RemoteHost = "74.208.102.237",
    [string]$RemotePath = "/var/www/quiz/html"
)

$localPath = "build/local/html"

Write-Host "Deploying contents of ${localPath} to ${RemoteUser}@${RemoteHost}:${RemotePath} ..."

# Step 1: Ensure remote directory exists
ssh "${RemoteUser}@${RemoteHost}" "mkdir -p '${RemotePath}'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to ensure remote directory exists."
    exit 1
}

# Step 2: Copy contents of localPath into remotePath
scp -r "${localPath}/*" "${RemoteUser}@${RemoteHost}:${RemotePath}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Files copied successfully."

    # Step 3: Fix ownership and permissions on remote server
    Write-Host "Setting ownership and permissions on remote server..."

    # Set ownership
    ssh "${RemoteUser}@${RemoteHost}" "chown -R ${RemoteUser}:www-data '${RemotePath}'"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set ownership."
        exit 1
    }

    # Set directories to 755
    ssh "${RemoteUser}@${RemoteHost}" "find '${RemotePath}' -type d -exec chmod 755 {} \;"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set directory permissions."
        exit 1
    }

    # Set files to 644
    ssh "${RemoteUser}@${RemoteHost}" "find '${RemotePath}' -type f -exec chmod 644 {} \;"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set file permissions."
        exit 1
    }

    Write-Host "Ownership and permissions set successfully!"

} else {
    Write-Host "Deployment failed."
    exit 1
}
