import { runtime as ENV } from "..";
import { animalNames } from "../assets/misc/animal-names";
import { createOption } from "../utils";

let codeStore: Record<string, string> = {
};

function updateLocalBackup() {
    localStorage.setItem("code-store", JSON.stringify(codeStore));
}

function retrieveLocalBackup() {
    let value = localStorage.getItem("code-store");
    if (value == null) {
        updateLocalBackup();
        return
    }
    let backupCodeStore = JSON.parse(value) as Record<string, string>;
    for (const [k, v] of Object.entries(backupCodeStore)) {
        storeRawCode(k, v, false);
    }
}

// enable saving 
document.getElementById("code-editor")!.onkeydown = (e) => {
    if (e.ctrlKey && e.key === 's') {
        // Prevent the Save dialog to open
        e.preventDefault();
        storeCode();
    }
    if (e.ctrlKey && e.key === 'Enter') {
        ENV.startCode();
    }
}

document.getElementById("store-code")!.onclick = () => {
    storeCode();
    setQueryFromCode();
}
document.getElementById("delete-from-store")!.onclick = deleteCode

const storeSelector = document.getElementById("store-data")! as HTMLSelectElement;
storeSelector.onchange = () => {
    loadFromStore();
    setQueryFromCode();
}

function storeRawCode(key: string, code: string, select: boolean) {
    if (!(key in codeStore))
        storeSelector.appendChild(createOption(key, key, false, select));
    codeStore[key] = code;
}

function deleteCode() {
    let key = storeSelector.value
    if (key == "(neu)") return;
    if (key in codeStore) {
        delete codeStore[key];
        for (var i=0; i<storeSelector.length; i++) {
            if (storeSelector.options[i].value == key)
                storeSelector.remove(i);
        }
        storeSelector.value = "(neu)";
    }
    updateLocalBackup();
    console.log("📝🗑️ Code gelöscht: " + key);
}

function isLegalKey(userKey: string | null) {
    if (userKey == null) return false;
    if (userKey.length == 0) return false;
    for (const char of userKey) {
        if (["\n", "\r", "\t"].includes(char)) return false;
        if (char != " ") return true;
    }
    return false;
}

function storeCode() {
    let key = storeSelector.value
    if (key == "(neu)") {
        const userKey = prompt("Gib einen Namen für dein Skript an!");
        if (isLegalKey(userKey)) {
            key = userKey!;
        } else {
            console.log(`📝🚧 Skriptname abgelehnt: '${userKey}'`);
            key = ENV.taskName + " | " + animalNames[Math.floor(Math.random()*animalNames.length)];
        }
    }
    storeRawCode(key, ENV.editor.getValue(), true);
    updateLocalBackup();
    console.log("📝💾 Code gespeichert: " + key);
}

function loadFromStore() {
    const key = storeSelector.value;
    if (key == "(neu)") return;
    ENV.editor.setValue(codeStore[key], 0);
    ENV.editor.moveCursorTo(0, 0);
    console.log("📝📂 Code geladen: " + key);
    ENV.stopCode(); // stop execution
}

export async function setCodeFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const codeName = urlParams.get('load');
    if (codeName && codeName in codeStore) {
        storeSelector.value = codeName;
        loadFromStore();
    } else {
        urlParams.delete('load');
        history.replaceState(null, "", document.location.pathname + "?" + urlParams.toString());
    }
}

export async function setQueryFromCode() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('load', storeSelector.value);
    history.pushState(null, "", document.location.pathname + "?" + urlParams.toString());
}

// insert some Demo Code
storeRawCode("Hilfsmethoden",
`Methode umdrehen() für Roboter
    linksDrehen()
    linksDrehen()
ende

Methode stapeln(Zahl n) für Roboter
    wiederhole n mal
        hinlegen()
    ende
ende

Methode räumen(Zahl n) für Roboter
    wiederhole n mal
        aufheben()
    ende
ende

Methode gehen(Zahl n) für Roboter
    wiederhole n mal
        schritt()
    ende
ende
`, false)

storeRawCode("Tutorial: Der Roboter", `// Steuerung des Roboters
k1.schritt() // Roboter k1 macht einen Schritt vorwärts.

k1.linksDrehen() // Roboter k1 dreht sich um 90° nach links.
k1.rechtsDrehen() // ... dreht sich um 90° nacht rechts.
k1.hinlegen() // ... legt einen Block.

k1.hinlegen(blau) // Manche Methoden nehmen optionale Parameter, wie hier die Ziegelfarbe
k1.markeSetzen(grün) // Roboter k1 setzt eine grüne Marke unter sich.
k1.markeEntfernen() // ... löscht die Marke unter sich.

zeig k1.siehtWand() // Gibt wahr zurück, wenn k1 vor einer Wand steht.
zeig k1.siehtAbgrund() // Gibt wahr zurück, wenn k1 vor dem Abgrund steht.
zeig k1.siehtZiegel(gelb) // Gibt wahr zurück, wenn der oberste Ziegel im Stapel vor k1 gelb ist.
// Ohne Parameter ist die Ziegelfarbe egal.

zeig k1.istAufMarke(rot) // Gibt wahr zurück, wenn die Marke unter k1 rot ist.
// Auch hier ist der Parameter optional.

zeig k1.x() // Gibt die x-Koordinate von k1 zurück.
zeig k1.y() // Gibt die y-Koordinate zurück.
zeig k1.richtung() // Gibt die Richtung als Text zurück: "N", "S", "W" oder "O".

// im Debugbereich können weitere Robotermethoden eingesehen werden
`, false);

