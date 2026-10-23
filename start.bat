@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

title Vikash Portfolio - Startup Controller

set "SERVER_HOST=127.0.0.1"
set "SERVER_PORT=8000"
set "SERVER_URL=http://%SERVER_HOST%:%SERVER_PORT%"
set "FRONTEND_PORT=8080"
set "FRONTEND_URL=http://%SERVER_HOST%:%FRONTEND_PORT%/index.html"
set "VENV_DIR=.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
set "AUTO_OPEN=1"
set "DEV_MODE=0"
set "NO_MENU=0"
set "STANDALONE=0"

:parse_args
if "%~1"=="" goto done_parsing
if /i "%~1"=="--no-browser" set "AUTO_OPEN=0" & shift & goto parse_args
if /i "%~1"=="--dev" set "DEV_MODE=1" & set "NO_MENU=1" & shift & goto parse_args
if /i "%~1"=="--quick" set "NO_MENU=1" & shift & goto parse_args
if /i "%~1"=="--standalone" set "STANDALONE=1" & set "NO_MENU=1" & shift & goto parse_args
if /i "%~1"=="--help" goto show_help
shift
goto parse_args
:done_parsing

call :ensure_python || exit /b 1
call :ensure_venv || exit /b 1

if "%NO_MENU%"=="1" (
    if "%STANDALONE%"=="1" goto start_standalone
    goto start_server
)

:menu
cls
echo ================================================
echo VIKASH PORTFOLIO STARTUP
echo ================================================
echo [1] Launch Full Stack Server
echo [2] Server Only
echo [3] Development Mode
echo [4] Standalone Frontend
echo [5] System Health Check
echo [6] Install or Update Dependencies
echo [7] Database Check
echo [8] Backup Runtime Data
echo [0] Exit
echo.
set /p choice="Select option [0-8]: "

if "%choice%"=="1" set "AUTO_OPEN=1" & goto start_server
if "%choice%"=="2" set "AUTO_OPEN=0" & goto start_server
if "%choice%"=="3" set "DEV_MODE=1" & goto start_server
if "%choice%"=="4" goto start_standalone
if "%choice%"=="5" goto health_check
if "%choice%"=="6" goto install_deps
if "%choice%"=="7" goto db_setup
if "%choice%"=="8" goto backup_restore
if "%choice%"=="0" goto exit

echo Invalid option.
timeout /t 2 >nul
goto menu

:start_server
cls
echo ================================================
echo STARTING PORTFOLIO SERVER
echo ================================================
echo URL: %SERVER_URL%
echo.
if "%AUTO_OPEN%"=="1" (
    start "" "%SERVER_URL%"
)
if "%DEV_MODE%"=="1" (
    "%VENV_PY%" server.py --host %SERVER_HOST% --port %SERVER_PORT% --reload
) else (
    "%VENV_PY%" server.py --host %SERVER_HOST% --port %SERVER_PORT%
)
goto exit

:start_standalone
cls
echo ================================================
echo STARTING STANDALONE FRONTEND
echo ================================================
echo URL: %FRONTEND_URL%
echo.
if "%AUTO_OPEN%"=="1" (
    start "" "%FRONTEND_URL%"
)
"%VENV_PY%" -m http.server %FRONTEND_PORT% --bind %SERVER_HOST% --directory public
goto exit

:health_check
cls
echo ================================================
echo SYSTEM HEALTH CHECK
echo ================================================
echo.
echo Checking dependencies...
"%VENV_PY%" -c "import fastapi, uvicorn, pydantic" 2>nul && echo   Core: OK || echo   Core: MISSING
"%VENV_PY%" -c "import mysql.connector" 2>nul && echo   MySQL driver: OK || echo   MySQL driver: MISSING
"%VENV_PY%" -c "import redis" 2>nul && echo   Redis client: OK || echo   Redis client: OPTIONAL
"%VENV_PY%" -c "import PIL, slowapi" 2>nul && echo   Optional extras: OK || echo   Optional extras: PARTIAL

echo.
echo Checking local API...
"%VENV_PY%" -c "import urllib.request,sys; url='%SERVER_URL%/health/';\
try:\
  resp=urllib.request.urlopen(url, timeout=5); print('  API: ONLINE'); print('  Status:', resp.status)\
except Exception as exc:\
  print('  API: OFFLINE'); print('  Detail:', exc); sys.exit(1)" 2>nul
if errorlevel 1 echo   Start the server first with option [1].

echo.
pause
goto menu

:install_deps
cls
echo ================================================
echo INSTALLING DEPENDENCIES
echo ================================================
echo.
"%VENV_PY%" -m pip install --upgrade pip
"%VENV_PY%" -m pip install -r requirements.txt
pause
goto menu

:db_setup
cls
echo ================================================
echo DATABASE CHECK
echo ================================================
echo.
"%VENV_PY%" -c "from app.database import DatabaseManager; db=DatabaseManager(); print('  Database: CONNECTED' if db.check_connection() else '  Database: DISCONNECTED')"
"%VENV_PY%" -c "from app.database import DatabaseManager; db=DatabaseManager(); diag=db.get_connection_diagnostics(); print('  Detail:', diag.get('error', 'OK'))"
pause
goto menu

:backup_restore
cls
echo ================================================
echo BACKUP RUNTIME DATA
echo ================================================
echo.
set "BACKUP_DIR=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP_DIR=!BACKUP_DIR: =0!"
mkdir "!BACKUP_DIR!" 2>nul
if exist data\admin_runtime_settings.json copy data\admin_runtime_settings.json "!BACKUP_DIR!\" >nul
if exist .env copy .env "!BACKUP_DIR!\" >nul
echo Backup saved to !BACKUP_DIR!
pause
goto menu

:ensure_python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3 is required.
    exit /b 1
)
exit /b 0

:ensure_venv
if not exist "%VENV_PY%" (
    echo Creating virtual environment...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 exit /b 1
)
call "%VENV_DIR%\Scripts\activate.bat" >nul
"%VENV_PY%" -c "import fastapi, uvicorn, pydantic" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    "%VENV_PY%" -m pip install -r requirements.txt
    if errorlevel 1 exit /b 1
)
exit /b 0

:show_help
echo Usage: start.bat [options]
echo.
echo Options:
echo   --no-browser    Do not open browser automatically
echo   --dev           Development mode with auto-reload
echo   --quick         Skip menu and start server immediately
echo   --standalone    Serve public/ only on port %FRONTEND_PORT%
echo   --help          Show this help
echo.
exit /b 0

:exit
echo.
echo Shutdown complete.
endlocal & exit /b 0
