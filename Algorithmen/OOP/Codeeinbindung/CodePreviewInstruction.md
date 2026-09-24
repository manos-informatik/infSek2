# Code-Preview-Seiten (Processing-Simulation)

Vorgabe für alle Seiten in `Codeeinbindung/`. Referenzseite: `BeispielVererbung/`.

Eine Code-Preview-Seite zeigt ein Processing-Projekt in einer nachgebauten
Processing-IDE. Mit ▶ wird der Code wirklich ausgeführt, und die Ausgabe erscheint in
der Konsole wie in Processing. Die Seite wird über ein iframe in Logseq eingebunden.

## Auftrag in Kurzform

> Neue Code-Preview-Seite `Beispiel<Thema>` aus Vorlage `<Pfad zum Processing-Ordner>`,
> nach `Codeeinbindung/CodePreviewInstruction.md`.

## Vorgehen

1. Einen der fertigen Ordner (z. B. `BeispielVererbung/`) in den genannten Arbeitsordner
   kopieren (ASCII, kein Leerzeichen, kein Umlaut im Ordnernamen). Bisher:
   `BeispielVererbung`, `BeispielPolymorphie`, `FertigNachArraylist`.
2. In der `index.html` nur drei Dinge ändern:
   - `<title>`: `<Sketchname> – <Thema>` (z. B. `MedienProjekt – Beispiel Vererbung`)
   - Die `<script type="text/x-processing" data-tab="…">`-Blöcke durch den Code der Vorlage
     ersetzen: ein Block pro `.pde`-Datei, der Hauptsketch zuerst, danach die übrigen
     Dateien alphabetisch (wie die Reiter in Processing). `data-tab` ist der Dateiname ohne
     `.pde`. Der Code steht bündig am linken Rand, damit die Einrückung stimmt.
   - `data-hervorheben` an `<section class="ide">`: Wörter, die neu sind und im Code gelb
     markiert werden sollen, mit Leerzeichen getrennt (z. B. `"extends super"` bei
     Vererbung, `"@Override"` bei Polymorphie). Mit Punkt davor markiert ein Eintrag nur
     Methodenaufrufe: `".size"` trifft `formen.size()`, aber nicht Processings
     `size(800, 600)` (z. B. `"ArrayList .add .get .size"`). Nicht klar, was neu ist?
     Nachfragen. Nichts markieren: Attribut leer lassen.
3. In der `script.js` nur `STORAGE_KEY` anpassen: `infsek2-oop-<ordnername klein>-v1`.
4. `style.css` bleibt unverändert.
5. Testen (siehe unten), nicht committen, nicht pushen.

`script.js` enthält einen allgemeinen Interpreter und muss für neue Beispiele nicht
umgeschrieben werden. Nur wenn die Vorlage etwas braucht, das er nicht kann (siehe
„Grenzen“), gezielt erweitern und das melden. **`script.js` ist in allen Seiten gleich**
(bis auf `STORAGE_KEY`), ebenso `style.css`: Eine Erweiterung in alle Ordner unter
`Codeeinbindung/` übernehmen und die älteren Seiten erneut testen.

## Umgang mit dem Vorlagen-Code

- Klassen-, Attribut- und Methodennamen und alle Texte wörtlich übernehmen.
- Die `.pde`-Dateien der Vorlage nie verändern, nur lesen.
- Offensichtliche Fehler in der Vorlage **nicht stillschweigend** übernehmen oder
  korrigieren, sondern im Ergebnis melden. Beispiel: `println("Movie: " + movie.title, 30, 45);`
  (Koordinaten aus `text(...)` stehen geblieben). Echtes Processing würde
  `Movie: Mein Film 30 45` ausgeben. Auf der Seite wurden die Koordinaten entfernt und
  das wurde gemeldet.

## So sieht die Seite aus

**Kein Kopfbereich**: kein Hero, keine Eyebrow, keine sichtbare Überschrift. Die Seite
besteht nur aus der IDE und dem Footer. Kein Intro-Text, keine Aufgaben, kein
💡-Modal: Erklärungen stehen in Logseq.

