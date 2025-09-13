import type { MapEventType, MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import * as Constants from '../constants.ts';

export function isOfMetaType(type: typeof Constants["meta"][keyof typeof Constants["meta"]]) {
  return (e: MapMouseEvent | MapTouchEvent) => {
    return 'featureTarget' in e &&
      typeof e.featureTarget === 'object' &&
      e.featureTarget !== null &&
      'properties' in e.featureTarget &&
      typeof e.featureTarget.properties === 'object' &&
      e.featureTarget.properties !== null &&
      'meta' in e.featureTarget.properties &&
      e.featureTarget.properties.meta === type;
  };
}

export function isShiftMousedown(e: MapEventType[keyof MapEventType]) {
  return 'originalEvent' in e &&
    typeof e.originalEvent === 'object' &&
    e.originalEvent !== null &&
    'shiftKey' in e.originalEvent &&
    e.originalEvent.shiftKey &&
    'button' in e.originalEvent &&
    e.originalEvent.button === 0;
}

export function isActiveFeature(e: MapMouseEvent | MapTouchEvent) {
  return 'featureTarget' in e &&
    typeof e.featureTarget === 'object' &&
    e.featureTarget !== null &&
    'properties' in e.featureTarget &&
    typeof e.featureTarget.properties === 'object' &&
    e.featureTarget.properties !== null &&
    'active' in e.featureTarget.properties &&
    e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    'meta' in e.featureTarget.properties &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isInactiveFeature(e: MapMouseEvent | MapTouchEvent) {
  return 'featureTarget' in e &&
    typeof e.featureTarget === 'object' &&
    e.featureTarget !== null &&
    'properties' in e.featureTarget &&
    typeof e.featureTarget.properties === 'object' &&
    e.featureTarget.properties !== null &&
    'active' in e.featureTarget.properties &&
    e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    'meta' in e.featureTarget.properties &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function noTarget(e: MapMouseEvent | MapTouchEvent) {
  return !('featureTarget' in e) ||
    e.featureTarget === undefined;
}

export function isFeature(e: MapMouseEvent | MapTouchEvent) {
  return 'featureTarget' in e &&
      typeof e.featureTarget === 'object' &&
      e.featureTarget !== null &&
      'properties' in e.featureTarget &&
      typeof e.featureTarget.properties === 'object' &&
      e.featureTarget.properties !== null &&
      'meta' in e.featureTarget.properties &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isVertex(e: MapMouseEvent | MapTouchEvent) {
  return 'featureTarget' in e &&
      typeof e.featureTarget === 'object' &&
      e.featureTarget !== null &&
      'properties' in e.featureTarget &&
      typeof e.featureTarget.properties === 'object' &&
      e.featureTarget.properties !== null &&
      'meta' in e.featureTarget.properties &&
      e.featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isShiftDown(e: MapEventType[keyof MapEventType]) {
  return 'originalEvent' in e &&
    typeof e.originalEvent === 'object' &&
    e.originalEvent !== null &&
    'shiftKey' in e.originalEvent &&
    e.originalEvent.shiftKey;
}

export function isEscapeKey({code}: KeyboardEvent) {
  return code === 'Escape';
}

export function isEnterKey({code}: KeyboardEvent) {
  return code === 'Enter';
}

export function isBackspaceKey({code}: KeyboardEvent) {
  return code === 'Backspace';
}

export function isDeleteKey({code}: KeyboardEvent) {
  return code === 'Delete';
}

export function isDigit1Key({code}: KeyboardEvent) {
  return code === 'Digit1' || code === 'Numpad1';
}

export function isDigit2Key({code}: KeyboardEvent) {
  return code === 'Digit2' || code === 'Numpad2';
}

export function isDigit3Key({code}: KeyboardEvent) {
  return code === 'Digit3' || code === 'Numpad3';
}

const DIGIT_KEY_RE = /^(?:Digit|Numpad)\d$/;

export function isDigitKey({code}: KeyboardEvent) {
  return DIGIT_KEY_RE.test(code);
}
