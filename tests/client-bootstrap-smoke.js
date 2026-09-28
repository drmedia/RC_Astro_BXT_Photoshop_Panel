"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var clientRoot = path.join(__dirname, "..", "RC-Astro-BXT-Panel", "client");
var elements = {};

function classListFor(element) {
  function names() { return element.className ? element.className.split(/\s+/).filter(Boolean) : []; }
  function write(list) { element.className = list.join(" "); }
  return {
    toggle: function (name, force) {
      var list = names();
      var present = list.indexOf(name) >= 0;
      var add = force === undefined ? !present : !!force;
      if (add && !present) list.push(name);
      if (!add && present) list.splice(list.indexOf(name), 1);
      write(list);
    },
    add: function (name) { this.toggle(name, true); },
    remove: function (name) { this.toggle(name, false); }
  };
}

function createElement(id) {
  var element = {
    id: id,
    value: "",
    checked: false,
    disabled: false,
    className: "",
    textContent: "",
    title: "",
    style: {},
    files: null,
    attributes: {},
    listeners: {},
    addEventListener: function (name, handler) {
      this.listeners[name] = this.listeners[name] || [];
      this.listeners[name].push(handler);
    },
    setAttribute: function (name, value) { this.attributes[name] = value; },
    getAttribute: function (name) { return this.attributes[name]; },
    querySelector: function () { return createElement(id + "-child"); },
    focus: function () {},
    click: function () {}
  };
  element.classList = classListFor(element);
  element.parentNode = { className: "", classList: null };
  element.parentNode.classList = classListFor(element.parentNode);
  return element;
}

function getElement(id) {
  if (!elements[id]) elements[id] = createElement(id);
  return elements[id];
}

var initialValues = {
  strength: "0.30",
  stars: "0.30",
  nonstellar: "0.30",
  halos: "0",
  psfDiameter: "2.0",
  exePath: "rc-astro"
};
Object.keys(initialValues).forEach(function (id) { getElement(id).value = initialValues[id]; });
getElement("generalMode").checked = true;
getElement("linkStrength").checked = true;
["settingsCard", "helpCard", "detailsPanel", "cancelBtn", "progressWrap"].forEach(function (id) {
  getElement(id).className = "hidden";
});

var documentEvents = {};
var document = {
  getElementById: getElement,
  querySelectorAll: function (selector) {
    if (selector === "input, button, select") return Object.keys(elements).map(getElement);
    return [];
  },
  addEventListener: function (name, handler) { documentEvents[name] = handler; }
};

var catalog = JSON.stringify({
  key: "bxt",
  cliVersion: "2.6.9",
  mlVersion: 5,
  license: { valid: true },
  parameters: []
});
var stored = {};
var windowEvents = {};
var fakeWindow = {
  location: { pathname: "/" + path.join(clientRoot, "index.html").replace(/\\/g, "/") },
  localStorage: {
    getItem: function (key) { return stored[key] || null; },
    setItem: function (key, value) { stored[key] = String(value); }
  },
  BXT_I18N: {
    translate: function (value) { return String(value === undefined || value === null ? "" : value); },
    t: function (key, values) {
      if (key === "temp.summary") return values.count + "개 · " + values.size;
      return key;
    },
    setPreference: function () {},
    onChange: function (callback) { this.changeCallback = callback; }
  },
  __adobe_cep__: {
    evalScript: function (script, callback) {
      if (script.indexOf("BXT_scopeInfo") === 0) {
        callback("OK|현재 레이어|사용 가능|success|설명|적용 안 함|마스크 없음|neutral|설명");
      } else {
        callback("OK");
      }
    }
  },
  cep: { fs: { showOpenDialog: function () { return { data: [] }; } } },
  setTimeout: function (callback) { callback(); return 1; },
  clearTimeout: function () {},
  addEventListener: function (name, handler) { windowEvents[name] = handler; }
};
fakeWindow.window = fakeWindow;

function fakeRequire(name) {
  if (name === "child_process") {
    return {
      execFile: function (_exe, args, _options, callback) {
        if (args[0] === "--json") callback(null, catalog, "");
        return { kill: function () { return true; } };
      }
    };
  }
  return require(name);
}

var context = {
  window: fakeWindow,
  document: document,
  require: fakeRequire,
  console: console,
  setTimeout: fakeWindow.setTimeout,
  clearTimeout: fakeWindow.clearTimeout
};

function load(relativePath) {
  var source = fs.readFileSync(path.join(clientRoot, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
}

var expectedScripts = [
  "shared/contracts.js",
  "i18n.js",
  "shared/bxt-command.js",
  "platform/cep/filesystem-adapter.js",
  "platform/cep/process-adapter.js",
  "platform/cep/photoshop-adapter.js",
  "platform/cep/settings-store.js",
  "ui/processing-settings.js",
  "ui/panel-view.js",
  "ui/app-settings.js",
  "shared/workflow.js",
  "main.js"
];
var html = fs.readFileSync(path.join(clientRoot, "index.html"), "utf8");
var htmlScripts = [];
html.replace(/<script\s+src="([^"]+)"/g, function (_match, source) {
  htmlScripts.push(source);
  return _match;
});
assert.deepStrictEqual(htmlScripts, expectedScripts, "index.html should load client modules in dependency order");
expectedScripts.forEach(function (source) {
  assert(fs.existsSync(path.join(clientRoot, source)), "missing client script: " + source);
});

expectedScripts.filter(function (source) { return source !== "i18n.js"; }).forEach(load);

var installer = fs.readFileSync(path.join(__dirname, "..", "Install_Windows.bat"), "utf8");
expectedScripts.forEach(function (source) {
  var windowsPath = "client\\" + source.replace(/\//g, "\\");
  assert(installer.indexOf('"' + windowsPath + '"') >= 0, "installer should verify: " + windowsPath);
});

assert(fakeWindow.BXT, "BXT namespace should be initialized");
assert.strictEqual(getElement("panelVersion").textContent, "v0.9.3");
assert.strictEqual(getElement("message").className, "");
assert(getElement("runBtn").listeners.click && getElement("runBtn").listeners.click.length === 1);
assert(getElement("cancelBtn").listeners.click && getElement("cancelBtn").listeners.click.length === 1);
assert(getElement("cleanupTempBtn").listeners.click && getElement("cleanupTempBtn").listeners.click.length === 1);
assert.strictEqual(typeof windowEvents.beforeunload, "function");
assert.strictEqual(typeof windowEvents.focus, "function");

console.log("client bootstrap smoke test: PASS");
