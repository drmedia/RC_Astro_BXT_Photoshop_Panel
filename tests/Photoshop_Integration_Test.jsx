#target photoshop

(function () {
    var projectDir;
    var testDir;
    if (typeof BXT_TEST_PROJECT_PATH !== "undefined" && BXT_TEST_PROJECT_PATH) {
        projectDir = new Folder(BXT_TEST_PROJECT_PATH);
        testDir = new Folder(projectDir.fsName + "/tests");
    } else {
        var testFile = new File($.fileName);
        testDir = testFile.parent;
        projectDir = testDir.parent;
    }
    var hostFile = new File(projectDir.fsName + "/RC-Astro-BXT-Panel/host/host.jsx");
    var reportFile = new File(testDir.fsName + "/Photoshop_Integration_Result.txt");
    var tempTiff = new File(testDir.fsName + "/BXT_Integration_Temp.tif");
    var originalDialogs = app.displayDialogs;
    var originalDocument = app.documents.length ? app.activeDocument : null;
    var createdDocuments = [];
    var results = [];

    function assertTrue(condition, message) {
        if (!condition) throw new Error(message);
    }

    function remember(document) {
        createdDocuments.push(document);
        return document;
    }

    function makeRgb(name, bits) {
        var document = remember(app.documents.add(
            32,
            32,
            72,
            name,
            NewDocumentMode.RGB,
            DocumentFill.WHITE
        ));
        document.bitsPerChannel = bits;
        return document;
    }

    function closeCreatedDocuments() {
        for (var i = createdDocuments.length - 1; i >= 0; i--) {
            try { createdDocuments[i].close(SaveOptions.DONOTSAVECHANGES); } catch (_) {}
        }
    }

    function test(name, callback) {
        try {
            callback();
            results.push("PASS | " + name);
        } catch (e) {
            results.push("FAIL | " + name + " | " + e.message + " (line " + e.line + ")");
        }
    }

    function exportMaskToken(result) {
        var first = result.indexOf("|");
        var second = result.indexOf("|", first + 1);
        var third = result.indexOf("|", second + 1);
        if (first < 0 || second < 0 || third < 0) {
            throw new Error("내보내기 응답 형식이 올바르지 않습니다: " + result);
        }
        return result.substring(second + 1, third);
    }

    function writeReport() {
        var failures = 0;
        for (var i = 0; i < results.length; i++) {
            if (results[i].indexOf("FAIL |") === 0) failures++;
        }
        var summary = failures === 0 ? "PASS" : "FAIL";
        var lines = [
            "RC-Astro BXT Photoshop integration test",
            "Photoshop: " + app.version,
            "Result: " + summary,
            "Passed: " + (results.length - failures),
            "Failed: " + failures,
            ""
        ].concat(results);

        reportFile.encoding = "UTF-8";
        reportFile.open("w");
        reportFile.write(lines.join("\n"));
        reportFile.close();
        return summary + " | " + (results.length - failures) + "/" + results.length;
    }

    app.displayDialogs = DialogModes.NO;

    try {
        assertTrue(hostFile.exists, "host.jsx를 찾을 수 없습니다: " + hostFile.fsName);
        $.evalFile(hostFile);

        test("동일 이름 문서를 ID로 구분", function () {
            var first = makeRgb("BXT_SAME_NAME", BitsPerChannelType.EIGHT);
            var second = makeRgb("BXT_SAME_NAME", BitsPerChannelType.EIGHT);
            var firstId = BXT_documentId(first);
            var secondId = BXT_documentId(second);
            assertTrue(firstId !== secondId, "서로 다른 문서의 ID가 같습니다.");
            assertTrue(BXT_findDocumentById(firstId) === first, "첫 번째 문서를 ID로 찾지 못했습니다.");
            assertTrue(BXT_findDocumentById(secondId) === second, "두 번째 문서를 ID로 찾지 못했습니다.");
        });

        test("입력 문서를 RGB 32비트 단일 레이어로 준비", function () {
            var document = makeRgb("BXT_PREPARE", BitsPerChannelType.EIGHT);
            document.artLayers.add();
            document.changeMode(ChangeMode.CMYK);
            BXT_prepareInputDocument(document);
            assertTrue(document.mode === DocumentMode.RGB, "RGB 모드가 아닙니다.");
            assertTrue(document.bitsPerChannel === BitsPerChannelType.THIRTYTWO, "32비트가 아닙니다.");
            assertTrue(document.layers.length === 1, "문서가 단일 레이어로 병합되지 않았습니다.");
        });

        test("현재 픽셀 레이어 처리 범위 허용", function () {
            var document = makeRgb("BXT_SCOPE_PIXEL", BitsPerChannelType.EIGHT);
            app.activeDocument = document;
            assertTrue(BXT_validateScope("layer") === "OK", "일반 픽셀 레이어가 거부되었습니다.");
        });

        test("현재 비픽셀 레이어 처리 범위 거부", function () {
            var document = makeRgb("BXT_SCOPE_UNSUPPORTED", BitsPerChannelType.EIGHT);
            var textLayer = document.artLayers.add();
            textLayer.kind = LayerKind.TEXT;
            document.activeLayer = textLayer;
            app.activeDocument = document;
            assertTrue(BXT_validateScope("layer").indexOf("ERR|") === 0, "비픽셀 레이어가 허용되었습니다.");
        });

        test("처리 범위 상태 카드 정보 생성", function () {
            var document = makeRgb("BXT_SCOPE_INFO", BitsPerChannelType.EIGHT);
            app.activeDocument = document;

            var layerInfo = BXT_scopeInfo("layer");
            assertTrue(layerInfo.indexOf("OK|현재 선택한 픽셀 레이어|사용 가능|success|") === 0,
                "현재 레이어 상태 정보가 올바르지 않습니다: " + layerInfo);
            assertTrue(layerInfo.indexOf("|적용 안 함|마스크 없음|neutral|") >= 0,
                "현재 레이어의 마스크 정보가 올바르지 않습니다: " + layerInfo);

            var automaticLayerInfo = BXT_scopeInfo("auto");
            assertTrue(automaticLayerInfo === layerInfo,
                "전체 프레임 픽셀 레이어가 자동 선택되지 않았습니다: " + automaticLayerInfo);

            var documentInfo = BXT_scopeInfo("document");
            assertTrue(documentInfo.indexOf("OK|현재 보이는 레이어 합성|사용 가능|success|") === 0,
                "전체 문서 상태 정보가 올바르지 않습니다: " + documentInfo);

            var skyMissingInfo = BXT_scopeInfo("sky");
            assertTrue(skyMissingInfo.indexOf("ERR|현재 보이는 레이어 합성|사용 가능|success|") === 0,
                "영역 없는 지정 영역 상태 정보가 올바르지 않습니다: " + skyMissingInfo);
            assertTrue(skyMissingInfo.indexOf("|지정 영역 없음|사용 불가|error|") >= 0,
                "영역 누락 상태가 표시되지 않습니다: " + skyMissingInfo);

            document.selection.select([[0, 0], [16, 0], [16, 32], [0, 32]]);
            var skySelectionInfo = BXT_scopeInfo("sky");
            assertTrue(skySelectionInfo.indexOf("OK|") === 0,
                "선택 영역 상태가 사용 가능으로 표시되지 않습니다: " + skySelectionInfo);
            assertTrue(skySelectionInfo.indexOf("|선택 영역 적용|선택 영역|success|") >= 0,
                "선택 영역 마스크 정보가 올바르지 않습니다: " + skySelectionInfo);
            assertTrue(BXT_scopeInfo("auto") === skySelectionInfo,
                "선택 영역 지정 처리가 자동 선택되지 않았습니다: " + BXT_scopeInfo("auto"));
            document.selection.deselect();

            var textLayer = document.artLayers.add();
            textLayer.kind = LayerKind.TEXT;
            document.activeLayer = textLayer;
            var unsupportedLayerInfo = BXT_scopeInfo("auto");
            assertTrue(unsupportedLayerInfo.indexOf("ERR|현재 선택한 레이어|사용 불가|error|") === 0,
                "지원하지 않는 레이어가 사용 불가로 표시되지 않았습니다: " + unsupportedLayerInfo);
        });

        test("현재 레이어를 표시/숨기기 명령 없이 격리하여 내보내기", function () {
            try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
            var document = makeRgb("BXT_LAYER_EXPORT", BitsPerChannelType.EIGHT);
            var group = document.layerSets.add();
            group.name = "Target group";
            var target = document.backgroundLayer.duplicate(group, ElementPlacement.INSIDE);
            target.name = "Target layer";
            var nestedSibling = group.artLayers.add();
            nestedSibling.name = "Nested sibling";
            var topSibling = document.artLayers.add();
            topSibling.name = "Top sibling";
            document.activeLayer = target;
            app.activeDocument = document;

            var originalLayerCount = document.layers.length;
            var exportResult = BXT_exportInput(tempTiff.fsName, "auto");
            assertTrue(exportResult.indexOf("OK|") === 0, "현재 레이어 TIFF 내보내기 실패: " + exportResult);
            assertTrue(tempTiff.exists && tempTiff.length > 0, "현재 레이어 TIFF가 생성되지 않았습니다.");
            assertTrue(document.layers.length === originalLayerCount, "원본 문서의 레이어 구조가 변경되었습니다.");
            assertTrue(document.activeLayer === target, "원본 문서의 활성 레이어가 변경되었습니다.");
        });

        test("RGB 8비트 결과 형식 복원", function () {
            var target = makeRgb("BXT_TARGET_RGB8", BitsPerChannelType.EIGHT);
            var result = makeRgb("BXT_RESULT_RGB8", BitsPerChannelType.THIRTYTWO);
            BXT_matchResultDocument(result, target);
            assertTrue(result.mode === target.mode && result.bitsPerChannel === target.bitsPerChannel, "RGB 8비트 복원 실패");
        });

        test("Grayscale 16비트 결과 형식 복원", function () {
            var target = makeRgb("BXT_TARGET_GRAY16", BitsPerChannelType.SIXTEEN);
            target.changeMode(ChangeMode.GRAYSCALE);
            var result = makeRgb("BXT_RESULT_GRAY16", BitsPerChannelType.THIRTYTWO);
            BXT_matchResultDocument(result, target);
            assertTrue(result.mode === target.mode && result.bitsPerChannel === target.bitsPerChannel, "Grayscale 16비트 복원 실패");
        });

        test("CMYK 16비트 결과 형식 복원", function () {
            var target = makeRgb("BXT_TARGET_CMYK16", BitsPerChannelType.SIXTEEN);
            target.changeMode(ChangeMode.CMYK);
            var result = makeRgb("BXT_RESULT_CMYK16", BitsPerChannelType.THIRTYTWO);
            BXT_matchResultDocument(result, target);
            assertTrue(result.mode === target.mode && result.bitsPerChannel === target.bitsPerChannel, "CMYK 16비트 복원 실패");
        });

        test("Lab 8비트 결과 형식 복원", function () {
            var target = makeRgb("BXT_TARGET_LAB8", BitsPerChannelType.EIGHT);
            target.changeMode(ChangeMode.LAB);
            var result = makeRgb("BXT_RESULT_LAB8", BitsPerChannelType.THIRTYTWO);
            BXT_matchResultDocument(result, target);
            assertTrue(result.mode === target.mode && result.bitsPerChannel === target.bitsPerChannel, "Lab 8비트 복원 실패");
        });

        test("TIFF 내보내기 및 결과 레이어 가져오기", function () {
            try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
            var target = makeRgb("BXT_TIFF_ROUNDTRIP", BitsPerChannelType.SIXTEEN);
            var originalId = BXT_documentId(target);
            app.activeDocument = target;

            var exportResult = BXT_exportInput(tempTiff.fsName, "document");
            assertTrue(exportResult.indexOf("OK|") === 0, "TIFF 내보내기 실패: " + exportResult);
            assertTrue(tempTiff.exists && tempTiff.length > 0, "TIFF 파일이 생성되지 않았습니다.");

            var importResult = BXT_importResult(tempTiff.fsName, originalId, target.name);
            assertTrue(importResult === "OK", "결과 가져오기 실패: " + importResult);
            assertTrue(target.mode === DocumentMode.RGB, "원본 RGB 모드가 변경되었습니다.");
            assertTrue(target.bitsPerChannel === BitsPerChannelType.SIXTEEN, "원본 16비트 심도가 변경되었습니다.");
            assertTrue(target.activeLayer.name === "BlurXTerminator", "결과 레이어 이름이 올바르지 않습니다.");
        });

        test("하늘 영역이 없으면 안전하게 중단", function () {
            try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
            var target = makeRgb("BXT_SKY_MISSING", BitsPerChannelType.EIGHT);
            var originalChannelCount = target.channels.length;
            app.activeDocument = target;

            var exportResult = BXT_exportInput(tempTiff.fsName, "sky");
            assertTrue(exportResult.indexOf("ERR|") === 0, "영역 없이 하늘 처리가 시작되었습니다: " + exportResult);
            assertTrue(exportResult.indexOf("선택 영역") >= 0, "영역 누락 안내가 없습니다: " + exportResult);
            assertTrue(target.channels.length === originalChannelCount, "실패 후 임시 채널이 남았습니다.");
            assertTrue(!tempTiff.exists, "실패 후 TIFF가 남았습니다.");
        });

        test("선택 영역을 하늘 결과 레이어 마스크로 적용", function () {
            try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
            var target = makeRgb("BXT_SKY_SELECTION", BitsPerChannelType.SIXTEEN);
            var originalId = BXT_documentId(target);
            target.selection.select([[0, 0], [16, 0], [16, 32], [0, 32]]);
            app.activeDocument = target;

            var exportResult = BXT_exportInput(tempTiff.fsName, "auto");
            var maskToken = exportMaskToken(exportResult);
            assertTrue(exportResult.indexOf("OK|") === 0, "하늘 선택 영역 내보내기 실패: " + exportResult);
            assertTrue(maskToken.indexOf("S:") === 0, "선택 영역 토큰이 아닙니다: " + maskToken);

            var importResult = BXT_importResult(tempTiff.fsName, originalId, target.name, maskToken);
            assertTrue(importResult === "OK", "하늘 선택 영역 결과 가져오기 실패: " + importResult);
            assertTrue(target.activeLayer.name === "BlurXTerminator - Sky", "하늘 결과 레이어 이름이 올바르지 않습니다.");
            assertTrue(BXT_activeLayerHasMask(), "하늘 결과 레이어에 마스크가 없습니다.");
            assertTrue(BXT_hasSelection(target), "원래 선택 영역이 복원되지 않았습니다.");
            assertTrue(!BXT_findChannel(target, BXT_maskTokenParts(maskToken).channelName), "임시 선택 채널이 남았습니다.");
        });

        test("현재 레이어 마스크를 하늘 결과에 적용", function () {
            try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
            var target = makeRgb("BXT_SKY_LAYER_MASK", BitsPerChannelType.EIGHT);
            var originalId = BXT_documentId(target);
            target.selection.select([[0, 0], [32, 0], [32, 16], [0, 16]]);
            app.activeDocument = target;
            BXT_addRevealSelectionMask();
            target.selection.deselect();

            var scopeInfo = BXT_scopeInfo("auto");
            assertTrue(scopeInfo.indexOf("OK|") === 0, "레이어 마스크 상태가 사용 가능으로 표시되지 않습니다: " + scopeInfo);
            assertTrue(scopeInfo.indexOf("|현재 레이어 마스크 적용|레이어 마스크|success|") >= 0,
                "레이어 마스크 상태 정보가 올바르지 않습니다: " + scopeInfo);

            var exportResult = BXT_exportInput(tempTiff.fsName, "auto");
            var maskToken = exportMaskToken(exportResult);
            assertTrue(exportResult.indexOf("OK|") === 0, "레이어 마스크 내보내기 실패: " + exportResult);
            assertTrue(maskToken.indexOf("M:") === 0, "레이어 마스크 토큰이 아닙니다: " + maskToken);

            var importResult = BXT_importResult(tempTiff.fsName, originalId, target.name, maskToken);
            assertTrue(importResult === "OK", "레이어 마스크 결과 가져오기 실패: " + importResult);
            assertTrue(target.activeLayer.name === "BlurXTerminator - Sky", "하늘 결과 레이어 이름이 올바르지 않습니다.");
            assertTrue(BXT_activeLayerHasMask(), "가져온 결과 레이어에 마스크가 없습니다.");
            assertTrue(!BXT_hasSelection(target), "레이어 마스크 사용 후 선택 영역이 남았습니다.");
            assertTrue(!BXT_findChannel(target, BXT_maskTokenParts(maskToken).channelName), "임시 마스크 채널이 남았습니다.");
        });
    } catch (e) {
        results.push("FAIL | 테스트 초기화 | " + e.message + " (line " + e.line + ")");
    } finally {
        closeCreatedDocuments();
        try { if (originalDocument) app.activeDocument = originalDocument; } catch (_) {}
        try { if (tempTiff.exists) tempTiff.remove(); } catch (_) {}
        app.displayDialogs = originalDialogs;
    }

    writeReport();
}());
