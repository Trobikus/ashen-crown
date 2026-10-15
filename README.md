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

  **🧪 Aktuell: Closed Alpha (v0.15.0)** — Installer über die
  [Releases](releases), Updates installieren sich im Spiel von selbst.
</div>

---

## 🕯️ Das Spiel

Ashen Crown ist ein Idle-RPG: Der Kampf läuft von allein, die Entscheidungen triffst du.
Erlege Kreaturen, sammle Asche, schärfe Klinge und Haut, rüste Beute aus — und steige
Gebiet für Gebiet tiefer, bis dir am Ende der Leere die Aschenkrone selbst gegenübersteht.
Denn die Asche erinnert sich — an jedes Reich, das vor dir versuchte, ihr zu entkommen.

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
  Kontinents. Kämpfen ist Handwerk: **Gegner greifen gelegentlich daneben** (15 %),
  dein Held verfehlt auch (12 %), die Kritchance deckelt bei 75 %, und Rüstung
  mindert nie mehr als die Hälfte — mindestens 50 % jedes Schlags kommen durch.
  Im Feld regeneriert dein Held nie von selbst: Kämpfe zehren — wer
  angeschlagen aufbricht, trägt die Rest-Lebenskraft mit in den Kampf.
  Am Schrein kehrt sie mit 2 % pro Sekunde zurück; nach dem Tod erwachst
  du mit einem Viertel, und die Asche behält 15 % deines Vorrats als Zoll.
  Im Feld heilt nur **Lifeleech**, das es ausschließlich auf epischen und
  legendären Waffen gibt: als Prozente deines Schadens oder als feste Zahl
  pro Treffer.
  Erfahrung gibt es nur von Würdigen: Gegner unter deinem Niveau tragen weniger
  bei, 20 Stufen darunter gar nichts. Und mancher Boss ist eine echte **Wand**:
  Dann heißt es zurück, Asche und Beute farmen, besser schmieden — und es ihm
  nochmal zeigen.
  Die Bestiarien erzählen dabei ihre Reiche: der verbrannte Hof (Grabesdiener,
  Ascheschreiber, Leichenprediger), das geflohene Frostvolk (Frostpilger,
  Eiskämmerin, Winterbotschafter), die ertränkten Gelehrten (Archivarsleim,
  Reliquienschwimmer), das blutbezahlende Kriegsvolk (Lanzknecht, Doppelgelder)
  und die Aufgestiegenen (Sternwarter, Astrolabit).
  Die Gebiete-Karte zeigt jeden Kontinent groß im Überblick; mit den Pfeilen blätterst
  du zwischen den Kontinenten, und für sicheres Farmen reist du in freigeschaltete
  Ebenen zurück.
- **Fertigkeitenbaum** — **217 Knoten** im Path-of-Exile-Stil: vier Pfade
  (Krieg, Haut, Asche, Geist) mit kleinen Passives, Notables und **12 Keystones mit
  Tradeoffs**. **12 Brücken** verbinden die Pfade miteinander — für Misch-Builds,
  die es so kein zweites Mal gibt. **Maximal zwei Pfade erwachen gleichzeitig** —
  die übrigen versiegeln sich, bis ein Respec sie wieder öffnet. Der Baum
  **erwacht ab Stufe 20** — erst dann gibt es Runenpunkte, und seine Werte sind
  bewusst gedämpft.
- **Loot & Inventar** — **7 Rüstungsslots**, **5 Raritäten** (Gewöhnlich →
  Magisch → Selten → Episch → Legendär). Jedes Stück **rollt seine Werte** —
  das perfekte Exemplar ist ein Fund, kein Rechenresultat. Beute ist ein
  Ereignis, kein Dauerregen: Wer tief kämpft, findet Besseres. Verkaufen,
  Sortieren und „Bestes anlegen" inklusive.
- **Crafting** — Die Werkstatt macht Asche zu Macht: Ausrüstungsstufen **verstärken**
  (steile Kostenkurve pro Stufe) oder **umschmieden** (Rarity-Upgrade mit Neuwurf,
  senkt das Ilvl nie). Legendäre Items rollen eine goldene **Meisterschaft** —
  Prozentboni, die es sonst auf Gear nirgends gibt, und die sich gegen viel Asche
  **neu schmieden** lassen: die Endgame-Jagd nach dem Perfekt-Wurf. Alles skaliert
  mit der tiefsten errungenen Ebene.
- **Komfort auf Wunsch** — **Auto-Tür** (nach dem Boss geht es von allein weiter) und
  **Auto-Verkauf** (Beute unter einer gewählten Seltenheit wird beim Fund zu Asche)
  unter Optionen → Spiel; volles Inventar tauscht Beute ohnehin sofort in Asche.
- **Stufen & Asche** — Jede Stufe bringt **2 Statpunkte**; Runenpunkte kommen
  ab Stufe 20 dazu. Asche finanziert die Werkstatt: Verstärkung und Umschmieden.
  Beide Wege stärken denselben Helden, keinen zweiten.
