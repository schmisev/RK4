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
      // Place your code here
      storeCode();
    }
}

document.getElementById("store-code")!.onclick = storeCode
document.getElementById("delete-from-store")!.onclick = deleteCode

const storeSelector = document.getElementById("store-data")! as HTMLSelectElement;
storeSelector.onchange = loadFromStore;

function storeRawCode(key: string) {
    if (!(key in codeStore))
        storeSelector.appendChild(createOption(key, key, false, true));
    codeStore[key] = editor.getValue();
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
    storeRawCode(key);
    console.log("📝💾 Code gespeichert: " + key);
}

function loadFromStore() {
    const key = storeSelector.value;
    if (key == "(neu)") return;
    editor.setValue(codeStore[key], 0);
    console.log("📝📂 Code geladen: " + key);
}