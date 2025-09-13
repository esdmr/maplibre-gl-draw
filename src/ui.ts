import * as Constants from './constants.ts';
import type { MaplibreDrawContext } from './context.ts';

const classTypes = ['mode', 'feature', 'mouse'] as const;

export type MapClasses = Record<typeof classTypes[number], string | null>;

export default function ui<T extends Record<string, {}>>(ctx: MaplibreDrawContext<T>) {
  const buttonElements: Record<string, HTMLElement> = {};
  let activeButton: HTMLElement | undefined;

  let currentMapClasses: MapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  let nextMapClasses: MapClasses = {
    mode: null as string | null,
    feature: null as string | null,
    mouse: null as string | null
  };

  function clearMapClasses() {
    queueMapClasses({mode:null, feature:null, mouse:null});
    updateMapClasses();
  }

  function queueMapClasses(options: Partial<MapClasses>) {
    nextMapClasses = Object.assign(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.setup) return;

    const classesToRemove: string[] = [];
    const classesToAdd: string[] = [];

    classTypes.forEach((type) => {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(`${type}-${currentMapClasses[type]}`);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(`${type}-${nextMapClasses[type]}`);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove(...classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add(...classesToAdd);
    }

    currentMapClasses = Object.assign(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id: string, options: { container: HTMLElement; className: string; title: string; onActivate(): void; onDeactivate?(): void; }) {
    const button = document.createElement('button');
    button.className = `${Constants.classes.CONTROL_BUTTON} ${options.className}`;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        options.onDeactivate?.();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = undefined;
  }

  function setActiveButton(id = '') {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    // FIXME: Remove hard coded behavior
    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    const controlGroup = document.createElement('div');
    controlGroup.className = `${Constants.classes.CONTROL_GROUP} ${Constants.classes.CONTROL_BASE}`;

    if (!controls) return controlGroup;

    // FIXME: Add base type to modes
    if (controls[Constants.types.POINT]) {
      buttonElements[Constants.types.POINT] = createControlButton(Constants.types.POINT, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POINT,
        title: `Marker tool ${ctx.options.keybindings ? '(1)' : ''}`,
        // FIXME: Remove hardcoded activation phase
        onActivate: () => ctx.events.changeMode(Constants.modes.DRAW_POINT as keyof T, {} as T[keyof T]),
        onDeactivate: () => ctx.events.trash()
      });
    }

    // FIXME: Add base type to modes
    if (controls[Constants.types.LINE]) {
      buttonElements[Constants.types.LINE] = createControlButton(Constants.types.LINE, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_LINE,
        title: `LineString tool ${ctx.options.keybindings ? '(2)' : ''}`,
        // FIXME: Remove hardcoded activation phase
        onActivate: () => ctx.events.changeMode(Constants.modes.DRAW_LINE_STRING as keyof T, {} as T[keyof T]),
        onDeactivate: () => ctx.events.trash()
      });
    }

    // FIXME: Add base type to modes
    if (controls[Constants.types.POLYGON]) {
      buttonElements[Constants.types.POLYGON] = createControlButton(Constants.types.POLYGON, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POLYGON,
        title: `Polygon tool ${ctx.options.keybindings ? '(3)' : ''}`,
        // FIXME: Remove hardcoded activation phase
        onActivate: () => ctx.events.changeMode(Constants.modes.DRAW_POLYGON as keyof T, {} as T[keyof T]),
        onDeactivate: () => ctx.events.trash()
      });
    }

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_TRASH,
        title: 'Delete',
        onActivate: () => {
          ctx.events.trash();
        }
      });
    }

    if (controls.combine_features) {
      buttonElements.combine_features = createControlButton('combineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_COMBINE_FEATURES,
        title: 'Combine',
        onActivate: () => {
          ctx.events.combineFeatures();
        }
      });
    }

    if (controls.uncombine_features) {
      buttonElements.uncombine_features = createControlButton('uncombineFeatures', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_UNCOMBINE_FEATURES,
        title: 'Uncombine',
        onActivate: () => {
          ctx.events.uncombineFeatures();
        }
      });
    }

    return controlGroup;
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach((buttonId) => {
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setActiveButton,
    queueMapClasses,
    updateMapClasses,
    clearMapClasses,
    addButtons,
    removeButtons
  };
}
