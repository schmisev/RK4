// UI imports
import type { WorldEditEnv, WorldViewEnv } from "./app";
import { DEFAULT_TASK, STD_TASKS, type Task } from "./robot/tasks";
import { World } from "./robot/world";
import { makeToggle } from "./ui/toggle-buttons";
import { generateProxiesFromString, type WorldProxy } from "./robot/world-proxies";

// side effect free UI components :)
import { setup as setupRobotView } from "./ui/robot-view";
import { setup as setupWorldStore } from "./ui/store-world";

// ACE imports
import * as ace from "ace-builds";
import "./assets/ace/mode-rkscript.js";
import "./assets/ace/theme-rklight.js";
import { deepCopy, downloadTextFile } from "./utils";
import { addRobotButtons } from "./ui/objectigrams";

const objOverlay = document.getElementById("object-overlay")!;
const objBar = document.getElementById("object-bar")!;
const playState = document.getElementById("play-state-symbol")!;
const taskCheck = document.getElementById("task-check")!;

const dummyTask = STD_TASKS[DEFAULT_TASK];
export let viewEnv: WorldViewEnv = {
    isRunning: false,
    dt: 10,
    maxDt: 10,
    manualMode: false,
    objOverlay,
    objBar,
    playState,
    queueInterrupt: false,
    taskCheck,
    world: new World(dummyTask.world, 0),
    updateLagSum(dt: number) {},
    resetLagSum() {},
    toggleAnimation: makeToggle(true),
    toggleThoughts: makeToggle(true),
    toggleOrtho: makeToggle(false)
};

// Setup editors
const descriptionEditor = ace.edit("task-description-editor", {
    minLines: 1,
    value: "Hier sollte eine Beschreibung stehen.",
    //readOnly: true,
    showPrintMargin: false,
});

const preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: "// kein vorgegebener Code",
    mode: "ace/mode/RKScript",
    theme: "ace/theme/RKLight",
    //readOnly: true,
    showPrintMargin: false,
});

export const stdWorldProxy: WorldProxy = {
    L: 3,
    W: 3,
    H: 5,
    fields: [
        ["S_", "_", "_"],
        ["_", "_", "_"],
        ["_", "_", "_"],
    ],
};

export let editEnv: WorldEditEnv = {
    idx: 0,
    author: document.getElementById("author-input")! as HTMLInputElement,
    category: document.getElementById("group-input")! as HTMLInputElement,
    name: document.getElementById("index-input")! as HTMLInputElement,
    title: document.getElementById("title-input")! as HTMLInputElement,
    description: descriptionEditor,
    preload: preloadEditor,
    descriptionPreview: document.getElementById(
        "task-description"
    )! as HTMLDivElement,
    titlePreview: document.getElementById("task-title")! as HTMLDivElement,
    paintInput: document.getElementById("paint-input")! as HTMLInputElement,
    codeError: document.getElementById("code-error")! as HTMLDivElement,
    indexView: document.getElementById("reset-zero-button")!,
    proxies: [
        deepCopy(stdWorldProxy)
    ],
    reloadWorld,
    reloadEditor,
    reloadMetaInfo,
    reloadFully,
    generateTask,
    generateFileName,
};

document.getElementById("next-index")!.onclick = () => {
    editEnv.idx = (editEnv.idx + 1) % editEnv.proxies.length;
    reloadWorld();
    reloadMetaInfo();
};
document.getElementById("prev-index")!.onclick = () => {
    editEnv.idx =
        (editEnv.idx + editEnv.proxies.length - 1) % editEnv.proxies.length;
    reloadWorld();
    reloadMetaInfo();
};
document.getElementById("reload-button")!.onclick = () => reloadWorld();
document.getElementById("reset-zero-button")!.onclick = () => {
    editEnv.idx = 0;
    reloadWorld();
    reloadMetaInfo();
};
document.getElementById("save-world")!.onclick = () => {
    downloadTextFile(
        generateFileName(".json"),
        JSON.stringify(generateTask(), null, 4)
    );
};
document.getElementById("load-world")!.onclick = () => {
    document.getElementById("load-file")!.click();
}
document.getElementById("load-file")!.onchange = (evt: Event) => {
    document.createElement("input")

    const target: HTMLInputElement = evt.target as HTMLInputElement;
    if (!target) return;
    const files = target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event: any) {
        const parts = file.name.split(".");
        const ext = parts.pop();
        if (!ext) return;
        const justName = parts.join();

        switch (ext.toLowerCase()) {
            case "csv":
                try {
                    editEnv.title.value = `${justName}`;
                    editEnv.description.setValue(
                        "Nutze 'welt.fertig()' und die Feldlampen, um die Aufgabe zu lösen!"
                    );
                    editEnv.preload.setValue("// Nichts vorgegeben");

                    editEnv.proxies.push(
                        ...generateProxiesFromString(
                            event.target.result as string
                        )
                    );
                } catch (e) {
                    console.error(e);
                }
                break;
            case "json":
                try {
                    const newTask: Task = JSON.parse(
                        event.target.result
                    ) satisfies Task;

                    editEnv.title.value = newTask.title;
                    editEnv.description.setValue(newTask.description);
                    editEnv.preload.setValue(newTask.preload);
                    editEnv.proxies = generateProxiesFromString(
                        newTask.world as string
                    );
                } catch (e) {
                    console.error(e);
                }
                break;
        }

        reloadEditor();
        reloadWorld(0);
        reloadMetaInfo();
    };
    reader.readAsText(file);
};

