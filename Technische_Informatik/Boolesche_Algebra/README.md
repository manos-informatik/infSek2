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

Der Baustein `NOT` schaltet einen Negationsmodus ein. Alle danach gewählten Bausteine werden negiert, bis `NOT` erneut gedrückt wird. Nach jedem korrekten Schritt wird die Lösungshistorie erweitert. Über „Nächsten Schritt anzeigen“ kann ein Hilfeschritt eingeblendet werden.

Gelöste Aufgaben und ihre Lösungshistorie werden im lokalen Browser-Speicher (`localStorage`) gesichert. Dadurch bleiben sie beim erneuten Öffnen der Seite auf demselben Gerät erhalten.

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

Zusätzliche äußere Klammern werden ebenfalls ignoriert, zum Beispiel wird `(¬a ∨ ¬b)` wie `¬a ∨ ¬b` behandelt. In der Oberfläche werden Negationen als Überstrich dargestellt.
