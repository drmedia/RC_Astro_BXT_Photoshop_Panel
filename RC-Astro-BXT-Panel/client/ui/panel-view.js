(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.ui = BXT.ui || {};

  BXT.ui.createPanelView = function (document, i18n) {
    function tr(text) {
      return i18n ? i18n.translate(text) : String(text === undefined || text === null ? "" : text);
    }

    var runBtn = document.getElementById("runBtn");
    var cancelBtn = document.getElementById("cancelBtn");
    var settingsButton = document.getElementById("settingsButton");
    var settingsCard = document.getElementById("settingsCard");
    var closeSettings = document.getElementById("closeSettings");
    var helpButton = document.getElementById("helpButton");
    var helpCard = document.getElementById("helpCard");
    var closeHelp = document.getElementById("closeHelp");
    var mainContent = document.getElementById("mainContent");
    var detailsToggle = document.getElementById("detailsToggle");
    var detailsPanel = document.getElementById("detailsPanel");
    var detailsToggleText = document.getElementById("detailsToggleText");
    var detailsChevron = document.getElementById("detailsChevron");
    var scopeTargetTitle = document.getElementById("scopeTargetTitle");
    var scopeTargetBadge = document.getElementById("scopeTargetBadge");
    var scopeTargetDescription = document.getElementById("scopeTargetDescription");
    var scopeMaskTitle = document.getElementById("scopeMaskTitle");
    var scopeMaskBadge = document.getElementById("scopeMaskBadge");
    var scopeMaskDescription = document.getElementById("scopeMaskDescription");
    var busyState = false;
    var lockedControls = [];

    function setPanelView(view, callbacks) {
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
        if (callbacks.onSettingsOpen) callbacks.onSettingsOpen();
        root.setTimeout(function () { document.getElementById("exePath").focus(); }, 0);
      } else if (helpOpen) {
        root.setTimeout(function () { closeHelp.focus(); }, 0);
      } else if (callbacks.onMainOpen) {
        callbacks.onMainOpen();
      }
    }

    function setDetailsOpen(open) {
      detailsPanel.classList.toggle("hidden", !open);
      detailsToggle.classList.toggle("active", open);
      detailsToggle.setAttribute("aria-expanded", open ? "true" : "false");
      detailsToggleText.textContent = i18n
        ? i18n.t(open ? "details.close" : "details.open")
        : (open ? "세부 설정 닫기" : "세부 설정 보기");
      detailsChevron.textContent = open ? "▴" : "▾";
    }

    function setScopeBadge(element, text, tone) {
      var allowed = { success: true, error: true, warning: true, neutral: true, checking: true };
      element.textContent = tr(text);
      element.className = "scope-state-badge " + (allowed[tone] ? tone : "neutral");
    }

    function initNavigation(callbacks) {
      callbacks = callbacks || {};
      settingsButton.addEventListener("click", function () {
        setPanelView(settingsCard.className.indexOf("hidden") >= 0 ? "settings" : "main", callbacks);
      });
      closeSettings.addEventListener("click", function () { setPanelView("main", callbacks); });
      helpButton.addEventListener("click", function () {
        setPanelView(helpCard.className.indexOf("hidden") >= 0 ? "help" : "main", callbacks);
      });
      closeHelp.addEventListener("click", function () { setPanelView("main", callbacks); });
      detailsToggle.addEventListener("click", function () {
        setDetailsOpen(detailsPanel.className.indexOf("hidden") >= 0);
      });

      var accordions = document.querySelectorAll(".help-accordion");
      for (var i = 0; i < accordions.length; i++) {
        (function (button) {
          button.addEventListener("click", function () {
            var answer = document.getElementById(button.getAttribute("aria-controls"));
            var open = button.getAttribute("aria-expanded") === "true";
            var chevron = button.querySelector(".help-chevron");
            button.setAttribute("aria-expanded", open ? "false" : "true");
            answer.classList.toggle("hidden", open);
            chevron.textContent = open ? "▾" : "▴";
          });
        }(accordions[i]));
      }

      document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape" && event.keyCode !== 27) return;
        if (settingsCard.className.indexOf("hidden") < 0) setPanelView("main", callbacks);
        else if (helpCard.className.indexOf("hidden") < 0) setPanelView("main", callbacks);
      });
    }

    function lockAllControls() {
      var controls = document.querySelectorAll("input, button, select");
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

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }

    function message(text, type) {
      var element = document.getElementById("message");
      element.className = type ? "message " + type : "message";
      element.textContent = tr(text || "");
    }

    return {
      initNavigation: initNavigation,
      isViewOpen: function (view) {
        return (view === "settings" ? settingsCard : helpCard).className.indexOf("hidden") < 0;
      },
      syncDetailsLabel: function () { setDetailsOpen(detailsPanel.className.indexOf("hidden") < 0); },
      setVersion: function (version) {
        var element = document.getElementById("panelVersion");
        if (element && version) element.textContent = "v" + version;
      },
      setExecutableStatus: function (text, state, needsAttention) {
        var status = document.getElementById("exeStatus");
        status.textContent = tr(text);
        status.className = "preflight-status" + (state ? " " + state : "");
        settingsButton.classList.toggle("needs-attention", !!needsAttention);
        settingsButton.title = i18n
          ? i18n.t(needsAttention ? "settings.attention" : "settings.title")
          : (needsAttention ? "설정 · RC-Astro 확인 필요" : "설정");
      },
      setScopeChecking: function () { setScopeBadge(scopeTargetBadge, "확인 중", "checking"); },
      renderScopeStatus: function (parts) {
        scopeTargetTitle.textContent = tr(parts[1]);
        setScopeBadge(scopeTargetBadge, parts[2], parts[3]);
        scopeTargetDescription.textContent = tr(parts[4]);
        scopeMaskTitle.textContent = tr(parts[5]);
        setScopeBadge(scopeMaskBadge, parts[6], parts[7]);
        scopeMaskDescription.textContent = tr(parts[8]);
      },
      renderScopeError: function (text) {
        this.renderScopeStatus([
          "ERR", "상태 확인 실패", "사용 불가", "error",
          text || "Photoshop 상태를 확인할 수 없습니다.",
          "적용 안 함", "확인 불가", "neutral",
          "Photoshop 문서와 현재 레이어를 다시 확인하세요."
        ]);
      },
      setBusy: function (busy, text) {
        if (busy && !busyState) lockAllControls();
        if (!busy && busyState) unlockAllControls();
        busyState = busy;
        runBtn.disabled = busy;
        document.getElementById("runText").textContent = tr(text || (busy ? "처리 중…" : "BlurXTerminator 실행"));
        document.getElementById("progressWrap").className = busy ? "progress-wrap" : "progress-wrap hidden";
      },
      isBusy: function () { return busyState; },
      setCancelAvailable: function (available) {
        runBtn.classList.toggle("hidden", available);
        cancelBtn.classList.toggle("hidden", !available);
        cancelBtn.disabled = !available;
      },
      setCancelPending: function () { cancelBtn.disabled = true; },
      setProgress: function (percent, text) {
        document.getElementById("progressBar").style.width = percent + "%";
        document.getElementById("status").textContent = tr(text || "");
      },
      showProgressTemporarily: function () {
        document.getElementById("progressWrap").className = "progress-wrap";
        root.setTimeout(function () {
          document.getElementById("progressWrap").className = "progress-wrap hidden";
        }, 2500);
      },
      showError: function (text) { message(text, "error"); },
      showOk: function (text) { message(text, "ok"); },
      clearMessage: function () { message("", ""); },
      refreshTempStatus: function (files) {
        var total = 0;
        for (var i = 0; i < files.length; i++) total += files[i].size;
        var text = i18n
          ? i18n.t("temp.summary", { count: files.length, size: formatBytes(total) })
          : files.length + "개 · " + formatBytes(total);
        document.getElementById("tempStatus").textContent = text;
      },
      formatBytes: formatBytes,
      onRun: function (handler) { runBtn.addEventListener("click", handler); },
      onCancel: function (handler) { cancelBtn.addEventListener("click", handler); },
      onCleanupTemp: function (handler) { document.getElementById("cleanupTempBtn").addEventListener("click", handler); }
    };
  };
}(window));
