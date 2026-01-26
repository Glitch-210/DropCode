$ErrorActionPreference = "Stop"

Write-Host "Starting Expiry & Limits Test (Debug Mode)..." -ForegroundColor Cyan

# 1. Create Test File
"Limit Test Content" | Out-File -FilePath "limit_test.txt" -Encoding utf8

try {
    # 2. Upload File
    Write-Host "Uploading file..."
    $uploadJson = curl.exe -s -F "files=@limit_test.txt" http://localhost:3000/api/upload
    $uploadData = $uploadJson | ConvertFrom-Json
    $code = $uploadData.code
    Write-Host "Generated Code: $code" -ForegroundColor Yellow

    # 3. Set Download Limit to 1 VIA PATCH
    Write-Host "Setting limit to 1..."
    
    # Create temp json file to avoid quoting issues
    $patchFile = "patch_limit.json"
    @{ maxDownloads = 1 } | ConvertTo-Json | Out-File $patchFile -Encoding utf8
    
    # Use @filename for body
    $patchJson = curl.exe -s -X PATCH -H "Content-Type: application/json" -d "@$patchFile" "http://localhost:3000/api/file/$code"
    
    Write-Host "Patch Response: $patchJson"
    
    $patchData = $patchJson | ConvertFrom-Json
    if ($patchData.maxDownloads -ne 1) {
        throw "Failed to update maxDownloads. Got: $($patchData.maxDownloads)"
    }
    Write-Host "Limit set to 1 verified."

    # 4. Download 1 (Should Succeed)
    Write-Host "Download 1 (Expected: Success)..."
    Invoke-WebRequest -Uri "http://localhost:3000/api/download/$code" -OutFile "download_1.txt"
    Write-Host "Download 1 OK."

    # 5. Download 2 (Should Fail with 403)
    Write-Host "Download 2 (Expected: Failure)..."
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/api/download/$code" -OutFile "download_2.txt"
        Write-Error "Download 2 succeeded but should have failed!"
        exit 1
    }
    catch {
        # Inspect exception to find status code
        $resp = $_.Exception.Response
        if ($resp -and $resp.StatusCode -eq 403) {
            Write-Host "SUCCESS: Download 2 blocked with 403 Forbidden." -ForegroundColor Green
        }
        else {
            # Sometimes PowerShell throws different exceptions for 4xx
            $status = $_.Exception.Response.StatusCode
            if ($status -eq "Forbidden") {
                Write-Host "SUCCESS: Download 2 blocked with 403 Forbidden." -ForegroundColor Green
            }
            else {
                Write-Error "Expected 403, got $status ($(_))"
                exit 1
            }
        }
    }

    # 6. Test Expiry Update
    Write-Host "Updating Expiry to 30m..."
    $expiryFile = "patch_expiry.json"
    @{ expiryMinutes = 30 } | ConvertTo-Json | Out-File $expiryFile -Encoding utf8
    
    $expiryJson = curl.exe -s -X PATCH -H "Content-Type: application/json" -d "@$expiryFile" "http://localhost:3000/api/file/$code"
    $expiryData = $expiryJson | ConvertFrom-Json
    
    if ($expiryData.expiryMinutes -ne 30) {
        throw "Failed to update expiryMinutes."
    }
    Write-Host "Expiry verified as 30m." -ForegroundColor Green

}
catch {
    Write-Error $_
    exit 1
}
finally {
    Remove-Item limit_test.txt -ErrorAction SilentlyContinue
    Remove-Item download_1.txt -ErrorAction SilentlyContinue
    Remove-Item download_2.txt -ErrorAction SilentlyContinue
    Remove-Item patch_limit.json -ErrorAction SilentlyContinue
    Remove-Item patch_expiry.json -ErrorAction SilentlyContinue
}
