RC-Astro BlurXTerminator Photoshop Panel
Windows / Photoshop CEP Panel
============================================================

목표
----
Photoshop 안에서 AstroWizard처럼:

  Strength 슬라이더 0~1
  → BlurXTerminator 실행
  → RC-Astro Stand-alone CLI 처리
  → 결과를 원본 문서의 새 레이어로 자동 삽입

하도록 만든 패널입니다.


구성
----
RC-Astro-BXT-Panel\
  CSXS\manifest.xml
  client\index.html
  client\style.css
  client\main.js
  host\host.jsx

Install_Windows.bat
Uninstall_Windows.bat


설치 전 확인
------------
1. RC-Astro Stand-alone CLI가 설치되어 있어야 합니다.
2. BlurXTerminator 라이선스가 활성화되어 있어야 합니다.
3. Windows 명령 프롬프트에서:

   rc-astro bxt

   가 실행되는지 먼저 확인하세요.


설치
----
1. Photoshop을 종료합니다.
2. Install_Windows.bat 실행
3. Photoshop 재시작
4. 메뉴에서:

   Window
   → Extensions (Legacy)
   → RC-Astro BlurXTerminator

※ 한글 UI에서는
   창 → 확장 기능(레거시)
   근처에 표시될 수 있습니다.


제거
----
1. Photoshop을 완전히 종료합니다.
2. Uninstall_Windows.bat 실행
3. 패널 설치 폴더 삭제 결과를 확인합니다.
4. PlayerDebugMode 삭제 여부를 선택합니다.

PlayerDebugMode는 서명되지 않은 모든 CEP 확장에 적용되는 공유 설정입니다.
다른 CEP 패널을 사용한다면 기본값인 N을 선택해 유지하세요.
Y를 선택하면 CSXS 9~15에서 해당 값만 제거하고 결과를 다시 검증합니다.


패널 사용법
-----------
1. Photoshop에서 천체사진을 엽니다.
2. 우측 상단 톱니바퀴 버튼에서 RC-Astro 실행 환경을 확인합니다.

   - [찾기]로 rc-astro.exe를 직접 선택할 수 있습니다.
   - [저장]으로 입력한 경로를 보관합니다.
   - CLI 버전, BXT ML 버전과 라이선스 상태가 자동으로 표시됩니다.
   - 같은 설정 화면에서 임시 TIFF 현황 확인과 수동 정리가 가능합니다.

3. 처리 대상을 선택합니다.

   [보이는 레이어]
   - 현재 보이는 전체 합성 결과를 BXT 처리합니다.

   [현재 레이어]
   - 기본값/권장
   - 활성 레이어만 보이게 한 복제 문서를 만들어 처리합니다.
   - 전체 프레임 픽셀/스마트 오브젝트 레이어에 적합합니다.
   - 조정·텍스트·빈 레이어와 전체 프레임을 덮지 않는 레이어는 실행 전에
     자동으로 차단합니다.

   [지정 영역]
   - 전체 합성 이미지를 BXT 처리한 뒤 결과를 하늘에만 표시합니다.
   - Photoshop 선택 영역이 있으면 그 영역을 우선 사용합니다.
   - 선택 영역이 없으면 현재 레이어의 레이어 마스크를 사용합니다.
   - 둘 다 없으면 원본을 변경하지 않고 오류로 중단합니다.
   - 처리 후 결과 레이어 이름은 BlurXTerminator - Sky이며 하늘 영역
     레이어 마스크가 자동으로 적용됩니다.

4. [세부 설정 보기]를 펼쳐 Strength, 세부 조정과 처리 모드를 설정합니다.

   Strength 기본값: 0.30

   Strength 연동 ON:
   Sharpen Stars와 Sharpen Nonstellar가 같이 움직입니다.

   Sharpen Stars
   Sharpen Nonstellar
   Adjust Star Halos

   Sharpen Stars 범위: 0.00 ~ 0.70
   Sharpen Nonstellar 범위: 0.00 ~ 1.00

   달 또는 행성 이미지라면 처리 모드에서:

   Lunar / Planetary 모드 ON
   PSF Diameter에 동일한 광학계에서 측정되는 별의 FWHM 입력

   이 모드에서는 Sharpen Stars와 Adjust Star Halos가 비활성화됩니다.

5. [BlurXTerminator 실행]

   실행을 누른 순간의 설정값이 고정되며 처리 중에는 모든 입력 컨트롤이
   잠깁니다. 완료 또는 오류 후 자동으로 다시 사용할 수 있습니다.

   실제 TIFF를 만들기 전에 RC-Astro CLI, BlurXTerminator 라이선스,
   ML 버전과 필요한 기능 지원 여부를 자동으로 점검합니다.

   실제 BXT 처리 중에는 [처리 취소] 버튼이 표시됩니다. 취소하거나 패널을
   닫으면 실행 프로세스, 임시 TIFF와 지정 영역 임시 마스크를 정리합니다.

6. 완료되면 원래 Photoshop 문서 맨 위에

   BlurXTerminator

   하늘 영역만 처리한 경우에는

   BlurXTerminator - Sky

   라는 새 레이어가 생성됩니다.

