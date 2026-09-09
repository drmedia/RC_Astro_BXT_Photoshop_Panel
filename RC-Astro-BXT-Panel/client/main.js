(function () {
  "use strict";

  var fs, os, path, cp;
  try {
    fs = require("fs");
    os = require("os");
    path = require("path");
    cp = require("child_process");
  } catch (e) {
    showError("Node.js 초기화 실패: " + e.message);
  }

  var strength = document.getElementById("strength");
  var stars = document.getElementById("stars");
  var nonstellar = document.getElementById("nonstellar");
  var halos = document.getElementById("halos");
  var strengthValue = document.getElementById("strengthValue");
  var starsValue = document.getElementById("starsValue");
  var nonstellarValue = document.getElementById("nonstellarValue");
  var halosValue = document.getElementById("halosValue");
  var linkStrength = document.getElementById("linkStrength");
  var generalMode = document.getElementById("generalMode");
  var planetaryMode = document.getElementById("planetaryMode");
  var psfDiameter = document.getElementById("psfDiameter");
  var psfDiameterValue = document.getElementById("psfDiameterValue");
  var psfControl = document.getElementById("psfControl");
  var strengthControl = document.getElementById("strengthControl");
  var resetDetails = document.getElementById("resetDetails");
  var exePath = document.getElementById("exePath");
  var runBtn = document.getElementById("runBtn");
  var cancelBtn = document.getElementById("cancelBtn");
  var tempStatus = document.getElementById("tempStatus");
  var cleanupTempBtn = document.getElementById("cleanupTempBtn");
  var settingsButton = document.getElementById("settingsButton");
  var settingsCard = document.getElementById("settingsCard");
  var closeSettings = document.getElementById("closeSettings");
  var helpButton = document.getElementById("helpButton");
  var helpCard = document.getElementById("helpCard");
  var closeHelp = document.getElementById("closeHelp");
  var mainContent = document.getElementById("mainContent");
  var browsePath = document.getElementById("browsePath");
  var exeFilePicker = document.getElementById("exeFilePicker");
  var exeStatus = document.getElementById("exeStatus");
  var scopeTargetTitle = document.getElementById("scopeTargetTitle");
  var scopeTargetBadge = document.getElementById("scopeTargetBadge");
  var scopeTargetDescription = document.getElementById("scopeTargetDescription");
  var scopeMaskTitle = document.getElementById("scopeMaskTitle");
  var scopeMaskBadge = document.getElementById("scopeMaskBadge");
  var scopeMaskDescription = document.getElementById("scopeMaskDescription");
  var detailsToggle = document.getElementById("detailsToggle");
  var detailsPanel = document.getElementById("detailsPanel");
  var detailsToggleText = document.getElementById("detailsToggleText");
  var detailsChevron = document.getElementById("detailsChevron");
  var busyState = false;
  var lockedControls = [];
  var executableValidationToken = 0;
  var executableValidationTimer = null;
  var activeProcess = null;
  var currentRunFiles = [];
  var activeRunDocumentId = "";
  var activeRunMaskToken = "";
  var cancelRequested = false;
  var scopeStatusToken = 0;

  function showPanelVersion() {
    var versionElement = document.getElementById("panelVersion");
    if (!versionElement || !fs || !path) return;

    try {
      var htmlPath = decodeURIComponent(window.location.pathname || "");
      if (/^\/[A-Za-z]:\//.test(htmlPath)) htmlPath = htmlPath.substring(1);
      var manifestPath = path.resolve(path.dirname(htmlPath), "..", "CSXS", "manifest.xml");
      var manifestText = fs.readFileSync(manifestPath, "utf8");
      var match = /ExtensionBundleVersion\s*=\s*"([^"]+)"/.exec(manifestText);
      if (match) versionElement.textContent = "v" + match[1];
    } catch (_) {
      // HTML의 기본 버전 문구를 유지한다.
    }
  }

  showPanelVersion();

  function v(id, n) { document.getElementById(id).value = Number(n).toFixed(2); }
  function v1(id, n) { document.getElementById(id).value = Number(n).toFixed(1); }

  function setRangeFromNumber(range, numberInput, digits) {
    var value = Number(numberInput.value);
    if (!isFinite(value)) value = Number(range.value);
    value = Math.max(Number(range.min), Math.min(Number(range.max), value));
    range.value = value;
    numberInput.value = value.toFixed(digits);
  }

  function updateStrengthValues() {
    v("strengthValue", strength.value);
    if (linkStrength.checked) {
      stars.value = strength.value;
      nonstellar.value = strength.value;
      v("starsValue", stars.value);
      v("nonstellarValue", nonstellar.value);
    }
  }

  strength.addEventListener("input", updateStrengthValues);
  stars.addEventListener("input", function () { v("starsValue", stars.value); });
  nonstellar.addEventListener("input", function () { v("nonstellarValue", nonstellar.value); });
  halos.addEventListener("input", function () { v("halosValue", halos.value); });
  psfDiameter.addEventListener("input", function () { v1("psfDiameterValue", psfDiameter.value); });

  strengthValue.addEventListener("change", function () {
    setRangeFromNumber(strength, strengthValue, 2);
    updateStrengthValues();
  });
  starsValue.addEventListener("change", function () {
    setRangeFromNumber(stars, starsValue, 2);
  });
  nonstellarValue.addEventListener("change", function () {
    setRangeFromNumber(nonstellar, nonstellarValue, 2);
  });
  halosValue.addEventListener("change", function () {
    setRangeFromNumber(halos, halosValue, 2);
  });
  psfDiameterValue.addEventListener("change", function () {
    setRangeFromNumber(psfDiameter, psfDiameterValue, 1);
  });

  function showModeElements(className, visible) {
    var elements = document.querySelectorAll("." + className);
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.toggle("hidden", !visible);
    }
  }

  function updateModeControls() {
    var planetary = planetaryMode.checked;
    var linked = linkStrength.checked && !planetary;

    if (linked) updateStrengthValues();

    showModeElements("general-mode-only", !planetary);
    showModeElements("planetary-mode-only", planetary);
    strength.disabled = planetary || !linked;
    strengthValue.disabled = planetary || !linked;
    stars.disabled = planetary || linked;
    starsValue.disabled = planetary || linked;
    nonstellar.disabled = linked;
    nonstellarValue.disabled = linked;
    halos.disabled = planetary;
    halosValue.disabled = planetary;
    psfDiameter.disabled = !planetary;
    psfDiameterValue.disabled = !planetary;
    strengthControl.classList.toggle("disabled-control", !linked);
    stars.parentNode.classList.toggle("disabled-control", linked);
    nonstellar.parentNode.classList.toggle("disabled-control", linked);
  }

  generalMode.addEventListener("change", updateModeControls);
  planetaryMode.addEventListener("change", updateModeControls);
  linkStrength.addEventListener("change", function () {
    if (linkStrength.checked) updateStrengthValues();
    updateModeControls();
  });
  resetDetails.addEventListener("click", function () {
    generalMode.checked = true;
    planetaryMode.checked = false;
    linkStrength.checked = true;
    strength.value = "0.30";
    stars.value = "0.30";
    nonstellar.value = "0.30";
    halos.value = "0";
    psfDiameter.value = "2.0";
    v("strengthValue", strength.value);
    v("starsValue", stars.value);
    v("nonstellarValue", nonstellar.value);
    v("halosValue", halos.value);
    v1("psfDiameterValue", psfDiameter.value);
    updateModeControls();
  });
  updateModeControls();

  function setPanelView(view) {
    var settingsOpen = view === "settings";
    var helpOpen = view === "help";

    settingsCard.classList.toggle("hidden", !settingsOpen);
    helpCard.classList.toggle("hidden", !helpOpen);
    mainContent.classList.toggle("hidden", settingsOpen || helpOpen);
    settingsButton.classList.toggle("is-open", settingsOpen);
    helpButton.classList.toggle("is-open", helpOpen);
    settingsButton.setAttribute("aria-expanded", settingsOpen ? "true" : "false");
    helpButton.setAttribute("aria-expanded", helpOpen ? "true" : "false");

    if (settingsOpen) {
      validateExecutable();
      window.setTimeout(function () { exePath.focus(); }, 0);
    } else if (helpOpen) {
      window.setTimeout(function () { closeHelp.focus(); }, 0);
    } else {
      refreshScopeStatus();
    }
  }

  function setSettingsOpen(open) { setPanelView(open ? "settings" : "main"); }
  function setHelpOpen(open) { setPanelView(open ? "help" : "main"); }

  function setDetailsOpen(open) {
    detailsPanel.classList.toggle("hidden", !open);
    detailsToggle.classList.toggle("active", open);
    detailsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    detailsToggleText.textContent = open ? "세부 설정 닫기" : "세부 설정 보기";
    detailsChevron.textContent = open ? "▴" : "▾";
  }

  function setExecutableStatus(message, state, needsAttention) {
    exeStatus.textContent = message;
    exeStatus.className = "preflight-status" + (state ? " " + state : "");
    if (needsAttention) settingsButton.classList.add("needs-attention");
    else settingsButton.classList.remove("needs-attention");
    settingsButton.title = needsAttention ? "설정 · RC-Astro 확인 필요" : "설정";
  }

  function parseCatalogOutput(stdout) {
    var jsonText = String(stdout || "").replace(/^\uFEFF/, "");
    var jsonStart = jsonText.indexOf("{");
    var jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("JSON 응답이 없습니다.");
    return JSON.parse(jsonText.substring(jsonStart, jsonEnd + 1));
  }

  function validateExecutable() {
    if (busyState) return;
    if (executableValidationTimer) window.clearTimeout(executableValidationTimer);
    executableValidationTimer = null;
    var token = ++executableValidationToken;
    var executable = exePath.value.trim() || "rc-astro";

    if (!cp) {
      setExecutableStatus("Node.js를 사용할 수 없어 실행 파일을 확인할 수 없습니다.", "error", true);
      return;
    }

    setExecutableStatus("RC-Astro CLI와 BXT 정보를 확인하고 있습니다.", "checking", false);
    var options = cliExecOptions();
    options.timeout = 8000;
    cp.execFile(executable, ["--json", "bxt"], options, function (err, stdout, stderr) {
      if (token !== executableValidationToken) return;

      var catalog;
      try {
        catalog = parseCatalogOutput(stdout);
      } catch (_) {
        setExecutableStatus(
          "실행 파일을 찾을 수 없거나 RC-Astro BXT가 아닙니다." +
          (err && err.code === "ETIMEDOUT" ? " · 확인 시간 초과" : ""),
          "error",
          true
        );
        return;
      }

      if (catalog.key !== "bxt") {
        setExecutableStatus("BlurXTerminator 제품 정보를 확인할 수 없습니다.", "error", true);
        return;
      }

      var summary = "확인됨 · CLI " + (catalog.cliVersion || "unknown") +
        " · BXT ML" + (catalog.mlVersion || "unknown");
      if (catalog.license && catalog.license.valid === true) {
        setExecutableStatus(summary + " · 라이선스 정상", "", false);
      } else {
        setExecutableStatus(summary + " · 계정 인증 필요", "warning", true);
      }
    });
  }

  function scheduleExecutableValidation() {
    if (executableValidationTimer) window.clearTimeout(executableValidationTimer);
    setExecutableStatus("경로 변경을 확인하고 있습니다.", "checking", false);
    executableValidationTimer = window.setTimeout(validateExecutable, 400);
  }

  function useExecutablePath(filePath) {
    if (!filePath) return;
    exePath.value = filePath;
    try { localStorage.setItem("rcAstroExe", filePath); } catch (_) {}
    validateExecutable();
  }

  function browseExecutable() {
    try {
      if (window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialog === "function") {
        var currentPath = exePath.value.trim();
        var initialPath = path && path.isAbsolute(currentPath) ? path.dirname(currentPath) : "";
        var selection = window.cep.fs.showOpenDialog(
          false,
          false,
          "RC-Astro 실행 파일 선택",
          initialPath,
          ["exe"]
        );
        if (selection && selection.data && selection.data.length) {
          useExecutablePath(selection.data[0]);
        } else if (selection && selection.err) {
          setExecutableStatus("파일 선택 창을 열 수 없습니다: " + selection.err, "error", true);
        }
        return;
      }
    } catch (e) {
      setExecutableStatus("파일 선택 창 오류: " + e.message, "error", true);
      return;
    }
    exeFilePicker.value = "";
    exeFilePicker.click();
  }

  document.getElementById("savePath").addEventListener("click", function () {
    try { localStorage.setItem("rcAstroExe", exePath.value.trim() || "rc-astro"); } catch (_) {}
    validateExecutable();
  });
  settingsButton.addEventListener("click", function () {
    setSettingsOpen(settingsCard.className.indexOf("hidden") >= 0);
  });
  closeSettings.addEventListener("click", function () { setSettingsOpen(false); });
  helpButton.addEventListener("click", function () {
    setHelpOpen(helpCard.className.indexOf("hidden") >= 0);
  });
  closeHelp.addEventListener("click", function () { setHelpOpen(false); });

  var helpAccordions = document.querySelectorAll(".help-accordion");
  for (var helpIndex = 0; helpIndex < helpAccordions.length; helpIndex++) {
    (function (button) {
      button.addEventListener("click", function () {
        var answer = document.getElementById(button.getAttribute("aria-controls"));
        var open = button.getAttribute("aria-expanded") === "true";
        var chevron = button.querySelector(".help-chevron");
        button.setAttribute("aria-expanded", open ? "false" : "true");
        answer.classList.toggle("hidden", open);
        chevron.textContent = open ? "▾" : "▴";
      });
    }(helpAccordions[helpIndex]));
  }

  detailsToggle.addEventListener("click", function () {
    setDetailsOpen(detailsPanel.className.indexOf("hidden") >= 0);
  });
  browsePath.addEventListener("click", browseExecutable);
  exePath.addEventListener("input", scheduleExecutableValidation);
  exeFilePicker.addEventListener("change", function () {
    var file = exeFilePicker.files && exeFilePicker.files[0];
    var selectedPath = file && file.path ? file.path : exeFilePicker.value;
    if (selectedPath && selectedPath.indexOf("fakepath") === -1) {
      useExecutablePath(selectedPath);
    } else if (selectedPath) {
      setExecutableStatus("선택한 실행 파일의 전체 경로를 가져올 수 없습니다.", "error", true);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" && event.keyCode !== 27) return;
    if (settingsCard.className.indexOf("hidden") < 0) setSettingsOpen(false);
    else if (helpCard.className.indexOf("hidden") < 0) setHelpOpen(false);
  });

  try {
    var saved = localStorage.getItem("rcAstroExe");
    if (saved) exePath.value = saved;
  } catch (_) {}

  function evalPS(script, cb) {
    if (!window.__adobe_cep__) {
      cb("CEP 인터페이스를 사용할 수 없습니다.");
      return;
    }
    window.__adobe_cep__.evalScript(script, function (result) {
      cb(null, result);
    });
  }

  function escJs(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function scopeValue() {
    return "auto";
  }

  function setScopeBadge(element, text, tone) {
    var allowed = { success: true, error: true, warning: true, neutral: true, checking: true };
    element.textContent = text;
    element.className = "scope-state-badge " + (allowed[tone] ? tone : "neutral");
  }

  function renderScopeStatus(parts) {
    scopeTargetTitle.textContent = parts[1];
    setScopeBadge(scopeTargetBadge, parts[2], parts[3]);
    scopeTargetDescription.textContent = parts[4];
    scopeMaskTitle.textContent = parts[5];
    setScopeBadge(scopeMaskBadge, parts[6], parts[7]);
    scopeMaskDescription.textContent = parts[8];
  }

  function renderScopeStatusError(message) {
    renderScopeStatus([
      "ERR",
      "상태 확인 실패", "사용 불가", "error",
      message || "Photoshop 상태를 확인할 수 없습니다.",
      "적용 안 함", "확인 불가", "neutral",
      "Photoshop 문서와 현재 레이어를 다시 확인하세요."
    ]);
  }

  function refreshScopeStatus() {
    if (!scopeTargetTitle || !scopeTargetBadge || !scopeTargetDescription ||
        !scopeMaskTitle || !scopeMaskBadge || !scopeMaskDescription) return;

    var token = ++scopeStatusToken;
    setScopeBadge(scopeTargetBadge, "확인 중", "checking");
    evalPS('BXT_scopeInfo("' + escJs(scopeValue()) + '")', function (err, result) {
      if (token !== scopeStatusToken) return;
      if (err || !result) {
        renderScopeStatusError(err || "응답이 없습니다.");
        return;
      }

      var parts = String(result).split("|");
      if (parts.length < 9 || (parts[0] !== "OK" && parts[0] !== "ERR")) {
        renderScopeStatusError("처리 범위 상태 응답이 올바르지 않습니다.");
        return;
      }
      renderScopeStatus(parts);
    });
  }

  window.addEventListener("focus", refreshScopeStatus);
  refreshScopeStatus();

  function captureSettings() {
    return {
      exe: exePath.value.trim() || "rc-astro",
      scope: scopeValue(),
      planetary: planetaryMode.checked,
      psfDiameter: Number(psfDiameter.value).toFixed(1),
      stars: Number(stars.value).toFixed(2),
      nonstellar: Number(nonstellar.value).toFixed(2),
      halos: Number(halos.value).toFixed(2)
    };
  }

  function lockAllControls() {
    var controls = document.querySelectorAll("input, button");
    lockedControls = [];
    for (var i = 0; i < controls.length; i++) {
      lockedControls.push({ element: controls[i], disabled: controls[i].disabled });
      controls[i].disabled = true;
    }
  }

  function unlockAllControls() {
    for (var i = 0; i < lockedControls.length; i++) {
      lockedControls[i].element.disabled = lockedControls[i].disabled;
    }
    lockedControls = [];
  }

  function setBusy(busy, text) {
    if (busy && !busyState) lockAllControls();
    if (!busy && busyState) unlockAllControls();
    busyState = busy;
    runBtn.disabled = busy;
    document.getElementById("runText").textContent = text || (busy ? "처리 중…" : "BlurXTerminator 실행");
    document.getElementById("progressWrap").className = busy ? "progress-wrap" : "progress-wrap hidden";
  }

  function setCancelAvailable(available) {
    runBtn.classList.toggle("hidden", available);
    cancelBtn.classList.toggle("hidden", !available);
    cancelBtn.disabled = !available;
  }

  function resetActiveRunState() {
    activeProcess = null;
    currentRunFiles = [];
    activeRunDocumentId = "";
    activeRunMaskToken = "";
    cancelRequested = false;
    setCancelAvailable(false);
  }

  function setProgress(p, text) {
    document.getElementById("progressBar").style.width = p + "%";
    document.getElementById("status").textContent = text || "";
  }

  function showError(msg) {
    var el = document.getElementById("message");
    el.className = "message error";
    el.textContent = msg;
  }
  function showOk(msg) {
    var el = document.getElementById("message");
    el.className = "message ok";
    el.textContent = msg;
  }
  function clearMsg() {
    var el = document.getElementById("message");
    el.className = "message";
    el.textContent = "";
  }

  function cleanupTempFiles(files) {
    var failures = [];
    for (var i = 0; i < files.length; i++) {
      if (!files[i]) continue;
      try {
        if (fs.existsSync(files[i])) fs.unlinkSync(files[i]);
      } catch (e) {
        failures.push(path.basename(files[i]) + ": " + e.message);
      }
    }
    refreshTempStatus();
    return failures;
  }

  function ensureTempDirectory(dir) {
    if (fs.existsSync(dir)) return;

    try {
      // os.tmpdir()은 이미 존재하므로 구형 CEP Node.js에서도 지원되는
      // 단일 폴더 생성 방식만 사용한다.
      fs.mkdirSync(dir);
    } catch (e) {
      // 다른 패널 인스턴스가 동시에 만든 경우는 성공으로 처리한다.
      if (!fs.existsSync(dir)) throw e;
    }
  }

  function cleanupWarning(failures) {
    return failures.length
      ? "\n\n임시 TIFF 정리 실패:\n" + failures.join("\n")
      : "";
  }

  function discardPhotoshopMask(documentId, maskToken, callback) {
    callback = callback || function () {};
    if (!documentId || !maskToken) {
      callback(null);
      return;
    }
    var finished = false;
    var timeoutId = window.setTimeout(function () {
      if (finished) return;
      finished = true;
      callback("Photoshop 응답 시간 초과");
    }, 3000);
    evalPS(
      'BXT_discardMask("' + escJs(documentId) + '","' + escJs(maskToken) + '")',
      function (err, result) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeoutId);
        if (err || result !== "OK") {
          callback(err || result || "알 수 없는 오류");
        } else {
          callback(null);
        }
      }
    );
  }

  function finishRunFailure(message, cleanupFailures) {
    var documentId = activeRunDocumentId;
    var maskToken = activeRunMaskToken;
    discardPhotoshopMask(documentId, maskToken, function (maskError) {
      resetActiveRunState();
      setBusy(false);
      refreshScopeStatus();
      showError(
        message + cleanupWarning(cleanupFailures || []) +
        (maskError ? "\n\nPhotoshop 임시 마스크 정리 실패:\n" + maskError : "")
      );
    });
  }

  function cleanupStaleTempFiles(dir) {
    var cutoff = Date.now() - (24 * 60 * 60 * 1000);
    var names;
    try {
      names = fs.readdirSync(dir);
    } catch (_) {
      return;
    }

    for (var i = 0; i < names.length; i++) {
      if (!/^bxt_(input|output)_\d+(?:_\d+)?\.tif$/i.test(names[i])) continue;
      var file = path.join(dir, names[i]);
      try {
        if (fs.statSync(file).mtime.getTime() < cutoff) fs.unlinkSync(file);
      } catch (_) {}
    }
  }

  function generatedTempFiles() {
    var dir = path.join(os.tmpdir(), "RC_Astro_BXT_Photoshop");
    var files = [];
    var names;

    if (!fs.existsSync(dir)) return files;
    try {
      names = fs.readdirSync(dir);
    } catch (_) {
      return files;
    }

    for (var i = 0; i < names.length; i++) {
      if (!/^bxt_(input|output)_\d+(?:_\d+)?\.tif$/i.test(names[i])) continue;
      var file = path.join(dir, names[i]);
      try {
        var stat = fs.statSync(file);
        if (stat.isFile()) files.push({ path: file, size: stat.size, modified: stat.mtime.getTime() });
      } catch (_) {}
    }
    return files;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }

  function refreshTempStatus() {
    if (!tempStatus || !fs || !os || !path) return;
    var files = generatedTempFiles();
    var total = 0;
    for (var i = 0; i < files.length; i++) total += files[i].size;
    tempStatus.textContent = files.length + "개 · " + formatBytes(total);
  }

  cleanupTempBtn.addEventListener("click", function () {
    clearMsg();
    if (!fs || !os || !path) {
      showError("Node.js 모듈을 사용할 수 없어 임시 파일을 정리할 수 없습니다.");
      return;
    }

    var files = generatedTempFiles();
    var cutoff = Date.now() - (10 * 60 * 1000);
    var deleted = 0;
    var deletedBytes = 0;
    var protectedCount = 0;
    var failures = [];

    for (var i = 0; i < files.length; i++) {
      if (files[i].modified >= cutoff) {
        protectedCount++;
        continue;
      }
      try {
        fs.unlinkSync(files[i].path);
        deleted++;
        deletedBytes += files[i].size;
      } catch (e) {
        failures.push(path.basename(files[i].path) + ": " + e.message);
      }
    }

    refreshTempStatus();
    var summary = deleted + "개 삭제 · " + formatBytes(deletedBytes) + " 확보";
    if (protectedCount) summary += "\n최근 파일 " + protectedCount + "개 보호";
    if (failures.length) {
      showError(summary + "\n\n삭제 실패:\n" + failures.join("\n"));
    } else {
      showOk(summary);
    }
  });

  refreshTempStatus();
  validateExecutable();

  function cliExecOptions() {
    return {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    };
  }

  function hasBXTParameter(catalog, name, flag) {
    if (!catalog.parameters || !catalog.parameters.length) return false;
    for (var i = 0; i < catalog.parameters.length; i++) {
      if (catalog.parameters[i].name === name || catalog.parameters[i].flag === flag) return true;
    }
    return false;
  }

  function preflightBXT(settings, callback) {
    var options = cliExecOptions();
    options.timeout = 15000;
    cp.execFile(settings.exe, ["--json", "bxt"], options, function (err, stdout, stderr) {
      if (err) {
        callback(
          "RC-Astro CLI 사전 점검 실패:\n" +
          (stderr || stdout || err.message || "실행 파일을 시작할 수 없습니다.")
        );
        return;
      }

      var catalog;
      try {
        var jsonText = String(stdout || "").replace(/^\uFEFF/, "");
        var jsonStart = jsonText.indexOf("{");
        var jsonEnd = jsonText.lastIndexOf("}");
        if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("JSON 응답이 없습니다.");
        catalog = JSON.parse(jsonText.substring(jsonStart, jsonEnd + 1));
      } catch (e) {
        callback("RC-Astro CLI 응답을 해석할 수 없습니다: " + e.message);
        return;
      }

      if (catalog.key !== "bxt") {
        callback("RC-Astro CLI에서 BlurXTerminator 제품 정보를 확인할 수 없습니다.");
        return;
      }

      if (!catalog.license || catalog.license.valid !== true) {
        callback(
          "BlurXTerminator 라이선스를 사용할 수 없습니다.\n" +
          ((catalog.license && catalog.license.message) || "라이선스 상태를 확인하세요.") +
          "\n\n명령 프롬프트에서 `rc-astro license`를 실행해 확인하세요."
        );
        return;
      }

      if (
        !hasBXTParameter(catalog, "sn", "--sn") ||
        (!settings.planetary && !hasBXTParameter(catalog, "ss", "--ss")) ||
        (!settings.planetary && !hasBXTParameter(catalog, "ash", "--ash"))
      ) {
        callback("설치된 RC-Astro CLI가 필요한 BlurXTerminator 파라미터를 지원하지 않습니다.");
        return;
      }

      if (settings.planetary) {
        if (Number(catalog.mlVersion) < 5) {
          callback(
            "Lunar / Planetary 모드는 BlurXTerminator ML5 이상이 필요합니다.\n" +
            "현재 ML 버전: " + (catalog.mlVersion || "확인 불가")
          );
          return;
        }
        if (!hasBXTParameter(catalog, "lp", "--lp") || !hasBXTParameter(catalog, "nsd", "--nsd")) {
          callback("설치된 RC-Astro CLI가 Lunar / Planetary 모드를 지원하지 않습니다.");
          return;
        }
      }

      callback(null, {
        cliVersion: catalog.cliVersion || "unknown",
        mlVersion: catalog.mlVersion || "unknown"
      });
    });
  }

  function runBXT(inputFile, outputFile, settings, callback) {
    var exe = settings.exe;
    var args = ["bxt", inputFile];

    if (settings.planetary) {
      args.push("--lp");
      args.push("--nsd", settings.psfDiameter);
    } else {
      args.push("--sharpen-stars", settings.stars);
      args.push("--adjust-star-halos", settings.halos);
    }

    args.push("--sharpen-nonstellar", settings.nonstellar);
    args.push("--output", outputFile);
    args.push("--overwrite");

    return cp.execFile(exe, args, cliExecOptions(), function (err, stdout, stderr) {
      callback(err, stdout || "", stderr || "");
    });
  }

  runBtn.addEventListener("click", function () {
    clearMsg();
    if (!fs || !os || !path || !cp) {
      showError("Node.js 모듈을 사용할 수 없습니다. CEP 설정을 확인하세요.");
      return;
    }

    var settings = captureSettings();
    if (settings.planetary && Number(settings.psfDiameter) <= 0) {
      showError("Lunar / Planetary 모드에서는 0보다 큰 PSF Diameter가 필요합니다.");
      return;
    }

    resetActiveRunState();
    setBusy(true, "처리 범위 확인 중…");
    setProgress(2, "Photoshop 문서와 처리 범위 확인 중…");

    evalPS('BXT_validateScope("' + escJs(settings.scope) + '")', function (scopeError, scopeResult) {
      if (scopeError || scopeResult !== "OK") {
        setBusy(false);
        refreshScopeStatus();
        showError("Photoshop 처리 범위 확인 실패:\n" + (scopeError || scopeResult || "알 수 없는 오류"));
        return;
      }

      refreshScopeStatus();
      setBusy(true, "RC-Astro 확인 중…");
      setProgress(5, "CLI·라이선스·기능 확인 중…");

      preflightBXT(settings, function (preflightError, cliInfo) {
        if (preflightError) {
          setBusy(false);
          showError(preflightError);
          return;
        }

        var stamp = Date.now() + "_" + Math.floor(Math.random() * 1000000);
        var dir = path.join(os.tmpdir(), "RC_Astro_BXT_Photoshop");
        try { ensureTempDirectory(dir); } catch (e) {
          setBusy(false);
          showError("임시 폴더 생성 실패: " + e.message);
          return;
        }
        cleanupStaleTempFiles(dir);

        var input = path.join(dir, "bxt_input_" + stamp + ".tif");
        var output = path.join(dir, "bxt_output_" + stamp + ".tif");
        currentRunFiles = [input, output];

        setBusy(true, "입력 이미지 준비 중…");
        setProgress(
          15,
          "CLI " + cliInfo.cliVersion + " · ML" + cliInfo.mlVersion + " 확인 완료 · 32-bit TIFF 준비 중…"
        );

        var jsx = 'BXT_exportInput("' + escJs(input) + '","' + settings.scope + '")';
        evalPS(jsx, function (err, result) {
          if (err || !result || result.indexOf("OK|") !== 0) {
            var exportCleanupFailures = cleanupTempFiles(currentRunFiles);
            resetActiveRunState();
            setBusy(false);
            showError(
              "Photoshop 입력 준비 실패:\n" + (err || result || "알 수 없는 오류") +
              cleanupWarning(exportCleanupFailures)
            );
            return;
          }

          var documentPayload = result.substring(3);
          var documentSeparator = documentPayload.indexOf("|");
          var maskSeparator = documentPayload.indexOf("|", documentSeparator + 1);
          if (documentSeparator <= 0 || maskSeparator < 0) {
            var payloadCleanupFailures = cleanupTempFiles(currentRunFiles);
            resetActiveRunState();
            setBusy(false);
            showError(
              "Photoshop 문서 식별 정보가 올바르지 않습니다:\n" + result +
              cleanupWarning(payloadCleanupFailures)
            );
            return;
          }

          var originalDocId = documentPayload.substring(0, documentSeparator);
          var maskToken = documentPayload.substring(documentSeparator + 1, maskSeparator);
          var originalDocName = documentPayload.substring(maskSeparator + 1);
          if (!/^\d+$/.test(originalDocId)) {
            var idCleanupFailures = cleanupTempFiles(currentRunFiles);
            resetActiveRunState();
            setBusy(false);
            showError(
              "Photoshop 문서 ID가 올바르지 않습니다: " + originalDocId +
              cleanupWarning(idCleanupFailures)
            );
            return;
          }

          activeRunDocumentId = originalDocId;
          activeRunMaskToken = maskToken;
          cancelRequested = false;
          setProgress(40, "RC-Astro BlurXTerminator 실행 중…");
          setBusy(true, "BlurXTerminator 처리 중…");

          try {
            activeProcess = runBXT(input, output, settings, function (procErr, stdout, stderr) {
              activeProcess = null;
              setCancelAvailable(false);

              if (cancelRequested) {
                var cancelCleanupFailures = cleanupTempFiles(currentRunFiles);
                finishRunFailure("BlurXTerminator 처리를 취소했습니다.", cancelCleanupFailures);
                return;
              }

              if (procErr || !fs.existsSync(output)) {
                var processCleanupFailures = cleanupTempFiles(currentRunFiles);
                var detail = stderr || stdout || (procErr && procErr.message) || "출력 파일이 생성되지 않았습니다.";
                finishRunFailure(
                  "BlurXTerminator 실행 실패\n\n" + detail +
                  "\n\n확인: 명령 프롬프트에서 `rc-astro bxt`가 실행되는지 확인하세요.",
                  processCleanupFailures
                );
                return;
              }

              setProgress(85, "결과를 Photoshop 레이어로 가져오는 중…");
              setBusy(true, "결과 가져오는 중…");

              var importJsx =
                'BXT_importResult("' + escJs(output) + '","' + escJs(originalDocId) +
                '","' + escJs(originalDocName) + '","' + escJs(maskToken) + '")';
              evalPS(importJsx, function (impErr, impResult) {
                var importCleanupFailures = cleanupTempFiles(currentRunFiles);
                if (impErr || impResult !== "OK") {
                  finishRunFailure(
                    "결과 가져오기 실패:\n" + (impErr || impResult || "알 수 없는 오류"),
                    importCleanupFailures
                  );
                  return;
                }

                resetActiveRunState();
                setBusy(false);
                refreshScopeStatus();
                setProgress(100, "완료");
                document.getElementById("progressWrap").className = "progress-wrap";
                showOk(
                  "완료: 원본 문서에 `BlurXTerminator` 레이어를 추가했습니다.\n" +
                  (maskToken ? "지정 영역 마스크 적용 · " : "") +
                  (settings.planetary
                    ? "Lunar / Planetary · PSF " + settings.psfDiameter + " px"
                    : "Stars " + settings.stars + " · Halos " + settings.halos) +
                  " · Nonstellar " + settings.nonstellar +
                  cleanupWarning(importCleanupFailures)
                );
                setTimeout(function () {
                  document.getElementById("progressWrap").className = "progress-wrap hidden";
                }, 2500);
              });
            });
            setCancelAvailable(true);
          } catch (processStartError) {
            var startCleanupFailures = cleanupTempFiles(currentRunFiles);
            finishRunFailure("BlurXTerminator 시작 실패:\n" + processStartError.message, startCleanupFailures);
          }
        });
      });
    });
  });

  cancelBtn.addEventListener("click", function () {
    if (!activeProcess || cancelRequested) return;
    cancelRequested = true;
    cancelBtn.disabled = true;
    setProgress(40, "BlurXTerminator 취소 요청 중…");
    try {
      if (!activeProcess.kill()) {
        showError("처리 취소 요청을 전달하지 못했습니다. 프로세스가 종료될 때까지 기다려 주세요.");
      }
    } catch (e) {
      showError("처리 취소 실패: " + e.message);
    }
  });

  window.addEventListener("beforeunload", function () {
    try { if (activeProcess) activeProcess.kill(); } catch (_) {}
    for (var i = 0; i < currentRunFiles.length; i++) {
      try { if (fs && fs.existsSync(currentRunFiles[i])) fs.unlinkSync(currentRunFiles[i]); } catch (_) {}
    }
    if (activeRunDocumentId && activeRunMaskToken) {
      try {
        evalPS(
          'BXT_discardMask("' + escJs(activeRunDocumentId) + '","' + escJs(activeRunMaskToken) + '")',
          function () {}
        );
      } catch (_) {}
    }
  });
})();
