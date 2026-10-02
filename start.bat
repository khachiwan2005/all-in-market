@echo off
cd /d %~dp0
start http://localhost:8080/Main.dc.html
where php >nul 2>nul && (php -S localhost:8080) || (python -m http.server 8080)
