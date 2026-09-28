(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.platform = BXT.platform || {};
  BXT.platform.cep = BXT.platform.cep || {};

  BXT.platform.cep.createFilesystemAdapter = function () {
    var fs = null;
    var os = null;
    var path = null;
    var initError = null;
    try {
      fs = require("fs");
      os = require("os");
      path = require("path");
    } catch (e) {
      initError = e;
    }

    function available() { return !!(fs && os && path); }
    function tempDirectory() { return path.join(os.tmpdir(), "RC_Astro_BXT_Photoshop"); }

    function ensureDirectory(dir) {
      if (fs.existsSync(dir)) return;
      try {
        fs.mkdirSync(dir);
      } catch (e) {
        if (!fs.existsSync(dir)) throw e;
      }
    }

    function listGeneratedFiles() {
      var dir = tempDirectory();
      var files = [];
      var names;
      if (!fs.existsSync(dir)) return files;
      try { names = fs.readdirSync(dir); } catch (_) { return files; }

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

    function cleanupFiles(files) {
      var failures = [];
      for (var i = 0; i < files.length; i++) {
        if (!files[i]) continue;
        try {
          if (fs.existsSync(files[i])) fs.unlinkSync(files[i]);
        } catch (e) {
          failures.push(path.basename(files[i]) + ": " + e.message);
        }
      }
      return failures;
    }

    function cleanupStaleFiles(maxAgeMs) {
      var cutoff = Date.now() - maxAgeMs;
      var files = listGeneratedFiles();
      for (var i = 0; i < files.length; i++) {
        if (files[i].modified >= cutoff) continue;
        try { fs.unlinkSync(files[i].path); } catch (_) {}
      }
    }

    function cleanupOlderThan(minAgeMs) {
      var cutoff = Date.now() - minAgeMs;
      var files = listGeneratedFiles();
      var result = { deleted: 0, deletedBytes: 0, protectedCount: 0, failures: [] };
      for (var i = 0; i < files.length; i++) {
        if (files[i].modified >= cutoff) {
          result.protectedCount++;
          continue;
        }
        try {
          fs.unlinkSync(files[i].path);
          result.deleted++;
          result.deletedBytes += files[i].size;
        } catch (e) {
          result.failures.push(path.basename(files[i].path) + ": " + e.message);
        }
      }
      return result;
    }

    function createRunFiles() {
      var dir = tempDirectory();
      ensureDirectory(dir);
      cleanupStaleFiles(24 * 60 * 60 * 1000);
      var stamp = Date.now() + "_" + Math.floor(Math.random() * 1000000);
      return {
        input: path.join(dir, "bxt_input_" + stamp + ".tif"),
        output: path.join(dir, "bxt_output_" + stamp + ".tif")
      };
    }

    function getManifestVersion(locationPath) {
      if (!available()) return "";
      try {
        var htmlPath = decodeURIComponent(locationPath || "");
        if (/^\/[A-Za-z]:\//.test(htmlPath)) htmlPath = htmlPath.substring(1);
        var manifestPath = path.resolve(path.dirname(htmlPath), "..", "CSXS", "manifest.xml");
        var manifestText = fs.readFileSync(manifestPath, "utf8");
        var match = /ExtensionBundleVersion\s*=\s*"([^"]+)"/.exec(manifestText);
        return match ? match[1] : "";
      } catch (_) {
        return "";
      }
    }

    return {
      isAvailable: available,
      getError: function () { return initError; },
      getManifestVersion: getManifestVersion,
      browseExecutable: function (currentPath, title) {
        if (!root.cep || !root.cep.fs || typeof root.cep.fs.showOpenDialog !== "function") {
          return { unsupported: true };
        }
        var initialPath = path && path.isAbsolute(currentPath || "") ? path.dirname(currentPath) : "";
        var selection = root.cep.fs.showOpenDialog(false, false, title, initialPath, ["exe"]);
        if (selection && selection.data && selection.data.length) return { path: selection.data[0] };
        if (selection && selection.err) return { error: selection.err };
        return { cancelled: true };
      },
      createRunFiles: createRunFiles,
      listGeneratedFiles: listGeneratedFiles,
      cleanupFiles: cleanupFiles,
      cleanupStaleFiles: cleanupStaleFiles,
      cleanupOlderThan: cleanupOlderThan,
      exists: function (file) { return !!(fs && fs.existsSync(file)); }
    };
  };
}(window));
