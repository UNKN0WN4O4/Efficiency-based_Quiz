$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Start Quiz Server.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "c:\Users\dev\Music\Quiz\StartQuizApp.bat"
$Shortcut.WorkingDirectory = "c:\Users\dev\Music\Quiz"
$Shortcut.IconLocation = "shell32.dll, 13"
$Shortcut.Save()
