@echo off
setlocal
set "EXIT_CODE=0"

REM Vikash Portfolio - Quick Start Script
REM ====================================

pushd "%~dp0"
cd ..

set "VENV_DIR=.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
set "BACKEND_HOST=127.0.0.1"
set "BACKEND_PORT=8016"
set "FRONTEND_PORT=8080"

call :ensure_venv
if errorlevel 1 (
  set "EXIT_CODE=1"
  goto END
)

echo.
echo IMPORTANT: Before first run, ensure MySQL is running and run:
echo   %VENV_PY% scripts/setup_mysql.py
echo.
timeout /t 5 /nobreak >nul

:MENU
echo.
echo ============================================
echo   VIKASH PORTFOLIO - QUICK START
echo ============================================
echo.
echo   [1] Full Auto: deps + accel + backend + frontend + health
echo   [2] Start Backend + Frontend Server (quick)
echo   [3] Start Backend Only
echo   [4] Start Frontend Only
echo   [5] Install/Update Dependencies
echo   [6] Run Fastpath CLI (offline/online)
echo   [7] Build Native Accelerator (C++ optional)
echo   [8] Start Backend (Dev, auto-reload)
echo   [9] Initialize / Repair Database
echo   [10] Health Check (/system_status)
echo   [0] Exit
echo.
set /p choice="Select option (0-10): "

if "%choice%"=="1" goto FULL_AUTO
if "%choice%"=="2" goto START_ALL
if "%choice%"=="3" goto START_BACKEND
if "%choice%"=="4" goto START_FRONTEND
if "%choice%"=="5" goto INSTALL_DEPS
if "%choice%"=="6" goto RUN_CLI
if "%choice%"=="7" goto BUILD_ACCEL
if "%choice%"=="8" goto START_BACKEND_DEV
if "%choice%"=="9" goto INIT_DB
if "%choice%"=="10" goto HEALTH_CHECK
if "%choice%"=="0" goto EXIT

echo Invalid choice.
goto MENU

:FULL_AUTO
call :ensure_deps
call :ensure_accel
echo.
echo Starting Backend Server...
start "Backend Server" "%VENV_PY%" server.py --host %BACKEND_HOST% --port %BACKEND_PORT%
echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul
echo.
echo Checking backend readiness (max 24s)...
call :wait_for_backend
if errorlevel 1 (
  echo.
  echo Backend not responding. Check backend window for errors. Skipping frontend start.
  goto END
)
echo.
echo Starting Frontend Server...
start "Frontend Server" "%VENV_PY%" -m http.server %FRONTEND_PORT% -d public
echo.
echo Opening browser to http://localhost:%FRONTEND_PORT% ...
start "" "http://localhost:%FRONTEND_PORT%"
echo.
echo ============================================
echo   OK: Full stack is live
echo ============================================
echo   Backend:  http://%BACKEND_HOST%:%BACKEND_PORT%
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo ============================================
echo.
pause
goto END

:START_ALL
call :ensure_deps
echo.
echo Starting Backend Server...
start "Backend Server" "%VENV_PY%" server.py --host %BACKEND_HOST% --port %BACKEND_PORT%
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
start "Frontend Server" "%VENV_PY%" -m http.server %FRONTEND_PORT% -d public
echo.
echo ============================================
echo   OK: Both servers started
echo ============================================
echo.
echo   Backend:  http://%BACKEND_HOST%:%BACKEND_PORT%
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo   Open your browser to: http://localhost:%FRONTEND_PORT%
echo.
pause
goto END

:START_BACKEND
call :ensure_deps
echo.
echo Starting Backend Server...
start "Backend Server" "%VENV_PY%" server.py --host %BACKEND_HOST% --port %BACKEND_PORT%
echo.
echo Backend started at http://%BACKEND_HOST%:%BACKEND_PORT%
echo.
pause
goto END

:START_FRONTEND
echo.
echo Starting Frontend Server...
start "Frontend Server" "%VENV_PY%" -m http.server %FRONTEND_PORT% -d public
echo.
echo Frontend started at http://localhost:%FRONTEND_PORT%
echo.
pause
goto END