document.getElementById("robot-screenshot")!.onclick = () => {
    robotView.saveCanvas(generateFileName() + "_" + (new Date()).toLocaleString() + ".png");
}

document.getElementById("quick-robot")!.onclick = () => {
    editEnv.paintInput.value = "S_:_";
}

document.getElementById("quick-wall")!.onclick = () => {
    editEnv.paintInput.value = "#";
}

document.getElementById("quick-empty")!.onclick = () => {
    editEnv.paintInput.value = "_:_";
}

document.getElementById("quick-block")!.onclick = () => {
    editEnv.paintInput.value = "_:r";
}

document.getElementById("quick-marker")!.onclick = () => {
    editEnv.paintInput.value = "_:Y";
}

document.getElementById("link-to-editor")!.onclick = () => {
    let url = ".";
    let value = (document.getElementById("store-data") as HTMLSelectElement).value;
    if (value) {
        url += "#/" + value;
    }
    window.location.href = url;
}

editEnv.description.on("change", reloadMetaInfo);
editEnv.author.onchange = reloadMetaInfo;
editEnv.category.onchange = reloadMetaInfo;
editEnv.name.onchange = reloadMetaInfo;
editEnv.title.onchange = reloadMetaInfo;

function addColumns(worldProxy: WorldProxy, count: number) {
    for (let row of worldProxy.fields) {
        let extention = Array<string>(count).fill("_");
        row.push(...extention);
    }
}

function addRows(worldProxy: WorldProxy, count: number) {
    for (let i = 0; i < count; i++) {
        let newRow = Array(worldProxy.fields[0].length).fill(["_"]);
        worldProxy.fields.push(newRow);
    }
}

