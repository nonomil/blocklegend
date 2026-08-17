@echo off
chcp 65001 >nul
set "ROOT=%~dp0..\..\.."
cd /d "%ROOT%"
start "blocklegend-review" /min python -m http.server 4198 --bind 127.0.0.1
if errorlevel 1 start "blocklegend-review" /min py -m http.server 4198 --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4198/prj/games/blocklegend/review-roster.html?v=20260816-bl-mobs3"
