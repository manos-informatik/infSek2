window.DataManagementTasksSQL = [
  {
    id: "sql-01",
    title: "Filtern nach Jahrgang und Profil",
    theme: "SELECT, WHERE, ORDER BY",
    difficulty: "Basis",
    sections: [
      {
        title: "Tabelle",
        type: "code",
        content: "Schueler(schueler_id, name, jahrgang, profil)"
      }
    ],
    prompt: "Formuliere eine SQL-Abfrage, die Name und Profil aller Schuelerinnen und Schueler aus Jahrgang 11 ausgibt. Sortiere alphabetisch nach Name.",
    type: "text",
    inputLabel: "SQL-Abfrage",
    validation: {
      minimumLength: 25,
      requiredGroups: [
        [
          "select name,profil",
          "select profil,name",
          "select schueler.name,schueler.profil",
          "select schueler.profil,schueler.name",
          "select s.name,s.profil",
          "select s.profil,s.name"
        ],
        ["from schueler", "from schueler s"],
        ["where jahrgang=11", "where s.jahrgang=11", "where schueler.jahrgang=11"],
        ["order by name", "order by s.name", "order by schueler.name"]
      ]
    },
    feedbackCorrect: "Die Abfrage waehlt genau die geforderten Spalten aus, filtert auf Jahrgang 11 und sortiert explizit nach Name. Typisch waere hier ein ungenaues SELECT * oder eine fehlende Sortierung.",
    feedbackIncorrect: "Pruefe, ob wirklich nur Name und Profil ausgegeben werden, ob die WHERE-Bedingung den Jahrgang filtert und ob ORDER BY enthalten ist. Ein haeufiger Fehler ist eine richtige Filterung ohne gezielte Spaltenauswahl.",
    hints: [
      "Lege zuerst fest, welche Spalten im Ergebnis erscheinen sollen.",
      "Die Sortierung steht am Ende der Abfrage und benoetigt hier nur die Spalte name."
    ],
    solution: "SELECT name, profil\nFROM Schueler\nWHERE jahrgang = 11\nORDER BY name;",
    solutionFormat: "code",
    explanation: "Merke: SELECT legt die Spalten fest, WHERE filtert Zeilen und ORDER BY bestimmt die Reihenfolge des Ergebnisses."
  },
  {
    id: "sql-02",
    title: "Sortierung mit zwei Kriterien",
    theme: "SELECT, WHERE, ORDER BY",
    difficulty: "Basis",
    sections: [
      {
        title: "Tabelle",
        type: "code",
        content: "Kurs(kurs_id, titel, semester, lehrkraft)"
      }
    ],
    prompt: "Welche Abfrage listet alle Kurse aus Semester 2 zuerst nach Lehrkraft aufsteigend und innerhalb derselben Lehrkraft nach Titel absteigend?",
    type: "single",
    options: [
      {
        value: "a",
        kind: "code",
        label: "SELECT titel, lehrkraft FROM Kurs WHERE semester = 2 ORDER BY titel DESC, lehrkraft ASC;"
      },
      {
        value: "b",
        kind: "code",
        label: "SELECT titel, lehrkraft FROM Kurs WHERE semester = 2 ORDER BY lehrkraft ASC, titel DESC;"
      },
      {
        value: "c",
        kind: "code",
        label: "SELECT titel, lehrkraft FROM Kurs ORDER BY lehrkraft ASC, titel DESC WHERE semester = 2;"
      },
      {
        value: "d",
        kind: "code",
        label: "SELECT titel, lehrkraft FROM Kurs WHERE semester = 2 ORDER BY lehrkraft DESC, titel DESC;"
      }
    ],
    validation: {
      correctOption: "b"
    },
    feedbackCorrect: "Die Reihenfolge der Sortierkriterien ist passend: zuerst Lehrkraft, danach Titel. Ein verbreiteter Fehler ist, die Sortierspalten zu vertauschen oder WHERE nach ORDER BY zu setzen.",
    feedbackIncorrect: "Achte auf zwei Dinge: WHERE steht vor ORDER BY und das erste Sortierkriterium steuert die grobe Gruppierung. Wenn Titel zuerst sortiert wird, ist die Lehrkraft nicht mehr das fuehrende Kriterium.",
    hints: [
      "Die erste Spalte in ORDER BY entscheidet ueber die Hauptsortierung.",
      "Die SQL-Klauseln muessen in syntaktisch korrekter Reihenfolge stehen."
    ],
    solution: "Passend ist: SELECT titel, lehrkraft FROM Kurs WHERE semester = 2 ORDER BY lehrkraft ASC, titel DESC;",
    solutionFormat: "text",
    explanation: "Merke: Mehrere Sortierkriterien werden in ORDER BY von links nach rechts ausgewertet."
  },
  {
    id: "sql-03",
    title: "Offene Ausleihen mit JOINs",
    theme: "JOINs",
    difficulty: "Vertiefung",
    sections: [
      {
        title: "Tabellen",
        type: "code",
        content: "Buch(buch_id, titel, kategorie)\nMitglied(mitglied_id, name, stufe)\nAusleihe(ausleihe_id, buch_id, mitglied_id, rueckgabe_datum)"
      }
    ],
    prompt: "Formuliere eine Abfrage, die zu allen noch nicht zurueckgegebenen Buechern den Buchtitel und den Namen des Mitglieds ausgibt.",
    type: "text",
    inputLabel: "SQL-Abfrage",
    validation: {
      minimumLength: 35,
      requiredGroups: [
        [
          "select titel,name",
          "select name,titel",
          "select b.titel,m.name",
          "select m.name,b.titel",
          "select buch.titel,mitglied.name",
          "select mitglied.name,buch.titel"
        ],
        ["join buch"],
        ["join mitglied"],
        ["rueckgabe_datum is null", "a.rueckgabe_datum is null", "ausleihe.rueckgabe_datum is null"],
        ["from ausleihe", "from buch", "from mitglied"]
      ]
    },
    feedbackCorrect: "Die Loesung verbindet die drei Tabellen ueber JOINs und filtert offene Ausleihen ueber IS NULL. Typisch falsch waere ein Vergleich mit = NULL oder ein fehlender Join auf eine der Tabellen.",
    feedbackIncorrect: "Pruefe, ob Buch, Mitglied und Ausleihe wirklich verknuepft sind und ob offene Rueckgaben mit IS NULL gefiltert werden. Ein haeufiger Denkfehler ist = NULL statt IS NULL.",
    hints: [
      "Die Information ueber offene Rueckgaben steht in der Tabelle Ausleihe.",
      "Du brauchst zwei JOINs: einen zum Buch und einen zum Mitglied."
    ],
    solution: "SELECT b.titel, m.name\nFROM Ausleihe a\nJOIN Buch b ON a.buch_id = b.buch_id\nJOIN Mitglied m ON a.mitglied_id = m.mitglied_id\nWHERE a.rueckgabe_datum IS NULL;",
    solutionFormat: "code",
    explanation: "Merke: JOINs holen zusammengehoerige Informationen aus mehreren Tabellen. NULL wird in SQL mit IS NULL oder IS NOT NULL geprueft."
  },
  {
    id: "sql-04",
    title: "INNER JOIN und LEFT JOIN unterscheiden",
    theme: "JOINs",
    difficulty: "Vertiefung",
    sections: [],
    prompt: "Welche Aussagen zu JOINs sind fachlich korrekt? Waehle alle passenden Aussagen.",
    type: "multi",
    options: [
      {
        value: "a",
        label: "Ein INNER JOIN liefert nur Datensaetze, fuer die in beiden Tabellen passende Zeilen existieren."
      },
      {
        value: "b",
        label: "Ein LEFT JOIN blendet Zeilen der linken Tabelle aus, wenn rechts nichts passt."
      },
      {
        value: "c",
        label: "Bei einem LEFT JOIN koennen in Spalten der rechten Tabelle NULL-Werte im Ergebnis auftauchen."
      },
      {
        value: "d",
        label: "Ein JOIN ohne ON-Bedingung ist fachlich gleichbedeutend mit GROUP BY."
      }
    ],
    validation: {
      correctOptions: ["a", "c"]
    },
    feedbackCorrect: "Die fachlich richtigen Kernaussagen sind getroffen: INNER JOIN braucht Treffer auf beiden Seiten, LEFT JOIN behaelt die linke Tabelle vollstaendig. Typisch falsch ist die Annahme, LEFT JOIN verhalte sich wie INNER JOIN.",
    feedbackIncorrect: "Pruefe den Unterschied zwischen Treffern in beiden Tabellen und dem Verhalten ohne passenden Datensatz rechts. LEFT JOIN bedeutet nicht, dass linke Zeilen verschwinden.",
    hints: [
      "Frage dich, welche Tabelle bei LEFT JOIN vollstaendig erhalten bleibt.",
      "NULL-Werte im Ergebnis sind oft ein Hinweis auf fehlende Treffer in einer der beteiligten Tabellen."
    ],
    solution: "Korrekt sind die Aussagen zum INNER JOIN mit Treffern in beiden Tabellen und zum LEFT JOIN mit moeglichen NULL-Werten in den Spalten der rechten Tabelle.",
    solutionFormat: "text",
    explanation: "Merke: Der Join-Typ bestimmt, welche Datensaetze trotz fehlender Treffer erhalten bleiben."
  },
  {
    id: "sql-05",
    title: "AGs mit vielen Teilnahmen",
    theme: "GROUP BY und HAVING",
    difficulty: "Vertiefung",
    sections: [
      {
        title: "Tabellen",
        type: "code",
        content: "AG(ag_id, name, raum)\nTeilnahme(ag_id, schueler_id)"
      }
    ],
    prompt: "Bestimme alle AGs mit mehr als 5 Teilnahmen. Gib AG-Name und Anzahl der Teilnahmen aus.",
    type: "text",
    inputLabel: "SQL-Abfrage",
    validation: {
      minimumLength: 35,
      requiredGroups: [
        [
          "select a.name,count(*)",
          "select ag.name,count(*)",
          "select name,count(*)",
          "select a.name,count(t.schueler_id)",
          "select ag.name,count(t.schueler_id)",
          "select name,count(schueler_id)"
        ],
        ["from ag", "from ag a"],
        ["join teilnahme"],
        [
          "group by a.name",
          "group by ag.name",
          "group by name",
          "group by a.ag_id,a.name",
          "group by ag.ag_id,ag.name",
          "group by ag_id,name"
        ],
        [
          "having count(*)>5",
          "having count(t.schueler_id)>5",
          "having count(schueler_id)>5"
        ]
      ]
    },
    feedbackCorrect: "Die Loesung bildet Gruppen pro AG und filtert diese Gruppen erst danach mit HAVING. Ein typischer Fehler ist, COUNT bereits in WHERE verwenden zu wollen.",
    feedbackIncorrect: "Pruefe, ob die AGs wirklich gruppiert werden und ob die Bedingung fuer die Anzahl in HAVING steht. Aggregatfunktionen gehoeren nicht in eine normale WHERE-Bedingung fuer Gruppenfilter.",
    hints: [
      "Zuerst wird pro AG gezaehlt, danach werden Gruppen herausgefiltert.",
      "Wenn die Bedingung von COUNT abhaengt, brauchst du HAVING statt WHERE."
    ],
    solution: "SELECT a.name, COUNT(*) AS anzahl\nFROM AG a\nJOIN Teilnahme t ON a.ag_id = t.ag_id\nGROUP BY a.ag_id, a.name\nHAVING COUNT(*) > 5;",
    solutionFormat: "code",
    explanation: "Merke: WHERE filtert einzelne Zeilen vor dem Gruppieren. HAVING filtert Gruppen nach dem Gruppieren."
  },
  {
    id: "sql-06",
    title: "WHERE oder HAVING?",
    theme: "GROUP BY und HAVING",
    difficulty: "Basis",
    sections: [
      {
        title: "Tabelle",
        type: "code",
        content: "Leistung(kurs_id, schueler_id, note)"
      }
    ],
    prompt: "Es sollen pro Kurs Durchschnittsnoten berechnet und nur Kurse mit einem Durchschnitt unter 3.0 angezeigt werden. Welche Loesung ist passend?",
    type: "single",
    options: [
      {
        value: "a",
        kind: "code",
        label: "SELECT kurs_id, AVG(note) FROM Leistung WHERE AVG(note) < 3.0 GROUP BY kurs_id;"
      },
      {
        value: "b",
        kind: "code",
        label: "SELECT kurs_id, AVG(note) FROM Leistung GROUP BY kurs_id HAVING AVG(note) < 3.0;"
      },
      {
        value: "c",
        kind: "code",
        label: "SELECT kurs_id, AVG(note) FROM Leistung HAVING kurs_id GROUP BY AVG(note) < 3.0;"
      },
      {
        value: "d",
        kind: "code",
        label: "SELECT AVG(note), kurs_id FROM Leistung ORDER BY AVG(note) < 3.0 GROUP BY kurs_id;"
      }
    ],
    validation: {
      correctOption: "b"
    },
    feedbackCorrect: "Die Aggregation erfolgt pro Kurs und die Bedingung auf den Durchschnitt steht korrekt in HAVING. Ein klassischer Fehler ist AVG(note) in WHERE.",
    feedbackIncorrect: "Wenn eine Bedingung vom Ergebnis einer Aggregatfunktion abhaengt, muss sie in HAVING stehen. WHERE arbeitet noch vor der Gruppierung und kennt den Durchschnitt einer Gruppe noch nicht.",
    hints: [
      "Frage dich, zu welchem Zeitpunkt AVG(note) ueberhaupt bekannt ist.",
      "Die passende Klausel greift erst nach GROUP BY."
    ],
    solution: "Passend ist: SELECT kurs_id, AVG(note) FROM Leistung GROUP BY kurs_id HAVING AVG(note) < 3.0;",
    solutionFormat: "text",
    explanation: "Merke: Bedingungen auf einzelne Zeilen kommen in WHERE, Bedingungen auf Gruppenwerte in HAVING."
  },
  {
    id: "sql-07",
    title: "Vergleich mit dem Gesamtdurchschnitt",
    theme: "Unterabfragen",
    difficulty: "Transfer",
    sections: [
      {
        title: "Tabelle",
        type: "code",
        content: "Testleistung(schueler_id, name, punkte)"
      }
    ],
    prompt: "Formuliere eine Abfrage, die alle Namen ausgibt, deren Punktezahl ueber dem Durchschnitt aller Testleistungen liegt.",
    type: "text",
    inputLabel: "SQL-Abfrage",
    validation: {
      minimumLength: 35,
      requiredGroups: [
        ["select name", "select t.name"],
        ["from testleistung", "from testleistung t"],
        ["where punkte>(select avg(punkte)", "where t.punkte>(select avg(punkte)", "where punkte > (select avg(punkte)", "where t.punkte > (select avg(punkte)"],
        ["from testleistung)", "from testleistung t2)", "from testleistung)"]
      ]
    },
    feedbackCorrect: "Die Loesung vergleicht jede Zeile mit einer Unterabfrage auf den Gesamtdurchschnitt. Ein haeufiger Denkfehler ist, den Durchschnitt ohne Unterabfrage in dieselbe WHERE-Klausel zu schreiben.",
    feedbackIncorrect: "Pruefe, ob der Vergleich wirklich gegen den Durchschnitt aller Zeilen erfolgt. Dafuer brauchst du eine Unterabfrage mit AVG(punkte) innerhalb der WHERE-Bedingung.",
    hints: [
      "Der Vergleichswert ist kein fester Zahlenwert, sondern wird erst berechnet.",
      "Die Unterabfrage liefert genau einen Wert: den Durchschnitt aller Punkte."
    ],
    solution: "SELECT name\nFROM Testleistung\nWHERE punkte > (\n  SELECT AVG(punkte)\n  FROM Testleistung\n);",
    solutionFormat: "code",
    explanation: "Merke: Eine Unterabfrage kann einen Vergleichswert liefern, der in der aeusseren Abfrage verwendet wird."
  },
  {
    id: "sql-08",
    title: "Rollen von Schluesseln unterscheiden",
    theme: "Tabellenentwurf und Constraints",
    difficulty: "Basis",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "Es gibt die Tabellen Kurs(kurs_id, titel), Schueler(schueler_id, name) und Belegung(kurs_id, schueler_id, anmeldedatum)."
      }
    ],
    prompt: "Ordne jedem Feld die passende Rolle im relationalen Schema zu.",
    type: "match",
    rows: [
      {
        id: "kurs-pk",
        label: "kurs_id in der Tabelle Kurs"
      },
      {
        id: "belegung-kurs",
        label: "kurs_id in der Tabelle Belegung"
      },
      {
        id: "belegung-schueler",
        label: "schueler_id in der Tabelle Belegung"
      },
      {
        id: "belegung-datum",
        label: "anmeldedatum in der Tabelle Belegung"
      }
    ],
    matchOptions: [
      {
        value: "pk",
        label: "Primaerschluessel"
      },
      {
        value: "fk",
        label: "Fremdschluessel"
      },
      {
        value: "attr",
        label: "normales Attribut"
      }
    ],
    validation: {
      correctMap: {
        "kurs-pk": "pk",
        "belegung-kurs": "fk",
        "belegung-schueler": "fk",
        "belegung-datum": "attr"
      }
    },
    feedbackCorrect: "Die Schluesselrollen sind sauber getrennt: Die Entitaetstabelle besitzt einen Primaerschluessel, die Beziehungstabelle uebernimmt diesen als Fremdschluessel. Typisch falsch ist, Fremdschluessel in der Beziehungstabelle als normale Attribute zu behandeln.",
    feedbackIncorrect: "Pruefe, welche Tabelle selbststaendig einen Datensatz identifiziert und welche Tabelle auf andere Tabellen verweist. In einer Beziehungstabelle verweisen kurs_id und schueler_id auf ihre Ursprungstabellen.",
    hints: [
      "Ein Primaerschluessel identifiziert einen Datensatz in seiner eigenen Tabelle eindeutig.",
      "In der Tabelle Belegung zeigen zwei Spalten auf andere Tabellen."
    ],
    solution: "kurs_id in Kurs = Primaerschluessel\nkurs_id in Belegung = Fremdschluessel\nschueler_id in Belegung = Fremdschluessel\nanmeldedatum in Belegung = normales Attribut",
    solutionFormat: "text",
    explanation: "Merke: Ein Fremdschluessel uebernimmt den Schluessel einer anderen Tabelle, um Beziehungen eindeutig abzubilden."
  },
  {
    id: "sql-09",
    title: "Welche Constraints fehlen?",
    theme: "Tabellenentwurf und Constraints",
    difficulty: "Transfer",
    sections: [
      {
        title: "Schemaausschnitt",
        type: "code",
        content: "CREATE TABLE Raumreservierung (\n  reservierung_id INT,\n  raum VARCHAR(20),\n  datum DATE,\n  startzeit TIME,\n  endzeit TIME,\n  kurs_id INT\n);"
      }
    ],
    prompt: "Welche Ergaenzungen sind fuer ein sauberes Design fachlich sinnvoll? Waehle alle passenden Aussagen.",
    type: "multi",
    options: [
      {
        value: "a",
        label: "reservierung_id sollte als Primaerschluessel festgelegt werden."
      },
      {
        value: "b",
        label: "kurs_id kann ohne Bezug zu einer Kurstabelle bleiben; ein Fremdschluessel ist hier unnoetig."
      },
      {
        value: "c",
        label: "Es ist sinnvoll, mit einer Bedingung sicherzustellen, dass endzeit nach startzeit liegt."
      },
      {
        value: "d",
        label: "datum sollte entfernt werden, weil TIME bereits den Kalendertag enthaelt."
      },
      {
        value: "e",
        label: "kurs_id sollte als Fremdschluessel auf Kurs(kurs_id) abgesichert werden."
      }
    ],
    validation: {
      correctOptions: ["a", "c", "e"]
    },
    feedbackCorrect: "Die sinnvollen Ergaenzungen sichern Eindeutigkeit, referenzielle Integritaet und eine fachliche Zeitbedingung ab. Typisch zu kurz gedacht waere ein Schema ohne Primaer- und Fremdschluessel.",
    feedbackIncorrect: "Pruefe, welche Spalten Datensaetze eindeutig identifizieren, welche auf andere Tabellen verweisen und welche fachlichen Regeln direkt als Constraint formulierbar sind.",
    hints: [
      "Drei Ebenen sind relevant: Eindeutigkeit, Verknuepfung mit anderen Tabellen und fachliche Gueltigkeit der Zeiten.",
      "Ein Fremdschluessel beschreibt keinen zusaetzlichen Komfort, sondern eine wichtige Integritaetsregel."
    ],
    solution: "Fachlich sinnvoll sind ein Primaerschluessel fuer reservierung_id, ein Fremdschluessel fuer kurs_id und eine Bedingung, die endzeit nach startzeit absichert.",
    solutionFormat: "text",
    explanation: "Merke: Gute Tabellendesigns sichern Schluessel, Beziehungen und fachliche Regeln moeglichst nahe am Datenmodell ab."
  },
  {
    id: "sql-10",
    title: "SQL-Klauseln im Ablauf einsetzen",
    theme: "Fehlkonzepte",
    difficulty: "Basis",
    sections: [],
    prompt: "Setze die passenden SQL-Begriffe in die Luecken ein.",
    type: "match",
    layout: "cloze",
    fixedOptionOrder: true,
    rows: [
      {
        id: "blank-1",
        before: "Eine typische SQL-Abfrage beginnt mit",
        after: "und legt damit die ausgegebenen Spalten fest."
      },
      {
        id: "blank-2",
        before: "Danach folgt",
        after: ", um die verwendete Tabelle oder Datenquelle zu nennen."
      },
      {
        id: "blank-3",
        before: "Wenn einzelne Zeilen gefiltert werden sollen, steht als naechster Schritt",
        after: "."
      },
      {
        id: "blank-4",
        before: "Fuer die Bildung von Gruppen wird anschliessend",
        after: "eingesetzt."
      },
      {
        id: "blank-5",
        before: "Bedingungen fuer bereits gebildete Gruppen stehen in",
        after: "."
      },
      {
        id: "blank-6",
        before: "Am Ende sorgt",
        after: "fuer die Sortierung der Ergebnisliste."
      }
    ],
    matchOptions: [
      {
        value: "join",
        label: "JOIN"
      },
      {
        value: "having",
        label: "HAVING"
      },
      {
        value: "select",
        label: "SELECT"
      },
      {
        value: "limit",
        label: "LIMIT"
      },
      {
        value: "order-by",
        label: "ORDER BY"
      },
      {
        value: "group-by",
        label: "GROUP BY"
      },
      {
        value: "from",
        label: "FROM"
      },
      {
        value: "distinct",
        label: "DISTINCT"
      },
      {
        value: "where",
        label: "WHERE"
      }
    ],
    validation: {
      correctMap: {
        "blank-1": "select",
        "blank-2": "from",
        "blank-3": "where",
        "blank-4": "group-by",
        "blank-5": "having",
        "blank-6": "order-by"
      }
    },
    feedbackCorrect: "Die Grundstruktur stimmt. Viele SQL-Fehler entstehen nicht wegen der Idee der Abfrage, sondern wegen vertauschter Klauseln.",
    feedbackIncorrect: "Pruefe besonders die Reihenfolge von WHERE, GROUP BY, HAVING und ORDER BY. Genau dort entstehen haeufige Vertauschungen.",
    hints: [
      "Denke zuerst an Spaltenauswahl und Datenquelle.",
      "Gruppierung kommt vor dem Filtern von Gruppen und beides vor der Sortierung."
    ],
    solution: "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY",
    solutionFormat: "text",
    explanation: "Merke: Wer die Grundreihenfolge sicher beherrscht, vermeidet viele typische SQL-Fehler schon vor dem ersten Testlauf."
  }
];