@echo off
rem Demo ke BPS: aplikasi memakai data asli BPS (folder datasets\).
rem Bisa di-double-click. Biarkan jendela terbuka selama demo; Ctrl+C untuk berhenti.
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\demo.ps1" -Mode bps %*
if errorlevel 1 pause
