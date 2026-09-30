# PowerShell Script for Database Backup and Restore

$ContainerName = "erp-postgres"
$DbUser = "postgres"
$BackupDir = ".\backups"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$Databases = @("erp_auth", "erp_academic", "erp_finance", "erp_hr")

function Backup-Databases {
    Write-Host "=== Starting PostgreSQL Databases Backup ===" -ForegroundColor Green
    foreach ($db in $Databases) {
        Write-Host "Backing up database: $db..." -ForegroundColor Cyan
        $BackupFile = "$BackupDir\${db}_backup.sql"
        
        # Run docker exec and redirect output. 
        # Note: -t must be omitted in cmd redirecting script to avoid carriage return issues.
        docker exec -i $ContainerName pg_dump -U $DbUser -d $db --clean > $BackupFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Success: Saved to $BackupFile" -ForegroundColor Green
        } else {
            Write-Host "Error: Backup failed for $db" -ForegroundColor Red
        }
    }
    Write-Host "=== Backup Process Completed ===" -ForegroundColor Green
}

function Restore-Databases {
    Write-Host "=== Starting PostgreSQL Databases Restore ===" -ForegroundColor Green
    foreach ($db in $Databases) {
        $BackupFile = "$BackupDir\${db}_backup.sql"
        if (Test-Path $BackupFile) {
            Write-Host "Restoring database: $db from $BackupFile..." -ForegroundColor Cyan
            
            # Input redirection in PowerShell: Get-Content pipe
            Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $db
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Success: Restored $db" -ForegroundColor Green
            } else {
                Write-Host "Error: Restore failed for $db" -ForegroundColor Red
            }
        } else {
            Write-Host "Warning: Backup file not found at $BackupFile, skipping restore for $db" -ForegroundColor Yellow
        }
    }
    Write-Host "=== Restore Process Completed ===" -ForegroundColor Green
}

# Main Script logic
if ($args.Count -eq 0) {
    Write-Host "Usage: .\backup_restore.ps1 [backup|restore]" -ForegroundColor Yellow
    Exit
}

$Action = $args[0].ToLower()

if ($Action -eq "backup") {
    Backup-Databases
} elseif ($Action -eq "restore") {
    Restore-Databases
} else {
    Write-Host "Invalid action. Use 'backup' or 'restore'." -ForegroundColor Red
}
