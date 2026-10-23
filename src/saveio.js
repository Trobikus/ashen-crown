// Das Speicher-Subsystem: Schreiben (mit Backup-Rotation), Laden (mit
// Migration und Härtung) und Import/Export. Die Härtung bereinigt ALLES auf
// dem rohen Spielstand, bevor etwas davon den echten Spielstand berührt —
// ein böser Spielstand darf nie den Render-Loop crashen.
import { state, SAVE_KEY, SAVE_VERSION } from './state.js';
import { GEAR_SLOTS, RARITIES, SKILL_NODES_BY_ID, SKILL_TREE_UNLOCK_LEVEL, MAX_ZONE, sanitizeItem, asCount } from './data.js';
import { t } from './i18n.js';
import { MAX_SKILL_POINTS } from './skilltree.js';
import { LEGACY_TITLES } from './prestige.js';
import { el } from './dom.js';
import { flashButton } from './domfx.js';
import { toast } from './feedback.js';
import { use } from './bus.js';

const BACKUP_KEYS = ['ashen-crown-save.bak1', 'ashen-crown-save.bak2', 'ashen-crown-save.bak3'];

const BACKUP_MIN_GAP_MS = 10 * 60 * 1000;

// True zwischen „Spielstand zurücksetzen" und dem Reload: in diesem Fenster
// darf kein save() den alten Zustand zurück ins localStorage schreiben.
let saveSuppressed = false;

function suppressSave() {
  saveSuppressed = true;
}

// Blockierter Speicher (Web-Build, Privatmodus, Quota): Ein Wurf darf das
// Spiel nicht töten — gedrosselte Warnung statt Exception.
let lastStorageWarning = 0;

function warnStorageBroken() {
  if (Date.now() - lastStorageWarning < 30000) return;
  lastStorageWarning = Date.now();
  toast(t('Spielstand konnte nicht gespeichert werden — der Speicher blockiert Schreibzugriffe.'), '#c1663a');
}

function save() {
  if (saveSuppressed) return;
  state.lastSeen = Date.now();
  state.hp = Math.max(0, Math.round(use('heroHp').get()));
  rotateBackups();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    warnStorageBroken();
  }
}

// Rücksichtslos löschen heißt: Hauptstand UND Backup-Kette — sonst lädt
// der nächste Start still das Backup und der „gelöschte" Held kehrt zurück.
// Der Suppress hält Zwischenspeicherer aus dem Fenster bis zum Reload.
function purgeSaves() {
  saveSuppressed = true;
  for (const key of [SAVE_KEY, ...BACKUP_KEYS]) localStorage.removeItem(key);
}

const asNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

function parseSave(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.level !== 'number' || !Number.isFinite(data.level)) return null;
    if (typeof data.ash !== 'number' || !Number.isFinite(data.ash)) return null;
    return data;
  } catch {
    return null;
  }
}

// ——— Onboarding-Schlüssel der Migration ———

const ONBOARDING_HINT_KEYS = ['hint-combat', 'hint-levelup', 'hint-drop', 'hint-epic', 'hint-leech', 'hint-boss', 'hint-skills', 'hint-map', 'hint-crafting'];

function migrateSave(data) {
  if (typeof data.saveVersion !== 'number') data.saveVersion = 1; // Spielstände vor 0.4.0
  if (data.saveVersion < 3) data.inField ??= true; // Spielstände vor 0.7.0: Held galt stets als im Feld
  if (data.saveVersion < 4) {
    // Spielstände vor 0.9.0: Onboarding nur nachholen, was wirklich verpasst wurde.
    data.hints = {};
    if ((data.kills ?? 0) > 0 || (data.cleared ?? 0) > 0) data.hints['hint-combat'] = true;
    if ((data.level ?? 1) >= 2) data.hints['hint-levelup'] = true;
    if ((data.itemSeq ?? 0) > 0) data.hints['hint-drop'] = true;
    if ((data.cleared ?? 0) > 0) data.hints['hint-boss'] = true;
    if ((data.kills ?? 0) > 30) {
      for (const key of ONBOARDING_HINT_KEYS) data.hints[key] = true;
    }
  }
  // Spielstände vor 0.11.0 (v4): Keine Migration nötig — die Felder Basis,
  // Ilvl und die Statistik-Zähler härtet prepareSave für Altbestand nach.
  // Spielstände vor 0.13.0 (v5): Bestiarium, Errungenschaften und
  // Tiefen-Meisterschaften kommen ebenfalls über die prepareSave-Härtung.
  // Künftige Migrationen hier anhängen (if (data.saveVersion === n) …).
  data.saveVersion = SAVE_VERSION;
  return data;
}

