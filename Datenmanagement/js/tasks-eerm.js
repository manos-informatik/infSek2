window.DataManagementTasksEERM = [
  {
    id: "eerm-01",
    title: "Entitaet oder Attribut?",
    theme: "Entitaetstypen und Attribute",
    difficulty: "Basis",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "In einer Schulbibliothek sollen Buecher verwaltet werden. Zu jedem Buch werden Titel, Erscheinungsjahr und Signatur gespeichert."
      }
    ],
    prompt: "Welche Modellierung ist fachlich passend?",
    type: "single",
    options: [
      {
        value: "a",
        label: "Buch ist ein Entitaetstyp mit den Attributen Titel, Erscheinungsjahr und Signatur; die Signatur ist das Schluesselattribut."
      },
      {
        value: "b",
        label: "Titel ist der Entitaetstyp; Buch und Signatur werden dabei nur als zugehoerige Attribute modelliert."
      },
      {
        value: "c",
        label: "Signatur bildet den Beziehungstyp zwischen Titel und Erscheinungsjahr und ersetzt damit den Buchtyp."
      },
      {
        value: "d",
        label: "Buch wird nur als Attribut gefasst, weil mehrere Eigenschaften angeblich gegen einen Entitaetstyp sprechen."
      }
    ],
    validation: {
      correctOption: "a"
    },
    feedbackCorrect: "Die Modellierung trennt Objekt und Eigenschaften sauber. Typisch falsch ist, eine fachliche Sache wie Buch als Attribut statt als Entitaetstyp zu behandeln.",
    feedbackIncorrect: "Pruefe, was im Modell ein eigenstaendig verwaltetes Objekt ist und was nur eine Eigenschaft davon beschreibt. Ein Buch ist kein einzelner Wertebaustein.",
    hints: [
      "Ein Entitaetstyp beschreibt ein Objekt, zu dem mehrere Datensaetze gespeichert werden koennen.",
      "Ein Schluesselattribut identifiziert die einzelnen Auspraegungen dieses Objekts eindeutig."
    ],
    solution: "Fachlich passend ist: Buch als Entitaetstyp mit den Attributen Titel, Erscheinungsjahr und Signatur; die Signatur eignet sich als Schluesselattribut.",
    solutionFormat: "text",
    explanation: "Merke: Entitaetstypen modellieren eigenstaendige Objekte, Attribute beschreiben deren Eigenschaften."
  },
  {
    id: "eerm-02",
    title: "Begriffe im Modell zuordnen",
    theme: "Entitaetstypen und Attribute",
    difficulty: "Basis",
    sections: [],
    prompt: "Ordne die Modellbestandteile der passenden Kategorie zu.",
    type: "match",
    rows: [
      {
        id: "kurs",
        label: "Kurs"
      },
      {
        id: "raum",
        label: "Raumnummer"
      },
      {
        id: "sid",
        label: "Schueler-ID"
      },
      {
        id: "telefon",
        label: "Telefonnummern einer Lehrkraft"
      }
    ],
    matchOptions: [
      {
        value: "entity",
        label: "Entitaetstyp"
      },
      {
        value: "attribute",
        label: "Attribut"
      },
      {
        value: "key",
        label: "Schluesselattribut"
      },
      {
        value: "multi",
        label: "mehrwertiges Attribut"
      }
    ],
    validation: {
      correctMap: {
        kurs: "entity",
        raum: "attribute",
        sid: "key",
        telefon: "multi"
      }
    },
    feedbackCorrect: "Die Zuordnung ist fachlich sauber: Kurs ist ein Objektbereich, die Raumnummer eine Eigenschaft, die Schueler-ID ein identifizierendes Attribut und mehrere Telefonnummern sind mehrwertig. Typisch falsch ist, Schluesselattribute nicht von normalen Attributen zu trennen.",
    feedbackIncorrect: "Pruefe, welche Begriffe eigenstaendige Objekte bezeichnen, welche nur Eigenschaften sind und wo Mehrfachwerte oder eindeutige Identifikation eine Rolle spielen.",
    hints: [
      "Ein Schluesselattribut macht Datensaetze unterscheidbar.",
      "Mehrwertig bedeutet, dass zu einer Entitaet mehrere Werte desselben Typs gehoeren koennen."
    ],
    solution: "Kurs = Entitaetstyp\nRaumnummer = Attribut\nSchueler-ID = Schluesselattribut\nTelefonnummern einer Lehrkraft = mehrwertiges Attribut",
    solutionFormat: "text",
    explanation: "Merke: Nicht jedes Attribut ist gleich wichtig; Schluesselattribute und mehrwertige Attribute haben eine besondere Modellierungsfunktion."
  },
  {
    id: "eerm-03",
    title: "Beziehungstyp zwischen Lehrkraft und Kurs",
    theme: "Beziehungstypen",
    difficulty: "Basis",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "Jeder Kurs wird von genau einer Lehrkraft unterrichtet. Eine Lehrkraft kann mehrere Kurse unterrichten."
      }
    ],
    prompt: "Welche Kardinalitaet beschreibt diese Beziehung am besten?",
    type: "single",
    options: [
      {
        value: "a",
        label: "1:1 zwischen Lehrkraft und Kurs"
      },
      {
        value: "b",
        label: "1:n von Lehrkraft zu Kurs"
      },
      {
        value: "c",
        label: "n:m zwischen Lehrkraft und Kurs"
      },
      {
        value: "d",
        label: "rekursive Beziehung eines Kurses auf sich selbst"
      }
    ],
    validation: {
      correctOption: "b"
    },
    feedbackCorrect: "Die Richtung ist passend: Eine Lehrkraft kann viele Kurse betreuen, ein Kurs gehoert aber genau zu einer Lehrkraft. Typisch falsch ist hier n:m, obwohl der Kurs nur eine Lehrkraft hat.",
    feedbackIncorrect: "Pruefe, ob beide Seiten wirklich mehrere Partner haben koennen. Sobald eine Seite auf genau einen Partner begrenzt ist, ist n:m meist zu breit modelliert.",
    hints: [
      "Beginne auf der Seite Lehrkraft: Wie viele Kurse sind moeglich?",
      "Betrachte dann einen einzelnen Kurs: Wie viele Lehrkraefte sind erlaubt?"
    ],
    solution: "Passend ist eine 1:n-Beziehung von Lehrkraft zu Kurs.",
    solutionFormat: "text",
    explanation: "Merke: Kardinalitaeten beschreiben nicht nur, dass eine Beziehung existiert, sondern auch ihre fachlichen Grenzen."
  },
  {
    id: "eerm-04",
    title: "Optionalitaeten im Wahlkursmodell",
    theme: "Kardinalitaeten und Optionalitaeten",
    difficulty: "Vertiefung",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "Ein Schueler kann an keinem oder mehreren Wahlkursen teilnehmen. Ein Wahlkurs kommt nur zustande, wenn mindestens 8 Schueler teilnehmen."
      }
    ],
    prompt: "Beschreibe die Beziehung zwischen Schueler und Wahlkurs mit Kardinalitaet und Optionalitaet.",
    type: "text",
    inputLabel: "Kurze Beschreibung",
    validation: {
      minimumLength: 15,
      requiredGroups: [
        ["n:m", "m:n"],
        ["0..n", "0,n", "0 bis n", "optional auf der schuelerseite", "schueler optional"],
        ["8..n", "8,n", "mindestens 8", "min 8", "wahlkurs 8 bis n"]
      ]
    },
    feedbackCorrect: "Die Antwort erfasst sowohl die viele-zu-viele-Beziehung als auch die unterschiedlichen Mindestteilnahmen. Typisch uebersehen wird, dass auf beiden Seiten nicht dieselbe Mindestzahl gilt.",
    feedbackIncorrect: "Pruefe zwei Ebenen getrennt: Wie viele Wahlkurse kann ein Schueler haben und wie viele Teilnehmende braucht ein Wahlkurs mindestens? Nur n:m zu nennen reicht hier noch nicht aus.",
    hints: [
      "Ein Schueler kann null bis viele Kurse belegen.",
      "Beim Wahlkurs ist die Mindestteilnahme ungleich null; hier steckt die fachliche Besonderheit."
    ],
    solution: "Die Beziehung ist n:m. Auf der Schuelerseite gilt 0..n, auf der Wahlkursseite 8..n.",
    solutionFormat: "text",
    explanation: "Merke: Optionalitaet beschreibt die minimale Beteiligung, Kardinalitaet die maximale Beteiligung."
  },
  {
    id: "eerm-05",
    title: "Schwache Entitaet erkennen",
    theme: "Schwache Entitaeten",
    difficulty: "Vertiefung",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "In einem Gebaeudemodell gibt es Raeume und Sitzplaetze. Die Sitzplatznummer ist nur innerhalb eines Raumes eindeutig, nicht im ganzen Gebaeude."
      }
    ],
    prompt: "Welche Aussage beschreibt die Modellierung am besten?",
    type: "single",
    options: [
      {
        value: "a",
        label: "Sitzplatz ist eine schwache Entitaet, weil seine Identifikation den Bezug zu Raum braucht."
      },
      {
        value: "b",
        label: "Raum ist eine schwache Entitaet, weil zu einem Raum mehrere Sitzplaetze gehoeren."
      },
      {
        value: "c",
        label: "Sitzplatz ist nur ein normales Attribut von Raum und braucht deshalb keine eigene Entitaet."
      },
      {
        value: "d",
        label: "Die Beziehung ist fachlich bedeutungslos, weil Sitzplatznummern nur technische Angaben waeren."
      }
    ],
    validation: {
      correctOption: "a"
    },
    feedbackCorrect: "Die Identifikation eines Sitzplatzes funktioniert nur zusammen mit dem zugehoerigen Raum. Typisch falsch ist hier die Verwechslung von schwaecher Identifikation mit blosser Teil-Ganzes-Struktur.",
    feedbackIncorrect: "Entscheidend ist nicht, wer mehrere andere Objekte hat, sondern ob eine Entitaet ohne den Besitzer eindeutig identifizierbar ist."
    ,
    hints: [
      "Frage dich, ob die Sitzplatznummer ohne Raumbezug eindeutig waere.",
      "Schwache Entitaeten brauchen zur Identifikation einen besitzenden Entitaetstyp."
    ],
    solution: "Fachlich passend ist die Modellierung von Sitzplatz als schwache Entitaet, weil erst Raum und Sitzplatznummer gemeinsam eindeutig sind.",
    solutionFormat: "text",
    explanation: "Merke: Eine schwache Entitaet ist ohne ihren identifizierenden Bezug nicht eindeutig bestimmbar."
  },
  {
    id: "eerm-06",
    title: "Aussagen zur Generalisierung pruefen",
    theme: "Generalisierung und Spezialisierung",
    difficulty: "Vertiefung",
    sections: [],
    prompt: "Welche Aussagen zur Generalisierung und Spezialisierung sind fachlich korrekt? Waehle alle passenden Aussagen.",
    type: "multi",
    options: [
      {
        value: "a",
        label: "Untertypen erben die Attribute des Obertyps."
      },
      {
        value: "b",
        label: "Spezialisierung ist nur sinnvoll, wenn Untertypen fachlich unterscheidbar sind oder zusaetzliche Regeln brauchen."
      },
      {
        value: "c",
        label: "Jeder Untertyp benoetigt zwingend einen neuen Primaerschluessel, der vom Obertyp unabhaengig ist."
      },
      {
        value: "d",
        label: "Disjunkt bedeutet, dass ein Exemplar gleichzeitig in mehreren Untertypen enthalten sein muss."
      }
    ],
    validation: {
      correctOptions: ["a", "b"]
    },
    feedbackCorrect: "Die zentralen Aussagen stimmen: Untertypen erben vom Obertyp und Spezialisierung braucht einen fachlichen Mehrwert. Typisch falsch sind neue Schluessel ohne Not oder eine falsche Deutung von Disjunktheit.",
    feedbackIncorrect: "Pruefe, was Untertypen vom Obertyp uebernehmen und was disjunkt wirklich bedeutet. Disjunkt schliesst Mehrfachzuordnungen aus, erzwingt sie aber nicht.",
    hints: [
      "Die Spezialisierung soll Redundanz reduzieren und Unterschiede sauber modellieren.",
      "Disjunkt und ueberlappend beschreiben, ob dieselbe Entitaet mehreren Untertypen angehoeren darf."
    ],
    solution: "Korrekt sind die Aussagen zur Attributvererbung der Untertypen und zum fachlichen Nutzen einer Spezialisierung.",
    solutionFormat: "text",
    explanation: "Merke: Generalisierung und Spezialisierung dienen nicht der Dekoration, sondern der praezisen Strukturierung fachlicher Unterschiede."
  },
  {
    id: "eerm-07",
    title: "Doppelmodellierung erkennen",
    theme: "Modellierungsfehler",
    difficulty: "Transfer",
    sections: [
      {
        title: "Modellbeschreibung",
        type: "text",
        content: "Im Modell zur Klassenverwaltung wird Klasse als Attribut von Schueler gespeichert. Gleichzeitig existiert eine eigene Entitaet Klasse mit Klassenname, Klassenlehrer und Raum."
      }
    ],
    prompt: "Welche Bewertung trifft das Problem am besten?",
    type: "single",
    options: [
      {
        value: "a",
        label: "Das ist unproblematisch, weil dieselbe Information bewusst an zwei Stellen gespeichert werden sollte."
      },
      {
        value: "b",
        label: "Klasse wird doppelt modelliert. Wenn Klasse als Entitaet gebraucht wird, sollte Schueler per Beziehung damit verknuepft sein."
      },
      {
        value: "c",
        label: "Klasse darf nur als Attribut vorkommen, auch wenn zusaetzliche Angaben wie Raum und Klassenlehrer vorliegen."
      },
      {
        value: "d",
        label: "Der Fehler liegt nur darin, dass Klassenname nicht als eindeutiges Schluesselattribut markiert ist."
      }
    ],
    validation: {
      correctOption: "b"
    },
    feedbackCorrect: "Die Doppelfuehrung desselben fachlichen Konzepts ist erkannt. Typisch problematisch ist, dass widerspruechliche Informationen in Attribut und Entitaet auseinanderlaufen koennen.",
    feedbackIncorrect: "Hier geht es weniger um einzelne Attribute als um die Frage, ob dasselbe fachliche Objekt an zwei Stellen unterschiedlich modelliert wird. Das fuehrt leicht zu Inkonsistenzen.",
    hints: [
      "Frage dich, ob Klasse in diesem Modell nur ein Text oder ein eigenstaendig verwaltetes Objekt ist.",
      "Wenn ein Konzept eigene Attribute und Beziehungen hat, reicht ein einfaches Attribut meist nicht mehr aus."
    ],
    solution: "Fachlich passend ist die Bewertung, dass Klasse doppelt modelliert wird und deshalb besser ueber eine Beziehung angebunden werden sollte.",
    solutionFormat: "text",
    explanation: "Merke: Ein fachliches Konzept sollte im Modell nicht gleichzeitig als freier Text und als eigenstaendige Entitaet auftreten."
  },
  {
    id: "eerm-08",
    title: "Vom eERM zum relationalen Schema",
    theme: "Relationales Schema",
    difficulty: "Transfer",
    sections: [
      {
        title: "Ausgangslage",
        type: "text",
        content: "Gegeben sind die Entitaeten Schueler(schueler_id, name) und Kurs(kurs_id, titel) sowie die n:m-Beziehung Belegung mit dem Attribut note."
      }
    ],
    prompt: "Ordne die Spalten im relationalen Schema der passenden Rolle zu.",
    type: "match",
    rows: [
      {
        id: "schueler-pk",
        label: "schueler_id in Tabelle Schueler"
      },
      {
        id: "belegung-schueler",
        label: "schueler_id in Tabelle Belegung"
      },
      {
        id: "belegung-kurs",
        label: "kurs_id in Tabelle Belegung"
      },
      {
        id: "belegung-note",
        label: "note in Tabelle Belegung"
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
        value: "relattr",
        label: "Beziehungsattribut"
      }
    ],
    validation: {
      correctMap: {
        "schueler-pk": "pk",
        "belegung-schueler": "fk",
        "belegung-kurs": "fk",
        "belegung-note": "relattr"
      }
    },
    feedbackCorrect: "Die Ueberfuehrung ist stimmig: Die Beziehungstabelle uebernimmt die Schluessel der beteiligten Entitaeten und speichert das Beziehungsattribut. Typisch falsch waere, note direkt in Schueler oder Kurs zu schreiben.",
    feedbackIncorrect: "Pruefe, welche Tabelle die n:m-Beziehung repraesentiert. Dort landen sowohl die Fremdschluessel als auch Attribute, die genau zu dieser Beziehung gehoeren.",
    hints: [
      "Bei n:m-Beziehungen entsteht eine zusaetzliche Tabelle.",
      "Attribute der Beziehung gehoeren nicht automatisch zu einer der beiden Entitaetstabellen."
    ],
    solution: "schueler_id in Schueler = Primaerschluessel\nschueler_id in Belegung = Fremdschluessel\nkurs_id in Belegung = Fremdschluessel\nnote in Belegung = Beziehungsattribut",
    solutionFormat: "text",
    explanation: "Merke: Eine n:m-Beziehung wird im relationalen Schema zu einer eigenen Tabelle mit beiden Fremdschluesseln."
  },
  {
    id: "eerm-09",
    title: "Bessere Modellierung begruenden",
    theme: "Modellierungsfehler",
    difficulty: "Transfer",
    sections: [
      {
        title: "Variante A",
        type: "text",
        content: "Lehrkraft besitzt die Attribute name, fachbereich und sprechstunde."
      },
      {
        title: "Variante B",
        type: "text",
        content: "Lehrkraft ist mit einem eigenen Entitaetstyp Sprechstunde verbunden; eine Lehrkraft kann mehrere Sprechstunden haben."
      }
    ],
    prompt: "Welche Variante ist fachlich besser, wenn pro Lehrkraft mehrere Sprechstunden pro Woche moeglich sind? Begruende kurz.",
    type: "text",
    inputLabel: "Kurze Begruendung",
    validation: {
      minimumLength: 18,
      requiredGroups: [
        ["variante b", "modell b", "eigener entitaetstyp", "separate entitaet", "eigene entitaet", "separate tabelle"],
        ["mehrere", "1:n", "wiederholbar", "mehr als eine", "mehrfach"],
        ["attribut reicht nicht", "ein attribut reicht nicht", "nicht nur als attribut", "als einzelnes attribut unpassend", "attribut ist zu eng"]
      ]
    },
    feedbackCorrect: "Die Begruendung trifft den Kern: Wiederholbare Sprechstunden lassen sich als eigener Entitaetstyp mit Beziehung sauberer modellieren als in einem Einzelattribut. Typisch falsch ist die Annahme, mehrere Werte liessen sich ohne Folgen in ein einzelnes Feld pressen.",
    feedbackIncorrect: "Pruefe, warum ein einzelnes Attribut fuer mehrere wiederholbare Termine zu eng wird. Die bessere Modellierung muss sowohl die Mehrfachheit als auch die Struktur der Termine abbilden.",
    hints: [
      "Sobald zu einer Lehrkraft mehrere Termine gehoeren, wird ein Einzelattribut schnell unpraezise.",
      "Eine eigene Entitaet ermoeglicht mehrere Datensaetze und zusaetzliche Attribute pro Termin."
    ],
    solution: "Variante B ist fachlich besser. Mehrere Sprechstunden pro Lehrkraft entsprechen einer 1:n-Struktur. Ein einzelnes Attribut sprechstunde reicht dafuer nicht aus, weil wiederholbare Termine sauber als eigene Entitaet modelliert werden sollten.",
    solutionFormat: "text",
    explanation: "Merke: Wenn Informationen mehrfach auftreten und selbst wieder Eigenschaften tragen koennen, ist eine eigene Entitaet oft die robustere Modellierung."
  },
  {
    id: "eerm-10",
    title: "Ueberfuehrung einer n:m-Beziehung einsetzen",
    theme: "Relationales Schema",
    difficulty: "Transfer",
    sections: [],
    prompt: "Setze die passenden Schritte zur Ueberfuehrung einer n:m-Beziehung mit Beziehungsattributen in die Luecken ein.",
    type: "match",
    layout: "cloze",
    fixedOptionOrder: true,
    rows: [
      {
        id: "blank-1",
        before: "Zuerst werden die",
        after: ", damit die benoetigten Schluessel bereits feststehen."
      },
      {
        id: "blank-2",
        before: "Danach wird eine",
        after: ", welche die n:m-Beziehung aufnimmt."
      },
      {
        id: "blank-3",
        before: "Im naechsten Schritt werden die",
        after: ", damit die beteiligten Entitaeten verbunden sind."
      },
      {
        id: "blank-4",
        before: "Zum Schluss werden die",
        after: ", weil sie genau zu dieser Beziehung gehoeren."
      }
    ],
    matchOptions: [
      {
        value: "relationship-attributes",
        label: "Beziehungsattribute in die Beziehungstabelle aufnehmen"
      },
      {
        value: "merge-entities",
        label: "beide Entitaetstabellen zu einer gemeinsamen Tabelle zusammenfassen"
      },
      {
        value: "entity-tables",
        label: "Entitaetstabellen mit ihren Primaerschluesseln gebildet"
      },
      {
        value: "remove-foreign-keys",
        label: "Fremdschluessel aus der Beziehungstabelle wieder entfernt"
      },
      {
        value: "bridge-table",
        label: "zusaetzliche Beziehungstabelle angelegt"
      },
      {
        value: "split-attributes",
        label: "Beziehungsattribute auf beide Entitaetstabellen verteilt"
      },
      {
        value: "foreign-keys",
        label: "Primaerschluessel der Entitaeten als Fremdschluessel in die Beziehungstabelle uebernommen"
      }
    ],
    validation: {
      correctMap: {
        "blank-1": "entity-tables",
        "blank-2": "bridge-table",
        "blank-3": "foreign-keys",
        "blank-4": "relationship-attributes"
      }
    },
    feedbackCorrect: "Die Reihenfolge ist schluessig: Erst stehen die Entitaetstabellen fest, dann wird die Beziehungstabelle aufgebaut und mit Schluesseln sowie Beziehungsattributen gefuellt. Typisch falsch ist, Beziehungsattribute einer Entitaetstabelle zuzuschlagen.",
    feedbackIncorrect: "Pruefe, wann die Beziehungstabelle ueberhaupt existiert und welche Inhalte erst danach hineingehoeren. Beziehungsattribute entstehen nicht vor der Beziehungstabelle.",
    hints: [
      "Ohne die Entitaetstabellen gibt es noch keine Schluessel, die uebernommen werden koennten.",
      "Erst wenn die Beziehungstabelle steht, koennen ihre Fremdschluessel und weiteren Attribute eingetragen werden."
    ],
    solution: "Entitaetstabellen mit ihren Primaerschluesseln bilden, zusaetzliche Beziehungstabelle anlegen, Primaerschluessel als Fremdschluessel uebernehmen, Beziehungsattribute in die Beziehungstabelle aufnehmen",
    solutionFormat: "text",
    explanation: "Merke: Die relationale Ueberfuehrung folgt der Modellstruktur: Entitaeten zuerst, Beziehungen danach."
  }
];