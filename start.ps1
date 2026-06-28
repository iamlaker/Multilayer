# 启动开发服务器（使用项目自带的 Node）
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PATH = "$scriptDir\.node;$env:PATH"
Set-Location $scriptDir
npm run dev
