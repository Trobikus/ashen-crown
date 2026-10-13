const SAVE_KEY = 'ashen-crown-save';
const SETTINGS_KEY = 'ashen-crown-settings';
const TICK_MS = 100;
const ATTACK_INTERVAL_MS = 1500;
const STATS_SYNC_INTERVAL_MS = 3000;
const ENEMY_RESPAWN_S = 0.6;
const BOSS_AFTER_KILLS = 30;
const ELITE_EVERY_KILLS = 10;
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
const OFFLINE_MIN_GAP_MS = 30 * 1000;
const INVENTORY_CAP = 40;

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
];

const ZONES = [
  { name: 'Aschenkrypta', ilvl: 1 },
  { name: 'Knochengewölbe', ilvl: 6 },
  { name: 'Aschekatakomben', ilvl: 14 },
  { name: 'Grabestiefe', ilvl: 26 },
  { name: 'Thronhalle der Asche', ilvl: 42 },
];

const GEAR_SLOTS = [
  { key: 'waffe', label: 'Waffe', base: 'Klinge', abbrev: 'KL', stat: 'damage' },
  { key: 'brust', label: 'Brust', base: 'Brustplatte', abbrev: 'BP', stat: 'hp' },
  { key: 'helm', label: 'Helm', base: 'Helm', abbrev: 'HE', stat: 'hp' },
  { key: 'hose', label: 'Hose', base: 'Beinlinge', abbrev: 'BE', stat: 'hp' },
  { key: 'schuhe', label: 'Schuhe', base: 'Stiefel', abbrev: 'ST', stat: 'hp' },
  { key: 'hand-links', label: 'Handschuh Links', base: 'Handschuh', abbrev: 'HL', stat: 'damage' },
  { key: 'hand-rechts', label: 'Handschuh Rechts', base: 'Handschuh', abbrev: 'HR', stat: 'damage' },
];

const RARITIES = [
  { key: 'gewoehnlich', label: 'Gewöhnlich', suffix: 'der Asche', color: '#8a7f6d', weight: 70, mult: 1 },
  { key: 'selten', label: 'Selten', suffix: 'der Gebeine', color: '#6d8a7a', weight: 25, mult: 2 },
  { key: 'episch', label: 'Episch', suffix: 'der Krone', color: '#9d6d8a', weight: 5, mult: 4 },
];

const DROP_CHANCES = { normal: 0.05, elite: 0.3, boss: 1 };
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

const DEFAULT_SETTINGS = {
  damageNumbers: true,
  hitFlash: true,
  skillPulse: true,
  offlineProgress: true,
  offlineSummary: true,
};
const settings = { ...DEFAULT_SETTINGS };

const state = {
  ash: 0,
  xp: 0,
  level: 1,
  maxHp: 30,
  damage: 2,
  damageUps: 0,
  hpUps: 0,
  kills: 0,
  zone: 0,
  cleared: 0,
  zoneKills: 0,
  lastSeen: 0,
  itemSeq: 0,
  inventory: [],
  equipment: Object.fromEntries(GEAR_SLOTS.map((slot) => [slot.key, null])),
  statPoints: 0,
  armorBase: 0,
  critBonus: 0,
  skillPoints: 0,
  skills: ['start'],
};

let heroHp = state.maxHp;
let enemy = null;
let paused = true;
let tickTimer = null;
let heroAttackProgress = 0;
let enemyAttackProgress = 0;
let sceneTimer = null;
let overlayDismissible = false;
let hasSave = false;
let visited = false;
let offlineSummary = null;
let gearDirty = true;
let sellMode = false;
let skillTreeBuilt = false;
let statSpendAmount = 1;
let optionsReturnScreen = null;
let resetArmed = false;
let resetTimer = null;
const selectedForSale = new Set();

const el = {};

function cacheDom() {
  el.menu = document.getElementById('menu');
  el.hub = document.getElementById('hub');
  el.game = document.getElementById('game');
  el.hubLevel = document.getElementById('hub-level');
  el.hubAsh = document.getElementById('hub-ash');
  el.hudLevel = document.getElementById('hud-level');
  el.hudAsh = document.getElementById('hud-ash');
  el.hudZone = document.getElementById('hud-zone');
  el.tileMapSub = document.getElementById('tile-map-sub');
  el.zoneList = document.getElementById('zone-list');
  el.heroFigure = document.getElementById('hero-figure');
  el.heroHp = document.getElementById('hero-hp');
  el.heroFighter = document.getElementById('hero-fighter');
  el.enemyFigure = document.getElementById('enemy-figure');
  el.enemyName = document.getElementById('enemy-name');
  el.enemyHp = document.getElementById('enemy-hp');
  el.enemyFighter = document.getElementById('enemy-fighter');
  el.upDamage = document.getElementById('up-damage');
  el.costDamage = document.getElementById('cost-damage');
  el.upHp = document.getElementById('up-hp');
  el.costHp = document.getElementById('cost-hp');
  el.doorButton = document.getElementById('btn-door');
  el.shrineButton = document.getElementById('btn-shrine');
  el.btnDescend = document.getElementById('btn-descend');
  el.hubMenu = document.getElementById('hub-menu');
  el.hubOptions = document.getElementById('hub-options');
  el.sceneHero = document.getElementById('scene-hero');
  el.sceneSkills = document.getElementById('scene-skills');
  el.sceneOptions = document.getElementById('scene-options');
  el.sceneMap = document.getElementById('scene-map');
  el.sceneCrafting = document.getElementById('scene-crafting');
  el.craftSlots = document.getElementById('craft-slots');
  el.craftDetail = document.getElementById('craft-detail');
  el.craftAsh = document.getElementById('craft-ash');
  el.optionsTabs = document.getElementById('options-tabs');
  el.optionsPanel = document.getElementById('options-panel');
  el.resetButton = document.getElementById('btn-reset-save');
  el.tileHero = document.getElementById('tile-hero');
  el.tileSkills = document.getElementById('tile-skills');
  el.tileMap = document.getElementById('tile-map');
  el.tileCrafting = document.getElementById('tile-crafting');
  el.gearSlots = Array.from(document.querySelectorAll('.gear-slot'));
  el.inventoryGrid = document.getElementById('inventory-grid');
  el.inventoryCount = document.getElementById('inventory-count');
  el.sellButton = document.getElementById('btn-sell');
  el.sellAllButton = document.getElementById('btn-sell-all');
  el.sortInventoryButton = document.getElementById('btn-sort-inventory');
  el.equipBestButton = document.getElementById('btn-equip-best');
  el.statPointsRow = document.getElementById('stat-points-row');
  el.statPointsValue = document.getElementById('hero-stat-points');
  el.statPlusButtons = Array.from(document.querySelectorAll('.stat-plus'));
  el.spendButtons = Array.from(document.querySelectorAll('.spend-amount button'));
  el.skillTree = document.getElementById('skill-tree');
  el.skillTreeWrap = document.getElementById('skill-tree-wrap');
  el.skillTooltip = document.getElementById('skill-tooltip');
  el.skillPointsHud = document.getElementById('skill-points-hud');
  el.tileSkillsSub = document.getElementById('tile-skills-sub');
  el.modalHeroLevel = document.getElementById('hero-modal-level');
  el.modalHeroXp = document.getElementById('hero-modal-xp');
  el.modalHeroHp = document.getElementById('hero-modal-hp');
  el.modalHeroDamage = document.getElementById('hero-modal-damage');
  el.modalHeroArmor = document.getElementById('hero-modal-armor');
  el.modalHeroCrit = document.getElementById('hero-modal-crit');
  el.modalHeroCritDmg = document.getElementById('hero-modal-critdmg');
  el.modalHeroSpeed = document.getElementById('hero-modal-speed');
  el.modalHeroKills = document.getElementById('hero-modal-kills');
  el.overlay = document.getElementById('overlay');
}

