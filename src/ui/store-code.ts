import { editor, taskName } from "..";
import { animalNames } from "../assets/misc/animal-names";
import { createOption } from "../utils";

let codeStore: Record<string, string> = {
};

document.getElementById("store-code")!.onclick = storeCode
// document.getElementById("new-code")!.onclick = loadFromStore

const storeSelector = document.getElementById("store-data")! as HTMLSelectElement;
storeSelector.onchange = loadFromStore;

function storeRawCode(key: string) {
    if (!(key in codeStore))
        storeSelector.appendChild(createOption(key, key, false, true));
    codeStore[key] = editor.getValue();
}

function storeCode() {
    let key = storeSelector.value
    if (key == "(neu)") {
        key = taskName + " | " + animalNames[Math.floor(Math.random()*animalNames.length)];
    }
    storeRawCode(key);
    console.log("📝💾 Code gespeichert: " + key);
}

function loadFromStore() {
    const key = storeSelector.value;
    if (key == "(neu)") return;
    editor.setValue(codeStore[key]);
    console.log("📝📂 Code geladen: " + key);
}