#!/usr/bin/env pwsh
# EduFlow ERP: Database Reset and Seed Script
# Purpose: Clean all test data and seed fresh data while preserving SuperAdmin
# Usage: .\reset-and-seed-db.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║  EduFlow ERP - Database Reset & Seed Script                ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found in current directory" -ForegroundColor Red
    exit 1
}

# Read .env file
$envContent = Get-Content ".env" | Where-Object { $_ -match "^DB_" }
$env = @{}
foreach ($line in $envContent) {
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Count -eq 2) {
            $env[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

# Extract database connection details
$server = $env["DB_HOST"] -or "localhost"
$database = $env["DB_NAME"]
$user = $env["DB_USER"]
$password = $env["DB_PASSWORD"]
$port = $env["DB_PORT"] -or "1433"

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Server: $server`:$port"
Write-Host "  Database: $database"
Write-Host "  User: $user"
Write-Host ""

# Prompt for confirmation
Write-Host "⚠️  WARNING: This will delete ALL data except SuperAdmin!" -ForegroundColor Yellow
Write-Host "This action cannot be undone." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Type 'yes' to confirm and proceed"
if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting database reset and seed operation..." -ForegroundColor Cyan
Write-Host ""

# Check if sqlcmd is available
$sqlcmdPath = (Get-Command sqlcmd -ErrorAction SilentlyContinue).Path
if (-not $sqlcmdPath) {
    Write-Host "❌ Error: sqlcmd not found. Please install SQL Server Management Tools." -ForegroundColor Red
    exit 1
}

# Run the SQL script
Write-Host "Executing ResetAndSeed.sql..." -ForegroundColor Cyan

$sqlFile = "./migrations/ResetAndSeed.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: $sqlFile not found" -ForegroundColor Red
    exit 1
}

# Execute the SQL script
try {
    $sqlContent = Get-Content $sqlFile -Raw
    
    # Use sqlcmd to execute
    sqlcmd -S "$server`:$port" -U "$user" -P "$password" -d "$database" -Q $sqlContent -x -h -1
    
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Database reset and seed completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host "  ✓ All data cleared (except SuperAdmin)"
        Write-Host "  ✓ 3 Test Schools created"
        Write-Host "  ✓ 4 Test Campuses created"
        Write-Host "  ✓ 8 Test Classes created"
        Write-Host "  ✓ 11 Test Sections created"
        Write-Host "  ✓ 12 Test Students created"
        Write-Host "  ✓ 12 Fee Vouchers and Ledger entries created"
        Write-Host "  ✓ 5 Sample Payments created"
        Write-Host "  ✓ 3 Test Users created"
        Write-Host ""
        Write-Host "Test User Credentials:" -ForegroundColor Cyan
        Write-Host "  SuperAdmin: admin@eduflow.com"
        Write-Host "  CampusAdmin: campusadmin@eduflow.com"
        Write-Host "  Principal: principal@eduflow.com"
        Write-Host "  Finance Admin: finance@eduflow.com"
        Write-Host ""
        Write-Host "Password for all accounts: Test123!" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "❌ Error executing SQL script (Exit code: $exitCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All done! You can now login to the application." -ForegroundColor Green
