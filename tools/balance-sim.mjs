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
  { key: 'gewoehnlich', mult: 1, weight: 70 },
  { key: 'selten', mult: 2, weight: 25 },
  { key: 'episch', mult: 4, weight: 5 },
];

const DROP_CHANCES = { normal: 0.02, elite: 0.15, boss: 1 };

const xpNeeded = (level) => Math.round(4 * level * level + 6 * level);
const upgradeCost = (base, ups) => Math.round(base * 1.6 ** ups);

// Richtlinien-Annahmen für "einen denkenden Spieler" (bewusst grob):
// Skillpunkte wirken als pro Level anwachsende Prozent-Boni mit Deckeln,
// Statpunkte werden im Verhältnis 2 Schaden : 1 Lebenskraft verteilt und
// jede 10. Verteilung geht in Rüstung, Asche wird nach Grenznutzen ausgegeben.
const skillProfile = (level) => ({
  damagePct: Math.min(2 * level, 160),
  hpPct: Math.min(1.2 * level, 100),
  armor: Math.min(0.5 * level, 60),
  crit: Math.min(0.2 * level, 12),
  critDmg: Math.min(0.6 * level, 60),
  speed: Math.min(0.15 * level, 15),
  ash: Math.min(0.3 * level, 30),
  xp: Math.min(0.3 * level, 30),
});

function rollRarity(rng) {
  const total = RARITIES.reduce((sum, r) => sum + r.weight, 0);
  let roll = rng() * total;
  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll < 0) return rarity;
  }
  return RARITIES[0];
}

function rollItem(slotKey, rarity, ilvl) {
  const stat = GEAR_SLOT_STATS[slotKey];
  const base = stat === 'damage' ? 1 + ilvl * 0.4 : 4 + ilvl * 1.1;
  const amount = Math.max(1, Math.round(base * rarity.mult));
  const item = { slot: slotKey, rarity: rarity.key, mult: rarity.mult, damage: 0, hp: 0, armor: 0, critChance: 0, enhance: 0 };
  if (stat === 'damage') {
    item.damage = amount;
    if (rarity.key === 'selten') item.critChance = 5;
    if (rarity.key === 'episch') item.critChance = 10;
  } else {
    item.hp = amount;
    item.armor = Math.max(1, Math.round(amount * 0.4));
  }
  return item;
}

