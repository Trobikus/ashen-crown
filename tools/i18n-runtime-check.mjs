// Runtime-i18n-Check: Fährt das ECHTE Spiel in Node mit DOM-Stubs auf Englisch
// und sammelt jeden DOM-Schreibvorgang (textContent, innerHTML, aria-label).
// Bestanden ist es nur, wenn nichts davon auf Deutsch fällt — der statische
// Audit (tools/i18n-check.mjs) beweist, dass Schlüssel übersetzt sind, dieser
// Test beweist, dass auch jede ANZEIGESTELLE durch t()/lname() läuft
// (Gegenbeispiel, das er findet: ein roh eingesetztes Epitaph).
//
//   node tools/i18n-runtime-check.mjs

import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

register('./i18n-runtime-loader.mjs', import.meta.url);

// ——— DOM-Stubs ———

const written = []; // { kind, id, value } — jeder DOM-Schreibvorgang

class ClassList {
  constructor() { this.set = new Set(); }
  add(...cs) { cs.forEach((c) => this.set.add(c)); }
  remove(...cs) { cs.forEach((c) => this.set.delete(c)); }
  toggle(c, force) {
    const on = force === undefined ? !this.set.has(c) : !!force;
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
  contains(c) { return this.set.has(c); }
}

class StubElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this.classList = new ClassList();
    const styleStore = { setProperty: () => {} };
    this.style = new Proxy(styleStore, {
      get: (t, p) => (p === 'setProperty' ? t.setProperty : (p in t ? t[p] : '')),
      set: (t, p, v) => { t[p] = v; return true; },
    });
  }
  get textContent() { return this._text ?? ''; }
  set textContent(v) {
    this._text = String(v);
    written.push({ kind: 'text', id: this.id, value: this._text });
  }
  get innerHTML() { return this._html ?? ''; }
  set innerHTML(v) {
    this._html = String(v);
    written.push({ kind: 'html', id: this.id, value: this._html });
  }
  get childElementCount() { return this.children.length; }
  get firstChild() { return this.children[0] ?? new StubElement(); }
  appendChild(child) { child.parent = this; this.children.push(child); return child; }
  append(...cs) { cs.forEach((c) => this.appendChild(c)); }
  replaceChildren(...cs) { this.children = [...cs]; cs.forEach((c) => { c.parent = this; }); }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  addEventListener(ev, fn) { (this.listeners[ev] ??= []).push(fn); }
  removeEventListener() {}
  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'aria-label') written.push({ kind: 'aria', id: this.id, value: String(v) });
  }
  getAttribute(k) { return this.attributes[k] ?? null; }
  hasAttribute(k) { return k in this.attributes; }
  querySelector() { return new StubElement(); }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }; }
  click() {
    for (const fn of this.listeners.click ?? []) fn({ target: this, button: 0, key: '', preventDefault() {}, closest: () => null });
  }
  focus() {}
  closest() { return null; }
  contains() { return false; }
  get offsetWidth() { return 100; }
  get offsetHeight() { return 100; }
}

const byId = new Map();
const element = (id) => {
  if (!byId.has(id)) byId.set(id, new StubElement('div', id));
  return byId.get(id);
};

const gearSlots = ['waffe', 'brust', 'helm', 'hose', 'schuhe', 'hand-links', 'hand-rechts']
  .map((slot) => { const el = new StubElement('div', `gear-${slot}`); el.dataset.slot = slot; return el; });
const statPlus = ['hp', 'damage', 'armor', 'crit']
  .map((stat) => { const el = new StubElement('button', `stat-plus-${stat}`); el.dataset.stat = stat; return el; });
const spendButtons = ['1', '5', '10']
  .map((n) => { const el = new StubElement('button', `spend-${n}`); el.dataset.amount = n; return el; });
const backButtons = Array.from({ length: 8 }, (_, i) => new StubElement('button', `back-${i}`));

