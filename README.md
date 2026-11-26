# piked.app

Webseite von PikeD (Startseite, Impressum, Datenschutz, Nutzungsbedingungen – Deutsch und Englisch).

- Impressum und Datenschutz kommen aus der App (`~/PikeD/src/rechtliches/texte.ts`). Nach jeder Änderung dort:
  `node werkzeug/bauen.mjs` ausführen, dann committen und pushen.
- Startseite und Nutzungsbedingungen stehen in `werkzeug/bauen.mjs`.
- Veröffentlicht über GitHub Pages (Domain piked.app, Datei `CNAME`).