const xpNeeded = (level) => Math.round(4 * level * level + 6 * level);
const upgradeCost = (base, ups) => Math.round(base * 1.6 ** ups);
const rarityOf = (key) => RARITIES.find((rarity) => rarity.key === key);
const gearSlotOf = (key) => GEAR_SLOTS.find((slot) => slot.key === key);
const zoneOf = (index) => ZONES[Math.max(0, Math.min(index, ZONES.length - 1))];

function scaledEnemy(type) {
  const zone = Math.max(0, Math.min(state.zone, ZONE_ENEMIES.length - 1));
  return { ...ZONE_ENEMIES[zone][type] };
}

function skillBonus(stat) {
  let total = 0;
  for (const id of state.skills) {
    const node = SKILL_NODES_BY_ID[id];
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.stat === stat) total += effect.value;
    }
  }
  return total;
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

function masteryBonus(stat) {
  let total = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item?.mastery?.stat === stat) total += item.mastery.value;
  }
  return total;
}

function statBonus(stat) {
  return skillBonus(stat) + masteryBonus(stat);
}

function heroDamage() {
  let damage = state.damage;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) damage += itemStats(item).damage;
  }
  return Math.round((damage + statBonus('damage')) * (1 + statBonus('damagePct') / 100));
}

function heroMaxHp() {
  let maxHp = state.maxHp;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) maxHp += itemStats(item).hp;
  }
  return Math.round((maxHp + statBonus('hp')) * (1 + statBonus('hpPct') / 100));
}

function heroArmor() {
  let armor = state.armorBase;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) armor += itemStats(item).armor;
  }
  return Math.round((armor + statBonus('armor')) * (1 + statBonus('armorPct') / 100));
}

function heroCritChance() {
  let crit = BASE_CRIT_CHANCE + state.critBonus;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) crit += itemStats(item).critChance;
  }
  return crit + statBonus('crit');
}

function heroAttackSpeed() {
  return BASE_ATTACK_SPEED + statBonus('speed') / 100;
}

function critMultiplier() {
  return CRIT_MULTIPLIER + statBonus('critDmg') / 100;
}

function rollRarity() {
  const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll < 0) return rarity;
  }
  return RARITIES[0];
}

