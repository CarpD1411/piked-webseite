// Baut die Seiten der PikeD-Webseite neu.
// Impressum und Datenschutz kommen direkt aus der App (~/PikeD/src/rechtliches/texte.ts),
// damit App und Webseite immer dasselbe sagen. Startseite und Nutzungsbedingungen stehen unten.
// Aufruf (im Ordner ~/PikeD-Webseite):  node werkzeug/bauen.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(HIER, '..', 'PikeD');
const require = createRequire(join(APP, 'package.json'));
const ts = require('typescript');

// texte.ts aus der App in JavaScript umwandeln und laden
const quelle = readFileSync(join(APP, 'src/rechtliches/texte.ts'), 'utf8');
const js = ts.transpileModule(quelle, { compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 } }).outputText;
const texte = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const MAIL = texte.KONTAKT_MAIL;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Mail-Adressen im Text anklickbar machen
const mitLinks = (s) => esc(s).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => `<a href="mailto:${m}">${m}</a>`);

const SPRACHE = {
  de: {
    lang: 'de', wurzel: '', andere: 'en/', andereName: 'English',
    seiten: { start: 'index.html', datenschutz: 'datenschutz.html', impressum: 'impressum.html', bedingungen: 'nutzungsbedingungen.html' },
    nav: { datenschutz: 'Datenschutz', impressum: 'Impressum', bedingungen: 'Nutzungsbedingungen', kontakt: 'Kontakt' },
    zurueck: '← zurück zu PikeD',
    fuss: 'Gewässerdaten ©',
    osm: 'OpenStreetMap-Mitwirkende',
    titelDatenschutz: 'Datenschutzerklärung',
    titelImpressum: 'Impressum',
    titelBedingungen: 'Nutzungsbedingungen',
    dieseWebseite: {
      titel: 'Diese Webseite',
      absaetze: [
        'Diese Webseite verwendet keine Cookies, keine Analyse- oder Werbedienste und lädt keine Inhalte von fremden Servern (auch keine Schriften).',
        'Sie liegt bei GitHub Pages (GitHub, Inc., USA). Beim Aufruf verarbeitet GitHub technisch bedingt deine IP-Adresse und Angaben zum Browser, um die Seite auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren, erreichbaren Webseite). Für Übermittlungen in die USA gilt das EU-US Data Privacy Framework.',
      ],
    },
  },
  en: {
    lang: 'en', wurzel: '../', andere: '../', andereName: 'Deutsch',
    seiten: { start: 'index.html', datenschutz: 'privacy.html', impressum: 'imprint.html', bedingungen: 'terms.html' },
    nav: { datenschutz: 'Privacy', impressum: 'Imprint', bedingungen: 'Terms of use', kontakt: 'Contact' },
    zurueck: '← back to PikeD',
    fuss: 'Water data ©',
    osm: 'OpenStreetMap contributors',
    titelDatenschutz: 'Privacy policy',
    titelImpressum: 'Imprint',
    titelBedingungen: 'Terms of use',
    dieseWebseite: {
      titel: 'This website',
      absaetze: [
        'This website uses no cookies, no analytics or advertising services and loads no content from third-party servers (not even fonts).',
        'It is hosted on GitHub Pages (GitHub, Inc., USA). When you visit, GitHub necessarily processes your IP address and browser information to deliver the page and protect it against attacks. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in a secure, available website). Transfers to the USA are covered by the EU-US Data Privacy Framework.',
      ],
    },
  },
};

function rahmen(s, titel, beschreibung, inhalt, startseite = false) {
  const w = s.wurzel;
  return `<!DOCTYPE html>
<html lang="${s.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titel)}</title>
  <meta name="description" content="${esc(beschreibung)}">
  ${startseite ? '' : '<meta name="robots" content="noindex">\n  '}<meta name="theme-color" content="#0b0b0b">
  <link rel="icon" href="${w}logo.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${w}apple-touch-icon.png">
  <link rel="stylesheet" href="${w}stil.css">
</head>
<body>
  <header class="leiste">
    <div class="breite">
      <a class="marke" href="${s.seiten.start}"><img src="${w}logo.svg" alt="" width="36" height="36"><span>Pike<span class="d">D</span></span></a>
      <nav>
        <a href="${s.seiten.start}#kontakt">${s.nav.kontakt}</a>
        <a href="${s.seiten.datenschutz}">${s.nav.datenschutz}</a>
        <a href="${s.andere}${startseite ? '' : s === SPRACHE.de ? SPRACHE.en.seiten[seiteVon(s, titel)] : SPRACHE.de.seiten[seiteVon(s, titel)]}" lang="${s === SPRACHE.de ? 'en' : 'de'}">${s.andereName}</a>
      </nav>
    </div>
  </header>
${inhalt}
  <footer>
    <div class="breite">
      <span>${s.fuss} <a href="https://www.openstreetmap.org/copyright">${s.osm}</a></span>
      <span><a href="${s.seiten.impressum}">${s.nav.impressum}</a> · <a href="${s.seiten.datenschutz}">${s.nav.datenschutz}</a> · <a href="${s.seiten.bedingungen}">${s.nav.bedingungen}</a></span>
    </div>
  </footer>
</body>
</html>
`;
}

