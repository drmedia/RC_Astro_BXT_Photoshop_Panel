(function () {
  "use strict";

  var BXT = window.BXT;
  var i18n = window.BXT_I18N;
  var view;

  try {
    if (!BXT || !BXT.shared || !BXT.platform || !BXT.platform.cep || !BXT.ui) {
      throw new Error("패널 모듈을 불러오지 못했습니다.");
    }

    view = BXT.ui.createPanelView(document, i18n);
    var files = BXT.shared.assertContract("filesystem", BXT.platform.cep.createFilesystemAdapter());
    var processRunner = BXT.shared.assertContract("processRunner", BXT.platform.cep.createProcessAdapter());
    var photoshop = BXT.shared.assertContract("photoshop", BXT.platform.cep.createPhotoshopAdapter());
    var settingsStore = BXT.shared.assertContract("settingsStore", BXT.platform.cep.createSettingsStore());
    var processingSettings = BXT.ui.createProcessingSettings(document);
    var appSettings = BXT.ui.createAppSettings({
      document: document,
      i18n: i18n,
      view: view,
      files: files,
      processRunner: processRunner,
      settingsStore: settingsStore,
      bxtCommand: BXT.shared.bxtCommand
    });
    var workflow = BXT.shared.createWorkflow({
      files: files,
      processRunner: processRunner,
      photoshop: photoshop,
      bxtCommand: BXT.shared.bxtCommand,
      view: view,
      processingSettings: processingSettings,
      appSettings: appSettings
    });

    var version = files.getManifestVersion(window.location.pathname || "");
    if (version) view.setVersion(version);

    processingSettings.init();
    view.initNavigation({
      onSettingsOpen: appSettings.validate,
      onMainOpen: workflow.refreshScopeStatus
    });
    appSettings.init(function () {
      view.syncDetailsLabel();
      workflow.refreshTempStatus();
      workflow.refreshScopeStatus();
      if (view.isViewOpen("settings")) appSettings.validate();
    });
    workflow.init();
  } catch (error) {
    if (view) view.showError("패널 초기화 실패: " + error.message);
    else {
      var message = document.getElementById("message");
      if (message) {
        message.className = "message error";
        message.textContent = "패널 초기화 실패: " + error.message;
      }
    }
  }
}());
