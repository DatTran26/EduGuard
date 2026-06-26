# Chạy AI service trong virtualenv (.venv)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    $py = "C:\Users\tinti\AppData\Local\Programs\Python\Python311\python.exe"
    if (-not (Test-Path $py)) {
        throw "Chưa có .venv. Cài Python 3.11+ rồi chạy: python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt"
    }
    & $py -m venv .venv
    .\.venv\Scripts\pip.exe install -r requirements.txt
}

.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8800 --reload
