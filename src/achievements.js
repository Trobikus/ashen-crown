// Errungenschaften: Aus den Statistik-Zählern gewachsen — keine eigene
// Speicherlogik, nur IDs im Spielstand (state.achievements). check entscheidet
// den Unlock, progress liefert [aktuell, Ziel] für die Anzeige, ruhm ist die
// Währung, die jeder Errungenschaft beim Erringen gewachsen ist.
import { ZONE_ENEMIES, memoryTier } from './data.js';

const dropTotal = (s) => Object.values(s.drops ?? {}).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
const dropOf = (s, key) => s.drops?.[key] ?? 0;

// Volles Gedächtnis: Irgendein Stück (getragen oder im Inventar) erinnert
// 300 Beutezüge gegen eine Familie — der Deckel je Stück ist der Meilenstein.
const fullMemoryOwned = (s) => {
  const items = [...Object.values(s.equipment ?? {}), ...(Array.isArray(s.inventory) ? s.inventory : [])];
  return items.some((item) => item?.memory && Object.values(item.memory).some((kills) => memoryTier(kills) >= 3));
};

// Bestiarium-Fortschritt: die 150 Kreaturen des Hauptspiels, je mindestens
// einmal erlegt (die Tiefen-Namen rotieren endlos und zählen nicht hinein).
const MAIN_BESTIARY_TOTAL = ZONE_ENEMIES.length * 3;

const mainBestiaryKnown = (s) => {
  let known = 0;
  for (const zone of ZONE_ENEMIES) {
    for (const type of ['normal', 'elite', 'boss']) {
      if ((s.bestiary?.[zone[type].name] ?? 0) > 0) known += 1;
    }
  }
  return known;
};

