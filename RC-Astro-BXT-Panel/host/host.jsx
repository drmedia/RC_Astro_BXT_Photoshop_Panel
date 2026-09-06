#target photoshop

function BXT_safeFile(path) {
    return new File(path);
}

function BXT_modeName(mode) {
    if (mode === DocumentMode.RGB) return "RGB";
    if (mode === DocumentMode.GRAYSCALE) return "Grayscale";
    if (mode === DocumentMode.CMYK) return "CMYK";
    if (mode === DocumentMode.LAB) return "Lab";
    if (mode === DocumentMode.BITMAP) return "Bitmap";
    if (mode === DocumentMode.INDEXEDCOLOR) return "Indexed Color";
    if (mode === DocumentMode.DUOTONE) return "Duotone";
    if (mode === DocumentMode.MULTICHANNEL) return "Multichannel";
    return "Unknown";
}

function BXT_bitsName(bits) {
    if (bits === BitsPerChannelType.ONE) return "1-bit";
    if (bits === BitsPerChannelType.EIGHT) return "8-bit";
    if (bits === BitsPerChannelType.SIXTEEN) return "16-bit";
    if (bits === BitsPerChannelType.THIRTYTWO) return "32-bit";
    return "Unknown";
}

function BXT_documentId(document) {
    var id;
    try {
        id = Number(document.id);
    } catch (e) {
        throw new Error("Photoshop 문서 ID를 읽을 수 없습니다: " + e.message);
    }

    if (!isFinite(id) || id <= 0 || Math.floor(id) !== id) {
        throw new Error("Photoshop 문서 ID가 올바르지 않습니다: " + id);
    }
    return String(id);
}

function BXT_changeMode(document, targetMode) {
    if (document.mode === targetMode) return;

    if (targetMode === DocumentMode.RGB) {
        document.changeMode(ChangeMode.RGB);
    } else if (targetMode === DocumentMode.GRAYSCALE) {
        document.changeMode(ChangeMode.GRAYSCALE);
    } else if (targetMode === DocumentMode.CMYK) {
        document.changeMode(ChangeMode.CMYK);
    } else if (targetMode === DocumentMode.LAB) {
        document.changeMode(ChangeMode.LAB);
    } else {
        throw new Error("지원되지 않는 원본 색상 모드: " + BXT_modeName(targetMode));
    }

    if (document.mode !== targetMode) {
        throw new Error(
            "색상 모드 변환 확인 실패: " + BXT_modeName(document.mode) +
            " -> " + BXT_modeName(targetMode)
        );
    }
}

function BXT_changeBits(document, targetBits) {
    if (document.bitsPerChannel === targetBits) return;

    if (
        targetBits !== BitsPerChannelType.EIGHT &&
        targetBits !== BitsPerChannelType.SIXTEEN &&
        targetBits !== BitsPerChannelType.THIRTYTWO
    ) {
        throw new Error("지원되지 않는 원본 비트 심도: " + BXT_bitsName(targetBits));
    }

    document.bitsPerChannel = targetBits;
    if (document.bitsPerChannel !== targetBits) {
        throw new Error(
            "비트 심도 변환 확인 실패: " + BXT_bitsName(document.bitsPerChannel) +
            " -> " + BXT_bitsName(targetBits)
        );
    }
}

function BXT_prepareInputDocument(document) {
    try {
        document.flatten();
    } catch (e) {
        throw new Error("입력 문서 평탄화 실패: " + e.message);
    }

    try {
        BXT_changeMode(document, DocumentMode.RGB);
    } catch (e) {
        throw new Error("입력 문서 RGB 변환 실패: " + e.message);
    }

    try {
        BXT_changeBits(document, BitsPerChannelType.THIRTYTWO);
    } catch (e) {
        throw new Error("입력 문서 32비트 변환 실패: " + e.message);
    }
}

