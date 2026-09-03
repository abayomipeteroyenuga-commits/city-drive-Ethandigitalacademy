@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/"
set "READY=%~dp0server-ready.txt"

title CITY DRIVE - Offline
cls
echo.
echo  =============================================
echo          CITY DRIVE - OFFLINE MODE
echo  =============================================
echo.
echo  Starting CITY DRIVE...
echo.

rem Use Windows PowerShell first. This works on standard Windows installations.
where powershell.exe >nul 2>&1
if errorlevel 1 goto FALLBACK

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $null } | Out-Null"
start "CITY DRIVE SERVER" /min powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
goto WAIT

:FALLBACK
where py >nul 2>&1
if not errorlevel 1 (
  start "CITY DRIVE SERVER" /min cmd /c "py server.py"
  goto WAIT
)
where python >nul 2>&1
if not errorlevel 1 (
  start "CITY DRIVE SERVER" /min cmd /c "python server.py"
  goto WAIT
)
where node >nul 2>&1
if not errorlevel 1 (
  start "CITY DRIVE SERVER" /min cmd /c "node server.js"
  goto WAIT
)

echo  ERROR: Windows could not start the local server.
echo.
echo  Please make sure you extracted the entire ZIP first.
pause
exit /b 1

:WAIT
set /a tries=0
:CHECK
set /a tries+=1
if exist "%READY%" goto READYPATH
if exist "%~dp0server-error.txt" goto SERVERERROR
if %tries% GEQ 30 goto FAIL
timeout /t 1 /nobreak >nul
goto CHECK

:READYPATH
for /f "usebackq tokens=2" %%A in ("%READY%") do set "URL=%%A"
powershell.exe -NoLogo -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto CHECK

:OPEN
start "" "%URL%"
echo  CITY DRIVE is running.
echo  The game has opened in your browser.
echo.
echo  You can play without internet.
echo  Keep this window open while playing.
echo.
:KEEPALIVE
timeout /t 3600 /nobreak >nul
goto KEEPALIVE

:SERVERERROR
echo.
echo  ERROR: Windows could not start CITY DRIVE's local server.
echo.
echo  Details:
type "%~dp0server-error.txt"
echo.
echo  The launcher automatically tries ports 8765 through 8795.
pause
exit /b 1

:FAIL
echo.
echo  ERROR: CITY DRIVE's local server did not start.
echo  The browser was NOT opened because the server is unavailable.
echo.
echo  Try extracting the ZIP again to a normal folder such as Desktop.
echo.
pause
exit /b 1
