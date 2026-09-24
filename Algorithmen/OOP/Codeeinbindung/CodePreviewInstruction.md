# Code-Preview-Seiten (Processing-Simulation)

Vorgabe für alle Seiten in `Codeeinbindung/`. Referenzseite: `BeispielVererbung/`.

Eine Code-Preview-Seite zeigt ein Processing-Projekt in einer nachgebauten
Processing-IDE. Mit ▶ wird der Code wirklich ausgeführt, und die Ausgabe erscheint in
der Konsole wie in Processing. Die Seite wird über ein iframe in Logseq eingebunden.

## Auftrag in Kurzform

> Neue Code-Preview-Seite `Beispiel<Thema>` aus Vorlage `<Pfad zum Processing-Ordner>`,
> nach `Codeeinbindung/CodePreviewInstruction.md`.

## Vorgehen

1. Den Ordner `BeispielVererbung/` nach `Beispiel<Thema>/` kopieren (kebab/ASCII, kein
   Leerzeichen, kein Umlaut im Ordnernamen).
2. In der `index.html` nur zwei Dinge ändern:
   - `<title>`: `<Sketchname> – Beispiel <Thema>`
   - Die `<script type="text/x-processing" data-tab="…">`-Blöcke durch den Code der Vorlage
     ersetzen: ein Block pro `.pde`-Datei, der Hauptsketch zuerst, danach die übrigen
     Dateien alphabetisch (wie die Reiter in Processing). `data-tab` ist der Dateiname ohne
     `.pde`. Der Code steht bündig am linken Rand, damit die Einrückung stimmt.
3. In der `script.js` nur `STORAGE_KEY` anpassen: `infsek2-oop-beispiel<thema>-v1`.
4. `style.css` bleibt unverändert.
5. Testen (siehe unten), nicht committen, nicht pushen.

`script.js` enthält einen allgemeinen Interpreter und muss für neue Beispiele nicht
umgeschrieben werden. Nur wenn die Vorlage etwas braucht, das er nicht kann (siehe
„Grenzen“), gezielt erweitern und das melden.

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
| Editor | Zeilennummern, Syntaxfarben wie Processing, nur lesbar, feste Höhe |
| Meldungsleiste | Hinweis vor dem ersten Start, Rückmeldungen, Fehler rot |
| Konsole | schwarz, weiße Monospace-Schrift, Fehler in Rot |
| Konsolenreiter | `Konsole` (aktiv) / `Fehler`, nur Deko |

Footer wie immer: `© 2026 Martin-Andersen-Nexö-Gymnasium Dresden`.

## So verhält sich die Seite

- **▶ Ausführen:** leert die Konsole und führt den Code aus. Es öffnet sich ein
  Sketchfenster (100×100, grau `#cccccc`, Titel = Sketchname) unten rechts im Editor.
  Es lässt sich an der Titelleiste verschieben. ▶ leuchtet, solange der Sketch läuft.
  Erneutes ▶ startet neu.
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

Mit 700px passen rund 16 Codezeilen ohne Scrollen. Bei längeren Hauptreitern die Höhe
erhöhen und im Ergebnis mitteilen. Wichtig im Code: kein `scrollIntoView`, kein Autofokus
beim Laden, sonst springt die Logseq-Seite.

## Was der Interpreter kann

Klassen mit `extends` und `abstract`, Attribute mit Startwerten, Konstruktoren mit
`super(...)`, Methoden mit Überschreiben und `super.methode()`, `toString()`, `this`,
`new`, `instanceof`, Casts, `int`/`float` mit Java-Rechenregeln (`10 / 4` → `2`,
Float-Ausgabe `2.0`), `String`-Verkettung und einige String-Methoden, `if`/`else`,
`while`, `for`, `for (T x : array)`, `break`/`continue`, eindimensionale Arrays.

Processing: `setup()`, `draw()` mit `frameCount`, `frameRate()`, `noLoop()`, `loop()`,
`exit()`, `println`/`print`/`printArray` (Arrays wie Processing als `[0] …`), `size()`,
`background()`, `color()`, `width`, `height` und Mathefunktionen (`abs`, `min`, `max`,
`round`, `floor`, `ceil`, `sqrt`, `pow`, `random`, `int`, `float`, `str`).

Wie Java beim Übersetzen prüft er auch statische Typen. `Medium m = new Movie(…);
m.director` ergibt den Fehler „„director“ ist kein Attribut der Klasse „Medium““.

## Grenzen

Keine Zeichenbefehle außer `size()` und `background()`. `rect()`, `fill()`, `text()` usw.
melden „zeichnet – das zeigt diese Simulation nicht an“. Außerdem nicht unterstützt:
`ArrayList` und andere Generics, `interface`, `switch`, `do`, `try`, mehrdimensionale
Arrays, Maus- und Tastaturereignisse, Anweisungen außerhalb von Funktionen.

Braucht eine Vorlage so etwas, entweder den Interpreter gezielt erweitern oder vorher
nachfragen.

## Testen vor dem Abschluss

Über einen lokalen Server mit headless Chrome, Testdateien nur im Scratchpad
(Vorgehen: `lernwebseite`-Skill, `references/pruefen.md`). Mindestens prüfen:

- ▶ ergibt genau die Konsolenausgabe, die Processing liefern würde (Zeile für Zeile
  nachrechnen)
- ■ und ✕ schließen das Fenster und leeren die Konsole
- Kopieren liefert den kompletten Reiter-Text
- Das ZIP lässt sich entpacken (`Expand-Archive`) und hat die richtige Ordnerstruktur
- Footer exakt, keine JS-Fehler
- 430px breit: kein Querscrollen
- iframe 800×700: kein Seitenscrollen

Am Ende liegen im Seitenordner nur `index.html`, `style.css`, `script.js`.
