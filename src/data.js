import waffeIcon from './assets/icons/waffe.svg';
import brustIcon from './assets/icons/brust.svg';
import helmIcon from './assets/icons/helm.svg';
import hoseIcon from './assets/icons/hose.svg';
import schuheIcon from './assets/icons/schuhe.svg';
import handIcon from './assets/icons/hand.svg';

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
      { name: 'Aschenkrypta', ilvl: 1 },
      { name: 'Knochengewölbe', ilvl: 6 },
      { name: 'Aschekatakomben', ilvl: 14 },
      { name: 'Grabestiefe', ilvl: 26 },
      { name: 'Thronhalle der Asche', ilvl: 42 },
      { name: 'Glutgruft', ilvl: 62 },
      { name: 'Knochenlabyrinth', ilvl: 86 },
      { name: 'Aschenabgrund', ilvl: 114 },
      { name: 'Knochenkathedrale', ilvl: 146 },
      { name: 'Herz der Asche', ilvl: 182 },
    ],
  },
  {
    key: 'frostreich',
    name: 'Das Frostreich',
    zones: [
      { name: 'Frostkrypta', ilvl: 222 },
      { name: 'Reifgewölbe', ilvl: 266 },
      { name: 'Eiskatakomben', ilvl: 314 },
      { name: 'Schneetiefe', ilvl: 366 },
      { name: 'Halle des Frosts', ilvl: 422 },
      { name: 'Frostgruft', ilvl: 482 },
      { name: 'Eisverlies', ilvl: 546 },
      { name: 'Winterabgrund', ilvl: 614 },
      { name: 'Eiskathedrale', ilvl: 686 },
      { name: 'Herz des Winters', ilvl: 762 },
    ],
  },
  {
    key: 'faulmoor',
    name: 'Das Faulmoor',
    zones: [
      { name: 'Moorkrypta', ilvl: 842 },
      { name: 'Faulgewölbe', ilvl: 926 },
      { name: 'Sumpfkatakomben', ilvl: 1014 },
      { name: 'Modertiefe', ilvl: 1106 },
      { name: 'Halle der Fäulnis', ilvl: 1202 },
      { name: 'Pestgruft', ilvl: 1302 },
      { name: 'Schlinglabyrinth', ilvl: 1406 },
      { name: 'Moorabgrund', ilvl: 1514 },
      { name: 'Moorkathedrale', ilvl: 1626 },
      { name: 'Herz des Moores', ilvl: 1742 },
    ],
  },
  {
    key: 'blutmark',
    name: 'Das Blutmark',
    zones: [
      { name: 'Blutkrypta', ilvl: 1862 },
      { name: 'Rostgewölbe', ilvl: 1986 },
      { name: 'Eisenkatakomben', ilvl: 2114 },
      { name: 'Kriegstiefe', ilvl: 2246 },
      { name: 'Halle des Blutes', ilvl: 2382 },
      { name: 'Rostgruft', ilvl: 2522 },
      { name: 'Klingenlabyrinth', ilvl: 2666 },
      { name: 'Blutabgrund', ilvl: 2814 },
      { name: 'Eisenkathedrale', ilvl: 2966 },
      { name: 'Herz des Blutes', ilvl: 3122 },
    ],
  },
  {
    key: 'sternenleere',
    name: 'Die Sternenleere',
    zones: [
      { name: 'Leerenkrypta', ilvl: 3282 },
      { name: 'Nachtgewölbe', ilvl: 3446 },
      { name: 'Sternenkatakomben', ilvl: 3614 },
      { name: 'Leerentiefe', ilvl: 3786 },
      { name: 'Halle der Leere', ilvl: 3962 },
      { name: 'Finsternisgruft', ilvl: 4142 },
      { name: 'Sternenlabyrinth', ilvl: 4326 },
      { name: 'Leerenabgrund', ilvl: 4514 },
      { name: 'Sternenkathedrale', ilvl: 4706 },
      { name: 'Herz der Leere', ilvl: 4902 },
    ],
  },
];

const ZONES = CONTINENTS.flatMap((continent) => continent.zones.map((zone) => ({ ...zone, continent: continent.name })));