storeRawCode("Tutorial: Die Welt", `// Die aktuelle Aufgabe
zeig welt.fertig() // Fragt ab, ob die aktuelle Teilaufgabe abgeschlossen wurde
zeig welt.teilaufgabe() // Gibt an, in welcher Teilaufgabe wir uns befinden
`, false);

storeRawCode("Tutorial: Wiederholungen", `// Wiederholungen
// k1 geht 3 Schritte vorwärts
wiederhole 3 mal
    k1.schritt()
ende

// k1 dreht sich solange, bis er nach Norden schaut
// Mehr zu = und anderen Vergleichsoperatoren später
wiederhole solange nicht (k1.richtung() == "N")
    k1.linksDrehen()
ende

// k1 läuft unendlich lang im Kreis
wiederhole immer
    k1.schritt()
    k1.rechtsDrehen()
ende
`, false);

storeRawCode("Tutorial: Bedingte Anweisungen", `// Hier zeigen wir das Wort "Geschafft" in der Konsole an,
// wenn die aktuelle Teilaufgabe gelöst wurde.
wenn welt.fertig() dann
    zeig "Geschafft!"
ende

// Hier mit sonst.
wenn k1.siehtWand() dann
    zeig "Oh Nein, eine Wand"
    k1.linksDrehen()
sonst
    k1.schritt()
ende

// Auch 'sonst wenn' ist legal...
// ... wird aber als geschachtelte bedingte Anweisung interpretiert.
wenn k1.x() > 0 dann
    k1.schritt()
sonst wenn k1.y() > 0 dann
    k1.linksDrehen()
    k1.schritt()
sonst
    zeig "Nicht am Rand!"
ende
`, false)

storeRawCode("Tutorial: Bedingungen", `// Bedingungen
zeig wahr oder falsch       // In der Konsole: >> wahr
zeig wahr und falsch        // >> falsch
zeig nicht falsch           // >> wahr
zeig nicht k1.siehtWand()   // >> falsch, wenn k1 die Wand sieht
zeig 7 > 8                  // >> falsch
zeig 7 < 100                // >> wahr
zeig 17 == 17               // >> wahr
`, false);

storeRawCode("Tutorial: Variablen und Funktionen", `// Variablen
Zahl a ist 7 // Deklariert eine Zahl namens x und setzt ihren Wert auf 7
Text t ist "Hallo"
Wahrheitswert w ist wahr

zeig a, t, w

// Funktionen
Funktion hallo(Text name)
    zeig "Hallo", name
ende

hallo("Karol") // >> Gibt 'Hallo Karol' aus
`, false)

storeRawCode("Tutorial: Klassen", `// Klassen
Klasse Vektor
    Zahl x ist 0
    Zahl y ist 0

    Methode setzeXY(Zahl sx, Zahl sy)
        x ist sx
        y ist sy 
    ende

    Methode plus(Objekt v)
        x ist x + v.x
        y ist y + v.y
    ende

    Methode zeigmich()
        zeig x, y
    ende
ende

Objekt v1 sei neuer Vektor
v1.x ist 4
v1.y ist 6

Objekt v2 sei neuer Vektor
v2.setzeXY(3, -9)

v1.plus(v2)

v1.zeigmich() // >> 7 -3

// Mit Konstruktor
Klasse Foo(Zahl n)
    Zahl bar ist n
    Zahl zweiBar ist 2 * n
ende

Objekt f sei neues Foo(4)
zeig f.bar // >> 4
zeig f.zweiBar // >> 8
`, false);

storeRawCode("Tutorial: Externe Methoden", `// Methoden
Methode umdrehen() für Roboter
    linksDrehen() // Da wir 'im' Roboter sind, kann man hier 'k1.' weglassen
    linksDrehen()
ende

Methode gehen(Zahl n) für Roboter
    wiederhole n mal
        wenn siehtWand() dann
            zurück falsch // wir haben bei einer Wand gestoppt
        ende
        schritt()
    ende
    zurück wahr // wir wurden nicht behindert
ende

Methode feldAufräumen() für Roboter
    wiederhole solange siehtZiegel()
        aufheben()
    ende
ende

k1.umdrehen() // Funktioniert!
`, false);

storeRawCode("Tutorial: Kommazahlen", `// Kommazahlen
zeig "Ganze Zahl:"
Zahl N sei zufallszahl(-100, 100)
zeig "* N =", N
zeig "* als Kommazahl", zuKommazahl(N)
zeig "* |N| =", betrag(N)

zeig ""
zeig "Kommazahl:"
Kommazahl z sei zufallsbereich(-100, 100)
zeig "* z =", z
zeig "* als ganze Zahl", zuZahl(z)
zeig "* gestutzt", stutzen(z)
zeig "* aufgerundet", aufrunden(z)
zeig "* abgerundet", abrunden(z)
zeig "* sin(z) =", sin(z)
zeig "* cos(z) =", cos(z)
zeig "* tan(z) =", tan(z)
zeig "* |z| =", betrag(z)
`, false);

// retrieve backup, if there is one
retrieveLocalBackup();