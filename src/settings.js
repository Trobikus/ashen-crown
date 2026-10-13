import { settings, DEFAULT_SETTINGS } from './state.js';

import { el } from './dom.js';



function loadSettings() {
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {});
  } catch {
    Object.assign(settings, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
  el.skillTree.classList.toggle('no-pulse', !settings.skillPulse);
  for (const input of el.optionsPanel.querySelectorAll('[data-setting]')) {
    input.checked = settings[input.dataset.setting];
  }
}

export { loadSettings, saveSettings, applySettings };
