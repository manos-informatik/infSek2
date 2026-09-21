(() => {
  "use strict";

  const STORAGE_KEY = "infsek2-oop-vererbung-v1";

  const MARK_TEXT = {
    geerbt: { badge: "G", wort: "geerbt", css: "is-geerbt" },
    ueber: { badge: "Ü", wort: "überschrieben", css: "is-ueber" },
    eigen: { badge: "E", wort: "eigen", css: "is-eigen" }
  };

  const GRUPPEN = [
    { kind: "attribute", titel: "Attribute" },
    { kind: "methode", titel: "Methoden" }
  ];

  const nodes = Array.from(document.querySelectorAll(".uml-node"));
  const byName = new Map(nodes.map((node) => [node.dataset.class, node]));
  const alleZeilen = Array.from(document.querySelectorAll(".uml-compartment li"));

  const detailClass = document.getElementById("detailClass");
  const detailCounts = document.getElementById("detailCounts");
  const detailBody = document.getElementById("detailBody");
  const liveStatus = document.getElementById("liveStatus");
  const countGeerbt = document.getElementById("countGeerbt");
  const countUeber = document.getElementById("countUeber");
  const countEigen = document.getElementById("countEigen");

  const overlay = document.getElementById("hintOverlay");
  const hintButton = document.getElementById("hintButton");
  const hintClose = document.getElementById("hintClose");

  const state = { selected: null, tab: "Form" };

  /* --- Zustand --- */

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Speichern ist optional; ohne localStorage geht nur der Stand zwischen Besuchen verloren.
    }
  };

  const restore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const daten = JSON.parse(raw);
      if (!daten || typeof daten !== "object") return;

      if (typeof daten.selected === "string" && byName.has(daten.selected)) {
        state.selected = daten.selected;
      }
      if (typeof daten.tab === "string" && Object.prototype.hasOwnProperty.call(CODE, daten.tab)) {
        state.tab = daten.tab;
      }
    } catch {
      // ungültige Daten ignorieren, Seite startet leer
    }
  };

  /* --- Members aus dem Diagramm lesen: eine Quelle für Diagramm und Übersicht --- */

  // Die {abstract}-Notiz steht als eigenes Element in der Zeile und gehoert nicht zur Signatur.
  const signatur = (li) => {
    const kopie = li.cloneNode(true);
    kopie.querySelectorAll(".uml-note").forEach((note) => note.remove());
    return kopie.textContent.trim();
  };

  const readMembers = (node) =>
    Array.from(node.querySelectorAll(".uml-compartment li")).map((li) => ({
      li,
      key: li.dataset.key,
      kind: li.closest(".uml-compartment").dataset.compartment,
      ctor: li.dataset.role === "ctor",
      abstrakt: li.dataset.abstract === "true",
      sig: signatur(li)
    }));

  const analyse = (name) => {
    const node = byName.get(name);
    const eigene = readMembers(node);
    const oberklasse = node.dataset.extends || null;
    // Konstruktoren werden nicht vererbt - sie bleiben aus der Erbliste heraus.
    const geerbte = oberklasse ? readMembers(byName.get(oberklasse)).filter((m) => !m.ctor) : [];
    const oberKeys = new Set(geerbte.map((m) => m.key));

    const marks = new Map();
    const zeilen = [];

    geerbte.forEach((m) => {
      const ueberschrieben = eigene.some((o) => !o.ctor && o.key === m.key);
      marks.set(m.li, ueberschrieben ? "ueber" : "geerbt");
      if (!ueberschrieben) {
        zeilen.push({
          kind: m.kind,
          sig: m.sig,
          mark: "geerbt",
          abstrakt: m.abstrakt,
          herkunft: m.abstrakt ? `aus ${oberklasse}, noch ohne Inhalt` : `aus ${oberklasse}`
        });
      }
    });

    const abstraktInOberklasse = new Map(geerbte.map((m) => [m.key, m.abstrakt]));

    eigene.forEach((m) => {
      const ueberschrieben = !m.ctor && oberKeys.has(m.key);
      const mark = ueberschrieben ? "ueber" : "eigen";
      marks.set(m.li, mark);

      // In Form ist die Methode nur gefordert - hier bekommt sie zum ersten Mal Inhalt.
      const herkunft = ueberschrieben
        ? (abstraktInOberklasse.get(m.key)
            ? `aus ${oberklasse}, hier ausprogrammiert`
            : `aus ${oberklasse}, hier neu geschrieben`)
        : (m.abstrakt ? "nur gefordert, ohne Inhalt" : `nur in ${name}`);

      zeilen.push({ kind: m.kind, sig: m.sig, mark, abstrakt: m.abstrakt, herkunft });
    });

    return { zeilen, marks };
  };

  /* --- Anzeige --- */

  const zeileBauen = ({ sig, mark, herkunft, abstrakt }) => {
    const info = MARK_TEXT[mark];
    const li = document.createElement("li");
    li.className = `member ${info.css}${abstrakt ? " is-abstract" : ""}`;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = info.badge;

    const wort = document.createElement("span");
    wort.className = "sr-only";
    wort.textContent = `${info.wort}:`;

    const text = document.createElement("span");
    text.className = "member-sig";
    text.textContent = sig;

    const quelle = document.createElement("span");
    quelle.className = "member-origin";
    quelle.textContent = herkunft;

    li.append(badge, wort, text);

    if (abstrakt) {
      const notiz = document.createElement("span");
      notiz.className = "uml-note";
      notiz.textContent = "{abstract}";
      li.append(notiz);
    }

    li.append(quelle);
    return li;
  };

  const renderDetail = (name) => {
    detailBody.replaceChildren();
    detailBody.classList.toggle("is-empty", !name);

    if (!name) {
      const hinweis = document.createElement("p");
      hinweis.className = "empty-hint";
      hinweis.textContent = "Klicke im Diagramm auf eine Klasse.";
      detailBody.append(hinweis);
      detailClass.hidden = true;
      detailCounts.hidden = true;
      liveStatus.textContent = "";
      return;
    }

    const { zeilen } = analyse(name);

    GRUPPEN.forEach(({ kind, titel }) => {
      const gruppenZeilen = zeilen.filter((z) => z.kind === kind);
      if (gruppenZeilen.length === 0) return;

      const gruppe = document.createElement("div");
      gruppe.className = "member-group";

      const ueberschrift = document.createElement("h3");
      ueberschrift.textContent = titel;

      const liste = document.createElement("ul");
      liste.className = "member-list";
      gruppenZeilen.forEach((z) => liste.append(zeileBauen(z)));

      gruppe.append(ueberschrift, liste);
      detailBody.append(gruppe);
    });

    const zaehle = (mark) => zeilen.filter((z) => z.mark === mark).length;
    const g = zaehle("geerbt");
    const u = zaehle("ueber");
    const e = zaehle("eigen");

    countGeerbt.textContent = `G ${g} geerbt`;
    countUeber.textContent = `Ü ${u} überschrieben`;
    countEigen.textContent = `E ${e} eigen`;
    countGeerbt.hidden = g === 0;
    countUeber.hidden = u === 0;

    detailClass.textContent = name;
    detailClass.hidden = false;
    detailCounts.hidden = false;

    const meldung = `${name}: ${g} geerbt, ${u} überschrieben, ${e} eigen.`;
    if (liveStatus.textContent !== meldung) liveStatus.textContent = meldung;
  };

  const renderDiagramm = (name) => {
    alleZeilen.forEach((li) => li.classList.remove("is-geerbt", "is-ueber", "is-eigen"));

    nodes.forEach((node) => {
      const aktiv = node.dataset.class === name;
      node.classList.toggle("is-selected", aktiv);
      node.setAttribute("aria-pressed", aktiv ? "true" : "false");
    });

    if (!name) return;

    analyse(name).marks.forEach((mark, li) => li.classList.add(MARK_TEXT[mark].css));
  };

  const renderAll = () => {
    renderDiagramm(state.selected);
    renderDetail(state.selected);
  };

  const waehle = (name) => {
    state.selected = state.selected === name ? null : name;
    // Der Code-Reiter folgt der Auswahl, damit Diagramm und Quelltext dieselbe Klasse zeigen.
    if (state.selected) {
      state.tab = state.selected;
      zeigeReiter(state.tab);
    }
    renderAll();
    persist();
  };

  nodes.forEach((node) => {
    node.addEventListener("click", () => waehle(node.dataset.class));
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      waehle(node.dataset.class);
    });
  });

  /* --- Processing-IDE: Reiter, Zeilennummern, Syntaxfarben --- */

  const KEYWORDS = new Set(["class", "abstract", "extends", "super", "void", "this", "new", "return", "if", "else", "for", "while"]);
  const TYPES = new Set(["int", "float", "color", "boolean"]);
  const BUILTINS = new Set([
    "setup", "draw", "size", "background", "fill", "circle", "rect", "println", "PI",
    "width", "height", "zeichnen", "berechneFlaeche", "berechneUmfang", "farbeAendern"
  ]);

  /* Pro Reiter steht daneben, welche Zeilen gelb hinterlegt werden - das ist das,
     worauf die Aufgabe zeigt. */
  const CODE = {
    Main: {
      schluessel: /Form\[\]|Form f|f\.zeichnen/,
      text: `Form[] formen = new Form[2];

void setup(){
  size(400, 400);
  formen[0] = new Kreis(100, 100, 80, color(34, 211, 238));
  formen[1] = new Rechteck(200, 200, 140, 90, color(16, 185, 129));
}

void draw(){
  background(15, 23, 42);

  // f ist eine Form. Welches zeichnen() läuft, entscheidet das Objekt.
  for (Form f : formen) {
    f.zeichnen();
  }
}`
    },

    Form: {
      schluessel: /\babstract\b/,
      text: `abstract class Form {
  int x;
  int y;
  color farbe;

  Form(int x, int y, color farbe){
    this.x = x;
    this.y = y;
    this.farbe = farbe;
  }

  abstract void zeichnen();

  abstract void berechneFlaeche();

  abstract void berechneUmfang();

  void farbeAendern(color neueFarbe){
    farbe = neueFarbe;
  }
}`
    },

    Kreis: {
      schluessel: /\bextends\b|\bsuper\s*\(/,
      text: `class Kreis extends Form {
  float durchmesser;

  Kreis(int x, int y, float durchmesser, color farbe){
    super(x, y, farbe);
    this.durchmesser = durchmesser;
  }

  void zeichnen(){
    fill(farbe);
    circle(x, y, durchmesser);
  }

  void berechneFlaeche(){
    println(PI * durchmesser * durchmesser / 4);
  }

  void berechneUmfang(){
    println(PI * durchmesser);
  }
}`
    },

    Rechteck: {
      schluessel: /\bextends\b|\bsuper\s*\(/,
      text: `class Rechteck extends Form {
  int breite;
  int höhe;

  Rechteck(int x, int y, int breite, int höhe, color farbe){
    super(x, y, farbe);
    this.breite = breite;
    this.höhe = höhe;
  }

  void zeichnen(){
    fill(farbe);
    rect(x, y, breite, höhe);
  }

  void berechneFlaeche(){
    println(breite * höhe);
  }

  void berechneUmfang(){
    println(2 * breite + 2 * höhe);
  }
}`
    }
  };

  const highlightLine = (zeile) => {
    const teile = document.createDocumentFragment();
    const muster = /(\/\/.*$)|([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)|(\d+(?:\.\d+)?)/g;
    let bisher = 0;
    let treffer;

    while ((treffer = muster.exec(zeile)) !== null) {
      if (treffer.index > bisher) {
        teile.append(document.createTextNode(zeile.slice(bisher, treffer.index)));
      }

      const text = treffer[0];
      let klasse = null;

      if (treffer[1]) {
        klasse = "tok-comment";
      } else if (treffer[2]) {
        if (KEYWORDS.has(text)) klasse = "tok-keyword";
        else if (TYPES.has(text)) klasse = "tok-type";
        else if (BUILTINS.has(text)) klasse = "tok-function";
      } else {
        klasse = "tok-number";
      }

      if (klasse) {
        const span = document.createElement("span");
        span.className = klasse;
        span.textContent = text;
        teile.append(span);
      } else {
        teile.append(document.createTextNode(text));
      }

      bisher = muster.lastIndex;
    }

    if (bisher < zeile.length) teile.append(document.createTextNode(zeile.slice(bisher)));
    return teile;
  };

  const renderCodeView = (container, { text, schluessel }) => {
    container.replaceChildren();

    text.split("\n").forEach((zeile, i) => {
      const zeileEl = document.createElement("div");
      zeileEl.className = schluessel.test(zeile) ? "ide-line is-key" : "ide-line";

      const nummer = document.createElement("span");
      nummer.className = "ide-gutter";
      nummer.textContent = String(i + 1);

      const codeEl = document.createElement("span");
      codeEl.className = "ide-code";
      codeEl.append(highlightLine(zeile));

      zeileEl.append(nummer, codeEl);
      container.append(zeileEl);
    });
  };

  const tabs = Array.from(document.querySelectorAll(".ide-tab"));
  const views = new Map(
    Object.keys(CODE).map((name) => [name, document.getElementById(`code-view-${name}`)])
  );

  views.forEach((view, name) => renderCodeView(view, CODE[name]));

  const zeigeReiter = (name) => {
    tabs.forEach((tab) => {
      const aktiv = tab.dataset.tab === name;
      tab.classList.toggle("is-active", aktiv);
      tab.setAttribute("aria-selected", aktiv ? "true" : "false");
      tab.tabIndex = aktiv ? 0 : -1;
    });
    views.forEach((view, viewName) => {
      view.hidden = viewName !== name;
    });
  };

  const waehleReiter = (name, fokus) => {
    state.tab = name;
    zeigeReiter(name);
    if (fokus) document.getElementById(`tab-${name}`).focus();
    persist();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => waehleReiter(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const schritt = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (schritt === undefined && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();

      const ziel = event.key === "Home" ? 0
        : event.key === "End" ? tabs.length - 1
        : (i + schritt + tabs.length) % tabs.length;
      waehleReiter(tabs[ziel].dataset.tab, true);
    });
  });

  /* --- Kopieren: Text aus dem DOM, damit Anzeige und Zwischenablage nie auseinanderlaufen --- */

  const copyButton = document.getElementById("copyButton");
  const copyFeedback = document.getElementById("copyFeedback");

  const setFeedback = (box, text, ok) => {
    box.hidden = false;
    box.classList.remove("success", "error");
    box.classList.add(ok ? "success" : "error");
    if (box.textContent !== text) box.textContent = text;
  };

  const inZwischenablage = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback unten versuchen
    }

    try {
      const feld = document.createElement("textarea");
      feld.value = text;
      feld.setAttribute("readonly", "");
      feld.style.position = "fixed";
      feld.style.top = "-1000px";
      document.body.append(feld);
      feld.select();
      const ok = document.execCommand("copy");
      feld.remove();
      return ok;
    } catch {
      return false;
    }
  };

  copyButton.addEventListener("click", async () => {
    const view = views.get(state.tab);
    const text = Array.from(view.querySelectorAll(".ide-code"))
      .map((el) => el.textContent)
      .join("\n");

    if (!text.trim()) {
      setFeedback(copyFeedback, "Hier steht noch kein Code zum Kopieren.", false);
      return;
    }

    const ok = await inZwischenablage(text);
    setFeedback(
      copyFeedback,
      ok ? `Code von ${state.tab} liegt in der Zwischenablage.` : "Kopieren hat nicht geklappt - markiere den Code und nutze Strg + C.",
      ok
    );
  });

  /* --- Hinweis-Modal --- */

  let letzterFokus = null;

  const oeffneHinweis = () => {
    letzterFokus = document.activeElement;
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    hintClose.focus();
  };

  const schliesseHinweis = () => {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    if (letzterFokus && typeof letzterFokus.focus === "function") letzterFokus.focus();
    letzterFokus = null;
  };

  hintButton.addEventListener("click", oeffneHinweis);
  hintClose.addEventListener("click", schliesseHinweis);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) schliesseHinweis();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-visible")) schliesseHinweis();
  });

  /* --- Start --- */

  restore();
  zeigeReiter(state.tab);
  renderAll();
})();
