# Changelog

Alle nennenswerten Änderungen an Ashen Crown werden hier dokumentiert.
Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/);
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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

[Unreleased]: https://github.com/Trobikus/ashen-crown/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Trobikus/ashen-crown/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Trobikus/ashen-crown/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Trobikus/ashen-crown/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Trobikus/ashen-crown/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trobikus/ashen-crown/releases/tag/v0.1.0
