Write-Host "=================================================="
Write-Host "         Quiz Platform Setup"
Write-Host "=================================================="
Write-Host ""

$installDir = "C:\QuizPlatform"

# 1. Check for Node.js
try {
    $nodeVersion = node -v
    Write-Host "Node.js is installed ($nodeVersion)"
} catch {
    Write-Host "Node.js is not installed. Installing via winget..."
    winget install OpenJS.NodeJS -e --silent --accept-package-agreements --accept-source-agreements
    
    # Refresh PATH in current process (Winget updates registry machine PATH, let's load it)
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "Installing files to $installDir..."
If (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

$sourceDir = $PSScriptRoot
# If compiled with PS2EXE, $PSScriptRoot might behave slightly differently, it will be the exe path.
if ([string]::IsNullOrEmpty($sourceDir)) {
    $sourceDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}

# Copy files excluding .git, node_modules, .next
robocopy $sourceDir $installDir /E /XD ".git" "node_modules" ".next" "src" /XF "*.exe" "Installer.ps1" "*tsc*.log" /NJH /NJS /NDL /NC /NS

Write-Host "Installing NPM dependencies... (this may take a few minutes)"
Set-Location $installDir
npm install

Write-Host "Creating shortcuts..."
$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopPath "Start Quiz Server.lnk"))
$Shortcut.TargetPath = (Join-Path $installDir "StartQuizApp.bat")
$Shortcut.WorkingDirectory = $installDir
$Shortcut.WindowStyle = 1
$Shortcut.IconLocation = "shell32.dll, 13"
$Shortcut.Save()

$StartMenu = [Environment]::GetFolderPath("CommonStartMenu")
$Shortcut2 = $WshShell.CreateShortcut((Join-Path $StartMenu "Programs\Start Quiz Server.lnk"))
$Shortcut2.TargetPath = (Join-Path $installDir "StartQuizApp.bat")
$Shortcut2.WorkingDirectory = $installDir
$Shortcut2.WindowStyle = 1
$Shortcut2.IconLocation = "shell32.dll, 13"
$Shortcut2.Save()

Write-Host ""
Write-Host "=================================================="
Write-Host "               SETUP COMPLETE!"
Write-Host "=================================================="
Write-Host "You can now double-click the 'Start Quiz Server' icon on your Desktop."
Start-Sleep -Seconds 5