function generateItem() {
  const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
  const rarity = rollRarity();
  return {
    id: ++state.itemSeq,
    slot: slot.key,
    name: `${slot.base} ${rarity.suffix}`,
    rarity: rarity.key,
    enhance: 0,
    mastery: null,
    ...rollItemValues(slot, rarity, ZONES[state.zone].ilvl),
  };
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

const craftIlvl = () => ZONES[Math.min(state.cleared, ZONES.length - 1)].ilvl;

function itemStats(item) {
  const stats = { damage: item.damage, hp: item.hp, armor: item.armor, critChance: item.critChance };
  for (const [stat, value] of Object.entries(item.enhanceBonus ?? {})) stats[stat] += value;
  return stats;
}

function rollDrop(enemyType) {
  if (Math.random() >= (DROP_CHANCES[enemyType] ?? 0)) return;
  if (state.inventory.length >= INVENTORY_CAP) return;
  state.inventory.push(generateItem());
  gearDirty = true;
}

function equipItem(id) {
  const index = state.inventory.findIndex((item) => item.id === id);
  if (index === -1) return;
  const item = state.inventory[index];
  const previous = state.equipment[item.slot];
  state.inventory.splice(index, 1);
  if (previous) state.inventory.push(previous);
  state.equipment[item.slot] = item;
  gearDirty = true;
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function unequipItem(slotKey) {
  const item = state.equipment[slotKey];
  if (!item || state.inventory.length >= INVENTORY_CAP) return;
  state.equipment[slotKey] = null;
  state.inventory.push(item);
  gearDirty = true;
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function itemScore(item) {
  const s = itemStats(item);
  return s.damage * 2 + s.hp * 0.5 + s.armor + s.critChance * 3 + (item.mastery ? item.mastery.value * 2 : 0);
}

function sortInventory() {
  state.inventory.sort((a, b) => {
    const rarityA = RARITIES.findIndex((rarity) => rarity.key === a.rarity);
    const rarityB = RARITIES.findIndex((rarity) => rarity.key === b.rarity);
    if (rarityB !== rarityA) return rarityB - rarityA;
    const slotA = GEAR_SLOTS.findIndex((slot) => slot.key === a.slot);
    const slotB = GEAR_SLOTS.findIndex((slot) => slot.key === b.slot);
    if (slotA !== slotB) return slotA - slotB;
    return itemScore(b) - itemScore(a);
  });
  gearDirty = true;
  save();
  render();
}

function equipBest() {
  let changed = false;
  for (const slot of GEAR_SLOTS) {
    const candidates = state.inventory.filter((item) => item.slot === slot.key);
    if (!candidates.length) continue;
    const best = candidates.reduce((a, b) => (itemScore(b) > itemScore(a) ? b : a));
    const equipped = state.equipment[slot.key];
    if (equipped && itemScore(equipped) >= itemScore(best)) continue;
    state.inventory.splice(state.inventory.indexOf(best), 1);
    if (equipped) state.inventory.push(equipped);
    state.equipment[slot.key] = best;
    changed = true;
  }
  if (!changed) return;
  gearDirty = true;
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function itemSellValue(item) {
  return Math.round(rarityOf(item.rarity).mult * (4 + state.level));
}

function isSkillable(id) {
  return SKILL_EDGES.some(
    ([a, b]) => (a === id && state.skills.includes(b)) || (b === id && state.skills.includes(a))
  );
}

function skillPos(node) {
  const rad = (node.angle * Math.PI) / 180;
  return { x: Math.round(node.radius * Math.cos(rad)), y: Math.round(-node.radius * Math.sin(rad)) };
}

function buildSkillTree() {
  if (skillTreeBuilt) return;
  const ns = 'http://www.w3.org/2000/svg';
  for (const [from, to] of SKILL_EDGES) {
    const a = skillPos(SKILL_NODES_BY_ID[from]);
    const b = skillPos(SKILL_NODES_BY_ID[to]);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.dataset.from = from;
    line.dataset.to = to;
    const fromBranch = SKILL_NODES_BY_ID[from].branch;
    const toBranch = SKILL_NODES_BY_ID[to].branch;
    const edgeBranch = [fromBranch, toBranch].find((b) => b !== 'start' && b !== 'bruecke') ?? 'bruecke';
    line.classList.add('skill-edge', `edge-${edgeBranch}`);
    if (SKILL_NODES_BY_ID[to].type === 'keystone') line.classList.add('edge-keystone');
    el.skillTree.appendChild(line);
  }
  for (const node of SKILL_NODES) {
    const { x, y } = skillPos(node);
    const group = document.createElementNS(ns, 'g');
    group.classList.add('skill-node', `branch-${node.branch}`, `type-${node.type}`);
    group.dataset.id = node.id;
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', SKILL_NODE_RADIUS[node.type]);
    group.appendChild(circle);
    el.skillTree.appendChild(group);
  }
  skillTreeBuilt = true;
}

function renderSkillTree() {
  for (const group of el.skillTree.querySelectorAll('.skill-node')) {
    const id = group.dataset.id;
    const allocated = state.skills.includes(id);
    const canSkill = !allocated && isSkillable(id);
    group.classList.toggle('allocated', allocated);
    group.classList.toggle('available', canSkill && state.skillPoints > 0);
    group.classList.toggle('locked', !allocated && !canSkill);
  }
  for (const line of el.skillTree.querySelectorAll('.skill-edge')) {
    line.classList.toggle('active', state.skills.includes(line.dataset.from) && state.skills.includes(line.dataset.to));
  }
}

function allocateSkill(id) {
  if (state.skills.includes(id)) return;
  if (state.skillPoints <= 0 || !isSkillable(id)) return;
  state.skills.push(id);
  state.skillPoints -= 1;
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function skillTooltipHtml(node) {
  const allocated = state.skills.includes(node.id);
  const effects = node.effects
    .map((effect) => `<div class="tt-stat">${SKILL_EFFECT_LABELS[effect.stat](effect.value)}</div>`)
    .join('');
  let status;
  if (allocated) status = 'Geskillt.';
  else if (!isSkillable(node.id)) status = 'Benötigt einen benachbarten geskillten Punkt.';
  else if (state.skillPoints > 0) status = 'Klicken zum Freischalten.';
  else status = 'Keine Skillpunkte.';
  return `
    ${node.name ? `<div class="tt-name">${node.name}</div>` : ''}
    ${node.desc ? `<div class="tt-desc">${node.desc}</div>` : ''}
    ${effects}
    <div class="tt-hint">${status}</div>`;
}

const SKILL_VIEW_START = 320;
const SKILL_VIEW_MIN = 180;
const SKILL_VIEW_MAX = 1440;
const SKILL_WORLD = 720;
let skillView = { x: -SKILL_VIEW_START, y: -SKILL_VIEW_START, w: SKILL_VIEW_START * 2 };
let skillDrag = null;
let suppressSkillClick = false;

function applySkillView() {
  el.skillTree.setAttribute('viewBox', `${skillView.x} ${skillView.y} ${skillView.w} ${skillView.w}`);
}

function clampSkillView() {
  skillView.x = Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - skillView.w, skillView.x));
  skillView.y = Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - skillView.w, skillView.y));
}

function dragClamp(value, w) {
  return Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - w, value));
}

function toggleSellMode() {
  sellMode = !sellMode;
  selectedForSale.clear();
  gearDirty = true;
  render();
}

function exitSellMode() {
  if (!sellMode) return;
  sellMode = false;
  selectedForSale.clear();
  gearDirty = true;
  render();
}

function sellSelected() {
  if (!selectedForSale.size) {
    toggleSellMode();
    return;
  }
  let ash = 0;
  state.inventory = state.inventory.filter((item) => {
    if (!selectedForSale.has(item.id)) return true;
    ash += itemSellValue(item);
    return false;
  });
  state.ash += ash;
  selectedForSale.clear();
  sellMode = false;
  gearDirty = true;
  save();
  render();
}

function flash(figure) {
  if (!settings.hitFlash) return;
  figure.classList.add('hit');
  setTimeout(() => figure.classList.remove('hit'), 150);
}

