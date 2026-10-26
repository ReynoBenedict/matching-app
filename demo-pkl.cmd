@echo off
rem Presentasi PKL: aplikasi memakai data sintetis (tests\fixtures\).
rem Bisa di-double-click. Biarkan jendela terbuka selama demo; Ctrl+C untuk berhenti.
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\demo.ps1" -Mode pkl %*
if errorlevel 1 pause
