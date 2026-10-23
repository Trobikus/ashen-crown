// CSP-Audit: Die Produktions-Policy (tauri.conf.json, style-src 'self')
// verwirft Inline-Style-Attribute aus HTML-Strings, <style>-Tags und
// setAttribute('style') still beim Parsen — Seltenheitsfarben, Icons und
// Sprites brächen im Desktop-Build, ohne dass ein Test rot würde. Dynamische
// Werte gehören in CSSOM-Zuweisungen (el.style.x, setProperty — CSP-frei)
// oder in Klassen (siehe .rarity-* in style.css).
//
//   node tools/csp-check.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  join(root, 'index.html'),
  ...readdirSync(join(root, 'src'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(root, 'src', f)),
];

const PATTERNS = [
  [/style="/, 'Inline-Style-Attribut in HTML-String (style="…")'],
  [/<style[\s>]/i, '<style>-Tag im HTML-String'],
  [/setAttribute\(\s*['"]style['"]/, "setAttribute('style', …)"],
  [/\.cssText/, 'cssText-Zuweisung'],
];

let failed = 0;
for (const file of targets) {
  const rel = file.slice(root.length + 1);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, label] of PATTERNS) {
      if (re.test(line)) {
        console.error(`✗ ${rel}:${i + 1} ${label}`);
        failed += 1;
      }
    }
  });
}

console.log(
  failed
    ? `\n${failed} Inline-Style-Verstoß/Vorstöße gefunden — die CSP des Desktop-Builds würde sie verwerfen.`
    : `Alle ${targets.length} Dateien CSP-fest — keine Inline-Styles im HTML-Bau.`,
);
process.exit(failed ? 1 : 0);