const ZONE_ENEMIES = [
  {
    normal: { name: 'Ascheratte', hp: 10, damage: 1, ash: 4, xp: 30 },
    elite: { name: 'Knochenfresser', hp: 25, damage: 2, ash: 14, xp: 90 },
    boss: { name: 'Grabwächter', hp: 50, damage: 2, ash: 48, xp: 300, boss: true },
  },
  {
    normal: { name: 'Knochenkriecher', hp: 40, damage: 2, ash: 15, xp: 110 },
    elite: { name: 'Beinhausritter', hp: 100, damage: 3, ash: 52, xp: 330 },
    boss: { name: 'Gebeinwächter', hp: 200, damage: 3, ash: 180, xp: 1100, boss: true },
  },
  {
    normal: { name: 'Aschenwicht', hp: 150, damage: 6, ash: 53, xp: 400 },
    elite: { name: 'Glutgeist', hp: 375, damage: 8, ash: 186, xp: 1200 },
    boss: { name: 'Aschenmutter', hp: 750, damage: 10, ash: 636, xp: 4000, boss: true },
  },
  {
    normal: { name: 'Grabwurm', hp: 550, damage: 16, ash: 200, xp: 1500 },
    elite: { name: 'Aaskrone', hp: 1375, damage: 21, ash: 700, xp: 4500 },
    boss: { name: 'Der Bestattete', hp: 2750, damage: 26, ash: 2400, xp: 15000, boss: true },
  },
  {
    normal: { name: 'Hofschatten', hp: 2000, damage: 42, ash: 750, xp: 5600 },
    elite: { name: 'Kronenritter', hp: 5000, damage: 55, ash: 2625, xp: 16800 },
    boss: { name: 'Der Thronende', hp: 10000, damage: 67, ash: 9000, xp: 56000, boss: true },
  },
  {
    normal: { name: 'Glutschleicher', hp: 7400, damage: 113, ash: 2800, xp: 21000 },
    elite: { name: 'Aschenbrut', hp: 18500, damage: 148, ash: 9800, xp: 63000 },
    boss: { name: 'Glutfürst', hp: 37000, damage: 181, ash: 33600, xp: 210000, boss: true },
  },
  {
    normal: { name: 'Knochenläufer', hp: 27400, damage: 305, ash: 10500, xp: 78000 },
    elite: { name: 'Knochenweber', hp: 68500, damage: 400, ash: 36750, xp: 234000 },
    boss: { name: 'Knochenkoloss', hp: 137000, damage: 488, ash: 126000, xp: 780000, boss: true },
  },
  {
    normal: { name: 'Aschenwanderer', hp: 101000, damage: 825, ash: 39200, xp: 291000 },
    elite: { name: 'Staubschreiter', hp: 252500, damage: 1080, ash: 137200, xp: 873000 },
    boss: { name: 'Der Verschluckte', hp: 505000, damage: 1320, ash: 470400, xp: 2910000, boss: true },
  },
  {
    normal: { name: 'Knochenchor', hp: 375000, damage: 2230, ash: 147000, xp: 1085000 },
    elite: { name: 'Grabesorganist', hp: 937500, damage: 2920, ash: 514500, xp: 3255000 },
    boss: { name: 'Der Knochenkönig', hp: 1875000, damage: 3570, ash: 1764000, xp: 10850000, boss: true },
  },
  {
    normal: { name: 'Ascheavatar', hp: 1390000, damage: 6020, ash: 546000, xp: 4040000 },
    elite: { name: 'Ewige Glut', hp: 3475000, damage: 7890, ash: 1911000, xp: 12120000 },
    boss: { name: 'Der Aschegott', hp: 6950000, damage: 9630, ash: 6552000, xp: 40400000, boss: true },
  },
];

