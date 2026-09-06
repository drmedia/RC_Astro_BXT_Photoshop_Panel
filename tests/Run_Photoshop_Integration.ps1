$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $PSScriptRoot
$testPath = Join-Path $PSScriptRoot 'Photoshop_Integration_Test.jsx'
$reportPath = Join-Path $PSScriptRoot 'Photoshop_Integration_Result.txt'
$scriptBody = Get-Content -LiteralPath $testPath -Raw -Encoding UTF8
$javascriptPath = $projectPath.Replace('\', '/')
$scriptCode = 'var BXT_TEST_PROJECT_PATH = "' + $javascriptPath + '";' + [Environment]::NewLine + $scriptBody
$wasRunning = @(Get-Process -Name Photoshop -ErrorAction SilentlyContinue).Count -gt 0
$photoshop = New-Object -ComObject Photoshop.Application

try {
    $photoshop.Visible = $true
    $null = $photoshop.DoJavaScript($scriptCode, $null, 1)
} finally {
    if (-not $wasRunning) {
        try { $photoshop.Quit() } catch { Write-Warning $_.Exception.Message }
    }
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($photoshop) | Out-Null
}

if (-not (Test-Path -LiteralPath $reportPath)) {
    throw 'Photoshop integration result was not created.'
}

$report = Get-Content -LiteralPath $reportPath -Raw -Encoding UTF8
Write-Output $report.TrimEnd()

if ($report -notmatch '(?m)^Result: PASS\r?$') {
    exit 1
}
