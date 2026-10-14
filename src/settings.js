import { settings, DEFAULT_SETTINGS, SETTINGS_KEY } from './state.js';

import { el } from './dom.js';

import { setVolumes } from './audio.js';



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
  for (const input of el.optionsPanel.querySelectorAll('[data-volume]')) {
    input.value = settings[input.dataset.volume];
  }
  setVolumes({ master: settings.volumeMaster, sfx: settings.volumeSfx, music: settings.volumeMusic });
}

export { loadSettings, saveSettings, applySettings };