// Welche Seite gerade gebaut wird (für den Sprach-Link auf dieselbe Seite in der anderen Sprache)
let aktuelleSeite = 'start';
const seiteVon = () => aktuelleSeite;

function textSeite(s, titel, abschnitte, stand) {
  const teile = abschnitte
    .map((a) => `    <h2>${esc(a.titel)}</h2>\n${a.absaetze.map((p) => `    <p>${mitLinks(p)}</p>`).join('\n')}`)
    .join('\n\n');
  return `  <main class="text">
    <p class="zurueck"><a href="${s.seiten.start}">${s.zurueck}</a></p>
    <h1>${esc(titel)}</h1>
${teile}
${stand ? `\n    <p class="klein">${esc(stand)}</p>` : ''}
  </main>`;
}

function schreiben(datei, html) {
  mkdirSync(dirname(join(HIER, datei)), { recursive: true });
  writeFileSync(join(HIER, datei), html);
  console.log('geschrieben:', datei);
}

// ---------- Startseite ----------
const START = {
  de: {
    titel: 'PikeD – die App für Raubfischangler',
    beschreibung: 'PikeD: Beißindex für Hecht, Zander und Barsch, Wetter und Luftdruck am Wasser, Fangbuch mit Köderbox und Touren mit Strecke. Deine Spots bleiben auf deinem Handy.',
    schild: 'Bald im App Store · Testphase läuft',
    h1: 'Die App für <span>Raubfischangler</span>.',
    text: 'Beißindex für Hecht, Zander und Barsch, Wetter und Luftdruck am Wasser – und dein Fangbuch mit Köderbox, in Sekunden eingetragen. Deine Spots bleiben auf deinem Handy.',
    kacheln: [
      ['Beißindex je Fischart', 'Wassertemperatur, Tageszeit, Licht, Wind und Luftdruck – für Hecht, Zander, Barsch und mehr. Er lernt aus deinen eigenen Touren dazu.'],
      ['Touren mit Strecke', 'Starte eine Tour, PikeD zeichnet deinen Weg am Ufer auf. Fänge landen automatisch an der richtigen Stelle.'],
      ['Fangbuch & Köderbox', 'Foto, Art, Köder – fertig. Wetter, Gewässer und Wassertemperatur speichert PikeD von selbst. Und du siehst, was gerade fängt.'],
      ['Gewässerkarte', 'Seen, Flüsse und Kanäle aus OpenStreetMap, offline für 11 Länder. Mit eigenen Spots, Gewässerfotos und Navigation.'],
      ['Schonzeiten & Mindestmaße', 'Für alle 16 Bundesländer. PikeD warnt dich beim Eintragen, wenn ein Fisch geschont ist oder zu klein.'],
      ['Gemacht fürs Wasser', 'Große Knöpfe, Rotlicht-Modus für die Nacht, 10 Sprachen. Keine Werbung, kein Tracking.'],
    ],
    kontaktTitel: 'Kontakt & Hilfe',
    kontaktText: `Fragen, Fehler oder Ideen? Schreib uns an <a href="mailto:${MAIL}">${MAIL}</a> – oder direkt in der App unter Mehr → Feedback.`,
  },
  en: {
    titel: 'PikeD – the app for predator anglers',
    beschreibung: 'PikeD: bite index for pike, zander and perch, weather and air pressure at the water, catch log with lure box and trips with route. Your spots stay on your phone.',
    schild: 'Coming soon to the App Store · test phase running',
    h1: 'The app for <span>predator anglers</span>.',
    text: 'Bite index for pike, zander and perch, weather and air pressure at the water – and your catch log with lure box, logged in seconds. Your spots stay on your phone.',
    kacheln: [
      ['Bite index per species', 'Water temperature, time of day, light, wind and air pressure – for pike, zander, perch and more. It learns from your own trips.'],
      ['Trips with route', 'Start a trip and PikeD records your way along the bank. Catches land in the right place automatically.'],
      ['Catch log & lure box', 'Photo, species, lure – done. PikeD saves weather, water and water temperature by itself. And you see what is catching right now.'],
      ['Water map', 'Lakes, rivers and canals from OpenStreetMap, offline for 11 countries. With your own spots, water photos and navigation.'],
      ['Closed seasons & sizes', 'For all 16 German states. PikeD warns you when logging a catch that is protected or too small.'],
      ['Made for the water', 'Big buttons, red-light mode for the night, 10 languages. No ads, no tracking.'],
    ],
    kontaktTitel: 'Contact & help',
    kontaktText: `Questions, bugs or ideas? Write to <a href="mailto:${MAIL}">${MAIL}</a> – or right in the app under More → Feedback.`,
  },
};

