(function (root) {
  "use strict";

  var BXT = root.BXT = root.BXT || {};
  BXT.ui = BXT.ui || {};

  BXT.ui.createProcessingSettings = function (document) {
    var strength = document.getElementById("strength");
    var stars = document.getElementById("stars");
    var nonstellar = document.getElementById("nonstellar");
    var halos = document.getElementById("halos");
    var strengthValue = document.getElementById("strengthValue");
    var starsValue = document.getElementById("starsValue");
    var nonstellarValue = document.getElementById("nonstellarValue");
    var halosValue = document.getElementById("halosValue");
    var linkStrength = document.getElementById("linkStrength");
    var generalMode = document.getElementById("generalMode");
    var planetaryMode = document.getElementById("planetaryMode");
    var psfDiameter = document.getElementById("psfDiameter");
    var psfDiameterValue = document.getElementById("psfDiameterValue");
    var strengthControl = document.getElementById("strengthControl");
    var resetDetails = document.getElementById("resetDetails");

    function setFixed(id, value, digits) {
      document.getElementById(id).value = Number(value).toFixed(digits);
    }

    function setRangeFromNumber(range, numberInput, digits) {
      var value = Number(numberInput.value);
      if (!isFinite(value)) value = Number(range.value);
      value = Math.max(Number(range.min), Math.min(Number(range.max), value));
      range.value = value;
      numberInput.value = value.toFixed(digits);
    }

    function updateStrengthValues() {
      setFixed("strengthValue", strength.value, 2);
      if (linkStrength.checked) {
        stars.value = strength.value;
        nonstellar.value = strength.value;
        setFixed("starsValue", stars.value, 2);
        setFixed("nonstellarValue", nonstellar.value, 2);
      }
    }

    function showModeElements(className, visible) {
      var elements = document.querySelectorAll("." + className);
      for (var i = 0; i < elements.length; i++) elements[i].classList.toggle("hidden", !visible);
    }

    function updateModeControls() {
      var planetary = planetaryMode.checked;
      var linked = linkStrength.checked && !planetary;
      if (linked) updateStrengthValues();
      showModeElements("general-mode-only", !planetary);
      showModeElements("planetary-mode-only", planetary);
      strength.disabled = planetary || !linked;
      strengthValue.disabled = planetary || !linked;
      stars.disabled = planetary || linked;
      starsValue.disabled = planetary || linked;
      nonstellar.disabled = linked;
      nonstellarValue.disabled = linked;
      halos.disabled = planetary;
      halosValue.disabled = planetary;
      psfDiameter.disabled = !planetary;
      psfDiameterValue.disabled = !planetary;
      strengthControl.classList.toggle("disabled-control", !linked);
      stars.parentNode.classList.toggle("disabled-control", linked);
      nonstellar.parentNode.classList.toggle("disabled-control", linked);
    }

    function reset() {
      generalMode.checked = true;
      planetaryMode.checked = false;
      linkStrength.checked = true;
      strength.value = "0.30";
      stars.value = "0.30";
      nonstellar.value = "0.30";
      halos.value = "0";
      psfDiameter.value = "2.0";
      setFixed("strengthValue", strength.value, 2);
      setFixed("starsValue", stars.value, 2);
      setFixed("nonstellarValue", nonstellar.value, 2);
      setFixed("halosValue", halos.value, 2);
      setFixed("psfDiameterValue", psfDiameter.value, 1);
      updateModeControls();
    }

    function init() {
      strength.addEventListener("input", updateStrengthValues);
      stars.addEventListener("input", function () { setFixed("starsValue", stars.value, 2); });
      nonstellar.addEventListener("input", function () { setFixed("nonstellarValue", nonstellar.value, 2); });
      halos.addEventListener("input", function () { setFixed("halosValue", halos.value, 2); });
      psfDiameter.addEventListener("input", function () { setFixed("psfDiameterValue", psfDiameter.value, 1); });
      strengthValue.addEventListener("change", function () { setRangeFromNumber(strength, strengthValue, 2); updateStrengthValues(); });
      starsValue.addEventListener("change", function () { setRangeFromNumber(stars, starsValue, 2); });
      nonstellarValue.addEventListener("change", function () { setRangeFromNumber(nonstellar, nonstellarValue, 2); });
      halosValue.addEventListener("change", function () { setRangeFromNumber(halos, halosValue, 2); });
      psfDiameterValue.addEventListener("change", function () { setRangeFromNumber(psfDiameter, psfDiameterValue, 1); });
      generalMode.addEventListener("change", updateModeControls);
      planetaryMode.addEventListener("change", updateModeControls);
      linkStrength.addEventListener("change", function () {
        if (linkStrength.checked) updateStrengthValues();
        updateModeControls();
      });
      resetDetails.addEventListener("click", reset);
      updateModeControls();
    }

    return {
      init: init,
      reset: reset,
      capture: function (executable) {
        return {
          exe: executable || "rc-astro",
          scope: "auto",
          planetary: planetaryMode.checked,
          psfDiameter: Number(psfDiameter.value).toFixed(1),
          stars: Number(stars.value).toFixed(2),
          nonstellar: Number(nonstellar.value).toFixed(2),
          halos: Number(halos.value).toFixed(2)
        };
      }
    };
  };
}(window));
