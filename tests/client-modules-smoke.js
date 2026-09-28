"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var clientRoot = path.join(__dirname, "..", "RC-Astro-BXT-Panel", "client");
var context = { window: {} };
context.window.window = context.window;

function load(relativePath) {
  var source = fs.readFileSync(path.join(clientRoot, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
}

load(path.join("shared", "contracts.js"));
load(path.join("shared", "bxt-command.js"));
load(path.join("shared", "workflow.js"));

var BXT = context.window.BXT;
assert(BXT && BXT.shared, "BXT shared namespace should be created");
assert.strictEqual(typeof BXT.shared.assertContract, "function");
assert.strictEqual(typeof BXT.shared.bxtCommand.buildArguments, "function");

var catalog = BXT.shared.bxtCommand.parseCatalogOutput(
  "log line\n" + JSON.stringify({
    key: "bxt",
    cliVersion: "2.6.9",
    mlVersion: 5,
    license: { valid: true },
    parameters: [
      { name: "sn", flag: "--sn" },
      { name: "ss", flag: "--ss" },
      { name: "ash", flag: "--ash" },
      { name: "lp", flag: "--lp" },
      { name: "nsd", flag: "--nsd" }
    ]
  })
);
assert.strictEqual(catalog.key, "bxt");

var general = { planetary: false, stars: "0.30", nonstellar: "0.40", halos: "0.00" };
var generalValidation = BXT.shared.bxtCommand.validateCatalog(catalog, general);
assert.strictEqual(generalValidation.error, undefined);
assert.strictEqual(generalValidation.info.mlVersion, 5);
assert.deepStrictEqual(
  Array.prototype.slice.call(BXT.shared.bxtCommand.buildArguments("in.tif", "out.tif", general)),
  ["bxt", "in.tif", "--sharpen-stars", "0.30", "--adjust-star-halos", "0.00", "--sharpen-nonstellar", "0.40", "--output", "out.tif", "--overwrite"]
);

var planetary = { planetary: true, psfDiameter: "2.0", nonstellar: "0.35" };
var planetaryValidation = BXT.shared.bxtCommand.validateCatalog(catalog, planetary);
assert.strictEqual(planetaryValidation.error, undefined);
assert.deepStrictEqual(
  Array.prototype.slice.call(BXT.shared.bxtCommand.buildArguments("in.tif", "out.tif", planetary)),
  ["bxt", "in.tif", "--lp", "--nsd", "2.0", "--sharpen-nonstellar", "0.35", "--output", "out.tif", "--overwrite"]
);

assert.throws(function () {
  BXT.shared.assertContract("settingsStore", { getExecutable: function () {} });
}, /setExecutable/);

var processCallback = null;
var cleaned = [];
var viewState = { busy: false, cancel: false, ok: "", error: "", progress: 0 };
var workflow = BXT.shared.createWorkflow({
  files: {
    isAvailable: function () { return true; },
    createRunFiles: function () { return { input: "input.tif", output: "output.tif" }; },
    listGeneratedFiles: function () { return []; },
    cleanupFiles: function (files) { cleaned = cleaned.concat(files); return []; },
    cleanupOlderThan: function () { return { deleted: 0, deletedBytes: 0, protectedCount: 0, failures: [] }; },
    exists: function (file) { return file === "output.tif"; }
  },
  processRunner: {
    isAvailable: function () { return true; },
    readCatalog: function (_exe, _timeout, callback) { callback(null, JSON.stringify(catalog), ""); },
    run: function (_exe, args, callback) {
      assert.deepStrictEqual(
        Array.prototype.slice.call(args),
        ["bxt", "input.tif", "--sharpen-stars", "0.30", "--adjust-star-halos", "0.00", "--sharpen-nonstellar", "0.40", "--output", "output.tif", "--overwrite"]
      );
      processCallback = callback;
      return { kill: function () { return true; } };
    },
    terminate: function (process) { return process.kill(); }
  },
  photoshop: {
    isAvailable: function () { return true; },
    scopeInfo: function (_scope, callback) { callback(null, "OK|현재 레이어|사용 가능|success|설명|적용 안 함|마스크 없음|neutral|설명"); },
    validateScope: function (_scope, callback) { callback(null, "OK"); },
    exportInput: function (_input, _scope, callback) { callback(null, "OK|123||Sample"); },
    importResult: function (_output, documentId, documentName, maskToken, callback) {
      assert.strictEqual(documentId, "123");
      assert.strictEqual(documentName, "Sample");
      assert.strictEqual(maskToken, "");
      callback(null, "OK");
    },
    discardMask: function (_documentId, _maskToken, callback) { callback(null); }
  },
  bxtCommand: BXT.shared.bxtCommand,
  view: {
    clearMessage: function () {},
    showError: function (text) { viewState.error = text; },
    showOk: function (text) { viewState.ok = text; },
    setBusy: function (busy) { viewState.busy = busy; },
    setProgress: function (progress) { viewState.progress = progress; },
    setCancelAvailable: function (available) { viewState.cancel = available; },
    setCancelPending: function () {},
    setScopeChecking: function () {},
    renderScopeError: function (text) { viewState.error = text; },
    renderScopeStatus: function () {},
    refreshTempStatus: function () {},
    showProgressTemporarily: function () {},
    formatBytes: function (bytes) { return bytes + " B"; },
    onRun: function () {},
    onCancel: function () {},
    onCleanupTemp: function () {}
  },
  processingSettings: {
    capture: function (exe) {
      assert.strictEqual(exe, "rc-astro");
      return { exe: exe, scope: "auto", planetary: false, psfDiameter: "2.0", stars: "0.30", nonstellar: "0.40", halos: "0.00" };
    }
  },
  appSettings: { getExecutable: function () { return "rc-astro"; } }
});

workflow.start();
assert.strictEqual(typeof processCallback, "function", "workflow should start the BXT process");
assert.strictEqual(viewState.cancel, true, "cancel button should be available while BXT runs");
processCallback(null, "done", "");
assert.strictEqual(viewState.busy, false, "workflow should unlock the panel after success");
assert.strictEqual(viewState.cancel, false, "cancel button should be hidden after success");
assert.strictEqual(viewState.progress, 100, "workflow should reach 100 percent");
assert(/완료/.test(viewState.ok), "workflow should report success");
assert.deepStrictEqual(cleaned, ["input.tif", "output.tif"]);

console.log("client modules smoke test: PASS");
