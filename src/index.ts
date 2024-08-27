
import "./ui/panels";
import "./ui/robot_view";

import Parser from "./language/frontend/parser";
import { Program } from './language/frontend/ast';
import { declareWorld, World } from "./robot/world";
import { Environment, GlobalEnvironment, declareGlobalEnv } from "./language/runtime/environment";
import { evaluate } from "./language/runtime/interpreter";
import { clamp } from './robot/utils';
import { STD_PRELOAD, STD_WORLD, TASKS, DEFAULT_TASK, TEST_CODE, Task } from "./robot/tasks";
import { sleep } from './language/runtime/utils';

import * as ace from "ace-builds";
import "ace-builds/esm-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import './assets/ace/mode-rkscript.js';
import './assets/ace/theme-rklight.js';

import { LexerError, ParserError } from './errors';
import { showStructogram } from './ui/structograms';
import { addRobotButtons } from './ui/objectigrams';

// Global variables
let dt = 50; // ms to sleep between function calls
export let isRunning = false;
export let queueInterrupt = false;
let taskName: string

let preloadCode = "\n";
let code = TEST_CODE;
let worldSpec = STD_WORLD;

const parse = new Parser();
let env: GlobalEnvironment;
export let world: World
let program: Program;

// Console log replacement
console.log = (function (old_log, log: HTMLElement) { 
    return function () {
        log.innerText += Array.prototype.slice.call(arguments).join(' ') + "\n";
        old_log.apply(console, arguments);
        log.scrollTop = log.scrollHeight;
    };
}(console.log.bind(console), document.querySelector('#console-log')!));

// Fetch HTML elements
// Fetch task check
export const taskCheck = document.getElementById("task-check")!;

// Fetch object overlay & object bar
export const objOverlay = document.getElementById("object-overlay")!;
const objBar = document.getElementById("object-bar")!;

// Setup editors
const preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: preloadCode,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/RKLight",
    readOnly: true,
});

const editor = ace.edit("code-editor", {
    minLines: 30,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/RKLight",
    useWorker: false,
    value: code,
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
});

// Fetch code error bar
const codeError = document.getElementById("code-error")!;
const errorMarkers: number[] = [];

// Setup command line
const cmdLine = document.getElementById("cmd-line") as HTMLInputElement;
const cmdLineStack: string[] = [];
let cmdLineStackPointer = -1;

// Fetch task description
const taskDescription = document.getElementById("task-description") as HTMLElement;

// Fill task selector
const taskSelector = document.getElementById("load-task") as HTMLSelectElement;
for (const [key, task] of Object.entries(TASKS)) {
    const newOption = document.createElement("option");
    newOption.value = key;
    newOption.innerHTML = `${key}: "${task.title}"`;
    newOption.selected = key == DEFAULT_TASK;
    taskSelector.append(newOption);
}

// Setup slider
const waitSlider = document.getElementById("wait-slider") as HTMLInputElement;
waitSlider.oninput = () => {
    const value = parseInt(waitSlider.value);
    dt = value;
    document.getElementById("wait-time")!.innerHTML = value.toString() + " ms";
}

// automatic parse timeout to avoid lagging the editor
let autoUpdateIDE = setTimeout(updateIDE, 500);
editor.on("change", async (e: ace.Ace.Delta) => {
    clearTimeout(autoUpdateIDE);
    autoUpdateIDE = setTimeout(updateIDE, 500);
});

// Cmd line input
cmdLine.onkeydown = fetchCmd
document.getElementById("cmd-run")!.onclick = runCmd

// Start / stop buttons
document.getElementById("code-start")!.onclick = startCode
document.getElementById("code-stop")!.onclick = stopCode

// Download / load buttons
document.getElementById("save-code")!.onclick = downloadCode
document.getElementById("load-code")!.onclick = () => fileInput.click();

// Downloading
function downloadCode() {
    const code = editor.getValue();
    const filename = taskName + ".rk"
    downloadTextFile(filename, code);
}

function downloadTextFile(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();

    document.body.removeChild(element);
}

const fileInput: HTMLInputElement = document.getElementById("load-file")! as HTMLInputElement;
fileInput.onchange = loadFile

// Uploading code
function loadFile(evt: InputEvent) {
    const target: HTMLInputElement = evt.target as HTMLInputElement;
    if (!target) return;
    const files = target.files;
    if (!files) return;
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event: any) {
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
                editor.setValue(event.target.result);
                break;
            case "csv":
                console.log(`Lade Welt '${justName}'`);
                loadRawTask("AX.X", {
                    title: `${justName}`,
                    description: "Nutze 'welt.fertig()' und die Feldlampen, um die Aufgabe zu lösen!",
                    preload: "\n",
                    world: event.target.result,
                } satisfies Task)
                taskSelector.selectedIndex = 0;
                break;
            case "json":
                console.log(`Lade Aufgabe aus '${justName}'`);
                try {
                    const newTask: Task = JSON.parse(event.target.result) satisfies Task;
                    loadRawTask("AX.X", newTask);
                } catch {
                    console.log(`Die Aufgabe konnte nicht geladen werden.`);
                    console.log(`Überprüfe das Dateienformat!`);
                }
                break;
            default:
                console.log("Dieses Dateienformat ist nicht unterstützt!");
        }
    }
    reader.readAsText(file);
    fileInput.value = "";
  }

// Load new task
taskSelector.onchange = (e: Event) => {
    console.log();
    console.log("🤔 Lade neue Aufgabe: " + taskSelector.value);
    loadTask(taskSelector.value);
};

