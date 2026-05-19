# Boolesche Algebra Trainer

Statische Übungsseite für Schülerinnen und Schüler der Klasse 11 im Grundkurs Informatik. Die Anwendung trainiert das schrittweise Umformen boolescher Terme mit De Morganschen Gesetzen, Kommutativ-, Assoziativ-, Distributiv- und Komplementärgesetzen.

Die Seite besteht nur aus HTML, CSS und JavaScript. Es gibt keinen Build-Prozess, keine Server-Komponenten und keine Datenbank.

## Nutzung

1. `index.html` im Browser öffnen.
2. Level auswählen: Leicht, Mittel oder Schwer.
3. Eine Aufgabe aus der Aufgabenübersicht anklicken.
4. Das passende Gesetz auswählen.
5. Den nächsten Term über die Baustein-Leiste zusammenklicken.
6. Mit „Schritt prüfen“ kontrollieren.

Der Cursor in der Eingabe kann per Klick oder über die Cursor-Buttons verschoben werden. Neue Bausteine werden an der Cursorposition eingefügt, und „Element vor Cursor löschen“ entfernt gezielt den Baustein links vom Cursor.

Die Bausteine `NOT 1`, `NOT 2` und `NOT 3` sind unabhängige Schalter. Jeder aktive NOT-Schalter fügt eine Negationslinie hinzu; mehrere aktive NOT-Schalter erzeugen entsprechend doppelte oder dreifache Verneinungen. Jeder NOT-Schalter kann einzeln wieder deaktiviert werden. Steht der Cursor vor einem bereits vorhandenen Baustein, erhöht ein NOT-Klick die Negation dieses Bausteins. Nach jedem korrekten Schritt wird die Lösungshistorie erweitert. Über „Nächsten Schritt anzeigen“ kann ein Hilfeschritt eingeblendet werden.

Gelöste Aufgaben und ihre Lösungshistorie werden im lokalen Browser-Speicher (`localStorage`) und zusätzlich in einem Cookie gesichert. Dadurch bleiben sie beim Neuladen der Seite oder nach dem Schließen eines Tabs auf demselben Gerät erhalten.

Über „Fortschritt speichern“ kann der aktuelle Stand als JSON-Datei exportiert werden. „Fortschritt laden“ importiert eine solche JSON-Datei wieder. Der Export enthält die gelösten Aufgaben, den aktuellen Schritt und die vollständige Lösungshistorie.

## Veröffentlichung über GitHub Pages

1. Repository auf GitHub öffnen.
2. Unter `Settings` den Bereich `Pages` öffnen.
3. Als Quelle den gewünschten Branch auswählen, zum Beispiel `main`.
4. Als Ordner je nach Repository-Struktur `/root` oder `/docs` wählen.
5. Speichern und kurz warten, bis GitHub Pages die Seite veröffentlicht hat.

Wenn GitHub Pages aus dem Repository-Root veröffentlicht, ist die Seite anschließend unter diesem Pfad erreichbar:

```text
infSek2/Technische_Informatik/Boolesche_Algebra/
```

## Neue Aufgaben ergänzen

Die Aufgaben stehen in `script.js` in der Datenstruktur `TASKS`.

Beispiel:

```js
{
  title: "Aufgabe 4",
  start: "¬(a ∨ b)",
  steps: [
    { term: "¬a ∧ ¬b", law: "demorgan" }
  ]
}
```

Verfügbare Werte für `law`:

- `demorgan`
- `commutative`
- `associative`
- `distributive`
- `complement`

Die Prüfung folgt einem vorgegebenen Lösungspfad: Ein Schritt ist korrekt, wenn der eingegebene Term und das ausgewählte Gesetz dem nächsten Eintrag in `steps` entsprechen. Leerzeichen werden beim Vergleich ignoriert.

Zusätzliche oder doppelte äußere Klammern werden ignoriert, zum Beispiel wird `(¬a ∨ ¬b)` wie `¬a ∨ ¬b` behandelt. Die Prüfung nutzt außerdem die Operatorrangfolge `NOT` vor `AND` vor `OR`, sodass z. B. `a ∨ b ∧ c` wie `a ∨ (b ∧ c)` erkannt wird. In der Oberfläche werden Negationen als Überstrich dargestellt.