export const ACHIEVEMENTS = [
  { id: 'ernte-1', name: 'Erste Ernte', desc: 'Erlege deine erste Kreatur.', ruhm: 1, check: (s) => s.kills >= 1, progress: (s) => [Math.min(s.kills, 1), 1] },
  { id: 'ernte-100', name: 'Aschenjäger', desc: 'Erlege 100 Kreaturen.', ruhm: 1, check: (s) => s.kills >= 100, progress: (s) => [Math.min(s.kills, 100), 100] },
  { id: 'ernte-1000', name: 'Gebeinleser', desc: 'Erlege 1.000 Kreaturen.', ruhm: 2, check: (s) => s.kills >= 1000, progress: (s) => [Math.min(s.kills, 1000), 1000] },
  { id: 'ernte-10000', name: 'Schrecken der Asche', desc: 'Erlege 10.000 Kreaturen.', ruhm: 3, check: (s) => s.kills >= 10000, progress: (s) => [Math.min(s.kills, 10000), 10000] },

  { id: 'sturz-1', name: 'Erster Sturz', desc: 'Falle zum ersten Mal — die Asche nimmt ihren Zoll.', ruhm: 1, check: (s) => s.deaths >= 1, progress: (s) => [Math.min(s.deaths, 1), 1] },
  { id: 'sturz-10', name: 'Zollschuldner', desc: 'Falle 10 Male.', ruhm: 2, check: (s) => s.deaths >= 10, progress: (s) => [Math.min(s.deaths, 10), 10] },
  { id: 'sturz-50', name: 'Halb Asche', desc: 'Falle 50 Male.', ruhm: 3, check: (s) => s.deaths >= 50, progress: (s) => [Math.min(s.deaths, 50), 50] },

  { id: 'zeit-1', name: 'Erwacht', desc: 'Verbringe 1 Stunde im Spiel.', ruhm: 1, check: (s) => s.playtimeMs >= 3600e3, progress: (s) => [Math.min(s.playtimeMs, 3600e3), 3600e3], format: 'zeit' },
  { id: 'zeit-10', name: 'Brennende Geduld', desc: 'Verbringe 10 Stunden im Spiel.', ruhm: 2, check: (s) => s.playtimeMs >= 36000e3, progress: (s) => [Math.min(s.playtimeMs, 36000e3), 36000e3], format: 'zeit' },
  { id: 'zeit-50', name: 'Von Asche umhangen', desc: 'Verbringe 50 Stunden im Spiel.', ruhm: 3, check: (s) => s.playtimeMs >= 180000e3, progress: (s) => [Math.min(s.playtimeMs, 180000e3), 180000e3], format: 'zeit' },

  { id: 'beute-10', name: 'Sammler', desc: 'Finde 10 Beutestücke.', ruhm: 1, check: (s) => dropTotal(s) >= 10, progress: (s) => [Math.min(dropTotal(s), 10), 10] },
  { id: 'beute-100', name: 'Horter', desc: 'Finde 100 Beutestücke.', ruhm: 2, check: (s) => dropTotal(s) >= 100, progress: (s) => [Math.min(dropTotal(s), 100), 100] },
  { id: 'beute-500', name: 'Aschenbaron', desc: 'Finde 500 Beutestücke.', ruhm: 3, check: (s) => dropTotal(s) >= 500, progress: (s) => [Math.min(dropTotal(s), 500), 500] },
  { id: 'legendaer-1', name: 'Goldhauch', desc: 'Finde dein erstes legendäres Stück.', ruhm: 1, check: (s) => dropOf(s, 'legendär') >= 1, progress: (s) => [Math.min(dropOf(s, 'legendär'), 1), 1] },
  { id: 'legendaer-10', name: 'Kronjäger', desc: 'Finde 10 legendäre Stücke.', ruhm: 2, check: (s) => dropOf(s, 'legendär') >= 10, progress: (s) => [Math.min(dropOf(s, 'legendär'), 10), 10] },
  { id: 'gedaechtnis-voll', name: 'Die Klinge erinnert sich', desc: 'Besitze ein Stück, das sich an 300 Beutezüge gegen eine Kreaturfamilie erinnert (+3 % Schaden).', ruhm: 2, check: (s) => fullMemoryOwned(s), progress: (s) => [fullMemoryOwned(s) ? 1 : 0, 1] },

  { id: 'gebiet-10', name: 'Über den Thron hinaus', desc: 'Befreie 10 Gebiete.', ruhm: 1, check: (s) => s.cleared >= 10, progress: (s) => [Math.min(s.cleared, 10), 10] },
  { id: 'gebiet-25', name: 'Der halbe Weg', desc: 'Befreie 25 Gebiete.', ruhm: 2, check: (s) => s.cleared >= 25, progress: (s) => [Math.min(s.cleared, 25), 25] },
  { id: 'kronentraeger', name: 'Kronenträger', desc: 'Hebe die Aschenkrone — alle 50 Gebiete sind frei.', ruhm: 3, check: (s) => s.cleared >= 50, progress: (s) => [Math.min(s.cleared, 50), 50] },
  { id: 'tiefe-1', name: 'Unter dem Thron', desc: 'Erringe die erste Aschentiefe.', ruhm: 2, check: (s) => s.cleared >= 51, progress: (s) => [Math.max(0, Math.min(s.cleared - 50, 1)), 1] },
  { id: 'tiefe-5', name: 'Tiefenwanderer', desc: 'Erringe fünf Aschentiefen.', ruhm: 4, check: (s) => s.cleared >= 55, progress: (s) => [Math.max(0, Math.min(s.cleared - 50, 5)), 5] },

  // Wiederkehrende Quellen: Die Ruhm-Wirtschaft soll mit dem Spiel wachsen,
  // nicht nach einem Durchgang enden — Jagd, Stürze, Zeit, Beute, Tiefen.
  { id: 'ernte-50000', name: 'Schrecken der Tiefen', desc: 'Erlege 50.000 Kreaturen.', ruhm: 4, check: (s) => s.kills >= 50000, progress: (s) => [Math.min(s.kills, 50000), 50000] },
  { id: 'sturz-200', name: 'Vom Tode gezeichnet', desc: 'Falle 200 Male.', ruhm: 4, check: (s) => s.deaths >= 200, progress: (s) => [Math.min(s.deaths, 200), 200] },
  { id: 'zeit-100', name: 'Ewigkeit in Grau', desc: 'Verbringe 100 Stunden im Spiel.', ruhm: 4, check: (s) => s.playtimeMs >= 360000e3, progress: (s) => [Math.min(s.playtimeMs, 360000e3), 360000e3], format: 'zeit' },
  { id: 'beute-2000', name: 'Beutefürst', desc: 'Finde 2.000 Beutestücke.', ruhm: 4, check: (s) => dropTotal(s) >= 2000, progress: (s) => [Math.min(dropTotal(s), 2000), 2000] },
  { id: 'legendaer-50', name: 'Kronsammler', desc: 'Finde 50 legendäre Stücke.', ruhm: 4, check: (s) => dropOf(s, 'legendär') >= 50, progress: (s) => [Math.min(dropOf(s, 'legendär'), 50), 50] },
  { id: 'tiefe-10', name: 'Zehnfach versunken', desc: 'Erringe zehn Aschentiefen.', ruhm: 3, check: (s) => s.cleared >= 60, progress: (s) => [Math.max(0, Math.min(s.cleared - 50, 10)), 10] },
  { id: 'tiefe-25', name: 'Dem Grund entgegen', desc: 'Erringe 25 Aschentiefen.', ruhm: 4, check: (s) => s.cleared >= 75, progress: (s) => [Math.max(0, Math.min(s.cleared - 50, 25)), 25] },
  { id: 'tiefe-50', name: 'Unter allem Licht', desc: 'Erringe 50 Aschentiefen.', ruhm: 5, check: (s) => s.cleared >= 100, progress: (s) => [Math.max(0, Math.min(s.cleared - 50, 50)), 50] },
  { id: 'bestiarium-haupt', name: 'Chronist der Asche', desc: 'Erlege jede der 150 Kreaturen des Hauptspiels mindestens einmal.', ruhm: 5, check: (s) => mainBestiaryKnown(s) >= MAIN_BESTIARY_TOTAL, progress: (s) => [Math.min(mainBestiaryKnown(s), MAIN_BESTIARY_TOTAL), MAIN_BESTIARY_TOTAL] },
  { id: 'nachhall-1', name: 'Das Ich im Aschenschleier', desc: 'Brich den Nachhall deines früheren Ichs.', ruhm: 3, check: (s) => s.echo?.defeated === true, progress: (s) => [s.echo?.defeated === true ? 1 : 0, 1] },
];

