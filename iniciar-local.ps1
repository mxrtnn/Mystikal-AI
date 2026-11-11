param([ValidateSet('backend','frontend')][string]$Servicio = 'backend')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if ($Servicio -eq 'backend') {
    & .\backend\.venv-local\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
} else {
    Set-Location frontend
    & ..\.tools\node-v22.16.0-win-x64\node.exe node_modules\vite\bin\vite.js --host 127.0.0.1
}
