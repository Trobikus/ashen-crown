// Das Speicher-Subsystem: Schreiben (mit Backup-Rotation), Laden (mit
// Migration und Härtung) und Import/Export. Die Härtung bereinigt ALLES auf
// dem rohen Spielstand, bevor etwas davon den echten Spielstand berührt —
// ein böser Spielstand darf nie den Render-Loop crashen.
import { state, SAVE_KEY, SAVE_VERSION } from './state.js';
import { GEAR_SLOTS, RARITIES, SKILL_TREE_UNLOCK_LEVEL, MAX_ZONE, sanitizeItem, asCount } from './data.js';
import { t } from './i18n.js';
import { MAX_SKILL_POINTS, sanitizeSkills } from './skilltree.js';
import { sanitizeAchievements, sanitizeShopPurchases } from './achievements.js';
import { LEGACY_TITLES } from './prestige.js';
import { sanitizeEcho } from './echo.js';
import { el } from './dom.js';
import { flashButton } from './domfx.js';
import { readStorage, writeStorage, removeStorage } from './storage.js';
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

function save() {
  if (saveSuppressed) return;
  state.lastSeen = Date.now();
  state.hp = Math.max(0, Math.round(use('heroHp').get()));
  rotateBackups();
  writeStorage(SAVE_KEY, JSON.stringify(state));
}

// Rücksichtslos löschen heißt: Hauptstand UND Backup-Kette — sonst lädt
// der nächste Start still das Backup und der „gelöschte" Held kehrt zurück.
// Der Suppress hält Zwischenspeicherer aus dem Fenster bis zum Reload.
function purgeSaves() {
  saveSuppressed = true;
  for (const key of [SAVE_KEY, ...BACKUP_KEYS]) removeStorage(key);
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
  const current = parseSave(readStorage(SAVE_KEY));
  if (!current) return;
  const newest = parseSave(readStorage(BACKUP_KEYS[0]));
  if (!force && newest && Date.now() - (newest.lastSeen ?? 0) < BACKUP_MIN_GAP_MS) return;
  // Backup-Kette schieben — die Quota gilt für alle Schlüssel, der zweite
  // Schutzring darf scheitern, ohne den Hauptstand mitzureißen. Erst ein
  // vollständiger Zug zählt als Rotation; sonst wird sie beim nächsten
  // save() erneut versucht.
  const shifted =
    writeStorage(BACKUP_KEYS[2], readStorage(BACKUP_KEYS[1]) ?? '') &&
    writeStorage(BACKUP_KEYS[1], readStorage(BACKUP_KEYS[0]) ?? '') &&
    writeStorage(BACKUP_KEYS[0], JSON.stringify(current));
  if (shifted) lastBackupRotatedAt = Date.now();
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
  // Dedup + Pfad-Bindung: Duplikate würden in skillBonus je Kopie zählen
  // und die Punktekorrektur unten verfälschen.
  data.skills = sanitizeSkills(data.skills);
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
  // Errungenschaften & Abhol-Regal: kanonisieren — nur bekannte IDs ohne
  // Duplikate, denn ruhmEarned/ruhmPending summieren je Eintrag; und nichts
  // im Regal, was schon eingesammelt ist (sonst buchte der Claim zweimal).
  const achievements = sanitizeAchievements(data.achievements, data.achievementsPending);
  data.achievements = achievements.claimed;
  data.achievementsPending = achievements.pending;
  // Ruhm-Laden: Kaufstufen ganzzahlig 0..Maximum, und die Ruhm-Buchhaltung
  // konsistent — Einkaufsanteil exakt aus den Stufen, Rest = Rerolls.
  const shop = sanitizeShopPurchases(data.shopPurchases, data.ruhmAusgegeben);
  data.shopPurchases = shop.purchases;
  data.ruhmAusgegeben = shop.ruhmAusgegeben;
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
  // Der Asche-Nachhall: Snapshot des letzten Laufs — härtet sanitizeEcho
  // (bekannte Form, Werte geklemmt); ohne Snapshot gibt es keinen Nachhall.
  data.echo = sanitizeEcho(data.echo);
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
    const data = parseSave(readStorage(key));
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
  // Der Hauptstand kann unlesbar sein (beschädigtes JSON, schon im Speicher
  // liegend — die Storage-Schicht fängt nur Zugriffsfehler). parseSave
  // validiert Form und Syntax; ist der Hauptstand Müll, fällt der Export auf
  // das neueste lesbare Backup zurück, statt mit einem Parse-Fehler
  // abzubrechen oder still eine kaputte Datei zu schreiben.
  let data = parseSave(readStorage(SAVE_KEY));
  let backup = 0;
  if (!data) {
    for (const [attempt, key] of BACKUP_KEYS.entries()) {
      data = parseSave(readStorage(key));
      if (data) {
        backup = attempt + 1;
        break;
      }
    }
  }
  if (!data) {
    toast(t('Kein lesbarer Spielstand — Export nicht möglich.'), '#c1663a');
    return false;
  }
  if (backup) toast(t('Hauptspielstand war beschädigt — Backup {n} exportiert.', { n: backup }), '#c1663a');
  const payload = JSON.stringify({
    game: 'ashen-crown',
    saveVersion: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    state: data,
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
  // Schlägt das Schreiben fehl (blockierter Speicher), bleibt der alte Stand
  // stehen — ein Reload würde dem Spieler sonst einen Import vorgaukeln,
  // der nicht stattfand.
  if (!writeStorage(SAVE_KEY, JSON.stringify(migrateSave(data)))) return;
  location.reload();
}

export { save, purgeSaves, loadSave, consumeSaveNotice, exportSave, importSave };