// Ruhm: Die Errungenschaften-Währung. Sie wird NICHT separat gespeichert,
// sondern aus den eingesammelten IDs abgeleitet — Ausgaben zählt
// state.ruhmAusgegeben. Erfüllte, aber noch nicht abgeholte Errungenschaften
// (achievementsPending) zählen noch nicht; sie buchen erst beim Einsammeln.
export function ruhmEarned(state) {
  return state.achievements.reduce((sum, id) => sum + (ACHIEVEMENTS.find((a) => a.id === id)?.ruhm ?? 0), 0);
}

// Der Ruhm im Abhol-Regal — sichtbar, aber noch nicht gebucht.
export function ruhmPending(state) {
  return (state.achievementsPending ?? []).reduce((sum, id) => sum + (ACHIEVEMENTS.find((a) => a.id === id)?.ruhm ?? 0), 0);
}

// Härtung für geladene Spielstände: Ein bearbeiteter oder beschädigter Stand
// kann IDs wiederholen — ruhmEarned/ruhmPending summieren je Eintrag und
// würden Ruhm vervielfachen, womit sich der Ruhm-Laden umgehen ließe. Kanonisch
// heißt: nur bekannte IDs ohne Duplikate, und nichts im Abhol-Regal, was schon
// eingesammelt ist (sonst buchte das Einsammeln den Ruhm zweimal).
const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));

export function sanitizeAchievements(claimed, pending) {
  const canonical = (ids) => {
    const seen = new Set();
    const clean = [];
    for (const id of Array.isArray(ids) ? ids : []) {
      if (!ACHIEVEMENT_IDS.has(id) || seen.has(id)) continue;
      seen.add(id);
      clean.push(id);
    }
    return clean;
  };
  const collected = canonical(claimed);
  const collectedSet = new Set(collected);
  return {
    claimed: collected,
    pending: canonical(pending).filter((id) => !collectedSet.has(id)),
  };
}

// Errungenschaft einsammeln: Sie wandert aus dem Abhol-Regal in die Annalen
// und bucht ihren Ruhm — Rückgabe ist der Betrag für Toast & Sound.
export function claimAchievement(state, id) {
  const pending = state.achievementsPending ?? [];
  const index = pending.indexOf(id);
  if (index === -1) return 0;
  pending.splice(index, 1);
  if (!state.achievements.includes(id)) state.achievements.push(id);
  return ACHIEVEMENTS.find((a) => a.id === id)?.ruhm ?? 0;
}

