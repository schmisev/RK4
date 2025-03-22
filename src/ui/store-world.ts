import { runtime as ENV } from "../editor";
import { type Task } from "../robot/tasks";
import { createOption } from "../utils";

let taskStore: Record<string, Task> = {
}

function updateLocalBackup() {
    localStorage.setItem("code-store", JSON.stringify(taskStore));
}

function retrieveLocalBackup() {
    let value = localStorage.getItem("code-store");
    if (value == null) {
        updateLocalBackup();
        return
    }
    let backupCodeStore = JSON.parse(value) as Record<string, Task>;
    for (const [k, v] of Object.entries(backupCodeStore)) {
        storeRawTask(k, v, false);
    }
}