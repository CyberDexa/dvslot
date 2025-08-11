@echo off
REM DVSlot - Complete UK Test Centers Migration Setup for Windows
REM This script will help you set credentials and run the migration

echo.
echo 🚀 DVSlot - Complete UK Test Centers Migration
echo ==============================================
echo.

echo 📋 Please provide your Supabase credentials:
echo.

REM Get Supabase URL
set /p SUPABASE_URL="🔗 Enter your Supabase URL (from Settings > API): "
if "%SUPABASE_URL%"=="" (
    echo ❌ Error: Supabase URL is required
    pause
    exit /b 1
)

REM Get Supabase Service Role Key
set /p SUPABASE_SERVICE_ROLE_KEY="🔑 Enter your Supabase Service Role Key (from Settings > API): "
if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Error: Service Role Key is required
    pause
    exit /b 1
)

echo.
echo ✅ Credentials received!
echo 🔗 URL: %SUPABASE_URL%
echo 🔑 Service Key: %SUPABASE_SERVICE_ROLE_KEY:~0,10%...
echo.

echo 🎯 Starting migration of 350+ UK test centers...
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install @supabase/supabase-js
)

REM Run the migration
node database\migrate-complete-centers.js

if %errorlevel%==0 (
    echo.
    echo 🎉 MIGRATION COMPLETED SUCCESSFULLY!
    echo ==================================
    echo.
    echo ✅ Your database now contains ALL UK DVSA test centers ^(350+^)
    echo 🔄 The scraper will work on the complete UK dataset
    echo 📊 This means maximum coverage for finding driving test slots
    echo.
    echo 🚀 Ready to deploy your backend for 24/7 real DVSA scraping!
    echo.
    echo Next steps:
    echo 1. Deploy your backend using the deployment guide
    echo 2. Your mobile app will get live data from ALL UK test centers
    echo 3. Users will see real availability across the entire country
) else (
    echo.
    echo ❌ MIGRATION FAILED
    echo ==================
    echo.
    echo 🔧 Please check:
    echo 1. Your Supabase credentials are correct
    echo 2. Your internet connection is working
    echo 3. The test_centers table exists in your database
)

echo.
pause
