# Datenmanagement

Statische Lernwebseite fuer die Selbstdiagnose zu SQL und eERM. Die Anwendung arbeitet komplett mit HTML, CSS und JavaScript und kann ohne Build-Prozess lokal oder ueber GitHub Pages genutzt werden.

## Lokal starten

Direkt im Browser:

1. `Datenmanagement/index.html` im Browser oeffnen.

Mit einfachem lokalen Server:

1. In den Ordner `Datenmanagement` wechseln.
2. `python3 -m http.server 8000` ausfuehren.
3. `http://localhost:8000` im Browser aufrufen.

## GitHub Pages

- Alle Anwendungsdateien liegen im Ordner `Datenmanagement`.
- Wenn GitHub Pages den Repository-Stamm ausliefert, ist die Seite unter dem Unterpfad `/Datenmanagement/` erreichbar.
- Soll `index.html` direkt als Startseite des Repositories erscheinen, muss GitHub Pages auf einen Branch oder Veroeffentlichungsordner zeigen, der den Inhalt dieses Ordners direkt enthaelt.
- Alle Verweise innerhalb der Anwendung sind relativ, damit die Seite auch in Unterverzeichnissen funktioniert.

## Projektstruktur

```text
Datenmanagement/
├── index.html
├── sql.html
├── eerm.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── main.js
    ├── storage.js
    ├── checkers.js
    ├── tasks-sql.js
    └── tasks-eerm.js
```

## Aufgaben erweitern

Neue Aufgaben werden ausschliesslich in den Datendateien gepflegt:

- `js/tasks-sql.js`
- `js/tasks-eerm.js`

Jede Aufgabe folgt demselben Grundschema:

```js
{
  id: "sql-11",
  title: "Titel der Aufgabe",
  theme: "Unterthema",
  difficulty: "Basis",
  sections: [
    { title: "Ausgangslage", type: "text", content: "..." },
    { title: "Schema", type: "code", content: "..." }
  ],
  prompt: "Aufgabenstellung",
  type: "text", // text | single | multi | match | order
  inputLabel: "Antwortfeld",
  options: [],
  rows: [],
  matchOptions: [],
  items: [],
  validation: {},
  feedbackCorrect: "...",
  feedbackIncorrect: "...",
  hints: ["Tipp 1", "Tipp 2"],
  solution: "...",
  solutionFormat: "text",
  explanation: "..."
}
```

Hinweise zum Erweitern:

1. Jede Aufgabe braucht eine eindeutige `id`.
2. `theme` und `difficulty` werden automatisch in den Filtern genutzt.
3. Freitextaufgaben werden ueber `validation.requiredGroups` geprueft.
4. Auswahlaufgaben verwenden `correctOption` oder `correctOptions`.
5. Zuordnungs- und Reihenfolgeaufgaben nutzen `correctMap` bzw. `correctOrder`.
6. Hinweise und Musterloesung werden automatisch in der Oberflaeche angezeigt.

## Annahmen

- Es wird kein kompletter SQL-Interpreter im Browser verwendet. Freitextaufgaben zu SQL werden ueber nachvollziehbare clientseitige Prueflogik bewertet.
- Fortschritt, Rueckmeldungen und Selbsteinschaetzungen werden lokal im Browser per `localStorage` gespeichert.
- Die Anwendung ist fuer eigenstaendige Uebung und Selbstdiagnose gedacht, nicht fuer pruefungssichere Abgabeformate.