// ---------- Nutzungsbedingungen ----------
const BEDINGUNGEN = {
  de: [
    { titel: '1. Was PikeD ist', absaetze: ['PikeD ist eine App für Raubfischangler: Gewässerkarte, Wetter, Luftdruck, Beißindex, Fangbuch, Köderbox, Touren, Planer und – freiwillig mit Konto – weitere Funktionen, die nach und nach dazukommen. Während der Testphase ist PikeD kostenlos. Testversionen können Fehler enthalten und sich jederzeit ändern.'] },
    { titel: '2. Angaben ohne Gewähr', absaetze: ['Gewässerdaten stammen aus OpenStreetMap, Wetter von Open-Meteo. Beißindex und Wassertemperatur sind Schätzungen. Schonzeiten und Mindestmaße sind eine Hilfe ohne Gewähr. Ob, wo und was du angeln darfst, regeln allein dein Erlaubnisschein, die Gewässerordnung und die Gesetze. Achte am Wasser selbst auf Wetter und deine Sicherheit.'] },
    { titel: '3. Konto', absaetze: ['Ein Konto ist freiwillig und nur für Cloud-Sicherung und Crews nötig. Du bist für deinen Zugang verantwortlich und gibst ihn nicht weiter. Du musst mindestens 16 Jahre alt sein. Du kannst dein Konto jederzeit in der App löschen (Mehr → Konto → Konto löschen).'] },
    { titel: '4. Crew-Regeln – null Toleranz für anstößige Inhalte', absaetze: ['Crews sind geschlossene Gruppen für Angler, die sich gegenseitig respektieren. Bevor du eine Crew gründest oder ihr beitrittst, stimmst du diesen Regeln zu. In Crews ist nicht erlaubt: Beleidigungen, Drohungen, Belästigung oder Hetze; sexuelle, gewalttätige oder anderweitig anstößige Inhalte; Tierquälerei oder Fotos, die Fische unwürdig zeigen; Werbung, Spam oder Betrug; fremde Spots, Namen oder Fotos anderer ohne deren Erlaubnis verraten; Inhalte, die gegen Gesetze oder Gewässerordnungen verstoßen.', 'Jeden Fang kannst du melden und jede Person blockieren. Gemeldete Inhalte prüfen wir innerhalb von 24 Stunden. Verstöße entfernen wir; wer gegen die Regeln verstößt, kann aus Crews und aus PikeD ausgeschlossen werden. Chef und Admins einer Crew können Mitglieder entfernen.'] },
    { titel: '5. Deine Inhalte', absaetze: ['Was du in PikeD einträgst, gehört dir. Teilst du etwas in einer Crew (z. B. Foto, Art, Länge, Gewicht, Gewässer, geplanter Angeltag), erlaubst du uns, es den Mitgliedern dieser Crew anzuzeigen – nur dafür und nur so lange, bis du es aus der Crew nimmst, die Crew verlässt oder dein Konto löschst. Du teilst nur Fotos und Inhalte, an denen du die Rechte hast, und zeigst andere Personen nur mit deren Einverständnis.'] },
    { titel: '6. Verfügbarkeit und Haftung', absaetze: ['Wir bemühen uns um einen zuverlässigen Betrieb, können aber keine ununterbrochene Verfügbarkeit zusagen. Sichere deine Daten regelmäßig (Mehr → Datensicherung). Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit; im Übrigen nur bei Verletzung wesentlicher Pflichten und begrenzt auf den typischen, vorhersehbaren Schaden.'] },
    { titel: '7. Änderungen', absaetze: ['Wir können diese Bedingungen anpassen, z. B. für neue Funktionen oder den Start einer bezahlten Version. Wesentliche Änderungen zeigen wir dir vorher in der App an.'] },
    { titel: '8. Kontakt', absaetze: [`Fragen, Meldungen oder Hinweise: ${MAIL}. Es gilt deutsches Recht.`] },
  ],
  en: [
    { titel: '1. What PikeD is', absaetze: ['PikeD is an app for predator anglers: water map, weather, air pressure, bite index, catch log, lure box, trips, planner and – optionally with an account – further features added over time. During the test phase PikeD is free. Test versions may contain bugs and can change at any time.'] },
    { titel: '2. No guarantee', absaetze: ['Water data comes from OpenStreetMap, weather from Open-Meteo. Bite index and water temperature are estimates. Closed seasons and minimum sizes are a guide without guarantee. Whether, where and what you may fish is governed solely by your permit, the water’s rules and the law. Watch the weather and your own safety at the water.'] },
    { titel: '3. Account', absaetze: ['An account is optional and only needed for cloud backup and crews. You are responsible for your access and do not share it. You must be at least 16 years old. You can delete your account in the app at any time (More → Account → Delete account).'] },
    { titel: '4. Crew rules – zero tolerance for objectionable content', absaetze: ['Crews are closed groups for anglers who respect each other. Before you start or join a crew, you agree to these rules. Not allowed in crews: insults, threats, harassment or hate; sexual, violent or otherwise objectionable content; animal cruelty or photos that show fish without respect; advertising, spam or fraud; revealing other people’s spots, names or photos without their permission; content that breaks laws or water rules.', 'You can report any catch and block any person. We review reported content within 24 hours. We remove violations; anyone who breaks the rules can be excluded from crews and from PikeD. The chief and admins of a crew can remove members.'] },
    { titel: '5. Your content', absaetze: ['What you enter in PikeD belongs to you. If you share something in a crew (e.g. photo, species, length, weight, water, planned fishing day), you allow us to show it to the members of that crew – only for this and only until you remove it from the crew, leave the crew or delete your account. Only share photos and content you have the rights to, and only show other people with their consent.'] },
    { titel: '6. Availability and liability', absaetze: ['We strive for reliable operation but cannot promise uninterrupted availability. Back up your data regularly (More → Backup). We are fully liable for intent and gross negligence and for injury to life, body and health; otherwise only for breach of essential obligations and limited to typical, foreseeable damage.'] },
    { titel: '7. Changes', absaetze: ['We may adjust these terms, e.g. for new features or the launch of a paid version. We will show you significant changes in the app beforehand.'] },
    { titel: '8. Contact', absaetze: [`Questions, reports or notes: ${MAIL}. German law applies.`] },
  ],
};
const BEDINGUNGEN_EINLEITUNG = {
  de: 'Diese Bedingungen gelten für die App PikeD. Anbieter ist die workping GbR – Marino & Kamensek, Egerlandweg 34, 70736 Fellbach (siehe Impressum). Wie wir mit deinen Daten umgehen, steht in der Datenschutzerklärung.',
  en: 'These terms apply to the PikeD app. The provider is workping GbR – Marino & Kamensek, Egerlandweg 34, 70736 Fellbach, Germany (see imprint). How we handle your data is described in the privacy policy.',
};
const STAND = { de: 'Stand: November 2026', en: 'As of November 2026 · The German version is legally binding.' };

