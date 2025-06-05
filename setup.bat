@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
cls

:menu
echo ================================================================
echo       Document Template Processor - Terminal Launcher
echo ================================================================
echo.
echo 1. Complete Setup and Install (For First Time Users)
echo 2. Start Application (All-in-One)
echo 3. Start Server Only
echo 4. Start Client Only
echo 5. Start Both Separately
echo 6. CLI Document Processor
echo 7. Test API Endpoints
echo 8. Exit
echo.
set /p choice="Select option (1-8): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto combined
if "%choice%"=="3" goto server
if "%choice%"=="4" goto client
if "%choice%"=="5" goto both
if "%choice%"=="6" goto cli_processor
if "%choice%"=="7" goto test_api
if "%choice%"=="8" exit
echo Invalid choice. Try again.
timeout /t 1 >nul
goto menu

:setup
cls
echo ================================================================
echo                   COMPLETE SETUP PROCESS
echo ================================================================

:: Step 1: Check Node.js
echo.
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install it from https://nodejs.org
    goto end
)
for /f "delims=" %%v in ('node --version') do set NODE_VERSION=%%v
echo [OK] Node.js Version: %NODE_VERSION%
timeout /t 1 >nul

:: Step 2: Check npm
echo.
echo [2/5] Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found. It should come with Node.js.
    goto end
)
for /f "delims=" %%v in ('npm --version') do set NPM_VERSION=%%v
echo [OK] npm Version: %NPM_VERSION%
timeout /t 1 >nul

:: Step 3: Check tsx
echo.
echo [3/5] Checking tsx...
call npx tsx --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] tsx not found. Installing...
    call npm install tsx --save-dev
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install tsx.
        goto end
    )
    echo [OK] tsx installed successfully.
) else (
    echo [OK] tsx is available.
)
timeout /t 1 >nul

:: Step 4: Install dependencies
echo.
echo [4/5] Installing dependencies...
if exist node_modules (
    echo [OK] Dependencies already installed.
) else (
    echo Installing packages...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        goto end
    )
    echo [OK] Dependencies installed.
)
timeout /t 1 >nul

:: Step 5: Setup environment
echo.
echo [5/5] Checking .env file...
if not exist .env (
    if exist .env.example (
        copy /Y .env.example .env >nul
        echo [OK] Created .env from .env.example
    ) else (
        echo Creating default .env...
        (
            echo DATABASE_URL=postgresql://username:password@host:port/database
            echo VITE_SUPABASE_URL=https://your-project-id.supabase.co
            echo VITE_SUPABASE_ANON_KEY=your-anon-key
            echo SUPABASE_SERVICE_ROLE_KEY=your-service-key
            echo NODE_ENV=development
            echo PORT=5000
        ) > .env
        echo [OK] Default .env created.
    )
) else (
    echo [OK] .env already exists.
)
echo.
echo ================================================================
echo [OK] SETUP COMPLETED SUCCESSFULLY!
echo ================================================================
echo Please edit the .env file with your real credentials.
pause
goto menu

:combined
cls
echo Starting Full Application...
call npx cross-env NODE_ENV=development tsx server/index.ts
pause
goto menu

:server
cls
echo Starting Server Only...
call npx cross-env NODE_ENV=development tsx server/server-only.ts
pause
goto menu

:client
cls
echo Starting Client Only...
call npx vite --config vite.config.separate.ts
pause
goto menu

:both
cls
echo Starting Server and Client Separately...
call npx concurrently "npx cross-env NODE_ENV=development tsx server/server-only.ts" "npx vite --config vite.config.separate.ts"
pause
goto menu

:cli_processor
cls
echo ================================================================
echo              CLI DOCUMENT PROCESSOR COMMANDS
echo ================================================================
echo.
echo Examples:
echo   process-file ^<file-path^> [pdf]
echo   upload-template ^<file-path^>
echo   generate-document ^<id^> [pdf]
echo   list-templates
echo   list-documents
echo   help
echo   exit
echo.
call npx cross-env NODE_ENV=development tsx server/cli.ts
pause
goto menu

:test_api
cls
echo ================================================================
echo              TEST API ENDPOINTS (Manual)
echo ================================================================
echo Ensure the server is running on http://localhost:5000
echo.
echo Commands:
echo   curl http://localhost:5000/api/templates
echo   curl http://localhost:5000/api/documents
echo   curl -X POST -F "file=@template.docx" http://localhost:5000/api/templates
echo   curl -X POST -H "Content-Type: application/json" ^
echo        -d "{\"templateId\":1,\"data\":{\"name\":\"John\"}}" ^
echo        http://localhost:5000/api/documents/generate
pause
goto menu

:end
echo.
echo Exiting...
exit /b
