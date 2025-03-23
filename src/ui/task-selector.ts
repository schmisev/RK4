import { runtime as ENV } from "..";
import { type Task } from "../robot/tasks";
import { createOption, destructureKey } from "../utils";

// Fill task selector
export const taskSelector = document.getElementById("load-task") as HTMLSelectElement;
let currentAuthor: string | undefined = "";
let currentCategory: string | undefined = "";

export function updateTaskSelector() {
    var i, L = taskSelector.options.length - 1;
    for(i = L; i >= 0; i--) {
        taskSelector.remove(i);
    }

    // First, get the live tasks
    for (const [key, task] of Object.entries(ENV.liveTasks)) {
        const splitKey = destructureKey(key, false);

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

    // Then get the online tasks
    for (const [key, dlURL] of Object.entries(ENV.extTasks)) {
        const splitKey = destructureKey(key, true);

        if (currentAuthor != splitKey.author) {
            currentAuthor = splitKey.author;
            taskSelector.append(createOption("", `👤 ${currentAuthor}`, true));

            currentCategory = splitKey.category;
            taskSelector.append(createOption("", `&nbsp;&nbsp;🗃️ ${currentCategory}`, true));
        }

        if (currentCategory != splitKey.category) {
            currentCategory = splitKey.category;
            taskSelector.append(createOption("", `&nbsp;&nbsp;🗃️ ${currentCategory}`, true));
        }

        taskSelector.append(createOption(key, `&nbsp;&nbsp;&nbsp;&nbsp;⬇️ ${splitKey.name}: ${splitKey.title}`));
    }
}

// Load new task
taskSelector.onchange = (e: Event) => {
    console.log();
    console.log("🤔 Lade neue Aufgabe: " + taskSelector.value);
    ENV.loadTask(taskSelector.value);
};
/**
 * Get github files
 */
// Octokit.js
// https://github.com/octokit/core.js#readme


export async function downloadExtTask(key: string, dlURL: string) {
    try {
        const dlFile = await fetch(dlURL);
        const fileContent = await dlFile.text();
        const task: Task = JSON.parse(fileContent);
        ENV.liveTasks[key] = task;
    } catch {
        return; // who cares, if it fails it fails
    }
}

export function sortKeys(a: string, b: string) {
    const ka = destructureKey(a[0]).sortStr;
    const kb = destructureKey(b[0]).sortStr;

    if (ka < kb) return -1;
    if (ka > kb) return 1;

    return 0;
}

export { destructureKey };