// Statische HTML-Texte: Repräsentativer Satz deutscher Elemente für applyStaticI18n.
const staticTexts = ['Der Schrein', 'Zurück', 'Optionen', 'Bestiarium', 'Erneut erwachen', 'Los geht\'s'];
const staticNodes = staticTexts.map((text) => {
  const el = new StubElement('span', `static-${text.length}-${text.slice(0, 4)}`);
  el._text = text;
  return el;
});
const staticAria = new StubElement('div', 'static-aria');
staticAria.setAttribute('data-i18n-aria', 'Waffe ablegen');

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

globalThis.document = {
  documentElement: new StubElement('html'),
  getElementById: (id) => element(id),
  createElement: (tag) => new StubElement(tag),
  createElementNS: (ns, tag) => new StubElement(tag),
  querySelectorAll: (sel) => {
    if (sel === '.gear-slot') return gearSlots;
    if (sel === '.stat-plus') return statPlus;
    if (sel === '.spend-amount button') return spendButtons;
    if (sel === '[data-back]') return backButtons;
    if (sel === '[data-i18n]') return staticNodes;
    if (sel === '[data-i18n-aria]') return [staticAria];
    return [];
  },
  querySelector: () => new StubElement(),
  addEventListener() {},
  body: new StubElement('body'),
};

globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  open() {},
};

// navigator ist in Node >= 21 ein nur-lesender Global — per defineProperty
// auf Deutsch stellen, damit 'auto' hier bewusst NICHT greift (der Test
// schaltet wie ein englischer Nutzer per Einstellung auf Englisch).
Object.defineProperty(globalThis, 'navigator', { value: { language: 'de-DE' }, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// Deterministischer Lauf: Math.random auf 0,5 fixiert — der Held verfehlt nie
// (12 %-Wurf greift nie), der Gegner trifft immer (15 %-Wurf greift nie), Beute
// fällt nie. Ohne das bleibt der Todespfad ein Wettrennen zwischen dem ersten
// Gegner-Schlag (spawn + 1,5 s) und dem Heldenschlag (spawn + 1,6 s) — der
// Assert darauf wäre mit ~15 % Flakiness pro Spawn behaftet.
Math.random = () => 0.5;

// ——— Spielstand & Einstellungen (Englisch, reicher Endgame-Stand) ———

const item = (over = {}) => ({
  id: 0, slot: 'waffe', base: 'Klinge', name: 'Klinge der Gebeine', rarity: 'selten',
  ilvl: 40, damage: 12, hp: 0, armor: 2, critChance: 3, critDmg: 0, damagePct: 0,
  hpPct: 0, armorPct: 0, lifeleech: 0, lifeleechFlat: 0, enhance: 2,
  enhanceBonus: { damage: 5, hp: 0, armor: 0 }, mastery: { stat: 'damagePct', value: 9 }, mastery2: null,
  ...over,
});

storage.set('ashen-crown-settings', JSON.stringify({ lang: 'en' }));
storage.set('ashen-crown-save', JSON.stringify({
  saveVersion: 9,
  ash: 123456, xp: 0, level: 60, maxHp: 500, hp: 0, damage: 200000000,
  kills: 7342, heroName: 'Aldric', zone: 55, cleared: 57, crownWon: true, zoneKills: 0,
  lastSeen: Date.now(), itemSeq: 5,
  inventory: [
    item({ id: 1 }),
    item({ id: 2, slot: 'helm', base: 'Hornhelm', name: 'Hornhelm der Krone', rarity: 'episch', damage: 0, hp: 90, armor: 12, critChance: 0, hpPct: 6, mastery: null }),
  ],
  equipment: { waffe: item({ id: 3, name: 'Sense der Aschenkrone', rarity: 'legendär', base: 'Sense', damage: 40, lifeleech: 12 }) },
  statPoints: 0, armorBase: 5, critBonus: 2, skillPoints: 1, skills: ['start'],
  inField: false, seenContinents: ['aschenlande'], hints: {}, deaths: 3, playtimeMs: 7200000,
  drops: { gewoehnlich: 10, magisch: 5, selten: 2, episch: 1, 'legendär': 1 },
  bestiary: { 'Grabwächter': 12 }, achievements: ['ernte-1'], achievementsPending: [], ruhmAusgegeben: 0,
  shopPurchases: { beutelschein: 1 }, safedropZones: {},
  kronenascheEarned: 3, kronenascheAusgegeben: 1, prestigeRuns: 1, legacy: { 'zweiter-atem': 1 },
}));

// ——— Spielmodule laden und fahren ———

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = (m) => import(pathToFileURL(join(root, 'src', m)).href);

const I = await src('i18n.js');
const D = await src('data.js');
const S = await src('state.js');
const BUS = await src('bus.js');
const G = await src('game.js');
const records = await src('records.js');
const throne = await src('throne.js');
const crafting = await src('crafting.js');
const lore = await src('lore.js');
const zones = await src('zones.js');
const skilltree = await src('skilltree.js');
const items = await src('items.js');

let failed = 0;
const assert = (cond, label) => {
  if (cond) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); failed += 1; }
};

