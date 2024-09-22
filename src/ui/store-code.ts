import { editor, taskName } from "..";
import { animalNames } from "../assets/misc/animal-names";
import { createOption } from "../utils";

let codeStore: Record<string, string> = {
};

// enable saving 
document.getElementById("code-editor")!.onkeydown = (e) => {
    if (e.ctrlKey && e.key === 's') {
        // Prevent the Save dialog to open
        e.preventDefault();
        storeCode();
    }
}

document.getElementById("store-code")!.onclick = storeCode
document.getElementById("delete-from-store")!.onclick = deleteCode

const storeSelector = document.getElementById("store-data")! as HTMLSelectElement;
storeSelector.onchange = loadFromStore;

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
    console.log("📝🗑️ Code gelöscht: " + key);
}

function storeCode() {
    let key = storeSelector.value
    if (key == "(neu)") {
        key = taskName + " | " + animalNames[Math.floor(Math.random()*animalNames.length)];
    }
    storeRawCode(key, editor.getValue(), true);
    console.log("📝💾 Code gespeichert: " + key);
}

function loadFromStore() {
    const key = storeSelector.value;
    if (key == "(neu)") return;
    editor.setValue(codeStore[key], 0);
    console.log("📝📂 Code geladen: " + key);
}

// insert some Demo Code
storeRawCode("Demo: Alles mögliche",
`// Großer Testcode
Zahl zeilenZähler ist 0

# Wiederholungen
wiederhole 4 mal
    Zahl n ist 0
    wiederhole solange n < 10
        wiederhole solange nicht k1.siehtWand()
            k1.hinlegen()
            k1.schritt()
        ende
        k1.linksDrehen()
        n ist n + 1
    ende
ende

Methode zeileAufräumen() für Roboter
    # Methodendefinition
    wiederhole solange nicht siehtWand()
        aufheben()
        schritt()
    ende

    zeilenZähler ist zeilenZähler + 1
ende

Funktion turmAbräumen(Objekt r)
    # Funktionsdefinition
    wiederhole solange r.siehtZiegel()
        r.zeileAufräumen()
        r.linksDrehen()
    ende
ende

turmAbräumen(k1)

wenn welt.fertig() dann
    zeig zeilenZähler, "Zeilen abgeräumt!"
ende
`, false);

storeRawCode("Demo: Datentypen",
`Zahl a ist 5
Zahl b ist -7

zeig a + b
zeig a * b
zeig b : a

Text t1 ist "Hallo"
Text t2 ist "Welt"

zeig t1 + ", " + t2

Wahrheitswert w1 ist wahr
Wahrheitswert w2 ist falsch

zeig w1 und w2
zeig w1 oder w2
zeig nicht w1
zeig a > b
zeig nicht (a < b)
zeig nicht w1 und (a * b > a)`, false)

storeRawCode("Demo: Klassen und Methoden",
`Klasse Fibonacciator(Zahl _a, Zahl _b)
    Zahl a ist _a
    Zahl b ist _b
    
    Methode nächsteZahl()
        Zahl tmp ist b
        b ist a + b
        a ist tmp
        zurück a
    ende
    
    Methode letzteZahl()
        Zahl tmp ist a
        a ist b - a
        b ist tmp
        zurück b
    ende
ende

Methode zurücksetzen(Zahl _a, Zahl _b) für Fibonacciator
    a ist _a
    b ist _b
ende

Objekt fib als Fibonacciator(3, 6)

wiederhole 10 mal
    zeig fib.nächsteZahl()
ende

fib.zurücksetzen(0, 1)

wiederhole 10 mal
    zeig fib.nächsteZahl()
ende
wiederhole 20 mal
    zeig fib.letzteZahl()
ende`, false)

storeRawCode("Demo: Unterscheide",
`Zahl x ist 1
unterscheide x + 1
    falls 1
        zeig "0"
        weiter
    falls 2
        zeig "1"
        weiter
    falls 3
        zeig "2"
    falls 4
        zeig "3"
    falls 5
        abbrechen
        zeig "4"
    sonst
        zeig "?"
ende
`, false)

storeRawCode("Debug: Wiederhole",
`wiederhole 1 mal
ende
wiederhole 2 mal
    zeig "stmt1"
    zeig "stmt2"
ende
wiederhole 3 mal
    zeig "stmt1"
    abbrechen
    zeig "stmt2"
ende
wiederhole 4 mal
    zeig "stmt1"
    weiter
    zeig "stmt2"
ende
wiederhole solange 1
ende
wiederhole solange 2
    zeig "stmt1"
    zeig "stmt2"
ende
wiederhole solange 3
    zeig "stmt1"
    abbrechen
    zeig "stmt2"
ende
wiederhole solange 4
    zeig "stmt1"
    weiter
    zeig "stmt2"
ende
wiederhole immer
ende
wiederhole immer
    zeig "stmt1"
    zeig "stmt2"
ende
wiederhole immer
    zeig "stmt1"
    abbrechen
    zeig "stmt2"
ende
wiederhole immer
    zeig "stmt1"
    weiter
    zeig "stmt2"
ende
wiederhole 5 mal
    wenn 1 dann
        zeig "stmt1"
        abbrechen
        zeig "stmt2"
    ende
ende
wiederhole 6 mal
    wenn 1 dann
        zeig "stmt1"
        abbrechen
        zeig "stmt2"
    sonst
        zeig "stmt3"
        weiter
        zeig "stmt4"
    ende
ende
wiederhole 7 mal
    wenn 1 dann
        zeig "stmt1"
        abbrechen
        zeig "stmt2"
    sonst
        zeig "stmt3"
        abbrechen
        zeig "stmt4"
    ende
ende
wiederhole 8 mal
    wiederhole 9 mal
        zeig "stmt1"
        abbrechen
        zeig "stmt2" 
    ende
ende
wiederhole 9 mal
    wiederhole 10 mal
        wenn 1 dann
            abbrechen
        ende
    ende
ende
`, false)

storeRawCode("Debug: Strukturen",
`wenn a dann
    wenn b dann
        wenn c dann
            "hallo"
        ende
    ende
ende

wenn a dann
    hallo
sonst wenn b dann
    tschüss
sonst wenn c dann
    ciao
ende

wiederhole immer
    wiederhole solange nicht k1.siehtWand()
        wiederhole solange k1.siehtZiegel()
            k1.aufheben()
        ende
        k1.schritt()
    ende
    k1.linksDrehen()
    k1.linksDrehen()
    wiederhole solange nicht k1.siehtWand()
        wiederhole solange k1.siehtZiegel()
            k1.aufheben()
        ende
        k1.schritt()
    ende
    k1.rechtsDrehen()
    wenn k1.siehtWand() dann
        abbrechen
    ende
    wiederhole solange k1.siehtZiegel()
        k1.aufheben()
    ende
    k1.schritt()
    k1.rechtsDrehen()
ende

Methode schrittZurück() für Roboter
    linksDrehen()
    linksDrehen()
    schritt()
    rechtsDrehen()
    rechtsDrehen()
ende

Methode probieren() für Roboter
    wenn nicht siehtWand() dann
        hinlegen()
        schritt()
        probieren()
    ende
ende

k1.probieren()
`, false)