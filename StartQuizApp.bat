@echo off
cd /d "%~dp0"
echo ==================================================
echo         Starting Quiz Platform Server
echo ==================================================
echo.

:: Check if node_modules exists, install if missing
IF NOT EXIST "node_modules\" (
    echo First time setup: Installing dependencies...
    call npm install
)

echo Starting the Next.js development server...
:: We will start the dev server in the same window so they can see logs,
:: but we will open the browser in parallel using a temporary vbscript or just a delayed command.

:: Use start to run a parallel ping/timeout command to open browser after 8 seconds
start /b cmd /c "timeout /t 8 /nobreak > nul && start http://localhost:3000/professor"

:: Start the server in the current window so it keeps it open
call npm run dev
