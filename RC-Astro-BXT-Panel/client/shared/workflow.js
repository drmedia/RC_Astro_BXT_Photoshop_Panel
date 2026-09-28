(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.shared = BXT.shared || {};

  BXT.shared.createWorkflow = function (options) {
    var files = options.files;
    var processRunner = options.processRunner;
    var photoshop = options.photoshop;
    var bxtCommand = options.bxtCommand;
    var view = options.view;
    var processingSettings = options.processingSettings;
    var appSettings = options.appSettings;
    var activeProcess = null;
    var currentRunFiles = [];
    var activeRunDocumentId = "";
    var activeRunMaskToken = "";
    var cancelRequested = false;
    var scopeStatusToken = 0;

    function cleanupWarning(failures) {
      return failures.length ? "\n\n임시 TIFF 정리 실패:\n" + failures.join("\n") : "";
    }

    function refreshTempStatus() {
      if (!files.isAvailable()) return;
      view.refreshTempStatus(files.listGeneratedFiles());
    }

    function cleanupFiles(paths) {
      var failures = files.cleanupFiles(paths || []);
      refreshTempStatus();
      return failures;
    }

    function resetActiveRunState() {
      activeProcess = null;
      currentRunFiles = [];
      activeRunDocumentId = "";
      activeRunMaskToken = "";
      cancelRequested = false;
      view.setCancelAvailable(false);
    }

    function finishRunFailure(message, cleanupFailures) {
      var documentId = activeRunDocumentId;
      var maskToken = activeRunMaskToken;
      photoshop.discardMask(documentId, maskToken, function (maskError) {
        resetActiveRunState();
        view.setBusy(false);
        refreshScopeStatus();
        view.showError(
          message + cleanupWarning(cleanupFailures || []) +
          (maskError ? "\n\nPhotoshop 임시 마스크 정리 실패:\n" + maskError : "")
        );
      });
    }

    function refreshScopeStatus() {
      var token = ++scopeStatusToken;
      view.setScopeChecking();
      photoshop.scopeInfo("auto", function (err, result) {
        if (token !== scopeStatusToken) return;
        if (err || !result) {
          view.renderScopeError(err || "응답이 없습니다.");
          return;
        }
        var parts = String(result).split("|");
        if (parts.length < 9 || (parts[0] !== "OK" && parts[0] !== "ERR")) {
          view.renderScopeError("처리 범위 상태 응답이 올바르지 않습니다.");
          return;
        }
        view.renderScopeStatus(parts);
      });
    }

    function preflight(settings, callback) {
      processRunner.readCatalog(settings.exe, 15000, function (err, stdout, stderr) {
        if (err) {
          callback(
            "RC-Astro CLI 사전 점검 실패:\n" +
            (stderr || stdout || err.message || "실행 파일을 시작할 수 없습니다.")
          );
          return;
        }
        var catalog;
        try {
          catalog = bxtCommand.parseCatalogOutput(stdout);
        } catch (e) {
          callback("RC-Astro CLI 응답을 해석할 수 없습니다: " + e.message);
          return;
        }
        var validation = bxtCommand.validateCatalog(catalog, settings);
        callback(validation.error || null, validation.info || null);
      });
    }

    function start() {
      view.clearMessage();
      if (!files.isAvailable() || !processRunner.isAvailable()) {
        view.showError("Node.js 모듈을 사용할 수 없습니다. CEP 설정을 확인하세요.");
        return;
      }
      if (!photoshop.isAvailable()) {
        view.showError("CEP 인터페이스를 사용할 수 없습니다.");
        return;
      }

      var settings = processingSettings.capture(appSettings.getExecutable());
      if (settings.planetary && Number(settings.psfDiameter) <= 0) {
        view.showError("Lunar / Planetary 모드에서는 0보다 큰 PSF Diameter가 필요합니다.");
        return;
      }

      resetActiveRunState();
      view.setBusy(true, "처리 범위 확인 중…");
      view.setProgress(2, "Photoshop 문서와 처리 범위 확인 중…");
      photoshop.validateScope(settings.scope, function (scopeError, scopeResult) {
        if (scopeError || scopeResult !== "OK") {
          view.setBusy(false);
          refreshScopeStatus();
          view.showError("Photoshop 처리 범위 확인 실패:\n" + (scopeError || scopeResult || "알 수 없는 오류"));
          return;
        }

        refreshScopeStatus();
        view.setBusy(true, "RC-Astro 확인 중…");
        view.setProgress(5, "CLI·라이선스·기능 확인 중…");
        preflight(settings, function (preflightError, cliInfo) {
          if (preflightError) {
            view.setBusy(false);
            view.showError(preflightError);
            return;
          }

          var runFiles;
          try {
            runFiles = files.createRunFiles();
          } catch (e) {
            view.setBusy(false);
            view.showError("임시 폴더 생성 실패: " + e.message);
            return;
          }
          currentRunFiles = [runFiles.input, runFiles.output];
          view.setBusy(true, "입력 이미지 준비 중…");
          view.setProgress(15, "CLI " + cliInfo.cliVersion + " · ML" + cliInfo.mlVersion + " 확인 완료 · 32-bit TIFF 준비 중…");

          photoshop.exportInput(runFiles.input, settings.scope, function (exportError, exportResult) {
            if (exportError || !exportResult || exportResult.indexOf("OK|") !== 0) {
              var exportCleanupFailures = cleanupFiles(currentRunFiles);
              resetActiveRunState();
              view.setBusy(false);
              view.showError(
                "Photoshop 입력 준비 실패:\n" + (exportError || exportResult || "알 수 없는 오류") +
                cleanupWarning(exportCleanupFailures)
              );
              return;
            }

            var payload = exportResult.substring(3);
            var documentSeparator = payload.indexOf("|");
            var maskSeparator = payload.indexOf("|", documentSeparator + 1);
            if (documentSeparator <= 0 || maskSeparator < 0) {
              var payloadCleanupFailures = cleanupFiles(currentRunFiles);
              resetActiveRunState();
              view.setBusy(false);
              view.showError(
                "Photoshop 문서 식별 정보가 올바르지 않습니다:\n" + exportResult +
                cleanupWarning(payloadCleanupFailures)
              );
              return;
            }

            var originalDocId = payload.substring(0, documentSeparator);
            var maskToken = payload.substring(documentSeparator + 1, maskSeparator);
            var originalDocName = payload.substring(maskSeparator + 1);
            if (!/^\d+$/.test(originalDocId)) {
              var idCleanupFailures = cleanupFiles(currentRunFiles);
              resetActiveRunState();
              view.setBusy(false);
              view.showError(
                "Photoshop 문서 ID가 올바르지 않습니다: " + originalDocId +
                cleanupWarning(idCleanupFailures)
              );
              return;
            }

            activeRunDocumentId = originalDocId;
            activeRunMaskToken = maskToken;
            cancelRequested = false;
            view.setProgress(40, "RC-Astro BlurXTerminator 실행 중…");
            view.setBusy(true, "BlurXTerminator 처리 중…");

            try {
              var args = bxtCommand.buildArguments(runFiles.input, runFiles.output, settings);
              activeProcess = processRunner.run(settings.exe, args, function (processError, stdout, stderr) {
                activeProcess = null;
                view.setCancelAvailable(false);
                if (cancelRequested) {
                  finishRunFailure("BlurXTerminator 처리를 취소했습니다.", cleanupFiles(currentRunFiles));
                  return;
                }
                if (processError || !files.exists(runFiles.output)) {
                  var processCleanupFailures = cleanupFiles(currentRunFiles);
                  var detail = stderr || stdout || (processError && processError.message) || "출력 파일이 생성되지 않았습니다.";
                  finishRunFailure(
                    "BlurXTerminator 실행 실패\n\n" + detail +
                    "\n\n확인: 명령 프롬프트에서 `rc-astro bxt`가 실행되는지 확인하세요.",
                    processCleanupFailures
                  );
                  return;
                }

                view.setProgress(85, "결과를 Photoshop 레이어로 가져오는 중…");
                view.setBusy(true, "결과 가져오는 중…");
                photoshop.importResult(
                  runFiles.output,
                  originalDocId,
                  originalDocName,
                  maskToken,
                  function (importError, importResult) {
                    var importCleanupFailures = cleanupFiles(currentRunFiles);
                    if (importError || importResult !== "OK") {
                      finishRunFailure(
                        "결과 가져오기 실패:\n" + (importError || importResult || "알 수 없는 오류"),
                        importCleanupFailures
                      );
                      return;
                    }
                    resetActiveRunState();
                    view.setBusy(false);
                    refreshScopeStatus();
                    view.setProgress(100, "완료");
                    view.showProgressTemporarily();
                    view.showOk(
                      "완료: 원본 문서에 `BlurXTerminator` 레이어를 추가했습니다.\n" +
                      (maskToken ? "지정 영역 마스크 적용 · " : "") +
                      (settings.planetary
                        ? "Lunar / Planetary · PSF " + settings.psfDiameter + " px"
                        : "Stars " + settings.stars + " · Halos " + settings.halos) +
                      " · Nonstellar " + settings.nonstellar +
                      cleanupWarning(importCleanupFailures)
                    );
                  }
                );
              });
              view.setCancelAvailable(true);
            } catch (processStartError) {
              finishRunFailure(
                "BlurXTerminator 시작 실패:\n" + processStartError.message,
                cleanupFiles(currentRunFiles)
              );
            }
          });
        });
      });
    }

    function cancel() {
      if (!activeProcess || cancelRequested) return;
      cancelRequested = true;
      view.setCancelPending();
      view.setProgress(40, "BlurXTerminator 취소 요청 중…");
      try {
        if (!processRunner.terminate(activeProcess)) {
          view.showError("처리 취소 요청을 전달하지 못했습니다. 프로세스가 종료될 때까지 기다려 주세요.");
        }
      } catch (e) {
        view.showError("처리 취소 실패: " + e.message);
      }
    }

    function cleanupGeneratedFiles() {
      view.clearMessage();
      if (!files.isAvailable()) {
        view.showError("Node.js 모듈을 사용할 수 없어 임시 파일을 정리할 수 없습니다.");
        return;
      }
      var result = files.cleanupOlderThan(10 * 60 * 1000);
      refreshTempStatus();
      var summary = result.deleted + "개 삭제 · " + view.formatBytes(result.deletedBytes) + " 확보";
      if (result.protectedCount) summary += "\n최근 파일 " + result.protectedCount + "개 보호";
      if (result.failures.length) view.showError(summary + "\n\n삭제 실패:\n" + result.failures.join("\n"));
      else view.showOk(summary);
    }

    function dispose() {
      try { if (activeProcess) processRunner.terminate(activeProcess); } catch (_) {}
      try { if (files.isAvailable()) files.cleanupFiles(currentRunFiles); } catch (_) {}
      if (activeRunDocumentId && activeRunMaskToken) {
        try { photoshop.discardMask(activeRunDocumentId, activeRunMaskToken, function () {}); } catch (_) {}
      }
    }

    function init() {
      view.onRun(start);
      view.onCancel(cancel);
      view.onCleanupTemp(cleanupGeneratedFiles);
      root.addEventListener("focus", refreshScopeStatus);
      root.addEventListener("beforeunload", dispose);
      refreshScopeStatus();
      refreshTempStatus();
    }

    return {
      init: init,
      start: start,
      cancel: cancel,
      dispose: dispose,
      refreshScopeStatus: refreshScopeStatus,
      refreshTempStatus: refreshTempStatus
    };
  };
}(window));
