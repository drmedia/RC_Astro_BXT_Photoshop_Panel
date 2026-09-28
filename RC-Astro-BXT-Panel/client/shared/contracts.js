(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.shared = BXT.shared || {};
  BXT.platform = BXT.platform || {};
  BXT.platform.cep = BXT.platform.cep || {};
  BXT.ui = BXT.ui || {};

  var definitions = {
    filesystem: ["isAvailable", "getManifestVersion", "browseExecutable", "createRunFiles", "listGeneratedFiles", "cleanupFiles", "cleanupStaleFiles", "cleanupOlderThan", "exists"],
    processRunner: ["isAvailable", "readCatalog", "run", "terminate"],
    photoshop: ["isAvailable", "scopeInfo", "validateScope", "exportInput", "importResult", "discardMask"],
    settingsStore: ["getExecutable", "setExecutable"]
  };

  function assertContract(name, service) {
    var methods = definitions[name];
    if (!methods) throw new Error("Unknown service contract: " + name);
    if (!service) throw new Error("Missing service: " + name);
    for (var i = 0; i < methods.length; i++) {
      if (typeof service[methods[i]] !== "function") {
        throw new Error(name + " service is missing method: " + methods[i]);
      }
    }
    return service;
  }

  BXT.shared.contracts = definitions;
  BXT.shared.assertContract = assertContract;
}(window));
