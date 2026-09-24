(() => {
  "use strict";

  const STORAGE_KEY = "infsek2-oop-beispielvererbung-v1";

  /* =====================================================================
     Quelltext
     Jeder <script type="text/x-processing"> in der index.html ist ein Reiter,
     der erste ist der Hauptreiter und gibt dem Sketch seinen Namen. Angezeigt
     und ausgeführt wird derselbe Text - Anzeige und Konsole können also nicht
     auseinanderlaufen.
     ===================================================================== */

  const dateien = Array.from(document.querySelectorAll('script[type="text/x-processing"]'))
    .map((el) => ({
      name: el.dataset.tab,
      text: el.textContent.replace(/\r\n?/g, "\n").replace(/^\n/, "").replace(/\s+$/, "")
    }));

  const sketchName = dateien[0].name;

  const SCHLUESSELWOERTER = new Set([
    "class", "extends", "implements", "interface", "new", "this", "super", "void", "return",
    "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue",
    "true", "false", "null", "instanceof", "import", "try", "catch", "finally", "throw", "enum",
    "public", "private", "protected", "static", "final", "abstract"
  ]);
  const TYPEN = new Set(["int", "float", "double", "long", "short", "byte", "char", "boolean", "color", "String"]);
  const INT_TYPEN = new Set(["int", "long", "short", "byte", "color"]);
  const FLOAT_TYPEN = new Set(["float", "double"]);
  const MODIFIKATOREN = new Set(["public", "private", "protected", "static", "final", "abstract"]);
  const NICHT_UNTERSTUETZT = new Set(["interface", "implements", "switch", "do", "import", "try", "throw", "enum"]);
  const STRUKTUR = new Set(["setup", "draw", "settings"]);
  const EINGEBAUTE_NAMEN = new Set([
    "println", "print", "printArray", "noLoop", "loop", "frameRate", "exit", "size", "background",
    "color", "abs", "min", "max", "round", "floor", "ceil", "sqrt", "pow", "random", "int", "float", "str"
  ]);
  /* Gibt es in Processing, kann diese Simulation aber nicht zeichnen */
  const ZEICHENFUNKTIONEN = new Set([
    "rect", "square", "ellipse", "circle", "line", "point", "triangle", "quad", "arc", "text",
    "textSize", "textAlign", "fill", "noFill", "stroke", "noStroke", "strokeWeight", "image",
    "loadImage", "translate", "rotate", "scale", "push", "pop", "pushMatrix", "popMatrix",
    "beginShape", "vertex", "endShape", "rectMode", "ellipseMode", "colorMode"
  ]);
  const BEKANNTE_KLASSEN = new Set(["ArrayList", "HashMap", "PVector", "PImage", "PFont", "IntList", "FloatList", "StringList", "Table"]);
  const OBJEKT_METHODEN = new Set(["toString", "equals"]);
  const STANDARD_HINTERGRUND = "#cccccc"; // background(204) - so öffnet Processing jedes Sketch-Fenster

  class SketchFehler extends Error {
    /* art "syntax": würde in Processing gar nicht erst starten. art "laufzeit": Exception. */
    constructor(meldung, token, art = "syntax") {
      super(meldung);
      this.token = token || null;
      this.art = art;
    }
  }

  const laufzeitFehler = (meldung, token) => new SketchFehler(meldung, token, "laufzeit");

  /* =====================================================================
     Zerlegen in Token (für Syntaxfarben und Parser)
     ===================================================================== */

  const TOKEN_REGELN = [
    ["leer", /[ \t\f]+/y],
    ["zeilenende", /\n/y],
    ["kommentar", /\/\/[^\n]*/y],
    ["kommentar", /\/\*[\s\S]*?(?:\*\/|$)/y],
    ["string", /"(?:[^"\\\n]|\\.)*"?/y],
    ["zeichen", /'(?:[^'\\\n]|\\.)*'?/y],
    ["zahl", /(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[fFdDlL]?/y],
    ["wort", /[\p{L}_$][\p{L}\p{N}_$]*/uy],
    ["symbol", /\+\+|--|[+\-*/%]=|==|!=|<=|>=|&&|\|\||[{}()[\];,.=+\-*/%<>!?:]/y]
  ];

  const zerlege = (text, datei) => {
    const tokens = [];
    let pos = 0;
    let zeile = 1;

    while (pos < text.length) {
      let typ = "fremd";
      let stueck = text[pos];

      for (const [regelTyp, muster] of TOKEN_REGELN) {
        muster.lastIndex = pos;
        const treffer = muster.exec(text);
        if (treffer && treffer[0].length > 0) {
          typ = regelTyp;
          stueck = treffer[0];
          break;
        }
      }

      tokens.push({ typ, text: stueck, zeile, datei });
      zeile += stueck.split("\n").length - 1;
      pos += stueck.length;
    }

    return tokens;
  };

  /* =====================================================================
     Syntaxfarben wie in der Processing-IDE
     ===================================================================== */

  const tokenKlasse = (token, naechstes) => {
    if (token.typ === "kommentar") return "tok-comment";
    if (token.typ === "string" || token.typ === "zeichen") return "tok-string";
    if (token.typ === "zahl") return "tok-number";
    if (token.typ !== "wort") return null;
    if (SCHLUESSELWOERTER.has(token.text)) return "tok-keyword";
    if (TYPEN.has(token.text) && !(naechstes && naechstes.text === "(")) return "tok-type";
    if (naechstes && naechstes.text === "(") {
      if (STRUKTUR.has(token.text)) return "tok-function";
      if (EINGEBAUTE_NAMEN.has(token.text) || ZEICHENFUNKTIONEN.has(token.text)) return "tok-builtin";
    }
    return null;
  };

  /* Das Neue der Stunde, gelb markiert - festgelegt in index.html über data-hervorheben */
  const HERVORHEBEN = new Set((document.getElementById("ide").dataset.hervorheben || "").split(/\s+/).filter(Boolean));

  /* Zeilen als Liste von { text, klasse } - Blockkommentare dürfen Zeilen überspannen */
  const baueZeilen = (tokens) => {
    const zeilen = [[]];
    const sichtbar = tokens.filter((t) => t.typ !== "leer" && t.typ !== "zeilenende");

    tokens.forEach((token) => {
      const index = sichtbar.indexOf(token);
      const farbe = index >= 0 ? tokenKlasse(token, sichtbar[index + 1]) : null;
      const neu = token.typ === "wort" && HERVORHEBEN.has(token.text) ? "is-neu" : null;
      const klasse = [farbe, neu].filter(Boolean).join(" ") || null;

      token.text.split("\n").forEach((teil, i) => {
        if (i > 0) zeilen.push([]);
        if (teil) zeilen[zeilen.length - 1].push({ text: teil, klasse });
      });
    });

    return zeilen;
  };

  dateien.forEach((datei) => {
    datei.tokens = zerlege(datei.text, datei.name);
    datei.zeilen = baueZeilen(datei.tokens);
  });

  /* =====================================================================
     Parser: Token -> Baum
     Abgedeckt ist der Java-Teil, der im Unterricht vorkommt: Klassen mit
     extends, Attribute, Konstruktoren mit super(...), Methoden, if/else,
     Schleifen, Arrays, Casts, instanceof.
     ===================================================================== */

  const nichtUnterstuetzt = (token) =>
    new SketchFehler(`„${token.text}“ kann diese Simulation nicht ausführen.`, token);

  const fuegeHinzu = (tabelle, methode, art) => {
    const liste = tabelle.get(methode.name) || [];
    const signatur = (m) => m.params.map((p) => p.typ).join(",");
    if (liste.some((m) => signatur(m) === signatur(methode))) {
      throw new SketchFehler(`Die ${art} „${methode.name}()“ gibt es doppelt.`, methode.token);
    }
    liste.push(methode);
    tabelle.set(methode.name, liste);
  };

  const parseDatei = (datei, programm) => {
    const liste = datei.tokens.filter((t) => t.typ !== "leer" && t.typ !== "zeilenende" && t.typ !== "kommentar");
    const letztes = liste[liste.length - 1];
    const ENDE = { typ: "ende", text: "", zeile: letztes ? letztes.zeile : 1, datei: datei.name };
    let pos = 0;

    const sieh = (versatz = 0) => liste[pos + versatz] || ENDE;
    const weiter = () => liste[pos++] || ENDE;
    const ist = (text, versatz = 0) => {
      const t = sieh(versatz);
      return (t.typ === "symbol" || t.typ === "wort") && t.text === text;
    };
    const nimm = (text) => {
      if (!ist(text)) return false;
      pos += 1;
      return true;
    };

    const erwarte = (text) => {
      if (ist(text)) return weiter();
      const t = sieh();
      const vorher = liste[pos - 1] || t;
      if (text === ";") throw new SketchFehler("Syntaxfehler – hier fehlt ein Semikolon „;“.", vorher);
      if (t.typ === "ende") throw new SketchFehler(`Syntaxfehler – „${text}“ fehlt.`, vorher);
      throw new SketchFehler(`Syntaxfehler – „${text}“ erwartet, aber „${t.text}“ gefunden.`, t);
    };

    const name = () => {
      const t = sieh();
      if (t.typ !== "wort" || SCHLUESSELWOERTER.has(t.text) || TYPEN.has(t.text)) {
        throw new SketchFehler(`Syntaxfehler – Name erwartet, aber „${t.text || "Dateiende"}“ gefunden.`, t.typ === "ende" ? liste[pos - 1] : t);
      }
      pos += 1;
      return t;
    };

    const typ = () => {
      const t = sieh();
      if (t.typ !== "wort" || (SCHLUESSELWOERTER.has(t.text) && t.text !== "void")) {
        throw new SketchFehler(`Syntaxfehler – Typ erwartet, aber „${t.text || "Dateiende"}“ gefunden.`, t.typ === "ende" ? liste[pos - 1] : t);
      }
      pos += 1;
      if (ist("<")) throw new SketchFehler(`„${t.text}<…>“ kann diese Simulation nicht ausführen.`, t);
      let text = t.text;
      while (ist("[") && ist("]", 1)) {
        pos += 2;
        text += "[]";
      }
      return text;
    };

    const modifikatoren = () => {
      const gefunden = new Set();
      while (sieh().typ === "wort" && MODIFIKATOREN.has(sieh().text)) gefunden.add(weiter().text);
      return gefunden;
    };

    /* Steht hier "Typ name", also eine Deklaration? */
    const istDeklaration = () => {
      let i = 0;
      while (sieh(i).typ === "wort" && MODIFIKATOREN.has(sieh(i).text)) i += 1;
      const t = sieh(i);
      if (t.typ !== "wort" || SCHLUESSELWOERTER.has(t.text)) return false;
      i += 1;
      if (ist("<", i) && /^[A-Z]/.test(t.text)) return true;
      while (ist("[", i) && ist("]", i + 1)) i += 2;
      const n = sieh(i);
      return n.typ === "wort" && !SCHLUESSELWOERTER.has(n.text);
    };

    const argumente = () => {
      erwarte("(");
      const args = [];
      if (!ist(")")) {
        do args.push(ausdruck()); while (nimm(","));
      }
      erwarte(")");
      return args;
    };

    const parameter = () => {
      erwarte("(");
      const params = [];
      if (!ist(")")) {
        do {
          nimm("final");
          const t = typ();
          params.push({ typ: t, name: name().text });
        } while (nimm(","));
      }
      erwarte(")");
      return params;
    };

    const arrayLiteral = () => {
      const t = erwarte("{");
      const elemente = [];
      while (!ist("}")) {
        elemente.push(ist("{") ? arrayLiteral() : ausdruck());
        if (!nimm(",")) break;
      }
      erwarte("}");
      return { art: "arrayLiteral", elemente, token: t };
    };

    const variablenListe = (typText, ersterName) => {
      const variablen = [];
      let n = ersterName;
      for (;;) {
        let init = null;
        if (nimm("=")) init = ist("{") ? arrayLiteral() : ausdruck();
        variablen.push({ typ: typText, name: n.text, init, token: n });
        if (!nimm(",")) break;
        n = name();
      }
      erwarte(";");
      return variablen;
    };

    /* --- Ausdrücke, von niedriger zu hoher Bindung --- */

    const ZUWEISUNGEN = new Set(["=", "+=", "-=", "*=", "/=", "%="]);
    const ZIELE = new Set(["name", "feld", "index"]);

    function ausdruck() {
      const links = bedingung();
      const t = sieh();
      if (t.typ === "symbol" && ZUWEISUNGEN.has(t.text)) {
        pos += 1;
        if (!ZIELE.has(links.art)) throw new SketchFehler("Syntaxfehler – links vom „=“ muss eine Variable stehen.", t);
        return { art: "zuweisung", op: t.text, ziel: links, wert: ausdruck(), token: t };
      }
      return links;
    }

    function bedingung() {
      const bed = binaer(0);
      if (!ist("?")) return bed;
      const t = weiter();
      const a = ausdruck();
      erwarte(":");
      return { art: "bedingt", bed, a, b: bedingung(), token: t };
    }

    const STUFEN = [["||"], ["&&"], ["==", "!="], ["<", ">", "<=", ">="], ["+", "-"], ["*", "/", "%"]];

    function binaer(stufe) {
      if (stufe === STUFEN.length) return unaer();
      let links = binaer(stufe + 1);
      for (;;) {
        const t = sieh();
        if (t.typ === "symbol" && STUFEN[stufe].includes(t.text)) {
          pos += 1;
          links = { art: "binaer", op: t.text, a: links, b: binaer(stufe + 1), token: t };
        } else if (stufe === 3 && ist("instanceof")) {
          pos += 1;
          const k = name();
          links = { art: "instanceof", a: links, klasse: k.text, token: k };
        } else {
          return links;
        }
      }
    }

    const istCast = () => {
      if (!ist("(") || sieh(1).typ !== "wort" || !ist(")", 2)) return false;
      const typName = sieh(1).text;
      if (TYPEN.has(typName) && typName !== "String") return true;
      if (SCHLUESSELWOERTER.has(typName)) return false;
      const danach = sieh(3);
      if (danach.typ === "wort") return danach.text !== "instanceof";
      return ["string", "zahl", "zeichen"].includes(danach.typ) || ist("(", 3) || ist("!", 3);
    };

    function unaer() {
      const t = sieh();
      if (t.typ === "symbol" && ["!", "-", "+"].includes(t.text)) {
        pos += 1;
        return { art: "unaer", op: t.text, a: unaer(), token: t };
      }
      if (t.typ === "symbol" && (t.text === "++" || t.text === "--")) {
        pos += 1;
        const ziel = unaer();
        if (!ZIELE.has(ziel.art)) throw new SketchFehler(`Syntaxfehler – „${t.text}“ braucht eine Variable.`, t);
        return { art: "inkrement", op: t.text, ziel, praefix: true, token: t };
      }
      if (istCast()) {
        pos += 1;
        const typText = weiter().text;
        pos += 1;
        return { art: "cast", typ: typText, a: unaer(), token: t };
      }
      return postfix();
    }

    function postfix() {
      let a = primaer();
      for (;;) {
        const t = sieh();
        if (ist(".")) {
          pos += 1;
          const n = name();
          a = ist("(")
            ? { art: "aufruf", ziel: a, name: n.text, args: argumente(), token: n }
            : { art: "feld", ziel: a, name: n.text, token: n };
        } else if (ist("[")) {
          pos += 1;
          const index = ausdruck();
          erwarte("]");
          a = { art: "index", ziel: a, index, token: t };
        } else if (t.typ === "symbol" && (t.text === "++" || t.text === "--")) {
          pos += 1;
          if (!ZIELE.has(a.art)) throw new SketchFehler(`Syntaxfehler – „${t.text}“ braucht eine Variable.`, t);
          a = { art: "inkrement", op: t.text, ziel: a, praefix: false, token: t };
        } else {
          return a;
        }
      }
    }

    const zahlWert = (t) => {
      const text = t.text;
      if (/[lL]$/.test(text)) return Number(text.slice(0, -1)) | 0;
      if (/[fFdD]$/.test(text) || /[.eE]/.test(text)) return new Kommazahl(Number(text.replace(/[fFdD]$/, "")));
      const n = Number(text);
      if (n > 2147483647) throw new SketchFehler(`Die Zahl ${text} ist zu groß für „int“.`, t);
      return n;
    };

    const ESCAPES = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", 0: "\0" };
    const entschluessele = (s) =>
      s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, c) =>
        c.length === 5 ? String.fromCharCode(parseInt(c.slice(1), 16)) : (ESCAPES[c] ?? c));

    const neu = (t) => {
      const k = sieh();
      if (k.typ !== "wort" || SCHLUESSELWOERTER.has(k.text)) {
        throw new SketchFehler(`Syntaxfehler – nach „new“ fehlt der Klassenname.`, t);
      }
      pos += 1;
      if (ist("<")) throw new SketchFehler(`„${k.text}<…>“ kann diese Simulation nicht ausführen.`, k);
      if (nimm("[")) {
        if (nimm("]")) {
          if (ist("[")) throw new SketchFehler("Mehrdimensionale Arrays kann diese Simulation nicht ausführen.", k);
          return { art: "neuesArray", elementTyp: k.text, laenge: null, literal: arrayLiteral(), token: t };
        }
        const laenge = ausdruck();
        erwarte("]");
        if (ist("[")) throw new SketchFehler("Mehrdimensionale Arrays kann diese Simulation nicht ausführen.", k);
        return { art: "neuesArray", elementTyp: k.text, laenge, literal: null, token: t };
      }
      return { art: "neu", klasse: k.text, args: argumente(), token: k };
    };

    function primaer() {
      const t = weiter();

      if (t.typ === "zahl") return { art: "wert", wert: zahlWert(t), token: t };

      if (t.typ === "string" || t.typ === "zeichen") {
        const zeichen = t.text[0];
        if (t.text.length < 2 || !t.text.endsWith(zeichen)) {
          throw new SketchFehler("Syntaxfehler – das Anführungszeichen am Ende fehlt.", t);
        }
        return { art: "wert", wert: entschluessele(t.text.slice(1, -1)), token: t };
      }

      if (t.typ === "wort") {
        if (t.text === "true" || t.text === "false") return { art: "wert", wert: t.text === "true", token: t };
        if (t.text === "null") return { art: "wert", wert: null, token: t };
        if (t.text === "this") return { art: "this", token: t };
        if (t.text === "new") return neu(t);
        if (t.text === "super") {
          erwarte(".");
          const n = name();
          if (ist("(")) return { art: "aufruf", ziel: { art: "super", token: t }, name: n.text, args: argumente(), token: n };
          return { art: "feld", ziel: { art: "this", token: t }, name: n.text, token: n };
        }
        if (NICHT_UNTERSTUETZT.has(t.text)) throw nichtUnterstuetzt(t);
        if (SCHLUESSELWOERTER.has(t.text)) throw new SketchFehler(`Syntaxfehler – „${t.text}“ ist hier nicht erlaubt.`, t);
        if (ist("(")) return { art: "aufruf", ziel: null, name: t.text, args: argumente(), token: t };
        return { art: "name", name: t.text, token: t };
      }

      if (t.typ === "symbol" && t.text === "(") {
        const a = ausdruck();
        erwarte(")");
        return a;
      }

      if (t.typ === "ende") throw new SketchFehler("Syntaxfehler – der Code hört mitten in einer Anweisung auf.", liste[pos - 2] || t);
      throw new SketchFehler(`Syntaxfehler – „${t.text}“ ist hier nicht erlaubt.`, t);
    }

    /* --- Anweisungen --- */

    const ANWEISUNGS_AUSDRUECKE = new Set(["zuweisung", "inkrement", "aufruf", "neu"]);

    const ausdruckAnweisung = () => {
      const t = sieh();
      const a = ausdruck();
      if (!ANWEISUNGS_AUSDRUECKE.has(a.art)) throw new SketchFehler("Syntaxfehler – das ist keine vollständige Anweisung.", t);
      erwarte(";");
      return { art: "ausdruck", ausdruck: a, token: t };
    };

    const deklaration = () => {
      const t = sieh();
      modifikatoren();
      const typText = typ();
      return { art: "var", variablen: variablenListe(typText, name()), token: t };
    };

    const block = () => {
      const start = erwarte("{");
      const rumpf = [];
      while (!ist("}")) {
        if (sieh().typ === "ende") throw new SketchFehler("Syntaxfehler – eine schließende Klammer „}“ fehlt.", start);
        rumpf.push(anweisung());
      }
      pos += 1;
      return { art: "block", rumpf, token: start };
    };

    const schleifenKopf = () => {
      erwarte("(");
      const bed = ausdruck();
      erwarte(")");
      return bed;
    };

    const forSchleife = (t) => {
      erwarte("(");

      if (istDeklaration()) {
        const merke = pos;
        modifikatoren();
        const typText = typ();
        const n = name();
        if (nimm(":")) {
          const quelle = ausdruck();
          erwarte(")");
          return { art: "foreach", typ: typText, name: n.text, quelle, rumpf: anweisung(), token: t };
        }
        pos = merke;
      }

      let init = null;
      if (!nimm(";")) init = istDeklaration() ? deklaration() : ausdruckAnweisung();
      const bed = ist(";") ? null : ausdruck();
      erwarte(";");
      const schritte = [];
      if (!ist(")")) {
        do schritte.push(ausdruck()); while (nimm(","));
      }
      erwarte(")");
      return { art: "for", init, bed, schritte, rumpf: anweisung(), token: t };
    };

    function anweisung() {
      const t = sieh();
      if (t.typ === "wort" && NICHT_UNTERSTUETZT.has(t.text)) throw nichtUnterstuetzt(t);
      if (ist("{")) return block();
      if (nimm(";")) return { art: "leer", token: t };
      if (nimm("if")) {
        const bed = schleifenKopf();
        const dann = anweisung();
        return { art: "if", bed, dann, sonst: nimm("else") ? anweisung() : null, token: t };
      }
      if (nimm("while")) {
        const bed = schleifenKopf();
        return { art: "while", bed, rumpf: anweisung(), token: t };
      }
      if (nimm("for")) return forSchleife(t);
      if (nimm("return")) {
        const wert = ist(";") ? null : ausdruck();
        erwarte(";");
        return { art: "return", wert, token: t };
      }
      if (nimm("break") || nimm("continue")) {
        erwarte(";");
        return { art: t.text, token: t };
      }
      if (ist("super") && ist("(", 1)) {
        pos += 1;
        const args = argumente();
        erwarte(";");
        return { art: "super", args, token: t };
      }
      if (ist("this") && ist("(", 1)) throw new SketchFehler("„this(…)“ kann diese Simulation nicht ausführen.", t);
      if (istDeklaration()) return deklaration();
      return ausdruckAnweisung();
    }

    /* --- Klassen und oberste Ebene --- */

    const klasse = (mods) => {
      pos += 1; // class
      const n = name();
      const k = {
        name: n.text, sup: null, supToken: null, oberklasse: null, abstrakt: mods.has("abstract"),
        felder: [], konstruktoren: [], methoden: new Map(), token: n
      };

      if (nimm("extends")) {
        const s = name();
        k.sup = s.text;
        k.supToken = s;
      }
      if (ist("implements")) throw nichtUnterstuetzt(sieh());

      const start = erwarte("{");
      while (!ist("}")) {
        if (sieh().typ === "ende") throw new SketchFehler("Syntaxfehler – eine schließende Klammer „}“ fehlt.", start);
        if (nimm(";")) continue;
        if (sieh().typ === "wort" && NICHT_UNTERSTUETZT.has(sieh().text)) throw nichtUnterstuetzt(sieh());

        const m = modifikatoren();
        if (ist("class")) throw new SketchFehler("Klassen in Klassen kann diese Simulation nicht ausführen.", sieh());

        if (sieh().text === k.name && ist("(", 1)) {
          const kt = weiter();
          const params = parameter();
          const ktor = { name: k.name, params, rumpf: block(), token: kt, klasse: k };
          if (k.konstruktoren.some((c) => c.params.length === params.length)) {
            throw new SketchFehler(`Den Konstruktor „${k.name}()“ gibt es doppelt.`, kt);
          }
          k.konstruktoren.push(ktor);
          continue;
        }

        const typText = typ();
        const mn = name();
        if (ist("(")) {
          const params = parameter();
          const abstrakt = m.has("abstract");
          const rumpf = abstrakt ? (erwarte(";"), null) : block();
          fuegeHinzu(k.methoden, { name: mn.text, typ: typText, params, rumpf, token: mn, klasse: k, abstrakt }, "Methode");
        } else {
          variablenListe(typText, mn).forEach((f) => {
            if (k.felder.some((x) => x.name === f.name)) throw new SketchFehler(`Das Attribut „${f.name}“ gibt es doppelt.`, f.token);
            k.felder.push(f);
          });
        }
      }
      pos += 1;

      if (programm.klassen.has(k.name)) throw new SketchFehler(`Die Klasse „${k.name}“ gibt es doppelt.`, n);
      programm.klassen.set(k.name, k);
    };

    while (sieh().typ !== "ende") {
      const t = sieh();
      if (t.typ === "wort" && NICHT_UNTERSTUETZT.has(t.text)) throw nichtUnterstuetzt(t);
      if (nimm(";")) continue;

      const mods = modifikatoren();
      if (ist("class")) {
        klasse(mods);
        continue;
      }
      if (sieh().typ === "wort" && ist("(", 1)) {
        throw new SketchFehler("Anweisungen außerhalb von Funktionen kann diese Simulation nicht ausführen.", sieh());
      }

      const typText = typ();
      const n = name();
      if (ist("(")) {
        const params = parameter();
        fuegeHinzu(programm.funktionen, { name: n.text, typ: typText, params, rumpf: block(), token: n, klasse: null, abstrakt: false }, "Funktion");
      } else {
        variablenListe(typText, n).forEach((v) => {
          if (programm.globale.some((x) => x.name === v.name)) throw new SketchFehler(`Die Variable „${v.name}“ gibt es doppelt.`, v.token);
          programm.globale.push(v);
        });
      }
    }
  };

  const findeMethode = (klasse, name, anzahl, auchAbstrakt) => {
    for (let k = klasse; k; k = k.oberklasse) {
      const m = (k.methoden.get(name) || []).find((x) => x.params.length === anzahl && (auchAbstrakt || !x.abstrakt));
      if (m) return m;
    }
    return null;
  };

  const hatMethodenNamen = (klasse, name) => {
    for (let k = klasse; k; k = k.oberklasse) if (k.methoden.has(name)) return true;
    return false;
  };

  const findeFeld = (klasse, name) => {
    for (let k = klasse; k; k = k.oberklasse) {
      const f = k.felder.find((x) => x.name === name);
      if (f) return f;
    }
    return null;
  };

  const istUnterklasse = (klasse, name) => {
    if (name === "Object") return true;
    for (let k = klasse; k; k = k.oberklasse) if (k.name === name) return true;
    return false;
  };

  /* Oberklassen verknüpfen und prüfen, was Java schon beim Übersetzen ablehnt */
  const verknuepfe = (programm) => {
    programm.klassen.forEach((k) => {
      if (!k.sup) return;
      const ober = programm.klassen.get(k.sup);
      if (!ober) {
        if (BEKANNTE_KLASSEN.has(k.sup)) throw nichtUnterstuetzt(k.supToken);
        throw new SketchFehler(`Die Klasse „${k.sup}“ existiert nicht.`, k.supToken);
      }
      k.oberklasse = ober;
    });

    programm.klassen.forEach((k) => {
      const gesehen = new Set();
      for (let x = k; x; x = x.oberklasse) {
        if (gesehen.has(x)) throw new SketchFehler(`„${k.name}“ erbt über Umwege von sich selbst.`, k.token);
        gesehen.add(x);
      }
    });

    programm.klassen.forEach((k) => {
      if (k.abstrakt) return;
      for (let x = k; x; x = x.oberklasse) {
        x.methoden.forEach((liste) => liste.forEach((m) => {
          if (!m.abstrakt) return;
          if (x === k) throw new SketchFehler(`„${k.name}“ hat eine abstrakte Methode und muss selbst „abstract“ sein.`, m.token);
          if (!findeMethode(k, m.name, m.params.length, false)) {
            throw new SketchFehler(`„${k.name}“ muss die abstrakte Methode „${m.name}()“ aus „${x.name}“ enthalten.`, k.token);
          }
        }));
      }
    });
  };

  const uebersetze = () => {
    const programm = { klassen: new Map(), funktionen: new Map(), globale: [] };
    dateien.forEach((d) => parseDatei(d, programm));
    verknuepfe(programm);
    return programm;
  };

  /* =====================================================================
     Werte zur Laufzeit
     int -> JS-Zahl, float -> Kommazahl (32 Bit wie in Java), String -> JS-String,
     boolean -> JS-Boolean, null -> null, Objekte und Arrays als eigene Klassen.
     ===================================================================== */

  class Kommazahl {
    constructor(wert) {
      this.wert = Math.fround(wert);
    }
  }

  const neuerHash = () => (0x10000000 + Math.floor(Math.random() * 0x6fffffff)).toString(16);

  class Objekt {
    constructor(klasse) {
      this.klasse = klasse;
      this.felder = new Map();
      this.hash = neuerHash();
    }
  }

  class Reihung {
    constructor(elementTyp, werte) {
      this.elementTyp = elementTyp;
      this.werte = werte;
      this.hash = neuerHash();
    }
  }

  const istZahl = (w) => typeof w === "number" || w instanceof Kommazahl;
  const zahl = (w) => (w instanceof Kommazahl ? w.wert : w);

  const standardwert = (typ) => {
    if (INT_TYPEN.has(typ)) return 0;
    if (FLOAT_TYPEN.has(typ)) return new Kommazahl(0);
    if (typ === "boolean") return false;
    if (typ === "char") return "\0";
    return null;
  };

  const typName = (w) => {
    if (w === null) return "null";
    if (typeof w === "boolean") return "boolean";
    if (typeof w === "number") return "int";
    if (w instanceof Kommazahl) return "float";
    if (typeof w === "string") return "String";
    if (w instanceof Reihung) return `${w.elementTyp}[]`;
    if (w instanceof Objekt) return w.klasse.name;
    return "void";
  };

  /* Wie Float.toString in Java: kürzeste eindeutige Dezimaldarstellung, immer mit ".0" */
  const floatText = (x) => {
    if (Number.isNaN(x)) return "NaN";
    if (x === Infinity) return "Infinity";
    if (x === -Infinity) return "-Infinity";
    if (x === 0) return Object.is(x, -0) ? "-0.0" : "0.0";

    let kurz = x;
    for (let stellen = 1; stellen <= 9; stellen += 1) {
      const kandidat = Number(x.toPrecision(stellen));
      if (Math.fround(kandidat) === x) {
        kurz = kandidat;
        break;
      }
    }

    const betrag = Math.abs(kurz);
    if (betrag >= 1e-3 && betrag < 1e7) {
      const text = String(kurz);
      return text.includes(".") ? text : `${text}.0`;
    }
    const [mantisse, exponent] = kurz.toExponential().split("e");
    return `${mantisse.includes(".") ? mantisse : `${mantisse}.0`}E${Number(exponent)}`;
  };

  /* =====================================================================
     Interpreter
     ===================================================================== */

  const MAX_SCHRITTE = 1000000;
  const MAX_TIEFE = 400;
  const REIHUNG_KUERZEL = { int: "I", color: "I", float: "F", double: "D", long: "J", short: "S", byte: "B", char: "C", boolean: "Z" };

  const erzeugeLauf = (programm, ausgabe) => {
    const globale = new Map();
    const lauf = {
      looping: true,
      frameRate: 60,
      frameCount: 0,
      beendet: false,
      breite: 100,
      hoehe: 100,
      schritte: 0,
      tiefe: 0,
      hatDraw: false
    };

    const klasseVon = (typ) => (typ ? programm.klassen.get(typ) || null : null);
    const findeFunktion = (name, anzahl) =>
      (programm.funktionen.get(name) || []).find((f) => f.params.length === anzahl) || null;

    const zaehle = (token) => {
      lauf.schritte += 1;
      if (lauf.schritte > MAX_SCHRITTE) {
        throw laufzeitFehler("Die Simulation hat angehalten: Die Schleife läuft zu lange.", token);
      }
    };

    const zahlArg = (w, token) => {
      if (!istZahl(w)) throw new SketchFehler(`Hier wird eine Zahl erwartet, aber „${typName(w)}“ gefunden.`, token);
      return zahl(w);
    };

    const wahr = (w, token) => {
      if (typeof w !== "boolean") throw new SketchFehler(`Hier wird true oder false erwartet, aber „${typName(w)}“ gefunden.`, token);
      return w;
    };

    /* --- Text wie String.valueOf in Java --- */

    const klassenPfad = (typ) => {
      if (typ === "String") return "java.lang.String";
      return programm.klassen.has(typ) ? `${sketchName}$${typ}` : typ;
    };

    const standardText = (obj) => `${klassenPfad(obj.klasse.name)}@${obj.hash}`;

    const javaText = (w) => {
      if (w === null) return "null";
      if (w instanceof Kommazahl) return floatText(w.wert);
      if (w instanceof Reihung) {
        return `[${REIHUNG_KUERZEL[w.elementTyp] || `L${klassenPfad(w.elementTyp)};`}@${w.hash}`;
      }
      if (w instanceof Objekt) {
        const m = findeMethode(w.klasse, "toString", 0, false);
        return m ? javaText(fuehreAus(m, w, [], m.token)) : standardText(w);
      }
      return String(w);
    };

    /* --- Typen prüfen und umwandeln --- */

    const anpassen = (typ, w, token) => {
      if (w === undefined) throw new SketchFehler("Hier fehlt ein Wert.", token);

      if (FLOAT_TYPEN.has(typ)) {
        if (typeof w === "number") return new Kommazahl(w);
        if (w instanceof Kommazahl) return w;
      } else if (INT_TYPEN.has(typ)) {
        if (typeof w === "number") return w;
      } else if (typ === "boolean") {
        if (typeof w === "boolean") return w;
      } else if (typ === "char") {
        if (typeof w === "string" && w.length === 1) return w;
      } else if (typ === "String") {
        if (w === null || typeof w === "string") return w;
      } else if (typ === "Object") {
        return w;
      } else if (typ.endsWith("[]")) {
        const element = typ.slice(0, -2);
        if (w === null) return w;
        if (w instanceof Reihung) {
          const k = programm.klassen.get(w.elementTyp);
          if (w.elementTyp === element || (k && istUnterklasse(k, element))) return w;
        }
      } else if (programm.klassen.has(typ)) {
        if (w === null || (w instanceof Objekt && istUnterklasse(w.klasse, typ))) return w;
      } else if (BEKANNTE_KLASSEN.has(typ)) {
        throw new SketchFehler(`„${typ}“ kann diese Simulation nicht ausführen.`, token);
      } else {
        throw new SketchFehler(`Es gibt keine Klasse und keinen Typ namens „${typ}“.`, token);
      }

      throw new SketchFehler(`Typfehler – „${typName(w)}“ passt nicht zu „${typ}“.`, token);
    };

    /* Cast bzw. Rückumwandlung bei +=, ++ (dort schneidet Java still ab) */
    const wandle = (typ, w, token) => {
      if (INT_TYPEN.has(typ)) {
        if (w instanceof Kommazahl) return Math.trunc(w.wert) | 0;
        if (typeof w === "string" && w.length === 1) return w.charCodeAt(0);
      }
      if (typ === "char" && typeof w === "number") return String.fromCharCode(w);
      if (programm.klassen.has(typ) && w instanceof Objekt && !istUnterklasse(w.klasse, typ)) {
        throw laufzeitFehler(`ClassCastException: class ${klassenPfad(w.klasse.name)} cannot be cast to class ${klassenPfad(typ)}`, token);
      }
      return anpassen(typ, w, token);
    };

    /* --- Namen auflösen --- */

    const findeVariable = (name, r) => {
      for (let b = r.bereich; b; b = b.eltern) {
        const e = b.vars.get(name);
        if (e) return e;
      }
      if (r.selbst && findeFeld(r.klasse, name)) return r.selbst.felder.get(name);
      return globale.get(name) || null;
    };

    /* Typ, den Java beim Übersetzen sieht - damit z. B. medium.director abgelehnt
       wird, wenn medium als Medium deklariert ist, auch wenn ein Movie drinsteckt. */
    const statischerTyp = (a, r) => {
      switch (a.art) {
        case "name": {
          const e = findeVariable(a.name, r);
          return e ? e.typ : null;
        }
        case "this": return r.klasse ? r.klasse.name : null;
        case "neu": return a.klasse;
        case "cast": return a.typ;
        case "feld": {
          const k = klasseVon(statischerTyp(a.ziel, r));
          const f = k && findeFeld(k, a.name);
          return f ? f.typ : null;
        }
        case "index": {
          const t = statischerTyp(a.ziel, r);
          return t && t.endsWith("[]") ? t.slice(0, -2) : null;
        }
        case "aufruf": {
          const n = a.args.length;
          let m = null;
          if (a.ziel === null) m = (r.klasse && findeMethode(r.klasse, a.name, n, true)) || findeFunktion(a.name, n);
          else if (a.ziel.art === "super") m = r.klasse && findeMethode(r.klasse.oberklasse, a.name, n, true);
          else m = findeMethode(klasseVon(statischerTyp(a.ziel, r)), a.name, n, true);
          return m ? m.typ : null;
        }
        default: return null;
      }
    };

    const pruefeFeld = (a, r) => {
      const k = klasseVon(statischerTyp(a.ziel, r));
      if (k && !findeFeld(k, a.name)) {
        throw new SketchFehler(`„${a.name}“ ist kein Attribut der Klasse „${k.name}“.`, a.token);
      }
    };

    const pruefeMethode = (a, r) => {
      const k = klasseVon(statischerTyp(a.ziel, r));
      if (!k || findeMethode(k, a.name, a.args.length, true) || OBJEKT_METHODEN.has(a.name)) return;
      if (hatMethodenNamen(k, a.name)) throw new SketchFehler(`„${a.name}()“ erwartet andere Parameter.`, a.token);
      throw new SketchFehler(`Die Methode „${a.name}()“ gibt es in der Klasse „${k.name}“ nicht.`, a.token);
    };

    const feldEintrag = (ziel, a) => {
      if (ziel === null) throw laufzeitFehler("NullPointerException", a.token);
      if (ziel instanceof Reihung && a.name === "length") return { typ: "int", wert: ziel.werte.length, nurLesen: true };
      if (ziel instanceof Objekt && ziel.felder.has(a.name)) return ziel.felder.get(a.name);
      throw new SketchFehler(`„${a.name}“ ist kein Attribut von „${typName(ziel)}“.`, a.token);
    };

    const pruefeIndex = (reihe, i, token) => {
      if (reihe === null) throw laufzeitFehler("NullPointerException", token);
      if (!(reihe instanceof Reihung)) throw new SketchFehler(`„${typName(reihe)}“ ist kein Array.`, token);
      if (typeof i !== "number") throw new SketchFehler(`Der Index muss eine ganze Zahl sein, nicht „${typName(i)}“.`, token);
      if (i < 0 || i >= reihe.werte.length) {
        throw laufzeitFehler(`ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${reihe.werte.length}`, token);
      }
    };

    const eintragReferenz = (e, a) => ({
      typ: e.typ,
      lesen: () => {
        if (e.wert === undefined) throw new SketchFehler(`Die Variable „${a.name}“ hat noch keinen Wert.`, a.token);
        return e.wert;
      },
      schreiben: (w) => { e.wert = w; }
    });

    const referenz = (a, r) => {
      if (a.art === "name") {
        const e = findeVariable(a.name, r);
        if (!e) throw new SketchFehler(`Die Variable „${a.name}“ existiert nicht.`, a.token);
        return eintragReferenz(e, a);
      }
      if (a.art === "feld") {
        pruefeFeld(a, r);
        const e = feldEintrag(werte(a.ziel, r), a);
        if (e.nurLesen) throw new SketchFehler("Die Länge eines Arrays kann man nicht ändern.", a.token);
        return eintragReferenz(e, a);
      }
      const reihe = werte(a.ziel, r);
      const i = werte(a.index, r);
      pruefeIndex(reihe, i, a.token);
      return { typ: reihe.elementTyp, lesen: () => reihe.werte[i], schreiben: (w) => { reihe.werte[i] = w; } };
    };

    /* --- Rechnen --- */

    const rechne = (op, x, y, token) => {
      if (op === "+" && (typeof x === "string" || typeof y === "string")) return javaText(x) + javaText(y);
      if (op === "==" || op === "!=") {
        const gleich = istZahl(x) && istZahl(y) ? zahl(x) === zahl(y) : x === y;
        return op === "==" ? gleich : !gleich;
      }
      if (!istZahl(x) || !istZahl(y)) {
        throw new SketchFehler(`„${op}“ passt nicht zu „${typName(x)}“ und „${typName(y)}“.`, token);
      }

      const a = zahl(x);
      const b = zahl(y);
      switch (op) {
        case "<": return a < b;
        case ">": return a > b;
        case "<=": return a <= b;
        case ">=": return a >= b;
        default: break;
      }

      if (x instanceof Kommazahl || y instanceof Kommazahl) {
        switch (op) {
          case "+": return new Kommazahl(a + b);
          case "-": return new Kommazahl(a - b);
          case "*": return new Kommazahl(a * b);
          case "/": return new Kommazahl(a / b);
          case "%": return new Kommazahl(a % b);
          default: break;
        }
      }

      switch (op) {
        case "+": return (a + b) | 0;
        case "-": return (a - b) | 0;
        case "*": return Math.imul(a, b);
        case "/":
          if (b === 0) throw laufzeitFehler("ArithmeticException: / by zero", token);
          return (a / b) | 0;
        case "%":
          if (b === 0) throw laufzeitFehler("ArithmeticException: / by zero", token);
          return a % b;
        default:
          throw new SketchFehler(`Den Operator „${op}“ kennt diese Simulation nicht.`, token);
      }
    };

    /* --- Ausdrücke auswerten --- */

    const werteListe = (liste, r) => liste.map((x) => werte(x, r));

    const baueReihung = (elementTyp, literal, r) => new Reihung(elementTyp, literal.elemente.map((x) => {
      if (x.art === "arrayLiteral") throw new SketchFehler("Mehrdimensionale Arrays kann diese Simulation nicht ausführen.", x.token);
      return anpassen(elementTyp, werte(x, r), x.token);
    }));

    const werteInit = (init, typ, r) => {
      if (init.art !== "arrayLiteral") return werte(init, r);
      if (!typ.endsWith("[]")) throw new SketchFehler("Eine Liste in { } passt nur zu einem Array.", init.token);
      return baueReihung(typ.slice(0, -2), init, r);
    };

    const konstruiere = (obj, k, args, token) => {
      let ktor = null;
      if (k.konstruktoren.length > 0 || args.length > 0) {
        ktor = k.konstruktoren.find((c) => c.params.length === args.length);
        if (!ktor) throw new SketchFehler(`Der Konstruktor „${k.name}(${args.map(typName).join(", ")})“ existiert nicht.`, token);
      }
      if (lauf.tiefe > MAX_TIEFE) throw laufzeitFehler("StackOverflowError", token);

      const bereich = { vars: new Map(), eltern: null };
      if (ktor) {
        ktor.params.forEach((p, i) => bereich.vars.set(p.name, { typ: p.typ, wert: anpassen(p.typ, args[i], token) }));
      }
      const rahmen = { selbst: obj, klasse: k, bereich };
      const rumpf = ktor ? ktor.rumpf.rumpf : [];
      const superAufruf = rumpf[0] && rumpf[0].art === "super" ? rumpf[0] : null;

      lauf.tiefe += 1;
      try {
        // Java: erst der Konstruktor der Oberklasse, dann die Attribut-Startwerte, dann der Rest
        if (superAufruf) {
          if (!k.oberklasse) throw new SketchFehler("„super(…)“ geht nur in einer Klasse mit „extends“.", superAufruf.token);
          konstruiere(obj, k.oberklasse, werteListe(superAufruf.args, rahmen), superAufruf.token);
        } else if (k.oberklasse) {
          konstruiere(obj, k.oberklasse, [], ktor ? ktor.token : k.token);
        }

        const initRahmen = { selbst: obj, klasse: k, bereich: null };
        k.felder.forEach((f) => {
          if (f.init) obj.felder.get(f.name).wert = anpassen(f.typ, werteInit(f.init, f.typ, initRahmen), f.token);
        });

        fuehreAnweisungen(superAufruf ? rumpf.slice(1) : rumpf, rahmen);
      } finally {
        lauf.tiefe -= 1;
      }
    };

    const erzeuge = (a, r) => {
      const k = programm.klassen.get(a.klasse);
      if (!k) {
        if (BEKANNTE_KLASSEN.has(a.klasse)) throw nichtUnterstuetzt(a.token);
        throw new SketchFehler(`Die Klasse „${a.klasse}“ existiert nicht.`, a.token);
      }
      if (k.abstrakt) throw new SketchFehler(`„${k.name}“ ist abstrakt – davon kann man kein Objekt erzeugen.`, a.token);

      const args = werteListe(a.args, r);
      const obj = new Objekt(k);
      for (let x = k; x; x = x.oberklasse) {
        x.felder.forEach((f) => {
          if (!obj.felder.has(f.name)) obj.felder.set(f.name, { typ: f.typ, wert: standardwert(f.typ) });
        });
      }
      konstruiere(obj, k, args, a.token);
      return obj;
    };

    const neuesArray = (a, r) => {
      if (a.literal) return baueReihung(a.elementTyp, a.literal, r);
      const n = werte(a.laenge, r);
      if (typeof n !== "number") throw new SketchFehler(`Die Länge muss eine ganze Zahl sein, nicht „${typName(n)}“.`, a.token);
      if (n < 0) throw laufzeitFehler(`NegativeArraySizeException: ${n}`, a.token);
      if (n > 100000) throw laufzeitFehler("Das Array ist für diese Simulation zu groß.", a.token);
      return new Reihung(a.elementTyp, Array.from({ length: n }, () => standardwert(a.elementTyp)));
    };

    const weiseZu = (a, r) => {
      const ref = referenz(a.ziel, r);
      let neu;
      if (a.op === "=") {
        neu = anpassen(ref.typ, werte(a.wert, r), a.token);
      } else {
        const alt = ref.lesen();
        neu = wandle(ref.typ, rechne(a.op[0], alt, werte(a.wert, r), a.token), a.token);
      }
      ref.schreiben(neu);
      return neu;
    };

    const erhoehe = (a, r) => {
      const ref = referenz(a.ziel, r);
      const alt = ref.lesen();
      if (!istZahl(alt)) throw new SketchFehler(`„${a.op}“ geht nur mit Zahlen.`, a.token);
      const neu = wandle(ref.typ, rechne(a.op === "++" ? "+" : "-", alt, 1, a.token), a.token);
      ref.schreiben(neu);
      return a.praefix ? neu : alt;
    };

    function werte(a, r) {
      switch (a.art) {
        case "wert": return a.wert;
        case "name": {
          const e = findeVariable(a.name, r);
          if (e) {
            if (e.wert === undefined) throw new SketchFehler(`Die Variable „${a.name}“ hat noch keinen Wert.`, a.token);
            return e.wert;
          }
          if (a.name === "width") return lauf.breite;
          if (a.name === "height") return lauf.hoehe;
          if (a.name === "frameCount") return lauf.frameCount;
          throw new SketchFehler(`Die Variable „${a.name}“ existiert nicht.`, a.token);
        }
        case "this":
          if (!r.selbst) throw new SketchFehler("„this“ gibt es nur innerhalb einer Klasse.", a.token);
          return r.selbst;
        case "feld":
          pruefeFeld(a, r);
          return feldEintrag(werte(a.ziel, r), a).wert;
        case "index": {
          const reihe = werte(a.ziel, r);
          const i = werte(a.index, r);
          pruefeIndex(reihe, i, a.token);
          return reihe.werte[i];
        }
        case "aufruf": {
          const w = rufe(a, r);
          if (w === undefined) throw new SketchFehler(`„${a.name}()“ liefert keinen Wert zurück (void).`, a.token);
          return w;
        }
        case "neu": return erzeuge(a, r);
        case "neuesArray": return neuesArray(a, r);
        case "zuweisung": return weiseZu(a, r);
        case "inkrement": return erhoehe(a, r);
        case "binaer":
          if (a.op === "&&") return wahr(werte(a.a, r), a.token) && wahr(werte(a.b, r), a.token);
          if (a.op === "||") return wahr(werte(a.a, r), a.token) || wahr(werte(a.b, r), a.token);
          return rechne(a.op, werte(a.a, r), werte(a.b, r), a.token);
        case "unaer": {
          const w = werte(a.a, r);
          if (a.op === "!") return !wahr(w, a.token);
          if (!istZahl(w)) throw new SketchFehler(`„${a.op}“ geht nur mit Zahlen.`, a.token);
          if (a.op === "-") return w instanceof Kommazahl ? new Kommazahl(-w.wert) : (-w) | 0;
          return w;
        }
        case "bedingt":
          return wahr(werte(a.bed, r), a.token) ? werte(a.a, r) : werte(a.b, r);
        case "cast":
          return wandle(a.typ, werte(a.a, r), a.token);
        case "instanceof": {
          if (!programm.klassen.has(a.klasse)) throw new SketchFehler(`Die Klasse „${a.klasse}“ existiert nicht.`, a.token);
          const w = werte(a.a, r);
          return w instanceof Objekt && istUnterklasse(w.klasse, a.klasse);
        }
        case "arrayLiteral":
          throw new SketchFehler("Eine Liste in { } geht nur direkt bei der Deklaration eines Arrays.", a.token);
        default:
          throw new SketchFehler("Syntaxfehler.", a.token);
      }
    }

    /* --- Methoden und Funktionen aufrufen --- */

    const fuehreAus = (m, selbst, args, token) => {
      if (lauf.tiefe > MAX_TIEFE) throw laufzeitFehler("StackOverflowError", token);
      zaehle(token);

      const bereich = { vars: new Map(), eltern: null };
      m.params.forEach((p, i) => bereich.vars.set(p.name, { typ: p.typ, wert: anpassen(p.typ, args[i], token) }));

      lauf.tiefe += 1;
      try {
        const signal = fuehreAnweisungen(m.rumpf.rumpf, { selbst, klasse: m.klasse, bereich });
        if (m.typ === "void") return undefined;
        if (!signal || signal.art !== "return" || signal.wert === undefined) {
          throw new SketchFehler(`„${m.name}()“ muss einen Wert vom Typ „${m.typ}“ zurückgeben.`, m.token);
        }
        return anpassen(m.typ, signal.wert, signal.token);
      } finally {
        lauf.tiefe -= 1;
      }
    };

    const textMethode = (s, a, args) => {
      const t = a.token;
      const index = (w, max) => {
        const i = zahlArg(w, t);
        if (typeof w !== "number" || i < 0 || i > max) {
          throw laufzeitFehler(`StringIndexOutOfBoundsException: index ${javaText(w)}, length ${s.length}`, t);
        }
        return i;
      };
      switch (`${a.name}/${args.length}`) {
        case "length/0": return s.length;
        case "equals/1": return s === args[0];
        case "toUpperCase/0": return s.toUpperCase();
        case "toLowerCase/0": return s.toLowerCase();
        case "trim/0": return s.trim();
        case "toString/0": return s;
        case "charAt/1": return s[index(args[0], s.length - 1)];
        case "substring/1": return s.slice(index(args[0], s.length));
        case "substring/2": return s.slice(index(args[0], s.length), index(args[1], s.length));
        case "indexOf/1": return s.indexOf(javaText(args[0]));
        case "contains/1": return s.includes(javaText(args[0]));
        default: throw new SketchFehler(`Die Methode „${a.name}()“ kennt diese Simulation für „String“ nicht.`, t);
      }
    };

    function rufe(a, r) {
      const n = a.args.length;

      if (a.ziel === null) {
        // eigene (auch geerbte) Methode -> Funktion des Sketches -> Processing-Funktion
        if (r.klasse && findeMethode(r.klasse, a.name, n, true)) {
          const args = werteListe(a.args, r);
          return fuehreAus(findeMethode(r.selbst.klasse, a.name, n, false), r.selbst, args, a.token);
        }
        const f = findeFunktion(a.name, n);
        if (f) return fuehreAus(f, null, werteListe(a.args, r), a.token);
        if (programm.funktionen.has(a.name) || (r.klasse && hatMethodenNamen(r.klasse, a.name))) {
          throw new SketchFehler(`„${a.name}()“ erwartet andere Parameter.`, a.token);
        }
        const e = eingebaut.get(a.name);
        if (e) {
          const args = werteListe(a.args, r);
          if (e.anzahl && !e.anzahl.includes(args.length)) {
            throw new SketchFehler(`„${a.name}()“ erwartet andere Parameter.`, a.token);
          }
          return e.f(args, a.token);
        }
        if (ZEICHENFUNKTIONEN.has(a.name)) throw new SketchFehler(`„${a.name}()“ zeichnet – das zeigt diese Simulation nicht an.`, a.token);
        throw new SketchFehler(`Die Funktion „${a.name}()“ existiert nicht.`, a.token);
      }

      if (a.ziel.art === "super") {
        const ober = r.klasse && r.klasse.oberklasse;
        if (!ober || !r.selbst) throw new SketchFehler("„super“ geht nur in einer Klasse mit „extends“.", a.token);
        const args = werteListe(a.args, r);
        const m = findeMethode(ober, a.name, n, false);
        if (m) return fuehreAus(m, r.selbst, args, a.token);
        if (a.name === "toString" && n === 0) return standardText(r.selbst);
        throw new SketchFehler(`Die Methode „${a.name}()“ gibt es in der Klasse „${ober.name}“ nicht.`, a.token);
      }

      pruefeMethode(a, r);
      const ziel = werte(a.ziel, r);
      const args = werteListe(a.args, r);
      if (ziel === null) throw laufzeitFehler("NullPointerException", a.token);
      if (typeof ziel === "string") return textMethode(ziel, a, args);
      if (ziel instanceof Objekt) {
        const m = findeMethode(ziel.klasse, a.name, n, false);
        if (m) return fuehreAus(m, ziel, args, a.token);
        if (a.name === "toString" && n === 0) return standardText(ziel);
        if (a.name === "equals" && n === 1) return ziel === args[0];
      }
      throw new SketchFehler(`Die Methode „${a.name}()“ gibt es für „${typName(ziel)}“ nicht.`, a.token);
    }

    /* --- Anweisungen ausführen. Rückgabe: null oder ein Signal (return/break/continue) --- */

    function fuehreAnweisungen(anweisungen, r) {
      const innen = { selbst: r.selbst, klasse: r.klasse, bereich: { vars: new Map(), eltern: r.bereich } };
      for (const s of anweisungen) {
        const signal = fuehreAnweisung(s, innen);
        if (signal) return signal;
      }
      return null;
    }

    const schleifenSignal = (signal) => {
      if (!signal || signal.art === "continue") return null;
      return signal; // break oder return beenden die Schleife
    };

    function fuehreAnweisung(s, r) {
      switch (s.art) {
        case "block": return fuehreAnweisungen(s.rumpf, r);
        case "leer": return null;
        case "var":
          s.variablen.forEach((v) => {
            if (r.bereich.vars.has(v.name)) throw new SketchFehler(`Die Variable „${v.name}“ gibt es hier schon.`, v.token);
            r.bereich.vars.set(v.name, {
              typ: v.typ,
              wert: v.init ? anpassen(v.typ, werteInit(v.init, v.typ, r), v.token) : undefined
            });
          });
          return null;
        case "ausdruck":
          if (s.ausdruck.art === "aufruf") rufe(s.ausdruck, r);
          else werte(s.ausdruck, r);
          return null;
        case "if":
          if (wahr(werte(s.bed, r), s.token)) return fuehreAnweisung(s.dann, r);
          return s.sonst ? fuehreAnweisung(s.sonst, r) : null;
        case "while":
          while (wahr(werte(s.bed, r), s.token)) {
            zaehle(s.token);
            const signal = schleifenSignal(fuehreAnweisung(s.rumpf, r));
            if (signal) return signal.art === "break" ? null : signal;
          }
          return null;
        case "for": {
          const innen = { selbst: r.selbst, klasse: r.klasse, bereich: { vars: new Map(), eltern: r.bereich } };
          if (s.init) fuehreAnweisung(s.init, innen);
          while (!s.bed || wahr(werte(s.bed, innen), s.token)) {
            zaehle(s.token);
            const signal = schleifenSignal(fuehreAnweisung(s.rumpf, innen));
            if (signal) return signal.art === "break" ? null : signal;
            s.schritte.forEach((x) => werte(x, innen));
          }
          return null;
        }
        case "foreach": {
          const reihe = werte(s.quelle, r);
          if (reihe === null) throw laufzeitFehler("NullPointerException", s.token);
          if (!(reihe instanceof Reihung)) throw new SketchFehler("„for (… : …)“ geht in dieser Simulation nur mit Arrays.", s.token);
          for (const w of reihe.werte.slice()) {
            zaehle(s.token);
            const innen = { selbst: r.selbst, klasse: r.klasse, bereich: { vars: new Map(), eltern: r.bereich } };
            innen.bereich.vars.set(s.name, { typ: s.typ, wert: anpassen(s.typ, w, s.token) });
            const signal = schleifenSignal(fuehreAnweisung(s.rumpf, innen));
            if (signal) return signal.art === "break" ? null : signal;
          }
          return null;
        }
        case "return":
          return { art: "return", wert: s.wert ? werte(s.wert, r) : undefined, token: s.token };
        case "break":
        case "continue":
          return { art: s.art };
        case "super":
          throw new SketchFehler("„super(…)“ muss die erste Anweisung im Konstruktor sein.", s.token);
        default:
          throw new SketchFehler("Syntaxfehler.", s.token);
      }
    }

    /* --- Processing-Funktionen --- */

    const farbe = (args, t) => {
      const n = args.map((w) => zahlArg(w, t));
      const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
      if (n.length <= 2 && typeof args[0] === "number" && (args[0] > 255 || args[0] < 0)) {
        const v = args[0] >>> 0;
        return `rgb(${(v >>> 16) & 255}, ${(v >>> 8) & 255}, ${v & 255})`;
      }
      if (n.length <= 2) return `rgb(${c(n[0])}, ${c(n[0])}, ${c(n[0])})`;
      return `rgb(${c(n[0])}, ${c(n[1])}, ${c(n[2])})`;
    };

    const druckeReihung = (reihe) => {
      reihe.werte.forEach((w, i) => {
        const text = typeof w === "string" && reihe.elementTyp === "String" ? `"${w}"` : javaText(w);
        ausgabe.schreibe(`[${i}] ${text}\n`);
      });
    };

    const eingebaut = new Map(Object.entries({
      println: {
        anzahl: null,
        f: (args) => {
          if (args.length === 1 && args[0] instanceof Reihung) druckeReihung(args[0]);
          else ausgabe.schreibe(`${args.map(javaText).join(" ")}\n`);
        }
      },
      print: { anzahl: null, f: (args) => ausgabe.schreibe(args.map(javaText).join(" ")) },
      printArray: {
        anzahl: [1],
        f: ([w]) => {
          if (w instanceof Reihung) druckeReihung(w);
          else ausgabe.schreibe(`${javaText(w)}\n`);
        }
      },
      noLoop: { anzahl: [0], f: () => { lauf.looping = false; } },
      loop: { anzahl: [0], f: () => { lauf.looping = true; } },
      frameRate: { anzahl: [1], f: ([w], t) => { lauf.frameRate = zahlArg(w, t); } },
      exit: { anzahl: [0], f: () => { lauf.beendet = true; } },
      size: {
        anzahl: [2, 3],
        f: ([b, h], t) => {
          lauf.breite = Math.max(1, Math.round(zahlArg(b, t)));
          lauf.hoehe = Math.max(1, Math.round(zahlArg(h, t)));
          ausgabe.groesse(lauf.breite, lauf.hoehe);
        }
      },
      background: { anzahl: [1, 2, 3, 4], f: (args, t) => ausgabe.hintergrund(farbe(args, t)) },
      color: {
        anzahl: [1, 2, 3, 4],
        f: (args, t) => {
          const n = args.map((w) => Math.max(0, Math.min(255, Math.round(zahlArg(w, t)))));
          const [rot, gruen, blau] = n.length <= 2 ? [n[0], n[0], n[0]] : n;
          const alpha = n.length === 2 ? n[1] : n.length === 4 ? n[3] : 255;
          return ((alpha << 24) | (rot << 16) | (gruen << 8) | blau) | 0;
        }
      },
      abs: { anzahl: [1], f: ([w], t) => (w instanceof Kommazahl ? new Kommazahl(Math.abs(w.wert)) : Math.abs(zahlArg(w, t)) | 0) },
      min: {
        anzahl: [2],
        f: ([a, b], t) => {
          const m = Math.min(zahlArg(a, t), zahlArg(b, t));
          return a instanceof Kommazahl || b instanceof Kommazahl ? new Kommazahl(m) : m;
        }
      },
      max: {
        anzahl: [2],
        f: ([a, b], t) => {
          const m = Math.max(zahlArg(a, t), zahlArg(b, t));
          return a instanceof Kommazahl || b instanceof Kommazahl ? new Kommazahl(m) : m;
        }
      },
      round: { anzahl: [1], f: ([w], t) => Math.round(zahlArg(w, t)) | 0 },
      floor: { anzahl: [1], f: ([w], t) => Math.floor(zahlArg(w, t)) | 0 },
      ceil: { anzahl: [1], f: ([w], t) => Math.ceil(zahlArg(w, t)) | 0 },
      sqrt: { anzahl: [1], f: ([w], t) => new Kommazahl(Math.sqrt(zahlArg(w, t))) },
      pow: { anzahl: [2], f: ([a, b], t) => new Kommazahl(Math.pow(zahlArg(a, t), zahlArg(b, t))) },
      random: {
        anzahl: [1, 2],
        f: (args, t) => {
          const [von, bis] = args.length === 1 ? [0, zahlArg(args[0], t)] : [zahlArg(args[0], t), zahlArg(args[1], t)];
          return new Kommazahl(von + Math.random() * (bis - von));
        }
      },
      int: {
        anzahl: [1],
        f: ([w], t) => {
          if (typeof w === "boolean") return w ? 1 : 0;
          if (typeof w === "string") return w.length === 1 && !/\d/.test(w) ? w.charCodeAt(0) : parseInt(w, 10) | 0;
          return Math.trunc(zahlArg(w, t)) | 0;
        }
      },
      float: {
        anzahl: [1],
        f: ([w], t) => new Kommazahl(typeof w === "string" ? Number(w) : zahlArg(w, t))
      },
      str: { anzahl: [1], f: ([w]) => javaText(w) }
    }));

    /* --- Start und Frames --- */

    const rufeFunktion = (name) => {
      const f = findeFunktion(name, 0);
      if (f) fuehreAus(f, null, [], f.token);
    };

    lauf.hatDraw = Boolean(findeFunktion("draw", 0));

    lauf.start = () => {
      const rahmen = { selbst: null, klasse: null, bereich: null };
      programm.globale.forEach((v) => globale.set(v.name, { typ: v.typ, wert: standardwert(v.typ) }));
      programm.globale.forEach((v) => {
        if (v.init) globale.get(v.name).wert = anpassen(v.typ, werteInit(v.init, v.typ, rahmen), v.token);
      });
      rufeFunktion("setup");
    };

    lauf.frame = () => {
      lauf.schritte = 0;
      lauf.frameCount += 1;
      rufeFunktion("draw");
    };

    return lauf;
  };

  /* =====================================================================
     Oberfläche
     ===================================================================== */

  const ide = document.getElementById("ide");
  const runButton = document.getElementById("runButton");
  const stopButton = document.getElementById("stopButton");
  const ideTabs = document.getElementById("ideTabs");
  const ideEditor = document.getElementById("ideEditor");
  const codeView = document.getElementById("codeView");
  const ideMessage = document.getElementById("ideMessage");
  const ideConsole = document.getElementById("ideConsole");
  const sketchWindow = document.getElementById("sketchWindow");
  const sketchTitlebar = document.getElementById("sketchTitlebar");
  const sketchTitle = document.getElementById("sketchTitle");
  const sketchClose = document.getElementById("sketchClose");
  const sketchCanvas = document.getElementById("sketchCanvas");
  const zeichenflaeche = sketchCanvas.getContext("2d");

  const state = { tab: dateien[0].name };

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Speichern ist optional; ohne localStorage geht nur der offene Reiter verloren.
    }
  };

  const restore = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && dateien.some((d) => d.name === data.tab)) state.tab = data.tab;
    } catch {
      // ungültige Daten ignorieren
    }
  };

  /* --- Reiter und Codeansicht --- */

  let fehlerStelle = null;

  const tabButtons = dateien.map((d, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ide-tab";
    b.id = `ide-tab-${i}`;
    b.textContent = d.name;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "codeView");
    ideTabs.append(b);
    return b;
  });

  const zeigeCode = (datei) => {
    const zeilen = datei.zeilen.map((teile, i) => {
      const zeileEl = document.createElement("div");
      zeileEl.className = "ide-line";
      if (fehlerStelle && fehlerStelle.datei === datei.name && fehlerStelle.zeile === i + 1) {
        zeileEl.classList.add("is-error");
      }

      const nummer = document.createElement("span");
      nummer.className = "ide-gutter";
      nummer.textContent = String(i + 1);

      const code = document.createElement("span");
      code.className = "ide-code";
      teile.forEach(({ text, klasse }) => {
        if (!klasse) {
          code.append(text);
          return;
        }
        const span = document.createElement("span");
        span.className = klasse;
        span.textContent = text;
        code.append(span);
      });

      zeileEl.append(nummer, code);
      return zeileEl;
    });
    codeView.replaceChildren(...zeilen);
  };

  const zeigeReiter = () => {
    const aktiv = Math.max(0, dateien.findIndex((d) => d.name === state.tab));
    tabButtons.forEach((b, i) => {
      b.classList.toggle("is-active", i === aktiv);
      b.setAttribute("aria-selected", i === aktiv ? "true" : "false");
      b.tabIndex = i === aktiv ? 0 : -1;
    });
    codeView.setAttribute("aria-labelledby", tabButtons[aktiv].id);
    zeigeCode(dateien[aktiv]);
  };

  const waehleReiter = (i, fokus) => {
    if (state.tab !== dateien[i].name) {
      state.tab = dateien[i].name;
      zeigeReiter();
      ideEditor.scrollTop = 0;
      ideEditor.scrollLeft = 0;
      persist();
    }
    if (fokus) tabButtons[i].focus();
  };

  tabButtons.forEach((b, i) => {
    b.addEventListener("click", () => waehleReiter(i));
    b.addEventListener("keydown", (event) => {
      const n = tabButtons.length;
      const ziel = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[event.key];
      if (ziel === undefined) return;
      event.preventDefault();
      waehleReiter(ziel, true);
    });
  });

  /* Fehlerzeile markieren und in den sichtbaren Bereich holen. Bewusst ohne
     scrollIntoView: das würde im iframe auch die Logseq-Seite verschieben. */
  const setzeFehlerStelle = (token) => {
    if (!token && !fehlerStelle) return;
    fehlerStelle = token ? { datei: token.datei, zeile: token.zeile } : null;
    if (fehlerStelle && state.tab !== fehlerStelle.datei) {
      state.tab = fehlerStelle.datei;
      persist();
    }
    zeigeReiter();
    if (!fehlerStelle) return;
    const zeile = codeView.children[fehlerStelle.zeile - 1];
    if (zeile) ideEditor.scrollTop = Math.max(0, zeile.offsetTop - ideEditor.clientHeight / 3);
  };

  /* --- Meldungsleiste und Konsole --- */

  const setzeMeldung = (text, fehler = false) => {
    ideMessage.classList.toggle("is-error", fehler);
    if (ideMessage.textContent === text) return;
    ideMessage.textContent = text;
  };

  const MAX_KONSOLENZEILEN = 1000;
  let offeneZeile = null;

  const konsole = {
    leeren() {
      ideConsole.replaceChildren();
      offeneZeile = null;
    },
    schreibe(text, fehler = false) {
      if (fehler) offeneZeile = null;
      const teile = text.split("\n");
      teile.forEach((teil, i) => {
        const letzter = i === teile.length - 1;
        if (letzter && teil === "") return;
        if (!offeneZeile) {
          offeneZeile = document.createElement("div");
          offeneZeile.className = fehler ? "console-line is-error" : "console-line";
          ideConsole.append(offeneZeile);
        }
        offeneZeile.append(teil);
        if (!letzter) offeneZeile = null;
      });
      while (ideConsole.childElementCount > MAX_KONSOLENZEILEN) ideConsole.firstElementChild.remove();
      ideConsole.scrollTop = ideConsole.scrollHeight;
    }
  };

  /* --- Sketch-Fenster --- */

  let fensterPos = null;

  const setzeFensterPos = (links, oben) => {
    const maxLinks = Math.max(0, ide.clientWidth - sketchWindow.offsetWidth);
    const maxOben = Math.max(0, ide.clientHeight - sketchWindow.offsetHeight);
    fensterPos = {
      links: Math.min(Math.max(0, links), maxLinks),
      oben: Math.min(Math.max(0, oben), maxOben)
    };
    sketchWindow.style.left = `${fensterPos.links}px`;
    sketchWindow.style.top = `${fensterPos.oben}px`;
  };

  /* Beim ersten Öffnen unten rechts im Editor - dort steht fast nie Code */
  const oeffneFenster = () => {
    sketchTitle.textContent = sketchName;
    sketchWindow.hidden = false;
    if (fensterPos) {
      setzeFensterPos(fensterPos.links, fensterPos.oben);
      return;
    }
    const unten = ideEditor.offsetTop + ideEditor.clientHeight - sketchWindow.offsetHeight - 12;
    setzeFensterPos(ide.clientWidth - sketchWindow.offsetWidth - 16, Math.max(ideEditor.offsetTop + 12, unten));
  };

  const fuelle = (farbeText) => {
    zeichenflaeche.fillStyle = farbeText;
    zeichenflaeche.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);
  };

  const ausgabe = {
    schreibe: (text, fehler) => konsole.schreibe(text, fehler),
    groesse: (breite, hoehe) => {
      sketchCanvas.width = breite;
      sketchCanvas.height = hoehe;
      fuelle(STANDARD_HINTERGRUND);
    },
    hintergrund: (farbeText) => fuelle(farbeText)
  };

  sketchTitlebar.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button") || !fensterPos) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY, links: fensterPos.links, oben: fensterPos.oben };
    sketchTitlebar.setPointerCapture(event.pointerId);

    const bewege = (e) => setzeFensterPos(start.links + e.clientX - start.x, start.oben + e.clientY - start.y);
    const ende = () => {
      sketchTitlebar.removeEventListener("pointermove", bewege);
      sketchTitlebar.removeEventListener("pointerup", ende);
      sketchTitlebar.removeEventListener("pointercancel", ende);
    };
    sketchTitlebar.addEventListener("pointermove", bewege);
    sketchTitlebar.addEventListener("pointerup", ende);
    sketchTitlebar.addEventListener("pointercancel", ende);
  });

  window.addEventListener("resize", () => {
    if (!sketchWindow.hidden && fensterPos) setzeFensterPos(fensterPos.links, fensterPos.oben);
  });

  /* --- Ausführen und Stoppen --- */

  let lauf = null;
  let zeitgeber = null;

  const stoppe = () => {
    clearTimeout(zeitgeber);
    zeitgeber = null;
    lauf = null;

    // Fokus erst retten, dann Knopf sperren - sonst landet er im Nichts
    const fokusRetten = document.activeElement === stopButton || sketchWindow.contains(document.activeElement);
    sketchWindow.hidden = true;
    runButton.classList.remove("is-running");
    stopButton.disabled = true;
    if (fokusRetten) runButton.focus();
  };

  const melde = (fehler) => {
    let text = "Die Simulation ist auf einen internen Fehler gestoßen.";
    let token = null;
    let art = "laufzeit";

    if (fehler instanceof SketchFehler) {
      text = fehler.message;
      token = fehler.token;
      art = fehler.art;
    } else if (fehler instanceof RangeError) {
      text = "StackOverflowError";
    } else {
      console.error(fehler);
    }

    stoppe();
    // Fehler, die Java schon beim Übersetzen findet: Processing startet dann gar nicht erst
    if (art === "syntax") konsole.leeren();
    else konsole.schreibe(`${text}\n`, true);
    setzeMeldung(text, true);
    setzeFehlerStelle(token);
  };

  const plane = () => {
    if (!lauf || !lauf.hatDraw || !lauf.looping) return;
    const dieserLauf = lauf;
    zeitgeber = setTimeout(() => {
      if (lauf !== dieserLauf) return;
      try {
        lauf.frame();
      } catch (fehler) {
        melde(fehler);
        return;
      }
      if (lauf.beendet) stoppe();
      else plane();
    }, 1000 / Math.min(60, Math.max(1, lauf.frameRate)));
  };

  const starte = () => {
    stoppe();
    konsole.leeren();
    setzeMeldung("");
    setzeFehlerStelle(null);

    let programm;
    try {
      programm = uebersetze();
    } catch (fehler) {
      melde(fehler);
      return;
    }

    lauf = erzeugeLauf(programm, ausgabe);
    sketchCanvas.width = 100;
    sketchCanvas.height = 100;
    fuelle(STANDARD_HINTERGRUND);
    oeffneFenster();
    runButton.classList.add("is-running");
    stopButton.disabled = false;

    try {
      lauf.start();
    } catch (fehler) {
      melde(fehler);
      return;
    }

    setzeFensterPos(fensterPos.links, fensterPos.oben); // size() kann das Fenster verändert haben
    if (lauf.beendet) stoppe();
    else plane();
  };

  /* --- Kopieren: genau der Text, der im aktuellen Reiter angezeigt wird --- */

  const copyButton = document.getElementById("copyButton");
  const downloadButton = document.getElementById("downloadButton");

  const inZwischenablage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback für iframes ohne clipboard-write-Erlaubnis und unsichere Kontexte
      const feld = document.createElement("textarea");
      feld.value = text;
      feld.setAttribute("readonly", "");
      feld.style.position = "fixed";
      feld.style.opacity = "0";
      document.body.append(feld);
      feld.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      feld.remove();
      copyButton.focus();
      return ok;
    }
  };

  copyButton.addEventListener("click", async () => {
    const datei = dateien.find((d) => d.name === state.tab) || dateien[0];
    const ok = await inZwischenablage(`${datei.text}\n`);
    if (ok) setzeMeldung(`„${datei.name}“ ist in der Zwischenablage.`);
    else setzeMeldung("Kopieren hat nicht geklappt – markiere den Code und drücke Strg+C.", true);
  });

  /* --- Projekt als .zip: Ordner <Sketchname>/ mit einer .pde pro Reiter, wie
     Processing ihn erwartet. ZIP ohne Kompression, damit keine Bibliothek nötig ist. --- */

  const CRC_TABELLE = (() => {
    const tabelle = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tabelle[n] = c >>> 0;
    }
    return tabelle;
  })();

  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = CRC_TABELLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const baueZip = (eintraege) => {
    const kodierer = new TextEncoder();
    const jetzt = new Date();
    const zeit = (jetzt.getHours() << 11) | (jetzt.getMinutes() << 5) | (jetzt.getSeconds() >> 1);
    const datum = ((jetzt.getFullYear() - 1980) << 9) | ((jetzt.getMonth() + 1) << 5) | jetzt.getDate();
    const UTF8_NAMEN = 0x0800;
    const dateiTeile = [];
    const verzeichnis = [];
    let versatz = 0;

    eintraege.forEach(({ name, text }) => {
      const nameBytes = kodierer.encode(name);
      const daten = kodierer.encode(text);
      const crc = crc32(daten);

      const kopf = new DataView(new ArrayBuffer(30));
      kopf.setUint32(0, 0x04034b50, true);
      kopf.setUint16(4, 20, true);
      kopf.setUint16(6, UTF8_NAMEN, true);
      kopf.setUint16(10, zeit, true);
      kopf.setUint16(12, datum, true);
      kopf.setUint32(14, crc, true);
      kopf.setUint32(18, daten.length, true);
      kopf.setUint32(22, daten.length, true);
      kopf.setUint16(26, nameBytes.length, true);
      dateiTeile.push(kopf, nameBytes, daten);

      const eintrag = new DataView(new ArrayBuffer(46));
      eintrag.setUint32(0, 0x02014b50, true);
      eintrag.setUint16(4, 20, true);
      eintrag.setUint16(6, 20, true);
      eintrag.setUint16(8, UTF8_NAMEN, true);
      eintrag.setUint16(12, zeit, true);
      eintrag.setUint16(14, datum, true);
      eintrag.setUint32(16, crc, true);
      eintrag.setUint32(20, daten.length, true);
      eintrag.setUint32(24, daten.length, true);
      eintrag.setUint16(28, nameBytes.length, true);
      eintrag.setUint32(42, versatz, true);
      verzeichnis.push(eintrag, nameBytes);

      versatz += 30 + nameBytes.length + daten.length;
    });

    const verzeichnisGroesse = verzeichnis.reduce((summe, teil) => summe + teil.byteLength, 0);
    const ende = new DataView(new ArrayBuffer(22));
    ende.setUint32(0, 0x06054b50, true);
    ende.setUint16(8, eintraege.length, true);
    ende.setUint16(10, eintraege.length, true);
    ende.setUint32(12, verzeichnisGroesse, true);
    ende.setUint32(16, versatz, true);

    return new Blob([...dateiTeile, ...verzeichnis, ende], { type: "application/zip" });
  };

  downloadButton.addEventListener("click", () => {
    const zip = baueZip(dateien.map((d) => ({ name: `${sketchName}/${d.name}.pde`, text: `${d.text}\n` })));
    const url = URL.createObjectURL(zip);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sketchName}.zip`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* Stoppen von Hand leert auch die Konsole. Bei Fehlern bleibt sie stehen,
     damit man die Meldung lesen kann. */
  const stoppeVonHand = () => {
    stoppe();
    konsole.leeren();
  };

  runButton.addEventListener("click", starte);
  stopButton.addEventListener("click", stoppeVonHand);
  sketchClose.addEventListener("click", stoppeVonHand);

  restore();
  zeigeReiter();
})();