function BXT_matchResultDocument(resultDocument, targetDocument) {
    var targetMode = targetDocument.mode;
    var targetBits = targetDocument.bitsPerChannel;

    // CMYK와 Lab은 32-bit를 지원하지 않으므로 비트 심도를 먼저 맞춘다.
    try {
        BXT_changeBits(resultDocument, targetBits);
    } catch (e) {
        throw new Error("결과 비트 심도 변환 실패: " + e.message);
    }

    try {
        BXT_changeMode(resultDocument, targetMode);
    } catch (e) {
        throw new Error("결과 색상 모드 변환 실패: " + e.message);
    }
}

function BXT_hasSelection(document) {
    try {
        var bounds = document.selection.bounds;
        return bounds && bounds.length === 4;
    } catch (_) {
        return false;
    }
}

function BXT_activeLayerHasMask() {
    var reference = new ActionReference();
    reference.putEnumerated(
        charIDToTypeID("Lyr "),
        charIDToTypeID("Ordn"),
        charIDToTypeID("Trgt")
    );
    var descriptor = executeActionGet(reference);
    var key = stringIDToTypeID("hasUserMask");
    return descriptor.hasKey(key) && descriptor.getBoolean(key);
}

function BXT_layerCoversDocument(layer, document) {
    try {
        var bounds = layer.bounds;
        var tolerance = 0.01;
        return bounds[0].as("px") <= tolerance &&
            bounds[1].as("px") <= tolerance &&
            bounds[2].as("px") >= document.width.as("px") - tolerance &&
            bounds[3].as("px") >= document.height.as("px") - tolerance;
    } catch (_) {
        return false;
    }
}

function BXT_validateScope(scope) {
    if (app.documents.length === 0) return "ERR|Photoshop 문서를 먼저 여세요.";

    try {
        var document = app.activeDocument;
        if (scope === "layer") {
            var layer = document.activeLayer;
            var supported = false;
            if (layer && layer.typename === "ArtLayer") {
                supported = layer.kind === LayerKind.NORMAL || layer.kind === LayerKind.SMARTOBJECT;
            }
            if (!supported) {
                return "ERR|현재 레이어는 처리할 수 없습니다. 일반 픽셀 레이어나 스마트 오브젝트를 선택하세요.";
            }
            if (!BXT_layerCoversDocument(layer, document)) {
                return "ERR|현재 레이어가 문서 전체 프레임을 덮지 않습니다. 전체 프레임 픽셀 레이어나 스마트 오브젝트를 선택하세요.";
            }
        } else if (scope === "sky") {
            if (!BXT_hasSelection(document) && !BXT_activeLayerHasMask()) {
                return "ERR|지정 영역 처리에는 선택 영역 또는 현재 레이어 마스크가 필요합니다.";
            }
        } else if (scope !== "document") {
            return "ERR|알 수 없는 처리 범위입니다: " + scope;
        }
        return "OK";
    } catch (e) {
        return "ERR|처리 범위 확인 실패: " + e.message + " (line " + e.line + ")";
    }
}

function BXT_loadActiveLayerMaskAsSelection() {
    var descriptor = new ActionDescriptor();
    var selectionReference = new ActionReference();
    selectionReference.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
    descriptor.putReference(charIDToTypeID("null"), selectionReference);

    var maskReference = new ActionReference();
    maskReference.putEnumerated(
        charIDToTypeID("Chnl"),
        charIDToTypeID("Chnl"),
        charIDToTypeID("Msk ")
    );
    descriptor.putReference(charIDToTypeID("T   "), maskReference);
    executeAction(charIDToTypeID("setd"), descriptor, DialogModes.NO);
}

function BXT_addRevealSelectionMask() {
    var descriptor = new ActionDescriptor();
    descriptor.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));

    var maskReference = new ActionReference();
    maskReference.putEnumerated(
        charIDToTypeID("Chnl"),
        charIDToTypeID("Chnl"),
        charIDToTypeID("Msk ")
    );
    descriptor.putReference(charIDToTypeID("At  "), maskReference);
    descriptor.putEnumerated(
        charIDToTypeID("Usng"),
        charIDToTypeID("UsrM"),
        charIDToTypeID("RvlS")
    );
    executeAction(charIDToTypeID("Mk  "), descriptor, DialogModes.NO);
}

