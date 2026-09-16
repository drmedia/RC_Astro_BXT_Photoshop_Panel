"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var source = fs.readFileSync(path.join(__dirname, "..", "RC-Astro-BXT-Panel", "client", "i18n.js"), "utf8");

function load(locale, storedPreference) {
  var stored = storedPreference || "";
  var textNode = { nodeType: 3, nodeValue: "설정", nextSibling: null };
  var attrs = { title: "설정" };
  var root = {
    nodeType: 1,
    tagName: "DIV",
    firstChild: textNode,
    nextSibling: null,
    getAttribute: function (name) { return attrs[name] || null; },
    setAttribute: function (name, value) { attrs[name] = value; }
  };
  var document = {
    nodeType: 9,
    documentElement: root,
    firstChild: root,
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    createElement: function () { throw new Error("Unexpected element creation"); }
  };
  var storage = {
    getItem: function () { return stored; },
    setItem: function (_, value) { stored = value; }
  };
  var context = {
    document: document,
    navigator: { language: locale },
    localStorage: storage,
    console: console
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: "i18n.js" });
  return { api: context.BXT_I18N, root: root, textNode: textNode, attrs: attrs, stored: function () { return stored; } };
}

var english = load("en-US");
assert.strictEqual(english.api.getLanguage(), "en");
assert.strictEqual(english.root.lang, "en");
assert.strictEqual(english.textNode.nodeValue, "Settings");
assert.strictEqual(english.attrs.title, "Settings");
assert.strictEqual(english.api.t("temp.summary", { count: 2, size: "8 MB" }), "2 files · 8 MB");
assert.strictEqual(english.api.translate("현재 선택한 픽셀 레이어"), "Currently Selected Pixel Layer");

english.api.setPreference("ko");
assert.strictEqual(english.api.getLanguage(), "ko");
assert.strictEqual(english.textNode.nodeValue, "설정");
assert.strictEqual(english.attrs.title, "설정");
assert.strictEqual(english.stored(), "ko");

var koreanAuto = load("ko-KR", "auto");
assert.strictEqual(koreanAuto.api.getLanguage(), "ko");
assert.strictEqual(koreanAuto.api.getPreference(), "auto");

english.api.setPreference("en");
[
  "Node.js 초기화 실패: sample",
  "현재 선택한 픽셀 레이어",
  "마스크 없이 전체 프레임 결과 레이어를 생성합니다.",
  "ERR|Photoshop 문서를 먼저 여세요.",
  "지원되지 않는 원본 색상 모드: CMYK",
  "현재 레이어는 처리할 수 없습니다. 일반 픽셀 레이어나 스마트 오브젝트를 선택하세요.",
  "결과 가져오기 실패: sample",
  "완료: 원본 문서에 `BlurXTerminator` 레이어를 추가했습니다."
].forEach(function (value) {
  assert.ok(!/[가-힣]/.test(english.api.translate(value)), "Untranslated message: " + value);
});
console.log("i18n smoke test: PASS");