// Startpfad wie main.js: Settings laden (EN aus localStorage), statisch übersetzen.
const settings = JSON.parse(localStorage.getItem('ashen-crown-settings'));
I.setLangPreference(settings.lang ?? 'auto');
I.applyStaticI18n();
assert(I.getLang() === 'en', 'Sprache ist Englisch (localStorage lang:en)');
assert(staticNodes[0].textContent === 'The Shrine', 'statische Texte übersetzt (Der Schrein → The Shrine)');
assert(staticAria.getAttribute('aria-label') === 'Unequip weapon', 'statische Aria-Labels übersetzt');

G.startGame();
BUS.use('render')();

// Deterministische Einzel-Checks an reinen Übersetzungs-Helfern
assert(D.zoneDef(55).name === 'Ashen Depth VI', `zoneDef-Tiefenname („${D.zoneDef(55).name}")`);
assert(D.SKILL_EFFECT_LABELS.crit(5) === '+5% Crit Chance', `Effekt-Label („${D.SKILL_EFFECT_LABELS.crit(5)}")`);
assert(D.formatNum(1500) === '1.5k', `formatNum Dezimaltrennzeichen („${D.formatNum(1500)}")`);
const relic = items.buildDepthRelic(100);
assert(items.itemNameOf(relic).startsWith('Depth Relic: '), `Relikt-Name („${items.itemNameOf(relic)}")`);

// Alle Szenen-Renderer sichtbar schalten und fahren
const show = (...ids) => ids.forEach((id) => element(id).hidden = false);
show('scene-options', 'scene-stats'); records.renderStats();
show('scene-bestiary'); records.renderBestiary();
show('scene-achievements', 'achievements-page'); records.renderAchievements();
show('ruhm-page'); records.renderRuhmShop();
show('scene-throne'); throne.renderThrone();
show('scene-crafting'); crafting.renderCrafting();
show('scene-map'); zones.renderZones();
show('scene-chronik'); lore.renderChronicle();
show('scene-skills'); skilltree.renderSkillTree();

// ——— Kampf: Boss-Phase erzwingen (zone 0, 30 Kills gezählt) — Boss-Kill mit
// Epitaph-Overlay, dann Tod an einem Gegner-Schlag. ———
S.state.zone = 0;
S.state.cleared = 0;
S.state.zoneKills = 30;
S.state.bestiary = {}; // Erstkill-Toast mit Gegnernamen mittesten
BUS.use('heroHp').set(500);
element('btn-descend').click(); // descend → beginCombat → Boss-Spawn
await new Promise((r) => setTimeout(r, 2600)); // Boss-Kill (1 Treffer) + Overlay
await new Promise((r) => setTimeout(r, 1500)); // Auto-Tür: Eintritt ins nächste Gebiet heilt voll
BUS.use('heroHp').set(1); // erst NACH der Auto-Tür-Heilung — sonst heilt sie den Helden wieder voll
await new Promise((r) => setTimeout(r, 9000)); // Gegner-Schlag → Tod → Rückkehr zum Schrein

