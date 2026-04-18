@echo off
REM Quick seed script for Windows

echo 🌱 CertiVerify Database Seeding
echo ================================
echo.

if "%1"=="--clear" (
    echo ⚠️  WARNING: This will DELETE all existing data!
    set /p confirm="Are you sure? (yes/no): "
    if /i "%confirm%"=="yes" (
        python seed_database.py --clear
    ) else (
        echo ❌ Seeding cancelled
    )
) else (
    python seed_database.py
)

pause