패널 하단에는 현재 설치된 패널 버전이 표시됩니다.

우측 상단 설정 화면의 임시 TIFF 항목에서 현재 파일 개수와 전체 용량을 확인할 수 있습니다.
[지금 정리]를 누르면 이 패널이 생성한 TIFF만 삭제하며, 다른 실행에서
사용 중일 수 있는 최근 10분 이내 파일은 자동으로 제외합니다.

RC-Astro CLI의 사전 점검과 실제 처리에는 10MB 출력 버퍼를 사용하여
긴 처리 로그로 인한 기본 버퍼 초과 오류를 줄였습니다.

처리에 사용한 입력/출력 TIFF는 성공 또는 실패 후 자동으로 삭제됩니다.
비정상 종료로 남은 임시 TIFF는 다음 실행 시 24시간이 지난 파일부터
자동으로 정리됩니다.

임시 폴더는 구형 Photoshop CEP의 내장 Node.js에서도 동작하는 방식으로
생성되며, 여러 패널 인스턴스가 동시에 실행되는 경우도 처리합니다.

패널은 원본 문서를 변경하지 않고 복제 문서를 평탄화한 뒤
RGB 32-bit TIFF로 변환하여 BXT에 전달합니다. 처리 결과는 원본 문서의
색상 모드와 비트 심도에 맞춘 뒤 새 레이어로 추가됩니다.

처리 중 원본 문서는 Photoshop 문서 고유 ID로 추적합니다. 같은 이름의
문서가 여러 개 열려 있어도 처음 실행한 문서에만 결과가 추가됩니다.
처리 도중 원본 문서를 닫으면 다른 동명 문서에 삽입하지 않고 오류로
중단합니다.

결과 레이어 호환 변환은 RGB, Grayscale, CMYK, Lab 문서를 지원합니다.
Bitmap, Indexed Color, Duotone, Multichannel 문서는 명확한 오류를 표시하고
결과 가져오기를 중단합니다.


은하수 권장 시작값
------------------
Strength             0.20 ~ 0.35
Sharpen Stars         0.15 ~ 0.30
Sharpen Nonstellar    0.20 ~ 0.35
Adjust Star Halos     0.00

별이 매우 조밀한 은하수 중심부는
Nonstellar 값을 과도하게 높이지 않는 것을 권장합니다.


달/행성 모드
------------
BlurXTerminator ML5 및 Lunar / Planetary 모드를 지원하는
RC-Astro Stand-alone CLI가 필요합니다.

PSF Diameter는 동일한 광학계와 전처리 과정에서 별이 보이는
FWHM 값을 기준으로 설정하세요. 기본 시작값은 2.0 px입니다.


RC-Astro 경로
-------------
PATH가 정상 등록되어 있다면 패널의:

   rc-astro

를 그대로 사용하면 됩니다.

PATH에 없다면 전체 경로를 입력하고 [저장]:

예:
   C:\Program Files\RC-Astro\rc-astro.exe


작업 흐름 추천
--------------
Siril
  RAW
  → 정렬
  → 스택
  → Background Extraction
  → 선형 TIFF

Photoshop
  → RC-Astro BlurXTerminator 패널
  → BXT
  → 결과 새 레이어

이후
  → NoiseXTerminator
  → Stretch
  → 색상/대비
  → 전경 합성


중요
----
BlurXTerminator는 선형(linear / unstretched) 데이터에서
사용하는 것이 기본 권장 방식입니다.

Camera Raw / Curves / Levels 등으로 이미 강하게 Stretch한
사진보다는 스택 직후의 선형 데이터에서 처리하세요.


현재 레이어 모드 주의
---------------------
현재 레이어만 처리할 때 패널은 복제 문서에서
활성 레이어만 표시한 뒤 평탄화하여 BXT에 전달합니다.

따라서:
- 사진 전체를 덮는 픽셀 레이어: 적합
- 전체 프레임 Smart Object: 대체로 적합
- 작은 부분 레이어/마스크 조각: 비권장
- Adjustment Layer만 선택: 비권장


패널이 안 보이는 경우
---------------------
1. Photoshop 완전 종료 후 재실행
2. 다음 폴더 확인:

   %APPDATA%\Adobe\CEP\extensions\RC-Astro-BXT-Panel

3. manifest.xml 존재 여부 확인
4. 레지스트리 PlayerDebugMode 확인
5. 최신 Photoshop에서 CEP/Legacy Extension 지원 여부 확인

Adobe가 장기적으로 UXP를 기본 확장 플랫폼으로 사용하고 있기 때문에,
향후 Photoshop에서 CEP가 제거되면 UXP + 로컬 helper 방식으로
전환해야 할 수 있습니다.


문제 발생 시 확인할 정보
------------------------
오류 화면을 캡처해서 보내거나,
패널의 오류 메시지 전체를 복사해 보내주세요.

특히 아래 정보가 있으면 빠르게 수정할 수 있습니다.
- Photoshop 버전
- rc-astro --version 결과
- rc-astro bxt 실행 여부
- 패널 오류 메시지
