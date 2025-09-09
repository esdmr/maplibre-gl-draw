import * as Constants from '../constants.js';

export function isOfMetaType(type) {
  return e => {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === type;
  };
}

export function isShiftMousedown({originalEvent}) {
  if (!originalEvent) return false;
  if (!originalEvent.shiftKey) return false;
  return originalEvent.button === 0;
}

export function isActiveFeature({featureTarget}) {
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isInactiveFeature({featureTarget}) {
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function noTarget({featureTarget}) {
  return featureTarget === undefined;
}

export function isFeature({featureTarget}) {
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isVertex(e) {
  const featureTarget = e.featureTarget;
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isShiftDown({originalEvent}) {
  if (!originalEvent) return false;
  return originalEvent.shiftKey === true;
}

export function isEscapeKey({key, keyCode}) {
  return key === 'Escape' || keyCode === 27;
}

export function isEnterKey({key, keyCode}) {
  return key === 'Enter' || keyCode === 13;
}

export function isBackspaceKey({key, keyCode}) {
  return key === 'Backspace' || keyCode === 8;
}

export function isDeleteKey({key, keyCode}) {
  return key === 'Delete' || keyCode === 46;
}

export function isDigit1Key({key, keyCode}) {
  return key === '1' || keyCode === 49;
}

export function isDigit2Key({key, keyCode}) {
  return key === '2' || keyCode === 50;
}

export function isDigit3Key({key, keyCode}) {
  return key === '3' || keyCode === 51;
}

export function isDigitKey(e) {
  const key = e.key || String.fromCharCode(e.keyCode);
  const isDigitKey = key >= '0' && key <= '9';
  return isDigitKey;
}

export function isTrue() {
  return true;
}
