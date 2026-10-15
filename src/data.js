const TICK_MS = 100;

const ATTACK_INTERVAL_MS = 1500;

const STATS_SYNC_INTERVAL_MS = 3000;

const ENEMY_RESPAWN_S = 0.6;

const BOSS_AFTER_KILLS = 30;

const ELITE_EVERY_KILLS = 10;

const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;

const OFFLINE_MIN_GAP_MS = 30 * 1000;

const INVENTORY_CAP = 40;

const CONTINENTS = [
  {
    key: 'aschenlande',
    name: 'Die Aschenlande',
    zones: [
      { name: 'Aschenkrypta' },
      { name: 'Knochengewölbe' },
      { name: 'Aschekatakomben' },
      { name: 'Grabestiefe' },
      { name: 'Thronhalle der Asche' },
      { name: 'Glutgruft' },
      { name: 'Knochenlabyrinth' },
      { name: 'Aschenabgrund' },
      { name: 'Knochenkathedrale' },
      { name: 'Herz der Asche' },
    ],
  },
  {
    key: 'frostreich',
    name: 'Das Frostreich',
    zones: [
      { name: 'Frostkrypta' },
      { name: 'Reifgewölbe' },
      { name: 'Eiskatakomben' },
      { name: 'Schneetiefe' },
      { name: 'Halle des Frosts' },
      { name: 'Frostgruft' },
      { name: 'Eisverlies' },
      { name: 'Winterabgrund' },
      { name: 'Eiskathedrale' },
      { name: 'Herz des Winters' },
    ],
  },
  {
    key: 'faulmoor',
    name: 'Das Faulmoor',
    zones: [
      { name: 'Moorkrypta' },
      { name: 'Faulgewölbe' },
      { name: 'Sumpfkatakomben' },
      { name: 'Modertiefe' },
      { name: 'Halle der Fäulnis' },
      { name: 'Pestgruft' },
      { name: 'Schlinglabyrinth' },
      { name: 'Moorabgrund' },
      { name: 'Moorkathedrale' },
      { name: 'Herz des Moores' },
    ],
  },
  {
    key: 'blutmark',
    name: 'Das Blutmark',
    zones: [
      { name: 'Blutkrypta' },
      { name: 'Rostgewölbe' },
      { name: 'Eisenkatakomben' },
      { name: 'Kriegstiefe' },
      { name: 'Halle des Blutes' },
      { name: 'Rostgruft' },
      { name: 'Klingenlabyrinth' },
      { name: 'Blutabgrund' },
      { name: 'Eisenkathedrale' },
      { name: 'Herz des Blutes' },
    ],
  },
  {
    key: 'sternenleere',
    name: 'Die Sternenleere',
    zones: [
      { name: 'Leerenkrypta' },
      { name: 'Nachtgewölbe' },
      { name: 'Sternenkatakomben' },
      { name: 'Leerentiefe' },
      { name: 'Halle der Leere' },
      { name: 'Finsternisgruft' },
      { name: 'Sternenlabyrinth' },
      { name: 'Leerenabgrund' },
      { name: 'Sternenkathedrale' },
      { name: 'Herz der Leere' },
    ],
  },
];

// Gegenstände skalieren über das Item-Level der Zone; Kontinent-Eintritte
// (jede 10. Zone) führen kleine Sprünge ein, damit sich neue Kontinente
// spürbar anfühlen. Werte verifiziert über tools/balance-sim.mjs (Kandidat A:
// Hauptspiel ~6,5 h simulierte Spielzeit, Tiefen als Endlos-Wand mit
// gedämpftem XP-Wachstum).
const MAIN_ZONE_COUNT = 50;

const MAX_ZONE = 9999;

const LAST_ZONE_INDEX = MAIN_ZONE_COUNT - 1;

const CONTINENT_BUMP = { hp: 1.12, damage: 1.08, ilvl: 1.15 };

// XP wächst bewusst deutlich langsamer als Gegnerkraft: Stufen sollen mit dem
// Zonenfortschritt mithalten (Stufenvorsprung wird durch enemyXpMultiplier
// gedeckelt), nicht ihn explosionsartig überholen. Der Schaden wächst
// schneller als früher — Wände sind gewollt: Wer an einem Boss zerbricht,
// kehrt zurück, farmt Gear und Asche und schlägt dann zurück.
const ENEMY_GROWTH = { hp: 1.4, damage: 1.24, ash: 1.48, xp: 1.15 };

const DEPTH_GROWTH = { hp: 1.4, damage: 1.3, ash: 1.48, xp: 1.12 };

const ELITE_RATIOS = { hp: 2.4, damage: 1.25, ash: 3.5, xp: 2.8 };

const BOSS_RATIOS = { hp: 4.2, damage: 1.55, ash: 10, xp: 8 };

const BASE_NORMAL = { hp: 10, damage: 1, ash: 4, xp: 10 };

// Startzonen-Fundament: Extra-Leben für die ersten Gebiete, das linear bis
// Zone EARLY_HP_BONUS_ZONES schwindet (siehe ZONE_ENEMIES-Aufbau).
const EARLY_HP_BONUS = 12;

const EARLY_HP_BONUS_ZONES = 10;

const ILVL_BASE = 2;

const ILVL_GROWTH = 1.29;

const ilvlOf = (n) => Math.max(1, Math.round(ILVL_BASE * ILVL_GROWTH ** n * (n > 0 && n % 10 === 0 ? CONTINENT_BUMP.ilvl : 1)));

const ZONES = (() => {
  let globalIndex = 0;
  return CONTINENTS.flatMap((continent) => continent.zones.map((zone) => ({ ...zone, ilvl: ilvlOf(globalIndex++), continent: continent.name })));
})();

// Namen der Bestien der Aschenlande (handgesetzt); alle weiteren Kontinente
// führen die Namenstabellen fort, das Wachstum ist vollständig generiert.
// Loretreu: Normal- und Elite-Gegner sind die Menschen und Ränge des
// jeweiligen gefallenen Reiches (Hof, Gefolge, Gelehrte, Söldner, Aufstieg),
// die Bosse tragen die Spitzen der Kontinent-Geschichte (siehe src/lore.js).
const ASCHENLANDE_ENEMIES = [
  ['Ascheratte', 'Grabesdiener', 'Grabwächter'],
  ['Knochenkriecher', 'Beinhauskämmerer', 'Gebeinwächter'],
  ['Aschenwicht', 'Ascheschreiber', 'Aschenmutter'],
  ['Grabwurm', 'Leichenprediger', 'Der Bestattete'],
  ['Hofschatten', 'Kronenritter', 'Der Thronende'],
  ['Glutschleicher', 'Funkenmagd', 'Glutfürst'],
  ['Knochenläufer', 'Knochenherold', 'Knochenkoloss'],
  ['Aschenwanderer', 'Staubkämmerer', 'Der Verschluckte'],
  ['Knochenchor', 'Grabesorganist', 'Der Knochenkönig'],
  ['Ascheavatar', 'Ewige Glut', 'Der Aschegott'],
];