const itemScore = (item) => item.damage * 2 + item.hp * 0.5 + item.armor + item.critChance * 3;
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
    const ilvl = Math.max(1, Math.round(p.ilvlBase * p.ilvlGrowth ** n * (n > 0 && n % 10 === 0 ? 1.15 : 1)));
    zones.push({ name: `Zone ${n + 1}`, ilvl });
    enemies.push({
      normal,
      elite: {
        ...normal,
        hp: normal.hp * p.elite.hpMult,
        damage: Math.max(1, Math.round(normal.damage * p.elite.dmgMult)),
        ash: Math.round(normal.ash * p.elite.ashMult),
        xp: Math.round(normal.xp * p.elite.xpMult),
      },
      boss: {
        ...normal,
        hp: normal.hp * p.boss.hpMult,
        damage: Math.max(1, Math.round(normal.damage * p.boss.dmgMult)),
        ash: normal.ash * p.boss.ashMult,
        xp: normal.xp * p.boss.xpMult,
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

function simulate(world, { depthTarget = 0 } = {}) {
  const totalZones = world.zones.length;
  const hero = {
    level: 1, xp: 0, maxHpBase: 30, damageBase: 2, armorBase: 0,
    hp: 30, damageUps: 0, hpUps: 0, ash: 0,
    gear: Object.fromEntries(SLOT_KEYS.map((k) => [k, null])),
    enhance: { waffe: 0, brust: 0 },
  };

  const statPts = { damage: 0, hp: 0, armor: 0, crit: 0 };
  let statPoints = 0;
  const gearStats = () => {
    const acc = { damage: 0, hp: 0, armor: 0, critChance: 0 };
    for (const key of SLOT_KEYS) {
      const item = hero.gear[key];
      if (!item) continue;
      acc.damage += item.damage;
      acc.hp += item.hp;
      acc.armor += item.armor;
      acc.critChance += item.critChance;
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
  const critChance = () => BASE_CRIT_CHANCE + statPts.crit + gearStats().critChance + skills().crit;
  const attackSpeed = () => BASE_ATTACK_SPEED + skills().speed / 100;
  const avgHit = () => heroDamage() * (1 + (critChance() / 100) * (CRIT_MULTIPLIER + skills().critDmg / 100 - 1));

  const gainXp = (raw) => {
    const amount = Math.round(raw * (1 + skills().xp / 100));
    hero.xp += amount;
    // Schnellsprung (Summe der Levelbedarfe ≈ 4/3·L³), damit Riesensprünge
    // nicht millionenfach iterieren; danach fein per While.
    if (hero.xp > 1e4 * xpNeeded(hero.level)) {
      hero.level = Math.max(hero.level + 1, Math.floor(Math.cbrt((3 * hero.xp) / 4)));
      hero.xp = Math.min(hero.xp, xpNeeded(hero.level) * 4);
    }
    let leveled = false;
    let guard = 0;
    while (hero.xp >= xpNeeded(hero.level) && guard < 100000) {
      hero.xp -= xpNeeded(hero.level);
      hero.level += 1;
      statPoints += 3;
      leveled = true;
      guard += 1;
    }
    if (leveled) {
      hero.hp = heroMaxHp();
      for (let i = 0; i < 2; i++) if (statPoints > 0) { statPts.damage += 1; statPoints -= 1; }
      if (statPoints > 0) { statPts.hp += 1; statPoints -= 1; }
      if (hero.level % 10 === 0 && statPoints > 0) { statPts.hp += 1; statPoints -= 1; }
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
    if (Math.random() >= (DROP_CHANCES[type] ?? 0)) return;
    const slotKey = SLOT_KEYS[Math.floor(Math.random() * SLOT_KEYS.length)];
    equip(rollItem(slotKey, rollRarity(Math.random), ilvl));
    trimInventory();
  };

  const buyUpgrades = () => {
    for (let guard = 0; guard < 200; guard += 1) {
      const dmgCost = upgradeCost(10, hero.damageUps);
      const hpCost = upgradeCost(15, hero.hpUps);
      const enhanceCost = hero.gear.waffe
        ? Math.round(30 * 1.6 ** (hero.enhance.waffe + 1) * (1 + 0.25 * craftIlvl()))
        : Infinity;
      const options = [
        { kind: 'dmg', cost: dmgCost, value: 1 / dmgCost },
        { kind: 'hp', cost: hpCost, value: 5 / hpCost },
        { kind: 'enh', cost: enhanceCost, value: (0.2 * craftIlvl()) / Math.max(1, enhanceCost) },
      ].filter((o) => o.cost <= hero.ash);
      if (!options.length) return;
      options.sort((a, b) => b.value - a.value);
      const best = options[0];
      hero.ash -= best.cost;
      if (best.kind === 'dmg') { hero.damageUps += 1; hero.damageBase += 1; }
      else if (best.kind === 'hp') { hero.hpUps += 1; hero.maxHpBase += 5; hero.hp += 5; }
      else { hero.enhance.waffe += 1; enhanceSpent += best.cost; }
    }
  };

  const fight = (type) => {
    const def = world.enemies[Math.min(zone, world.enemies.length - 1)][type];
    maxTracked = Math.max(maxTracked, def.hp, def.ash, def.xp);
    const hits = Math.max(1, Math.ceil(def.hp / avgHit()));
    const seconds = hits * (ATTACK_INTERVAL_MS / 1000) / attackSpeed();
    if (!Number.isFinite(seconds) && !debugged) {
      debugged = true;
      console.error(`⚠ NaN bei Zone ${zone + 1} (${type}): def.hp=${def.hp} avgHit=${avgHit()} heroDamage=${heroDamage()} speed=${attackSpeed()} ash=${hero.ash} level=${hero.level} enhanceW=${hero.enhance.waffe} craftIlvl=${craftIlvl()}`);
    }
    const swings = Math.max(0, Math.floor(seconds / (ATTACK_INTERVAL_MS / 1000) - 1));
    const armor = heroArmor();
    const reduction = armor / (armor + ARMOR_RESISTANCE * def.damage);
    const taken = Math.max(1, Math.round(def.damage * (1 - reduction)));
    const dmgTaken = swings * taken;
    maxTracked = Math.max(maxTracked, hero.ash + def.ash, hero.xp + def.xp);
    if (dmgTaken >= hero.hp) {
      deaths += 1;
      hero.hp = heroMaxHp();
      return { killed: false, seconds: seconds + 2 };
    }
    hero.hp -= dmgTaken;
    kills += 1;
    zoneKills += 1;
    hero.ash += Math.round(def.ash * (1 + skills().ash / 100));
    gainXp(def.xp);
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
        return Math.max(1, Math.ceil(def.hp / avgHit())) * 1.5 / attackSpeed();
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
  baseNormal: { hp: 10, damage: 1, ash: 4, xp: 30 },
  elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
  boss: { hpMult: 4, dmgMult: 1.5, ashMult: 10, xpMult: 8 },
  ilvlBase: 2, ilvlGrowth: 1.28,
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
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 30 },
      growth: { hp: 1.4, damage: 1.26, ash: 1.48, xp: 1.38 },
      depth: { hp: 1.4, damage: 1.24, ash: 1.48, xp: 1.12 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4, dmgMult: 1.5, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.28,
    },
    B: {
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 30 },
      growth: { hp: 1.37, damage: 1.26, ash: 1.44, xp: 1.35 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4, dmgMult: 1.5, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.28,
    },
    C: {
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 30 },
      growth: { hp: 1.42, damage: 1.28, ash: 1.52, xp: 1.4 },
      elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
      boss: { hpMult: 4, dmgMult: 1.5, ashMult: 10, xpMult: 8 },
      ilvlBase: 2, ilvlGrowth: 1.28,
    },
  };
  for (const [name, params] of Object.entries(presets)) {
    const world = worldFromParams(params, depths ? 30 : 0);
    printResult(`Kandidat ${name}`, simulate(world, { depthTarget: depths ? 30 : 0 }), { verbose });
  }
}
