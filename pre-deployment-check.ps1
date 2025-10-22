# Pre-Deployment Script
# Run this before deploying to check everything is ready

Write-Host "🚀 JA Car Rental - Pre-Deployment Check" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

$errors = 0

# Check Node version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($nodeVersion -match "v(\d+)\.") {
    $majorVersion = [int]$matches[1]
    if ($majorVersion -ge 18) {
        Write-Host "✅ Node.js $nodeVersion (OK)" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js $nodeVersion (Need v18 or higher)" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    $errors++
}

# Check npm
Write-Host "`nChecking npm..." -ForegroundColor Yellow
$npmVersion = npm -v
if ($npmVersion) {
    Write-Host "✅ npm $npmVersion (OK)" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $errors++
}

# Check Git status
Write-Host "`nChecking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host "Consider committing before deployment" -ForegroundColor Yellow
} else {
    Write-Host "✅ Git working tree is clean" -ForegroundColor Green
}

# Check backend .env.example
Write-Host "`nChecking backend configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env.example") {
    Write-Host "✅ backend\.env.example exists" -ForegroundColor Green
} else {
    Write-Host "❌ backend\.env.example not found" -ForegroundColor Red
    $errors++
}

# Check frontend .env.production.example
Write-Host "`nChecking frontend configuration..." -ForegroundColor Yellow
if (Test-Path "frontend\.env.production.example") {
    Write-Host "✅ frontend\.env.production.example exists" -ForegroundColor Green
} else {
    Write-Host "❌ frontend\.env.production.example not found" -ForegroundColor Red
    $errors++
}

# Check backend dependencies
Write-Host "`nChecking backend dependencies..." -ForegroundColor Yellow
Push-Location backend
$backendCheck = npm list --depth=0 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend dependencies may have issues" -ForegroundColor Yellow
    Write-Host "Run 'cd backend && npm install' to fix" -ForegroundColor Yellow
}
Pop-Location

# Check frontend dependencies
Write-Host "`nChecking frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
$frontendCheck = npm list --depth=0 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies may have issues" -ForegroundColor Yellow
    Write-Host "Run 'cd frontend && npm install' to fix" -ForegroundColor Yellow
}
Pop-Location

# Check Prisma schema
Write-Host "`nChecking Prisma configuration..." -ForegroundColor Yellow
if (Test-Path "backend\prisma\schema.prisma") {
    Write-Host "✅ Prisma schema exists" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma schema not found" -ForegroundColor Red
    $errors++
}

# Test backend build
Write-Host "`nTesting backend startup..." -ForegroundColor Yellow
Write-Host "(This will take a few seconds)" -ForegroundColor Gray
Push-Location backend
$backendStart = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow -RedirectStandardOutput "..\backend-test.log" -RedirectStandardError "..\backend-error.log"
Start-Sleep -Seconds 5
if (!$backendStart.HasExited) {
    Write-Host "✅ Backend starts successfully" -ForegroundColor Green
    Stop-Process -Id $backendStart.Id -Force
} else {
    Write-Host "❌ Backend failed to start (check backend-error.log)" -ForegroundColor Red
    $errors++
}
Pop-Location

# Test frontend build
Write-Host "`nTesting frontend build..." -ForegroundColor Yellow
Write-Host "(This may take 20-30 seconds)" -ForegroundColor Gray
Push-Location frontend
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend builds successfully" -ForegroundColor Green
    if (Test-Path "dist") {
        $distSize = (Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "   Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    Write-Host $buildOutput
    $errors++
}
Pop-Location

# Summary
Write-Host "`n=========================================`n" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "🎉 All checks passed! Ready for deployment!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy backend to Render" -ForegroundColor White
    Write-Host "2. Deploy frontend to Vercel" -ForegroundColor White
    Write-Host "3. Update CORS settings" -ForegroundColor White
    Write-Host "`nSee QUICK_DEPLOYMENT_GUIDE.md for instructions" -ForegroundColor Yellow
} else {
    Write-Host "❌ $errors error(s) found. Please fix before deploying." -ForegroundColor Red
    Write-Host "`nCommon fixes:" -ForegroundColor Yellow
    Write-Host "- Run 'npm install' in backend and frontend" -ForegroundColor White
    Write-Host "- Create missing .env.example files" -ForegroundColor White
    Write-Host "- Update Node.js to v18+" -ForegroundColor White
}

# Cleanup
if (Test-Path "backend-test.log") { Remove-Item "backend-test.log" }
if (Test-Path "backend-error.log") { Remove-Item "backend-error.log" }

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