IDE von oben nach unten, Farben wie auf `VererbungUndPolymorphie` (heller
Processing-Look auf dem dunklen Haus-Hintergrund):

| Bereich | Inhalt |
|---|---|
| Werkzeugleiste | runder ▶-Knopf (Ausführen), runder ■-Knopf (Stopp), rechts `Projekt-Downloaden`, daneben das Feld `Java` |
| Reiterzeile | ein Reiter pro Datei (Monospace), rechts `Kopieren`, bündig unter `Java` |
| Editor | Zeilennummern, Syntaxfarben wie Processing, nur lesbar, feste Höhe; das Neue (`data-hervorheben`) gelb hinterlegt und fett |
| Meldungsleiste | Hinweis vor dem ersten Start, Rückmeldungen, Fehler rot |
| Konsole | schwarz, weiße Monospace-Schrift, Fehler in Rot |
| Konsolenreiter | `Konsole` (aktiv) / `Fehler`, nur Deko |

Footer wie immer: `© 2026 Martin-Andersen-Nexö-Gymnasium Dresden`.

## So verhält sich die Seite

- **▶ Ausführen:** leert die Konsole und führt den Code aus. Es öffnet sich ein
  Sketchfenster (Titel = Sketchname, ohne `size()` 100×100 in Grau `#cccccc`) unten
  rechts im Editor. Es lässt sich an der Titelleiste verschieben. ▶ leuchtet, solange der
  Sketch läuft. Erneutes ▶ startet neu.
- **Sketchfenster:** zeigt, was der Sketch zeichnet, `draw()` läuft wie in Processing in
  der Schleife. Größere Sketche (z. B. `size(800, 600)`) werden maßstabsgetreu verkleinert
  angezeigt, auf höchstens 45 % der IDE-Breite und ¾ der Editorhöhe. Gezeichnet wird intern
  in voller Größe. Wie in Processing darf das Fenster Code verdecken, man kann es
  wegschieben.
- **■ Stopp** und **✕ am Sketchfenster:** schließen das Fenster **und leeren die Konsole**.
  ■ ist nur aktiv, solange der Sketch läuft.
- **Fehler:** Exceptions (z. B. NullPointerException) erscheinen rot in Konsole und
  Meldungsleiste, die Ausgabe davor bleibt stehen. Fehler, die Java schon beim Übersetzen
  findet (Syntax, falscher Typ, fehlendes `super(...)`), leeren die Konsole wie in
  Processing. Die fehlerhafte Zeile wird markiert und ihr Reiter geöffnet.
- **Kopieren:** kopiert den kompletten Code des offenen Reiters. Rückmeldung in der
  Meldungsleiste, mit Fallback für iframes ohne Zwischenablage-Recht.
- **Projekt-Downloaden:** lädt `<Sketchname>.zip` mit dem Ordner `<Sketchname>/` und einer
  `.pde` pro Reiter. So lässt es sich direkt in Processing öffnen. Die Seite baut die
  ZIP-Datei selbst, ohne Bibliothek.
- **Gespeichert** wird nur der offene Reiter (localStorage). Es gibt keine Speichern-Knöpfe.
- **Reiter** lassen sich mit Klick, ←/→, Pos1 und Ende wechseln.

## Einbindung in Logseq

Im iframe schaltet die Seite von selbst in den Einbettungsmodus: Die IDE füllt die ganze
iframe-Höhe, und der Footer wird klein. `?embed=0` schaltet das ab, `?embed=1` erzwingt es.

```html
<iframe src="https://manos-informatik.github.io/infSek2/Algorithmen/OOP/Codeeinbindung/Beispiel<Thema>/" allow="clipboard-write" style="width:100%; height:700px; border:0;"></iframe>
```

Höhe nach der Länge des Hauptreiters: 700px für rund 16 Zeilen, pro weitere Zeile etwa
21px mehr (20 Zeilen → 820px, 24 Zeilen → 900px). Die passende Höhe im Ergebnis
mitteilen. Wichtig im Code: kein `scrollIntoView`, kein Autofokus
beim Laden, sonst springt die Logseq-Seite.

