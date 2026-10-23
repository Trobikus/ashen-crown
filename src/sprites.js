// Gegner-Sprites: Sieben handgesetzte SVG-Archetypen im Silhouetten-Stil —
// dunkle Gestalten mit leuchtenden Augen, passend zur Asche-Ästhetik des
// Helden-PNGs. Die Färbung übernimmt CSS: Die Klassen sb/sr/sx/se/sv/sc
// lesen Kontinent-Variablen (--fig-body, --fig-rim, --fig-eye), die die
// cont-*-Klassen auf dem Figure-Div setzen. So bleibt ein Satz Pfade für
// alle fünf Kontinente plus die Tiefen.
//
// Alle Sprites leben in einem 100×140-Raster (Boden bei y≈138) und werden
// untenbündig ausgerichtet — die Figuren stehen auf der Arena, nicht im
// Leerraum. Bosse erhalten die goldene Krone des jeweiligen Archetyps.

// Fünfzackige Krone des Throns; der Punkt ist ein Auge-Edelstein, der im
// Kontinent-Licht glimmt. Über translate an die Kopfposition je Archetyp.
const CROWN = 'M41 8 L41 1.5 L45.5 5 L50 0.5 L54.5 5 L59 1.5 L59 8 Z';
const CROWN_GEM = '<circle class="se" cx="50" cy="5" r="1" opacity="0.9"/>';
const crown = (dx, dy) => `<g transform="translate(${dx} ${dy})"><path class="sc" d="${CROWN}"/>${CROWN_GEM}</g>`;

function wrap(inner) {
  // Größe/Overflow als Klasse .sprite-svg — Inline-Style-Attribute verwirft
  // die Content-Security-Policy des Desktop-Builds.
  return `<svg class="sprite-svg" viewBox="0 0 100 140" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${inner}</svg>`;
}

// Gebückter Diener: zerlumpte Gestalt, schwebender Arm mit Krallenhand.
const KNECHT = (boss) => wrap(`
  <path class="sb" d="M46 22 C38 22 33 28 31 36 C28 50 27 66 29 82 L25 104 L30 100 L31 112 L37 104 L40 116 L45 106 L50 118 L55 106 L59 115 L63 103 L65 111 L70 102 L68 82 C71 66 70 50 66 36 C64 28 56 22 46 22 Z"/>
  <path class="sr" d="M31 36 C28 50 27 66 29 82 L25 104 L30 100 L31 82 C30 66 31 50 34 38 Z" opacity="0.55"/>
  <path class="sb" d="M46 6 C40 6 36 11 36 16 C36 22 40 26 46 26 C52 26 56 22 56 16 C56 11 52 6 46 6 Z"/>
  <path class="sb" d="M63 40 C70 46 74 56 75 68 L78 84 L72 80 L74 92 L68 86 L69 98 L63 84 C61 70 61 54 63 40 Z"/>
  <circle class="se" cx="41.5" cy="15" r="1.7"/>
  <circle class="se" cx="50" cy="14.4" r="1.7"/>
  ${boss ? crown(-4, 0) : ''}
`);

// Vierbeinige Bestie: geduckter Rücken mit Dornenkamm, gesenkter Schädel.
const KRIECHER = (boss) => wrap(`
  <path class="sb" d="M14 98 C16 86 26 78 40 76 C54 74 68 78 78 86 C85 92 88 100 86 106 L76 106 L78 112 L24 112 L26 106 L16 106 Z"/>
  <path class="sb" d="M22 86 C15 85 9 89 7 95 C5 101 9 106 15 107 L27 107 C30 107 32 104 32 100 L32 92 C30 88 26 86 22 86 Z"/>
  <path class="sb" d="M80 90 C88 86 94 91 93 98 C92 103 87 105 83 102 L79 96 Z"/>
  <path class="sb" d="M28 110 L25 134 L31 134 L34 110 Z"/>
  <path class="sb" d="M42 112 L41 136 L47 136 L48 112 Z"/>
  <path class="sb" d="M60 112 L61 136 L67 136 L68 112 Z"/>
  <path class="sb" d="M74 110 L77 132 L83 132 L84 110 Z"/>
  <path class="sr" d="M34 78 L38 67 L43 77 Z M46 76 L51 64 L56 75 Z M58 77 L63 68 L67 79 Z" opacity="0.9"/>
  <circle class="se" cx="15" cy="96" r="1.8"/>
  ${boss ? crown(-35, 76) : ''}
`);

