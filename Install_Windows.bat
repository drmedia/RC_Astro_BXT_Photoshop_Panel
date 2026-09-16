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

set "SRC=%~dp0RC-Astro-BXT-Panel"
set "CEP_ROOT=%APPDATA%\Adobe\CEP\extensions"
set "DST=%CEP_ROOT%\RC-Astro-BXT-Panel"
set "REGEXE=%SystemRoot%\System32\reg.exe"
set "XCOPYEXE=%SystemRoot%\System32\xcopy.exe"
set "FCEXE=%SystemRoot%\System32\fc.exe"
set "FINDSTREXE=%SystemRoot%\System32\findstr.exe"

if not defined APPDATA (
    echo [ERROR] %M_APPDATA_MISSING%
    goto :fail
)

if not exist "%SRC%\CSXS\manifest.xml" (
    echo [ERROR] %M_SOURCE_MISSING%
    echo         %SRC%
    goto :fail
)

if not exist "%REGEXE%" (
    echo [ERROR] reg.exe %M_PROGRAM_MISSING%
    echo         %REGEXE%
    goto :fail
)

if not exist "%XCOPYEXE%" (
    echo [ERROR] xcopy.exe %M_PROGRAM_MISSING%
    echo         %XCOPYEXE%
    goto :fail
)

if not exist "%FCEXE%" (
    echo [ERROR] fc.exe %M_PROGRAM_MISSING%
    echo         %FCEXE%
    goto :fail
)

if not exist "%FINDSTREXE%" (
    echo [ERROR] findstr.exe %M_PROGRAM_MISSING%
    echo         %FINDSTREXE%
    goto :fail
)

tasklist /FI "IMAGENAME eq Photoshop.exe" 2>nul | find /I "Photoshop.exe" >nul
if not errorlevel 1 (
    echo [ERROR] %M_PHOTOSHOP_RUNNING%
    echo         %M_CLOSE_PHOTOSHOP%
    goto :fail
)

echo [1/4] %M_CHECK_CEP%
if not exist "%CEP_ROOT%" mkdir "%CEP_ROOT%" >nul 2>&1
if not exist "%CEP_ROOT%" (
    echo [ERROR] %M_CEP_CREATE_FAILED%
    echo         %CEP_ROOT%
    goto :fail
)

echo [2/4] %M_REMOVE_OLD%
if exist "%DST%" rmdir /S /Q "%DST%" 2>nul
if exist "%DST%" (
    echo [ERROR] %M_REMOVE_OLD_FAILED%
    echo         %DST%
    echo         %M_CHECK_ADOBE_PROCESS%
    goto :fail
)

echo [3/4] %M_COPY_NEW%
mkdir "%DST%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] %M_INSTALL_DIR_FAILED%
    echo         %DST%
    goto :fail
)

"%XCOPYEXE%" "%SRC%\*" "%DST%\" /E /I /H /K /Y >nul
if errorlevel 1 (
    call echo [ERROR] %M_COPY_FAILED% %%ERRORLEVEL%%
    goto :fail
)

set "COPY_FAILED="
for %%F in ("CSXS\manifest.xml" "client\index.html" "client\style.css" "client\i18n.js" "client\main.js" "host\host.jsx") do (
    call :verify_file "%%~F"
    if errorlevel 1 set "COPY_FAILED=1"
)
if defined COPY_FAILED (
    echo [ERROR] %M_VERIFY_FAILED%
    goto :fail
)

echo [4/4] %M_ENABLE_CEP%
set "REG_FAILED="
for %%V in (9 10 11 12 13 14 15) do (
    call :enable_and_verify_debug %%V
    if errorlevel 1 set "REG_FAILED=1"
)
if defined REG_FAILED (
    echo [ERROR] %M_DEBUG_FAILED%
    echo         %M_CHECK_REGISTRY%
    goto :fail
)

echo.
echo [OK] %M_INSTALL_OK%
echo      %DST%
echo.
echo %M_RESTART_PHOTOSHOP%
echo Window ^> Extensions ^(Legacy^) ^> RC-Astro BlurXTerminator
echo.
if not defined BXT_NO_PAUSE pause
exit /b 0

:fail
echo.
echo %M_INSTALL_FAILED%
echo.
if not defined BXT_NO_PAUSE pause
exit /b 1

:verify_file
if not exist "%DST%\%~1" (
    echo [ERROR] %M_FILE_MISSING%: %~1
    exit /b 1
)
"%FCEXE%" /B "%SRC%\%~1" "%DST%\%~1" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] %M_FILE_MISMATCH%: %~1
    exit /b 1
)
echo [OK] %M_FILE_VERIFIED%: %~1
exit /b 0

:enable_and_verify_debug
"%REGEXE%" add "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
if errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode %M_REGISTER_FAILED%
    exit /b 1
)

"%REGEXE%" query "HKCU\Software\Adobe\CSXS.%~1" /v PlayerDebugMode 2>nul | "%FINDSTREXE%" /R /C:"PlayerDebugMode *REG_SZ *1$" >nul
if errorlevel 1 (
    echo [ERROR] CSXS.%~1 PlayerDebugMode %M_REG_VERIFY_FAILED%
    exit /b 1
)

