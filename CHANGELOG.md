# Changelog

Alle nennenswerten Änderungen an Ashen Crown werden hier dokumentiert.
Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/);
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [0.9.0] — 2026-10-14

### Hinzugefügt
- **Onboarding für neue Helden**: Einmal-Hinweise im richtigen Moment statt
  eines Tutorials — eine zweiseitige Feld-Einführung beim ersten Abstieg
  (pausiert den Kampf), ein Rast-Tipp beim ersten Boss (pausiert ebenfalls),
  der Punkte-Hinweis beim ersten Aufstieg, der Beute-Hinweis beim ersten Drop,
  der Meisterschafts-Hinweis beim ersten epischen Stück und Einsteig-Hinweise
  für Fertigkeiten, Gebiete und Werkstatt. Jeder Hinweis erscheint genau
  einmal und wird im Spielstand gemerkt (Save-Version 4): Bestehende Helden
  erhalten nur die Hinweise, die sie noch nicht verpasst haben.

## [0.8.0] — 2026-10-14

### Hinzugefügt
- **Chronik** (neues Hub-Tile): Die Asche erinnert sich — eine wachsende
  Sammlung der Erzählung, unterteilt in Die Erweckung, die fünf Kontinent-
  Annalen mit den Epitaphen ihrer bezwungenen Bosse, die Tiefen und den
  Thron. Freigeschaltet wird durchs Spielen (Zone frei → Annale, Boss
  gefallen → Epitaph); Versiegeltes kündigt sich an.
- **Intro-Erzählung**: Neue Helden erwachen nicht mehr in einem Satz, sondern
  in vier klickbaren Seiten — vom Reich vor der Asche bis zum Ruf der Krone.
- **Kontinent-Annalen**: Beim ersten Betreten jedes Kontinents (und der
  Tiefen) erzählt eine Einblendung, welches Reich hier versuchte, der Asche
  zu entkommen — der Hof im Frost, die Gelehrten im Moor, die Blutwährung
  des Ostens, der Aufstieg zu den Sternen.
- **50 Boss-Epitaphe**: Jeder Boss-Kill öffnet sein Epitaph über dem
  Gate-Text — von Grabwächter („Er bewacht ein Grab, das nie gegraben
  wurde: sein eigenes.“) bis zur Aschenkrone. Die Tiefen-Bosse flüstern
  vier rotierende Zeilen.
- Sieg-Text erweitert („Vier Reiche sind auf dem Weg hierher verbrannt.“).

### Geändert
- **Gegnernamen loretreu**: Die Normal- und Elite-Gegner aller Kontinente sind
  jetzt die Menschen und Ränge der untergegangenen Reiche — der verbrannte Hof
  (Grabesdiener, Ascheschreiber, Leichenprediger, Staubkämmerer), das geflohene
  Frostvolk (Frostpilger, Eiskämmerin, Schneewaise, Winterbotschafter), die
  ertränkten Gelehrten des Moores (Archivarsleim, Heilkundiger, Reliquien-
  schwimmer, Seuchenärztin), das blutbezahlende Kriegsvolk (Lanzknecht,
  Doppelgelder, Rostfähnrich, Zahlmeister) und die Aufgestiegenen (Leerenpilger,
  Sternwarter, Astrolabit, Sternenschürfer). Die 50 Boss-Namen bleiben — sie
  tragen den Erzählbogen und die Epitaphe.

### Behoben
- Überholt ein Overlay ein anderes (Boss-Gate → Kontinent-Annale), stoppte
  dessen Timer nicht und blätterte den Nachfolger vorzeitig weg.

## [0.7.0] — 2026-10-14

### Hinzugefügt
- **Feld & Schrein**: Fortschritt gibt es nur im Feld — die Kampfszene läuft
  weiter, solange sie offen ist, am Schrein und in allen Menüs rastet der Held
  (und heilt). Der Offline-Fortschritt bleibt: Wer im Feld aufhört, kämpft beim
  nächsten Start bis zu 8 Stunden nach — inklusive Todesrisiko und Boss-Stopp
  (Bosse verlangen deine Anwesenheit).
- **Todeszoll**: Beim Fallen behält die Asche **15 % der aktuellen Asche** ein —
  live wie offline. Rasten am Schrein vor einem Boss ist jetzt die kluge Wahl.
