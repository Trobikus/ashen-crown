import { GEAR_SLOTS, INVENTORY_CAP, DEATH_ASH_PENALTY, OFFLINE_CAP_MS } from './data.js';

const SAVE_KEY = 'ashen-crown-save';

const SETTINGS_KEY = 'ashen-crown-settings';

const SAVE_VERSION = 8;

const DEFAULT_SETTINGS = {
  damageNumbers: true,
  hitFlash: true,
  skillPulse: true,
  screenshake: true,
  offlineProgress: true,
  offlineSummary: true,
  displayFullscreen: false,
  autoDoor: true,
  autoSell: 'aus',
  volumeMaster: 80,
  volumeSfx: 85,
  volumeMusic: 60,
};

const settings = { ...DEFAULT_SETTINGS };

const state = {
  saveVersion: SAVE_VERSION,
  ash: 0,
  xp: 0,
  level: 1,
  maxHp: 35,
  // Persistierte Lebenskraft (beim Laden gegen das Maximum geklemmt); 0 = voll.
  hp: 0,
  damage: 2,
  kills: 0,
  zone: 0,
  cleared: 0,
  crownWon: false,
  zoneKills: 0,
  lastSeen: 0,
  itemSeq: 0,
  inventory: [],
  equipment: Object.fromEntries(GEAR_SLOTS.map((slot) => [slot.key, null])),
  statPoints: 0,
  armorBase: 0,
  critBonus: 0,
  skillPoints: 0,
  skills: ['start'],
  inField: false,
  seenContinents: [],
  hints: {},
  // Statistik-Zähler (Fundament für die Statistik-Seite): Tode, Spielzeit
  // und gefundene Beute je Seltenheit — alte Spielstände zählen ab dem
  // Laden weiter (prepareSave härtet die Felder gegen kaputte Werte).
  deaths: 0,
  playtimeMs: 0,
  drops: { gewoehnlich: 0, magisch: 0, selten: 0, episch: 0, legendär: 0 },
  bestiary: {},
  achievements: [],
  ruhmAusgegeben: 0,
  shopPurchases: { beutelschein: 0, zollerlass: 0, aschesegen: 0, tiefenkunde: 0, werkstatthandwerk: 0 },
  safedropZones: {},
};

// Ruhm-Käufe wirken direkt auf die Systemregeln: Der Beutelschein erweitert
// das Inventar, der Zollerlass senkt den Todeszoll (Boden bei 3 %).
function inventoryCap() {
  return INVENTORY_CAP + 8 * (state.shopPurchases.beutelschein ?? 0);
}

function deathPenalty() {
  return Math.max(0.03, DEATH_ASH_PENALTY - 0.03 * (state.shopPurchases.zollerlass ?? 0));
}

// Aschesegen: +10 % auf jeden Asche-Ertrag pro Stufe — im Feld wie offline.
function ashGainFactor() {
  return 1 + 0.1 * (state.shopPurchases.aschesegen ?? 0);
}

// Tiefenkunde: verlängert den Offline-Fortschritt über die 8-h-Grenze hinaus.
function offlineCapMs() {
  return OFFLINE_CAP_MS + 4 * 60 * 60 * 1000 * (state.shopPurchases.tiefenkunde ?? 0);
}

// Werkstatthandwerk: senkt alle Asche-Preise der Werkstatt (Boden 85 %).
function craftCostFactor() {
  return 1 - 0.05 * (state.shopPurchases.werkstatthandwerk ?? 0);
}

export { SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, SAVE_VERSION, settings, state, inventoryCap, deathPenalty, ashGainFactor, offlineCapMs, craftCostFactor };
