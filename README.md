<div align="center">
  <img src="docs/banner.svg" alt="Ashen Crown" width="840" />

  **Ashen Crown** ist ein inkrementelles Dark-Fantasy-RPG: Du erwachst in der Asche,
  kämpfst dich Ebene für Ebene tiefer in die Krypta — und formst dabei einen Helden,
  der ganz nach deinem Willen geformt ist.

  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
  [![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
  [![pnpm](https://img.shields.io/badge/pnpm-Paketmanager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
  [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/de/docs/Web/JavaScript)

  *Web & Desktop — ohne Framework, ohne Server, mit Speicherstand im Browser.*
</div>

---

## 🕯️ Das Spiel

Ashen Crown ist ein Idle-RPG: Der Kampf läuft von allein, die Entscheidungen triffst du.
Erlege Kreaturen, sammle Asche, schärfe Klinge und Haut, rüste Beute aus — und steige
Ebene für Ebene tiefer, bis du dem Wächter des Thrones gegenüberstehst.

| Kampf | Fertigkeiten | Gebiete |
| :---: | :---: | :---: |
| ![](docs/screenshots/kampf.png) | ![](docs/screenshots/skilltree.png) | ![](docs/screenshots/gebiete.png) |

## ⚙️ Systeme, die ineinandergreifen

- **Auto-Kampf & Zonen** — Jede der **5 Ebenen** bringt ihr eigenes Bestiarium aus je
  drei Kreaturen mit — **15 Gegner insgesamt**, von der Ascheratte bis zum Thronenden.
  Pro Ebene wartet nach 30 Siegen ein Boss; sein Fall öffnet die Tür in die Tiefe.
  Über die Gebiete-Karte reist du für sicheres Farmen in freigeschaltete Ebenen zurück.
- **Fertigkeitenbaum** — **217 Knoten** im Path-of-Exile-Stil: vier Pfade
  (Krieg, Haut, Asche, Geist) mit kleinen Passives, Notables und **12 Keystones mit
  Tradeoffs**. **12 Brücken** verbinden die Pfade miteinander — für Misch-Builds,
  die es so kein zweites Mal gibt.
- **Loot & Inventar** — **7 Rüstungsslots**, **3 Raritäten** (Gewöhnlich → Episch).
  Die Itemstärke wächst mit der Tiefe der Ebene: Wer tiefer kämpft, findet Besseres.
  Verkaufen, Sortieren und „Bestes anlegen" inklusive.
- **Crafting** — Die Werkstatt macht Asche zu Macht: Ausrüstungsstufen **verstärken**
  (steile Kostenkurve pro Stufe) oder **umschmieden** (Rarity-Upgrade mit Neuwurf).
  Epische Items rollen eine goldene **Meisterschaft** — Prozentboni, die es sonst auf
  Gear nirgends gibt. Alles skaliert mit der tiefsten errungenen Ebene.
- **Stufen & Asche** — Jede Stufe bringt 3 Statpunkte und 1 Skillpunkt; Asche finanziert
  Klinge und Haut im Kampf selbst — oder in der Werkstatt Verstärkung und Umschmieden.
  Beide Wege stärken denselben Helden, keinen zweiten.
- **Offline-Fortschritt** — Bis zu **8 Stunden** kämpft dein Held ohne dich weiter und
  meldet dir bei der Rückkehr, was er erlegt, gefunden und gelernt hat.

## 🗺️ Die fünf Ebenen

1. **Aschenkrypta** — Hier beginnt und endet jeder Weg.
   *Ascheratte · Knochenfresser · Grabwächter*
2. **Knochengewölbe** — Was hier knirscht, war einmal Ritter.
   *Knochenkriecher · Beinhausritter · Gebeinwächter*
3. **Aschekatakomben** — Die Wände atmen Asche aus.
   *Aschenwicht · Glutgeist · Aschenmutter*
4. **Grabestiefe** — Selbst die Ratten haben aufgehört zu wimmern.
   *Grabwurm · Aaskrone · Der Bestattete*
5. **Thronhalle der Asche** — Die Krone wartet. Sie wartet immer noch.
   *Hofschatten · Kronenritter · Der Thronende*

## 🌳 Die vier Pfade

| Pfad | Fokus | Extrem |
| --- | --- | --- |
| ⚔️ **Krieg** | Schaden, Krit, Angriffstempo | *Knochenbrecher* — +30 Schaden, −40 Lebenskraft |
| 🛡️ **Haut** | Lebenskraft, Rüstung | *Blutzoll* — +150 Lebenskraft, −8 % Tempo |
| 🏺 **Asche** | Beute & Erfahrung | *Midashand* — +45 % Asche, −10 % Schaden |
| 👁️ **Geist** | Krit, Kritschaden, Tempo | *Zeitraffung* — +35 % Angriffstempo, −8 Rüstung |

## 🚀 Entwicklung

```bash
pnpm install        # Abhängigkeiten installieren
pnpm dev            # Web-Dev-Server (Vite, HMR)
pnpm tauri dev      # Desktop-Fenster mit Hot Reload (Rust-Toolchain nötig)
pnpm build          # Produktions-Build nach dist/
```

### Projektstruktur

```
├── index.html            # UI-Grundgerüst (Menü, Schrein, Szenen)
├── src/
│   ├── main.js           # Einstieg: Menü und Spielstart
│   ├── game.js           # Spiellogik: Kampf, Zonen, Loot, Skilltree, Speicherung
│   └── style.css         # Styling
├── docs/                 # Banner & Screenshots für dieses README
└── src-tauri/            # Tauri-2-Desktop-Shell (Rust)
```

---

<div align="center">
  <sub>Ein Spiel von Grimoire Interactive · <em>„Geschnittene Runen heilen nicht."</em></sub>
</div>