const CONTINENT_ENEMIES = {
  frostreich: [
    ['Frostpilger', 'Eiskämmerin', 'Der Frostherzog'],
    ['Reifknecht', 'Gewölbejäger', 'Der Reifwächter'],
    ['Schneewaise', 'Katakombenwache', 'Die Eisjungfrau'],
    ['Schneewühler', 'Gefrorenes Gefolge', 'Der Eingefrorene'],
    ['Winterherold', 'Eisritter', 'Der Winterkönig'],
    ['Frostläufer', 'Frostwartin', 'Der Eisbann'],
    ['Kettenfrost', 'Frostkerkerer', 'Sturmfessel'],
    ['Schneesturmschreiter', 'Winterbotschafter', 'Das Winterherz'],
    ['Chor des Frosts', 'Frostorganist', 'Der Eispriester'],
    ['Winteravatar', 'Ewiger Frost', 'Der Frostgott'],
  ],
  faulmoor: [
    ['Moorkriecher', 'Moorpilger', 'Der Moorgraf'],
    ['Moderschleicher', 'Archivarsleim', 'Die Moormutter'],
    ['Sumpfwicht', 'Heilkundiger', 'Der Schleimfürst'],
    ['Madenwühler', 'Reliquienschwimmer', 'Der Verweste'],
    ['Hofsmoder', 'Pestherold', 'Der Moorkönig'],
    ['Pestträger', 'Seuchenärztin', 'Der Pestfürst'],
    ['Dornenschlinger', 'Rankenwürger', 'Die Schlingmutter'],
    ['Sumpfschatten', 'Tiefenschleim', 'Der Verschlundene'],
    ['Chor der Moder', 'Pestorganist', 'Der Faulpriester'],
    ['Mooravatar', 'Ewige Fäulnis', 'Der Moorgott'],
  ],
  blutmark: [
    ['Blutschleicher', 'Söldnerleiche', 'Der Blutgraf'],
    ['Rostkriecher', 'Rostfähnrich', 'Die Rostkönigin'],
    ['Eisenwicht', 'Waffenknecht', 'Der Eisenfürst'],
    ['Lanzknecht', 'Doppelgelder', 'Der Schlachtherr'],
    ['Hofsmörder', 'Blutritter', 'Der Blutkönig'],
    ['Blutwurm', 'Zahlmeister', 'Der Schlächter'],
    ['Klingentänzer', 'Stahlweber', 'Der Stahlkoloss'],
    ['Blutschatten', 'Rostschreiter', 'Der Blutherr'],
    ['Chor der Klinge', 'Rostorganist', 'Der Blutpriester'],
    ['Blutavatar', 'Ewige Wut', 'Der Blutgott'],
  ],
  sternenleere: [
    ['Nachtschleicher', 'Leerenpilger', 'Der Nachtfürst'],
    ['Leerenkriecher', 'Sternwarter', 'Der Sternenwächter'],
    ['Sternenwicht', 'Astrolabit', 'Die Sternenmutter'],
    ['Nachtwühler', 'Sternenschürfer', 'Der Gestürzte Stern'],
    ['Nachtherold', 'Sternenritter', 'Der Sternenkönig'],
    ['Finsterniswurm', 'Schwarzfunke', 'Der Finsterfürst'],
    ['Sternenläufer', 'Mondweber', 'Der Sternenkoloss'],
    ['Nachtschatten', 'Leerenschreiter', 'Der Verschlinger'],
    ['Chor der Sterne', 'Nachtorganist', 'Der Sternenpriester'],
    ['Leerenavatar', 'Ewige Nacht', 'Die Aschenkrone'],
  ],
};

const DEPTH_ENEMY_NAMES = {
  normal: ['Aschenecho', 'Tiefenschleicher', 'Nachtasche', 'Staubgeborener', 'Echo der Gebeine'],
  elite: ['Grabanomalie', 'Leerenspross', 'Ascheprime', 'Tiefenwächter'],
  boss: ['Hüter der Tiefe', 'Der Namelose', 'Wächter der Aschenkrone', 'Das stille Herz'],
};

const sig3 = (value) => Number(value.toPrecision(3));

// WICHTIG: Gegner-Schaden bleibt Float — früher rundete Math.round(1 × 1.34)
// zu 1 und jeder Gegner traf das ganze Spiel lang für exakt 1 Schaden.
// Gerundet wird erst beim Spawn (scaledEnemy) bzw. beim Zuschlagen.
const growNormal = (stats, growth) => ({
  hp: sig3(stats.hp * growth.hp),
  damage: Math.max(1, sig3(stats.damage * growth.damage)),
  ash: sig3(stats.ash * growth.ash),
  xp: sig3(stats.xp * growth.xp),
});

const enemiesOf = (normalName, eliteName, bossName, stats) => ({
  normal: { name: normalName, ...stats },
  elite: {
    name: eliteName,
    hp: stats.hp * ELITE_RATIOS.hp,
    damage: Math.max(1, sig3(stats.damage * ELITE_RATIOS.damage)),
    ash: Math.round(stats.ash * ELITE_RATIOS.ash),
    xp: Math.round(stats.xp * ELITE_RATIOS.xp),
  },
  boss: {
    name: bossName,
    hp: stats.hp * BOSS_RATIOS.hp,
    damage: Math.max(1, sig3(stats.damage * BOSS_RATIOS.damage)),
    ash: stats.ash * BOSS_RATIOS.ash,
    xp: stats.xp * BOSS_RATIOS.xp,
    boss: true,
  },
});

const CONTINENT_KEYS = CONTINENTS.slice(1).map((continent) => continent.key);

const enemyNamesOf = (n) => (n < 10 ? ASCHENLANDE_ENEMIES[n] : CONTINENT_ENEMIES[CONTINENT_KEYS[Math.floor(n / 10) - 1]][n % 10]);

const ZONE_ENEMIES = [];
{
  let stats = { ...BASE_NORMAL };
  for (let n = 0; n < MAIN_ZONE_COUNT; n += 1) {
    if (n > 0) {
      stats = growNormal(stats, ENEMY_GROWTH);
      if (n % 10 === 0) {
        stats = {
          hp: sig3(stats.hp * CONTINENT_BUMP.hp),
          damage: Math.max(1, sig3(stats.damage * CONTINENT_BUMP.damage)),
          ash: stats.ash,
          xp: stats.xp,
        };
      }
    }
    // Startzonen-Fundament: Normale Gegner starten mit spürbar mehr Leben,
    // das relative Extra schwindet bis Zone 10 — Damage-All-in soll nicht
    // durch die ersten Gebiete oneshotten. Der Bonus wird nicht zurück in
    // die Wachstumsrechnung gespeist.
    const zoneStats = n < EARLY_HP_BONUS_ZONES
      ? { ...stats, hp: sig3(stats.hp + EARLY_HP_BONUS * (1 - n / EARLY_HP_BONUS_ZONES)) }
      : stats;
    const [normalName, eliteName, bossName] = enemyNamesOf(n);
    ZONE_ENEMIES.push(enemiesOf(normalName, eliteName, bossName, zoneStats));
  }
}

// Die Tiefen (Zone 51+) werden prozedural erzeugt: Gegner wachsen weiter,
// aber XP gedämpft — so entsteht eine Endlos-Wand statt eines zweiten
// Hauptspiels (Balance: tools/balance-sim.mjs, Modus --depths).
const depthRows = [];

let depthStats = null;

function ensureDepthRows(index) {
  if (!depthStats) {
    const last = ZONE_ENEMIES[LAST_ZONE_INDEX].normal;
    depthStats = { hp: last.hp, damage: last.damage, ash: last.ash, xp: last.xp };
  }
  while (depthRows.length <= index - MAIN_ZONE_COUNT) {
    depthStats = growNormal(depthStats, DEPTH_GROWTH);
    const depth = depthRows.length + 1;
    depthRows.push(enemiesOf(
      DEPTH_ENEMY_NAMES.normal[(depth - 1) % DEPTH_ENEMY_NAMES.normal.length],
      DEPTH_ENEMY_NAMES.elite[(depth - 1) % DEPTH_ENEMY_NAMES.elite.length],
      DEPTH_ENEMY_NAMES.boss[(depth - 1) % DEPTH_ENEMY_NAMES.boss.length],
      depthStats,
    ));
  }
}

function enemyDef(index) {
  const i = Math.max(0, Math.min(Math.trunc(index) || 0, MAX_ZONE));
  if (i < MAIN_ZONE_COUNT) return ZONE_ENEMIES[i];
  ensureDepthRows(i);
  return depthRows[i - MAIN_ZONE_COUNT];
}

const ROMAN_STEPS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

