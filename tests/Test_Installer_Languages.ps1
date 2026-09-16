$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $PSScriptRoot
$cases = @(
    @{ Script = 'Install_Windows.bat'; Language = 'ko' },
    @{ Script = 'Install_Windows.bat'; Language = 'en' },
    @{ Script = 'Uninstall_Windows.bat'; Language = 'ko' },
    @{ Script = 'Uninstall_Windows.bat'; Language = 'en' }
)

foreach ($case in $cases) {
    $scriptPath = Join-Path $projectPath $case.Script
    $output = & $scriptPath ('--lang=' + $case.Language) '--test-language' 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "$($case.Script) [$($case.Language)] exited with code $LASTEXITCODE.`n$output"
    }
    $expected = "[LANGUAGE-TEST] $($case.Language) PASS"
    if ($output -notmatch [regex]::Escape($expected)) {
        throw "$($case.Script) [$($case.Language)] did not emit the expected text.`n$output"
    }
    Write-Output "PASS | $($case.Script) | $($case.Language)"
}