for (const k of ['de', 'en']) {
  const s = SPRACHE[k];
  const r = texte.rechtstexte(k);
  const ord = k === 'de' ? '' : 'en/';
  const st = START[k];

  aktuelleSeite = 'start';
  schreiben(
    ord + 'index.html',
    rahmen(
      s,
      st.titel,
      st.beschreibung,
      `  <main class="breite">
    <section class="held">
      <div>
        <span class="schild">${esc(st.schild)}</span>
        <h1>${st.h1}</h1>
        <p>${esc(st.text)}</p>
      </div>
      <div class="bild"><img src="${s.wurzel}logo-512.png" alt="PikeD" width="320" height="320"></div>
    </section>
    <section class="kacheln">
${st.kacheln.map(([t, p]) => `      <div class="kachel"><h2>${esc(t)}</h2><p>${esc(p)}</p></div>`).join('\n')}
    </section>
    <section class="abschnitt" id="kontakt">
      <h2>${esc(st.kontaktTitel)}</h2>
      <p>${st.kontaktText}</p>
    </section>
  </main>`,
      true,
    ),
  );

  aktuelleSeite = 'impressum';
  const impressum = [{ titel: '', absaetze: r.impressum }];
  schreiben(
    ord + s.seiten.impressum,
    rahmen(s, `${s.titelImpressum} – PikeD`, s.titelImpressum, textSeite(s, s.titelImpressum, impressum, '').replace('    <h2></h2>\n', '')),
  );

  aktuelleSeite = 'datenschutz';
  schreiben(
    ord + s.seiten.datenschutz,
    rahmen(s, `${s.titelDatenschutz} – PikeD`, s.titelDatenschutz, textSeite(s, s.titelDatenschutz, [...r.datenschutz, s.dieseWebseite], r.stand)),
  );

  aktuelleSeite = 'bedingungen';
  schreiben(
    ord + s.seiten.bedingungen,
    rahmen(
      s,
      `${s.titelBedingungen} – PikeD`,
      s.titelBedingungen,
      textSeite(s, s.titelBedingungen, [{ titel: '', absaetze: [BEDINGUNGEN_EINLEITUNG[k]] }, ...BEDINGUNGEN[k]], STAND[k]).replace('    <h2></h2>\n', ''),
    ),
  );
}