// Hand abgestimmt sind nur die Bestien der Aschenlande; jeder weitere Kontinent
// führt deren Progression mit denselben Verhältnissen fort
// (Elite: HP ×2,5 · Boss: HP ×5 · Elite-Asche ×3,5 · Boss-Asche ×12 · Elite-EP ×3 · Boss-EP ×10).
const CONTINENT_ENEMIES = {
  frostreich: [
    ['Frostschleicher', 'Eisbrut', 'Der Frostherzog'],
    ['Schneekriecher', 'Reifritter', 'Der Reifwächter'],
    ['Frostwicht', 'Kaltgeist', 'Die Eisjungfrau'],
    ['Schneewühler', 'Frostkranich', 'Der Eingefrorene'],
    ['Winterherold', 'Eisritter', 'Der Winterkönig'],
    ['Frostläufer', 'Gletscherbrut', 'Der Eisbann'],
    ['Kettenfrost', 'Frostkerkerer', 'Sturmfessel'],
    ['Schneesturmschreiter', 'Nordgeist', 'Das Winterherz'],
    ['Chor des Frosts', 'Frostorganist', 'Der Eispriester'],
    ['Winteravatar', 'Ewiger Frost', 'Der Frostgott'],
  ],
  faulmoor: [
    ['Moorkriecher', 'Schleimbrut', 'Der Moorgraf'],
    ['Moderschleicher', 'Pestritter', 'Die Moormutter'],
    ['Sumpfwicht', 'Fäulnisgeist', 'Der Schleimfürst'],
    ['Madenwühler', 'Aasfliege', 'Der Verweste'],
    ['Hofsmoder', 'Pestherold', 'Der Moorkönig'],
    ['Pestträger', 'Seuchenbrut', 'Der Pestfürst'],
    ['Dornenschlinger', 'Rankenwürger', 'Die Schlingmutter'],
    ['Sumpfschatten', 'Tiefenschleim', 'Der Verschlundene'],
    ['Chor der Moder', 'Pestorganist', 'Der Faulpriester'],
    ['Mooravatar', 'Ewige Fäulnis', 'Der Moorgott'],
  ],
  blutmark: [
    ['Blutschleicher', 'Blutbrut', 'Der Blutgraf'],
    ['Rostkriecher', 'Eisenritter', 'Die Rostkönigin'],
    ['Eisenwicht', 'Klingengeist', 'Der Eisenfürst'],
    ['Söldnerleiche', 'Blutgeier', 'Der Schlachtherr'],
    ['Hofsmörder', 'Blutritter', 'Der Blutkönig'],
    ['Blutwurm', 'Rabenschwarm', 'Der Schlächter'],
    ['Klingentänzer', 'Stahlweber', 'Der Stahlkoloss'],
    ['Blutschatten', 'Rostschreiter', 'Der Blutherr'],
    ['Chor der Klinge', 'Rostorganist', 'Der Blutpriester'],
    ['Blutavatar', 'Ewige Wut', 'Der Blutgott'],
  ],
  sternenleere: [
    ['Nachtschleicher', 'Leerenbrut', 'Der Nachtfürst'],
    ['Leerenkriecher', 'Nachtritter', 'Der Sternenwächter'],
    ['Sternenwicht', 'Kometengeist', 'Die Sternenmutter'],
    ['Nachtwühler', 'Sternenasche', 'Der Gestürzte Stern'],
    ['Nachtherold', 'Sternenritter', 'Der Sternenkönig'],
    ['Finsterniswurm', 'Schwarzfunke', 'Der Finsterfürst'],
    ['Sternenläufer', 'Mondweber', 'Der Sternenkoloss'],
    ['Nachtschatten', 'Leerenschreiter', 'Der Verschlinger'],
    ['Chor der Sterne', 'Nachtorganist', 'Der Sternenpriester'],
    ['Leerenavatar', 'Ewige Nacht', 'Die Aschenkrone'],
  ],
};

const ENEMY_GROWTH = { hp: 3.7, damage: 2.7, ash: 3.73, xp: 3.73 };

const sig3 = (value) => Number(value.toPrecision(3));

const followUpEnemies = ([normalName, eliteName, bossName], prevNormal) => {
  const normal = {
    name: normalName,
    hp: sig3(prevNormal.hp * ENEMY_GROWTH.hp),
    damage: Math.max(1, Math.round(prevNormal.damage * ENEMY_GROWTH.damage)),
    ash: sig3(prevNormal.ash * ENEMY_GROWTH.ash),
    xp: sig3(prevNormal.xp * ENEMY_GROWTH.xp),
  };
  return {
    normal,
    elite: {
      name: eliteName,
      hp: normal.hp * 2.5,
      damage: Math.max(1, Math.round(normal.damage * 1.31)),
      ash: Math.round(normal.ash * 3.5),
      xp: normal.xp * 3,
    },
    boss: {
      name: bossName,
      hp: normal.hp * 5,
      damage: Math.max(1, Math.round(normal.damage * 1.6)),
      ash: normal.ash * 12,
      xp: normal.xp * 10,
      boss: true,
    },
  };
};

for (const continent of CONTINENTS.slice(1)) {
  let prevNormal = ZONE_ENEMIES[ZONE_ENEMIES.length - 1].normal;
  for (const names of CONTINENT_ENEMIES[continent.key]) {
    const entry = followUpEnemies(names, prevNormal);
    ZONE_ENEMIES.push(entry);
    prevNormal = entry.normal;
  }
}

