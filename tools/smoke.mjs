// Smoke-Checks für die in Node importierbaren Spielmodule (kein DOM nötig):
// Errungenschaften/Ruhm-Wirtschaft, Kauf-Effekte aus state.js und die
// Pfad-Bindung im Fertigkeitenbaum. Ein fehlgeschlagener Check setzt Exit 1.
//
//   node tools/smoke.mjs

let failed = 0;

const assert = (cond, label) => {
  if (cond) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
};

// ——— Errungenschaften & Ruhm ———
const A = await import('../src/achievements.js');
const D = await import('../src/data.js');

assert(A.ACHIEVEMENTS.length === 29, `29 Errungenschaften definiert (${A.ACHIEVEMENTS.length})`);
assert(A.ACHIEVEMENTS.every((a) => typeof a.check === 'function' && typeof a.progress === 'function'), 'jede Errungenschaft hat check + progress');
const ruhmTotal = A.ACHIEVEMENTS.reduce((sum, a) => sum + a.ruhm, 0);
assert(ruhmTotal === 77, `Gesamt-Ruhm 77 (${ruhmTotal})`);
const shopCost = Object.values(A.RUHM_SHOP).reduce((sum, def) => sum + def.levels.reduce((s, level) => s + level, 0), 0);
assert(shopCost === 89, `Ruhm-Laden kostet 89 (${shopCost}) — bewusst mehr als der Ertrag`);
assert(Object.keys(A.RUHM_SHOP).length === 5, `5 Ruhm-Käufe definiert (${Object.keys(A.RUHM_SHOP).length})`);

// checks feuern auf synthetischem Maximal-Zustand (inkl. vollem Bestiarium
// und 2.000+ Beutestücken, damit auch die Stufen-Errungenschaften feuern):
const bestiary = {};
for (const zone of D.ZONE_ENEMIES) {
  for (const type of ['normal', 'elite', 'boss']) bestiary[zone[type].name] = 1;
}
const fake = { kills: 60000, deaths: 300, playtimeMs: 400000e3, drops: { gewoehnlich: 1900, magisch: 40, selten: 40, episch: 19, 'legendär': 60 }, cleared: 120, bestiary, achievements: [] };
const fresh = A.evaluateAchievements(fake);
assert(fresh.length === A.ACHIEVEMENTS.length, `alle Errungenschaften feuern auf Maximal-Zustand (${fresh.length}/${A.ACHIEVEMENTS.length})`);
assert(A.ruhmEarned(fake) === 77, `ruhmEarned liest 77 (${A.ruhmEarned(fake)})`);

// Fortschritt der Tiefen-Errungenschaften zählt ab null (nicht negativ):
const tiefe1 = A.ACHIEVEMENTS.find((a) => a.id === 'tiefe-1');
const [cur] = tiefe1.progress({ cleared: 20 });
assert(cur === 0, `Tiefen-Fortschritt vor Zone 50 zeigt 0 (${cur})`);

// ——— Kauf-Effekte (state.js) ———
const S = await import('../src/state.js');
S.state.shopPurchases = { beutelschein: 3, zollerlass: 4, aschesegen: 3, tiefenkunde: 3, werkstatthandwerk: 3 };
assert(S.inventoryCap() === 64, `Beutelschein 3 → Inventar 64 (${S.inventoryCap()})`);
assert(S.deathPenalty() === 0.03, `Zollerlass 4 → Todeszoll 3 % (${S.deathPenalty()})`);
assert(S.ashGainFactor() === 1.3, `Aschesegen 3 → ×1,3 Asche (${S.ashGainFactor()})`);
assert(S.offlineCapMs() === 20 * 60 * 60 * 1000, `Tiefenkunde 3 → 20 h Offline-Cap (${S.offlineCapMs() / 3600000} h)`);
assert(S.craftCostFactor() === 0.85, `Werkstatthandwerk 3 → 85 % Werkstatt-Kosten (${S.craftCostFactor()})`);
S.state.shopPurchases = { beutelschein: 0, zollerlass: 0, aschesegen: 0, tiefenkunde: 0, werkstatthandwerk: 0 };
assert(S.inventoryCap() === 40 && S.offlineCapMs() === 8 * 60 * 60 * 1000, 'ohne Käufe: Basis 40 Plätze / 8 h');