// Setting error bar
function setErrorBar(msg: string, color: string) {
    codeError.style.backgroundColor = color;
    codeError.innerHTML = msg;
}

// Updating IDE
async function updateIDE() {
    // remove error markers
    for (const em of errorMarkers) {
        editor.session.removeMarker(em);
    }

    // reset error bar
    setErrorBar("✔️ kein Fehler gefunden", "lightgreen");

    const code = editor.getValue();
    if (!code) return;
    try {
        program = parse.produceAST(code);
        showStructogram(program);
    } catch (e) {
        let errorMarker = "error-marker";
        
        if (e instanceof LexerError) {
            errorMarker = "lexer-error-marker";
        } else if (e instanceof ParserError) {
            errorMarker = "error-marker"
        }

        setErrorBar(`❌ ${e.message} (Zeile ${e.lineIndex})`, "lightcoral");
        const markerId = editor.session.addMarker(new ace.Range(e.lineIndex, 0, e.lineIndex, 10), errorMarker, 'fullLine');
        errorMarkers.push(markerId);
    }
}

// Loading tasks
function isTaskkey(key: string): key is keyof typeof TASKS {
    return key in TASKS; // TASKS was not extended in any way and is a simple record
}

function loadRawTask(key: string, task: Task) {
    preloadCode = task.preload;
    worldSpec = task.world;
    taskName = `${key} ${task.title}`

    taskDescription.innerHTML = `
    <p><b>🤔 ${key}: "${task.title}"</b></p>
    <p>${task.description}</p>`;

    preloadEditor.setValue(preloadCode);
    resetEnv();
    world.loadWorldLog();
}

function loadTask(key: string) {
    if (!isTaskkey(key)) {
        preloadCode = STD_PRELOAD;
        worldSpec = STD_PRELOAD;
        return;
    }
    loadRawTask(key, TASKS[key]);
}

async function resetEnv(stage = 0) {
    env = declareGlobalEnv();
    // create new world and register it in the global environment
    world = new World(worldSpec, stage);
    declareWorld(world, "welt", env);
    world.declareAllRobots(env);
    addRobotButtons(objBar, objOverlay, world);
    // run preload so it works in the cmd
    await runCode(preloadCode, false);
};

async function runCmd() {
    const cmdCode = cmdLine.value;
    cmdLine.value = "";
    if (!cmdCode) return;

    if (cmdLineStack[cmdLineStack.length - 1] != cmdCode) { 
        cmdLineStack.push(cmdCode);
        cmdLineStackPointer = cmdLineStack.length;
    }
    if (cmdLineStack.length > 30) cmdLineStack.shift()
    cmdLineStackPointer = cmdLineStack.length;

    console.log("↩ Anweisung ausgeführt!");
    console.log(">>", cmdCode);
    await runCode(cmdCode, true);
};

async function interrupt() {
    queueInterrupt = true;
    await sleep(dt); // wait long enough for execution loop to exit
    if (queueInterrupt) queueInterrupt = false;
}

// Start code button
async function startCode() {
    await interrupt();

    const code = editor.getValue();
    if (!code) return;

    for (let i = 0; i < world.getStageCount(); i++) {
        await resetEnv(i);
        if (i > 0) {
            console.log();
            world.loadWorldLog();
        }
        console.log();
        console.log("▷ Code wird ausgeführt!");
        
        editor.setReadOnly(true);
        await runCode(code, true);
        await sleep(1000);
        editor.setReadOnly(false);

        if (!world.isGoalReached()) {
            console.log(`❌ Du hast die Teilaufgabe ${i+1} NICHT erfüllt!`);
            return;
        };
        console.log(`✔️ Du hast die Teilaufgabe ${i+1} erfüllt!`);
    }
    console.log("🏅 Du hast alle Teilaufgaben erfüllt!");
    return;
};

// Stop code via button
async function stopCode() {
    // if (!isRunning) return;
    await interrupt();
    await resetEnv();
}

// Get past commands via keyboard
function fetchCmd(e: KeyboardEvent) {
    if (e.key == "ArrowUp") {
        if (cmdLineStackPointer == -1) return;
        cmdLineStackPointer = clamp(cmdLineStackPointer - 1, 0, cmdLineStackPointer);
        cmdLine.value = cmdLineStack[cmdLineStackPointer];
    } else if (e.key == "ArrowDown") {
        if (cmdLineStack.length == 0) return;
        cmdLineStackPointer = clamp(cmdLineStackPointer + 1, cmdLineStackPointer, cmdLineStack.length - 1);
        cmdLine.value = cmdLineStack[cmdLineStackPointer];
    } else if (e.key == "Enter") {
        runCmd();
    }
}

// Run ANY code
async function runCode(code: string, stepped: boolean) {
    isRunning = true;
    try {
        program = parse.produceAST(code);
        let stepper = evaluate(program, env);
        while (true) {
            const next = stepper.next();
            if (next.done) break;

            if (queueInterrupt) {
                console.log("▢ Ausführung abgebrochen!");
                queueInterrupt = false;
                break;
            }

            if (stepped) {
                let markerId = editor.session.addMarker(new ace.Range(next.value, 0, next.value, 10), 'exec-marker', 'fullLine');
        	    await sleep(dt);
                editor.session.removeMarker(markerId);
            }
        }
    } catch (runtimeError) {
        console.log("⚠️ " + runtimeError.message);
        console.error(runtimeError.stack);
    }
    isRunning = false;
};

/**
 * Start app
 */
loadTask(DEFAULT_TASK);