// Zeitstempel der letzten geglückten Rotation im laufenden Prozess — der
// Warm-Pfad steigt damit aus, ganz ohne localStorage-Read und JSON.parse.
let lastBackupRotatedAt = 0;

function rotateBackups(force = false) {
  // save() läuft mit jedem 3-Sekunden-Tick und jedem Kill; die beiden
  // Voll-Parses des Spielstands fielen sonst in jedem Aufruf an.
  if (!force && Date.now() - lastBackupRotatedAt < BACKUP_MIN_GAP_MS) return;
  const current = parseSave(localStorage.getItem(SAVE_KEY));
  if (!current) return;
  const newest = parseSave(localStorage.getItem(BACKUP_KEYS[0]));
  if (!force && newest && Date.now() - (newest.lastSeen ?? 0) < BACKUP_MIN_GAP_MS) return;
  try {
    localStorage.setItem(BACKUP_KEYS[2], localStorage.getItem(BACKUP_KEYS[1]) ?? '');
    localStorage.setItem(BACKUP_KEYS[1], localStorage.getItem(BACKUP_KEYS[0]) ?? '');
    localStorage.setItem(BACKUP_KEYS[0], JSON.stringify(current));
    lastBackupRotatedAt = Date.now();
  } catch {
    // Backups sind der zweite Schutzring — ihr Scheitern darf das Speichern
    // des Hauptstands nicht mitreißen (die Quota gilt für beide).
  }
}

