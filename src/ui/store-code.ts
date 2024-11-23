import { editor, stopCode, taskName } from "..";
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
            key = taskName + " | " + animalNames[Math.floor(Math.random()*animalNames.length)];
        }
    }
    storeRawCode(key, editor.getValue(), true);
    updateLocalBackup();
    console.log("📝💾 Code gespeichert: " + key);
}

function loadFromStore() {
    const key = storeSelector.value;
    if (key == "(neu)") return;
    editor.setValue(codeStore[key], 0);
    editor.moveCursorTo(0, 0);
    console.log("📝📂 Code geladen: " + key);
    stopCode(); // stop execution
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
        wenn siehtWand() dann
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

storeRawCode("Demo: 'zeig'",
`# Hallo Welt
Text name sei "Karol"
zeig "Hallo, " + name + "!"
`, false)

storeRawCode("Demo: 'aufheben & hinlegen'",
`# Aufheben & Hinlegen
// so legt man einen roten Block
k1.hinlegen()

// man kann genau einen BLock erklimmen
k1.schritt()

// man kann Blöcke verschiedener Farben legen
k1.hinlegen(blau)
k1.hinlegen(grün)
k1.hinlegen(gelb)
k1.hinlegen(rot)

// man kann die Farben auch als Text übergeben angeben (Achtung: gelb = "Y")
zeig blau, grün, rot, gelb

k1.hinlegen("B")
k1.hinlegen("G")
k1.hinlegen("Y")
k1.hinlegen("R")

// so hebt man Blöcke wieder auf
k1.aufheben()
k1.aufheben()
k1.aufheben()
k1.aufheben()
k1.aufheben()
k1.aufheben()
k1.aufheben()
k1.aufheben()

k1.schritt()
k1.linksDrehen()
k1.linksDrehen()
k1.aufheben()
`, false)

// retrieve backup, if there is one
retrieveLocalBackup();