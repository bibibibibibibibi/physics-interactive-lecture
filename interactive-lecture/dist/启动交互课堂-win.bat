@echo off
setlocal
cd /d "%~dp0"
title Physics interactive classroom - local server
echo Starting the local classroom. Keep this window open while teaching.
echo A free loopback port in 8080-8090 will be selected by the server.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-win.ps1" %*
set "launcher_status=%errorlevel%"
if not "%launcher_status%"=="0" echo Local server failed. Read the error above before retrying.
exit /b %launcher_status%
