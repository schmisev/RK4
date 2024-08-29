// UI imports
import "./ui/panels";
import "./ui/robot-view";
import "./ui/console-log";
import "./ui/save-load-files";
import "./ui/task-selector";
import "./ui/store-code";
import { showStructogram } from './ui/structograms';
import { addRobotButtons } from './ui/objectigrams';

// language imports
import Parser from "./language/frontend/parser";
import { Program } from './language/frontend/ast';
import { GlobalEnvironment, declareGlobalEnv } from "./language/runtime/environment";
import { evaluate, SteppedEval } from "./language/runtime/interpreter";
import { sleep } from "./utils";

// Robot imports
import { declareWorld, World } from "./robot/world";
import { STD_PRELOAD, STD_WORLD, STD_TASKS, DEFAULT_TASK, TEST_CODE, Task, destructureKey, loadExtTasks } from "./robot/tasks";
import { clamp } from './utils';

// ACE imports
import * as ace from "ace-builds";
import "ace-builds/esm-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import './assets/ace/mode-rkscript.js';
import './assets/ace/theme-rklight.js';

// General errors 
// TODO: Split up?
import { LexerError, ParserError } from './errors';
import { RuntimeVal } from "./language/runtime/values";
import { updateTaskSelector } from "./ui/task-selector";

// App state variables
let dt = 50; // ms to sleep between function calls
let dtIDE = 100;
export let isRunning = false;
export let queueInterrupt = false;
export let liveTasks = STD_TASKS;
export let taskName: string

let preloadCode = "\n";
let code = TEST_CODE;
let worldSpec = STD_WORLD;
const errorMarkers: number[] = [];

const parse = new Parser();
let env: GlobalEnvironment;
export let world: World
let program: Program;

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

export const editor = ace.edit("code-editor", {
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

// Setup command line
const cmdLine = document.getElementById("cmd-line") as HTMLInputElement;
const cmdLineStack: string[] = [];
let cmdLineStackPointer = -1;

// Fetch task description
const taskDescription = document.getElementById("task-description") as HTMLElement;

// Setup slider
const waitSlider = document.getElementById("wait-slider") as HTMLInputElement;
waitSlider.oninput = () => {
    const value = parseInt(waitSlider.value);
    dt = value;
    document.getElementById("wait-time")!.innerHTML = value.toString() + " ms";
}

// automatic parse timeout to avoid lagging the editor
let autoUpdateIDE = setTimeout(updateIDE, dtIDE);
editor.on("change", async (e: ace.Ace.Delta) => {
    clearTimeout(autoUpdateIDE);
    autoUpdateIDE = setTimeout(updateIDE, dtIDE);
});

// Cmd line input
cmdLine.onkeydown = fetchCmd
document.getElementById("cmd-run")!.onclick = runCmd

// Start / stop buttons
document.getElementById("code-start")!.onclick = startCode
document.getElementById("code-stop")!.onclick = stopCode

// Setting error bar
function setErrorBar(msg: string, errorTypeCss: string) {
    codeError.classList.toggle("none", false);
    codeError.classList.toggle(errorTypeCss, true);
    codeError.innerHTML = msg;
}

// Handling of live errors
function resetErrorMarkers() {
    // remove error markers
    for (const em of errorMarkers) {
        editor.session.removeMarker(em);
    }
}

function setErrorMarker(msg: string, lineIndex: number, errorTypeCss: string) {
    setErrorBar(msg, errorTypeCss);
    const markerId = editor.session.addMarker(new ace.Range(lineIndex, 0, lineIndex, 10), "error-marker " + errorTypeCss, 'fullLine');
    errorMarkers.push(markerId);
}

// Updating IDE
async function updateIDE() {
    resetErrorMarkers();

    // reset error bar
    setErrorBar("✔️ kein Fehler gefunden", "none");

    const code = editor.getValue();
    if (!code) return;
    try {
        program = parse.produceAST(code);
        showStructogram(program);
    } catch (e) {
        let errorCssClass = "none";
        
        if (e instanceof LexerError) {
            errorCssClass = "lexer";
        } else if (e instanceof ParserError) {
            errorCssClass = "parser"
        }

        setErrorMarker(`❌ ${e.message} (Zeile ${e.lineIndex+1})`, e.lineIndex, errorCssClass);
    }
}

// Loading tasks
function isTaskkey(key: string): key is keyof typeof liveTasks {
    return key in liveTasks; // TASKS was not extended in any way and is a simple record
}

export function loadRawTask(key: string, task: Task) {
    const splitKey = destructureKey(key);

    preloadCode = task.preload;
    worldSpec = task.world;
    taskName = `${key}`

    taskDescription.innerHTML = `
    <p><b>🤔 ${splitKey.name}: "${task.title}"</b></p>
    <p>${task.description}</p>`;

    preloadEditor.setValue(preloadCode, 0);

    resetEnv();
    world.loadWorldLog();
}

export function loadTask(key: string) {
    if (!isTaskkey(key)) {
        preloadCode = STD_PRELOAD;
        worldSpec = STD_WORLD;
        console.log("Standardwelt geladen...")
        return;
    }
    loadRawTask(key, liveTasks[key]);
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

        console.log("▢ Ausführung beendet!");

        if (!world.isGoalReached()) {
            console.log(`❌ Du hast die Teilaufgabe ${i+1} NICHT erfüllt!`);
            editor.setReadOnly(false);
            return;
        }
        console.log(`✔️ Du hast die Teilaufgabe ${i+1} erfüllt!`);
        
        await sleep(1000);
        editor.setReadOnly(false);
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
    let lastLineIndex = -1;
    try {
        program = parse.produceAST(code);
        let stepper = evaluate(program, env);
        while (true) {
            const next = stepper.next();
            if (next.done) break;

            if (queueInterrupt) {
                console.log("▽ Ausführung wird abgebrochen!");
                queueInterrupt = false;
                break;
            }

            if (stepped) {
                lastLineIndex = next.value
                let markerId = editor.session.addMarker(new ace.Range(lastLineIndex, 0, lastLineIndex, 10), 'exec-marker', 'fullLine');
        	    await sleep(dt);
                editor.session.removeMarker(markerId);
            }
        }
    } catch (runtimeError) {
        console.log("⚠️ " + runtimeError.message);
        console.error(runtimeError.stack);
        setErrorMarker(`⚠️ ${runtimeError.message} (Zeile: ${lastLineIndex + 1})`, lastLineIndex, "runtime");
    }
    isRunning = false;
};

/**
 * Start app
 */
updateTaskSelector(); // get std tasks
loadExtTasks().then(updateTaskSelector); // get github tasks
loadTask(DEFAULT_TASK);