# Run proctoring AI service in .venv (ASCII-only for PowerShell 5.x)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$venvActivate = ".\.venv\Scripts\Activate.ps1"
$venvPython = ".\.venv\Scripts\python.exe"
$venvPip = ".\.venv\Scripts\pip.exe"

if (-not (Test-Path $venvActivate)) {
    $py = $null
    foreach ($candidate in @(
        "C:\Users\tinti\AppData\Local\Programs\Python\Python311\python.exe",
        "C:\Users\tinti\AppData\Local\Programs\Python\Python312\python.exe"
    )) {
        if (Test-Path $candidate) {
            $py = $candidate
            break
        }
    }

    if (-not $py) {
        $pyCmd = Get-Command python -ErrorAction SilentlyContinue
        if ($pyCmd) { $py = $pyCmd.Source }
    }

    if (-not $py) {
        throw "Missing .venv. Install Python 3.11+, then run: python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt"
    }

    & $py -m venv .venv
    & $venvPip install -r requirements.txt
}

& $venvPython -m uvicorn main:app --host 127.0.0.1 --port 8800 --reload
