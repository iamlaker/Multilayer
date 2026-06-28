@echo off
REM 启动开发服务器（使用项目自带的 Node）
set "PATH=%~dp0.node;%PATH%"
cd /d "%~dp0"
npm run dev