// Gerüsteter Wächter: Helm mit Glutschlitz, Tellern, Schwert zur Erde.
const RITTER = (boss) => wrap(`
  <path class="sb" d="M42 6 C38 6 35 10 35 15 L35 26 C35 27 36 28 37 28 L63 28 C64 28 65 27 65 26 L65 15 C65 10 62 6 58 6 Z"/>
  <path class="sb" d="M31 32 C25 34 23 40 25 47 L37 44 L37 34 Z"/>
  <path class="sb" d="M69 32 C75 34 77 40 75 47 L63 44 L63 34 Z"/>
  <path class="sb" d="M37 30 L63 30 L67 58 L33 58 Z"/>
  <path class="sr" d="M35 52 L65 52 L64 57 L36 57 Z" opacity="0.8"/>
  <path class="sb" d="M33 58 L67 58 L65 80 L58 77 L56 86 L50 79 L44 86 L42 77 L35 80 Z"/>
  <path class="sb" d="M40 80 L37 108 L34 134 L43 134 L46 108 L47 84 Z"/>
  <path class="sb" d="M60 80 L63 108 L66 134 L57 134 L54 108 L53 84 Z"/>
  <path class="sx" d="M77 40 L79 40 L80 48 L76 48 Z"/>
  <path class="sr" d="M71 48 L85 48 L85 51 L71 51 Z"/>
  <path class="sx" d="M76 48 L80 48 L81 94 L78 102 L75 94 Z"/>
  <rect class="se" x="40" y="17" width="20" height="2.6" rx="1.3"/>
  ${boss ? crown(0, 0) : ''}
`);

// Gekräuselter Kultist: Kapuze über leerem Antlitz, Stab mit Glimmorb.
const KULTIST = (boss) => wrap(`
  <path class="sb" d="M50 24 C43 24 37 31 35 42 C32 60 30 84 27 104 L23 128 L33 122 L39 130 L50 126 L61 130 L67 122 L77 128 L73 104 C70 84 68 60 65 42 C63 31 57 24 50 24 Z"/>
  <path class="sr" d="M35 42 C32 60 30 84 27 104 L31 100 C33 82 35 60 38 44 Z" opacity="0.5"/>
  <path class="sb" d="M50 4 C41 4 35 13 36 26 C40 30 45 32 50 32 C55 32 60 30 64 26 C65 13 59 4 50 4 Z"/>
  <path class="sv" d="M50 15 C45 15 42 19 42 25 C46 28 54 28 58 25 C58 19 55 15 50 15 Z"/>
  <circle class="se" cx="46.5" cy="21.5" r="1.5"/>
  <circle class="se" cx="53.5" cy="21.5" r="1.5"/>
  <path class="sx" d="M79 34 L81 34 L82 132 L78 132 Z"/>
  <circle class="se" cx="80" cy="29" r="5" opacity="0.22"/>
  <circle class="se" cx="80" cy="29" r="3.2" opacity="0.9"/>
  ${boss ? crown(0, -2) : ''}
`);

// Schwebender Schatten: kopfloser Umhang aus Rauch, schräg glimmende Augen.
const SCHATTEN = (boss) => wrap(`
  <path class="sb" d="M50 11 C45 11 41 15 41 20 C41 25 45 29 50 29 C55 29 59 25 59 20 C59 15 55 11 50 11 Z"/>
  <path class="sb" d="M50 26 C41 26 34 33 33 44 C32 56 34 68 31 82 C29 92 25 102 20 110 L30 106 L32 118 L38 107 L42 119 L48 108 L54 119 L60 106 L64 116 L66 104 L76 109 C71 100 68 91 67 82 C66 68 68 56 67 44 C66 33 59 26 50 26 Z"/>
  <path class="sr" d="M50 32 C45 32 41 36 40 42 C43 38 46 37 50 37 C54 37 57 38 60 42 C59 36 55 32 50 32 Z" opacity="0.5"/>
  <path class="se" d="M43.5 18 L49 20 L43.5 22 Z"/>
  <path class="se" d="M56.5 18 L51 20 L56.5 22 Z"/>
  ${boss ? crown(0, 2) : ''}
`);