function romanize(num) {
  if (num >= 4000) return `${num}`;
  let out = '';
  for (const [value, symbol] of ROMAN_STEPS) {
    while (num >= value) {
      out += symbol;
      num -= value;
    }
  }
  return out;
}

function zoneDef(index) {
  const i = Math.max(0, Math.min(Math.trunc(index) || 0, MAX_ZONE));
  if (i < MAIN_ZONE_COUNT) return ZONES[i];
  const depth = i - MAIN_ZONE_COUNT + 1;
  return {
    name: `Aschentiefe ${romanize(depth)}`,
    ilvl: Math.max(1, Math.round(ZONES[LAST_ZONE_INDEX].ilvl * ILVL_GROWTH ** depth)),
    continent: 'Die Tiefen',
  };
}

// Je Slot fünf Basen in Stufenordnung (Tier 1–5, siehe BASE_TIERS) — der
// erste Eintrag ist der historische Name alter Spielstände und die neutrale
// Referenz. Der Item-Name entsteht als „<name> <Seltenheits-Suffix>"; die
// Werte würfelt rollItemValues aus Seltenheit + ilvl + Tier und prägt die
// Basis darüber:
//   damageMult / hpMult / armorMult — Multiplikator auf den Grundwert (1 = neutral)
//   critDelta        — flache Krit-Punkte auf den Krit-Affix (0 = neutral, geklemmt bei 0)
//   armorShare       — Anteil am Rüstungs-Grundwert als Extrarüstung auf Schadens-Slots
//   leechChanceMult  — Multiplikator auf die Lifeleech-Chance (nur Waffe)
const HANDSCHUH_BASES = [
  { name: 'Handschuh', tier: 1 },
  { name: 'Fäustling', tier: 2, damageMult: 1.15, critDelta: -4 },
  { name: 'Krallenhandschuhe', tier: 3, damageMult: 0.85, critDelta: 5 },
  { name: 'Kettenhandschuhe', tier: 4, damageMult: 0.9, armorShare: 0.25 },
  { name: 'Plattenhandschuhe', tier: 5, damageMult: 0.8, armorShare: 0.4 },
];

const GEAR_SLOTS = [
  {
    key: 'waffe', label: 'Waffe', abbrev: 'KL', stat: 'damage', pool: 'waffe',
    bases: [
      { name: 'Klinge', tier: 1 },
      { name: 'Axt', tier: 2, damageMult: 1.15, critDelta: -4 },
      { name: 'Speer', tier: 3, damageMult: 0.85, critDelta: 5 },
      { name: 'Streitkolben', tier: 4, damageMult: 1.3, critDelta: -7 },
      { name: 'Sense', tier: 5, damageMult: 0.9, critDelta: 2, leechChanceMult: 2 },
    ],
  },
  {
    key: 'brust', label: 'Brust', abbrev: 'BP', stat: 'hp', pool: 'armor',
    bases: [
      { name: 'Brustplatte', tier: 1 },
      { name: 'Kettenhemd', tier: 2, hpMult: 0.9, armorMult: 1.25 },
      { name: 'Schuppenpanzer', tier: 3, hpMult: 1.1, armorMult: 0.9 },
      { name: 'Knochenpanzer', tier: 4, hpMult: 1.25, armorMult: 0.7 },
      { name: 'Plattenharnisch', tier: 5, hpMult: 0.85, armorMult: 1.35 },
    ],
  },
  {
    key: 'helm', label: 'Helm', abbrev: 'HE', stat: 'hp', pool: 'armor',
    bases: [
      { name: 'Helm', tier: 1 },
      { name: 'Spangenhelm', tier: 2, hpMult: 1.1, armorMult: 0.9 },
      { name: 'Kettenhaube', tier: 3, hpMult: 0.95, armorMult: 1.15 },
      { name: 'Hornhelm', tier: 4, hpMult: 1.2, armorMult: 0.8 },
      { name: 'Kübelhelm', tier: 5, hpMult: 0.85, armorMult: 1.3 },
    ],
  },
  {
    key: 'hose', label: 'Hose', abbrev: 'BE', stat: 'hp', pool: 'armor',
    bases: [
      { name: 'Beinlinge', tier: 1 },
      { name: 'Kettenbeinlinge', tier: 2, hpMult: 0.9, armorMult: 1.25 },
      { name: 'Schattenhose', tier: 3, hpMult: 1.15, armorMult: 0.85 },
      { name: 'Knochenhose', tier: 4, hpMult: 1.25, armorMult: 0.7 },
      { name: 'Plattenhose', tier: 5, hpMult: 0.85, armorMult: 1.35 },
    ],
  },
  {
    key: 'schuhe', label: 'Schuhe', abbrev: 'ST', stat: 'hp', pool: 'armor',
    bases: [
      { name: 'Stiefel', tier: 1 },
      { name: 'Wanderstiefel', tier: 2, hpMult: 1.15, armorMult: 0.85 },
      { name: 'Sporenstiefel', tier: 3, hpMult: 0.9, armorMult: 1.2 },
      { name: 'Knochenstiefel', tier: 4, hpMult: 1.25, armorMult: 0.7 },
      { name: 'Plattenschuhe', tier: 5, hpMult: 0.85, armorMult: 1.3 },
    ],
  },
  { key: 'hand-links', label: 'Handschuh Links', bases: HANDSCHUH_BASES, abbrev: 'HL', stat: 'damage', pool: 'hands' },
  { key: 'hand-rechts', label: 'Handschuh Rechts', bases: HANDSCHUH_BASES, abbrev: 'HR', stat: 'damage', pool: 'hands' },
];

const RARITIES = [
  { key: 'gewoehnlich', label: 'Gewöhnlich', suffix: 'der Asche', color: '#8a7f6d', weight: 54, mult: 1 },
  { key: 'magisch', label: 'Magisch', suffix: 'des Funkens', color: '#6d8aa6', weight: 26, mult: 1.5 },
  { key: 'selten', label: 'Selten', suffix: 'der Gebeine', color: '#bfa24a', weight: 14, mult: 2.2 },
  { key: 'episch', label: 'Episch', suffix: 'der Krone', color: '#9d6d8a', weight: 5, mult: 3.4 },
  { key: 'legendär', label: 'Legendär', suffix: 'der Aschenkrone', color: '#c1663a', weight: 1, mult: 5.2 },
];

// Beute ist ein Ereignis, kein Dauerregen — der Tester will spürbare Finds.
const DROP_CHANCES = { normal: 0.01, elite: 0.08, boss: 0.5 };

// Tod kostet Zoll: Anteil der aktuellen Asche, den die Asche beim Fallen einbehält.
const DEATH_ASH_PENALTY = 0.15;

// Loot à la Diablo: Seltenheit kauft Affixplätze (0/1/2/3/4) — der
// Seltenheits-Multiplikator auf den Hauptwert bleibt der obendrauf gezahlte
// Zins. Legendär krönt das Ganze mit der Meisterschaft (Legendary Power).
const AFFIX_COUNTS = { gewoehnlich: 0, magisch: 1, selten: 2, episch: 3, 'legendär': 4 };

// Affix-Wertebereiche je Seltenheit; fehlt eine Seltenheit, rollt das Affix
// dort nicht (Kritschaden z. B. erst ab Selten). Flat-Affixe sind Anteile am
// jeweiligen ilvl-Grundwert, Prozente ganze Punkte.
const AFFIX_RANGES = {
  crit: { magisch: [2, 3], selten: [3, 5], episch: [5, 8], legendär: [7, 10] },
  critDmg: { selten: [10, 20], episch: [18, 35], legendär: [30, 60] },
  damagePct: { magisch: [3, 5], selten: [5, 10], episch: [8, 15], legendär: [12, 20] },
  flatDamage: { magisch: [0.2, 0.3], selten: [0.35, 0.55], episch: [0.6, 0.85], legendär: [0.9, 1.25] },
  armorFlat: { magisch: [0.15, 0.25], selten: [0.25, 0.4], episch: [0.4, 0.55], legendär: [0.55, 0.75] },
  hpFlat: { magisch: [0.3, 0.45], selten: [0.5, 0.7], episch: [0.7, 0.9], legendär: [0.9, 1.2] },
  hpPct: { selten: [4, 8], episch: [6, 12], legendär: [10, 18] },
  armorPct: { selten: [6, 12], episch: [10, 18], legendär: [15, 25] },
};