function renderWorldEdit(id: string) {
    let container = document.getElementById(id);
    if (!container) return;
    container.replaceChildren();

    for (let [proxyIndex, worldProxy] of editEnv.proxies.entries()) {
        let wrapper = document.createElement("div") as HTMLDivElement;
        wrapper.classList.add("world-wrapper");

        let editBar = document.createElement("div") as HTMLDivElement;
        editBar.classList.add("lc30", "wsr", "text", "edit-bar");
        wrapper.appendChild(editBar);

        for (let key of ["L", "W", "H"] as (keyof WorldProxy)[]) {
            let keyEdit = document.createElement("input");
            keyEdit.classList.add("key-edit");
            keyEdit.min = "1";
            keyEdit.step = "1";
            keyEdit.type = "number";
            keyEdit.defaultValue = key;
            keyEdit.value = worldProxy[key].toString();

            // dim editing
            keyEdit.onchange = (evt: Event) => {
                if (!keyEdit.value) keyEdit.value = "1"; // no value?
                let newValue = parseInt(keyEdit.value);
                if (newValue < 1 || !newValue) newValue = 1; // no sensible number?
                // we need to add some rows/columns
                // TODO: UGLY
                if (key === "L") {
                    if (newValue > worldProxy.fields[0].length) {
                        addColumns(
                            worldProxy,
                            newValue - worldProxy.fields[0].length
                        );
                    }
                } else if (key === "W") {
                    if (newValue > worldProxy.fields.length) {
                        addRows(
                            worldProxy,
                            newValue - worldProxy.fields.length
                        );
                    }
                }
                worldProxy[key] = newValue as any;
                editEnv.reloadEditor();
                editEnv.reloadWorld();
            };

            editBar.appendChild(keyEdit);
        }

        // delete world
        if (editEnv.proxies.length > 1) {
            let removeButton = document.createElement(
                "button"
            ) as HTMLButtonElement;
            removeButton.innerHTML = "❌";
            removeButton.classList.add("toggle-button");
            removeButton.onclick = () => {
                if (editEnv.proxies.length <= 1) return;
                if (proxyIndex < editEnv.idx) editEnv.idx -= 1;
                editEnv.proxies.splice(proxyIndex, 1);
                editEnv.reloadEditor();
                editEnv.reloadWorld();
            };
            editBar.appendChild(removeButton);
        }

        // add world below
        let addButton = document.createElement("button") as HTMLButtonElement;
        addButton.innerHTML = "➕";
        addButton.classList.add("toggle-button");
        addButton.onclick = () => {
            editEnv.proxies.splice(proxyIndex + 1, 0, deepCopy(stdWorldProxy));
            editEnv.reloadEditor();
            editEnv.reloadWorld(proxyIndex);
        };
        editBar.appendChild(addButton);

        // swap worlds
        if (proxyIndex < editEnv.proxies.length - 1) {
            let downButton = document.createElement(
                "button"
            ) as HTMLButtonElement;
            downButton.innerHTML = "⬇️";
            downButton.classList.add("toggle-button");
            downButton.onclick = () => {
                if (proxyIndex >= editEnv.proxies.length - 1) return;
                editEnv.proxies.splice(
                    proxyIndex,
                    0,
                    editEnv.proxies.splice(proxyIndex + 1, 1)[0]
                );
                editEnv.reloadEditor();
                editEnv.reloadWorld(proxyIndex + 1);
            };
            editBar.appendChild(downButton);
        }

        // swap worlds
        if (proxyIndex > 0) {
            let upButton = document.createElement(
                "button"
            ) as HTMLButtonElement;
            upButton.innerHTML = "⬆️";
            upButton.classList.add("toggle-button");
            upButton.onclick = () => {
                if (proxyIndex === 0) return;
                editEnv.proxies.splice(
                    proxyIndex,
                    0,
                    editEnv.proxies.splice(proxyIndex - 1, 1)[0]
                );
                editEnv.reloadEditor();
                editEnv.reloadWorld(proxyIndex - 1);
            };
            editBar.appendChild(upButton);
        }

        // flood fill
        let fillButton = document.createElement("button") as HTMLButtonElement;
        fillButton.innerHTML = "🪣";
        fillButton.classList.add("toggle-button");
        fillButton.classList.add("special");
        fillButton.title = "Fülle alle Zellen mit 🖌️-Wert!";
        fillButton.onclick = () => {
            for (let row of worldProxy.fields) {
                for (let i = 0; i < row.length; i++) {
                    row[i] = editEnv.paintInput.value;
                }
            }
            editEnv.reloadEditor();
            editEnv.reloadWorld(proxyIndex);
        };
        editBar.appendChild(fillButton);

        let w = worldProxy.fields;

        let worldTable = document.createElement("table") as HTMLTableElement;
        worldTable.classList.add("world-table");
        let headerRow = document.createElement("tr") as HTMLTableRowElement;
        headerRow.appendChild(document.createElement("th"));
        for (let i = 0; i < worldProxy.L; i++) {
            let headerCell = document.createElement("th") as HTMLTableCellElement;
            headerCell.classList.add("x-index-field");
            headerCell.innerHTML = `${i}`;
            headerRow.appendChild(headerCell);
        }
        worldTable.appendChild(headerRow);

        for (
            let j = 0;
            j < Math.min(worldProxy.W, worldProxy.fields.length);
            j++
        ) {
            let r = w[j];
            let row = document.createElement("tr") as HTMLTableRowElement;
            // index
            let leftHeader = document.createElement("th") as HTMLTableCellElement;
            leftHeader.innerHTML = `${j}`;
            leftHeader.classList.add("y-index-field");
            row.appendChild(leftHeader);
            // adding fields
            for (
                let i = 0;
                i < Math.min(worldProxy.L, worldProxy.fields[0].length);
                i++
            ) {
                let f = r[i];
                let field = document.createElement(
                    "td"
                ) as HTMLTableCellElement;
                field.classList.add("world-field");

                let fieldEdit = document.createElement(
                    "input"
                ) as HTMLInputElement;
                fieldEdit.value = f;

                const setFieldValue = () => {
                    fieldEdit.value = fieldEdit.value.replaceAll("x", "");
                    fieldEdit.value = fieldEdit.value.replaceAll(";", "");
                    r[i] = fieldEdit.value;
                    editEnv.reloadWorld();
                }

                // field editing
                fieldEdit.onchange = setFieldValue;
                fieldEdit.oncontextmenu = () => false;
                fieldEdit.onmousedown = (evt: MouseEvent) => {
                    if (evt.button === 2) {
                        evt.preventDefault();
                        fieldEdit.value = editEnv.paintInput.value;
                        setFieldValue();
                        editEnv.reloadWorld();
                    }
                };

                fieldEdit.onkeydown = (evt: KeyboardEvent) => {
                    let moveToCell: HTMLInputElement | null = null;
                    if (evt.ctrlKey) {
                        if (evt.key === "ArrowUp" && j >= 0) {
                            moveToCell = worldTable.rows[j].cells[i+1].children.item(0) as HTMLInputElement;
                        } else if (evt.key === "ArrowDown" && j < worldProxy.W-1) {
                            moveToCell = worldTable.rows[j+2].cells[i+1].children.item(0) as HTMLInputElement;
                        } else if (evt.key === "ArrowRight" && i < worldProxy.L-1) {
                            moveToCell = worldTable.rows[j+1].cells[i+2].children.item(0) as HTMLInputElement;
                        } else if (evt.key === "ArrowLeft" && i >= 0) {
                            moveToCell = worldTable.rows[j+1].cells[i].children.item(0) as HTMLInputElement;
                        }
                    }

                    if (moveToCell) {
                        evt.preventDefault();
                        moveToCell.focus();
                        moveToCell.select();
                    }
                }

                field.appendChild(fieldEdit);
                row.appendChild(field);
            }
            worldTable.appendChild(row);
        }
        wrapper.appendChild(worldTable);
        container.appendChild(wrapper);
    }
}

