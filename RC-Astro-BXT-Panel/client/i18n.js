(function (global) {
  "use strict";

  var STORAGE_KEY = "bxtLanguage";
  var preference = "auto";
  var language = "ko";
  var listeners = [];

  var strings = {
    ko: {
      "language.label": "언어",
      "language.auto": "자동 (시스템)",
      "language.ko": "한국어",
      "language.en": "English",
      "language.hint": "자동은 Photoshop 또는 시스템 언어를 따릅니다.",
      "details.open": "세부 설정 보기",
      "details.close": "세부 설정 닫기",
      "settings.title": "설정",
      "settings.attention": "설정 · RC-Astro 확인 필요",
      "run.start": "BlurXTerminator 실행",
      "run.processing": "처리 중…",
      "temp.summary": "{count}개 · {size}"
    },
    en: {
      "language.label": "Language",
      "language.auto": "Auto (System)",
      "language.ko": "한국어",
      "language.en": "English",
      "language.hint": "Auto follows the Photoshop or system language.",
      "details.open": "Show Details",
      "details.close": "Hide Details",
      "settings.title": "Settings",
      "settings.attention": "Settings · Check RC-Astro",
      "run.start": "Run BlurXTerminator",
      "run.processing": "Processing…",
      "temp.summary": "{count} files · {size}"
    }
  };

  var koToEn = {
    "사용 설명서": "User Guide",
    "설정": "Settings",
    "설정 닫기": "Close Settings",
    "닫기": "Close",
    "RC-Astro 실행 파일": "RC-Astro Executable",
    "찾기": "Browse",
    "저장": "Save",
    "RC-Astro CLI를 확인하고 있습니다.": "Checking RC-Astro CLI.",
    "PATH에 등록된 실행 파일 또는 전체 경로를 입력하세요.": "Enter an executable on PATH or its full path.",
    "임시 TIFF": "Temporary TIFF Files",
    "확인 중…": "Checking…",
    "지금 정리": "Clean Now",
    "다른 실행을 보호하기 위해 최근 10분 이내 파일은 제외합니다.": "Files modified within the last 10 minutes are excluded to protect other runs.",
    "사용 설명서 닫기": "Close User Guide",
    "이미지를 엽니다": "Open an Image",
    "선형(linear / unstretched) 천체 이미지를 권장합니다.": "A linear (unstretched) astronomical image is recommended.",
    "레이어 또는 영역을 준비합니다": "Prepare a Layer or Region",
    "패널이 처리 대상과 결과 마스크를 자동 판정합니다.": "The panel automatically determines the target and result mask.",
    "설정 후 실행합니다": "Configure and Run",
    "필요하면 세부 설정을 펼친 뒤 BXT를 실행합니다.": "Open the detailed settings if needed, then run BXT.",
    "처리 대상 자동 판정": "Automatic Target Detection",
    "선택 영역 또는 레이어 마스크 있음": "Selection or layer mask present",
    "지정 영역 처리": "Process Selected Region",
    "전체 프레임 픽셀·스마트 오브젝트": "Full-frame pixel layer or Smart Object",
    "현재 레이어 처리": "Process Current Layer",
    "조정·텍스트·부분 크기 레이어": "Adjustment, text, or partial-size layer",
    "사용 불가": "Unavailable",
    "세부 설정 안내": "Detailed Settings",
    "는 Stars와 Nonstellar의 공통 강도입니다. 연동을 끄면 두 값을 개별 조정할 수 있습니다.": " is the shared strength for Stars and Nonstellar. Turn off linking to adjust them separately.",
    "에서는 Nonstellar와 PSF Diameter만 사용합니다.": " uses only Nonstellar and PSF Diameter.",
    "오류 해결": "Troubleshooting",
    "사용 불가:": "Unavailable:",
    "전체 프레임 픽셀 레이어나 스마트 오브젝트를 선택하세요.": "Select a full-frame pixel layer or Smart Object.",
    "CLI·라이선스 오류:": "CLI or License Error:",
    "우측 상단 설정에서 실행 파일 경로와 라이선스 상태를 확인하세요.": "Check the executable path and license status in Settings.",
    "임시 파일:": "Temporary Files:",
    "설정의 ‘지금 정리’로 오래된 TIFF를 삭제할 수 있습니다.": "Use Clean Now in Settings to remove old TIFF files.",
    "처리 대상": "Processing Target",
    "현재 선택한 레이어": "Currently Selected Layer",
    "확인 중": "Checking",
    "Photoshop 상태를 확인하고 있습니다.": "Checking Photoshop status.",
    "결과 마스크": "Result Mask",
    "적용 안 함": "Not Applied",
    "마스크 없음": "No Mask",
    "마스크 없이 결과 레이어를 생성합니다.": "Creates the result layer without a mask.",
    "세부 설정 보기": "Show Details",
    "세부 설정": "Detailed Settings",
    "기본값으로 초기화": "Reset to Defaults",
    "처리 모드": "Processing Mode",
    "일반 이미지": "General Image",
    "선명화 강도": "Sharpening Strength",
    "Stars · Nonstellar 연동": "Link Stars · Nonstellar",
    "행성 이미지 설정": "Planetary Image Settings",
    "Stars와 Halos는 이 모드에서 사용하지 않습니다.": "Stars and Halos are not used in this mode.",
    "Strength 숫자 입력": "Strength numeric input",
    "공통 범위": "Shared Range",
    "Sharpen Stars 숫자 입력": "Sharpen Stars numeric input",
    "Sharpen Nonstellar 숫자 입력": "Sharpen Nonstellar numeric input",
    "Adjust Star Halos 숫자 입력": "Adjust Star Halos numeric input",
    "PSF Diameter 숫자 입력": "PSF Diameter numeric input",
    "동일한 광학계에서 측정되는 별의 FWHM 값을 입력하세요.": "Enter the stellar FWHM measured with the same optical system.",
    "BlurXTerminator 실행": "Run BlurXTerminator",
    "처리 취소": "Cancel Processing",
    "준비 중…": "Preparing…",
    "선형(linear / unstretched) 이미지에서 사용하는 것을 권장합니다.": "Recommended for linear (unstretched) images."
  };

  var runtimePairs = [
    ["마스크 없이 전체 프레임 결과 레이어를 생성합니다.", "Creates a full-frame result layer without a mask."],
    ["현재 보이는 레이어 합성", "Current Visible-Layer Composite"],
    ["보이는 모든 레이어를 임시로 합성해 처리합니다. 원본 레이어는 유지됩니다.", "Temporarily composites all visible layers for processing. Original layers are preserved."],
    ["현재 선택한 스마트 오브젝트", "Currently Selected Smart Object"],
    ["현재 선택한 픽셀 레이어", "Currently Selected Pixel Layer"],
    ["현재 레이어의 픽셀만 입력 이미지로 처리합니다.", "Processes only the pixels of the current layer as the input image."],
    ["전체 합성을 BXT 처리한 뒤 지정한 영역만 결과에 표시합니다.", "Processes the full composite with BXT and reveals only the selected region in the result."],
    ["선택 영역 적용", "Apply Selection"],
    ["선택 영역", "Selection"],
    ["현재 Photoshop 선택 영역을 결과 레이어 마스크로 적용합니다.", "Applies the current Photoshop selection as the result layer mask."],
    ["현재 레이어 마스크 적용", "Apply Current Layer Mask"],
    ["레이어 마스크", "Layer Mask"],
    ["현재 레이어의 마스크를 결과 레이어 마스크로 복사합니다.", "Copies the current layer mask to the result layer."],
    ["지정 영역 없음", "No Selected Region"],
    ["선택 영역을 만들거나 마스크가 있는 레이어를 선택하세요.", "Create a selection or select a layer with a mask."],
    ["알 수 없는 처리 범위", "Unknown Processing Scope"],
    ["처리 범위를 다시 선택하세요.", "Select the processing scope again."],
    ["사용 가능", "Available"],
    ["Photoshop 문서 없음", "No Photoshop Document"],
    ["처리할 Photoshop 문서를 먼저 여세요.", "Open a Photoshop document to process."],
    ["확인 불가", "Cannot Check"],
    ["문서를 연 후 결과 마스크 상태를 확인합니다.", "Open a document to check the result mask status."],
    ["상태 확인 실패", "Status Check Failed"],
    ["Photoshop 상태를 다시 확인하세요.", "Check the Photoshop status again."],
    ["세부 설정 닫기", "Hide Details"],
    ["설정 · RC-Astro 확인 필요", "Settings · Check RC-Astro"],
    ["JSON 응답이 없습니다.", "No JSON response was returned."],
    ["Node.js를 사용할 수 없어 실행 파일을 확인할 수 없습니다.", "Cannot verify the executable because Node.js is unavailable."],
    ["RC-Astro CLI와 BXT 정보를 확인하고 있습니다.", "Checking RC-Astro CLI and BXT information."],
    ["실행 파일을 찾을 수 없거나 RC-Astro BXT가 아닙니다.", "The executable was not found or is not RC-Astro BXT."],
    ["확인 시간 초과", "Verification timed out"],
    ["BlurXTerminator 제품 정보를 확인할 수 없습니다.", "Cannot verify BlurXTerminator product information."],
    ["확인됨", "Verified"],
    ["라이선스 정상", "License valid"],
    ["계정 인증 필요", "Account authentication required"],
    ["경로 변경을 확인하고 있습니다.", "Checking the changed path."],
    ["RC-Astro 실행 파일 선택", "Select the RC-Astro Executable"],
    ["파일 선택 창을 열 수 없습니다:", "Cannot open the file picker:"],
    ["파일 선택 창 오류:", "File picker error:"],
    ["선택한 실행 파일의 전체 경로를 가져올 수 없습니다.", "Cannot obtain the full path of the selected executable."],
    ["CEP 인터페이스를 사용할 수 없습니다.", "The CEP interface is unavailable."],
    ["Photoshop 상태를 확인할 수 없습니다.", "Cannot check Photoshop status."],
    ["응답이 없습니다.", "No response was returned."],
    ["처리 범위 상태 응답이 올바르지 않습니다.", "The processing-scope status response is invalid."],
    ["처리 중…", "Processing…"],
    ["Node.js 초기화 실패:", "Node.js initialization failed:"],
    ["임시 TIFF 정리 실패:", "Failed to clean temporary TIFF files:"],
    ["Photoshop 응답 시간 초과", "Photoshop response timed out"],
    ["알 수 없는 오류", "Unknown error"],
    ["Photoshop 임시 마스크 정리 실패:", "Failed to clean the temporary Photoshop mask:"],
    ["Node.js 모듈을 사용할 수 없어 임시 파일을 정리할 수 없습니다.", "Cannot clean temporary files because Node.js modules are unavailable."],
    ["개 삭제 ·", " files deleted ·"],
    ["개 보호", " files protected"],
    ["최근 파일", "Recent files: "],
    ["확보", "freed"],
    ["삭제 실패:", "Deletion failed:"],
    ["RC-Astro CLI 사전 점검 실패:", "RC-Astro CLI preflight failed:"],
    ["실행 파일을 시작할 수 없습니다.", "Cannot start the executable."],
    ["RC-Astro CLI 응답을 해석할 수 없습니다:", "Cannot parse the RC-Astro CLI response:"],
    ["RC-Astro CLI에서 BlurXTerminator 제품 정보를 확인할 수 없습니다.", "Cannot verify BlurXTerminator product information from RC-Astro CLI."],
    ["BlurXTerminator 라이선스를 사용할 수 없습니다.", "The BlurXTerminator license is unavailable."],
    ["라이선스 상태를 확인하세요.", "Check the license status."],
    ["명령 프롬프트에서 `rc-astro license`를 실행해 확인하세요.", "Run `rc-astro license` in Command Prompt to verify it."],
    ["설치된 RC-Astro CLI가 필요한 BlurXTerminator 파라미터를 지원하지 않습니다.", "The installed RC-Astro CLI does not support the required BlurXTerminator parameters."],
    ["Lunar / Planetary 모드는 BlurXTerminator ML5 이상이 필요합니다.", "Lunar / Planetary mode requires BlurXTerminator ML5 or later."],
    ["현재 ML 버전:", "Current ML version:"],
    ["설치된 RC-Astro CLI가 Lunar / Planetary 모드를 지원하지 않습니다.", "The installed RC-Astro CLI does not support Lunar / Planetary mode."],
    ["Node.js 모듈을 사용할 수 없습니다. CEP 설정을 확인하세요.", "Node.js modules are unavailable. Check the CEP settings."],
    ["Lunar / Planetary 모드에서는 0보다 큰 PSF Diameter가 필요합니다.", "Lunar / Planetary mode requires a PSF Diameter greater than 0."],
    ["처리 범위 확인 중…", "Checking Processing Scope…"],
    ["Photoshop 문서와 처리 범위 확인 중…", "Checking the Photoshop document and processing scope…"],
    ["Photoshop 처리 범위 확인 실패:", "Failed to validate the Photoshop processing scope:"],
    ["RC-Astro 확인 중…", "Checking RC-Astro…"],
    ["CLI·라이선스·기능 확인 중…", "Checking CLI, license, and features…"],
    ["임시 폴더 생성 실패:", "Failed to create the temporary folder:"],
    ["입력 이미지 준비 중…", "Preparing Input Image…"],
    ["확인 완료 · 32-bit TIFF 준비 중…", "verified · Preparing 32-bit TIFF…"],
    ["Photoshop 입력 준비 실패:", "Failed to prepare the Photoshop input:"],
    ["Photoshop 문서 식별 정보가 올바르지 않습니다:", "The Photoshop document identification data is invalid:"],
    ["Photoshop 문서 ID가 올바르지 않습니다:", "The Photoshop document ID is invalid:"],
    ["RC-Astro BlurXTerminator 실행 중…", "Running RC-Astro BlurXTerminator…"],
    ["BlurXTerminator 처리 중…", "Processing with BlurXTerminator…"],
    ["BlurXTerminator 처리를 취소했습니다.", "BlurXTerminator processing was canceled."],
    ["출력 파일이 생성되지 않았습니다.", "The output file was not created."],
    ["BlurXTerminator 실행 실패", "BlurXTerminator execution failed"],
    ["확인: 명령 프롬프트에서 `rc-astro bxt`가 실행되는지 확인하세요.", "Check that `rc-astro bxt` runs in Command Prompt."],
    ["결과를 Photoshop 레이어로 가져오는 중…", "Importing the result as a Photoshop layer…"],
    ["결과 가져오는 중…", "Importing Result…"],
    ["결과 가져오기 실패:", "Failed to import the result:"],
    ["완료", "Complete"],
    ["완료: 원본 문서에 `BlurXTerminator` 레이어를 추가했습니다.", "Complete: Added a `BlurXTerminator` layer to the original document."],
    ["지정 영역 마스크 적용 ·", "Selected-region mask applied ·"],
    ["BlurXTerminator 시작 실패:", "Failed to start BlurXTerminator:"],
    ["BlurXTerminator 취소 요청 중…", "Requesting BlurXTerminator cancellation…"],
    ["처리 취소 요청을 전달하지 못했습니다. 프로세스가 종료될 때까지 기다려 주세요.", "Could not send the cancellation request. Wait for the process to exit."],
    ["처리 취소 실패:", "Failed to cancel processing:"],
    ["Photoshop 문서 ID를 읽을 수 없습니다:", "Cannot read the Photoshop document ID:"],
    ["지원되지 않는 원본 색상 모드:", "Unsupported original color mode:"],
    ["색상 모드 변환 확인 실패:", "Failed to verify the color-mode conversion:"],
    ["지원되지 않는 원본 비트 심도:", "Unsupported original bit depth:"],
    ["비트 심도 변환 확인 실패:", "Failed to verify the bit-depth conversion:"],
    ["입력 문서 평탄화 실패:", "Failed to flatten the input document:"],
    ["입력 문서 RGB 변환 실패:", "Failed to convert the input document to RGB:"],
    ["입력 문서 32비트 변환 실패:", "Failed to convert the input document to 32-bit:"],
    ["결과 비트 심도 변환 실패:", "Failed to convert the result bit depth:"],
    ["결과 색상 모드 변환 실패:", "Failed to convert the result color mode:"],
    ["Photoshop 문서를 먼저 여세요.", "Open a Photoshop document first."],
    ["현재 레이어는 처리할 수 없습니다. 일반 픽셀 레이어나 스마트 오브젝트를 선택하세요.", "The current layer cannot be processed. Select a regular pixel layer or Smart Object."],
    ["현재 레이어가 문서 전체 프레임을 덮지 않습니다. 전체 프레임 픽셀 레이어나 스마트 오브젝트를 선택하세요.", "The current layer does not cover the full document frame. Select a full-frame pixel layer or Smart Object."],
    ["지정 영역 처리에는 선택 영역 또는 현재 레이어 마스크가 필요합니다.", "Selected-region processing requires a selection or current layer mask."],
    ["알 수 없는 처리 범위입니다:", "Unknown processing scope:"],
    ["처리 범위 확인 실패:", "Failed to validate the processing scope:"],
    ["하늘 영역 마스크 정보가 올바르지 않습니다.", "The selected-region mask data is invalid."],
    ["합성 색상 채널 활성화 실패:", "Failed to activate the composite color channel:"],
    ["하늘 선택 영역이나 현재 레이어 마스크가 없습니다.", "No selection or current layer mask is available."],
    ["현재 레이어 마스크에서 하늘 영역을 불러올 수 없습니다.", "Cannot load the selected region from the current layer mask."],
    ["하늘 영역 임시 저장 실패:", "Failed to save the temporary selected region:"],
    ["저장된 하늘 영역을 찾을 수 없습니다.", "Cannot find the saved selected region."],
    ["열려 있는 문서가 없습니다.", "No document is open."],
    ["하늘 영역 임시 데이터 정리 실패:", "Failed to clean temporary selected-region data:"],
    ["원본 문서를 찾을 수 없습니다:", "Cannot find the original document:"],
    ["개 ·", " files ·"]
  ];

  function format(text, values) {
    return String(text).replace(/\{([^}]+)\}/g, function (_, key) {
      return values && values[key] !== undefined ? values[key] : "";
    });
  }

  function t(key, values) {
    var table = strings[language] || strings.ko;
    return format(table[key] || strings.ko[key] || key, values);
  }

  function detectLanguage() {
    var locale = "";
    try {
      if (global.__adobe_cep__ && global.__adobe_cep__.getHostEnvironment) {
        locale = JSON.parse(global.__adobe_cep__.getHostEnvironment()).appLocale || "";
      }
    } catch (_) {}
    if (!locale) locale = navigator.language || navigator.userLanguage || "en";
    return /^ko(?:-|_|$)/i.test(locale) ? "ko" : "en";
  }

  function translateRuntime(text) {
    var output = String(text === undefined || text === null ? "" : text);
    if (language !== "en") return output;
    var pairs = [];
    var key;
    for (key in koToEn) if (koToEn.hasOwnProperty(key)) pairs.push([key, koToEn[key]]);
    pairs = pairs.concat(runtimePairs);
    pairs.sort(function (a, b) { return b[0].length - a[0].length; });
    for (var i = 0; i < pairs.length; i++) output = output.split(pairs[i][0]).join(pairs[i][1]);
    return output;
  }

  function translateTextNode(node) {
    var text = node.nodeValue;
    var trimmed = text.replace(/^\s+|\s+$/g, "");
    if (!node._bxtKoText && koToEn[trimmed]) node._bxtKoText = text;
    if (!node._bxtKoText) return;
    if (language === "ko") {
      node.nodeValue = node._bxtKoText;
    } else {
      var koTrimmed = node._bxtKoText.replace(/^\s+|\s+$/g, "");
      node.nodeValue = node._bxtKoText.replace(koTrimmed, koToEn[koTrimmed]);
    }
  }

  function translateElementAttributes(element) {
    var attrs = ["title", "aria-label"];
    element._bxtKoAttrs = element._bxtKoAttrs || {};
    for (var i = 0; i < attrs.length; i++) {
      var value = element.getAttribute && element.getAttribute(attrs[i]);
      if (!element._bxtKoAttrs[attrs[i]] && value && koToEn[value]) element._bxtKoAttrs[attrs[i]] = value;
      if (!element._bxtKoAttrs[attrs[i]]) continue;
      element.setAttribute(attrs[i], language === "ko" ? element._bxtKoAttrs[attrs[i]] : koToEn[element._bxtKoAttrs[attrs[i]]]);
    }
  }

  function walk(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      translateTextNode(node);
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      var tag = String(node.tagName || "").toLowerCase();
      if (tag === "script" || tag === "style") return;
      translateElementAttributes(node);
    }
    var child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  }

  function ensureLanguageControl() {
    var card = document.getElementById("settingsCard");
    var header = card && card.querySelector(".settings-header");
    if (!card || !header || document.getElementById("languageSelect")) return;
    var wrap = document.createElement("div");
    wrap.className = "language-setting";
    wrap.innerHTML =
      '<div class="row between language-row">' +
        '<label class="setting-label language-label" for="languageSelect"></label>' +
        '<select id="languageSelect" class="language-select">' +
          '<option value="auto"></option><option value="ko"></option><option value="en"></option>' +
        '</select>' +
      '</div><div class="hint language-hint"></div><div class="settings-divider"></div>';
    if (header.nextSibling) card.insertBefore(wrap, header.nextSibling);
    else card.appendChild(wrap);
  }

  function updateLanguageControl() {
    ensureLanguageControl();
    var select = document.getElementById("languageSelect");
    var label = document.querySelector(".language-label");
    var hint = document.querySelector(".language-hint");
    if (!select) return;
    label.textContent = t("language.label");
    hint.textContent = t("language.hint");
    select.options[0].text = t("language.auto");
    select.options[1].text = t("language.ko");
    select.options[2].text = t("language.en");
    select.value = preference;
  }

  function apply() {
    document.documentElement.lang = language;
    walk(document);
    updateLanguageControl();
  }

  function setPreference(value, persist) {
    preference = value === "ko" || value === "en" ? value : "auto";
    language = preference === "auto" ? detectLanguage() : preference;
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, preference); } catch (_) {}
    }
    apply();
    for (var i = 0; i < listeners.length; i++) listeners[i](language, preference);
  }

  function onChange(listener) {
    if (typeof listener === "function") listeners.push(listener);
  }

  try { preference = localStorage.getItem(STORAGE_KEY) || "auto"; } catch (_) {}
  global.BXT_I18N = {
    t: t,
    translate: translateRuntime,
    apply: apply,
    setPreference: setPreference,
    getLanguage: function () { return language; },
    getPreference: function () { return preference; },
    onChange: onChange
  };
  setPreference(preference, false);
}(window));