// Affix-Pools je Slot-Typ: Waffen schärfen den Angriff, Rüstung das
// Überleben, Handschuhe mischen beides (D4: Handschuhe tragen Rüstung).
const AFFIX_POOLS = {
  waffe: ['crit', 'critDmg', 'damagePct', 'flatDamage'],
  hands: ['crit', 'critDmg', 'damagePct', 'armorFlat'],
  armor: ['hpFlat', 'hpPct', 'armorFlat', 'armorPct'],
};

// Basen-Stufen: Höhere Basen schalten per ilvl frei (das Sortiment wächst
// mit dem Helden — Zone 5 / 10 / 19 / 22 ungefähr) und rollen bessere
// Hauptwerte. Alte Basen veralten damit natürlich im Lauf des Spiels.
const BASE_TIERS = [
  { unlock: 1, mult: 1 },
  { unlock: 8, mult: 1.1 },
  { unlock: 24, mult: 1.2 },
  { unlock: 110, mult: 1.35 },
  { unlock: 500, mult: 1.5 },
];

// Lifeleech sitzt ausschließlich auf Waffen und erst ab Episch (lila) — und
// selbst dort nur mit Chance, nie garantiert. Eine von zwei Varianten:
// Prozent (Anteil des ausgeteilten Schadens) oder Flat (feste Lebenskraft
// pro Treffer). Lifeleech hält das Farmen normaler Gegner über Wasser; Bosse
// brechen durch die Rate hindurch. Rasten am Schrein heilt alles.
const LIFELEECH_CHANCE_BY_RARITY = { episch: 0.5, legendär: 0.75 };

const LIFELEECH_PCT_BY_RARITY = {
  episch: [10, 14],
  legendär: [15, 20],
};

const LIFELEECH_FLAT_BY_RARITY = {
  episch: { base: 3, ilvl: 0.15 },
  legendär: { base: 4, ilvl: 0.22 },
};

// Variantenwurf: Prozent-Skaliert mit dem Schaden und bleibt damit die
// Sustain-Arbeitstier; Flat ist der frühe, konstante Weg.
const LIFELEECH_PCT_ODDS = 0.65;

// Kämpfen ist kein Selbstläufer: Gegner greifen manchmal daneben.
const ENEMY_MISS_CHANCE = 0.15;

// Und auch der Held verfehlt — jeder Schlag sitzt nie garantiert. Das federt
// DPS-Spitzen und macht harte Gegner zu echten Wänden.
const HERO_MISS_CHANCE = 0.12;

// Schadensspanne des Helden: Jeder Schlag rollt ±DAMAGE_VARIANCE um seinen
// Wert (gleichverteilt, Erwartungswert unverändert — Sims reichen weiter).
const DAMAGE_VARIANCE = 0.15;

// Kritchance ist gedeckelt — volle Trefferquote bleibt unerreichbar.
const CRIT_CHANCE_CAP = 75;

// Fertigkeitenbaum: Öffnet sich ab dieser Stufe, Runenpunkte gibt es nur ab da.
const SKILL_TREE_UNLOCK_LEVEL = 20;

// Statpunkte pro Stufenaufstieg.
const STAT_POINTS_PER_LEVEL = 2;

// Über-levelte Gegner magern XP ab: pro Level Differenz ein Zwanzigstel,
// ab ENEMY_XP_CUTOFF_LEVELS Stufen Unterschied gibt es nichts mehr.
const ENEMY_XP_CUTOFF_LEVELS = 20;

function enemyXpMultiplier(enemyLevel, heroLevel) {
  const diff = heroLevel - enemyLevel;
  if (diff <= 0) return 1;
  return Math.max(0, 1 - diff / ENEMY_XP_CUTOFF_LEVELS);
}

// Enrage: Bosse attackieren beschleunigt, sobald ihre Lebenskraft unter die
// Schwelle fällt — Phase zwei jedes Bosskampfs.
const ENRAGE_THRESHOLD = 0.35;

const ENRAGE_INTERVAL_MULT = 0.65;

// Hub-Regeneration: Der Schrein atmet — im Hub kehrt die Lebenskraft mit
// 2 % des Maximums pro Sekunde zurück (50 s von null auf voll).
const HUB_REGEN_PER_SECOND = 0.02;

// Verhaltensprofile: Alle Gegner einer Zone teilen ein Temperament (rotiert
// pro Zone), Bosse kämpfen standardisiert und verfallen in Wut.
const ENEMY_PROFILES = {
  standard: { label: '', hp: 1, damage: 1, interval: 1 },
  flink: { label: 'Flink', hp: 0.75, damage: 0.8, interval: 0.65 },
  massiv: { label: 'Massiv', hp: 1.5, damage: 1.2, interval: 1.5 },
};

const PROFILE_CYCLE = ['standard', 'flink', 'massiv'];

function profileOf(zoneIndex, type) {
  if (type === 'boss') return { key: 'standard', label: 'Boss', hp: 1, damage: 1, interval: 1 };
  const index = ((Math.trunc(zoneIndex) % PROFILE_CYCLE.length) + PROFILE_CYCLE.length) % PROFILE_CYCLE.length;
  const key = PROFILE_CYCLE[index];
  return { key, ...ENEMY_PROFILES[key] };
}

// Gegnerstufen steigen 3 pro Gebiet (Normal 3N−2, Elite +2, Boss +4) — jede
// Range spannt 5 Stufen und beginnt damit nie mehr als 1 unter der Höchst-
// stufe des Vorgehenden: eine lückenlose Leiter (Anzeige & XP-Abmagerung).
const ENEMY_TYPE_LEVEL_OFFSETS = { normal: 0, elite: 2, boss: 4 };

function enemyLevelOf(zoneIndex, type) {
  const base = Math.max(1, zoneIndex * 3 + 1);
  return base + (ENEMY_TYPE_LEVEL_OFFSETS[type] ?? 0);
}

function continentKeyOf(zoneIndex) {
  const i = Math.max(0, Math.min(Math.trunc(zoneIndex) || 0, MAX_ZONE));
  if (i >= MAIN_ZONE_COUNT) return 'tiefen';
  return CONTINENTS[Math.floor(i / 10)].key;
}

const BASE_CRIT_CHANCE = 5;

const CRIT_MULTIPLIER = 2;

const BASE_ATTACK_SPEED = 1;

const ARMOR_RESISTANCE = 12;

const SKILL_SPOKE_ANGLES = [-30, 0, 30];

// Der Baum soll stärken, nicht überflügeln: Alle Runenwerte werden beim
// Graphaufbau mit diesem Faktor gedämpft (Anzeige nutzt dieselben Werte).
const SKILL_VALUE_SCALE = 0.5;

const SKILL_SMALL_OFFSET = 9;

const SKILL_WHEEL_RADII = [130, 215, 300, 385, 470];

const SKILL_ROOT_RADIUS = 48;

const SKILL_KEYSTONE_RADIUS = 545;

const SKILL_NODE_RADIUS = { start: 18, keystone: 16, notable: 11, small: 7 };

