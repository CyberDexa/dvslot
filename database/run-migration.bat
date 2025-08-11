@echo off
REM Complete UK Test Centers Migration Script for Windows
REM Updates your Supabase database with all 350+ official DVSA test centers

echo.
echo 🚀 DVSlot - Complete UK Test Centers Migration
echo ==============================================
echo.

REM Check if we're in the correct directory
if not exist "database\migrate-complete-centers.js" (
    echo ❌ Error: Please run this script from the DVSlot root directory
    pause
    exit /b 1
)

REM Check for environment variables
if "%SUPABASE_URL%"=="" (
    echo ⚠️ Missing SUPABASE_URL environment variable!
    goto :show_help
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ⚠️ Missing SUPABASE_SERVICE_ROLE_KEY environment variable!
    goto :show_help
)

echo ✅ Supabase credentials found
echo 🔗 URL: %SUPABASE_URL%
echo 🔑 Service Key: %SUPABASE_SERVICE_ROLE_KEY:~0,10%...
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install @supabase/supabase-js
)

echo 🎯 Starting migration of 350+ UK test centers...
echo.

REM Run the migration
node database\migrate-complete-centers.js

if %errorlevel%==0 (
    echo.
    echo 🎉 MIGRATION COMPLETED SUCCESSFULLY!
    echo ==================================
    echo.
    echo ✅ Your database now contains ALL UK DVSA test centers
    echo 🔄 The scraper will work on the complete 350+ center dataset
    echo 📊 This means maximum coverage for finding driving test slots
    echo.
    echo 🚀 Ready to deploy your backend for 24/7 real DVSA scraping!
    echo.
    echo Next steps:
    echo 1. Deploy your backend using: deploy-railway.bat
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
    echo.
    echo Need help? Check the migration logs above for specific errors.
)

echo.
pause
exit /b 0

:show_help
echo.
echo Please set your environment variables:
echo.
echo set SUPABASE_URL=your-supabase-url
echo set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
echo.
echo You can find these in your Supabase dashboard:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to Settings ^> API
echo 4. Copy the URL and service_role key
echo.
echo Then run this script again.
echo.
pause
exit /b 1