function spawnDamageFloat(fighter, amount, isCrit = false) {
  if (!settings.damageNumbers) return;
  const span = document.createElement('span');
  span.className = isCrit ? 'dmg-float crit' : 'dmg-float';
  span.textContent = amount;
  span.style.left = `${35 + Math.random() * 30}%`;
  fighter.appendChild(span);
  setTimeout(() => span.remove(), 900);
}

function showOverlay(text) {
  document.getElementById('overlay-text').textContent = text;
  document.getElementById('overlay').classList.add('show');
  overlayDismissible = false;
}

function showDismissibleOverlay(text, duration) {
  showOverlay(text);
  overlayDismissible = true;
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    hideOverlay();
  }, duration);
}

function dismissOverlay() {
  if (!overlayDismissible) return;
  overlayDismissible = false;
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  hideOverlay();
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function showScreen(target) {
  if (target !== el.sceneHero) exitSellMode();
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.game]) {
    screen.hidden = screen !== target;
  }
}

function spawnEnemy() {
  let type = 'normal';
  const zoneCleared = state.cleared > state.zone;
  if (!zoneCleared && state.zoneKills >= BOSS_AFTER_KILLS) {
    type = 'boss';
  } else if (state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0) {
    type = 'elite';
  }
  const def = scaledEnemy(type);
  enemy = { type, name: def.name, hp: def.hp, maxHp: def.hp, damage: def.damage };
  el.enemyFigure.classList.toggle('boss', !!def.boss);
  render();
}

function gainXp(amount) {
  state.xp += Math.round(amount * (1 + statBonus('xp') / 100));
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level += 1;
    state.statPoints += 5;
    state.skillPoints += 1;
    heroHp = heroMaxHp();
  }
}

function allocateStat(stat) {
  const amount = Math.min(statSpendAmount, state.statPoints);
  if (amount <= 0) return;
  state.statPoints -= amount;
  if (stat === 'damage') state.damage += amount;
  else if (stat === 'hp') {
    state.maxHp += 5 * amount;
    heroHp = Math.min(heroHp + 5 * amount, heroMaxHp());
  } else if (stat === 'armor') state.armorBase += amount;
  else if (stat === 'crit') state.critBonus += amount;
  save();
  render();
}

function bindHoldToRepeat(button, action) {
  let delayTimer = null;
  let repeatTimer = null;
  const stop = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
  };
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    action();
    delayTimer = setTimeout(() => {
      repeatTimer = setInterval(action, 110);
    }, 400);
  });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointerleave', stop);
  button.addEventListener('pointercancel', stop);
}

function killEnemy() {
  const def = scaledEnemy(enemy.type);
  state.kills += 1;
  state.zoneKills += 1;
  state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
  gainXp(def.xp);
  rollDrop(enemy.type);
  if (def.boss) {
    state.cleared = Math.max(state.cleared, state.zone + 1);
    if (state.zone + 1 < ZONES.length) {
      showDismissibleOverlay(`${def.name} bezwungen — ${ZONES[state.zone + 1].name} ist jetzt offen.`, 4200);
    } else {
      showDismissibleOverlay(`${def.name} bezwungen — ${ZONES[state.zone].name} ist erreicht.`, 4200);
    }
  }
  enemy = null;
  save();
  setTimeout(spawnEnemy, 600);
  render();
}

function heroAttack() {
  let damage = heroDamage();
  const isCrit = Math.random() * 100 < heroCritChance();
  if (isCrit) damage = Math.round(damage * critMultiplier());
  enemy.hp -= damage;
  flash(el.heroFigure);
  spawnDamageFloat(el.enemyFighter, damage, isCrit);
  if (enemy.hp <= 0) {
    killEnemy();
  } else {
    render();
  }
}

function enemyAttack() {
  const armor = heroArmor();
  const reduction = armor / (armor + ARMOR_RESISTANCE * enemy.damage);
  const taken = Math.max(1, Math.round(enemy.damage * (1 - reduction)));
  heroHp -= taken;
  flash(el.enemyFigure);
  spawnDamageFloat(el.heroFighter, taken);
  if (heroHp <= 0) {
    die();
  } else {
    render();
  }
}

function die() {
  heroHp = 0;
  paused = true;
  showOverlay('Die Asche nimmt dich zurück.');
  render();
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    hideOverlay();
    returnToHub();
  }, 2000);
}

function buyUpgrade(kind) {
  if (kind === 'damage') {
    const cost = upgradeCost(10, state.damageUps);
    if (state.ash < cost) return;
    state.ash -= cost;
    state.damageUps += 1;
    state.damage += 1;
  } else {
    const cost = upgradeCost(15, state.hpUps);
    if (state.ash < cost) return;
    state.ash -= cost;
    state.hpUps += 1;
    state.maxHp += 5;
    heroHp += 5;
  }
  save();
  render();
}

function tick() {
  if (paused || !enemy) return;
  heroAttackProgress += TICK_MS * heroAttackSpeed();
  enemyAttackProgress += TICK_MS;
  if (heroAttackProgress >= ATTACK_INTERVAL_MS) {
    heroAttackProgress = 0;
    heroAttack();
  }
  if (!paused && enemy && enemyAttackProgress >= ATTACK_INTERVAL_MS) {
    enemyAttackProgress = 0;
    enemyAttack();
  }
}