// ——— Auswertung: jeder gesammelte Text muss deutschfrei sein ———
const stripTags = (v) => String(v).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
const umlaut = /[\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc]/;
const words = /\b(der|das|und|ist|nicht|Held|Gebiet|Gebiete|Asche|Stufe|Stufen|Ruhm|Schrein|Beute|Wütend|Verfehlt|Kreatur|Kreaturen|erlegt|Lebenskraft|Rüstung|Schaden|Kritchance|Kritschaden|Versiegelt|Eröffnet|Aufenthalt|errungen|bereit|Runen|Fertigkeiten|Errungenschaft|Errungenschaften|Meisterschaft|Inventar|Verkaufen|verkaufen|Anlegen|Auswählen|Leer|Zurück|Optionen|Beenden|Hauptmenü|Erwache|Tiefe|Tiefen|Krone|Kronenasche|Werkstatt|Vermächtnis|Chronik|Bestiarium|Erlegte|bezwungen|erbeutet|geskillt|Geskillt|Freischalten|Kaufen|Abholen|verstärkt|Verstärkt|voll)\b/;
const germanHits = [];
for (const w of written) {
  const text = stripTags(w.value).trim();
  if (!text || !/[a-zA-Z\u00c4-\u00fc]/.test(text)) continue;
  if (umlaut.test(text) || words.test(text)) germanHits.push({ ...w, text: text.slice(0, 90) });
}
for (const hit of germanHits) console.error(`✗ Deutsch im DOM (${hit.kind} ${hit.id}): "${hit.text}"`);
failed += germanHits.length;

// Positiv-Nachweise: Der Harness darf nicht still nichts sammeln.
const all = stripTags(written.map((w) => w.value).join('\n'));
assert(all.includes('The Shrine'), 'Hub „The Shrine" sichtbar');
assert(all.includes('Grave Warden'), 'Boss-Gegnername englisch (Grabwächter → Grave Warden)');
assert(all.includes('New creature slain: Grave Warden'), 'Erstkill-Toast englisch');
assert(all.includes('He guards a grave that was never dug: his own.'), 'Boss-Epitaph englisch (der gefundene Bug)');
assert(all.includes('Grave Warden defeated — Bone Vault is now open'), 'Boss-Sieg-Overlay englisch (Nachtief öffnet)');
assert(all.includes('has fallen'), 'Todes-Overlay englisch (inkl. Zoll und Rückblick)');
assert(all.includes('Ashen Depth VI'), 'Tiefen-Name in der Statistik englisch');
assert(all.includes('Ashen Crypt · 12 slain'), 'Bestiary-Zählzeile englisch');
assert(all.includes('Never slain yet'), 'Bestiary-verschlossen-Zeile englisch');
assert(all.includes('Loot License · Level 2/3'), 'Ruhm-Laden-Zeile englisch');
assert(all.includes('Second Wind'), 'Vermächtnis-Titel englisch');

// Debug: Läuft der Kampf-Pfad nicht bis zum Boss-Overlay/Tod, zeigt dieser
// Streifen, was stattdessen im Log gelandet ist.
if (failed) {
  for (const w of written) {
    const text = stripTags(w.value);
    if (/Grave Warden|Ashen Crypt|defeated|fallen|bezwungen|Bone Creeper/.test(text)) {
      console.log('DEBUG', w.kind, w.id || '-', JSON.stringify(text.replace(/\s+/g, ' ').slice(0, 160)));
    }
  }
}

console.log(`\n${written.length} DOM-Schreibvorgänge gesammelt, ${germanHits.length} deutsche Funde, ${failed} Fehler gesamt.`);
console.log(failed ? 'i18n-Runtime-Check FEHLGESCHLAGEN.' : 'Alle Runtime-i18n-Checks bestanden.');
process.exit(failed ? 1 : 0);
