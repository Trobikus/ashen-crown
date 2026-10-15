// Errungenschaften: Aus den Statistik-Zählern gewachsen — keine eigene
// Speicherlogik, nur IDs im Spielstand (state.achievements). check entscheidet
// den Unlock, progress liefert [aktuell, Ziel] für die Anzeige.
const dropTotal = (s) => Object.values(s.drops ?? {}).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
const dropOf = (s, key) => s.drops?.[key] ?? 0;

export const ACHIEVEMENTS = [
  { id: 'ernte-1', name: 'Erste Ernte', desc: 'Erlege deine erste Kreatur.', check: (s) => s.kills >= 1, progress: (s) => [Math.min(s.kills, 1), 1] },
  { id: 'ernte-100', name: 'Aschenjäger', desc: 'Erlege 100 Kreaturen.', check: (s) => s.kills >= 100, progress: (s) => [Math.min(s.kills, 100), 100] },
  { id: 'ernte-1000', name: 'Gebeinleser', desc: 'Erlege 1.000 Kreaturen.', check: (s) => s.kills >= 1000, progress: (s) => [Math.min(s.kills, 1000), 1000] },
  { id: 'ernte-10000', name: 'Schrecken der Asche', desc: 'Erlege 10.000 Kreaturen.', check: (s) => s.kills >= 10000, progress: (s) => [Math.min(s.kills, 10000), 10000] },

  { id: 'sturz-1', name: 'Erster Sturz', desc: 'Falle zum ersten Mal — die Asche nimmt ihren Zoll.', check: (s) => s.deaths >= 1, progress: (s) => [Math.min(s.deaths, 1), 1] },
  { id: 'sturz-10', name: 'Zollschuldner', desc: 'Falle 10 Male.', check: (s) => s.deaths >= 10, progress: (s) => [Math.min(s.deaths, 10), 10] },
  { id: 'sturz-50', name: 'Halb Asche', desc: 'Falle 50 Male.', check: (s) => s.deaths >= 50, progress: (s) => [Math.min(s.deaths, 50), 50] },

  { id: 'zeit-1', name: 'Erwacht', desc: 'Verbringe 1 Stunde im Spiel.', check: (s) => s.playtimeMs >= 3600e3, progress: (s) => [Math.min(s.playtimeMs, 3600e3), 3600e3], format: 'zeit' },
  { id: 'zeit-10', name: 'Brennende Geduld', desc: 'Verbringe 10 Stunden im Spiel.', check: (s) => s.playtimeMs >= 36000e3, progress: (s) => [Math.min(s.playtimeMs, 36000e3), 36000e3], format: 'zeit' },
  { id: 'zeit-50', name: 'Von Asche umhangen', desc: 'Verbringe 50 Stunden im Spiel.', check: (s) => s.playtimeMs >= 180000e3, progress: (s) => [Math.min(s.playtimeMs, 180000e3), 180000e3], format: 'zeit' },

  { id: 'beute-10', name: 'Sammler', desc: 'Finde 10 Beutestücke.', check: (s) => dropTotal(s) >= 10, progress: (s) => [Math.min(dropTotal(s), 10), 10] },
  { id: 'beute-100', name: 'Horter', desc: 'Finde 100 Beutestücke.', check: (s) => dropTotal(s) >= 100, progress: (s) => [Math.min(dropTotal(s), 100), 100] },
  { id: 'beute-500', name: 'Aschenbaron', desc: 'Finde 500 Beutestücke.', check: (s) => dropTotal(s) >= 500, progress: (s) => [Math.min(dropTotal(s), 500), 500] },
  { id: 'legendaer-1', name: 'Goldhauch', desc: 'Finde dein erstes legendäres Stück.', check: (s) => dropOf(s, 'legendär') >= 1, progress: (s) => [Math.min(dropOf(s, 'legendär'), 1), 1] },
  { id: 'legendaer-10', name: 'Kronjäger', desc: 'Finde 10 legendäre Stücke.', check: (s) => dropOf(s, 'legendär') >= 10, progress: (s) => [Math.min(dropOf(s, 'legendär'), 10), 10] },

  { id: 'gebiet-10', name: 'Über den Thron hinaus', desc: 'Befreie 10 Gebiete.', check: (s) => s.cleared >= 10, progress: (s) => [Math.min(s.cleared, 10), 10] },
  { id: 'gebiet-25', name: 'Der halbe Weg', desc: 'Befreie 25 Gebiete.', check: (s) => s.cleared >= 25, progress: (s) => [Math.min(s.cleared, 25), 25] },
  { id: 'kronentraeger', name: 'Kronenträger', desc: 'Hebe die Aschenkrone — alle 50 Gebiete sind frei.', check: (s) => s.cleared >= 50, progress: (s) => [Math.min(s.cleared, 50), 50] },
  { id: 'tiefe-1', name: 'Unter dem Thron', desc: 'Erringe die erste Aschentiefe.', check: (s) => s.cleared >= 51, progress: (s) => [Math.min(s.cleared - 50, 1), 1] },
  { id: 'tiefe-5', name: 'Tiefenwanderer', desc: 'Erringe fünf Aschentiefen.', check: (s) => s.cleared >= 55, progress: (s) => [Math.min(s.cleared - 50, 5), 5] },
];

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
