import { editEnv as ENV, generateProxiesFromString } from "../editor";
import { DEFAULT_TASK, STD_TASKS, STD_WORLD, type Task } from "../robot/tasks";
import { createOption, destructureKey } from "../utils";

let taskStore: Record<string, Task> = {
}

function updateLocalBackup() {
    localStorage.setItem("task-store", JSON.stringify(taskStore));
}

function retrieveLocalBackup() {
    let value = localStorage.getItem("task-store");
    if (value == null) {
        updateLocalBackup();
        return
    }
    let backupCodeStore = JSON.parse(value) as Record<string, Task>;
    for (const [k, v] of Object.entries(backupCodeStore)) {
        storeRawTask(k, v, false);
    }
}

document.getElementById("store-task")!.onclick = storeTask;
document.getElementById("delete-from-store")!.onclick = deleteTask;

const storeSelector = document.getElementById("store-data")! as HTMLSelectElement;
storeSelector.onchange = loadFromStore;

function storeRawTask(key: string, task: Task, select: boolean) {
    if (!(key in taskStore))
        storeSelector.appendChild(createOption(key, key, false, select));
    taskStore[key] = task;
}

function storeTask() {
    let key = ENV.generateFileName();
    storeRawTask(key, ENV.generateTask(), true);
    updateLocalBackup();
    console.log("📝💾 Aufgabe gespeichert: " + key);
}

function deleteTask() {
    let key = storeSelector.value
    if (key == "(neu)") return;
    if (key in taskStore) {
        delete taskStore[key];
        for (var i=0; i<storeSelector.length; i++) {
            if (storeSelector.options[i].value == key)
                storeSelector.remove(i);
        }
        storeSelector.value = "(neu)";
    }
    updateLocalBackup();
    console.log("📝🗑️ Aufgabe gelöscht: " + key);
}

function loadFromStore() {
    let key = storeSelector.value;
    let task: Task;
    if (key == "(neu)") {
        storeRawTask(DEFAULT_TASK, STD_TASKS[DEFAULT_TASK], true);
        key = DEFAULT_TASK; // reassign key
        task = STD_TASKS[DEFAULT_TASK];
    } else {
        task = taskStore[key];
    }
    
    if (typeof task.world !== "string") return;

    let worldStr = task.world;
    let newProxies = generateProxiesFromString(worldStr);

    let { author, category, name } = destructureKey(key);

    ENV.proxies = newProxies;
    ENV.description.setValue(task.description);
    ENV.author.value = author;
    ENV.category.value = category;
    ENV.name.value = name;
    ENV.idx = 0; // always start on the first world index

    ENV.reloadFully();
    console.log("📝📂 Aufgabe geladen: " + key);
}

storeRawTask("sms_Basics_1", {
    title: "Start",
    description:
        "Lege einen Ziegel an die markierte Stelle! Nutze dafür k1.hinlegen()",
    world: "x;4;1;6;\nE:_;_:_;_:_;_:r",
    preload: "// Nichts vorgegeben",
}, false);