echo [OK] CSXS.%~1 PlayerDebugMode=1
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
set "M_TITLE=설치"
set "M_LANGUAGE=언어"
set "M_APPDATA_MISSING=APPDATA 환경 변수를 찾을 수 없습니다."
set "M_SOURCE_MISSING=확장 소스 폴더를 찾을 수 없습니다:"
set "M_PROGRAM_MISSING=를 찾을 수 없습니다:"
set "M_PHOTOSHOP_RUNNING=Photoshop이 실행 중입니다."
set "M_CLOSE_PHOTOSHOP=Photoshop을 완전히 종료한 뒤 다시 실행하세요."
set "M_CHECK_CEP=CEP 패널 설치 폴더 확인 중..."
set "M_CEP_CREATE_FAILED=CEP 패널 설치 폴더를 만들지 못했습니다:"
set "M_REMOVE_OLD=기존 패널 제거 중..."
set "M_REMOVE_OLD_FAILED=기존 설치 폴더를 제거하지 못했습니다:"
set "M_CHECK_ADOBE_PROCESS=파일을 사용 중인 Adobe 프로세스가 없는지 확인하세요."
set "M_COPY_NEW=새 패널 복사 중..."
set "M_INSTALL_DIR_FAILED=설치 폴더를 만들지 못했습니다:"
set "M_COPY_FAILED=패널 파일 복사에 실패했습니다. xcopy 종료 코드:"
set "M_VERIFY_FAILED=설치 파일 검증에 실패했습니다."
set "M_ENABLE_CEP=서명되지 않은 CEP 확장 허용 중..."
set "M_DEBUG_FAILED=하나 이상의 CEP PlayerDebugMode 설정 또는 검증에 실패했습니다."
set "M_CHECK_REGISTRY=위에 표시된 CSXS 버전과 레지스트리 권한을 확인하세요."
set "M_INSTALL_OK=설치 및 검증 완료:"
set "M_RESTART_PHOTOSHOP=Photoshop을 다시 실행한 뒤 다음 메뉴를 확인하세요:"
set "M_INSTALL_FAILED=설치에 실패했습니다. 위의 [ERROR] 내용을 확인하세요."
set "M_FILE_MISSING=설치 파일 누락"
set "M_FILE_MISMATCH=설치 파일 불일치"
set "M_FILE_VERIFIED=파일 검증"
set "M_REGISTER_FAILED=등록 실패"
set "M_REG_VERIFY_FAILED=검증 실패"
exit /b 0

:messages_en
set "M_TITLE=Installer"
set "M_LANGUAGE=Language"
set "M_APPDATA_MISSING=The APPDATA environment variable was not found."
set "M_SOURCE_MISSING=The extension source folder was not found:"
set "M_PROGRAM_MISSING=was not found:"
set "M_PHOTOSHOP_RUNNING=Photoshop is running."
set "M_CLOSE_PHOTOSHOP=Close Photoshop completely, then run this installer again."
set "M_CHECK_CEP=Checking the CEP extension folder..."
set "M_CEP_CREATE_FAILED=Could not create the CEP extension folder:"
set "M_REMOVE_OLD=Removing the existing panel..."
set "M_REMOVE_OLD_FAILED=Could not remove the existing installation folder:"
set "M_CHECK_ADOBE_PROCESS=Check that no Adobe process is using files in this folder."
set "M_COPY_NEW=Copying the new panel..."
set "M_INSTALL_DIR_FAILED=Could not create the installation folder:"
set "M_COPY_FAILED=Failed to copy panel files. xcopy exit code:"
set "M_VERIFY_FAILED=Installation file verification failed."
set "M_ENABLE_CEP=Enabling unsigned CEP extensions..."
set "M_DEBUG_FAILED=One or more CEP PlayerDebugMode settings could not be applied or verified."
set "M_CHECK_REGISTRY=Check the CSXS versions shown above and your registry permissions."
set "M_INSTALL_OK=Installation and verification completed:"
set "M_RESTART_PHOTOSHOP=Restart Photoshop, then open:"
set "M_INSTALL_FAILED=Installation failed. Review the [ERROR] message above."
set "M_FILE_MISSING=Missing installation file"
set "M_FILE_MISMATCH=Installation file mismatch"
set "M_FILE_VERIFIED=File verified"
set "M_REGISTER_FAILED=registration failed"
set "M_REG_VERIFY_FAILED=verification failed"
exit /b 0

:print_language_test
echo [LANGUAGE-TEST] %UI_LANG% PASS
echo [TEST] %M_CHECK_CEP%
echo [TEST] %M_REMOVE_OLD%
echo [TEST] %M_COPY_NEW%
echo [TEST] %M_ENABLE_CEP%
echo [TEST] %M_INSTALL_OK%
echo [TEST] %M_INSTALL_FAILED%
exit /b 0