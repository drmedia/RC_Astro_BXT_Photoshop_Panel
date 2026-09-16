@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

set "UI_LANG="
set "TEST_LANGUAGE="
if /I "%~1"=="--lang=ko" set "UI_LANG=ko"
if /I "%~1"=="--lang=en" set "UI_LANG=en"
if /I "%~2"=="--lang=ko" set "UI_LANG=ko"
if /I "%~2"=="--lang=en" set "UI_LANG=en"
if /I "%~1"=="--lang" if /I "%~2"=="ko" set "UI_LANG=ko"
if /I "%~1"=="--lang" if /I "%~2"=="en" set "UI_LANG=en"
if /I "%~2"=="--lang" if /I "%~3"=="ko" set "UI_LANG=ko"
if /I "%~2"=="--lang" if /I "%~3"=="en" set "UI_LANG=en"
if /I "%~1"=="--test-language" set "TEST_LANGUAGE=1"
if /I "%~2"=="--test-language" set "TEST_LANGUAGE=1"
if /I "%~3"=="--test-language" set "TEST_LANGUAGE=1"
call :select_language
if /I "%UI_LANG%"=="ko" (call :messages_ko) else (call :messages_en)

echo ============================================================
echo RC-Astro BlurXTerminator Photoshop Panel - %M_TITLE%
echo ============================================================
echo %M_LANGUAGE%: %UI_LANG%
echo.

if defined TEST_LANGUAGE (
    call :print_language_test
    exit /b 0
)

set "DST=%APPDATA%\Adobe\CEP\extensions\RC-Astro-BXT-Panel"
set "REGEXE=%SystemRoot%\System32\reg.exe"

if not defined APPDATA (
    echo [ERROR] %M_APPDATA_MISSING%
    goto :fail
)

if not exist "%REGEXE%" (
    echo [ERROR] reg.exe %M_PROGRAM_MISSING%
    echo         %REGEXE%
    goto :fail
)

tasklist /FI "IMAGENAME eq Photoshop.exe" 2>nul | find /I "Photoshop.exe" >nul
if not errorlevel 1 (
    echo [ERROR] %M_PHOTOSHOP_RUNNING%
    echo         %M_CLOSE_PHOTOSHOP%
    goto :fail
)

echo [1/2] %M_REMOVE_PANEL%
if exist "%DST%" rmdir /S /Q "%DST%" 2>nul
if exist "%DST%" (
    echo [ERROR] %M_REMOVE_PANEL_FAILED%
    echo         %DST%
    goto :fail
)
echo [OK] %M_REMOVE_PANEL_OK%

echo.
echo %M_DEBUG_SHARED%
echo %M_DEBUG_KEEP_HINT%
set "REMOVE_DEBUG=N"
set /P "REMOVE_DEBUG=%M_REMOVE_DEBUG_PROMPT% [y/N]: "

if /I "%REMOVE_DEBUG%"=="Y" (
    echo.
    echo [2/2] %M_REMOVE_DEBUG%
    set "REG_FAILED="
    for %%V in (9 10 11 12 13 14 15) do (
        call :remove_debug_value %%V
        if errorlevel 1 set "REG_FAILED=1"
    )
    if defined REG_FAILED (
        echo [ERROR] %M_REMOVE_DEBUG_FAILED%
        goto :fail
    )
) else (
    echo [2/2] %M_KEEP_DEBUG%
)

echo.
echo [OK] %M_UNINSTALL_OK%
echo.
if not defined BXT_NO_PAUSE pause
exit /b 0

:fail
echo.
echo %M_UNINSTALL_FAILED%
echo.
if not defined BXT_NO_PAUSE pause
exit /b 1

:remove_debug_value
"%REGEXE%" query "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode >nul 2>&1
if errorlevel 1 (
    echo [SKIP] CSXS.%~1 PlayerDebugMode %M_NOT_PRESENT%
    exit /b 0
)

"%REGEXE%" delete "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode /f >nul 2>&1
if errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode %M_DELETE_FAILED%
    exit /b 1
)

"%REGEXE%" query "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode >nul 2>&1
if not errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode %M_DELETE_VERIFY_FAILED%
    exit /b 1
)

echo [OK] CSXS.%~1 PlayerDebugMode %M_REMOVED%
exit /b 0

