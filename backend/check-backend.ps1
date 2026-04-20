# Check if backend is running
$process = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*node*" -or $_.ProcessName -eq "node"}

if ($process) {
    Write-Host "✅ Backend is running (PID: $($process.Id))"
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Backend is responding to requests"
        Write-Host "📊 Health check: $($response.StatusCode)"
    } catch {
        Write-Host "❌ Backend is running but not responding"
    }
} else {
    Write-Host "❌ Backend is not running"
    Write-Host "🚀 Starting backend..."
    Start-Process -FilePath "node" -ArgumentList "src/index.js" -WindowStyle Hidden -WorkingDirectory "c:\Users\kiran\OneDrive\Desktop\Synergy\backend"
    Write-Host "✅ Backend started in background"
}
