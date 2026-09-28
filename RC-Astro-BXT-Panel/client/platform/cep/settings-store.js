(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.platform = BXT.platform || {};
  BXT.platform.cep = BXT.platform.cep || {};

  BXT.platform.cep.createSettingsStore = function () {
    return {
      getExecutable: function () {
        try { return root.localStorage.getItem("rcAstroExe") || ""; } catch (_) { return ""; }
      },
      setExecutable: function (value) {
        try { root.localStorage.setItem("rcAstroExe", value || "rc-astro"); } catch (_) {}
      }
    };
  };
}(window));