export function ruhmAvailable(state) {
  return Math.max(0, ruhmEarned(state) - (state.ruhmAusgegeben ?? 0));
}

// Der Ruhm-Laden: permanente Erleichterungen, gestaffelt nach Stufen. Die
// Gesamtkosten (168) übersteigen bewusst den Gesamt-Ertrag (82) — Ruhm bleibt
// eine Entscheidung, nicht eine Checkliste: Es passt nie alles rein.
export const RUHM_SHOP = {
  beutelschein: { name: 'Beutelschein', desc: '+8 Inventarplätze pro Stufe — die Asche trägt mehr.', levels: [3, 6, 9] },
  zollerlass: { name: 'Zollerlass', desc: 'Todeszoll −3 % pro Stufe (15 % → 3 %).', levels: [2, 4, 6, 8] },
  aschesegen: { name: 'Aschesegen', desc: '+10 % Asche-Ertrag pro Stufe — im Feld wie offline.', levels: [3, 6, 9] },
  tiefenkunde: { name: 'Tiefenkunde', desc: 'Offline-Fortschritt +4 Stunden pro Stufe (8 h → bis 20 h).', levels: [3, 5, 7] },
  werkstatthandwerk: { name: 'Werkstatthandwerk', desc: 'Werkstatt-Kosten −5 % pro Stufe.', levels: [4, 6, 8] },
  kriegerherz: { name: 'Kriegerherz', desc: '+5 % Lebenskraft pro Stufe — auf den gesamten Maximalwert.', levels: [4, 7, 10] },
  wuchtschlag: { name: 'Wuchtschlag', desc: '+10 % Kritschaden pro Stufe.', levels: [3, 6, 9] },
  altelehre: { name: 'Alte Lehre', desc: '+5 % Erfahrung pro Stufe.', levels: [3, 6, 9] },
  schreinatem: { name: 'Schrein-Atem', desc: 'Schrein-Regeneration +25 % pro Stufe.', levels: [2, 4, 6] },
  aschwille: { name: 'Aschewille', desc: 'Auferstehung +5 % Lebenskraft pro Stufe (25 % → 40 %).', levels: [2, 3, 5] },
};

// Tiefen-Meisterschaft neu schmieden: unbegrenzt, bewusst günstig.
export const RUHM_RELIC_REROLL_COST = 2;

// Härtung für geladene Spielstände: Kaufstufen ganzzahlig zwischen 0 und der
// höchsten Stufe — negative Werte verfälschten Inventar, Asche-Ertrag,
// Todeszoll & Co., gebrochene ließen den nächsten Kauf NaN buchen. Dazu die
// Ruhm-Buchhaltung konsistent halten: Der Einkaufsanteil von ruhmAusgegeben
// wird exakt aus den Kaufstufen rekonstruiert — sonst bliebe ein Stand mit
// maximalen Käufen und leerer Ausgabenzeile ein Balance-Bypass. Der nicht-
// negative Rest ist die unveränderliche Reroll-Historie (je 2 Ruhm).
export function sanitizeShopPurchases(purchases, ruhmAusgegeben) {
  const clean = {};
  let spend = 0;
  for (const [kind, def] of Object.entries(RUHM_SHOP)) {
    const raw = purchases?.[kind];
    const level = Number.isFinite(raw)
      ? Math.min(def.levels.length, Math.max(0, Math.trunc(raw)))
      : 0;
    clean[kind] = level;
    for (let i = 0; i < level; i += 1) spend += def.levels[i];
  }
  const rerolls = Math.max(0, (Number.isFinite(ruhmAusgegeben) ? ruhmAusgegeben : 0) - spend);
  return { purchases: clean, ruhmAusgegeben: spend + rerolls };
}

// Prüft alle noch unbekannten Errungenschaften und trägt erfüllte ins Abhol-
// Regal (achievementsPending) ein — Ruhm gibt es erst beim Einsammeln.
// Rückgabe sind die neuen IDs (für Toasts).
export function evaluateAchievements(state) {
  const earned = new Set(state.achievements);
  const pending = new Set(state.achievementsPending ?? []);
  const fresh = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!earned.has(achievement.id) && !pending.has(achievement.id) && achievement.check(state)) {
      (state.achievementsPending ??= []).push(achievement.id);
      fresh.push(achievement.id);
    }
  }
  return fresh;
}