:select_language
if defined UI_LANG exit /b 0
if /I "%BXT_LANG%"=="ko" set "UI_LANG=ko"
if /I "%BXT_LANG%"=="en" set "UI_LANG=en"
if defined UI_LANG exit /b 0
set "UI_LANG=en"
for /F "usebackq delims=" %%L in (`powershell -NoProfile -Command "[Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName" 2^>nul`) do set "DETECTED_LANG=%%L"
if /I "%DETECTED_LANG%"=="ko" set "UI_LANG=ko"
echo Select language / 언어 선택
echo   [1] 한국어
echo   [2] English
set "LANG_CHOICE="
set /P "LANG_CHOICE=1 / 2 (Enter = Auto / 자동): "
if "%LANG_CHOICE%"=="1" set "UI_LANG=ko"
if "%LANG_CHOICE%"=="2" set "UI_LANG=en"
echo.
exit /b 0

:messages_ko
set "M_TITLE=제거"
set "M_LANGUAGE=언어"
set "M_APPDATA_MISSING=APPDATA 환경 변수를 찾을 수 없습니다."
set "M_PROGRAM_MISSING=를 찾을 수 없습니다:"
set "M_PHOTOSHOP_RUNNING=Photoshop이 실행 중입니다."
set "M_CLOSE_PHOTOSHOP=Photoshop을 완전히 종료한 뒤 다시 실행하세요."
set "M_REMOVE_PANEL=패널 설치 폴더 제거 중..."
set "M_REMOVE_PANEL_FAILED=패널 설치 폴더를 제거하지 못했습니다:"
set "M_REMOVE_PANEL_OK=패널 설치 폴더 제거 완료"
set "M_DEBUG_SHARED=PlayerDebugMode는 서명되지 않은 모든 CEP 확장에 적용되는 공유 설정입니다."
set "M_DEBUG_KEEP_HINT=다른 CEP 패널이 사용 중이라면 유지해야 합니다."
set "M_REMOVE_DEBUG_PROMPT=PlayerDebugMode도 제거하시겠습니까?"
set "M_REMOVE_DEBUG=CEP PlayerDebugMode 제거 중..."
set "M_REMOVE_DEBUG_FAILED=하나 이상의 PlayerDebugMode 값을 제거하지 못했습니다."
set "M_KEEP_DEBUG=CEP PlayerDebugMode 유지"
set "M_UNINSTALL_OK=제거 및 검증 완료"
set "M_UNINSTALL_FAILED=제거에 실패했습니다. 위의 [ERROR] 내용을 확인하세요."
set "M_NOT_PRESENT=없음"
set "M_DELETE_FAILED=삭제 실패"
set "M_DELETE_VERIFY_FAILED=삭제 검증 실패"
set "M_REMOVED=제거"
exit /b 0

:messages_en
set "M_TITLE=Uninstaller"
set "M_LANGUAGE=Language"
set "M_APPDATA_MISSING=The APPDATA environment variable was not found."
set "M_PROGRAM_MISSING=was not found:"
set "M_PHOTOSHOP_RUNNING=Photoshop is running."
set "M_CLOSE_PHOTOSHOP=Close Photoshop completely, then run this uninstaller again."
set "M_REMOVE_PANEL=Removing the panel installation folder..."
set "M_REMOVE_PANEL_FAILED=Could not remove the panel installation folder:"
set "M_REMOVE_PANEL_OK=Panel installation folder removed"
set "M_DEBUG_SHARED=PlayerDebugMode is shared by all unsigned CEP extensions."
set "M_DEBUG_KEEP_HINT=Keep it if another CEP panel still uses it."
set "M_REMOVE_DEBUG_PROMPT=Remove PlayerDebugMode too?"
set "M_REMOVE_DEBUG=Removing CEP PlayerDebugMode..."
set "M_REMOVE_DEBUG_FAILED=One or more PlayerDebugMode values could not be removed."
set "M_KEEP_DEBUG=Keeping CEP PlayerDebugMode"
set "M_UNINSTALL_OK=Uninstallation and verification completed"
set "M_UNINSTALL_FAILED=Uninstallation failed. Review the [ERROR] message above."
set "M_NOT_PRESENT=not present"
set "M_DELETE_FAILED=deletion failed"
set "M_DELETE_VERIFY_FAILED=deletion verification failed"
set "M_REMOVED=removed"
exit /b 0

:print_language_test
echo [LANGUAGE-TEST] %UI_LANG% PASS
echo [TEST] %M_REMOVE_PANEL%
echo [TEST] %M_REMOVE_PANEL_OK%
echo [TEST] %M_DEBUG_SHARED%
echo [TEST] %M_KEEP_DEBUG%
echo [TEST] %M_UNINSTALL_OK%
echo [TEST] %M_UNINSTALL_FAILED%
exit /b 0