// Härtung: bereinigt ALLES auf dem rohen Spielstand-Objekt, bevor etwas davon
// den echten Spielstand berührt — korrupte Werte werden repariert oder
// verworfen, ein böser Spielstand darf nie den Render-Loop crashen.
function prepareSave(data) {
  migrateSave(data);
  data.ash = Math.max(0, asNumber(data.ash, 0));
  data.xp = Math.max(0, asNumber(data.xp, 0));
  data.level = Math.max(1, asNumber(data.level, 1));
  data.maxHp = Math.max(1, asNumber(data.maxHp, 30));
  data.hp = Math.max(0, asNumber(data.hp, 0));
  data.damage = Math.max(1, asNumber(data.damage, 2));
  data.kills = Math.max(0, asNumber(data.kills, 0));
  data.zoneKills = Math.max(0, asNumber(data.zoneKills, 0));
  data.statPoints = Math.max(0, asNumber(data.statPoints, 0));
  data.armorBase = Math.max(0, asNumber(data.armorBase, 0));
  data.critBonus = Math.max(0, asNumber(data.critBonus, 0));
  data.skillPoints = Math.max(0, asNumber(data.skillPoints, 0));
  data.itemSeq = asCount(data.itemSeq);
  const rawEquipment = data.equipment && typeof data.equipment === 'object' && !Array.isArray(data.equipment)
    ? data.equipment
    : {};
  data.equipment = {};
  const seenIds = new Set();
  const ensureId = (item) => {
    if (typeof item.id !== 'number' || !Number.isFinite(item.id) || seenIds.has(item.id)) {
      data.itemSeq += 1;
      item.id = data.itemSeq;
    }
    seenIds.add(item.id);
  };
  for (const slot of GEAR_SLOTS) {
    data.equipment[slot.key] = sanitizeItem(rawEquipment[slot.key]);
    if (data.equipment[slot.key]) ensureId(data.equipment[slot.key]);
  }
  data.inventory = (Array.isArray(data.inventory) ? data.inventory : [])
    .map(sanitizeItem)
    .filter(Boolean);
  data.inventory.forEach(ensureId);
  if (!Array.isArray(data.skills)) data.skills = ['start'];
  if (!data.skills.includes('start')) data.skills.unshift('start');
  data.skills = data.skills.filter((id) => SKILL_NODES_BY_ID[id]);
  // Runenpunkte gibt es erst ab SKILL_TREE_UNLOCK_LEVEL, dann alle zwei
  // Stufen einen — geklemmt an die Ertrags-Obergrenze der Pfad-Bindung: Nie
  // mehr unverteilte Punkte, als zwei vollständige Pfade noch aufnehmen.
  // Verteilte Knoten bleiben unangetastet, auch wenn alte Spielstände nach
  // dem neuen Rhythmus „zu viel" erhalten hätten.
  const earnedSkillPoints = data.level >= SKILL_TREE_UNLOCK_LEVEL
    ? Math.floor((data.level - SKILL_TREE_UNLOCK_LEVEL) / 2) + 1
    : 0;
  const distributedSkillPoints = data.skills.length - 1;
  data.skillPoints = Math.min(
    Math.max(0, earnedSkillPoints - distributedSkillPoints),
    Math.max(0, MAX_SKILL_POINTS - distributedSkillPoints),
  );
  data.zone = Math.max(0, Math.min(Math.trunc(asNumber(data.zone, 0)), MAX_ZONE));
  data.cleared = Math.max(0, Math.min(Math.trunc(asNumber(data.cleared, 0)), MAX_ZONE));
  data.zone = Math.min(data.zone, data.cleared);
  data.crownWon = data.crownWon === true;
  data.inField = data.inField === true;
  // Der Name des Erweckten: Steuer- und Nullbreiten-Zeichen raus, Länge
  // geklemmt — wer leer abgibt, bleibt schlicht „Held".
  data.heroName = String(data.heroName ?? '')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, ' ')
    .trim()
    .slice(0, 24);
  if (!data.heroName) data.heroName = 'Held';
  // Statistik-Zähler: Alte Spielstände starten bei null, kaputte Werte
  // werden auf sichere Grenzen gezogen.
  data.deaths = Math.max(0, asNumber(data.deaths, 0));
  data.playtimeMs = Math.max(0, asNumber(data.playtimeMs, 0));
  data.drops = data.drops && typeof data.drops === 'object' && !Array.isArray(data.drops) ? data.drops : {};
  for (const rarity of RARITIES) data.drops[rarity.key] = Math.max(0, asNumber(data.drops[rarity.key], 0));
  // Bestiarium (Name → Kill-Zähler) und Errungenschaften (ID-Liste):
  // Fremdes wird verworfen, Überlängen geklemmt, Nullen verworfen.
  data.bestiary = data.bestiary && typeof data.bestiary === 'object' && !Array.isArray(data.bestiary) ? data.bestiary : {};
  const cleanBestiary = {};
  for (const [name, count] of Object.entries(data.bestiary)) {
    const kills = asCount(count);
    if (typeof name === 'string' && name && kills > 0) cleanBestiary[name.slice(0, 60)] = kills;
  }
  data.bestiary = cleanBestiary;
  data.achievements = Array.isArray(data.achievements)
    ? data.achievements.filter((id) => typeof id === 'string' && id.length <= 40)
    : [];
  // Abhol-Regal: erfüllte, aber noch nicht eingesammelte Errungenschaften.
  data.achievementsPending = Array.isArray(data.achievementsPending)
    ? data.achievementsPending.filter((id) => typeof id === 'string' && id.length <= 40)
    : [];
  // Ruhm-Laden: ausgegebener Ruhm und Kaufläufe geklemmt.
  data.ruhmAusgegeben = Math.max(0, asNumber(data.ruhmAusgegeben, 0));
  data.shopPurchases = data.shopPurchases && typeof data.shopPurchases === 'object' && !Array.isArray(data.shopPurchases) ? data.shopPurchases : {};
  data.shopPurchases.beutelschein = Math.min(3, asNumber(data.shopPurchases.beutelschein, 0));
  data.shopPurchases.zollerlass = Math.min(4, asNumber(data.shopPurchases.zollerlass, 0));
  data.shopPurchases.aschesegen = Math.min(3, asNumber(data.shopPurchases.aschesegen, 0));
  data.shopPurchases.tiefenkunde = Math.min(3, asNumber(data.shopPurchases.tiefenkunde, 0));
  data.shopPurchases.werkstatthandwerk = Math.min(3, asNumber(data.shopPurchases.werkstatthandwerk, 0));
  data.shopPurchases.kriegerherz = Math.min(3, asNumber(data.shopPurchases.kriegerherz, 0));
  data.shopPurchases.wuchtschlag = Math.min(3, asNumber(data.shopPurchases.wuchtschlag, 0));
  data.shopPurchases.altelehre = Math.min(3, asNumber(data.shopPurchases.altelehre, 0));
  data.shopPurchases.schreinatem = Math.min(3, asNumber(data.shopPurchases.schreinatem, 0));
  data.shopPurchases.aschwille = Math.min(3, asNumber(data.shopPurchases.aschwille, 0));
  // Prestige: Kronenasche-Buch und Vermächtnis-Stufen (nur bekannte Titel, 0–3).
  data.kronenascheEarned = Math.max(0, asNumber(data.kronenascheEarned, 0));
  data.kronenascheAusgegeben = Math.min(data.kronenascheEarned, Math.max(0, asNumber(data.kronenascheAusgegeben, 0)));
  data.prestigeRuns = Math.max(0, Math.min(99999, Math.trunc(asNumber(data.prestigeRuns, 0))));
  data.legacy = data.legacy && typeof data.legacy === 'object' && !Array.isArray(data.legacy) ? data.legacy : {};
  const cleanLegacy = {};
  for (const title of Object.keys(LEGACY_TITLES)) {
    const level = asNumber(data.legacy[title], 0);
    if (level > 0) cleanLegacy[title] = Math.min(3, Math.trunc(level));
  }
  data.legacy = cleanLegacy;
  // Safedrop-Register: Gebiete, deren Elite-Erstkill schon gedroppt hat.
  data.safedropZones = data.safedropZones && typeof data.safedropZones === 'object' && !Array.isArray(data.safedropZones) ? data.safedropZones : {};
  const cleanSafedrops = {};
  for (const zone of Object.keys(data.safedropZones)) {
    const idx = asCount(zone);
    if (idx >= 0 && idx <= MAX_ZONE) cleanSafedrops[idx] = 1;
  }
  data.safedropZones = cleanSafedrops;
  data.seenContinents = Array.isArray(data.seenContinents)
    ? data.seenContinents.filter((key) => typeof key === 'string')
    : [];
  data.hints = data.hints && typeof data.hints === 'object' && !Array.isArray(data.hints)
    ? data.hints
    : {};
  return data;
}

