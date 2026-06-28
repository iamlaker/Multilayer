@echo off
REM 构建生产版本（使用项目自带的 Node）
set "PATH=%~dp0.node;%PATH%"
cd /d "%~dp0"
npm run build
