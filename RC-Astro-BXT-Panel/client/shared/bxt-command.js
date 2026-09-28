(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.shared = BXT.shared || {};

  function parseCatalogOutput(stdout) {
    var jsonText = String(stdout || "").replace(/^\uFEFF/, "");
    var jsonStart = jsonText.indexOf("{");
    var jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("JSON 응답이 없습니다.");
    return JSON.parse(jsonText.substring(jsonStart, jsonEnd + 1));
  }

  function hasParameter(catalog, name, flag) {
    if (!catalog.parameters || !catalog.parameters.length) return false;
    for (var i = 0; i < catalog.parameters.length; i++) {
      if (catalog.parameters[i].name === name || catalog.parameters[i].flag === flag) return true;
    }
    return false;
  }

  function validateCatalog(catalog, settings) {
    if (catalog.key !== "bxt") {
      return { error: "RC-Astro CLI에서 BlurXTerminator 제품 정보를 확인할 수 없습니다." };
    }

    if (!catalog.license || catalog.license.valid !== true) {
      return {
        error: "BlurXTerminator 라이선스를 사용할 수 없습니다.\n" +
          ((catalog.license && catalog.license.message) || "라이선스 상태를 확인하세요.") +
          "\n\n명령 프롬프트에서 `rc-astro license`를 실행해 확인하세요."
      };
    }

    if (
      !hasParameter(catalog, "sn", "--sn") ||
      (!settings.planetary && !hasParameter(catalog, "ss", "--ss")) ||
      (!settings.planetary && !hasParameter(catalog, "ash", "--ash"))
    ) {
      return { error: "설치된 RC-Astro CLI가 필요한 BlurXTerminator 파라미터를 지원하지 않습니다." };
    }

    if (settings.planetary) {
      if (Number(catalog.mlVersion) < 5) {
        return {
          error: "Lunar / Planetary 모드는 BlurXTerminator ML5 이상이 필요합니다.\n" +
            "현재 ML 버전: " + (catalog.mlVersion || "확인 불가")
        };
      }
      if (!hasParameter(catalog, "lp", "--lp") || !hasParameter(catalog, "nsd", "--nsd")) {
        return { error: "설치된 RC-Astro CLI가 Lunar / Planetary 모드를 지원하지 않습니다." };
      }
    }

    return {
      info: {
        cliVersion: catalog.cliVersion || "unknown",
        mlVersion: catalog.mlVersion || "unknown"
      }
    };
  }

  function buildArguments(inputFile, outputFile, settings) {
    var args = ["bxt", inputFile];
    if (settings.planetary) {
      args.push("--lp");
      args.push("--nsd", settings.psfDiameter);
    } else {
      args.push("--sharpen-stars", settings.stars);
      args.push("--adjust-star-halos", settings.halos);
    }
    args.push("--sharpen-nonstellar", settings.nonstellar);
    args.push("--output", outputFile);
    args.push("--overwrite");
    return args;
  }

  BXT.shared.bxtCommand = {
    parseCatalogOutput: parseCatalogOutput,
    hasParameter: hasParameter,
    validateCatalog: validateCatalog,
    buildArguments: buildArguments
  };
}(window));
