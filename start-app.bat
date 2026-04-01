@echo off
setlocal

set "ROOT=%~dp0"
set "MONGO_SERVICE=MongoDB"

echo Starting Agricultural Supply Chain Traceability app...

if not exist "%ROOT%backend\package.json" (
  echo [ERROR] backend\package.json not found.
  goto :end
)

if not exist "%ROOT%frontend\package.json" (
  echo [ERROR] frontend\package.json not found.
  goto :end
)

if not exist "%ROOT%backend\.env" (
  echo [ERROR] backend\.env not found. Create it from backend\.env.example first.
  goto :end
)

if not exist "%ROOT%frontend\.env" (
  echo [ERROR] frontend\.env not found. Create it from frontend\.env.example first.
  goto :end
)

for /f %%S in ('powershell -NoProfile -Command "(Get-Service -Name %MONGO_SERVICE% -ErrorAction SilentlyContinue).Status"') do set "MONGO_STATUS=%%S"

if "%MONGO_STATUS%"=="" (
  echo [WARN] MongoDB Windows service not found. Install MongoDB Community Server.
  echo        The app will still start, but backend DB connection may fail.
) else (
  if /I not "%MONGO_STATUS%"=="Running" (
    echo Starting local MongoDB service...
    powershell -NoProfile -Command "Start-Service -Name %MONGO_SERVICE%" >nul 2>&1
    timeout /t 2 >nul
    for /f %%S in ('powershell -NoProfile -Command "(Get-Service -Name %MONGO_SERVICE%).Status"') do set "MONGO_STATUS=%%S"
  )

  if /I "%MONGO_STATUS%"=="Running" (
    echo MongoDB local service is running.
  ) else (
    echo [WARN] MongoDB service could not be started automatically.
    echo        Run terminal as Administrator and start service manually.
  )
)

start "Backend API" cmd /k "cd /d ""%ROOT%backend"" && npm run dev"
timeout /t 2 >nul
start "Frontend App" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"

echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Two terminals were opened for backend and frontend.

:end
endlocal
