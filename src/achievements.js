// Errungenschaften: Aus den Statistik-Zählern gewachsen — keine eigene
// Speicherlogik, nur IDs im Spielstand (state.achievements). check entscheidet
// den Unlock, progress liefert [aktuell, Ziel] für die Anzeige, ruhm ist die
// Währung, die jeder Errungenschaft beim Erringen gewachsen ist.
const dropTotal = (s) => Object.values(s.drops ?? {}).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
const dropOf = (s, key) => s.drops?.[key] ?? 0;

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

  { id: 'gebiet-10', name: 'Über den Thron hinaus', desc: 'Befreie 10 Gebiete.', ruhm: 1, check: (s) => s.cleared >= 10, progress: (s) => [Math.min(s.cleared, 10), 10] },
  { id: 'gebiet-25', name: 'Der halbe Weg', desc: 'Befreie 25 Gebiete.', ruhm: 2, check: (s) => s.cleared >= 25, progress: (s) => [Math.min(s.cleared, 25), 25] },
  { id: 'kronentraeger', name: 'Kronenträger', desc: 'Hebe die Aschenkrone — alle 50 Gebiete sind frei.', ruhm: 3, check: (s) => s.cleared >= 50, progress: (s) => [Math.min(s.cleared, 50), 50] },
  { id: 'tiefe-1', name: 'Unter dem Thron', desc: 'Erringe die erste Aschentiefe.', ruhm: 2, check: (s) => s.cleared >= 51, progress: (s) => [Math.min(s.cleared - 50, 1), 1] },
  { id: 'tiefe-5', name: 'Tiefenwanderer', desc: 'Erringe fünf Aschentiefen.', ruhm: 4, check: (s) => s.cleared >= 55, progress: (s) => [Math.min(s.cleared - 50, 5), 5] },
];

// Ruhm: Die Errungenschaften-Währung. Sie wird NICHT separat gespeichert,
// sondern aus den errungenen IDs abgeleitet — Ausgaben zählt
// state.ruhmAusgegeben. Alte Spielstände sind damit rückwirkend versorgt.
export function ruhmEarned(state) {
  return state.achievements.reduce((sum, id) => sum + (ACHIEVEMENTS.find((a) => a.id === id)?.ruhm ?? 0), 0);
}

export function ruhmAvailable(state) {
  return Math.max(0, ruhmEarned(state) - (state.ruhmAusgegeben ?? 0));
}

// Der Ruhm-Laden: permanente Erleichterungen, gestaffelt nach Stufen.
export const RUHM_SHOP = {
  beutelschein: { name: 'Beutelschein', desc: '+8 Inventarplätze pro Stufe — die Asche trägt mehr.', levels: [3, 6, 9] },
  zollerlass: { name: 'Zollerlass', desc: 'Todeszoll −3 % pro Stufe (15 % → 3 %).', levels: [2, 4, 6, 8] },
};

// Tiefen-Meisterschaft neu schmieden: unbegrenzt, bewusst günstig.
export const RUHM_RELIC_REROLL_COST = 2;

// Prüft alle noch gesperrten Errungenschaften, trägt neue direkt in den
// Spielstand ein und gibt deren IDs zurück (für Toasts).
export function evaluateAchievements(state) {
  const earned = new Set(state.achievements);
  const fresh = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!earned.has(achievement.id) && achievement.check(state)) {
      state.achievements.push(achievement.id);
      fresh.push(achievement.id);
    }
  }
  return fresh;
}
