(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.platform = BXT.platform || {};
  BXT.platform.cep = BXT.platform.cep || {};

  function escapeJs(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  BXT.platform.cep.createPhotoshopAdapter = function () {
    function evaluate(script, callback) {
      if (!root.__adobe_cep__) {
        callback("CEP 인터페이스를 사용할 수 없습니다.");
        return;
      }
      root.__adobe_cep__.evalScript(script, function (result) { callback(null, result); });
    }

    return {
      isAvailable: function () { return !!root.__adobe_cep__; },
      scopeInfo: function (scope, callback) {
        evaluate('BXT_scopeInfo("' + escapeJs(scope) + '")', callback);
      },
      validateScope: function (scope, callback) {
        evaluate('BXT_validateScope("' + escapeJs(scope) + '")', callback);
      },
      exportInput: function (inputFile, scope, callback) {
        evaluate('BXT_exportInput("' + escapeJs(inputFile) + '","' + escapeJs(scope) + '")', callback);
      },
      importResult: function (outputFile, documentId, documentName, maskToken, callback) {
        evaluate(
          'BXT_importResult("' + escapeJs(outputFile) + '","' + escapeJs(documentId) +
          '","' + escapeJs(documentName) + '","' + escapeJs(maskToken) + '")',
          callback
        );
      },
      discardMask: function (documentId, maskToken, callback) {
        callback = callback || function () {};
        if (!documentId || !maskToken) {
          callback(null);
          return;
        }
        var finished = false;
        var timeoutId = root.setTimeout(function () {
          if (finished) return;
          finished = true;
          callback("Photoshop 응답 시간 초과");
        }, 3000);
        evaluate(
          'BXT_discardMask("' + escapeJs(documentId) + '","' + escapeJs(maskToken) + '")',
          function (err, result) {
            if (finished) return;
            finished = true;
            root.clearTimeout(timeoutId);
            callback(err || (result !== "OK" ? (result || "알 수 없는 오류") : null));
          }
        );
      }
    };
  };
}(window));
