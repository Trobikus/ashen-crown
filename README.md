<div align="center">
  <img src="docs/banner.svg" alt="Ashen Crown" width="840" />

  ### An incremental dark-fantasy idle RPG — Web & Desktop

  You wake in the ash. The fight runs by itself, the decisions are yours:
  hunt creatures, gather ash, forge your hero — and descend area by area until,
  at the end of the void, the Ashen Crown itself rises to meet you.

  **[ ▶ Play in your browser ](https://trobikus.github.io/ashen-crown/)** ·
  **[ ⬇ Download the desktop build ](releases)**

  [![Version](https://img.shields.io/github/v/release/Trobikus/ashen-crown?include_prereleases&label=Alpha&color=C14B3A)](releases)
  [![CI](https://img.shields.io/badge/CI-balance-sim-%2B-smoke-green)](../../actions/workflows/ci.yml)
  [![Lizenz](https://img.shields.io/badge/License-proprietary--all-rights-reserved-C14B3A)](LICENSE)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
  [![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
  [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.de/en-US/docs/Web/JavaScript)
  [![pnpm](https://img.shields.io/badge/pnpm-package-manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

  *🧪 Closed alpha — updates install themselves inside the game.*
</div>

---

> **Note:** Ashen Crown is a closed alpha, playable in **German and English** —
> the game follows your operating system's language and can be switched any time
> under options → display (English localization includes all UI text, enemy names,
> areas, items and lore). The sections below describe the game in English and keep
> German proper nouns where they carry flavor.

## 🖼️ Screenshots

<div align="center">
  <a href="docs/screenshots/kampf.png"><img src="docs/screenshots/kampf.png" alt="Combat in the arena" width="760" /></a>
</div>

| Skill tree | Areas |
| :---: | :---: |
| <a href="docs/screenshots/skilltree.png"><img src="docs/screenshots/skilltree.png" alt="The skill tree" width="100%" /></a> | <a href="docs/screenshots/gebiete.png"><img src="docs/screenshots/gebiete.png" alt="The area map" width="100%" /></a> |

## 📊 The game in numbers

| 🌍 | 🗺️ | ⚔️ | 🌳 | 🏆 | 🌌 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **5**<br>continents | **50**<br>areas | **163**<br>creatures | **217**<br>skill nodes | **31**<br>achievements | **∞**<br>Ashen Depths |

## 🕯️ The game

Ashen Crown is an idle RPG: the combat plays itself, the decisions are yours.
Hunt creatures, gather ash, sharpen blade and skin, equip your loot — and descend
area by area until the Ashen Crown itself waits at the end of the void. Because
the ash remembers — every realm that tried to escape it before you.

## ⚙️ Systems that interlock

### ⚔️ Combat & zones

- **Auto-combat & zones** — **5 continents** with **10 areas** each, and behind
  them the endless **Ashen Depths**. Every area carries its own bestiary of three
  creatures — **150 enemies in total**, from the ash rat to the Ashen Crown. Each
  level pits you against a boss after 30 victories; his fall opens the door into
  the depths. Every zone fights with its own temperament (*Swift* or *Massive*),
  bosses fall into **enrage** below 35 % health — and every enemy wears the color
  of its continent. Combat is craft: **enemies swing wide occasionally** (15 %),
  your hero misses too (12 %), crit chance caps at 75 %, and armor never reduces
  more than half — at least 50 % of every hit gets through.
- **The arena is a stage** — Seven hand-drawn silhouette sprites (minion, beast,
  knight, cultist, shade, colossus, regent) fight on a continent-tinted stage
  with ground shadows: bosses wear the golden crown, elites glow with a golden
  rim, enrage lights their eyes. Sparks on impact, the swing arc and ghost trails
  on the health bars make every hit readable.
- **The enemy inspector** — Hover an enemy to see its level, damage per hit,
  attack tempo, temperament and the damage reduction your armor is currently
  providing. And when it goes wrong anyway, the **death recap** names your slayer
  with hit count and total damage: you always know why you died.
- **The shrine breathes — and keeps count** — In the field your hero never heals
  on his own; resting at the shrine does (2 % per second), and whoever departs
  takes their health along as it is. If you die, you wake with a quarter of your
  health — and the ash keeps 15 % of your stock as toll.
- **Experience only from the worthy** — Enemies below your level contribute less,
  none at all 20 levels down. And some bosses are genuine **walls**: then it's
  back to farm ash and loot, forge better gear — and show them again. Your hero
  grows along the way: he stays permanently just a few levels below his enemies.
- **(Languages)** Play in German or English — the game starts in your system's
  language (option: auto/de/en under options → display), and everything translates
  live: UI, enemy names, areas, items, skills, lore and number formats.

### 🌳 Skill tree

**217 nodes** in the Path-of-Exile style: four paths (Krieg/war, Haut/skin, Asche/
ash, Geist/spirit) with small passives, notables and **12 keystones with
tradeoffs**. **12 bridges** connect the paths — for hybrid builds that exist
exactly once. The tree **awakens at level 20** — only then do rune points come
in, and its values are deliberately dampened. And it demands commitment:
**at most two paths awaken at the same time** — the others seal themselves until
a respec reopens them.

### 🗡️ Loot & inventory

- **7 armor slots, 5 rarities** (Common → Magic → Rare → Epic → Legendary) across
  **35 item bases** in the Diablo tradition: blade to scythe, breastplate to full
  plate — higher bases unlock by item level and shape the primary stat. Every
  rarity buys affix slots, every piece **rolls its own values** — the perfect
  exemplar is a find, not a calculation (hold Alt to see the roll ranges).
- **Loot is an event** — The first elite kill of an area guarantees a piece, the
  boss fights with a 75 % find chance, regular enemies stay the rare luck.
  Lifeleech exists exclusively on epic and legendary weapons.
- **Gear that remembers** — Every equipped piece counts its kills per creature
  family (the seven silhouette types); each 100 kills against a family grant
  +1 % damage against it, up to +3 % per piece. Reinforcing and reforging
  reroll the values, never the memory — a blade’s biography travels with the
  metal, offline hunts included.
- **Convenience on request** — **Auto-door** (after the boss falls, the door
  moves on by itself), **auto-sell** (loot below a chosen rarity turns into ash
  on pickup), plus sorting and "equip best". Legendary pieces carry a golden
  **mastery** — percentage bonuses that exist nowhere else on gear.

### 🏺 The workshop

The workshop turns ash into power: equipment levels are **reinforced** (a steep
cost curve per level) or **reforged** (a rarity upgrade with fresh rolls that
never lowers item level). The golden mastery can be **re-forged** for plenty of
ash — the endgame hunt for the perfect roll. And in the hero screen, distributed
**stat points can be respecced**: all points back, nothing stays baked in.
Everything scales with the deepest conquered level.

### 🏆 Glory, achievements & knowledge

- **Achievements & glory** — **31 awards** from hunting, deaths, playtime, loot
  and realm progress pay out **Glory (Ruhm)**, a currency earned only by doing.
  In the **Glory shop** you buy permanent conveniences: **Beutelschein**
  (+inventory slots), **Zollerlass** (−death toll), **Aschesegen** (+ash gain),
  **Tiefenkunde** (+offline progress) and **Werkstatthandwerk** (−workshop
  costs). The shop costs more in total than glory ever exists — glory stays a
  decision, not a checklist.
- **Bestiary & statistics** — **163 creatures** in the chronicle's sibling: slain
  ones are unveiled, the unslain stay sealed as "???". The statistics page counts
  playtime, deaths, loot by rarity and your deepest success — the ash forgets
  nothing.

### 🌌 Beneath the throne: the Ashen Depths

Behind the victory waits the endgame: procedurally deepening **Ashen Depths**
with their own roster of enemies. The first boss of every depth leaves behind a
guaranteed **depth relic** — a legendary piece at depth item level with secured
lifeleech and **two masteries**. The second mastery can be **re-forged for 2
glory**: cheap, unlimited, the endgame hunt.

### 🔁 Awaken anew: the Throne

After the first crown victory, the hub tile **"Der Thron" (the throne)** opens —
there, where the crown rests. Every completed run pays **Crown Ash
(Kronenasche)**: 1 for the raised crown, +1 for every full 5 conquered Ashen
Depths. It is the second, recurring meta-currency besides glory — and it works
without being spent: **every piece of Crown Ash earned blesses all future runs**
with +3 % ash & experience, lifelong, independent of what you invest.

It is spent in the **Legacy (Vermächtnis)** on six tiered titles (3 levels each,
36 Crown Ash in total — the set fills over several runs, the order is yours):

| Title | Effect per level |
| --- | --- |
| *Zweiter Atem* | +5 % health & damage on the hero's base value |
| *Aschengeist* | +5 % experience |
| *Beutelspähler* | +5 % ash gain |
| *Alter Pfad* | Awaken with +2 free stat points |
| *Tiefenwissen* | +10 % elite/boss find chance |
| *Der Vorbereitete* | Awaken with 25 ash |

**The Ash Echo** — every awakening leaves an *Ash Echo* of the finished run
(name, level, attack tempo, and its blade with all its kill memory) waiting in
the area where that run peaked. It manifests there mid-area and defends the
zone until broken — a boss-tier duel against who you used to be, self-balanced
on the area’s own curve. Breaking it pays **+1 Crown Ash** and leaves its
blade behind: an **Echo Relic**, a legendary at that area’s item level with
secured lifeleech, one mastery — and the previous run’s kill memory. The area
map marks the waiting echo; the chronicle tells its story.

**Awaken anew** resets the run — zone & areas, hero (level, XP, stat points,
runes & path binding), ash, equipment & inventory. What stays: the whole
**glory ecosystem**, **Crown Ash & Legacy**, **bestiary, chronicle &
statistics**. The throne shows a verfall/bleibt (fades/keeps) preview first and
wants the decision twice — only the second click performs the awakening. You
read the continent annals once more; the ash remembers everything else.

### 🌙 Chronicle, sound & comfort

- **Chronicle & lore** — The ash remembers: an intro tale on awakening, an annal
  per continent on first entry, an epitaph above each of the **50 conquered
  bosses** and whispers from the depths — all collected at the shrine.
- **Sound & feedback** — Procedural sound from the Web Audio API (no assets):
  hits, crits, bosses, loot, level-ups, enrage, plus a dark ambient drone that
  thickens with intensity layers across descent, hub, victory and prestige —
  with sliders for master, effects and music. Damage numbers, hit flashes and
  toasts can be toggled separately.
- **Offline progress** — Whoever stops in the field fights on for up to **8
  hours** without you (up to 20 with Tiefenkunde). At a boss wall the simulated
  hero detours to your best conquered area and keeps farming — and reports on
  your return what it slew, found and learned.
- **A save with a safety net** — Versioned, three rotating backups, JSON
  export/import, migrations for old heroes. Corrupt items are repaired on load —
  or the game falls back to a backup.
- **Onboarding without tutorial force** — once-only hints at the right moment,
  and a patch-notes window shows what's new at launch. Existing heroes only get
  what they missed.

## 🌍 The five continents

| # | Continent | Areas (ilvl) | Beast at the summit |
| --- | --- | --- | --- |
| 1 | **Die Aschenlande** (Ashen Lands) | 2–20 | *Der Aschegott*, in the heart of ash |
| 2 | **Das Frostreich** (Frost Realm) | 29–252 | *Der Frostgott*, in the heart of winter |
| 3 | **Das Faulmoor** (Fen Moor) | 375–3.222 | *Der Moorgott*, in the heart of the moor |
| 4 | **Das Blutmark** (Bloodmark) | 4.780–41.118 | *Der Blutgott*, in the heart of blood |
| 5 | **Die Sternenleere** (Star Void) | 60.998–524.718 | *Die Aschenkrone*, in the heart of the void |

The numbers behind each continent are the item levels of its ten areas — the
deeper the level, the better the loot and the workshop.

## 🧭 The four paths

| Path | Focus | Extreme |
| --- | --- | --- |
| ⚔️ **Krieg** (War) | damage, crit, attack speed | *Knochenbrecher* — +30 damage, −40 health |
| 🛡️ **Haut** (Skin) | health, armor | *Blutzoll* — +150 health, −8 % speed |
| 🏺 **Asche** (Ash) | loot & experience | *Midashand* — +45 % ash, −10 % damage |
| 👁️ **Geist** (Spirit) | crit, crit damage, speed | *Zeitraffung* — +35 % attack speed, −8 armor |

## 🔭 Roadmap — non-binding

> Everything below is **an idea, not a promise**: scope, order and whether at all
> change with alpha feedback. Nothing here is binding.

- **Legacy expansion** — more titles for Crown Ash, e.g. costly titles with a
  head start (start in deeper zones, starting gear); long-term, possibly a meta
  tree — see the [prestige paper](docs/prestige-optionen.md) (German).
- **Boss signatures** — eponymous uniques of the ten continent bosses ("heart of
  ash") as hunt targets with their own imprint.
- **Depth & elite modifiers** — rotating conditions (e.g. "Hardened: +40 %
  health, +80 % ash") so the endless wall and the campaign get variety.
- **Sunken continents** — story chapters in the depths: an annal, enemies and
  epitaphs per chapter, riding the existing depth curve.
- **QoL & hardening** — workshop forging on hold-to-repeat, keyboard shortcuts
  beyond the tooltips, and more automated tests for saves and formulas.

## 🧪 Closed alpha

Ashen Crown is in a closed alpha stage:

- **Join:** grab the installer from the [releases](releases) — the game updates
  itself when new versions ship. Without installation, play directly in the
  browser: **[trobikus.github.io/ashen-crown](https://trobikus.github.io/ashen-crown/)**
  (web build, tracking `main`; desktop remains the recommended way to play).
- **Save data:** Lives safely in the app's browser storage, with backups; under
  options → play it can be exported and re-imported as JSON (e.g. before
  experiments). In the web build it lives in the page's browser storage.
- **Feedback:** Best as an [issue](issues) — the button for it also lives in the
  game under options → play. Three questions interest us most:
  1. Where do you get stuck or lost?
  2. Where does it bore you?
  3. When did you die without understanding why?
- **Recommendation:** Play the desktop build; the web build (GitHub Pages or
  `pnpm dev`) is a dev preview without touch polish.
- **Changelog:** Every version in detail in [CHANGELOG.md](CHANGELOG.md) and in
  the in-game patch-notes window.

## 🚀 Development

```bash
pnpm install        # install dependencies
pnpm dev            # web dev server (Vite, HMR)
pnpm tauri dev      # desktop window with hot reload (Rust toolchain required)
pnpm build          # production build into dist/

node tools/balance-sim.mjs --verify   # verify balance against the real data.js
node tools/smoke.mjs                  # smoke checks for core modules
```

<details>
<summary><strong>📁 Project structure</strong></summary>

```
├── index.html            # UI skeleton (menu, shrine, scenes, patch notes)
├── src/
│   ├── main.js           # entry point: menu and game start
│   ├── data.js           # game data: continents, enemies, loot, skill tree
│   ├── i18n.js           # language runtime: t(), names, OS detection, live switching
│   ├── locales/          # English dictionaries (en-ui.js, en-content.js)
│   ├── game.js           # app core: combat, hero progress, render path, scene flow
│   ├── bus.js            # manager bus: game.js provides services, modules consume them
│   ├── domfx.js          # DOM write helpers & combat effects (particles, numbers, arcs)
│   ├── overlay.js        # overlay messages & scene timers (death, boss gate, intros)
│   ├── saveio.js         # save subsystem: migration, hardening, backups, import/export
│   ├── offline.js        # offline progress: combat simulation & summary
│   ├── throne.js         # the throne: legacy shop & awaken anew
│   ├── records.js        # bestiary, achievements (glory shop), statistics
│   ├── zones.js          # area map: continents & paging
│   ├── items.js          # loot, inventory, comparisons, selling, depth relics
│   ├── crafting.js       # workshop: reinforce, reforge, mastery reroll
│   ├── skilltree.js      # skill tree: graph, path binding & point allocation
│   ├── stats.js          # hero stats from base, gear, skills & masteries
│   ├── prestige.js       # the throne: crown ash, legacy titles, prestige reset
│   ├── achievements.js   # achievements, glory currency & glory shop
│   ├── lore.js           # chronicle: intro, annals, epitaphs, depth whispers
│   ├── state.js          # save & settings (localStorage)
│   ├── dom.js            # DOM cache
│   ├── settings.js       # options load/save/apply
│   ├── audio.js          # procedural sound (Web Audio API)
│   ├── feedback.js       # toasts & level-up flourishes
│   ├── display.js        # fullscreen control (desktop & web)
│   ├── sprites.js        # enemy sprites: seven SVG archetypes in continent color
│   ├── patchnotes.js     # patch-notes window at game start
│   ├── updater.js        # auto-update via GitHub releases
│   ├── style.css         # base styling
│   └── scenes.css        # scenes: inventory, map, workshop, chronicle, options
├── tools/
│   ├── balance-sim.mjs   # balance simulator: plays the real data.js
│   └── smoke.mjs         # node smoke checks for core modules
├── docs/                 # banner & screenshots for this README
└── src-tauri/            # Tauri-2 desktop shell (Rust)
```

The codebase itself (comments, identifiers) is German; in-game text exists in German and English.

</details>

## 📜 Credits

Equipment icons by [game-icons.net](https://game-icons.net) (Lorc, Delapouite),
licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) — details in
[CREDITS.md](CREDITS.md).

## ⚖️ License

Copyright © 2026 Grimoire Interactive / Trobikus — **all rights reserved**
(see [LICENSE](LICENSE)). The game may be played privately and viewed/forked on
GitHub; commercial use, redistribution and removal of copyright notices are not
permitted without written permission.

---

<div align="center">
  <sub>A game by Grimoire Interactive · <em>"Carved runes do not heal."</em></sub>
</div>
