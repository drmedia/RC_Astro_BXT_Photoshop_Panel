# RC-Astro BlurXTerminator Photoshop Panel

RC-Astro Stand-alone CLI의 BlurXTerminator를 Adobe Photoshop에서 실행하고,
처리 결과를 원본 문서의 새 레이어로 가져오는 Windows용 CEP 패널입니다.

현재 버전: **v0.9.1**

> 이 저장소에는 RC-Astro CLI, BlurXTerminator 모델 또는 제품 라이선스가
> 포함되어 있지 않습니다. 사용자가 별도로 설치하고 활성화해야 합니다.

## 주요 기능

- 현재 Photoshop 레이어를 32비트 TIFF로 안전하게 내보내 BXT 처리
- 결과를 원본 색상 모드와 비트 심도에 맞춰 새 레이어로 삽입
- 선택 영역 또는 현재 레이어 마스크를 이용한 지정 영역 처리
- Lunar / Planetary 모드와 PSF Diameter 지원
- CLI 버전, ML 버전과 라이선스 상태 사전 확인
- 실행 취소와 성공·실패·패널 종료 시 임시 TIFF 정리
- 패널 내부 빠른 사용 설명서와 오류 해결 안내

## 요구 사항

- Windows
- Adobe Photoshop의 CEP Extensions (Legacy) 지원 버전
- RC-Astro Stand-alone CLI
- 활성화된 BlurXTerminator 라이선스
- Lunar / Planetary 모드는 BlurXTerminator ML5 이상

명령 프롬프트에서 다음 명령이 실행되는지 먼저 확인하세요.

```text
rc-astro bxt
```

## 설치

1. Photoshop을 완전히 종료합니다.
2. 저장소를 내려받거나 릴리스 ZIP의 압축을 풉니다.
3. `Install_Windows.bat`을 실행합니다.
4. Photoshop을 다시 실행합니다.
5. `창 → 확장 기능(레거시) → RC-Astro BlurXTerminator`를 엽니다.

설치 프로그램은 다음 사용자 폴더에 패널을 복사합니다.

```text
%APPDATA%\Adobe\CEP\extensions\RC-Astro-BXT-Panel
```

또한 서명되지 않은 CEP 패널 실행에 필요한 `PlayerDebugMode=1`을
현재 사용자 계정의 CSXS 9~15 레지스트리에 설정합니다.

## 사용 방법

1. Photoshop에서 선형(linear / unstretched) 천체 이미지를 엽니다.
2. 우측 상단 설정에서 RC-Astro CLI와 라이선스 상태를 확인합니다.
3. 상태 카드에서 자동 결정된 처리 대상과 결과 마스크를 확인합니다.
4. 필요하면 `세부 설정 보기`를 열어 처리값을 조정합니다.
5. `BlurXTerminator 실행`을 선택합니다.

우측 상단 `?` 버튼에서 같은 내용을 패널 안에서 확인할 수 있습니다.

## 처리 대상 자동 판정

| Photoshop 상태 | 처리 방식 |
|---|---|
| 선택 영역이 있음 | 보이는 레이어 합성 처리 후 선택 영역을 결과 마스크로 적용 |
| 선택 영역 없이 현재 레이어 마스크가 있음 | 보이는 레이어 합성 처리 후 레이어 마스크를 결과에 적용 |
| 전체 프레임 픽셀 레이어 또는 스마트 오브젝트 | 현재 레이어만 처리 |
| 조정·텍스트·그룹·부분 크기 레이어 | 사용 불가로 표시하고 실행 차단 |

선택 영역과 레이어 마스크가 모두 있으면 선택 영역을 우선합니다.

## 세부 설정

### 일반 이미지

- Strength: Stars와 Nonstellar를 함께 조정하는 공통값, `0~0.7`
- Sharpen Stars: `0~0.7`
- Sharpen Nonstellar: `0~1.0`
- Adjust Star Halos: `-0.5~0.5`
- 연동을 끄면 Stars와 Nonstellar를 각각 설정할 수 있습니다.

### Lunar / Planetary

- Sharpen Nonstellar
- PSF Diameter: `0.1~8.0 px`
- 이 모드에서는 Stars와 Halos를 사용하지 않습니다.

## 취소와 임시 파일

- 실행 중 `처리 취소`를 선택하면 RC-Astro 프로세스를 종료합니다.
- 성공, 실패, 취소 및 패널 종료 시 입·출력 TIFF 정리를 시도합니다.
- 설정 화면의 `지금 정리`로 오래된 임시 TIFF를 수동 삭제할 수 있습니다.
- 진행 중인 다른 실행을 보호하기 위해 최근 10분 이내 파일은 제외합니다.

## 제거

1. Photoshop을 완전히 종료합니다.
2. `Uninstall_Windows.bat`을 실행합니다.
3. `PlayerDebugMode` 제거 여부를 선택합니다.

`PlayerDebugMode`는 다른 서명되지 않은 CEP 확장도 사용하는 공유 설정입니다.
다른 CEP 패널을 사용한다면 기본값 `N`으로 유지하세요.

## 테스트

Photoshop 27.8.0에서 문서 ID, 색상 모드·비트 심도 복원, 현재 레이어,
선택 영역, 레이어 마스크와 TIFF 왕복 처리를 포함한 통합 테스트 14개를
통과했습니다.

통합 테스트 실행 파일:

```text
tests\Run_Photoshop_Integration.ps1
```

실제 테스트에는 Photoshop이 설치되어 실행 중이어야 합니다.

## 상세 문서

- [한국어 상세 사용 설명서](README_KO.txt)
- [개선 및 통합 테스트 기록](IMPROVEMENT_REVIEW.md)

## 라이선스

이 패널의 소스 코드는 [GNU General Public License v3.0](LICENSE)에 따라
배포됩니다.

RC-Astro Stand-alone CLI, BlurXTerminator 및 Adobe Photoshop은 이 저장소에
포함되지 않으며 각 제품의 별도 라이선스와 이용 조건이 적용됩니다.