- **Zahlen, die mitwachsen** — Spät werden Werte astronomisch; das Spiel hält sie
  lesbar: kompakte Kurzschreibweise mit deutschem Komma („12,4K", „3,2M", „1,5B").
- **Offline-Fortschritt** — Wer im Feld aufhört, kämpft bis zu **8 Stunden** ohne dich
  weiter (mit der Errungenschaft Tiefenkunde bis 20; an einer Boss-Wand wird aufs
  beste Gebiet ausgewichen und weitergefarmt) und meldet dir bei der Rückkehr,
  was er erlegt, gefunden und gelernt hat.
- **Chronik & Lore** — Die Asche erinnert sich: Intro-Erzählung beim Erwachen,
  eine Annale pro Kontinent beim ersten Betreten, ein Epitaph über jedem der
  **50 bezwungenen Bosse** — alles gesammelt in der Chronik am Schrein.
- **Klang & Feedback** — Prozeduraler Sound aus der Web Audio API (keine Assets):
  Treffer, Krits, Bosse, Beute, Aufstiege, Enrage, dazu ein dunkler Ambient-Drone
  — mit Reglern für Gesamt, Effekte und Musik. Schadenszahlen (jetzt auch
  Lebenspunktzahlen in der Arena), Aufblitzen und Toasts lassen sich trennen.
- **Spielstand mit Sicherheitsnetz** — Versioniert (aktuell v4), drei rotierende
  Backups, Export/Import als JSON, Migrationen für alte Helden. Korrupte Items
  repariert das Spiel beim Laden — oder es greift zum Backup.
- **Onboarding ohne Tutorial-Zwang** — Einmal-Hinweise im richtigen Moment:
  Feld & Schrein beim ersten Abstieg, der Rast-Tipp beim ersten Boss, Punkte-,
  Beute- und Meisterschafts-Hinweise, Einsteige in Fertigkeiten, Gebiete und
  Werkstatt. Bestehende Helden bekommen nur, was sie verpasst haben.

## 🌍 Die fünf Kontinente

| # | Kontinent | Gebiete (ilvl) | Bestie an der Spitze |
| --- | --- | --- | --- |
| 1 | **Die Aschenlande** | 2–20 | *Der Aschegott* im Herz der Asche |
| 2 | **Das Frostreich** | 29–252 | *Der Frostgott* im Herz des Winters |
| 3 | **Das Faulmoor** | 375–3.222 | *Der Moorgott* im Herz des Moores |
| 4 | **Das Blutmark** | 4.780–41.118 | *Der Blutgott* im Herz des Blutes |
| 5 | **Die Sternenleere** | 60.998–524.718 | *Die Aschenkrone* im Herz der Leere |

Die Zahlen hinter jedem Kontinent sind die Gegenstandsstufen (ilvl) seiner zehn
Gebiete — je tiefer die Ebene, desto besser Beute und Werkstatt.

## 🌳 Die vier Pfade

| Pfad | Fokus | Extrem |
| --- | --- | --- |
| ⚔️ **Krieg** | Schaden, Krit, Angriffstempo | *Knochenbrecher* — +30 Schaden, −40 Lebenskraft |
| 🛡️ **Haut** | Lebenskraft, Rüstung | *Blutzoll* — +150 Lebenskraft, −8 % Tempo |
| 🏺 **Asche** | Beute & Erfahrung | *Midashand* — +45 % Asche, −10 % Schaden |
| 👁️ **Geist** | Krit, Kritschaden, Tempo | *Zeitraffung* — +35 % Angriffstempo, −8 Rüstung |

## 🧪 Closed Alpha

Ashen Crown befindet sich im geschlossenen Alpha-Stadium (aktuell **v0.15.0**):

- **Mitmachen:** Installer aus den [Releases](releases) laden und installieren —
  das Spiel aktualisiert sich danach bei neuen Versionen von selbst. Ohne
  Installation geht es auch direkt im Browser:
  **[trobikus.github.io/ashen-crown](https://trobikus.github.io/ashen-crown/)**
  (Web-Build, Stand `main`; Desktop bleibt die empfohlene Variante).
- **Spielstand:** Liegt sicher im Browser-Speicher der App, mit Backups;
  unter Optionen → Spiel lässt er sich als JSON exportieren und wieder
  einspielen (z. B. vor Experimenten). Im Web-Build liegt er im
  Browser-Speicher der Seite.
- **Feedback:** Am liebsten als [Issue](issues) — der Knopf dafür steckt auch
  im Spiel unter Optionen → Spiel. Drei Fragen interessieren uns am meisten:
  1. Wo hängst du fest oder weißt nicht weiter?
  2. Wo langweilt es dich?
  3. Wann stirbst du, ohne zu verstehen warum?
- **Empfehlung:** Desktop-Build spielen; der Web-Build (GitHub Pages bzw.
  `pnpm dev`) ist Dev-Vorschau ohne Touch-Feinschliff.

## 🗺️ Auf dem Weg zu 1.0

- Prestige/Meta-Progression und Belohnungen in den Aschentiefen

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
│   ├── lore.js           # Chronik: Intro, Kontinent-Annalen, Boss-Epitaphe
│   ├── state.js          # Spielstand & Einstellungen (localStorage)
│   ├── dom.js            # DOM-Cache
│   ├── settings.js       # Optionen laden/speichern/anwenden
│   ├── audio.js          # Prozeduraler Sound (Web Audio API)
│   ├── feedback.js       # Toasts & Levelup-Einblendungen
│   ├── display.js        # Vollbild-Steuerung (Desktop & Web)
│   ├── updater.js        # Auto-Update über GitHub Releases
│   ├── style.css         # Basis-Styling
│   └── scenes.css        # Szenen: Inventar, Karte, Werkstatt, Chronik, Optionen
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
