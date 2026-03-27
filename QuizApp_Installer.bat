@echo off
:: Self-elevating script to run as Administrator
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ==================================================
echo         Quiz Platform Installer
echo ==================================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. We will install it now using winget...
    winget install OpenJS.NodeJS -e --accept-package-agreements --accept-source-agreements
    echo.
    echo Node.js installed. We need to refresh environment variables.
    :: Small trick: restarting the batch or assuming it's in PATH now.
    :: Actually, winget might not update current cmd PATH immediately.
    :: We'll use absolute path if necessary or just tell them to reboot.
    set PATH=%PATH%;"C:\Program Files\nodejs"
) ELSE (
    echo Node.js is already installed.
)

:: 2. Set up the target directory
set INSTALL_DIR=C:\QuizPlatform
echo Installing Quiz Platform to %INSTALL_DIR%...

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Recursively copy everything from current folder EXCEPT node_modules and .git
:: We use xcopy with exclude
echo node_modules\> exclude.txt
echo .git\>> exclude.txt
echo .next\>> exclude.txt

echo Copying files. This might take a moment...
xcopy /E /I /H /Y /EXCLUDE:exclude.txt "%~dp0\*" "%INSTALL_DIR%" >nul
del exclude.txt

:: 3. Install NPM packages in the installation directory
echo.
echo Installing dependencies (this will take a minute or two)...
cd /d "%INSTALL_DIR%"
call npm install

:: 4. Create a nice Start menu and Desktop shortcut
echo.
echo Creating shortcuts...
set PS_SCRIPT="%TEMP%\CreateShortcut.ps1"
echo $WshShell = New-Object -comObject WScript.Shell > %PS_SCRIPT%
echo $DesktopPath = [Environment]::GetFolderPath("Desktop") >> %PS_SCRIPT%
echo $Shortcut = $WshShell.CreateShortcut(Join-Path $DesktopPath "Start Quiz Server.lnk") >> %PS_SCRIPT%
echo $Shortcut.TargetPath = "%INSTALL_DIR%\StartQuizApp.bat" >> %PS_SCRIPT%
echo $Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> %PS_SCRIPT%
echo $Shortcut.WindowStyle = 1 >> %PS_SCRIPT%
echo $Shortcut.IconLocation = "shell32.dll, 13" >> %PS_SCRIPT%
echo $Shortcut.Save() >> %PS_SCRIPT%

powershell -ExecutionPolicy Bypass -File %PS_SCRIPT%
del %PS_SCRIPT%

:: Start menu shortcut
set PS_SCRIPT2="%TEMP%\CreateStartMenu.ps1"
echo $WshShell = New-Object -comObject WScript.Shell > %PS_SCRIPT2%
echo $StartMenu = [Environment]::GetFolderPath("CommonStartMenu") >> %PS_SCRIPT2%
echo $Shortcut = $WshShell.CreateShortcut(Join-Path $StartMenu "Programs\Start Quiz Server.lnk") >> %PS_SCRIPT2%
echo $Shortcut.TargetPath = "%INSTALL_DIR%\StartQuizApp.bat" >> %PS_SCRIPT2%
echo $Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> %PS_SCRIPT2%
echo $Shortcut.WindowStyle = 1 >> %PS_SCRIPT2%
echo $Shortcut.IconLocation = "shell32.dll, 13" >> %PS_SCRIPT2%
echo $Shortcut.Save() >> %PS_SCRIPT2%

powershell -ExecutionPolicy Bypass -File %PS_SCRIPT2%
del %PS_SCRIPT2%

echo.
echo ==================================================
echo                  INSTALLATION COMPLETE!
echo ==================================================
echo.
echo You can now start the application by double-clicking 
echo the "Start Quiz Server" icon on your Desktop.
echo.
pause
