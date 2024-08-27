import { loadTask } from "..";
import { TASKS, DEFAULT_TASK } from "../robot/tasks";

// Fill task selector
export const taskSelector = document.getElementById("load-task") as HTMLSelectElement;
let currentAuthor = "unbekannt";
for (const [key, task] of Object.entries(TASKS)) {
    if (currentAuthor != task.author) {
        currentAuthor = task.author;
        const sepOption = document.createElement("option");
        sepOption.disabled = true;
        sepOption.value = key;
        sepOption.innerHTML = `👤 Autor: ${task.author}`;
        sepOption.selected = key == DEFAULT_TASK;
        taskSelector.append(sepOption);
    }

    const newOption = document.createElement("option");
    newOption.value = key;
    newOption.innerHTML = `&nbsp;&nbsp;&nbsp;🗺️ ${key}: "${task.title}"`;
    newOption.selected = key == DEFAULT_TASK;
    taskSelector.append(newOption);
}
// Load new task
taskSelector.onchange = (e: Event) => {
    console.log();
    console.log("🤔 Lade neue Aufgabe: " + taskSelector.value);
    loadTask(taskSelector.value);
};
