@echo off
setlocal EnableDelayedExpansion

echo ================================================================
echo                    API ENDPOINT TESTING
echo ================================================================
echo.
echo Make sure your server is running first using:
echo npx cross-env NODE_ENV=development tsx server/index.ts
echo.
echo Server should be available at: http://localhost:5000
echo.

:menu
echo ================================================================
echo                        TEST MENU
echo ================================================================
echo.
echo 1. Test Server Health
echo 2. Get All Templates
echo 3. Get All Documents
echo 4. Test Database Connection
echo 5. Upload Template File
echo 6. Exit
echo.
set /p choice="Select option (1-6): "

if "%choice%"=="1" goto health
if "%choice%"=="2" goto templates
if "%choice%"=="3" goto documents
if "%choice%"=="4" goto database
if "%choice%"=="5" goto upload
if "%choice%"=="6" exit
echo Invalid choice
timeout /t 2 >nul
goto menu

:health
cls
echo Testing server health...
echo.
curl -i http://localhost:5000/api/health
echo.
echo.
pause
goto menu

:templates
cls
echo Getting all templates...
echo.
curl -s http://localhost:5000/api/templates | python -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))"
echo.
echo.
pause
goto menu

:documents
cls
echo Getting all documents...
echo.
curl -s http://localhost:5000/api/documents | python -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))"
echo.
echo.
pause
goto menu

:database
cls
echo Testing database connection...
echo.
curl -i http://localhost:5000/api/test-db
echo.
echo.
pause
goto menu

:upload
cls
echo Upload Template File
echo.
echo Place your template file in the current directory and enter the filename
echo Supported formats: .docx, .xlsx
echo.
set /p filename="Enter filename (e.g., template.docx): "
if not exist "%filename%" (
    echo File "%filename%" not found in current directory
    echo.
    pause
    goto menu
)
echo.
echo Uploading %filename%...
curl -i -X POST -F "file=@%filename%" http://localhost:5000/api/templates
echo.
echo.
pause
goto menu