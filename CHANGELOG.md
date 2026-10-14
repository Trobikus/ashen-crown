# Changelog

Alle nennenswerten Änderungen an Ashen Crown werden hier dokumentiert.
Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/);
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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

[Unreleased]: https://github.com/Trobikus/ashen-crown/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/Trobikus/ashen-crown/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Trobikus/ashen-crown/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trobikus/ashen-crown/releases/tag/v0.1.0
