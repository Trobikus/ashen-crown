// i18n-Audit: Alle Übersetzungs-Schlüssel im Code (t('…'), lname('…')) und in
// der index.html (data-i18n, data-i18n-aria) müssen in den Wörterbüchern
// liegen — ein fehlender Schlüssel würde im Englischen still auf Deutsch
// fallen. Zusätzlich werden Wörterbuch-Einträge ohne Fundstelle gemeldet
// (Kandidaten fürs Aufräumen; falsch-positive sind möglich, z. B. wenn
// Schlüssel dynamisch zusammengesetzt werden). Exit 1 bei fehlenden Schlüsseln.
//
//   node tools/i18n-check.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { EN_UI } = await import('../src/locales/en-ui.js');
const { EN_NAMES } = await import('../src/locales/en-content.js');
const known = new Set([...Object.keys(EN_UI), ...Object.keys(EN_NAMES)]);

const srcFiles = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js')).map((f) => join(root, 'src', f));
const htmlFile = join(root, 'index.html');

const used = new Map(); // key -> [fundstellen]

const note = (key, where) => {
  if (!key) return;
  if (!used.has(key)) used.set(key, []);
  used.get(key).push(where);
};

const unescapeJs = (s) => s.replace(/\\(.)/g, '$1');

for (const file of [...srcFiles, htmlFile]) {
  const text = readFileSync(file, 'utf8');
  const rel = file.replace(root + '\\', '').replace(root + '/', '');
  for (const match of text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) note(unescapeJs(match[1]), rel);
  for (const match of text.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) note(unescapeJs(match[1]), rel);
  for (const match of text.matchAll(/\blname\(\s*'((?:[^'\\]|\\.)*)'/g)) note(unescapeJs(match[1]), rel);
  // data-i18n ohne Wert: der Elementinhalt ist der Schlüssel.
  for (const match of text.matchAll(/<[^>]*\bdata-i18n(?![\w-])[^>]*>([^<]+)</g)) note(match[1].trim(), rel);
  // data-i18n="…" / data-i18n-aria="…": der Attributwert ist der Schlüssel.
  for (const match of text.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) note(match[1], rel);
}

let missing = 0;
for (const [key, where] of [...used].sort(([a], [b]) => a.localeCompare(b))) {
  if (!known.has(key)) {
    console.error(`✗ fehlt im Wörterbuch: "${key}"  (${where.join(', ')})`);
    missing += 1;
  }
}

// ——— Dynamische Schlüssel: Inhalte aus den Daten-Modulen werden zur Laufzeit
// per t()/lname() nachgeschlagen — hier zählt jede Abweichung (Gedankenstrich,
// Anführungszeichen, Leerzeichen). Alle deutschen Quelltexte müssen in den
// Wörterbüchern liegen.
const { CONTINENTS, ZONE_ENEMIES, ZONES, DEPTH_ENEMY_NAMES, GEAR_SLOTS, RARITIES, ENEMY_PROFILES, SKILL_NODES } = await import('../src/data.js');
const { ACHIEVEMENTS, RUHM_SHOP } = await import('../src/achievements.js');
const { LEGACY_TITLES } = await import('../src/prestige.js');
const lore = await import('../src/lore.js');

const dynamic = [];
const add = (value, label) => {
  if (typeof value === 'string' && value && !/^[+\-−\d\s%·/:.–——-]+$/.test(value)) dynamic.push([value, label]);
};

for (const continent of CONTINENTS) {
  add(continent.name, 'Kontinent');
  for (const zone of continent.zones) add(zone.name, 'Gebiet');
}
for (const zone of ZONE_ENEMIES) for (const type of ['normal', 'elite', 'boss']) add(zone[type].name, 'Gegner');
for (const names of Object.values(DEPTH_ENEMY_NAMES)) for (const name of names) add(name, 'Tiefen-Gegner');
for (const zone of ZONES) add(zone.name, 'Gebiet (ZONES)');
for (const slot of GEAR_SLOTS) {
  add(slot.label, 'Slot-Label');
  for (const base of slot.bases) add(base.name, 'Item-Basis');
}
for (const rarity of RARITIES) {
  add(rarity.label, 'Seltenheit');
  add(rarity.suffix, 'Seltenheits-Suffix');
}
for (const profile of Object.values(ENEMY_PROFILES)) add(profile.label, 'Gegner-Profil');
add('Boss', 'Gegner-Profil');
add('Standard', 'Temperament');
add('Wütend', 'Wut-Label');
for (const node of SKILL_NODES) {
  add(node.name, 'Runen-Knoten');
  add(node.desc, 'Runen-Beschreibung');
}
for (const achievement of ACHIEVEMENTS) {
  add(achievement.name, 'Errungenschaft');
  add(achievement.desc, 'Errungenschaft-Beschreibung');
}
for (const def of Object.values(RUHM_SHOP)) {
  add(def.name, 'Ruhm-Laden');
  add(def.desc, 'Ruhm-Laden-Beschreibung');
}
for (const def of Object.values(LEGACY_TITLES)) {
  add(def.name, 'Vermächtnis-Titel');
  add(def.desc, 'Vermächtnis-Beschreibung');
}
for (const page of lore.INTRO_PAGES) add(page, 'Intro');
for (const page of lore.COMBAT_INTRO_PAGES) add(page, 'Kampf-Intro');
for (const text of Object.values(lore.CONTINENT_LORE)) add(text, 'Annale');
for (let z = 0; z < 50; z += 1) add(lore.epitaphOf(z), 'Epitaph');
for (let d = 50; d < 54; d += 1) add(lore.epitaphOf(d), 'Tiefen-Epitaph');
add('Held', 'Helden-Standardname');

for (const [value, label] of dynamic.sort(([a], [b]) => a.localeCompare(b))) {
  if (!known.has(value)) {
    console.error(`✗ fehlt im Wörterbuch (dynamisch, ${label}): "${value}"`);
    missing += 1;
  }
}

// Schlüssel, die indirekt gebraucht werden (t-Variable in Label-Arrays,
// Aktions-Wörter für „Klicken zum …") — das statische Muster sieht sie nicht.
const INDIRECT = new Set([
  '% Schaden', '% Lebenskraft', '% Rüstung', '% Kritchance', '% Kritschaden', '% Lifeleech',
  'Lifeleech pro Treffer', 'Ablegen', 'Anlegen', 'Auswählen', 'Lv', 'Normal',
]);

const unused = [...known].filter((key) => !used.has(key) && !dynamic.some(([value]) => value === key) && !INDIRECT.has(key));
for (const key of unused.sort((a, b) => a.localeCompare(b))) {
  console.log(`· ungenutzt: "${key}"`);
}

console.log(`\n${used.size} Schlüssel im Code/HTML, ${dynamic.length} dynamische Inhalte, ${known.size} Einträge in den Wörterbüchern, ${missing} fehlen, ${unused.length} ungenutzt.`);
console.log(missing ? `${missing} Schlüssel fehlen — bitte ergänzen.` : 'Alle verwendeten Schlüssel sind übersetzt.');
process.exit(missing ? 1 : 0);