const SKILL_BRANCHES = [
  {
    key: 'krieg',
    prefix: 'k',
    base: 0,
    smallPool: [
      { damage: 2 }, { crit: 1 }, { damage: 1, crit: 1 },
      { critDmg: 8 }, { speed: 2 }, { damagePct: 2 },
    ],
    spokes: [
      [
        ['Wucht', { damage: 5 }],
        ['Wuchtiger Hieb', { damage: 7 }],
        ['Wildheit', { damage: 9 }],
        ['Zermalmend', { damage: 12 }],
        ['Kriegsfürst', { damage: 14, crit: 3 }],
      ],
      [
        ['Kriegslied', { damagePct: 5 }],
        ['Schlachtruf', { damagePct: 7 }],
        ['Nerven aus Stahl', { critDmg: 18 }],
        ['Henkerswerk', { damagePct: 9, critDmg: 14 }],
        ['Zorn der Asche', { damagePct: 12, critDmg: 18 }],
      ],
      [
        ['Blutrausch', { speed: 5 }],
        ['Zweite Klinge', { speed: 5, damage: 2 }],
        ['Klingensturm', { speed: 6, crit: 2 }],
        ['Blutdurst', { critDmg: 14, speed: 3 }],
        ['Scharfer Rand', { crit: 4, critDmg: 12 }],
      ],
    ],
    keystones: [
      ['Knochenbrecher', 'Überwältigende Gewalt, zerbrechliches Fleisch.', { damage: 30, hp: -40 }],
      ['Todesklinge', 'Jeder Schlag ein Todesurteil.', { damagePct: 18, speed: 12 }],
      ['Raserei', 'Wer nie stillsteht, wird nie gefasst.', { speed: 30, armor: -8 }],
    ],
  },
  {
    key: 'haut',
    prefix: 'h',
    base: 90,
    smallPool: [
      { hp: 12 }, { armor: 3 }, { hp: 8, armor: 2 },
      { armor: 4 }, { hp: 15 }, { armor: 2, hp: 5 },
    ],
    spokes: [
      [
        ['Steinnarbe', { armor: 5 }],
        ['Eisenhaut', { armor: 7 }],
        ['Schildseele', { armor: 9 }],
        ['Dornenpanzer', { armor: 11 }],
        ['Fels in der Brandung', { armor: 13, hp: 15 }],
      ],
      [
        ['Derbe Haut', { hp: 20 }],
        ['Zähes Fleisch', { hp: 25 }],
        ['Dicke Schwiele', { hp: 30 }],
        ['Massiv', { hp: 38 }],
        ['Gigantisch', { hp: 50 }],
      ],
      [
        ['Narbengewebe', { hp: 15, armor: 3 }],
        ['Sturmfest', { armor: 5, hp: 12 }],
        ['Granithaut', { armor: 7, hp: 15 }],
        ['Unbeugsam', { hp: 30, armor: 4 }],
        ['Mauer der Asche', { hp: 40, armor: 8 }],
      ],
    ],
    keystones: [
      ['Ungebrochen', 'Die Mauer fällt nicht. Sie tötet nur langsamer.', { armor: 35, damagePct: -10 }],
      ['Aschengestalt', 'Was aus Asche geformt ist, bricht nicht.', { hp: 80, armor: 20 }],
      ['Blutzoll', 'Leben im Überfluss, bezahlt mit Schwere.', { hp: 150, speed: -8 }],
    ],
  },
  {
    key: 'asche',
    prefix: 'a',
    base: 180,
    smallPool: [
      { ash: 3 }, { xp: 3 }, { ash: 2, xp: 2 },
      { ash: 4 }, { xp: 4 }, { ash: 3, xp: 1 },
    ],
    spokes: [
      [
        ['Asche ziehen', { ash: 8 }],
        ['Funkenflug', { ash: 6 }],
        ['Funkelnder Haufen', { ash: 8 }],
        ['Beutelschneider', { ash: 9 }],
        ['Aschebringer', { ash: 12 }],
      ],
      [
        ['Gierige Hand', { xp: 7 }],
        ['Gier', { xp: 8 }],
        ['Aschepfad', { xp: 9 }],
        ['Totenlehre', { xp: 11 }],
        ['Gelehrter des Todes', { xp: 14 }],
      ],
      [
        ['Sammler', { ash: 5, xp: 3 }],
        ['Knochenzoll', { ash: 6, xp: 4 }],
        ['Reliquienjäger', { xp: 7, ash: 3 }],
        ['Hordennest', { ash: 10, xp: 4 }],
        ['Wachsender Haufen', { ash: 12, xp: 6 }],
      ],
    ],
    keystones: [
      ['Midashand', 'Alles, was du berührst, fällt zu Asche. Und Asche vermehrt sich.', { ash: 45, damagePct: -10 }],
      ['Aschenherr', 'Die Toten zollen dir ihren letzten Zent.', { ash: 28, xp: 22 }],
      ['Zehnt der Toten', 'Der Tod selbst zahlt dir Lehrgeld.', { xp: 35, armor: -6 }],
    ],
  },
  {
    key: 'geist',
    prefix: 'g',
    base: 270,
    smallPool: [
      { crit: 2 }, { critDmg: 8 }, { speed: 2 },
      { crit: 1, speed: 1 }, { critDmg: 6, crit: 1 }, { speed: 3 },
    ],
    spokes: [
      [
        ['Klarer Blick', { crit: 3 }],
        ['Ruhige Hand', { crit: 3 }],
        ['Geistesgegenwart', { crit: 4 }],
        ['Wahre Sicht', { crit: 4, critDmg: 8 }],
        ['Vollstrecker', { crit: 6 }],
      ],
      [
        ['Gedankenschärfe', { critDmg: 14 }],
        ['Kalter Zorn', { critDmg: 16 }],
        ['Gedankenblitz', { critDmg: 20 }],
        ['Zeitsprung', { critDmg: 18, speed: 4 }],
        ['Todesurteil', { crit: 5, critDmg: 22 }],
      ],
      [
        ['Flinke Finger', { speed: 4 }],
        ['Zeitgefühl', { speed: 4 }],
        ['Vorahnung', { speed: 5 }],
        ['Nebelblick', { speed: 5, crit: 2 }],
        ['Sturmkonzentration', { speed: 8 }],
      ],
    ],
    keystones: [
      ['Henkersauge', 'Du siehst den Moment, in dem alles endet.', { crit: 15, hp: -50 }],
      ['Geistesblitz', 'Ein Gedanke, drei Schläge.', { speed: 15, crit: 10 }],
      ['Zeitraffung', 'Die Welt wirkt träge, seit du erwacht bist.', { speed: 35, armor: -8 }],
    ],
  },
];

const SKILL_BRIDGES = [
  {
    angle: 45, low: 'k', high: 'h',
    names: ['Klingenwall', 'Zwillingstor', 'Knochenburg'],
    effects: [{ damage: 1, hp: 5 }, { damage: 1, hp: 8 }, { damage: 2, hp: 10 }],
  },
  {
    angle: 135, low: 'h', high: 'a',
    names: ['Aschepanzer', 'Reliquienposten', 'Reliquienwacht'],
    effects: [{ armor: 2, ash: 2 }, { armor: 3, ash: 3 }, { armor: 4, ash: 4 }],
  },
  {
    angle: 225, low: 'a', high: 'g',
    names: ['Funkenblick', 'Nebelpfad', 'Geisterzins'],
    effects: [{ xp: 2, crit: 1 }, { xp: 3, crit: 1 }, { xp: 4, crit: 2 }],
  },
  {
    angle: 315, low: 'g', high: 'k',
    names: ['Henkershilfe', 'Kalte Wut', 'Kaltblütig'],
    effects: [{ speed: 1, damage: 1 }, { speed: 1, damage: 2 }, { speed: 2, damage: 2 }],
  },
];

const SKILL_BRIDGE_TIERS = [
  { suffix: 'i', radius: 215 },
  { suffix: 'm', radius: 300 },
  { suffix: 'o', radius: 470 },
];

const skillEffectsOf = (map) => Object.entries(map).map(([stat, value]) => ({ stat, value: Math.round(value * SKILL_VALUE_SCALE) }));

