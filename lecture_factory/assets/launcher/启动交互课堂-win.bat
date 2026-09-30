@echo off
cd /d %~dp0
title 大学物理交互课堂 · 本地服务

echo ============================================
echo   大学物理交互课堂 · 本地启动器
echo   关闭本窗口即停止服务
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 goto :python
where py >nul 2>nul
if %errorlevel%==0 goto :py
goto :powershell

:python
echo 使用 Python 启动：http://localhost:8080/
start "" http://localhost:8080/
python -m http.server 8080
goto :end

:py
echo 使用 Python 启动：http://localhost:8080/
start "" http://localhost:8080/
py -m http.server 8080
goto :end

:powershell
echo 未检测到 Python，改用 Windows 自带 PowerShell 启动……
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-win.ps1"

:end
