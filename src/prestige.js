// Prestige: „Erneut erwachen" — die Kronenasche (docs/prestige-optionen.md).
// Modell B „Das Vermächtnis" mit A-Fundament: Jede ERWORBENE Kronenasche segnet
// alle künftigen Läufe leicht (lebenslang, unabhängig vom Ausgeben); ausgegeben
// wird sie auf gestufte Titel, die das Erwachen formen. Reine Rechen-Module wie
// achievements.js — der Spielstand kommt als Parameter, kein eigener Zustand.
import { MAIN_ZONE_COUNT } from './data.js';

// A-Fundament: +3 % Ertrag je erworbener Kronenasche, auf Asche und Erfahrung.
// Sim-Notiz (tools/balance-sim.mjs --prestige): Einkommens-Hebel sind in der
// Laufzeit gesättigt — der Wert belohnt Ertrag, ohne die Laufzeit zu kippen.
export const KRONENASCHE_BASE_FACTOR = 0.03;

// B: Die Titel des Vermächtnisses — je 3 Stufen, Kosten 1/2/3 Kronenasche.
// Der Gesamtsatz (36) übersteigt den Ertrag eines Laufs (1–5) bewusst: Das
// Vermächtnis füllt sich über mehrere Läufe, die Reihenfolge wählt der Spieler.
// Sim-kalibriert (Entscheidung 2026-10-16 „Korridor als Sättigungsziel“):
// Gefülltes Vermächtnis ≈ 66–71 % der Basiskampagne (Zielband 60–75 %), frühe
// Läufe bleiben ~90 %. Der Wirksamkeits-Hebel ist Tiefenwissen — Wände
// brechen an Beute, nicht an Einkommen; Grundwerte/EP/Asche messen sich
// neutral. Desc-Texte und game.js (Prestige-Reset) bzw. items.js (Drop-Chance)
// lesen aus perLevel — hier ändern, nirgends sonst.
export const LEGACY_TITLES = {
  'zweiter-atem': { name: 'Zweiter Atem', desc: '+5 % Lebenskraft & Schaden auf den Helden-Grundwert, je Stufe.', levels: [1, 2, 3], kind: 'basis', perLevel: 0.05 },
  aschengeist: { name: 'Aschengeist', desc: '+5 % Erfahrung, je Stufe.', levels: [1, 2, 3], kind: 'faktor', perLevel: 0.05 },
  beutelspaehler: { name: 'Beutelspähler', desc: '+5 % Asche-Ertrag, je Stufe.', levels: [1, 2, 3], kind: 'faktor', perLevel: 0.05 },
  'alter-pfad': { name: 'Alter Pfad', desc: 'Erwache mit +2 freien Statpunkten, je Stufe.', levels: [1, 2, 3], kind: 'punkte', perLevel: 2 },
  tiefenwissen: { name: 'Tiefenwissen', desc: '+10 % Elite-/Boss-Fundchance, je Stufe.', levels: [1, 2, 3], kind: 'drop', perLevel: 0.10 },
  'der-vorbereitete': { name: 'Der Vorbereitete', desc: 'Erwache mit 25 Asche, je Stufe.', levels: [1, 2, 3], kind: 'startAsh', perLevel: 25 },
};

export const LEGACY_MAX_LEVEL = 3;

export function kronenascheEarnedOf(s) {
  return Math.max(0, s.kronenascheEarned ?? 0);
}

export function kronenascheAvailable(s) {
  return Math.max(0, kronenascheEarnedOf(s) - Math.max(0, s.kronenascheAusgegeben ?? 0));
}

export function legacyLevel(s, title) {
  return LEGACY_TITLES[title] ? Math.min(LEGACY_MAX_LEVEL, Math.max(0, s.legacy?.[title] ?? 0)) : 0;
}

// Stufe × Stufen-Wert — der Faktor eines Titels für Prozent-Effekte.
export function legacyFactor(s, title) {
  return legacyLevel(s, title) * (LEGACY_TITLES[title]?.perLevel ?? 0);
}

// A-Fundament: lebenslanger Segen je erworbener Kronenasche.
export function kronenascheBaseFactor(s) {
  return KRONENASCHE_BASE_FACTOR * kronenascheEarnedOf(s);
}

export function ashLegacyFactor(s) {
  return 1 + kronenascheBaseFactor(s) + legacyFactor(s, 'beutelspaehler');
}

export function xpLegacyFactor(s) {
  return 1 + kronenascheBaseFactor(s) + legacyFactor(s, 'aschengeist');
}

// Der Prestige-Ertrag eines Laufs: 1 für die Krone, +1 je volle 5 Tiefen.
export function kronenascheReward(cleared) {
  return 1 + Math.floor(Math.max(0, cleared - MAIN_ZONE_COUNT) / 5);
}