// reloading the world view
function reloadWorld(idx?: number): void {
    let genStr = "";
    for (let i = 0; i < editEnv.proxies.length; i++) {
        let world = editEnv.proxies[i];
        genStr += `x;${world.L};${world.W};${world.H};\n`;
        genStr += world.fields.map((r) => r.join(";")).join("\n");
    }
    if (idx !== undefined) editEnv.idx = idx;
    
    try {
        editEnv.codeError.classList.toggle("world", false);
        editEnv.codeError.innerHTML = `✔️ Kein Fehler bei der Welterzeugung`;

        let genWorld = new World(genStr, editEnv.idx);
        viewEnv.world = genWorld;
    } catch (e) {
        editEnv.codeError.classList.toggle("world", true);
        editEnv.codeError.innerHTML = `❌ ${e}`;
    }
    addRobotButtons(viewEnv.objBar, viewEnv.objOverlay, viewEnv.world);
}

// reloading the editor
function reloadEditor(): void {
    if (editEnv.idx < 0) editEnv.idx = 0;
    if (editEnv.idx >= editEnv.proxies.length)
        editEnv.idx = editEnv.proxies.length - 1;
    renderWorldEdit("world-edit-container");
}

// reloading meta info
function reloadMetaInfo(): void {
    editEnv.descriptionPreview.innerHTML = `
    <div class="title">🤔 ${editEnv.name.value}: "${editEnv.title.value}"</div>
    <div class="body">${editEnv.description.getValue()}</div>
    <div class="author">${editEnv.author.value} 👤</div>`;
    editEnv.titlePreview.innerText = generateFileName();
    editEnv.indexView.innerHTML = `${editEnv.idx}`;
}

// fully reloading
function reloadFully(): void {
    editEnv.reloadEditor();
    editEnv.reloadMetaInfo();
    editEnv.reloadWorld();
}

// generate task
function generateTask(): Task {
    let genStr = "";
    for (const world of editEnv.proxies) {
        genStr += `x;${world.L};${world.W};${world.H};\n`;
        genStr += world.fields.map((r) => r.join(";")).join("\n");
    }

    return {
        description: editEnv.description.getValue(),
        preload: editEnv.preload.getValue(),
        world: genStr,
        title: editEnv.title.value,
    };
}

// generate file name
function generateFileName(ext?: string): string {
    if (!ext) ext = "";
    return `${editEnv.author.value}_${editEnv.category.value}_${editEnv.name.value}${ext}`;
}

// start app
reloadEditor();
reloadWorld();
reloadMetaInfo();

let robotView = setupRobotView(viewEnv);
setupWorldStore(editEnv);

// remove loading screen
document.getElementById("loading-overlay")?.classList.remove("loading");
