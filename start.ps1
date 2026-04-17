# Praeventix EWS Demo Launcher
# Starts both Backend (FastAPI) and Frontend (Vite React) in parallel

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "  ||       PRAEVENTIX - Early Warning System                    ||" -ForegroundColor Cyan
Write-Host "  ||       Pre-Delinquency Intervention Engine                  ||" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = $PSScriptRoot

# 1. Start Backend API
Write-Host "  [1/2] Starting FastAPI Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\backend'; Write-Host 'Backend starting...' -ForegroundColor Green; python -m uvicorn api.main:app --reload --port 8000"

# 2. Start Real-time Simulation Stream
Write-Host "  [2/3] Starting Real-time Simulation Stream..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\backend'; `$env:PYTHONIOENCODING='utf-8'; Write-Host 'Simulation stream starting...' -ForegroundColor Green; python run_simulation_stream.py"

# 3. Wait for Backend to initialize
Start-Sleep -Seconds 3

# 4. Start Frontend Dashboard
Write-Host "  [3/3] Starting React Dashboard on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "  Full Stack Launched!" -ForegroundColor Green
Write-Host ""
Write-Host "  Dashboard : http://localhost:5173" -ForegroundColor White
Write-Host "  API       : http://localhost:8000" -ForegroundColor White
Write-Host "  Health    : http://localhost:8000/health" -ForegroundColor White
Write-Host "  API Docs  : http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
