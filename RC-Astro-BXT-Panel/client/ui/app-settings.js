(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.ui = BXT.ui || {};

  BXT.ui.createAppSettings = function (options) {
    var document = options.document;
    var i18n = options.i18n;
    var view = options.view;
    var files = options.files;
    var processRunner = options.processRunner;
    var settingsStore = options.settingsStore;
    var bxtCommand = options.bxtCommand;
    var exePath = document.getElementById("exePath");
    var languageSelect = document.getElementById("languageSelect");
    var exeFilePicker = document.getElementById("exeFilePicker");
    var validationToken = 0;
    var validationTimer = null;

    function tr(text) {
      return i18n ? i18n.translate(text) : String(text === undefined || text === null ? "" : text);
    }

    function executable() { return exePath.value.trim() || "rc-astro"; }

    function validate() {
      if (view.isBusy()) return;
      if (validationTimer) root.clearTimeout(validationTimer);
      validationTimer = null;
      var token = ++validationToken;

      if (!processRunner.isAvailable()) {
        view.setExecutableStatus("Node.js를 사용할 수 없어 실행 파일을 확인할 수 없습니다.", "error", true);
        return;
      }

      view.setExecutableStatus("RC-Astro CLI와 BXT 정보를 확인하고 있습니다.", "checking", false);
      processRunner.readCatalog(executable(), 8000, function (err, stdout) {
        if (token !== validationToken) return;
        var catalog;
        try {
          catalog = bxtCommand.parseCatalogOutput(stdout);
        } catch (_) {
          view.setExecutableStatus(
            "실행 파일을 찾을 수 없거나 RC-Astro BXT가 아닙니다." +
            (err && err.code === "ETIMEDOUT" ? " · 확인 시간 초과" : ""),
            "error",
            true
          );
          return;
        }
        if (catalog.key !== "bxt") {
          view.setExecutableStatus("BlurXTerminator 제품 정보를 확인할 수 없습니다.", "error", true);
          return;
        }
        var summary = "확인됨 · CLI " + (catalog.cliVersion || "unknown") +
          " · BXT ML" + (catalog.mlVersion || "unknown");
        if (catalog.license && catalog.license.valid === true) {
          view.setExecutableStatus(summary + " · 라이선스 정상", "", false);
        } else {
          view.setExecutableStatus(summary + " · 계정 인증 필요", "warning", true);
        }
      });
    }

    function scheduleValidation() {
      if (validationTimer) root.clearTimeout(validationTimer);
      view.setExecutableStatus("경로 변경을 확인하고 있습니다.", "checking", false);
      validationTimer = root.setTimeout(validate, 400);
    }

    function useExecutablePath(filePath) {
      if (!filePath) return;
      exePath.value = filePath;
      settingsStore.setExecutable(filePath);
      validate();
    }

    function browse() {
      try {
        var result = files.browseExecutable(executable(), tr("RC-Astro 실행 파일 선택"));
        if (result.path) {
          useExecutablePath(result.path);
          return;
        }
        if (result.error) {
          view.setExecutableStatus("파일 선택 창을 열 수 없습니다: " + result.error, "error", true);
          return;
        }
        if (!result.unsupported) return;
      } catch (e) {
        view.setExecutableStatus("파일 선택 창 오류: " + e.message, "error", true);
        return;
      }
      exeFilePicker.value = "";
      exeFilePicker.click();
    }

    function init(onLanguageChanged) {
      var saved = settingsStore.getExecutable();
      if (saved) exePath.value = saved;
      document.getElementById("savePath").addEventListener("click", function () {
        settingsStore.setExecutable(executable());
        validate();
      });
      document.getElementById("browsePath").addEventListener("click", browse);
      exePath.addEventListener("input", scheduleValidation);
      exeFilePicker.addEventListener("change", function () {
        var file = exeFilePicker.files && exeFilePicker.files[0];
        var selectedPath = file && file.path ? file.path : exeFilePicker.value;
        if (selectedPath && selectedPath.indexOf("fakepath") === -1) useExecutablePath(selectedPath);
        else if (selectedPath) view.setExecutableStatus("선택한 실행 파일의 전체 경로를 가져올 수 없습니다.", "error", true);
      });
      if (languageSelect && i18n) {
        languageSelect.addEventListener("change", function () { i18n.setPreference(languageSelect.value); });
        i18n.onChange(function () { if (onLanguageChanged) onLanguageChanged(); });
      }
      validate();
    }

    return {
      init: init,
      validate: validate,
      getExecutable: executable
    };
  };
}(window));
