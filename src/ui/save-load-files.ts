import { runtime as ENV } from "..";
import { taskSelector } from "./task-selector";
import { type Task } from "../robot/tasks";
import { downloadTextFile } from "../utils";

// Download / load buttons
document.getElementById("save-code")!.onclick = downloadCode;
document.getElementById("load-code")!.onclick = () => fileInput.click();

// Downloading
function downloadCode() {
    const code = ENV.editor.getValue();
    const filename = ENV.taskName + ".rk";
    downloadTextFile(filename, code);
}

const fileInput: HTMLInputElement = document.getElementById("load-file")! as HTMLInputElement;
fileInput.onchange = loadFile;

// Uploading
function loadFile(evt: Event) {
    // stop code, just to be sure
    ENV.stopCode();

    const target: HTMLInputElement = evt.target as HTMLInputElement;
    if (!target) return;
    const files = target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event: any) {
        console.log();
        console.log(`Versuche '${file.name}' zu laden...`);
        //console.log(event.target.result);
        const parts = file.name.split(".");
        const ext = parts.pop();
        if (!ext) return;
        const justName = parts.join();

        switch (ext.toLowerCase()) {
            case "rk":
                console.log(`Lade Programm '${justName}'`);
                ENV.editor.setValue(event.target.result, 0);
                ENV.editor.moveCursorTo(0, 0);
                break;
            case "csv":
                console.log(`Lade Welt '${justName}'`);
                try {
                    ENV.loadRawTask("Hochgeladen", {
                        title: `${justName}`,
                        description: "Nutze 'welt.fertig()' und die Feldlampen, um die Aufgabe zu lösen!",
                        preload: "\n",
                        world: event.target.result,
                    } satisfies Task);
                    taskSelector.selectedIndex = 0;
                } catch {
                    console.log(`Die Welt konnte nicht geladen werden.`);
                    console.log(`Überprüfe das Dateienformat!`);
                }
                break;
            case "json":
                console.log(`Lade Aufgabe aus '${justName}'`);
                try {
                    const newTask: Task = JSON.parse(event.target.result) satisfies Task;
                    ENV.loadRawTask("Hochgeladen", newTask);
                } catch {
                    console.log(`Die Aufgabe konnte nicht geladen werden.`);
                    console.log(`Überprüfe das Dateienformat!`);
                }
                break;
            default:
                console.log("Dieses Dateienformat ist nicht unterstützt!");
        }
    };
    reader.readAsText(file);
    fileInput.value = "";
}
