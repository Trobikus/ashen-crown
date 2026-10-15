// Balance-Simulator für Ashen Crown.
//
// Spielt das Spiel mit den echten Formeln durch (XP-Kurve, Rüstungsformel,
// Krit, Drops, Werkstatt-Ökonomie) und misst pro Zone: Kill-Zeit, Tode,
// Überfarm-Aufwand. Genutzt, um Wachstumskurven zu belegen statt zu raten.
//
//   node tools/balance-sim.mjs            → Preset-Kandidaten durchrechnen
//   node tools/balance-sim.mjs --verify   → gegen die echte src/data.js spielen
//   node tools/balance-sim.mjs --depths   → Tiefen (Zone 51+) mitprüfen

const ATTACK_INTERVAL_MS = 1500;
const ENEMY_RESPAWN_S = 0.6;
const BOSS_AFTER_KILLS = 30;
const ELITE_EVERY_KILLS = 10;
const INVENTORY_SOFT_CAP = 24;

const BASE_CRIT_CHANCE = 5;
const CRIT_MULTIPLIER = 2;
const BASE_ATTACK_SPEED = 1;
const ARMOR_RESISTANCE = 12;

// Balance-Regeln ab 0.10.0 — spiegeln src/data.js.
const CRIT_CHANCE_CAP = 75;
const ENEMY_MISS_CHANCE = 0.15;
const HERO_MISS_CHANCE = 0.12;
const SKILL_TREE_UNLOCK_LEVEL = 20;
const STAT_POINTS_PER_LEVEL = 2;
const ENEMY_XP_CUTOFF_LEVELS = 20;
const enemyXpMultiplier = (enemyLevel, heroLevel) => {
  const diff = heroLevel - enemyLevel;
  if (diff <= 0) return 1;
  return Math.max(0, 1 - diff / ENEMY_XP_CUTOFF_LEVELS);
};

// Kampfmodelle aus 0.7.0: Verhaltensprofile (rotieren pro Zone), Boss-Enrage
// und Todeszoll; seit 0.10.0 heilt der Held nicht mehr pro Kill, sondern nur
// durch Lifeleech-Affixe — spiegeln src/data.js.
const DEATH_ASH_PENALTY = 0.15;
const ENRAGE_THRESHOLD = 0.35;
const ENRAGE_INTERVAL_MULT = 0.65;
const PROFILES = {
  standard: { hp: 1, damage: 1, interval: 1 },
  flink: { hp: 0.75, damage: 0.8, interval: 0.65 },
  massiv: { hp: 1.5, damage: 1.2, interval: 1.5 },
};
const PROFILE_CYCLE = ['standard', 'flink', 'massiv'];
const profileOf = (zone, type) => (type === 'boss' ? PROFILES.standard : PROFILES[PROFILE_CYCLE[((zone % 3) + 3) % 3]]);

const GEAR_SLOT_STATS = {
  waffe: 'damage',
  brust: 'hp',
  helm: 'hp',
  hose: 'hp',
  schuhe: 'hp',
  'hand-links': 'damage',
  'hand-rechts': 'damage',
};
const SLOT_KEYS = Object.keys(GEAR_SLOT_STATS);

const RARITIES = [
  { key: 'gewoehnlich', mult: 1, weight: 54 },
  { key: 'magisch', mult: 1.5, weight: 26 },
  { key: 'selten', mult: 2.2, weight: 14 },
  { key: 'episch', mult: 3.4, weight: 5 },
  { key: 'legendär', mult: 5.2, weight: 1 },
];

// Beute ist ein Ereignis — spiegelt src/data.js.
const DROP_CHANCES = { normal: 0.01, elite: 0.08, boss: 0.5 };

// Affix-Ranges — spiegeln src/data.js.
const CRIT_BY_RARITY = {
  magisch: [2, 3],
  selten: [4, 6],
  episch: [7, 10],
  legendär: [11, 14],
};
const LIFELEECH_CHANCE_BY_RARITY = { episch: 0.5, legendär: 0.75 };
const LIFELEECH_PCT_ODDS = 0.65;
const LIFELEECH_PCT_BY_RARITY = {
  episch: [10, 14],
  legendär: [15, 20],
};
const LIFELEECH_FLAT_BY_RARITY = {
  episch: { base: 3, ilvl: 0.15 },
  legendär: { base: 4, ilvl: 0.22 },
};
// Werkstatt-Kette: Umschmieden bleibt der planbare Weg zur besseren Waffe.
const REFOrge_BASES = [600, 3000, 12000, 50000];

