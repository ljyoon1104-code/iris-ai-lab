@echo off
chcp 65001 >nul
title Iris AI Lab Launcher
cd /d "%~dp0"

echo ========================================
echo  Iris AI Lab (Iris Machine Learning)
echo  Starting Development Server...
echo  Opening default browser automatically.
echo ========================================
echo.

if not exist "node_modules\" (
    echo [Notice] node_modules folder missing. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [Error] npm install failed. Please check Node.js installation.
        pause
        exit /b 1
    )
    echo [Done] Packages installed successfully.
    echo.
)

echo [Launch] Starting Vite dev server and launching browser at http://localhost:5173/ ...
echo [Notice] Close this window to stop the development server.
echo.

call npm run dev -- --host 0.0.0.0 --port 5173 --open
pause
