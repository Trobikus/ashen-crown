<div align="center">
  <img src="docs/banner.svg" alt="Ashen Crown" width="840" />

  **Ashen Crown** ist ein inkrementelles Dark-Fantasy-RPG: Du erwachst in der Asche,
  kämpfst dich Gebiet für Gebiet durch **fünf Kontinente** — und formst dabei einen
  Helden, der ganz nach deinem Willen geformt ist.

  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
  [![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
  [![pnpm](https://img.shields.io/badge/pnpm-Paketmanager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
  [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/de/docs/Web/JavaScript)
  [![CI](https://github.com/Trobikus/ashen-crown/actions/workflows/ci.yml/badge.svg)](https://github.com/Trobikus/ashen-crown/actions/workflows/ci.yml)
  [![Lizenz](https://img.shields.io/badge/Lizenz-propriet%C3%A4r--alle%20Rechte%20vorbehalten-C14B3A)](LICENSE)

  *Web & Desktop — ohne Framework, ohne Server, mit Speicherstand im Browser.*
</div>

---

## 🕯️ Das Spiel

Ashen Crown ist ein Idle-RPG: Der Kampf läuft von allein, die Entscheidungen triffst du.
Erlege Kreaturen, sammle Asche, schärfe Klinge und Haut, rüste Beute aus — und steige
Gebiet für Gebiet tiefer, bis dir am Ende der Leere die Aschenkrone selbst gegenübersteht.

| Kampf | Fertigkeiten | Gebiete |
| :---: | :---: | :---: |
| ![](docs/screenshots/kampf.png) | ![](docs/screenshots/skilltree.png) | ![](docs/screenshots/gebiete.png) |

## ⚙️ Systeme, die ineinandergreifen

- **Auto-Kampf & Zonen** — **5 Kontinente** mit je **10 Ebenen**, jedes Gebiet bringt
  sein eigenes Bestiarium aus drei Kreaturen mit — **150 Gegner insgesamt**, von der
  Ascheratte bis zur Aschenkrone.
  Pro Ebene wartet nach 30 Siegen ein Boss; sein Fall öffnet die Tür in die Tiefe —
  und irgendwann das Tor zum nächsten Kontinent.
  Jede Zone kämpft mit eigenem Temperament (*Flink* oder *Massiv*), Bosse verfallen
  unter 35 % Lebenskraft in **Wut** — und jeder Gegner trägt die Färbung seines
  Kontinents. Jeder Sieg heilt 10 % deiner Lebenskraft; stirbst du, behält die Asche
  15 % deines Vorrats als Zoll. Im Feld kämpft dein Held weiter — am Schrein rastet
  und heilt er.
  Die Gebiete-Karte zeigt jeden Kontinent groß im Überblick; mit den Pfeilen blätterst
  du zwischen den Kontinenten, und für sicheres Farmen reist du in freigeschaltete
  Ebenen zurück.
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
- **Zahlen, die mitwachsen** — Spät werden Werte astronomisch; das Spiel hält sie
  lesbar: kompakte Kurzschreibweise mit deutschem Komma („12,4K", „3,2M", „1,5B").
- **Offline-Fortschritt** — Wer im Feld aufhört, kämpft bis zu **8 Stunden** ohne dich
  weiter (mit Todesrisiko; Bosse warten auf dich) und meldet dir bei der Rückkehr,
  was er erlegt, gefunden und gelernt hat.

## 🌍 Die fünf Kontinente

| # | Kontinent | Gebiete | Bestie an der Spitze |
| --- | --- | --- | --- |
| 1 | **Die Aschenlande** | 1–182 | *Der Aschegott* im Herz der Asche |
| 2 | **Das Frostreich** | 222–762 | *Der Frostgott* im Herz des Winters |
| 3 | **Das Faulmoor** | 842–1742 | *Der Moorgott* im Herz des Moores |
| 4 | **Das Blutmark** | 1862–3122 | *Der Blutgott* im Herz des Blutes |
| 5 | **Die Sternenleere** | 3282–4902 | *Die Aschenkrone* im Herz der Leere |

Die Zahlen hinter jedem Kontinent sind die Gegenstandsstufen (ilvl) seiner zehn
Gebiete — je tiefer die Ebene, desto besser Beute und Werkstatt.

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
│   ├── data.js           # Spieldaten: Kontinente, Gegner, Loot, Skilltree
│   ├── game.js           # Spielloop: Kampf, Fortschritt, Speicherung
│   ├── zones.js          # Gebiete-Karte: Kontinente & Durchschalten
│   ├── items.js          # Loot, Inventar, Vergleiche, Verkauf
│   ├── crafting.js       # Werkstatt: Verstärken & Umschmieden
│   ├── skilltree.js      # Fertigkeitenbaum: Graph & Punktevergabe
│   ├── stats.js          # Heldenwerte aus Basis, Gear, Skills & Meisterschaft
│   ├── state.js          # Spielstand & Einstellungen (localStorage)
│   ├── dom.js            # DOM-Cache
│   ├── settings.js       # Optionen laden/speichern/anwenden
│   ├── style.css         # Basis-Styling
│   └── scenes.css        # Szenen: Inventar, Karte, Werkstatt, Optionen
├── docs/                 # Banner & Screenshots für dieses README
└── src-tauri/            # Tauri-2-Desktop-Shell (Rust)
```

## 📜 Credits

Ausrüstungs-Icons von [game-icons.net](https://game-icons.net) (Lorc, Delapouite),
Lizenz [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) — Details in
[CREDITS.md](CREDITS.md).

## ⚖️ Lizenz

Copyright © 2026 Grimoire Interactive / Trobikus — **alle Rechte vorbehalten**
(siehe [LICENSE](LICENSE)). Das Spiel darf privat gespielt und auf GitHub
eingesehen/geforkt werden; kommerzielle Nutzung, Weiterverbreitung und
Entfernen von Urheberangaben sind ohne schriftliche Genehmigung nicht
gestattet.

---

<div align="center">
  <sub>Ein Spiel von Grimoire Interactive · <em>„Geschnittene Runen heilen nicht."</em></sub>
</div>