const xpNeeded = (level) => Math.round(9 * level * level + 13 * level);

// Richtlinien-Annahmen für "einen denkenden Spieler" (bewusst grob):
// Skillpunkte entstehen erst ab Stufe 20 und wirken als pro Level anwachsende
// Prozent-Boni mit Deckeln (Runenwerte sind gedämpft), Statpunkte werden
// 1 Schaden : 1 Lebenskraft verteilt und Asche nach Grenznutzen ausgegeben.
const skillProfile = (level) => {
  const pts = Math.max(0, level - (SKILL_TREE_UNLOCK_LEVEL - 1));
  return {
    damagePct: Math.min(1.0 * pts, 80),
    hpPct: Math.min(0.6 * pts, 50),
    armor: Math.min(0.25 * pts, 30),
    crit: Math.min(0.1 * pts, 6),
    critDmg: Math.min(0.3 * pts, 30),
    speed: Math.min(0.075 * pts, 8),
    ash: Math.min(0.15 * pts, 15),
    xp: Math.min(0.15 * pts, 15),
  };
};

function rollRarity(rng) {
  const total = RARITIES.reduce((sum, r) => sum + r.weight, 0);
  let roll = rng() * total;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll < 0) return rarity;
  }
  return RARITIES[0];
}

function rollItem(slotKey, rarity, ilvl, rng) {
  const roll = (min, max) => min + rng() * (max - min);
  const rollInt = (min, max) => Math.floor(roll(min, max + 1));
  const stat = GEAR_SLOT_STATS[slotKey];
  const base = stat === 'damage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1;
  const amount = Math.max(1, Math.round(base * rarity.mult * roll(0.85, 1.15)));
  const item = { slot: slotKey, rarity: rarity.key, mult: rarity.mult, damage: 0, hp: 0, armor: 0, critChance: 0, lifeleech: 0, lifeleechFlat: 0, enhance: 0 };
  if (stat === 'damage') {
    item.damage = amount;
    const crit = CRIT_BY_RARITY[rarity.key];
    if (crit) item.critChance = rollInt(crit[0], crit[1]);
  } else {
    item.hp = amount;
    item.armor = Math.max(1, Math.round(amount * 0.4 * roll(0.85, 1.15)));
  }
  const pctRange = LIFELEECH_PCT_BY_RARITY[rarity.key];
  if (slotKey === 'waffe' && pctRange && rng() < LIFELEECH_CHANCE_BY_RARITY[rarity.key]) {
    if (rng() < LIFELEECH_PCT_ODDS) item.lifeleech = rollInt(pctRange[0], pctRange[1]);
    else {
      const flat = LIFELEECH_FLAT_BY_RARITY[rarity.key];
      item.lifeleechFlat = Math.max(1, Math.round((flat.base + ilvl * flat.ilvl) * roll(0.85, 1.15)));
    }
  }
  return item;
}

// Der denkende Spieler mag Sustain, krönt es aber nicht: Lifeleech zählt
// ein Viertel seines Waffenwerts.
const itemScore = (item) => {
  const leechBonus = (item.lifeleech > 0 || item.lifeleechFlat > 0) ? item.damage * 0.25 : 0;
  return item.damage * 2 + item.hp * 0.5 + item.armor + item.critChance * 3 + leechBonus;
};
const sellValue = (item, level) => Math.round(item.mult * (4 + level));