const SKILL_GRAPH = (() => {
  const nodes = [{
    id: 'start',
    name: 'Der Erweckte',
    desc: 'Der erste Funke in der Asche.',
    branch: 'start',
    type: 'start',
    radius: 0,
    angle: 0,
    effects: [],
  }];
  const edges = [];
  for (const branch of SKILL_BRANCHES) {
    let poolCursor = 0;
    const nextSmall = () => skillEffectsOf(branch.smallPool[poolCursor++ % branch.smallPool.length]);
    SKILL_SPOKE_ANGLES.forEach((spokeAngle, spokeIndex) => {
      const spokeBase = branch.base + spokeAngle;
      const rootId = `${branch.prefix}r${spokeIndex}`;
      nodes.push({
        id: rootId, branch: branch.key, type: 'small',
        radius: SKILL_ROOT_RADIUS, angle: spokeBase, effects: nextSmall(),
      });
      edges.push(['start', rootId]);
      let prevId = rootId;
      SKILL_WHEEL_RADII.forEach((radius, wheelIndex) => {
        const baseId = `${branch.prefix}s${spokeIndex}w${wheelIndex}`;
        nodes.push({
          id: `${baseId}a`, branch: branch.key, type: 'small',
          radius, angle: spokeBase - SKILL_SMALL_OFFSET, effects: nextSmall(),
        });
        const [notableName, notableEffects] = branch.spokes[spokeIndex][wheelIndex];
        nodes.push({
          id: `${baseId}n`, name: notableName, branch: branch.key, type: 'notable',
          radius, angle: spokeBase, effects: skillEffectsOf(notableEffects),
        });
        nodes.push({
          id: `${baseId}b`, branch: branch.key, type: 'small',
          radius, angle: spokeBase + SKILL_SMALL_OFFSET, effects: nextSmall(),
        });
        edges.push([prevId, `${baseId}a`], [`${baseId}a`, `${baseId}n`], [`${baseId}n`, `${baseId}b`]);
        prevId = `${baseId}b`;
      });
      const [keystoneName, keystoneDesc, keystoneEffects] = branch.keystones[spokeIndex];
      const keystoneId = `${branch.prefix}k${spokeIndex}`;
      nodes.push({
        id: keystoneId, name: keystoneName, desc: keystoneDesc, branch: branch.key,
        type: 'keystone', radius: SKILL_KEYSTONE_RADIUS, angle: spokeBase,
        effects: skillEffectsOf(keystoneEffects),
      });
      edges.push([`${branch.prefix}s${spokeIndex}w4n`, keystoneId]);
    });
    for (const wheelIndex of [2, 4]) {
      edges.push([`${branch.prefix}s0w${wheelIndex}b`, `${branch.prefix}s1w${wheelIndex}a`]);
      edges.push([`${branch.prefix}s1w${wheelIndex}b`, `${branch.prefix}s2w${wheelIndex}a`]);
    }
  }
  for (const bridge of SKILL_BRIDGES) {
    SKILL_BRIDGE_TIERS.forEach(({ suffix, radius }, tier) => {
      const wheelIndex = SKILL_WHEEL_RADII.indexOf(radius);
      const id = `br${bridge.angle}${suffix}`;
      nodes.push({
        id, name: bridge.names[tier], branch: 'bruecke', type: 'small',
        radius, angle: bridge.angle, effects: skillEffectsOf(bridge.effects[tier]),
      });
      edges.push([`${bridge.low}s2w${wheelIndex}b`, id]);
      edges.push([id, `${bridge.high}s0w${wheelIndex}a`]);
    });
  }
  return { nodes, edges };
})();

const SKILL_NODES = SKILL_GRAPH.nodes;

const SKILL_EDGES = SKILL_GRAPH.edges;

const SKILL_NODES_BY_ID = Object.fromEntries(SKILL_NODES.map((node) => [node.id, node]));

const skillSigned = (v) => (v > 0 ? `+${v}` : `${v}`);

const SKILL_EFFECT_LABELS = {
  damage: (v) => `${skillSigned(v)} Schaden`,
  damagePct: (v) => `${skillSigned(v)} % Schaden`,
  hp: (v) => `${skillSigned(v)} Lebenskraft`,
  hpPct: (v) => `${skillSigned(v)} % Lebenskraft`,
  armor: (v) => `${skillSigned(v)} Rüstung`,
  armorPct: (v) => `${skillSigned(v)} % Rüstung`,
  crit: (v) => `${skillSigned(v)} % Kritchance`,
  critDmg: (v) => `${skillSigned(v)} % Kritschaden`,
  speed: (v) => `${skillSigned(v)} % Angriffstempo`,
  ash: (v) => `${skillSigned(v)} % Asche`,
  xp: (v) => `${skillSigned(v)} % Erfahrung`,
};

const NUM_SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];

function formatNum(value) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return `${sign}${Math.round(abs)}`;
  const tier = Math.min(Math.floor(Math.log10(abs) / 3), NUM_SUFFIXES.length - 1);
  const scaled = abs / 1000 ** tier;
  let text = scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2);
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
  return `${sign}${text.replace('.', ',')}${NUM_SUFFIXES[tier]}`;
}

const MASTERY_POOL = {
  damage: [
    { stat: 'damagePct', min: 8, max: 15 },
    { stat: 'speed', min: 6, max: 12 },
    { stat: 'critDmg', min: 15, max: 30 },
  ],
  hp: [
    { stat: 'hpPct', min: 10, max: 20 },
    { stat: 'armorPct', min: 8, max: 16 },
    { stat: 'ash', min: 5, max: 10 },
    { stat: 'xp', min: 5, max: 10 },
  ],
};

function rollMastery(slotStat) {
  const pool = MASTERY_POOL[slotStat === 'damage' ? 'damage' : 'hp'];
  const roll = pool[Math.floor(Math.random() * pool.length)];
  return { stat: roll.stat, value: Math.round(roll.min + Math.random() * (roll.max - roll.min)) };
}

const xpNeeded = (level) => Math.round(9 * level * level + 13 * level);

const rarityOf = (key) => RARITIES.find((rarity) => rarity.key === key);

const gearSlotOf = (key) => GEAR_SLOTS.find((slot) => slot.key === key);

// Basis würfeln — nur Stufen, deren ilvl-Schwelle erreicht ist; ganz ohne
// ilvl (Alter Spielstand, Werkstatt-Edge) fällt die Würfelwahl auf Tier 1 zurück.
const pickBase = (slot, ilvl = 1) => {
  const unlocked = slot.bases.filter((base) => (BASE_TIERS[base.tier - 1] ?? BASE_TIERS[0]).unlock <= ilvl);
  const list = unlocked.length ? unlocked : [slot.bases[0]];
  return list[Math.floor(Math.random() * list.length)];
};

// Basis eines Items nach Namen — fremde Namen (alte oder manipulierte
// Spielstände) fallen auf die neutrale Referenzbasis zurück.
const baseOf = (slot, name) => slot.bases.find((base) => base.name === name) ?? slot.bases[0];

function rollRarity() {
  const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll < 0) return rarity;
  }
  return RARITIES[0];
}