// ——— Pfad-Bindung (skilltree.js über attemptAllocate) ———
const T = await import('../src/skilltree.js');
const st = S.state;
st.level = 30;
st.skillPoints = 10;
st.skills = ['start', 'kr0'];
T.attemptAllocate('hr0', { after: () => {} });
assert(st.skills.includes('hr0'), 'zweite Farbe (Haut) lässt sich skillen');
const sizeAfterTwo = st.skills.length;
T.attemptAllocate('ar0', { after: () => {} });
assert(st.skills.length === sizeAfterTwo, 'dritte Farbe (Asche) ist versiegelt');
T.attemptAllocate('gr0', { after: () => {} });
assert(st.skills.length === sizeAfterTwo, 'vierte Farbe (Geist) ist versiegelt');
T.attemptAllocate('kr1', { after: () => {} });
assert(st.skills.includes('kr1'), 'eigene Farbe bleibt offen (Nachbarschaft start→kr1)');
st.skills = ['start'];
T.attemptAllocate('ar0', { after: () => {} });
assert(st.skills.includes('ar0'), 'nach Respec ist jede Farbe wieder offen');
st.skills = ['start'];
st.skillPoints = 0;

// ——— Werkstatt-Kosten beachten den Rabatt (crafting.js) ———
const C = await import('../src/crafting.js');
assert(typeof C.renderCrafting === 'function', 'crafting.js lädt isoliert in Node');

// ——— Prestige: Kronenasche & Vermächtnis (prestige.js) ———
const P = await import('../src/prestige.js');
assert(P.kronenascheReward(50) === 1 && P.kronenascheReward(54) === 1, `Krone zahlt 1 (50/54: ${P.kronenascheReward(50)}/${P.kronenascheReward(54)})`);
assert(P.kronenascheReward(55) === 2 && P.kronenascheReward(70) === 5, `Tiefen-Bonus: 55→2, 70→5 (${P.kronenascheReward(55)}/${P.kronenascheReward(70)})`);
const titleCosts = Object.values(P.LEGACY_TITLES).reduce((sum, def) => sum + def.levels.reduce((s, l) => s + l, 0), 0);
assert(Object.keys(P.LEGACY_TITLES).length === 6 && titleCosts === 36, `6 Titel, 36 Kronenasche Gesamtkosten (${Object.keys(P.LEGACY_TITLES).length}/${titleCosts})`);
const ps = { kronenascheEarned: 3, kronenascheAusgegeben: 1, legacy: { beutelspaehler: 2, 'zweiter-atem': 3, unbekannt: 9 } };
assert(P.kronenascheAvailable(ps) === 2, `verfügbare Kronenasche 3−1=2 (${P.kronenascheAvailable(ps)})`);
assert(P.legacyLevel(ps, 'beutelspaehler') === 2 && P.legacyLevel(ps, 'unbekannt') === 0, `legacyLevel liest bekannte Titel, unbekannte = 0`);
assert(P.legacyLevel(ps, 'zweiter-atem') === 3, `Zweiter Atem liest Stufe 3`);
assert(Math.abs(P.ashLegacyFactor(ps) - 1.19) < 1e-9, `Asche-Faktor: 1 + 0,03×3 + 0,05×2 = 1,19 (${P.ashLegacyFactor(ps)})`);
assert(Math.abs(P.xpLegacyFactor(ps) - 1.09) < 1e-9, `XP-Faktor ohne Aschengeist = 1,09 (${P.xpLegacyFactor(ps)})`);
const pfresh = {};
assert(P.legacyLevel(pfresh, 'aschengeist') === 0 && P.kronenascheAvailable(pfresh) === 0, 'frischer Spielstand: alles bei null');

// ——— state.js: XP-Faktor folgt dem Vermächtnis ———
S.state.kronenascheEarned = 5;
S.state.legacy = { aschengeist: 2 };
assert(Math.abs(S.xpGainFactor() - 1.25) < 1e-9, `xpGainFactor: 1 + 0,03×5 + 0,05×2 = 1,25 (${S.xpGainFactor()})`);
S.state.kronenascheEarned = 0;
S.state.legacy = {};

console.log(failed ? `\n${failed} Check(s) fehlgeschlagen.` : '\nAlle Smoke-Checks bestanden.');
process.exit(failed ? 1 : 0);
