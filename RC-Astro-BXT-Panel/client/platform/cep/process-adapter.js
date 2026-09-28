(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.platform = BXT.platform || {};
  BXT.platform.cep = BXT.platform.cep || {};

  BXT.platform.cep.createProcessAdapter = function () {
    var childProcess = null;
    var initError = null;
    try { childProcess = require("child_process"); } catch (e) { initError = e; }

    function options(timeout) {
      var result = { windowsHide: true, maxBuffer: 10 * 1024 * 1024 };
      if (timeout) result.timeout = timeout;
      return result;
    }

    return {
      isAvailable: function () { return !!childProcess; },
      getError: function () { return initError; },
      readCatalog: function (executable, timeout, callback) {
        if (!childProcess) {
          callback(initError || new Error("Node.js child_process를 사용할 수 없습니다."), "", "");
          return null;
        }
        return childProcess.execFile(executable, ["--json", "bxt"], options(timeout), callback);
      },
      run: function (executable, args, callback) {
        if (!childProcess) throw (initError || new Error("Node.js child_process를 사용할 수 없습니다."));
        return childProcess.execFile(executable, args, options(), function (err, stdout, stderr) {
          callback(err, stdout || "", stderr || "");
        });
      },
      terminate: function (process) {
        return !!(process && process.kill());
      }
    };
  };
}(window));