function rollItemValues(slot, rarity, ilvl, baseItem = slot.bases[0]) {
  // Affixe rollen in Bereichen statt fest — das „perfekte" Stück ist ein
  // Fund, kein Rechenresultat.
  const roll = (min, max) => min + Math.random() * (max - min);
  const rollInt = (min, max) => Math.floor(roll(min, max + 1));
  const tier = BASE_TIERS[baseItem.tier - 1] ?? BASE_TIERS[0];
  const base = slot.stat === 'damage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1;
  const amount = Math.max(1, Math.round(base * tier.mult * rarity.mult * roll(0.85, 1.15)));
  const values = { damage: 0, hp: 0, armor: 0, critChance: 0, critDmg: 0, damagePct: 0, hpPct: 0, armorPct: 0, lifeleech: 0, lifeleechFlat: 0 };
  if (slot.stat === 'damage') {
    values.damage = Math.max(1, Math.round(amount * (baseItem.damageMult ?? 1)));
  } else {
    values.hp = Math.max(1, Math.round(amount * (baseItem.hpMult ?? 1)));
    values.armor = Math.max(1, Math.round(amount * 0.4 * (baseItem.armorMult ?? 1) * roll(0.85, 1.15)));
  }
  if (baseItem.armorShare) values.armor += Math.max(1, Math.round(base * baseItem.armorShare * roll(0.85, 1.15)));
  // Affix-Plätze je Seltenheit, Pool je Slot-Typ, ohne Doppelte. Krit ist
  // hier nur noch ein Affix unter mehreren — die Prägung der Basis verschiebt
  // seinen Wurf.
  const pool = AFFIX_POOLS[slot.pool].filter((key) => AFFIX_RANGES[key][rarity.key]);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const key of pool.slice(0, AFFIX_COUNTS[rarity.key] ?? 0)) {
    const [min, max] = AFFIX_RANGES[key][rarity.key];
    if (key === 'crit') {
      values.critChance = Math.max(0, rollInt(min, max) + (baseItem.critDelta ?? 0));
    } else if (key === 'critDmg') {
      values.critDmg = rollInt(min, max);
    } else if (key === 'damagePct') {
      values.damagePct = rollInt(min, max);
    } else if (key === 'hpPct') {
      values.hpPct = rollInt(min, max);
    } else if (key === 'armorPct') {
      values.armorPct = rollInt(min, max);
    } else if (key === 'flatDamage') {
      values.damage += Math.max(1, Math.round((1 + ilvl * 0.4) * roll(min, max) * roll(0.85, 1.15)));
    } else if (key === 'armorFlat') {
      values.armor += Math.max(1, Math.round((4 + ilvl * 1.1) * roll(min, max) * roll(0.85, 1.15)));
    } else if (key === 'hpFlat') {
      values.hp += Math.max(1, Math.round((4 + ilvl * 1.1) * roll(min, max) * roll(0.85, 1.15)));
    }
  }
  const pctRange = LIFELEECH_PCT_BY_RARITY[rarity.key];
  const leechChance = Math.min(1, LIFELEECH_CHANCE_BY_RARITY[rarity.key] * (baseItem.leechChanceMult ?? 1));
  if (slot.key === 'waffe' && pctRange && Math.random() < leechChance) {
    if (Math.random() < LIFELEECH_PCT_ODDS) {
      values.lifeleech = rollInt(pctRange[0], pctRange[1]);
    } else {
      const flat = LIFELEECH_FLAT_BY_RARITY[rarity.key];
      values.lifeleechFlat = Math.max(1, Math.round((flat.base + ilvl * flat.ilvl) * roll(0.85, 1.15)));
    }
  }
  return values;
}

function normalizeItem(item) {
  if (!item) return item;
  item.damage ??= 0;
  item.hp ??= 0;
  item.armor ??= 0;
  item.critChance ??= 0;
  item.critDmg ??= 0;
  item.damagePct ??= 0;
  item.hpPct ??= 0;
  item.armorPct ??= 0;
  item.lifeleech ??= 0;
  item.lifeleechFlat ??= 0;
  item.enhance ??= 0;
  item.enhanceBonus ??= null;
  item.mastery ??= null;
  return item;
}

// Zahlen-Härtung: Nicht-Zahlen und Unendlichkeiten werden zu 0.
const asCount = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);

// Sanitizing für Spielstand-Items: Ungültige werden verworfen (null), defekte
// Felder repariert — ein korrupter Spielstand darf den Render-Loop nie crashen.
function sanitizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  const slot = gearSlotOf(item.slot);
  const rarity = rarityOf(item.rarity);
  if (!slot || !rarity) return null;
  // Items ohne Basis sind Altbestand — sie trugen den ersten Namen ihres
  // Slots. Fremde Basen fallen dorthin zurück, der Name bleibt unberührt.
  item.base = baseOf(slot, item.base).name;
  if (typeof item.name !== 'string' || !item.name) item.name = `${item.base} ${rarity.suffix}`;
  item.damage = asCount(item.damage);
  item.hp = asCount(item.hp);
  item.armor = asCount(item.armor);
  item.critChance = asCount(item.critChance);
  item.critDmg = asCount(item.critDmg);
  item.damagePct = asCount(item.damagePct);
  item.hpPct = asCount(item.hpPct);
  item.armorPct = asCount(item.armorPct);
  item.ilvl = asCount(item.ilvl) || itemIlvl(item);
  item.lifeleech = Math.min(LIFELEECH_PCT_BY_RARITY[rarity.key]?.[1] ?? 0, asCount(item.lifeleech));
  item.lifeleechFlat = asCount(item.lifeleechFlat);
  item.enhance = asCount(item.enhance);
  item.enhanceBonus = item.enhanceBonus && typeof item.enhanceBonus === 'object'
    ? { damage: asCount(item.enhanceBonus.damage), hp: asCount(item.enhanceBonus.hp), armor: asCount(item.enhanceBonus.armor) }
    : null;
  item.mastery = item.mastery && typeof item.mastery === 'object'
    && Object.hasOwn(SKILL_EFFECT_LABELS, item.mastery.stat) && typeof item.mastery.value === 'number'
    ? { stat: item.mastery.stat, value: asCount(item.mastery.value) }
    : null;
  normalizeItem(item);
  return item;
}

function itemStats(item) {
  const stats = { damage: item.damage, hp: item.hp, armor: item.armor, critChance: item.critChance, critDmg: item.critDmg, damagePct: item.damagePct, hpPct: item.hpPct, armorPct: item.armorPct, lifeleech: item.lifeleech, lifeleechFlat: item.lifeleechFlat };
  for (const [stat, value] of Object.entries(item.enhanceBonus ?? {})) stats[stat] += value;
  return stats;
}

function itemScore(item) {
  const s = itemStats(item);
  // Lifeleech ist ein Survivability-Bonus, kein Ersatz für Werten — „Bestes
  // anlegen" soll es modest berücksichtigen, nicht zum König krönen.
  const leechBonus = (s.lifeleech > 0 || s.lifeleechFlat > 0) ? s.damage * 0.25 : 0;
  // Prozent-Affixe fließen heuristisch ein — ihr wahres Gewicht hängt vom
  // aktuellen Helden ab, die Faktoren bilden die Größenordnung ab.
  return s.damage * 2 + s.hp * 0.5 + s.armor + s.critChance * 3
    + s.critDmg * 1.5 + s.damagePct * 0.8 + s.hpPct * 0.4 + s.armorPct * 0.4
    + leechBonus + (item.mastery ? item.mastery.value * 2 : 0);
}

// Itemlevel: Neue Stücke speichern es; Altbestand ohne Feld bekommt eine
// Schätzung aus dem Hauptwert (neutrale Prägung angenommen — für die Anzeige
// gut genug).
function itemIlvl(item) {
  if (typeof item.ilvl === 'number' && Number.isFinite(item.ilvl) && item.ilvl >= 1) return Math.round(item.ilvl);
  const slot = gearSlotOf(item.slot);
  const isDamage = slot?.stat === 'damage';
  const main = isDamage ? item.damage : item.hp;
  return Math.max(1, Math.round((main - (isDamage ? 1 : 4)) / (isDamage ? 0.4 : 1.1)));
}

