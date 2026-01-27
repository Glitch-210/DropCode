$ErrorActionPreference = "Stop"

Write-Host "Starting Multi-file Upload Test..." -ForegroundColor Cyan

# 1. Create Test Files
"File 1 Content" | Out-File -FilePath "test1.txt" -Encoding utf8
"File 2 Content" | Out-File -FilePath "test2.txt" -Encoding utf8

try {
    # 2. Upload Multi-file
    # Note: curl.exe -F "files=@file1" -F "files=@file2"
    Write-Host "Uploading 2 files..."
    $uploadJson = curl.exe -s -F "files=@test1.txt" -F "files=@test2.txt" http://localhost:3000/api/upload
    Write-Host "Upload Response: $uploadJson"

    $uploadData = $uploadJson | ConvertFrom-Json
    $code = $uploadData.code
    $count = $uploadData.fileCount

    if ($count -ne 2) {
        throw "Expected 2 files, got $count"
    }

    Write-Host "Generated Code: $code (File Count: $count)" -ForegroundColor Yellow

    # 3. Get Metadata
    $metaData = Invoke-RestMethod -Uri "http://localhost:3000/api/file/$code" -Method Get
    Write-Host "Metadata: $($metaData.originalName) (Count: $($metaData.fileCount))"

    if ($metaData.fileCount -ne 2) {
        throw "Metadata file count mismatch"
    }

    # 4. Download (Should be ZIP)
    Write-Host "Downloading..."
    $outFile = "downloaded.zip"
    Invoke-WebRequest -Uri "http://localhost:3000/api/download/$code" -OutFile $outFile
    
    # Check if it looks like a zip (PK header)
    $bytes = Get-Content -Path $outFile -Encoding Byte -TotalCount 2
    if ($bytes[0] -eq 80 -and $bytes[1] -eq 75) {
        Write-Host "SUCCESS: Downloaded file is a ZIP archive." -ForegroundColor Green
    }
    else {
        Write-Warning "Downloaded file might not be a ZIP (Header: $bytes)"
    }

}
catch {
    Write-Error $_
    exit 1
}
finally {
    Remove-Item test1.txt -ErrorAction SilentlyContinue
    Remove-Item test2.txt -ErrorAction SilentlyContinue
    Remove-Item downloaded.zip -ErrorAction SilentlyContinue
}
