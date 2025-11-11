@echo off
REM =====================================================
REM Database Backup Script - CatatJasamu (Windows)
REM =====================================================

SET DB_NAME=catat_jasamu_db
SET DB_USER=postgres
SET BACKUP_DIR=database_backups
SET DATE=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET DATE=%DATE: =0%

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo 🔄 Starting database backup...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM 1. Complete backup
echo 📦 Backing up complete database...
pg_dump -U %DB_USER% -d %DB_NAME% -F p -f "%BACKUP_DIR%/full_backup_%DATE%.sql"

if %errorlevel% equ 0 (
    echo ✅ Complete backup saved
) else (
    echo ❌ Error creating backup
    pause
    exit /b 1
)

REM 2. Data only
echo.
echo 📊 Backing up data only...
pg_dump -U %DB_USER% -d %DB_NAME% --data-only --inserts -f "%BACKUP_DIR%/data_only_%DATE%.sql"

REM 3. Schema only
echo.
echo 🏗️  Backing up schema only...
pg_dump -U %DB_USER% -d %DB_NAME% --schema-only -f "%BACKUP_DIR%/schema_only_%DATE%.sql"

REM 4. Compressed backup
echo.
echo 🗜️  Creating compressed backup...
pg_dump -U %DB_USER% -d %DB_NAME% -F c -f "%BACKUP_DIR%/compressed_backup_%DATE%.backup"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Backup completed!
echo.
echo 📁 Backup location: %BACKUP_DIR%
echo.
echo To restore: psql -U postgres -d catat_jasamu_db -f %BACKUP_DIR%/full_backup_%DATE%.sql
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pause