function BXT_maskTokenParts(maskToken) {
    var token = String(maskToken || "");
    var separator = token.indexOf(":");
    if (separator !== 1) throw new Error("하늘 영역 마스크 정보가 올바르지 않습니다.");
    return {
        source: token.substring(0, separator),
        channelName: token.substring(separator + 1)
    };
}

function BXT_findChannel(document, channelName) {
    for (var i = 0; i < document.channels.length; i++) {
        if (document.channels[i].name === channelName) return document.channels[i];
    }
    return null;
}

function BXT_activateCompositeChannels(document) {
    try {
        document.activeChannels = document.componentChannels;
    } catch (e) {
        throw new Error("합성 색상 채널 활성화 실패: " + e.message);
    }
}

function BXT_captureSkyMask(document) {
    var source = "S";
    var hadSelection = BXT_hasSelection(document);
    var originalChannels = null;
    try { originalChannels = document.activeChannels; } catch (_) {}

    if (!hadSelection) {
        if (!BXT_activeLayerHasMask()) {
            throw new Error("하늘 선택 영역이나 현재 레이어 마스크가 없습니다.");
        }
        BXT_loadActiveLayerMaskAsSelection();
        if (!BXT_hasSelection(document)) {
            throw new Error("현재 레이어 마스크에서 하늘 영역을 불러올 수 없습니다.");
        }
        source = "M";
    }

    var channel = null;
    try {
        channel = document.channels.add();
        channel.name = "__BXT_SKY_MASK_" + (new Date()).getTime() + "_" +
            Math.floor(Math.random() * 1000000);
        document.selection.store(channel, SelectionType.REPLACE);
        return source + ":" + channel.name;
    } catch (e) {
        try { if (channel) channel.remove(); } catch (_) {}
        throw new Error("하늘 영역 임시 저장 실패: " + e.message);
    } finally {
        try {
            if (originalChannels) document.activeChannels = originalChannels;
            else BXT_activateCompositeChannels(document);
        } catch (_) {}
        if (!hadSelection) {
            try { document.selection.deselect(); } catch (_) {}
        }
    }
}

function BXT_restoreSelectionAndRemoveMask(document, maskToken) {
    if (!maskToken) return;
    var parts = BXT_maskTokenParts(maskToken);
    var channel = BXT_findChannel(document, parts.channelName);
    if (!channel) return;

    try {
        if (parts.source === "S") {
            document.selection.load(channel, SelectionType.REPLACE);
        } else {
            document.selection.deselect();
        }
    } finally {
        try { channel.remove(); } catch (_) {}
    }
}

function BXT_applySkyMask(document, layer, maskToken) {
    var parts = BXT_maskTokenParts(maskToken);
    var channel = BXT_findChannel(document, parts.channelName);
    if (!channel) throw new Error("저장된 하늘 영역을 찾을 수 없습니다.");

    app.activeDocument = document;
    BXT_activateCompositeChannels(document);
    document.activeLayer = layer;
    document.selection.load(channel, SelectionType.REPLACE);
    BXT_addRevealSelectionMask();
    BXT_restoreSelectionAndRemoveMask(document, maskToken);
    BXT_activateCompositeChannels(document);
}

function BXT_containsLayer(group, target) {
    if (group === target) return true;
    if (!group.layers) return false;
    for (var i = 0; i < group.layers.length; i++) {
        var l = group.layers[i];
        if (l === target) return true;
        if (l.typename === "LayerSet" && BXT_containsLayer(l, target)) return true;
    }
    return false;
}

function BXT_keepOnlyTargetLayer(container, target) {
    for (var i = container.layers.length - 1; i >= 0; i--) {
        var l = container.layers[i];
        if (l === target) continue;

        if (l.typename === "LayerSet" && BXT_containsLayer(l, target)) {
            BXT_keepOnlyTargetLayer(l, target);
        } else {
            // This is a temporary duplicate. Removing unrelated layers avoids
            // Photoshop's unavailable Show/Hide commands in special states.
            l.remove();
        }
    }
}

