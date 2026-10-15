import { defineConfig } from 'vite';

// Relative Pfade (./assets/… statt /assets/…): Der Web-Build läuft so lokal,
// in der Tauri-Shell und auf GitHub Pages unter /ashen-crown/ gleichermaßen.
export default defineConfig({
  base: './',
});