function worldFromParams(p, depthZones = 0) {
  const round3 = (v) => Number(v.toPrecision(3));
  const zones = [];
  const enemies = [];
  let normal = { ...p.baseNormal };
  for (let n = 0; n < 50; n += 1) {
    if (n > 0) {
      normal = {
        hp: round3(normal.hp * p.growth.hp),
        damage: Math.max(1, Math.round(normal.damage * p.growth.damage)),
        ash: round3(normal.ash * p.growth.ash),
        xp: round3(normal.xp * p.growth.xp),
      };
      if (n % 10 === 0) {
        normal.hp = round3(normal.hp * 1.12);
        normal.damage = Math.max(1, Math.round(normal.damage * 1.08));
      }
    }
    // Startzonen-Fundament — spiegelt src/data.js.
    const zoneNormal = n < (p.earlyHpBonusZones ?? 10)
      ? { ...normal, hp: round3(normal.hp + (p.earlyHpBonus ?? 12) * (1 - n / (p.earlyHpBonusZones ?? 10))) }
      : normal;
    const ilvl = Math.max(1, Math.round(p.ilvlBase * p.ilvlGrowth ** n * (n > 0 && n % 10 === 0 ? 1.15 : 1)));
    zones.push({ name: `Zone ${n + 1}`, ilvl });
    enemies.push({
      normal: zoneNormal,
      elite: {
        ...zoneNormal,
        hp: zoneNormal.hp * p.elite.hpMult,
        damage: Math.max(1, Math.round(normal.damage * p.elite.dmgMult)),
        ash: Math.round(normal.ash * p.elite.ashMult),
        xp: Math.round(normal.xp * p.elite.xpMult),
      },
      boss: {
        ...zoneNormal,
        hp: zoneNormal.hp * p.boss.hpMult,
        damage: Math.max(1, Math.round(zoneNormal.damage * p.boss.dmgMult)),
        ash: zoneNormal.ash * p.boss.ashMult,
        xp: zoneNormal.xp * p.boss.xpMult,
        boss: true,
      },
    });
  }
  const last = enemies[49];
  const depthGrowth = p.depth ?? p.growth;
  const step = (prev) => ({
    hp: round3(prev.hp * depthGrowth.hp),
    damage: Math.max(1, Math.round(prev.damage * depthGrowth.damage)),
    ash: round3(prev.ash * depthGrowth.ash),
    xp: round3(prev.xp * depthGrowth.xp),
  });
  let prevNormal = last.normal;
  for (let d = 1; d <= depthZones; d += 1) {
    const nextNormal = step(prevNormal);
    prevNormal = nextNormal;
    const ilvl = Math.max(1, Math.round(zones[49].ilvl * p.ilvlGrowth ** d));
    zones.push({ name: `Tiefe ${d}`, ilvl });
    enemies.push({
      normal: nextNormal,
      elite: { ...nextNormal, hp: nextNormal.hp * p.elite.hpMult, damage: Math.max(1, Math.round(nextNormal.damage * p.elite.dmgMult)), ash: Math.round(nextNormal.ash * p.elite.ashMult), xp: Math.round(nextNormal.xp * p.elite.xpMult) },
      boss: { ...nextNormal, hp: nextNormal.hp * p.boss.hpMult, damage: Math.max(1, Math.round(nextNormal.damage * p.boss.dmgMult)), ash: nextNormal.ash * p.boss.ashMult, xp: nextNormal.xp * p.boss.xpMult, boss: true },
    });
  }
  return { zones, enemies };
}

async function worldFromRealData() {
  const data = await import('../src/data.js');
  return { zones: data.ZONES, enemies: data.ZONE_ENEMIES, data };
}

// Deterministischer Zufall (mulberry32): Runs mit gleichem Seed sind
// vergleichbar — ohne Seedentscheidung war jede Abstimmung Glückssache.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = (() => {
  const flag = process.argv.indexOf('--seed');
  return flag > -1 ? Number(process.argv[flag + 1]) || 1234 : 1234;
})();

let rng = mulberry32(SEED);

