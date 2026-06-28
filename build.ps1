# 构建生产版本（使用项目自带的 Node）
$scriptDir = $PSScriptRoot
$env:PATH = "$scriptDir\.node;$env:PATH"
Set-Location $scriptDir
npm run build
