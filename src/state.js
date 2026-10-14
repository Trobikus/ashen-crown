import { GEAR_SLOTS } from './data.js';

const SAVE_KEY = 'ashen-crown-save';

const SETTINGS_KEY = 'ashen-crown-settings';

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
  crownWon: false,
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

export { SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, settings, state };