const GEAR_SLOTS = [
  { key: 'waffe', label: 'Waffe', base: 'Klinge', abbrev: 'KL', stat: 'damage', icon: waffeIcon },
  { key: 'brust', label: 'Brust', base: 'Brustplatte', abbrev: 'BP', stat: 'hp', icon: brustIcon },
  { key: 'helm', label: 'Helm', base: 'Helm', abbrev: 'HE', stat: 'hp', icon: helmIcon },
  { key: 'hose', label: 'Hose', base: 'Beinlinge', abbrev: 'BE', stat: 'hp', icon: hoseIcon },
  { key: 'schuhe', label: 'Schuhe', base: 'Stiefel', abbrev: 'ST', stat: 'hp', icon: schuheIcon },
  { key: 'hand-links', label: 'Handschuh Links', base: 'Handschuh', abbrev: 'HL', stat: 'damage', icon: handIcon },
  { key: 'hand-rechts', label: 'Handschuh Rechts', base: 'Handschuh', abbrev: 'HR', stat: 'damage', icon: handIcon },
];

const RARITIES = [
  { key: 'gewoehnlich', label: 'Gewöhnlich', suffix: 'der Asche', color: '#8a7f6d', weight: 70, mult: 1 },
  { key: 'selten', label: 'Selten', suffix: 'der Gebeine', color: '#6d8a7a', weight: 25, mult: 2 },
  { key: 'episch', label: 'Episch', suffix: 'der Krone', color: '#9d6d8a', weight: 5, mult: 4 },
];
for (const slot of GEAR_SLOTS) {
  slot.icon = slot.icon.replace(/'/g, '%27');
}

const DROP_CHANCES = { normal: 0.02, elite: 0.15, boss: 1 };

const BASE_CRIT_CHANCE = 5;

const CRIT_MULTIPLIER = 2;

const BASE_ATTACK_SPEED = 1;

const ARMOR_RESISTANCE = 12;

const SKILL_SPOKE_ANGLES = [-30, 0, 30];

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

const skillEffectsOf = (map) => Object.entries(map).map(([stat, value]) => ({ stat, value }));

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

const xpNeeded = (level) => Math.round(4 * level * level + 6 * level);

const upgradeCost = (base, ups) => Math.round(base * 1.6 ** ups);

const rarityOf = (key) => RARITIES.find((rarity) => rarity.key === key);

const gearSlotOf = (key) => GEAR_SLOTS.find((slot) => slot.key === key);

const zoneOf = (index) => ZONES[Math.max(0, Math.min(index, ZONES.length - 1))];

function rollRarity() {
  const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll < 0) return rarity;
  }
  return RARITIES[0];
}

function rollItemValues(slot, rarity, ilvl) {
  const base = slot.stat === 'damage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1;
  const amount = Math.max(1, Math.round(base * rarity.mult));
  const values = { damage: 0, hp: 0, armor: 0, critChance: 0 };
  if (slot.stat === 'damage') {
    values.damage = amount;
    if (rarity.key === 'selten') values.critChance = 5;
    if (rarity.key === 'episch') values.critChance = 10;
  } else {
    values.hp = amount;
    values.armor = Math.max(1, Math.round(amount * 0.4));
  }
  return values;
}

function normalizeItem(item) {
  if (!item) return item;
  item.damage ??= 0;
  item.hp ??= 0;
  item.armor ??= 0;
  item.critChance ??= 0;
  item.enhance ??= 0;
  item.enhanceBonus ??= null;
  item.mastery ??= null;
  return item;
}

function itemStats(item) {
  const stats = { damage: item.damage, hp: item.hp, armor: item.armor, critChance: item.critChance };
  for (const [stat, value] of Object.entries(item.enhanceBonus ?? {})) stats[stat] += value;
  return stats;
}

function itemScore(item) {
  const s = itemStats(item);
  return s.damage * 2 + s.hp * 0.5 + s.armor + s.critChance * 3 + (item.mastery ? item.mastery.value * 2 : 0);
}

function itemStatsText(item) {
  const s = itemStats(item);
  return (
    [
      s.damage ? `+${formatNum(s.damage)} Schaden` : null,
      s.hp ? `+${formatNum(s.hp)} Lebenskraft` : null,
      s.armor ? `+${formatNum(s.armor)} Rüstung` : null,
      s.critChance ? `+${s.critChance} % Kritchance` : null,
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

  rollMastery, xpNeeded, upgradeCost, rarityOf, gearSlotOf, zoneOf, rollRarity, rollItemValues,

  itemStats, itemScore, itemStatsText, normalizeItem,

  CONTINENTS, formatNum,

};
