import createSyntheticEvent from 'synthetic-dom-events';
import * as Constants from '../../src/constants.ts';

const classList = [Constants.classes.CANVAS];
classList.contains = function(cls) {
  return classList.indexOf(cls) >= 0;
};

export const enterEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  code: 'Enter'
});

export const startPointEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  code: 'Digit1'
});

export const startLineStringEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  code: 'Digit2'
});

export const startPolygonEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  code: 'Digit3'
});

export const escapeEvent = createSyntheticEvent('keyup', {
  srcElement: { classList },
  code: 'Escape'
});

export const backspaceEvent = createSyntheticEvent('keydown', {
  srcElement: { classList },
  code: 'Backspace'
});
