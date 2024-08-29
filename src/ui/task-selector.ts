import { liveTasks, loadTask } from "..";
import { STD_TASKS, DEFAULT_TASK, destructureKey } from "../robot/tasks";

// Create new Option
function createOption(key: string, innerHTML: string, disabled = false): HTMLOptionElement {
    const newOption = document.createElement("option");
    newOption.disabled = disabled;
    newOption.value = key;
    newOption.innerHTML = innerHTML;
    newOption.selected = key == DEFAULT_TASK;
    return newOption;
}

// Fill task selector
export const taskSelector = document.getElementById("load-task") as HTMLSelectElement;
let currentAuthor: string | undefined = "";
let currentCategory: string | undefined = "";

export function updateTaskSelector() {
    var i, L = taskSelector.options.length - 1;
    for(i = L; i >= 0; i--) {
        taskSelector.remove(i);
    }

    for (const [key, task] of Object.entries(liveTasks).sort(
        (a, b) => {
            const ka = destructureKey(a[0]).sortStr;
            const kb = destructureKey(b[0]).sortStr;

            if (ka < kb) return -1;
            if (ka > kb) return 1;

            return 0;
        }
    )) {
        const splitKey = destructureKey(key);

        if (currentAuthor != splitKey.author) {
            currentAuthor = splitKey.author;
            taskSelector.append(createOption("", `👤 ${currentAuthor}`, true));
        }

        if (currentCategory != splitKey.category) {
            currentCategory = splitKey.category;
            taskSelector.append(createOption("", `&nbsp;&nbsp;🗃️ ${currentCategory}`, true));
        }

        taskSelector.append(createOption(key, `&nbsp;&nbsp;&nbsp;&nbsp;🗺️ ${splitKey.name}: "${task.title}"`));
    }
}
// Load new task
taskSelector.onchange = (e: Event) => {
    console.log();
    console.log("🤔 Lade neue Aufgabe: " + taskSelector.value);
    loadTask(taskSelector.value);
};
