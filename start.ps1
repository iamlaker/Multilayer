# 启动开发服务器（使用项目自带的 Node）
$scriptDir = $PSScriptRoot
$env:PATH = "$scriptDir\.node;$env:PATH"
Set-Location $scriptDir
npm.cmd run dev