:INSTALL_DEPS
echo.
echo Installing Python dependencies into %VENV_DIR%...
"%VENV_PY%" -m pip install --upgrade pip
"%VENV_PY%" -m pip install -r requirements.txt
echo.
echo Dependencies installed!
pause
goto END

:RUN_CLI
call :ensure_deps
echo.
echo Launching terminal AI client (default backend: http://127.0.0.1:8016/api/ai/fastpath)
echo Use Ctrl+C to exit. Add --offline to skip backend calls.
echo.
"%VENV_PY%" cli/neural_cli.py
goto END

:BUILD_ACCEL
call :ensure_deps
echo.
echo Building optional native accelerator (requires g++ or clang++ on PATH)...
"%VENV_PY%" -m extensions.neural_ext.build
echo.
echo If build succeeded, a native library was placed in extensions\neural_ext\neural_boost.dll/.so
pause
goto END

:START_BACKEND_DEV
call :ensure_deps
set "DEV_PORT=%BACKEND_PORT%"
set /p DEV_PORT="Dev backend port [%BACKEND_PORT%]: "
if "%DEV_PORT%"=="" set "DEV_PORT=%BACKEND_PORT%"
echo.
echo Starting Backend Server (dev, auto-reload)...
start "Backend Dev (reload)" "%VENV_PY%" -m uvicorn server:app --host %BACKEND_HOST% --port %DEV_PORT% --reload --reload-exclude "logs/*" --reload-exclude "*.log" --reload-exclude "__pycache__/*" --reload-exclude ".venv/*" --reload-exclude "mysql_data_new/*" --reload-exclude "uploads/*"
echo.
echo Backend (dev) at http://%BACKEND_HOST%:%DEV_PORT%
echo.
pause
goto END

:INIT_DB
call :ensure_deps
echo.
echo Initializing / repairing MySQL schema...
"%VENV_PY%" scripts/setup_mysql.py
echo.
pause
goto END

:HEALTH_CHECK
call :ensure_deps
echo.
echo Hitting /system_status on http://%BACKEND_HOST%:%BACKEND_PORT% ...
call :health_ping
echo.
pause
goto END

:wait_for_backend
powershell -NoProfile -Command "for($i=0;$i -lt 12;$i++){try{$resp=Invoke-RestMethod -Uri 'http://%BACKEND_HOST%:%BACKEND_PORT%/system_status' -TimeoutSec 3;Write-Host 'Health OK' ($resp | ConvertTo-Json -Compress);exit 0}catch{Write-Host \"Attempt $($i+1)/12 failed: $_\";Start-Sleep -Seconds 2}}exit 1"
exit /b %ERRORLEVEL%

:health_ping
"%VENV_PY%" -c "import json,urllib.request;url='http://%BACKEND_HOST%:%BACKEND_PORT%/system_status';print('GET',url);req=urllib.request.Request(url,headers={'User-Agent':'Vikash-Health'});resp=urllib.request.urlopen(req,timeout=5);data=json.loads(resp.read().decode());print('Status:',data)" || echo Health check failed. Make sure backend and MySQL are up.
exit /b 0

:ensure_accel
"%VENV_PY%" -m extensions.neural_ext.build >nul 2>nul
exit /b 0

:ensure_venv
if exist "%VENV_PY%" goto :eof
echo.
echo Creating virtual environment in %VENV_DIR%...
python -m venv "%VENV_DIR%"
if errorlevel 1 (
  echo Failed to create venv. Make sure Python is installed and on PATH.
  exit /b 1
)
goto :eof

:ensure_deps
REM Fast check: if core deps import, assume venv is ready.
"%VENV_PY%" -c "import uvicorn, fastapi, pydantic" >nul 2>nul
if not errorlevel 1 goto :eof
echo.
echo Dependencies missing - installing...
"%VENV_PY%" -m pip install -r requirements.txt
goto :eof

:EXIT
set "EXIT_CODE=0"
goto END

:END
popd
endlocal & exit /b %EXIT_CODE%
