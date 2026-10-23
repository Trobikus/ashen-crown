// Loader-Hooks für tools/i18n-runtime-check.mjs: Node kann SVG/PNG/CSS/JSON-
// Imports der Spielmodule nicht auflösen — sie werden auf ein Stub-Modul mit
// String-Default abgebildet (die Icons dienen nur als URL-String im Markup).
export async function resolve(specifier, context, nextResolve) {
  if (/\.(svg|png|css|json)$/.test(specifier)) {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export default "stub";',
    };
  }
  return nextResolve(specifier, context);
}
