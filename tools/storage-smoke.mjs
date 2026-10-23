// Storage-Smoke: Blockierter Speicher darf das Spiel nicht umwerfen. Der
// localStorage-Stub wirft gezielt SecurityError (Privatmodus/verweigerte
// Freigabe) und QuotaExceededError (volle Quota) — save() inkl. Backup-
// Rotation, loadSave(), exportSave() und die Einstellungen müssen jeden
// Zugriff abfangen; nach Erholung des Speichers läuft alles wieder normal.
//
//   node tools/storage-smoke.mjs

let failed = 0;

const assert = (cond, label) => {
  if (cond) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
};

const noThrow = (fn, label) => {
  try {
    fn();
    assert(true, `${label} — ohne Wurf`);
  } catch (err) {
    assert(false, `${label} — warf ${err.constructor?.name ?? 'Fehler'}: ${err.message}`);
  }
};

// Stubs: Der Warn-Toast steigt früh aus, wenn 'toasts' fehlt; die Tauri-
// Erkennung liest window.__TAURI__ (hier: leer). Für den Export-Pfad kommen
// Blob-URL und Anker-Download dazu (Web-Build-Pfad ohne Tauri).
let lastExportBlob = null;
let downloadClicks = 0;
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ href: '', download: '', click() { downloadClicks += 1; } }),
};
globalThis.window = {};
URL.createObjectURL = (blob) => { lastExportBlob = blob; return 'blob:stub'; };
URL.revokeObjectURL = () => {};

class StorageError extends Error {
  constructor(name) {
    super(name);
    this.name = name;
  }
}

const blocked = {
  getItem: () => { throw new StorageError('SecurityError'); },
  setItem: () => { throw new StorageError('SecurityError'); },
  removeItem: () => { throw new StorageError('SecurityError'); },
};

const backing = new Map();
const quotaFull = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: () => { throw new StorageError('QuotaExceededError'); },
  removeItem: (k) => { backing.delete(k); },
};
const healthy = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => { backing.set(k, String(v)); },
  removeItem: (k) => { backing.delete(k); },
};

const S = await import('../src/state.js');
const BUS = await import('../src/bus.js');
const SV = await import('../src/saveio.js');
const ST = await import('../src/settings.js');
const { SETTINGS_KEY } = S;
// save() liest die Lebenskraft über den Bus — im echten Spiel meldet sie
// game.js an, hier reicht ein Stand-in.
BUS.provide('heroHp', { get: () => S.state.hp });

S.state.level = 7;
S.state.ash = 1234;

// ——— Phase 1: SecurityError auf JEDEN Zugriff (Privatmodus/Freigabe) ———
globalThis.localStorage = blocked;
noThrow(() => SV.save(), 'save() inkl. Backup-Rotation bei SecurityError');
noThrow(() => ST.saveSettings(), 'saveSettings() bei SecurityError');
assert(SV.loadSave() === false, 'loadSave() kehrt ohne Stand zurück');
try {
  const ok = await SV.exportSave();
  assert(ok === false, 'exportSave() meldet false');
} catch (err) {
  assert(false, `exportSave() warf ${err.message}`);
}

// ——— Phase 2: QuotaExceededError (Schreiben wirft, Lesen geht) ———
globalThis.localStorage = quotaFull;
backing.clear();
noThrow(() => SV.save(), 'save() bei QuotaExceededError');
noThrow(() => ST.saveSettings(), 'saveSettings() bei QuotaExceededError');

// ——— Phase 3: Erholung im selben Prozess ———
globalThis.localStorage = healthy;
backing.clear();
SV.save();
assert((backing.get(S.SAVE_KEY) ?? '').includes('"level":7'), 'Erholung: save() persistiert den Hauptstand wieder');
ST.saveSettings();
assert(backing.has(SETTINGS_KEY), 'Erholung: saveSettings() persistiert wieder');
SV.save(); // zweiter Zug: die Backup-Rotation schiebt die Generationen
assert((backing.get('ashen-crown-save.bak1') ?? '').includes('"level":7'), 'Erholung: Backup-Rotation schiebt wieder (bak1)');

// ——— Phase 4: Export bei beschädigtem Hauptspielstand ———
// Der Hauptstand ist syntaktisch kaputt; bak1 (aus Phase 3 rotiert) hält den
// lesbaren Stand. Der Export muss kontrolliert auf das Backup fallen statt
// mit einem JSON-Fehler abzubrechen oder Müll zu schreiben.
backing.set(S.SAVE_KEY, '{"level": 7, "ash": [unlesbares Güll');
const exported = await SV.exportSave();
const payload = lastExportBlob ? await lastExportBlob.text() : '';
assert(exported === true && downloadClicks === 1, `Export mit kaputtem Hauptstand gelingt über Backup (${exported}/${downloadClicks} Download)`);
assert(payload.includes('"game": "ashen-crown"') && payload.includes('"level": 7'), 'Export-Payload trägt das Backup (ashen-crown-Hülle, Level 7)');
// Nichts Lesbares anywhere → kontrolliert false, kein Wurf.
backing.set(S.SAVE_KEY, '}}müll');
for (const key of ['ashen-crown-save.bak1', 'ashen-crown-save.bak2', 'ashen-crown-save.bak3']) backing.set(key, 'kein json');
let refused = false;
try {
  refused = await SV.exportSave();
} catch (err) {
  assert(false, `Export ohne lesbaren Stand warf ${err.message}`);
}
assert(refused === false, 'Export ohne jeden lesbaren Stand: kontrolliert false statt Exception');

// ——— Phase 5: purgeSaves räumt komplett ab — letzer Schritt, denn danach
// ist save() bis zum Reload unterdrückt ————
SV.purgeSaves();
assert(!backing.has(S.SAVE_KEY) && !backing.has('ashen-crown-save.bak1') && !backing.has('ashen-crown-save.bak2') && !backing.has('ashen-crown-save.bak3'), 'purgeSaves löscht Hauptstand und Backup-Kette (kein „gelöschter Held" kehrt zurück)');

console.log(failed ? `\n${failed} Check(s) fehlgeschlagen.` : '\nAlle Storage-Checks bestanden.');
process.exit(failed ? 1 : 0);
