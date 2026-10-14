# Security Policy

## Unterstützte Versionen

Nur die aktuelle Version auf `main` erhält Sicherheitskorrekturen.

## Schwachstellen melden

Bitte **keine** öffentlichen Issues für Sicherheitsprobleme. Nutze stattdessen
GitHub *Private Vulnerability Reporting* (Reiter **Security → Report a
vulnerability**) — so bleibt die Meldung vertraulich, bis ein Fix vorliegt.

Alternativ erreichst du mich über das GitHub-Profil ([@Trobikus](https://github.com/Trobikus)).

## Scope

Ashen Crown ist ein lokales Spiel ohne Server und ohne Konten. Es verarbeitet
keine personenbezogenen Daten außer dem lokalen Spielstand im Browser-Speicher
(`localStorage`) und sendet nichts an Dritte. Besonders interessant sind
Meldungen zu:

- Skript-Einschleusung über Spielstand-/Eingabedaten,
- Tauri-Berechtigungen (Capabilities) zu weit gefasst,
- Problemen im Build (Vite/Dependency-Kette).