function itemStatsText(item) {
  const s = itemStats(item);
  return (
    [
      s.damage ? `+${s.damage} Schaden` : null,
      s.hp ? `+${s.hp} Lebenskraft` : null,
      s.armor ? `+${s.armor} Rüstung` : null,
      s.critChance ? `+${s.critChance} % Kritchance` : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Keine Werte'
  );
}

function comparisonHtml(item) {
  const equipped = state.equipment[item.slot];
  if (!equipped || equipped.id === item.id) return '';
  return `<div class="tt-compare">Getragen: ${equipped.name} · ${itemStatsText(equipped)}</div>`;
}

function tooltipHtml(item, action, showValue = false) {
  if (!item) return '<span class="tt-empty">Leer</span>';
  const rarity = rarityOf(item.rarity);
  const stats = itemStats(item);
  const rows = [
    stats.damage ? `<div class="tt-stat">+${stats.damage} Schaden</div>` : null,
    stats.hp ? `<div class="tt-stat">+${stats.hp} Lebenskraft</div>` : null,
    stats.armor ? `<div class="tt-stat">+${stats.armor} Rüstung</div>` : null,
    stats.critChance ? `<div class="tt-stat">+${stats.critChance} % Kritchance</div>` : null,
    item.enhance ? `<div class="tt-enhance">Verstärkt +${item.enhance}</div>` : null,
    item.mastery ? `<div class="tt-mastery">Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value)}</div>` : null,
  ]
    .filter(Boolean)
    .join('');
  return `
    <div class="tt-name" style="color:${rarity.color}">${item.name}</div>
    <div class="tt-rarity" style="color:${rarity.color}">${rarity.label}</div>
    ${rows}
    ${showValue ? `<div class="tt-stat">Wert: ${itemSellValue(item)} Asche</div>` : ''}
    ${comparisonHtml(item)}
    <div class="tt-hint">Klicken zum ${action}</div>`;
}

function renderGear() {
  for (const slotEl of el.gearSlots) {
    const item = state.equipment[slotEl.dataset.slot];
    slotEl.querySelector('.slot-value').textContent = item ? gearSlotOf(item.slot).abbrev : '—';
    slotEl.querySelector('.tooltip').innerHTML = tooltipHtml(item, 'Ablegen');
  }
}

function renderInventory() {
  el.inventoryGrid.replaceChildren();
  if (!state.inventory.length) {
    const note = document.createElement('div');
    note.className = 'inventory-empty';
    note.textContent = 'Die Asche hat noch nichts für dich.';
    el.inventoryGrid.appendChild(note);
    return;
  }
  for (const item of state.inventory) {
    const rarity = rarityOf(item.rarity);
    const cell = document.createElement('button');
    cell.className = 'inv-cell has-tooltip';
    if (sellMode) cell.classList.add('selectable');
    if (selectedForSale.has(item.id)) cell.classList.add('selected');
    cell.dataset.id = item.id;
    cell.style.borderColor = rarity.color;
    cell.innerHTML = `
      <span class="inv-abbrev" style="color:${rarity.color}">${gearSlotOf(item.slot).abbrev}</span>
      <div class="tooltip">${tooltipHtml(item, sellMode ? 'Auswählen' : 'Anlegen', true)}</div>`;
    el.inventoryGrid.appendChild(cell);
  }
}

let selectedCraftSlot = null;

function buildCraftSlots() {
  if (el.craftSlots.children.length) return;
  for (const slot of GEAR_SLOTS) {
    const row = document.createElement('button');
    row.className = 'craft-slot';
    row.dataset.slot = slot.key;
    el.craftSlots.appendChild(row);
  }
}

function enhanceBonusValue(slotKey, enhanceLevel) {
  const scale = gearSlotOf(slotKey).stat === 'damage' ? 1 + 0.5 * craftIlvl() : 4 + 2.5 * craftIlvl();
  return Math.max(1, Math.round(scale * (1 + 0.4 * (enhanceLevel - 1))));
}

function enhanceCost(item) {
  return Math.round(30 * 1.6 ** (item.enhance + 1) * (1 + 0.25 * craftIlvl()));
}

function reforgeCost(item) {
  const base = item.rarity === 'gewoehnlich' ? 600 : 3000;
  return Math.round(base * (1 + 0.4 * craftIlvl()));
}

function craftEnhance(slotKey) {
  const item = state.equipment[slotKey];
  if (!item) return;
  const cost = enhanceCost(item);
  if (state.ash < cost) return;
  state.ash -= cost;
  item.enhance += 1;
  const bonus = enhanceBonusValue(slotKey, item.enhance);
  if (gearSlotOf(slotKey).stat === 'damage') {
    item.enhanceBonus = { damage: bonus };
  } else {
    item.enhanceBonus = { hp: bonus, armor: Math.max(1, Math.round(bonus * 0.4)) };
  }
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function craftReforge(slotKey) {
  const item = state.equipment[slotKey];
  if (!item || item.rarity === 'episch') return;
  const cost = reforgeCost(item);
  if (state.ash < cost) return;
  state.ash -= cost;
  const next = item.rarity === 'gewoehnlich' ? RARITIES[1] : RARITIES[2];
  const slot = gearSlotOf(slotKey);
  item.rarity = next.key;
  item.name = `${slot.base} ${next.suffix}`;
  Object.assign(item, rollItemValues(slot, next, craftIlvl()));
  if (next.key === 'episch') item.mastery = rollMastery(slot.stat);
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function renderCrafting() {
  if (el.sceneCrafting.hidden) return;
  el.craftAsh.textContent = state.ash;
  for (const row of el.craftSlots.querySelectorAll('.craft-slot')) {
    const slotKey = row.dataset.slot;
    const item = state.equipment[slotKey];
    const rarity = item ? rarityOf(item.rarity) : null;
    row.classList.toggle('selected', slotKey === selectedCraftSlot);
    row.classList.toggle('empty', !item);
    row.innerHTML = `<span class="craft-slot-name">${gearSlotOf(slotKey).label}</span>
      <span class="craft-slot-item" style="color:${rarity?.color ?? '#5f584e'}">${item ? `${item.name}${item.enhance ? ` +${item.enhance}` : ''}` : 'Leer'}</span>`;
  }
  renderCraftDetail();
}

function renderCraftDetail() {
  const item = state.equipment[selectedCraftSlot];
  if (!item) {
    el.craftDetail.innerHTML = '<p class="craft-hint">Wähle links einen besetzten Ausrüstungsslot, den du schmieden willst.</p>';
    return;
  }
  const rarity = rarityOf(item.rarity);
  const slot = gearSlotOf(selectedCraftSlot);
  const eCost = enhanceCost(item);
  const curBonus = enhanceBonusValue(selectedCraftSlot, item.enhance);
  const nextBonus = enhanceBonusValue(selectedCraftSlot, item.enhance + 1);
  const enhancePreview = slot.stat === 'damage'
    ? `+${nextBonus - curBonus} Schaden`
    : `+${nextBonus - curBonus} Lebenskraft · +${Math.max(1, Math.round((nextBonus - curBonus) * 0.4))} Rüstung`;
  const nextRarity = item.rarity === 'gewoehnlich' ? RARITIES[1] : item.rarity === 'selten' ? RARITIES[2] : null;
  const rCost = nextRarity ? reforgeCost(item) : 0;
  const masteryHint = nextRarity?.key === 'episch' ? 'Rollt eine Meisterschaft' : 'Werte werden neu gewürfelt';
  el.craftDetail.innerHTML = `
    <div class="craft-item">
      <div class="tt-name" style="color:${rarity.color}">${item.name}${item.enhance ? ` +${item.enhance}` : ''}</div>
      <div class="tt-rarity" style="color:${rarity.color}">${rarity.label}</div>
      <div class="tt-stat">${itemStatsText(item)}</div>
      ${item.enhanceBonus ? '<div class="tt-enhance">Verstärkt durch die Werkstatt</div>' : ''}
      ${item.mastery ? `<div class="tt-mastery">Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value)}</div>` : ''}
    </div>
    <div class="craft-action">
      <div class="craft-action-head">Verstärken auf +${item.enhance + 1}<span>${enhancePreview}</span></div>
      <button class="btn-small" data-craft="enhance" ${state.ash < eCost ? 'disabled' : ''}>Schmieden · ${eCost} Asche</button>
    </div>
    <div class="craft-action">
      <div class="craft-action-head">Umschmieden auf ${nextRarity ? nextRarity.label : '—'}<span>${nextRarity ? masteryHint : ''}</span></div>
      ${nextRarity
        ? `<button class="btn-small" data-craft="reforge" ${state.ash < rCost ? 'disabled' : ''}>Umschmieden · ${rCost} Asche</button>`
        : '<span class="craft-hint">Maximale Seltenheit erreicht.</span>'}
    </div>`;
}

function render() {
  el.hubLevel.textContent = state.level;
  el.hubAsh.textContent = state.ash;
  el.hudLevel.textContent = state.level;
  el.hudAsh.textContent = state.ash;
  el.inventoryCount.textContent = `${state.inventory.length} / ${INVENTORY_CAP}`;
  el.statPointsRow.hidden = state.statPoints === 0;
  el.statPointsValue.textContent = state.statPoints;
  const hasPoints = state.statPoints > 0;
  for (const button of el.statPlusButtons) {
    button.hidden = !hasPoints;
  }
  for (const button of el.spendButtons) {
    button.classList.toggle('active', Number(button.dataset.amount) === statSpendAmount);
  }
  el.skillPointsHud.textContent = state.skillPoints;
  el.skillPointsHud.classList.toggle('has-points', state.skillPoints > 0);
  el.tileSkillsSub.textContent = state.skillPoints > 0 ? `${state.skillPoints} Punkte frei` : 'Wähle weise';
  el.hudZone.textContent = zoneOf(state.zone).name;
  el.tileMapSub.textContent = `${Math.min(state.cleared + 1, ZONES.length)} von ${ZONES.length} Gebieten offen`;
  renderZones();
  renderCrafting();
  el.doorButton.hidden = !(state.zone + 1 <= Math.min(state.cleared, ZONES.length - 1));
  renderSkillTree();
  el.modalHeroLevel.textContent = state.level;
  el.modalHeroXp.textContent = `${state.xp} / ${xpNeeded(state.level)}`;
  el.modalHeroHp.textContent = heroMaxHp();
  el.modalHeroDamage.textContent = heroDamage();
  el.modalHeroArmor.textContent = heroArmor();
  el.modalHeroCrit.textContent = `${heroCritChance()} %`;
  el.modalHeroCritDmg.textContent = `${Math.round(critMultiplier() * 100)} %`;
  el.modalHeroSpeed.textContent = `${heroAttackSpeed().toFixed(1).replace('.', ',')} / s`;
  el.modalHeroKills.textContent = state.kills;
  el.heroHp.style.width = `${Math.max(0, heroHp / heroMaxHp()) * 100}%`;
  if (enemy) {
    el.enemyName.textContent = enemy.name;
    el.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  } else {
    el.enemyHp.style.width = '0%';
  }
  const dmgCost = upgradeCost(10, state.damageUps);
  const hpCost = upgradeCost(15, state.hpUps);
  el.costDamage.textContent = dmgCost;
  el.costHp.textContent = hpCost;
  el.upDamage.disabled = state.ash < dmgCost;
  el.upHp.disabled = state.ash < hpCost;
  if (gearDirty) {
    renderGear();
    renderInventory();
    el.sellAllButton.hidden = !sellMode;
    let saleAsh = 0;
    for (const item of state.inventory) {
      if (selectedForSale.has(item.id)) saleAsh += itemSellValue(item);
    }
    el.sellButton.textContent = sellMode
      ? selectedForSale.size
        ? `${selectedForSale.size} verkaufen · ${saleAsh} Asche`
        : 'Abbrechen'
      : 'Verkaufen';
    gearDirty = false;
  }
}

function save() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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

function loadSettings() {
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {});
  } catch {
    Object.assign(settings, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
  el.skillTree.classList.toggle('no-pulse', !settings.skillPulse);
  for (const input of el.optionsPanel.querySelectorAll('[data-setting]')) {
    input.checked = settings[input.dataset.setting];
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    Object.assign(state, JSON.parse(raw));
    for (const slot of GEAR_SLOTS) {
      normalizeItem(state.equipment[slot.key]);
    }
    state.inventory.forEach(normalizeItem);
    state.statPoints ??= 0;
    state.armorBase ??= 0;
    state.critBonus ??= 0;
    if (!Array.isArray(state.skills)) state.skills = ['start'];
    if (!state.skills.includes('start')) state.skills.unshift('start');
    state.skills = state.skills.filter((id) => SKILL_NODES_BY_ID[id]);
    state.skillPoints = Math.max(0, state.level - state.skills.length);
    state.zone ??= 0;
    state.cleared ??= 0;
    state.zoneKills ??= 0;
    state.zone = Math.max(0, Math.min(Math.trunc(state.zone), ZONES.length - 1));
    state.cleared = Math.max(0, Math.min(Math.trunc(state.cleared), ZONES.length - 1));
    state.zone = Math.min(state.zone, state.cleared);
    return true;
  } catch {
    return false;
  }
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function simulateKills(seconds) {
  let remaining = seconds;
  let guard = 0;
  while (remaining > 0 && guard < 1000000) {
    guard += 1;
    const isElite = state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0;
    const def = scaledEnemy(isElite ? 'elite' : 'normal');
    const hits = Math.max(1, Math.ceil(def.hp / heroDamage()));
    const duration = hits * (ATTACK_INTERVAL_MS / 1000) + ENEMY_RESPAWN_S;
    if (duration > remaining) break;
    remaining -= duration;
    state.kills += 1;
    state.zoneKills += 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
    gainXp(def.xp);
    rollDrop(isElite ? 'elite' : 'normal');
  }
}

function applyOfflineProgress() {
  if (!settings.offlineProgress) return;
  const elapsed = Date.now() - (state.lastSeen || Date.now());
  if (elapsed < OFFLINE_MIN_GAP_MS) return;
  const capped = Math.min(elapsed, OFFLINE_CAP_MS);
  const ashBefore = state.ash;
  const levelBefore = state.level;
  const killsBefore = state.kills;
  simulateKills(capped / 1000);
  const ash = state.ash - ashBefore;
  const levels = state.level - levelBefore;
  const kills = state.kills - killsBefore;
  if (kills <= 0) return;
  const levelsPart = levels > 0 ? `, +${levels} ${levels === 1 ? 'Stufe' : 'Stufen'}` : '';
  offlineSummary = `Während du fort warst (${formatDuration(capped)}): ${kills} Kämpfe, +${ash} Asche${levelsPart}.`;
  save();
}

function idleTick() {
  if (el.game.hidden === false) {
    render();
    return;
  }
  simulateKills(STATS_SYNC_INTERVAL_MS / 1000);
  save();
  render();
}

function beginCombat() {
  if (tickTimer) return;
  spawnEnemy();
  paused = false;
  tickTimer = setInterval(tick, TICK_MS);
}

function descend() {
  showScreen(el.game);
  heroHp = heroMaxHp();
  render();
  beginCombat();
}

function enterZone(index) {
  if (index < 0 || index >= ZONES.length || index > state.cleared) return;
  state.zone = index;
  state.zoneKills = 0;
  save();
}

function buildZoneList() {
  for (const [index, zone] of ZONES.entries()) {
    const row = document.createElement('button');
    row.className = 'zone-row';
    row.dataset.zone = index;
    row.innerHTML = `<span class="zone-name">${zone.name}</span><span class="zone-status"></span>`;
    el.zoneList.appendChild(row);
  }
}

function renderZones() {
  for (const row of el.zoneList.querySelectorAll('.zone-row')) {
    const index = Number(row.dataset.zone);
    const open = index <= Math.min(state.cleared, ZONES.length - 1);
    row.disabled = !open;
    row.classList.toggle('current', index === state.zone);
    row.classList.toggle('locked', !open);
    row.querySelector('.zone-status').textContent = index === state.zone ? 'Aufenthalt' : open ? 'Eröffnet' : 'Versiegelt';
  }
}

function returnToHub() {
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
    hideOverlay();
  }
  paused = true;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  heroHp = heroMaxHp();
  enemy = null;
  save();
  showScreen(el.hub);
  render();
}

function returnToMenu() {
  showScreen(el.menu);
}

function bindEvents() {
  el.upDamage.addEventListener('click', () => buyUpgrade('damage'));
  el.upHp.addEventListener('click', () => buyUpgrade('hp'));
  el.shrineButton.addEventListener('click', returnToHub);
  el.btnDescend.addEventListener('click', descend);
  el.doorButton.addEventListener('click', () => {
    if (state.zone + 1 >= ZONES.length || state.zone + 1 > state.cleared) return;
    enterZone(state.zone + 1);
    enemy = null;
    heroAttackProgress = 0;
    enemyAttackProgress = 0;
    heroHp = heroMaxHp();
    spawnEnemy();
    render();
  });
  el.hubMenu.addEventListener('click', returnToMenu);
  el.hubOptions.addEventListener('click', () => openOptions('hub'));
  el.overlay.addEventListener('click', dismissOverlay);
  el.optionsTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.options-tab');
    if (!btn) return;
    for (const tab of el.optionsTabs.querySelectorAll('.options-tab')) {
      tab.classList.toggle('active', tab === btn);
    }
    for (const page of el.optionsPanel.querySelectorAll('.options-page')) {
      page.hidden = page.dataset.page !== btn.dataset.tab;
    }
  });
  el.optionsPanel.addEventListener('change', (e) => {
    const input = e.target.closest('[data-setting]');
    if (!input) return;
    settings[input.dataset.setting] = input.checked;
    saveSettings();
    applySettings();
  });
  el.resetButton.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      el.resetButton.classList.add('armed');
      el.resetButton.textContent = 'Wirklich? Erneut klicken';
      resetTimer = setTimeout(() => {
        resetArmed = false;
        el.resetButton.classList.remove('armed');
        el.resetButton.textContent = 'Zurücksetzen';
      }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
  document.getElementById('btn-options-back').addEventListener('click', () => {
    showScreen(optionsReturnScreen ?? el.hub);
  });
  el.tileHero.addEventListener('click', () => showScreen(el.sceneHero));
  el.tileSkills.addEventListener('click', () => showScreen(el.sceneSkills));
  el.tileMap.addEventListener('click', () => showScreen(el.sceneMap));
  el.tileCrafting.addEventListener('click', () => showScreen(el.sceneCrafting));
  el.craftSlots.addEventListener('click', (e) => {
    const row = e.target.closest('.craft-slot');
    if (!row) return;
    selectedCraftSlot = row.dataset.slot;
    renderCrafting();
  });
  el.craftDetail.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-craft]');
    if (!btn || btn.disabled) return;
    if (btn.dataset.craft === 'enhance') craftEnhance(selectedCraftSlot);
    else craftReforge(selectedCraftSlot);
  });
  el.zoneList.addEventListener('click', (e) => {
    const row = e.target.closest('.zone-row');
    if (!row || row.disabled) return;
    enterZone(Number(row.dataset.zone));
    showScreen(el.hub);
    render();
  });
  el.sortInventoryButton.addEventListener('click', sortInventory);
  el.equipBestButton.addEventListener('click', equipBest);
  el.sellButton.addEventListener('click', () => (sellMode ? sellSelected() : toggleSellMode()));
  el.sellAllButton.addEventListener('click', () => {
    for (const item of state.inventory) selectedForSale.add(item.id);
    gearDirty = true;
    render();
  });
  el.inventoryGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.inv-cell');
    if (!cell) return;
    const id = Number(cell.dataset.id);
    if (sellMode) {
      if (selectedForSale.has(id)) selectedForSale.delete(id);
      else selectedForSale.add(id);
      gearDirty = true;
      render();
    } else {
      equipItem(id);
    }
  });
  for (const button of el.statPlusButtons) {
    bindHoldToRepeat(button, () => allocateStat(button.dataset.stat));
  }
  for (const button of el.spendButtons) {
    button.addEventListener('click', () => {
      statSpendAmount = Number(button.dataset.amount);
      render();
    });
  }
  el.skillTree.addEventListener('click', (e) => {
    if (suppressSkillClick) {
      suppressSkillClick = false;
      return;
    }
    const group = e.target.closest('.skill-node');
    if (group) allocateSkill(group.dataset.id);
  });
  el.skillTree.addEventListener('mousemove', (e) => {
    if (skillDrag) {
      el.skillTooltip.hidden = true;
      return;
    }
    const group = e.target.closest('.skill-node');
    const tooltip = el.skillTooltip;
    if (!group) {
      tooltip.hidden = true;
      return;
    }
    tooltip.innerHTML = skillTooltipHtml(SKILL_NODES_BY_ID[group.dataset.id]);
    tooltip.hidden = false;
    const wrapRect = el.skillTreeWrap.getBoundingClientRect();
    const left = Math.min(e.clientX - wrapRect.left + 14, wrapRect.width - tooltip.offsetWidth - 4);
    const top = Math.min(e.clientY - wrapRect.top + 14, wrapRect.height - tooltip.offsetHeight - 4);
    tooltip.style.left = `${Math.max(0, left)}px`;
    tooltip.style.top = `${Math.max(0, top)}px`;
  });
  el.skillTree.addEventListener('mouseleave', () => {
    el.skillTooltip.hidden = true;
  });
  el.skillTree.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
    const rect = el.skillTree.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const worldX = skillView.x + fx * skillView.w;
    const worldY = skillView.y + fy * skillView.w;
    const newW = Math.max(SKILL_VIEW_MIN, Math.min(SKILL_VIEW_MAX, skillView.w * factor));
    skillView.x = worldX - fx * newW;
    skillView.y = worldY - fy * newW;
    skillView.w = newW;
    clampSkillView();
    applySkillView();
    el.skillTooltip.hidden = true;
  }, { passive: false });
  el.skillTree.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.skill-node')) return;
    skillDrag = { px: e.clientX, py: e.clientY, viewX: skillView.x, viewY: skillView.y, moved: false };
    el.skillTree.setPointerCapture(e.pointerId);
    el.skillTree.classList.add('dragging');
  });
  el.skillTree.addEventListener('pointermove', (e) => {
    if (!skillDrag) return;
    const rect = el.skillTree.getBoundingClientRect();
    const dx = ((e.clientX - skillDrag.px) / rect.width) * skillView.w;
    const dy = ((e.clientY - skillDrag.py) / rect.height) * skillView.w;
    if (Math.abs(e.clientX - skillDrag.px) + Math.abs(e.clientY - skillDrag.py) > 5) skillDrag.moved = true;
    skillView.x = dragClamp(skillDrag.viewX - dx, skillView.w);
    skillView.y = dragClamp(skillDrag.viewY - dy, skillView.w);
    applySkillView();
    el.skillTooltip.hidden = true;
  });
  el.skillTree.addEventListener('pointerup', () => {
    suppressSkillClick = skillDrag?.moved ?? false;
    skillDrag = null;
    el.skillTree.classList.remove('dragging');
  });
  el.skillTree.addEventListener('dblclick', (e) => {
    if (e.target.closest('.skill-node')) return;
    skillView = { x: -SKILL_VIEW_START, y: -SKILL_VIEW_START, w: SKILL_VIEW_START * 2 };
    clampSkillView();
    applySkillView();
  });
  for (const slotEl of el.gearSlots) {
    slotEl.addEventListener('click', () => unequipItem(slotEl.dataset.slot));
  }
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(el.hub));
  });
}

function ensureInit() {
  if (el.game) return;
  cacheDom();
  bindEvents();
  buildSkillTree();
  buildZoneList();
  buildCraftSlots();
  applySkillView();
  loadSettings();
  applySettings();
  hasSave = loadSave();
  if (hasSave) applyOfflineProgress();
  setInterval(idleTick, STATS_SYNC_INTERVAL_MS);
}

export function startGame() {
  ensureInit();
  showScreen(el.hub);
  render();
  if (!visited) {
    visited = true;
    if (!hasSave) {
      paused = true;
      showDismissibleOverlay('Du erwachst in Asche. Die Krone ruft.', 2600);
    } else if (offlineSummary) {
      if (settings.offlineSummary) showDismissibleOverlay(offlineSummary, 4500);
      offlineSummary = null;
    }
  }
}

export function openOptions(from) {
  ensureInit();
  optionsReturnScreen = from === 'menu' ? el.menu : el.hub;
  showScreen(el.sceneOptions);
  render();
}