let saveNotice = null;

function loadSave() {
  for (const [attempt, key] of [SAVE_KEY, ...BACKUP_KEYS].entries()) {
    const data = parseSave(localStorage.getItem(key));
    if (!data) continue;
    try {
      prepareSave(data);
    } catch {
      continue; // unerwartet Böses → nächste Backup-Generation probieren
    }
    Object.assign(state, data);
    if (attempt > 0) saveNotice = t('Hauptspielstand war beschädigt — Backup {n} geladen.', { n: attempt });
    return true;
  }
  return false;
}

// Meldung der Rettung (Backup statt Hauptstand) — wird beim Start gezeigt
// und dann verworfen.
function consumeSaveNotice() {
  const notice = saveNotice;
  saveNotice = null;
  return notice;
}

const tauriSaveApi = () => (window.__TAURI__?.dialog && window.__TAURI__?.fs ? window.__TAURI__ : null);

async function exportSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const payload = JSON.stringify({
    game: 'ashen-crown',
    saveVersion: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    state: JSON.parse(raw),
  }, null, 2);
  const fileName = `ashen-crown-spielstand-${new Date().toISOString().slice(0, 10)}.json`;
  const tauri = tauriSaveApi();
  if (tauri) {
    const path = await tauri.dialog.save({
      defaultPath: fileName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return false;
    await tauri.fs.writeTextFile(path, payload);
    return true;
  }
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

function unwrapSave(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.game === 'ashen-crown' && parsed.state) return parsed.state;
    if (parsed && typeof parsed.level === 'number' && typeof parsed.ash === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

function pickSaveFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

let importArmed = false;

let importTimer = null;

async function importSave() {
  const button = el.importButton;
  if (!importArmed) {
    importArmed = true;
    button.classList.add('armed');
    button.textContent = t('Wirklich? Überschreibt den Spielstand.');
    importTimer = setTimeout(() => {
      importArmed = false;
      button.classList.remove('armed');
      button.textContent = t('Importieren');
    }, 4000);
    return;
  }
  clearTimeout(importTimer);
  importArmed = false;
  button.classList.remove('armed');
  button.textContent = t('Importieren');
  const tauri = tauriSaveApi();
  let text = null;
  if (tauri) {
    const path = await tauri.dialog.open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return;
    text = await tauri.fs.readTextFile(path);
  } else {
    text = await pickSaveFile();
  }
  if (!text) return;
  const data = unwrapSave(text);
  if (!data) {
    flashButton(button, t('Ungültige Datei'));
    return;
  }
  rotateBackups(true);
  localStorage.setItem(SAVE_KEY, JSON.stringify(migrateSave(data)));
  location.reload();
}

export { save, purgeSaves, loadSave, consumeSaveNotice, exportSave, importSave };
