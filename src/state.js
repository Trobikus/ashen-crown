import { GEAR_SLOTS, INVENTORY_CAP, DEATH_ASH_PENALTY, DEATH_REVIVE_SHARE, OFFLINE_CAP_MS } from './data.js';

import { ashLegacyFactor, xpLegacyFactor } from './prestige.js';

const SAVE_KEY = 'ashen-crown-save';

const SETTINGS_KEY = 'ashen-crown-settings';

const SAVE_VERSION = 9;

const DEFAULT_SETTINGS = {
  lang: 'auto',
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
  heroName: 'Held',
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
  achievementsPending: [],
  ruhmAusgegeben: 0,
  shopPurchases: { beutelschein: 0, zollerlass: 0, aschesegen: 0, tiefenkunde: 0, werkstatthandwerk: 0 },
  safedropZones: {},
  // Prestige: Kronenasche (Erwerbs-/Ausgabe-Buch) und das Vermächtnis (Titel-
  // Stufen) — die Meta-Ebene über den Läufen, siehe src/prestige.js.
  kronenascheEarned: 0,
  kronenascheAusgegeben: 0,
  prestigeRuns: 0,
  legacy: {},
  // Der Asche-Nachhall: Snapshot des letzten Laufs, überlebt das Erwachen
  // wie Ruhm und Kronenasche (siehe src/echo.js); null, solange nie erwacht
  // wurde. Gehärtet wird er beim Laden (saveio → sanitizeEcho).
  echo: null,
};

// Ruhm-Käufe wirken direkt auf die Systemregeln: Der Beutelschein erweitert
// das Inventar, der Zollerlass senkt den Todeszoll (Boden bei 3 %).
function inventoryCap() {
  return INVENTORY_CAP + 8 * (state.shopPurchases.beutelschein ?? 0);
}

function deathPenalty() {
  return Math.max(0.03, DEATH_ASH_PENALTY - 0.03 * (state.shopPurchases.zollerlass ?? 0));
}

// Aschesegen (Ruhm-Laden) und das Kronenasche-Fundament (Prestige) multipli-
// zieren zusammen auf jeden Asche-Ertrag — im Feld wie offline.
function ashGainFactor() {
  return (1 + 0.1 * (state.shopPurchases.aschesegen ?? 0)) * ashLegacyFactor(state);
}

// Erfahrung: Kronenasche-Fundament + Aschengeist (Vermächtnis) + Alte Lehre.
function xpGainFactor() {
  return xpLegacyFactor(state) * (1 + 0.05 * (state.shopPurchases.altelehre ?? 0));
}

// Kriegerherz: +5 % auf den gesamten Maximalwert der Lebenskraft je Stufe.
function heroHpFactor() {
  return 1 + 0.05 * (state.shopPurchases.kriegerherz ?? 0);
}

// Wuchtschlag: +10 Kritschaden-Prozentpunkte je Stufe (wie Gear-Kritschaden).
function critDmgBonusPct() {
  return 10 * (state.shopPurchases.wuchtschlag ?? 0);
}

// Schrein-Atem: Die Regeneration am Schrein läuft 25 % schneller je Stufe.
function hubRegenFactor() {
  return 1 + 0.25 * (state.shopPurchases.schreinatem ?? 0);
}

// Aschewille: Die Auferstehung startet mit mehr Lebenskraft (+5 % je Stufe).
function deathReviveShare() {
  return DEATH_REVIVE_SHARE + 0.05 * (state.shopPurchases.aschwille ?? 0);
}

// Tiefenkunde: verlängert den Offline-Fortschritt über die 8-h-Grenze hinaus.
function offlineCapMs() {
  return OFFLINE_CAP_MS + 4 * 60 * 60 * 1000 * (state.shopPurchases.tiefenkunde ?? 0);
}

// Werkstatthandwerk: senkt alle Asche-Preise der Werkstatt (Boden 85 %).
function craftCostFactor() {
  return 1 - 0.05 * (state.shopPurchases.werkstatthandwerk ?? 0);
}

export { SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, SAVE_VERSION, settings, state, inventoryCap, deathPenalty, ashGainFactor, xpGainFactor, offlineCapMs, craftCostFactor, heroHpFactor, critDmgBonusPct, hubRegenFactor, deathReviveShare };