function simulate(world, { depthTarget = 0 } = {}) {
  rng = mulberry32(SEED); // jeder Run deterministisch, Runs vergleichbar
  const totalZones = world.zones.length;
  const hero = {
    level: 1, xp: 0, maxHpBase: 35, damageBase: 2, armorBase: 0,
    hp: 35, ash: 0,
    gear: Object.fromEntries(SLOT_KEYS.map((k) => [k, null])),
    enhance: { waffe: 0, brust: 0 },
  };

  const statPts = { damage: 0, hp: 0, armor: 0, crit: 0 };
  let statPoints = 0;
  const gearStats = () => {
    const acc = { damage: 0, hp: 0, armor: 0, critChance: 0, lifeleech: 0, lifeleechFlat: 0 };
    for (const key of SLOT_KEYS) {
      const item = hero.gear[key];
      if (!item) continue;
      acc.damage += item.damage;
      acc.hp += item.hp;
      acc.armor += item.armor;
      acc.critChance += item.critChance;
      acc.lifeleech += item.lifeleech;
      acc.lifeleechFlat += item.lifeleechFlat;
    }
    acc.damage += hero.enhance.waffe > 0
      ? Math.max(1, Math.round((1 + 0.5 * craftIlvl()) * (1 + 0.4 * (hero.enhance.waffe - 1))))
      : 0;
    if (hero.enhance.brust > 0) {
      const bonus = Math.max(1, Math.round((4 + 2.5 * craftIlvl()) * (1 + 0.4 * (hero.enhance.brust - 1))));
      acc.hp += bonus;
      acc.armor += Math.max(1, Math.round(bonus * 0.4));
    }
    return acc;
  };
  const craftIlvl = () => world.zones[Math.min(cleared, 49)].ilvl;

  let cleared = 0;
  let zone = 0;
  let zoneKills = 0;
  let kills = 0;
  let deaths = 0;
  let maxTracked = 0;
  let enhanceSpent = 0;

  const skills = () => skillProfile(hero.level);
  const heroDamage = () => {
    const s = gearStats();
    const sk = skills();
    return Math.round((hero.damageBase + s.damage + statPts.damage) * (1 + (sk.damagePct) / 100));
  };
  const heroMaxHp = () => {
    const s = gearStats();
    const sk = skills();
    return Math.round((hero.maxHpBase + s.hp + statPts.hp * 5) * (1 + sk.hpPct / 100));
  };
  const heroArmor = () => {
    const s = gearStats();
    const sk = skills();
    return Math.round((hero.armorBase + s.armor + statPts.armor) * 1);
  };
  const critChance = () => Math.min(CRIT_CHANCE_CAP, BASE_CRIT_CHANCE + statPts.crit + gearStats().critChance + skills().crit);
  const attackSpeed = () => BASE_ATTACK_SPEED + skills().speed / 100;
  const avgHit = () => heroDamage() * (1 + (critChance() / 100) * (CRIT_MULTIPLIER + skills().critDmg / 100 - 1));
  const heroLeech = () => ({ pct: gearStats().lifeleech, flat: gearStats().lifeleechFlat });

  const gainXp = (raw) => {
    const amount = Math.round(raw * (1 + skills().xp / 100));
    hero.xp += amount;
    // Schnellsprung (Summe der Levelbedarfe ≈ 3·L³ bei 9L²+13L), damit
    // Riesensprünge nicht millionenfach iterieren; danach fein per While.
    if (hero.xp > 1e4 * xpNeeded(hero.level)) {
      hero.level = Math.max(hero.level + 1, Math.floor(Math.cbrt(hero.xp / 3)));
      hero.xp = Math.min(hero.xp, xpNeeded(hero.level) * 4);
    }
    let leveled = false;
    let guard = 0;
    while (hero.xp >= xpNeeded(hero.level) && guard < 100000) {
      hero.xp -= xpNeeded(hero.level);
      hero.level += 1;
      statPoints += STAT_POINTS_PER_LEVEL;
      leveled = true;
      guard += 1;
    }
    if (leveled) {
      hero.hp = heroMaxHp();
      // 2 Punkte pro Stufe: 1 Schaden, 1 Lebenskraft.
      statPts.damage += 1;
      statPts.hp += 1;
      statPoints -= 2;
    }
  };

  const equip = (item) => {
    const current = hero.gear[item.slot];
    if (!current || itemScore(item) > itemScore(current)) {
      hero.gear[item.slot] = item;
      if (current) sellCurrent(current);
      hero.hp = Math.min(hero.hp, heroMaxHp());
    } else {
      sellCurrent(item);
    }
  };
  const sellCurrent = (item) => { hero.ash += sellValue(item, hero.level); };
  const trimInventory = () => { /* Sim hält nur Best-in-Slot; Rest wird sofort verkauft */ };

  const onDrop = (type, ilvl) => {
    if (rng() >= (DROP_CHANCES[type] ?? 0)) return;
    const slotKey = SLOT_KEYS[Math.floor(rng() * SLOT_KEYS.length)];
    equip(rollItem(slotKey, rollRarity(rng), ilvl, rng));
    trimInventory();
  };

  const buyUpgrades = () => {
    // Klinge schärfen / Haut härten gibt es nicht mehr — Asche fließt nur
    // noch in die Werkstatt (Verstärken und Umschmieden).
    for (let guard = 0; guard < 200; guard += 1) {
      const enhanceCost = hero.gear.waffe
        ? Math.round(30 * 1.6 ** (hero.enhance.waffe + 1) * (1 + 0.25 * craftIlvl()))
        : Infinity;
      // Werkstatt: Der denkende Spieler schmiedet die Waffe nach oben —
      // auf dem Weg zu Episch/Legendär rollt sie auch neues Lifeleech.
      const weaponIndex = hero.gear.waffe ? RARITIES.findIndex((r) => r.key === hero.gear.waffe.rarity) : -1;
      const reforgeCost = weaponIndex >= 0 && weaponIndex < RARITIES.length - 1
        ? Math.round(REFOrge_BASES[weaponIndex] * (1 + 0.4 * craftIlvl()))
        : Infinity;
      const reforgeValue = Number.isFinite(reforgeCost)
        ? (0.55 * craftIlvl()) / Math.max(1, reforgeCost) // Raritätssprung ist ~55 % Waffenwert wert
        : 0;
      const options = [
        { kind: 'enh', cost: enhanceCost, value: (0.2 * craftIlvl()) / Math.max(1, enhanceCost) },
        { kind: 'reforge', cost: reforgeCost, value: reforgeValue },
      ].filter((o) => o.cost <= hero.ash);
      if (!options.length) return;
      options.sort((a, b) => b.value - a.value);
      const best = options[0];
      hero.ash -= best.cost;
      if (best.kind === 'enh') { hero.enhance.waffe += 1; enhanceSpent += best.cost; }
      else {
        // Umschmieden: Werte neu würfeln, eine Stufe höher.
        const slotKey = 'waffe';
        const next = RARITIES[weaponIndex + 1];
        Object.assign(hero.gear[slotKey], rollItem(slotKey, next, craftIlvl(), rng));
        if (next.key === 'legendär') hero.gear[slotKey].mastery = null; // Meisterschaft modelliert der Sim nicht
      }
    }
  };

  const fight = (type) => {
    // Der denkende Spieler geht bei zaghafter Lebenskraft kurz zum Schrein:
    // Rückweg + Rast + Rückkehr kostet ~30 s, heilt aber gratis voll.
    if (hero.hp < heroMaxHp() * 0.4) {
      totalSeconds += 30;
      hero.hp = heroMaxHp();
    }
    const base = world.enemies[Math.min(zone, world.enemies.length - 1)][type];
    const prof = profileOf(zone, type);
    const def = {
      ...base,
      hp: Math.max(1, Math.round(base.hp * prof.hp)),
      damage: Math.max(1, Math.round(base.damage * prof.damage)),
    };
    maxTracked = Math.max(maxTracked, def.hp, def.ash, def.xp);
    // Erwartete Treffer: HERO_MISS_CHANCE der eigenen Schläge geht daneben.
    const hits = Math.max(1, Math.ceil(def.hp / avgHit())) / (1 - HERO_MISS_CHANCE);
    const seconds = hits * (ATTACK_INTERVAL_MS / 1000) / attackSpeed();
    if (!Number.isFinite(seconds) && !debugged) {
      debugged = true;
      console.error(`⚠ NaN bei Zone ${zone + 1} (${type}): def.hp=${def.hp} avgHit=${avgHit()} heroDamage=${heroDamage()} speed=${attackSpeed()} ash=${hero.ash} level=${hero.level} enhanceW=${hero.enhance.waffe} craftIlvl=${craftIlvl()}`);
    }
    const intervalS = (ATTACK_INTERVAL_MS / 1000) * prof.interval;
    let swings = Math.max(0, Math.floor(seconds / intervalS) - 1);
    // Enrage: im letzten HP-Drittel greift der Boss schneller an.
    if (def.boss) swings = Math.round(swings * (1 - ENRAGE_THRESHOLD + ENRAGE_THRESHOLD / ENRAGE_INTERVAL_MULT));
    const armor = heroArmor();
    // Rüstung mindert höchstens die Hälfte — spiegelt src/game.js.
    const reduction = Math.min(0.5, armor / (armor + ARMOR_RESISTANCE * def.damage));
    const taken = Math.max(1, Math.round(def.damage * (1 - reduction)));
    // Erwartungswert: ENEMY_MISS_CHANCE der Gegner-Schläge geht daneben.
    const dmgTaken = swings * taken * (1 - ENEMY_MISS_CHANCE);
    // Lifeleech heilt anteilig am verursachten Schaden (≈ Gegner-Leben).
    // Lifeleech: Prozent des verursachten Schadens (≈ Gegner-Leben) plus
    // fester Anteil pro eigenen Treffer.
    const healed = Math.round(def.hp * (heroLeech().pct / 100)) + heroLeech().flat * hits;
    if (process.env.SIM_DEBUG && zone >= 30) {
      console.error(`Z${zone + 1} ${type}: hp=${(hero.hp / 1e6).toFixed(2)}M/${(heroMaxHp() / 1e6).toFixed(2)}M swings=${swings} taken=${(taken / 1e3).toFixed(0)}k dmgTaken=${(dmgTaken / 1e6).toFixed(2)}M healed=${(healed / 1e6).toFixed(2)}M leech=${heroLeech().pct.toFixed(1)}%+${heroLeech().flat.toFixed(0)} armor=${(armor / 1e3).toFixed(0)}k red=${(reduction * 100).toFixed(1)}%`);
    }
    maxTracked = Math.max(maxTracked, hero.ash + def.ash, hero.xp + def.xp);
    if (dmgTaken - healed >= hero.hp) {
      deaths += 1;
      hero.ash -= Math.min(hero.ash, Math.round(hero.ash * DEATH_ASH_PENALTY));
      hero.hp = heroMaxHp();
      return { killed: false, seconds: seconds + 2 };
    }
    hero.hp = Math.min(heroMaxHp(), hero.hp - dmgTaken + healed);
    kills += 1;
    zoneKills += 1;
    hero.ash += Math.round(def.ash * (1 + skills().ash / 100));
    // Gegner unter dem Helden-Niveau tragen weniger bis keine Erfahrung bei —
    // Stufen steigen 3 pro Gebiet: Normal 3N−2, Elite +2, Boss +4.
    const enemyLevel = zone * 3 + 1 + (type === 'boss' ? 4 : type === 'elite' ? 2 : 0);
    gainXp(def.xp * enemyXpMultiplier(enemyLevel, hero.level));
    onDrop(type, world.zones[Math.min(zone, world.zones.length - 1)].ilvl);
    buyUpgrades();
    if (def.boss) cleared = Math.max(cleared, zone + 1);
    return { killed: true, seconds: seconds + ENEMY_RESPAWN_S };
  };

  const report = [];
  let totalSeconds = 0;
  let debugged = false;
  const zoneDeaths = { count: 0 };

  for (zone = 0; zone < totalZones; zone += 1) {
    zoneKills = 0;
    zoneDeaths.count = 0;
    const zoneStart = totalSeconds;
    const killsBefore = kills;
    hero.hp = heroMaxHp();

    let guard = 0;
    while (cleared <= zone && guard < 20000) {
      guard += 1;
      const stuck = zoneDeaths.count > 15 || guard > 8000;
      if (stuck && zone > 0) {
        // Überfarmen: in der letzten freigespielten Zone Grinder, dann zurück.
        const returnZone = zone;
        zone = zone - 1;
        zoneKills = 0;
        for (let i = 0; i < 50; i += 1) fight('normal');
        zone = returnZone;
        zoneKills = 0;
        zoneDeaths.count = Math.max(0, zoneDeaths.count - 5);
        continue;
      }
      const type = zoneKills >= BOSS_AFTER_KILLS ? 'boss' : (zoneKills > 0 && zoneKills % ELITE_EVERY_KILLS === 0 ? 'elite' : 'normal');
      const result = fight(type);
      totalSeconds += result.seconds;
      if (!result.killed) zoneDeaths.count += 1;
    }

    report.push({
      zone: zone + 1,
      name: world.zones[zone].name,
      kills: kills - killsBefore,
      deaths: zoneDeaths.count,
      minutes: (totalSeconds - zoneStart) / 60,
      ilvl: world.zones[zone].ilvl,
      level: hero.level,
      killTimeNormal: (() => {
        const def = world.enemies[zone].normal;
        const prof = profileOf(zone, 'normal');
        return Math.max(1, Math.ceil(def.hp * prof.hp / avgHit())) * 1.5 / attackSpeed() / (1 - HERO_MISS_CHANCE);
      })(),
    });
    if (zone + 1 === 50 && depthTarget === 0) break;
  }

  return {
    report,
    totals: {
      hours: totalSeconds / 3600,
      kills,
      deaths,
      level: hero.level,
      ash: Math.round(hero.ash),
      maxTracked,
      precisionSafe: maxTracked < Number.MAX_SAFE_INTEGER,
      enhanceSpent: Math.round(enhanceSpent),
      damage: heroDamage(),
      maxHp: heroMaxHp(),
      armor: heroArmor(),
    },
  };
}

