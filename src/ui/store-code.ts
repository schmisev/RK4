import { assert } from "console";
import { editor, taskName } from "..";
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
    updateLocalBackup();
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
`Zahl zeilenZähler ist 0

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
    wiederhole immer
        wenn nicht siehtWand() dann
            abbrechen
        ende
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

storeRawCode("Demo: Hallo Welt!",
`# Gibt "Karol sagt: 'Hallo, Welt!'" zurück.
Text name ist "Karol"
zeig name, "sagt: 'Hallo Welt!'"
`, false);

storeRawCode("Demo: Viele Hallos",
`# Viele Grüße!
Zahl n ist 0
wiederhole solange n < 10
    zeig n, "Mal gegrüßt..."
    n ist n+1
ende

wiederhole n mal
    zeig "Hallo, User " + zuText(zufallszahl()) + "."
ende

Liste namen ist ["Anna", "Benno", "Carl", "Dora", "Emil", "Frieda"]
wiederhole für i von 0 bis länge(namen)
    zeig "Hallo, " + namen[i] + "!"
ende
`, false);

retrieveLocalBackup();