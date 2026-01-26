$ErrorActionPreference = "Stop"

Write-Host "Starting DropCode End-to-End Test..." -ForegroundColor Cyan

# 1. Start Backend (if not running) - actually we assume it's running on 3000 from previous steps or user
# We will verify health first
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
    if ($health.status -eq "ok") {
        Write-Host "Backend is HEALTHY." -ForegroundColor Green
    } else {
        throw "Backend reported unhealthy status."
    }
} catch {
    Write-Error "Backend is NOT running on port 3000. Please start it."
    exit 1
}

# 2. Create Test File
$testContent = "DropCode E2E Test Content - " + (Get-Date).ToString()
$testFile = "e2e_test.txt"
$testContent | Out-File -FilePath $testFile -Encoding utf8
Write-Host "Created test file: $testFile"

# 3. Upload File
Write-Host "Uploading file..."
# Using curl.exe for reliable multipart upload
$uploadJson = curl.exe -s -F "file=@$testFile" http://localhost:3000/api/upload
Write-Host "Upload Response: $uploadJson"

$uploadData = $uploadJson | ConvertFrom-Json
$code = $uploadData.code
Write-Host "Generated Code: $code" -ForegroundColor Yellow

if (-not $code) {
    throw "Failed to get code from upload response."
}

# 4. Get Metadata
Write-Host "Fetching Metadata..."
$metaData = Invoke-RestMethod -Uri "http://localhost:3000/api/file/$code" -Method Get
Write-Host "Metadata Received: $($metaData.originalName) ($($metaData.size) bytes)"

if ($metaData.originalName -ne $testFile) {
    throw "Metadata mismatch: Expected $testFile, got $($metaData.originalName)"
}

# 5. Download File
Write-Host "Downloading File..."
$downloadFile = "e2e_downloaded.txt"
Invoke-WebRequest -Uri "http://localhost:3000/api/download/$code" -OutFile $downloadFile
Write-Host "File downloaded to: $downloadFile"

# 6. Verify Content
$downloadedContent = Get-Content -Path $downloadFile -Raw
# Trim newlines just in case of shell differences
if ($downloadedContent.Trim() -eq $testContent.Trim()) {
    Write-Host "SUCCESS: Downloaded content matches original!" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Content mismatch." -ForegroundColor Red
    Write-Host "Original: '$testContent'"
    Write-Host "Downloaded: '$downloadedContent'"
    exit 1
}

# Clean up
Remove-Item $testFile
Remove-Item $downloadFile

Write-Host "E2E Test Completed Successfully." -ForegroundColor Green