## Was der Interpreter kann

Klassen mit `extends` und `abstract`, Attribute mit Startwerten, Konstruktoren mit
`super(...)`, Methoden mit Überschreiben und `super.methode()`, `@Override` (wird wie in
Java geprüft: ohne passende Methode in der Oberklasse gibt es einen Fehler), `toString()`, `this`,
`new`, `instanceof`, Casts, `int`/`float` mit Java-Rechenregeln (`10 / 4` → `2`,
Float-Ausgabe `2.0`), `String`-Verkettung und einige String-Methoden, `if`/`else`,
`while`, `for`, `for (T x : array/liste)`, `break`/`continue`, eindimensionale Arrays,
Umlaute in Namen (`int höhe`).

`ArrayList<T>` (auch `new ArrayList<>()`) mit `add`, `add(i, x)`, `get`, `set`, `remove`
(Index oder Objekt), `size`, `isEmpty`, `clear`, `contains`, `indexOf`, Ausgabe wie Java
(`[a, b, c]`). Generics werden streng geprüft (`ArrayList<Kreis>` ist keine
`ArrayList<Form>`), `formen.get(i)` hat den Typ aus `< >`.

Processing: `setup()`, `draw()` mit `frameCount`, `frameRate()`, `noLoop()`, `loop()`,
`exit()`, `println`/`print`/`printArray` (Arrays wie Processing als `[0] …`), `width`,
`height`, `PI`/`HALF_PI`/`QUARTER_PI`/`TWO_PI` (als float), Mathefunktionen (`abs`, `min`,
`max`, `round`, `floor`, `ceil`, `sqrt`, `pow`, `random`, `int`, `float`, `str`).

Zeichnen: `size()`, `background()`, `color()`, `fill`/`noFill`, `stroke`/`noStroke`,
`strokeWeight`, `rect`, `square`, `ellipse`, `circle`, `line`, `point`, `triangle`,
`text`, `textSize`, `rectMode`/`ellipseMode` mit `CORNER`/`CORNERS`/`RADIUS`/`CENTER`.
Startzustand wie Processing: weiße Füllung, schwarzer Rand 1px.

Wie Java beim Übersetzen prüft er auch statische Typen. `Medium m = new Movie(…);
m.director` ergibt den Fehler „„director“ ist kein Attribut der Klasse „Medium““.

## Grenzen

Nicht unterstützt: `quad`, `arc`, `textAlign`, Bilder, Transformationen
(`translate`/`rotate`/`scale`, `push`/`pop`), `beginShape`, `colorMode`. Sie melden
„zeichnet – das zeigt diese Simulation nicht an“. Außerdem: andere Generics als `ArrayList`
(`HashMap`, …), `PVector`, `interface`, `switch`, `do`, `try`, mehrdimensionale Arrays,
Maus- und Tastaturereignisse, Anweisungen außerhalb von Funktionen.

Braucht eine Vorlage so etwas, entweder den Interpreter gezielt erweitern oder vorher
nachfragen.

## Testen vor dem Abschluss

Über einen lokalen Server mit headless Chrome, Testdateien nur im Scratchpad
(Vorgehen: `lernwebseite`-Skill, `references/pruefen.md`). Mindestens prüfen:

- ▶ ergibt genau die Konsolenausgabe, die Processing liefern würde (Zeile für Zeile
  nachrechnen)
- ■ und ✕ schließen das Fenster und leeren die Konsole
- Wird gezeichnet: Pixel an festen Stellen prüfen (Farbe, `rectMode`), Fenster im
  Seitenverhältnis des Sketches und innerhalb der IDE, auch bei 430px Breite
- Kopieren liefert den kompletten Reiter-Text
- Das ZIP lässt sich entpacken (`Expand-Archive`) und hat die richtige Ordnerstruktur
- Footer exakt, keine JS-Fehler
- 430px breit: kein Querscrollen
- iframe 800×700: kein Seitenscrollen

Am Ende liegen im Seitenordner nur `index.html`, `style.css`, `script.js`.
