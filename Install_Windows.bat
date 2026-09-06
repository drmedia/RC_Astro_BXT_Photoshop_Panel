@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

echo ============================================================
echo RC-Astro BlurXTerminator Photoshop Panel - Installer
echo ============================================================
echo.

set "SRC=%~dp0RC-Astro-BXT-Panel"
set "CEP_ROOT=%APPDATA%\Adobe\CEP\extensions"
set "DST=%CEP_ROOT%\RC-Astro-BXT-Panel"
set "REGEXE=%SystemRoot%\System32\reg.exe"
set "XCOPYEXE=%SystemRoot%\System32\xcopy.exe"
set "FCEXE=%SystemRoot%\System32\fc.exe"
set "FINDSTREXE=%SystemRoot%\System32\findstr.exe"

if not defined APPDATA (
    echo [ERROR] APPDATA 환경 변수를 찾을 수 없습니다.
    goto :fail
)

if not exist "%SRC%\CSXS\manifest.xml" (
    echo [ERROR] 확장 소스 폴더를 찾을 수 없습니다:
    echo         %SRC%
    goto :fail
)

if not exist "%REGEXE%" (
    echo [ERROR] reg.exe를 찾을 수 없습니다:
    echo         %REGEXE%
    goto :fail
)

if not exist "%XCOPYEXE%" (
    echo [ERROR] xcopy.exe를 찾을 수 없습니다:
    echo         %XCOPYEXE%
    goto :fail
)

if not exist "%FCEXE%" (
    echo [ERROR] fc.exe를 찾을 수 없습니다:
    echo         %FCEXE%
    goto :fail
)

if not exist "%FINDSTREXE%" (
    echo [ERROR] findstr.exe를 찾을 수 없습니다:
    echo         %FINDSTREXE%
    goto :fail
)

tasklist /FI "IMAGENAME eq Photoshop.exe" 2>nul | find /I "Photoshop.exe" >nul
if not errorlevel 1 (
    echo [ERROR] Photoshop이 실행 중입니다.
    echo         Photoshop을 완전히 종료한 뒤 다시 실행하세요.
    goto :fail
)

echo [1/4] CEP 패널 설치 폴더 확인 중...
if not exist "%CEP_ROOT%" mkdir "%CEP_ROOT%" >nul 2>&1
if not exist "%CEP_ROOT%" (
    echo [ERROR] CEP 패널 설치 폴더를 만들지 못했습니다:
    echo         %CEP_ROOT%
    goto :fail
)

echo [2/4] 기존 패널 제거 중...
if exist "%DST%" rmdir /S /Q "%DST%" 2>nul
if exist "%DST%" (
    echo [ERROR] 기존 설치 폴더를 제거하지 못했습니다:
    echo         %DST%
    echo         파일을 사용 중인 Adobe 프로세스가 없는지 확인하세요.
    goto :fail
)

echo [3/4] 새 패널 복사 중...
mkdir "%DST%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 설치 폴더를 만들지 못했습니다:
    echo         %DST%
    goto :fail
)

"%XCOPYEXE%" "%SRC%\*" "%DST%\" /E /I /H /K /Y >nul
if errorlevel 1 (
    echo [ERROR] 패널 파일 복사에 실패했습니다. xcopy exit code: %ERRORLEVEL%
    goto :fail
)

set "COPY_FAILED="
for %%F in ("CSXS\manifest.xml" "client\index.html" "client\style.css" "client\main.js" "host\host.jsx") do (
    call :verify_file "%%~F"
    if errorlevel 1 set "COPY_FAILED=1"
)
if defined COPY_FAILED (
    echo [ERROR] 설치 파일 검증에 실패했습니다.
    goto :fail
)

echo [4/4] 서명되지 않은 CEP 확장 허용 중...
set "REG_FAILED="
for %%V in (9 10 11 12 13 14 15) do (
    call :enable_and_verify_debug %%V
    if errorlevel 1 set "REG_FAILED=1"
)
if defined REG_FAILED (
    echo [ERROR] 하나 이상의 CEP PlayerDebugMode 설정 또는 검증에 실패했습니다.
    echo         위에 표시된 CSXS 버전과 레지스트리 권한을 확인하세요.
    goto :fail
)

echo.
echo [OK] 설치 및 검증 완료:
echo      %DST%
echo.
echo Photoshop을 다시 실행한 뒤 다음 메뉴를 확인하세요:
echo Window ^> Extensions ^(Legacy^) ^> RC-Astro BlurXTerminator
echo.
pause
exit /b 0

:fail
echo.
echo 설치에 실패했습니다. 위의 [ERROR] 내용을 확인하세요.
echo.
pause
exit /b 1

:verify_file
if not exist "%DST%\%~1" (
    echo [ERROR] 설치 파일 누락: %~1
    exit /b 1
)
"%FCEXE%" /B "%SRC%\%~1" "%DST%\%~1" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 설치 파일 불일치: %~1
    exit /b 1
)
echo [OK] 파일 검증: %~1
exit /b 0

:enable_and_verify_debug
"%REGEXE%" add "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
if errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode 등록 실패
    exit /b 1
)

"%REGEXE%" query "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode 2>nul | "%FINDSTREXE%" /R /C:"PlayerDebugMode *REG_SZ *1$" >nul
if errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode 검증 실패
    exit /b 1
)

echo [OK] CSXS.%~1 PlayerDebugMode=1
exit /b 0