const fmt = (v) => {
  if (!Number.isFinite(v)) return '∞';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return `${Math.round(v)}`;
};

function printResult(label, result, { verbose = false } = {}) {
  const { report, totals } = result;
  console.log(`\n=== ${label} ===`);
  if (verbose) {
    console.log('Zone | Kill(s) | Zeit | Tod | ilvl | Lvl | Killzeit normal');
    for (const r of report) {
      console.log(
        `${String(r.zone).padStart(4)} | ${String(r.kills).padStart(6)} | ${r.minutes.toFixed(1).padStart(5)} min | ${String(r.deaths).padStart(3)} | ${fmt(r.ilvl).padStart(6)} | ${fmt(r.level).padStart(5)} | ${r.killTimeNormal.toFixed(1)}s`
      );
    }
  }
  const slowest = Math.max(...report.map((r) => r.killTimeNormal));
  const overfarm = report.reduce((s, r) => s + Math.max(0, r.kills - 34), 0);
  console.log(
    `→ ${totals.hours.toFixed(1)} h bis Ziel · Tode ${totals.deaths} · langsamste Killzeit ${slowest.toFixed(1)}s · Überfarm-Kills ${overfarm} · Level ${fmt(totals.level)} · Schaden ${fmt(totals.damage)} · ${totals.precisionSafe ? 'Zahlen präzise ✓' : '⚠ 2^53 überschritten'}`
  );
  if (!totals.precisionSafe) console.log(`  (größter Wert ${totals.maxTracked.toExponential(2)})`);
}

