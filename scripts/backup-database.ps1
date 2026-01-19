# PowerShell Backup Script for Windows
# Creates timestamped backups of the PostgreSQL database

param(
    [string]$DbName = "school_mgmt",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres123",
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

# Create backup directory
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_${DbName}_${Timestamp}.sql"
$CompressedFile = "${BackupFile}.gz"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "PostgreSQL Backup Script" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Database: $DbName"
Write-Host "Host: ${DbHost}:${DbPort}"
Write-Host "Backup file: $CompressedFile"
Write-Host "========================================" -ForegroundColor Yellow

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DbPassword

try {
    # Check PostgreSQL connection
    Write-Host "`n[1/4] Checking database connection..." -ForegroundColor Yellow
    $null = docker exec school_mgmt_db pg_isready -h localhost -p 5432 -U $DbUser 2>&1
    Write-Host "✓ Database is accessible" -ForegroundColor Green

    # Create backup using Docker
    Write-Host "`n[2/4] Creating backup..." -ForegroundColor Yellow
    docker exec school_mgmt_db pg_dump `
        -U $DbUser `
        -d $DbName `
        --format=plain `
        --clean `
        --if-exists `
        --no-owner `
        --no-privileges `
        > $BackupFile
    
    if (Test-Path $BackupFile) {
        $Size = (Get-Item $BackupFile).Length
        Write-Host "✓ Backup created successfully (Size: $Size bytes)" -ForegroundColor Green
    } else {
        throw "Backup file was not created"
    }

    # Compress backup (using 7zip if available, otherwise skip)
    Write-Host "`n[3/4] Compressing backup..." -ForegroundColor Yellow
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        7z a -tgzip "$CompressedFile" "$BackupFile" | Out-Null
        Remove-Item $BackupFile
        Write-Host "✓ Backup compressed" -ForegroundColor Green
    } else {
        Write-Host "⚠ 7zip not found, backup not compressed" -ForegroundColor Yellow
        $CompressedFile = $BackupFile
    }

    # Clean up old backups
    Write-Host "`n[4/4] Cleaning up old backups (keeping last $RetentionDays days)..." -ForegroundColor Yellow
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql*" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
    
    $DeletedCount = 0
    foreach ($file in $OldBackups) {
        Remove-Item $file.FullName
        $DeletedCount++
    }
    
    if ($DeletedCount -gt 0) {
        Write-Host "✓ Deleted $DeletedCount old backup(s)" -ForegroundColor Green
    } else {
        Write-Host "✓ No old backups to delete" -ForegroundColor Green
    }

    # Summary
    $TotalBackups = (Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql*").Count
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Backup file: $CompressedFile"
    Write-Host "Total backups: $TotalBackups"
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host "`n✗ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
