// Kurze Einblendungen: Toasts (rechts unten, für Beute und Hinweise) und
// der Levelup-Schriftzug über der Heldenfigur.

export function toast(text, color = '#8a7f6d') {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.borderColor = color;
  el.style.color = color;
  el.textContent = text;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 400);
  }, 3200);
  while (wrap.childElementCount > 4) wrap.firstChild.remove();
}

export function levelUpFloat(level) {
  const game = document.getElementById('game');
  const figure = document.getElementById('hero-fighter');
  if (!game || game.hidden || !figure) return;
  const span = document.createElement('span');
  span.className = 'level-float';
  span.textContent = `Stufe ${level}`;
  figure.appendChild(span);
  setTimeout(() => span.remove(), 1300);
}