const args = process.argv.slice(2);
const verbose = args.includes('-v') || args.includes('--verbose');
const verify = args.includes('--verify');
const depths = args.includes('--depths');
const sweep = args.includes('--sweep');

const PRESET_SHAPE = {
  baseNormal: { hp: 20, damage: 1, ash: 4, xp: 10 },
  elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
  boss: { hpMult: 4.2, dmgMult: 1.55, ashMult: 10, xpMult: 8 },
  ilvlBase: 2, ilvlGrowth: 1.29,
};

if (sweep) {
  console.log('hp  | dmg  | Zeit  | maxKill | Tod | Überfarm | Level');
  for (let hp = 1.34; hp <= 1.52 + 1e-9; hp += 0.03) {
    for (let dmg = 1.22; dmg <= 1.34 + 1e-9; dmg += 0.04) {
      const params = {
        ...PRESET_SHAPE,
        growth: { hp, damage: dmg, ash: hp + 0.08, xp: hp - 0.02 },
      };
      const r = simulate(worldFromParams(params));
      const slowest = Math.max(...r.report.map((row) => row.killTimeNormal));
      const overfarm = r.report.reduce((s, row) => s + Math.max(0, row.kills - 34), 0);
      console.log(
        `${hp.toFixed(2)} | ${dmg.toFixed(2)} | ${r.totals.hours.toFixed(1).padStart(4)} h | ${slowest.toFixed(1).padStart(6)}s | ${String(r.totals.deaths).padStart(3)} | ${String(overfarm).padStart(6)} | ${fmt(r.totals.level)}`
      );
    }
  }
} else if (verify) {
  const world = await worldFromRealData();
  const result = simulate(world, { depthTarget: depths ? 30 : 0 });
  printResult(`Echte data.js${depths ? ' inkl. Tiefen-Simulation' : ''}`, result, { verbose });
} else {
  const presets = {
    A: {
      baseNormal: { hp: 20, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.4, damage: 1.24, ash: 1.48, xp: 1.15 },
      depth: { hp: 1.4, damage: 1.30, ash: 1.48, xp: 1.12 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4.2, dmgMult: 1.55, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.29,
    },
    B: {
      baseNormal: { hp: 20, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.37, damage: 1.26, ash: 1.44, xp: 1.13 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4.2, dmgMult: 1.55, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.29,
    },
    C: {
      baseNormal: { hp: 20, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.42, damage: 1.28, ash: 1.52, xp: 1.17 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4.2, dmgMult: 1.55, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.29,
    },
  };
  for (const [name, params] of Object.entries(presets)) {
    const world = worldFromParams(params, depths ? 30 : 0);
    printResult(`Kandidat ${name}`, simulate(world, { depthTarget: depths ? 30 : 0 }), { verbose });
  }
}