// Roll-Spannen je Statfeld für die Alt-Anzeige: Was KONNTE dieses Feld bei
// Seltenheit + ilvl + Basis rollen? Gemergte Felder (Hauptwert + Flat-Affix)
// spannen von „nur Hauptwert" bis „Hauptwert + bester Flat" — welcher Affix
// tatsächlich saß, wird nicht am Item gespeichert.
function itemStatRanges(item) {
  const slot = gearSlotOf(item.slot);
  const rarity = rarityOf(item.rarity);
  if (!slot || !rarity) return null;
  const baseItem = baseOf(slot, item.base);
  const tier = BASE_TIERS[baseItem.tier - 1] ?? BASE_TIERS[0];
  const ilvl = itemIlvl(item);
  const mainBase = slot.stat === 'damage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1;
  const span = (value) => [Math.max(1, Math.round(value * 0.85)), Math.round(value * 1.15)];
  // Flats rollen am Grundwert ihres Stats — Flatschaden an der Schadens-,
  // Rüstung/LP-Flats an der Rüstungsbasis (4 + ilvl × 1.1).
  const flatBase = (key) => (key === 'flatDamage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1);
  const flatMax = (key) => {
    const range = AFFIX_RANGES[key]?.[rarity.key];
    return range ? Math.round(flatBase(key) * range[1] * 1.15) : 0;
  };
  const ranges = {};
  if (slot.stat === 'damage') {
    ranges.damage = span(mainBase * tier.mult * rarity.mult * (baseItem.damageMult ?? 1));
    ranges.damage[1] += flatMax('flatDamage');
    if (item.armor > 0) {
      const flatRange = AFFIX_RANGES.armorFlat[rarity.key];
      const flatMin = flatRange ? Math.max(1, Math.round((4 + ilvl * 1.1) * flatRange[0] * 0.85)) : 0;
      if (baseItem.armorShare) {
        const share = span(mainBase * baseItem.armorShare);
        ranges.armor = [share[0], share[1] + flatMax('armorFlat')];
      } else if (flatMin) {
        ranges.armor = [flatMin, flatMax('armorFlat')];
      }
    }
  } else {
    ranges.hp = span(mainBase * tier.mult * rarity.mult * (baseItem.hpMult ?? 1));
    ranges.hp[1] += flatMax('hpFlat');
    // Rüstung würfelt doppelt (amount-Roll × Rüstungs-Roll) — die Spanne
    // spiegelt die Arithmetik des Wurfs inklusive Zwischenrundung.
    const amountMin = Math.max(1, Math.round(mainBase * tier.mult * rarity.mult * 0.85));
    const amountMax = Math.round(mainBase * tier.mult * rarity.mult * 1.15);
    ranges.armor = [
      Math.max(1, Math.round(amountMin * 0.4 * (baseItem.armorMult ?? 1) * 0.85)),
      Math.round(amountMax * 0.4 * (baseItem.armorMult ?? 1) * 1.15),
    ];
    ranges.armor[1] += flatMax('armorFlat');
  }
  const crit = AFFIX_RANGES.crit[rarity.key];
  if (item.critChance > 0 && crit) {
    const delta = baseItem.critDelta ?? 0;
    ranges.critChance = [Math.max(0, crit[0] + delta), crit[1] + delta];
  }
  for (const key of ['critDmg', 'damagePct', 'hpPct', 'armorPct']) {
    if (item[key] > 0 && AFFIX_RANGES[key][rarity.key]) ranges[key] = [...AFFIX_RANGES[key][rarity.key]];
  }
  if (item.lifeleech > 0 && LIFELEECH_PCT_BY_RARITY[rarity.key]) ranges.lifeleech = [...LIFELEECH_PCT_BY_RARITY[rarity.key]];
  if (item.lifeleechFlat > 0 && LIFELEECH_FLAT_BY_RARITY[rarity.key]) {
    const flat = LIFELEECH_FLAT_BY_RARITY[rarity.key];
    const value = flat.base + ilvl * flat.ilvl;
    ranges.lifeleechFlat = [Math.max(1, Math.round(value * 0.85)), Math.round(value * 1.15)];
  }
  return ranges;
}

// Alt-gedrückt: Item-Texte zeigen die Roll-Spannen statt nur dem Wurf.
let rollRangesVisible = false;

const setRollRanges = (on) => { rollRangesVisible = !!on; };

function itemStatsText(item) {
  const s = itemStats(item);
  const ranges = rollRangesVisible ? itemStatRanges(item) : null;
  const tag = (field) => {
    const range = ranges?.[field];
    return range ? ` [${range[0]} – ${range[1]}]` : '';
  };
  return (
    [
      s.damage ? `+${formatNum(s.damage)} Schaden${tag('damage')}` : null,
      s.damagePct ? `+${s.damagePct} % Schaden${tag('damagePct')}` : null,
      s.hp ? `+${formatNum(s.hp)} Lebenskraft${tag('hp')}` : null,
      s.hpPct ? `+${s.hpPct} % Lebenskraft${tag('hpPct')}` : null,
      s.armor ? `+${formatNum(s.armor)} Rüstung${tag('armor')}` : null,
      s.armorPct ? `+${s.armorPct} % Rüstung${tag('armorPct')}` : null,
      s.critChance ? `+${s.critChance} % Kritchance${tag('critChance')}` : null,
      s.critDmg ? `+${s.critDmg} % Kritschaden${tag('critDmg')}` : null,
      s.lifeleech ? `+${s.lifeleech} % Lifeleech${tag('lifeleech')}` : null,
      s.lifeleechFlat ? `+${formatNum(s.lifeleechFlat)} Lifeleech pro Treffer${tag('lifeleechFlat')}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Keine Werte'
  );
}

export {

  TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, ENEMY_RESPAWN_S, BOSS_AFTER_KILLS,

  ELITE_EVERY_KILLS, OFFLINE_CAP_MS, OFFLINE_MIN_GAP_MS, INVENTORY_CAP, ZONE_ENEMIES, ZONES,

  GEAR_SLOTS, RARITIES, DROP_CHANCES, BASE_CRIT_CHANCE, CRIT_MULTIPLIER, BASE_ATTACK_SPEED,

  ARMOR_RESISTANCE, SKILL_SPOKE_ANGLES, SKILL_SMALL_OFFSET, SKILL_WHEEL_RADII, SKILL_ROOT_RADIUS,

  SKILL_KEYSTONE_RADIUS, SKILL_NODE_RADIUS, SKILL_BRANCHES, SKILL_BRIDGES, SKILL_BRIDGE_TIERS,

  SKILL_NODES, SKILL_EDGES, SKILL_NODES_BY_ID, skillSigned, SKILL_EFFECT_LABELS, MASTERY_POOL,

  rollMastery, xpNeeded, rarityOf, gearSlotOf, pickBase, baseOf, zoneDef, enemyDef, rollRarity, rollItemValues,

  itemStats, itemScore, itemStatsText, itemIlvl, itemStatRanges, rollRangesVisible, setRollRanges, normalizeItem, sanitizeItem, asCount,

  DEATH_ASH_PENALTY, ENRAGE_THRESHOLD, ENRAGE_INTERVAL_MULT, HUB_REGEN_PER_SECOND,

  AFFIX_COUNTS, AFFIX_RANGES, AFFIX_POOLS, BASE_TIERS, LIFELEECH_CHANCE_BY_RARITY, LIFELEECH_PCT_BY_RARITY, LIFELEECH_FLAT_BY_RARITY,

  ENEMY_MISS_CHANCE, HERO_MISS_CHANCE, DAMAGE_VARIANCE, CRIT_CHANCE_CAP, SKILL_TREE_UNLOCK_LEVEL, STAT_POINTS_PER_LEVEL,

  ENEMY_TYPE_LEVEL_OFFSETS, enemyLevelOf,

  ENEMY_XP_CUTOFF_LEVELS, enemyXpMultiplier, SKILL_VALUE_SCALE,

  ENEMY_PROFILES, PROFILE_CYCLE, profileOf, continentKeyOf,

  CONTINENTS, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, MAX_ZONE, formatNum,

};
