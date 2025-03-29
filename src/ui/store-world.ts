import { WorldEditEnv } from "../app";
import { generateProxiesFromString } from "../robot/world-proxies";
import { DEFAULT_TASK, STD_TASKS, type Task } from "../robot/tasks";
import { createOption, destructureKey } from "../utils";

let ENV: WorldEditEnv;
export function setup(env: typeof ENV) {
    ENV = env;
}

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
    let backupTaskStore = JSON.parse(value) as Record<string, Task>;
    for (const [k, v] of Object.entries(backupTaskStore)) {
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
    if (key === "(neu)") return;
    
    task = taskStore[key];
    
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