- **Gegnerprofile**: Jede Zone trägt ein Temperament — **Flink** (weniger Leben,
  schneller Angriff) oder **Massiv** (mehr Leben, härterer Schlag), Standard als
  drittes im Wechsel. Bosse verfallen unter 35 % Lebenskraft in **Wut**
  (beschleunigte Angriffe, rotes Glühen, goldener „Wütend"-Schriftzug).
- **Kontinent-Färbung**: Jeder Gegner trägt die Tönung seiner Heimat
  (Aschenbraun, Frostanthrazit, Moorgrün, Blutrot, Sternenviolett, Tiefenschwarz).
- **Kill-Regeneration**: Jeder Sieg heilt **10 % der maximalen Lebenskraft**
  (grüne Heil-Zahlen) — Zonen-Farming ist durchhaltbar, Bosskämfe bleiben die
  Nagelprobe, weil während des Kampfs nichts heilt.
- Sound für die Enrage-Phase; Erst-Abstieg-Hinweis, der das Feld-Schrein-
  Prinzip erklärt.

### Geändert
- **Offline-Simulation auf Live-Formeln gebracht**: Sie rechnet jetzt mit Krit,
  Angriffstempo, Gegnerprofilen, erlittenem Schaden und Kill-Regeneration statt
  mit idealisierten Werten; die Zusammenfassung meldet gefallene Helden und
  wartende Bosse. Save-Version 3 (alte Spielstände gelten als im Feld).
- Balance-Simulator (`tools/balance-sim.mjs`) modelliert Profile, Enrage,
  Regeneration und Todeszoll mit.

## [0.6.0] — 2026-10-14

### Hinzugefügt
- **Vollbild-Option** unter Optionen → Anzeige: Das Spiel startet jetzt im
  Fenster (1280×800) statt erzwungen im Vollbild; der Toggle wechselt
  live (Desktop über die Tauri-Window-API, Web über die
  Browser-Fullscreen-API) und die Wahl wird persistiert und beim
  nächsten Start wiederhergestellt.

## [0.5.0] — 2026-10-14

### Hinzugefügt
- **Sound** (prozedural über die Web Audio API, keine Assets): Treffer,
  Kritische Treffer, Siege, Boss-Auftritte, Stufenaufstiege, Raritäten-
  Beute, Tod und Sieg-Fanfare — dazu ein dunkler Ambient-Drone als
  Musik. Neuer Optionen-Tab **Audio** mit Reglern für Gesamt, Effekte
  und Musik.
- **Feedback-Loop**: Boss-Fortschritt im HUD („7 / 30", Boss-Phase in
  Gold), Goldener „Stufe X"-Schriftzug beim Aufstieg, Toasts für seltene
  und epische Beute (in Seltenheitsfarbe) und einen gedrosselten
  Hinweis, wenn das Inventar voll ist und Beute verfällt.

### Behoben
- Optionen wurden nie aus dem Speicher geladen und nie gespeichert
  (fehlender `SETTINGS_KEY`-Import) — alle Einstellungen verhielten sich
  wie Zurückgesetzt nach jedem Neustart.

## [0.4.0] — 2026-10-14

### Hinzugefügt
- **Save-Schutz**: Spielstände tragen jetzt eine Version (Migration-Hook
  für künftige Formate). Automatische **rotierende Backups** (3
  Generationen, min. 10 Minuten Abstand) — ist der Hauptspielstand
  beschädigt, lädt das Spiel den jüngsten Backup automatisch und weist
  darauf hin.
- **Export/Import** unter Optionen → Spiel: Spielstand als JSON-Datei
  sichern und wieder einlesen (Desktop mit nativen Datei-Dialogen,
  Web-Build über Download/Auswahl). Vor jedem Import wird automatisch
  ein Backup des aktuellen Standes erstellt.
- **Runen-Respec**: Im Fertigkeiten-Baum lassen sich alle Fertigkeiten
  gegen Asche neu schneiden (zweimal klicken zur Bestätigung) — Kosten
  skalieren mit Item-Level und Zahl der Runen, Punkte werden voll
  erstattet.

## [0.3.0] — 2026-10-14

### Hinzugefügt
- **Ende und Endlos-Spiel**: Nach „Herz der Leere" wartet der
  Sieg-Bildschirm „Die Aschenkrone" mit Runenstatistik; dahinter öffnen
  sich die prozeduralen **Aschentiefen** (Zone 51+) mit eigenen Gegnern
  und römisch nummerierten Ebenen — eine Endlos-Wand mit gedämpftem
  XP-Wachstum, damit der Treadmill nie kippt.
- **Balance-Simulator** (`tools/balance-sim.mjs`): spielt die echten
  Spiel-Formeln mit Spieler-Richtlinien durch und misst Kill-Zeiten,
  Tode und Überfarm-Aufwand pro Zone (`--verify` gegen die echte data.js,
  `--depths` für die Tiefen, `--sweep` für Kurvensuche).

### Geändert
- **Komplettes Rebalancing**: Gegner-Wachstum von ×3,7 pro Zone auf ×1,4
  gedämpft. Das alte Modell brach real ab Zone ~12 zusammen (Sim-Befund:
  10–60 Stunden Zwangsgrind je Zone ab Zone 8, danach unspielbar). Neu:
  Hauptspiel ~6–12 h mit stetigem Anstieg (Killzeiten 1,5 s → ~50 s),
  kein forciertes Überfarmen, alle Zahlen bleiben präzise (unter 2^53).
- Item-Level wachsen geometrisch (×1,28/Zone, Kontinent-Sprünge) statt
  der alten Handkurve; Elite/Boss-Verhältnisse leicht nachjustiert
  (Elite HP ×2,4, Boss HP ×4). Werkstatt skaliert bewusst nur bis zum
  Hauptspiel-Ende weiter.
- Alte Spielstände bleiben kompatibel; Helden der alten Kurve stürmen
  die flacheren Zonen schneller durch.

## [0.2.2] — 2026-10-14

### Geändert
- Update-Banner zeigt beim Laden nur noch „Updating" mit Prozentanzeige
  über dem Balken statt Patchnote-Text.

## [0.2.1] — 2026-10-14

### Hinzugefügt
- Versionsnummer im Hauptmenü angezeigt (nur Desktop-App).

## [0.2.0] — 2026-10-14

### Hinzugefügt
- **Auto-Update**: Beim Öffnen prüft das Spiel auf neue GitHub-Releases und
  installiert gefundene Patches selbst (Fortschrittsbalken im Hauptmenü,
  überspringbar) — signiert über den offiziellen Tauri-Updater, mit
  automatischer Release-Pipeline für Windows-Installer.
- **Fünf Kontinente** mit je zehn Gebieten (50 Gebiete, 150 Gegner): die
  Aschenlande, das Frostreich, das Faulmoor, das Blutmark und die
  Sternenleere — Bestien der neuen Kontinente folgen generatorisch der
  Progression der handabgestimmten Ausgangszone (Elite/Boss-Verhältnisse).
- **Kontinent-Karussell** in der Gebiete-Karte: aktueller Kontinent zentriert,
  Pfeile zum Durchschalten, Zurücksetzen auf den Aufenthaltskontinent.
- **Kompakte Zahlenformatierung** („12,4K", „3,2M", deutsches Komma) für
  Asche, Kosten, Heldenwerte, EP, Schadenszahlen und Item-Tooltips.
- CI-Workflow (Web-Build + Rust-Check), Dependabot, Repo-Community-Dateien.

### Behoben
- Beenden-Button im Hauptmenü schließt die App jetzt tatsächlich
  (`core:window:allow-close` fehlte in den Tauri-Capabilities).

## [0.1.0] — 2026-10-13

### Hinzugefügt
- Grundspiel: Auto-Kampf, Zonen mit Bossen nach 30 Siegen, Eliten alle 10 Siege.
- Skilltree im Path-of-Exile-Stil (217 Knoten, 4 Pfade, 12 Keystones, 12 Brücken).
- Loot mit 3 Raritäten über 7 Rüstungsslots, Inventar-Tools (Sortieren,
  Bestes anlegen, Verkauf).
- Werkstatt: Verstärken und Umschmieden, Episch rollt eine Meisterschaft.
- Offline-Fortschritt (bis 8 Stunden) mit Zusammenfassung.
- Desktop-Shell via Tauri 2, Vollbild-Start.
- Ausrüstungs-Icons als maskierte SVGs (game-icons.net, CC BY 3.0).

[Unreleased]: https://github.com/Trobikus/ashen-crown/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/Trobikus/ashen-crown/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Trobikus/ashen-crown/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Trobikus/ashen-crown/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Trobikus/ashen-crown/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Trobikus/ashen-crown/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Trobikus/ashen-crown/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Trobikus/ashen-crown/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trobikus/ashen-crown/releases/tag/v0.1.0
