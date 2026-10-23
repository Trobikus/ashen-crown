import { settings, DEFAULT_SETTINGS, SETTINGS_KEY } from './state.js';

import { el } from './dom.js';

import { setVolumes } from './audio.js';

import { applyFullscreenSetting } from './display.js';

import { setLangPreference, applyStaticI18n } from './i18n.js';



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

// Die Sprache nur bei echtem Wechsel umsetzen — applySettings läuft bei jeder
// Einstellungsänderung, der Sprachwechsel (Wörterbuch, statische Texte,
// Listener) darf aber nur einmal anschlagen.
let appliedLang = null;

function applySettings() {
  el.skillTree.classList.toggle('no-pulse', !settings.skillPulse);
  for (const input of el.optionsPanel.querySelectorAll('[data-setting]')) {
    input.checked = settings[input.dataset.setting];
  }
  for (const input of el.optionsPanel.querySelectorAll('[data-volume]')) {
    input.value = settings[input.dataset.volume];
  }
  for (const select of el.optionsPanel.querySelectorAll('[data-choicesetting]')) {
    select.value = settings[select.dataset.choicesetting] ?? 'aus';
  }
  setVolumes({ master: settings.volumeMaster, sfx: settings.volumeSfx, music: settings.volumeMusic });
  applyFullscreenSetting();
  if ((settings.lang ?? 'auto') !== appliedLang) {
    appliedLang = settings.lang ?? 'auto';
    setLangPreference(appliedLang);
    applyStaticI18n();
  }
}

export { loadSettings, saveSettings, applySettings };