function BXT_exportInput(outPath, scope) {
    if (app.documents.length === 0) return "ERR|열려 있는 문서가 없습니다.";

    var original = app.activeDocument;
    var originalName = original.name;
    var originalId;
    var maskToken = "";
    var work = null;
    var originalDialogs = app.displayDialogs;

    try {
        app.displayDialogs = DialogModes.NO;
        originalId = BXT_documentId(original);
        if (scope === "sky") maskToken = BXT_captureSkyMask(original);
        work = original.duplicate("__BXT_TEMP__", false);

        if (scope === "layer") {
            var target = work.activeLayer;
            BXT_keepOnlyTargetLayer(work, target);
        }

        // 원본은 유지하고 복제 문서만 BXT용 RGB 32-bit로 변환한다.
        BXT_prepareInputDocument(work);

        var f = BXT_safeFile(outPath);
        var opt = new TiffSaveOptions();
        opt.imageCompression = TIFFEncoding.NONE;
        opt.layers = false;
        try { opt.alphaChannels = false; } catch (_) {}
        opt.embedColorProfile = true;
        try { opt.transparency = false; } catch (_) {}

        work.saveAs(f, opt, true, Extension.LOWERCASE);
        work.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = original;

        return "OK|" + originalId + "|" + maskToken + "|" + originalName;

    } catch (e) {
        try { if (work) work.close(SaveOptions.DONOTSAVECHANGES); } catch (_) {}
        try { app.activeDocument = original; } catch (_) {}
        try { BXT_restoreSelectionAndRemoveMask(original, maskToken); } catch (_) {}
        return "ERR|" + e.message + " (line " + e.line + ")";
    } finally {
        app.displayDialogs = originalDialogs;
    }
}

function BXT_findDocumentById(id) {
    var expected = String(id);
    for (var i = 0; i < app.documents.length; i++) {
        try {
            if (String(app.documents[i].id) === expected) return app.documents[i];
        } catch (_) {}
    }
    return null;
}

function BXT_discardMask(originalDocId, maskToken) {
    if (!maskToken) return "OK";
    var targetDoc = BXT_findDocumentById(originalDocId);
    if (!targetDoc) return "OK";

    try {
        BXT_restoreSelectionAndRemoveMask(targetDoc, maskToken);
        return "OK";
    } catch (e) {
        return "ERR|하늘 영역 임시 데이터 정리 실패: " + e.message + " (line " + e.line + ")";
    }
}

function BXT_importResult(resultPath, originalDocId, originalDocName, maskToken) {
    var targetDoc = BXT_findDocumentById(originalDocId);
    if (!targetDoc) {
        return "ERR|원본 문서를 찾을 수 없습니다: " + originalDocName +
            " (document ID " + originalDocId + ")";
    }

    var resultDoc = null;
    var importedLayer = null;
    try {
        resultDoc = app.open(BXT_safeFile(resultPath));

        // 다른 비트 심도나 색상 모드의 문서에도 레이어를 안전하게 복제한다.
        BXT_matchResultDocument(resultDoc, targetDoc);

        // 결과 TIFF는 보통 단일 Background 레이어
        var resultLayer = resultDoc.activeLayer;
        importedLayer = resultLayer.duplicate(targetDoc, ElementPlacement.PLACEATBEGINNING);

        app.activeDocument = targetDoc;
        if (importedLayer) {
            importedLayer.name = "BlurXTerminator";
            targetDoc.activeLayer = importedLayer;
        } else {
            targetDoc.activeLayer.name = "BlurXTerminator";
        }

        if (maskToken) {
            BXT_applySkyMask(targetDoc, targetDoc.activeLayer, maskToken);
            targetDoc.activeLayer.name = "BlurXTerminator - Sky";
        }

        resultDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = targetDoc;

        return "OK";
    } catch (e) {
        try { if (resultDoc) resultDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (_) {}
        try { app.activeDocument = targetDoc; } catch (_) {}
        try { if (importedLayer) importedLayer.remove(); } catch (_) {}
        try { BXT_restoreSelectionAndRemoveMask(targetDoc, maskToken); } catch (_) {}
        return "ERR|" + e.message + " (line " + e.line + ")";
    }
}