// Breiter Koloss: Schulterwände, bis zum Boden reichende Arme, kleiner Kopf.
const KOLOSS = (boss) => wrap(`
  <path class="sb" d="M50 20 C39 20 30 27 26 40 L21 66 L19 92 L14 112 L24 116 L28 92 L30 108 L32 122 L44 122 L44 100 L56 100 L56 122 L68 122 L70 108 L72 92 L76 116 L86 112 L81 92 L79 66 L74 40 C70 27 61 20 50 20 Z"/>
  <path class="sr" d="M24 38 C19 45 18 55 21 64 L30 59 L28 44 Z" opacity="0.8"/>
  <path class="sr" d="M76 38 C81 45 82 55 79 64 L70 59 L72 44 Z" opacity="0.8"/>
  <path class="sb" d="M44 6 C40 6 37 9 37 13 C37 18 40 21 44 21 L56 21 C60 21 63 18 63 13 C63 9 60 6 56 6 Z"/>
  <rect class="se" x="41" y="12" width="6" height="2.4" rx="1.2"/>
  <rect class="se" x="53" y="12" width="6" height="2.4" rx="1.2"/>
  ${boss ? crown(0, -2) : ''}
`);

// Geharnischter Regent: Krone, Umhang aus Asche, aufrechtes Standbild.
const REGENT = (boss) => wrap(`
  <path class="sr" d="M50 30 C37 32 27 42 23 58 C19 76 17 98 13 118 L23 112 L27 124 L35 114 L39 126 L47 116 L50 126 L53 116 L61 126 L65 114 L73 124 L77 112 L87 118 C83 98 81 76 77 58 C73 42 63 32 50 30 Z" opacity="0.9"/>
  <path class="sb" d="M50 24 C44 24 39 28 38 34 L35 52 L33 78 L35 104 L41 104 L43 84 L45 104 L55 104 L57 84 L59 104 L65 104 L67 78 L65 52 L62 34 C61 28 56 24 50 24 Z"/>
  <path class="sb" d="M50 7 C46 7 42 11 42 15 C42 20 46 24 50 24 C54 24 58 20 58 15 C58 11 54 7 50 7 Z"/>
  <rect class="se" x="44.5" y="14" width="4.6" height="2" rx="1"/>
  <rect class="se" x="51.5" y="14" width="4.6" height="2" rx="1"/>
  ${crown(0, 0)}
`);

const ARCHETYPES = { knecht: KNECHT, kriecher: KRIECHER, ritter: RITTER, kultist: KULTIST, schatten: SCHATTEN, koloss: KOLOSS, regent: REGENT };

// Namens-Tabelle → Archetyp. Erster Treffer gewinnt; die Reihenfolge folgt
// der Lesart: Gekrönte zuerst, dann Ungeheuer, Geister, Geistlichkeit,
// Militär. Was übrig bleibt, wandert per Namens-Hash in einen Grundtyp —
// deterministisch, damit dieselbe Kreatur immer gleich aussieht.
const ARCHETYPE_RULES = [
  ['regent', /könig|königin|fürst|graf|herzog|mutter|gott|krone|thron|herz|jungfrau|bestattet|eingefroren|verwest|verschling|verschluckt|gestürzt|namelos|stille\b|ewig|bann/i],
  ['koloss', /koloss|avatar/i],
  ['kultist', /chor|organist|priester|prediger|herold|magd|schreiber|ärztin|wartin|weber|pilger|archivar|kämmerin|zahlmeister|doppelgeld|botschafter|meister|heilkund/i],
  ['kriecher', /ratte|wurm|wühler|kriecher|spross|schwimm|schleim|würger|schürfer/i],
  ['schatten', /schatten|schleicher|schlinger|echo|geboren|wicht|läufer|anomalie|leiche|tänzer/i],
  ['ritter', /ritter|wächter|wache|warter|kämmerer|fähnrich|garde|diener|jäger|söldner|lanzknecht|knecht|mörder|kerkerer|hüter|träger|fessel|schreiter|schlächter|gefolge|herr\b/i],
];

const FALLBACK_ARCHETYPES = ['knecht', 'schatten', 'kultist', 'ritter'];

function hashOf(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function archetypeOf(name) {
  for (const [archetype, pattern] of ARCHETYPE_RULES) {
    if (pattern.test(name)) return archetype;
  }
  return FALLBACK_ARCHETYPES[hashOf(name) % FALLBACK_ARCHETYPES.length];
}

export function spriteSvgFor(name, isBoss = false) {
  return ARCHETYPES[archetypeOf(name)](isBoss);
}
