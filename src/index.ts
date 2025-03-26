// UI imports
import { setup as setupRobotView } from "./ui/robot-view";
import { setStructogramVisibility, showStructogram, unloadStructogram } from './ui/structograms';
import { addRobotButtons } from './ui/objectigrams';
import "./ui/flowcharts";
// UI imports *with side-effects*
import "./ui/panels";
import "./ui/store-code";
import "./ui/task-selector";
import "./ui/save-load-files";
import "./ui/console-log";
import { retrieveLocalTasks, updateTaskSelector } from "./ui/task-selector";

// language imports
import Parser from "./language/frontend/parser";
import { Program } from './language/frontend/ast';
import { GlobalEnvironment, declareGlobalEnv } from "./language/runtime/environment";
import { evaluate } from "./language/runtime/interpreter";
import { easeInQuint, getKeys, getVals, lerp, sleep } from "./utils";

// Robot imports
import { declareWorld, World } from "./robot/world";
import { STD_PRELOAD, STD_WORLD, STD_TASKS, DEFAULT_TASK, STD_CODE, Task, WorldSource } from "./robot/tasks";
import { destructureKey } from "./ui/task-selector";
import { downloadExtTask } from "./ui/task-selector";
import { clamp } from './utils';

// ACE imports
import * as ace from "ace-builds";
// import "ace-builds/esm-resolver";
import * as langTools from "ace-builds/src-noconflict/ext-language_tools";
// const aceLangTools = require("ace-builds/src-noconflict/ext-language_tools");
import './assets/ace/mode-rkscript.js';
import './assets/ace/theme-rklight.js';

// General errors
import { DebugError, LexerError, ParserError, RuntimeError } from './errors';
import { setFlowchartVisibility, showFlowchart, unloadFlowchart } from "./ui/flowcharts";
import { connectDebugToggle, connectSimpleToggle, Toggle } from "./ui/toggle-buttons";
import { CodePosition, ILLEGAL_CODE_POS, KEYWORDS } from "./language/frontend/lexer";
import { ENV } from "./spec";
import { AppRuntime } from "./app";

// Global variables
let maxDt = 250;
let minDt = 0.5;
let dt = 50; // ms to sleep between function calls
let dtHighlight = 10; // ms under which no line by line highlighting is done
let dtIDE = 300; // ms to wait for IDE update
let frameLagSum = 0; // running sum of frame lag

let rt: AppRuntime;
export { rt as runtime };

// manual mode
function listenForExitManualMode() {
    return new Promise((resolve) => {
        document.addEventListener("exit-manual-mode", resolve, {once: true});
        /*
        document.getElementById("code-next")!.addEventListener("click", resolve, {once: true});
        document.getElementById("code-start")!.addEventListener("click", resolve, {once: true});
        document.getElementById("code-stop")!.addEventListener("click", resolve, {once: true});
        document.getElementById("store-data")!.addEventListener("change", resolve, {once: true});
        document.getElementById("load-task")!.addEventListener("change", resolve, {once: true});
        */
    });
}

function exitManualMode() {
    if (!rt.manualMode) return;
    document.dispatchEvent(new Event("exit-manual-mode"));
    rt.manualMode = false;
}

// interrupts
// interrupts for run code
async function interrupt() {
    if (!rt.isRunning) return;
    rt.queueInterrupt = true;
    while (rt.isRunning) {
        await sleep(10); // wait long enough for execution loop to exit
    }
    rt.queueInterrupt = false;
}

// Code state
let preloadCode = STD_PRELOAD;
let code = STD_CODE;
let worldSpec: WorldSource = STD_WORLD;
const errorMarkers: number[] = [];

// Parser and environment
const parser = new Parser();

// HTML elements
// Fetch task check
const taskCheck = document.getElementById("task-check")!;
const playState = document.getElementById("play-state-symbol")!;

// Fetch object overlay & object bar
const objOverlay = document.getElementById("object-overlay")!;
const objBar = document.getElementById("object-bar")!;

// Setup editors
const preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: preloadCode,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/RKLight",
    readOnly: true,
    showPrintMargin: false,
});

// deactivate text completer
function createCompleter(wordList: string[], metaText: string) {
    return {
        list: wordList,
        updateList: function (wordList: Array<string> | Set<string>) {
            this.list = [...wordList];
        },
        getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
            callback(null, this.list.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    meta: metaText,
                };
            }));
        }
    }
}

function createFieldCompleter(classFieldMap: Record<string, Set<string>>) {
    return {
        map: classFieldMap,
        updateMap: function (map: Record<string, Set<string>>) {
            this.map = map;
        },
        getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
            for (const [k, v] of Object.entries(this.map)) {
                callback(null, [...v].map(function(word) {
                    return {
                        caption: word,
                        value: word,
                        meta: k + ".___"
                    }
                }))
            }
        }
    }
}

// UNUSED
const liveCompleter = createCompleter([], "Lokal")

// dynamic completers
const functionCompleter = createCompleter([], "Funktion");
const classCompleter = createCompleter([], "Klassen");
const methodCompleter = createFieldCompleter({});

// static completers
const keyWordCompleter = createCompleter(getKeys(KEYWORDS), "Schlüsselwort");
const globalConstCompleter = createCompleter(getVals(ENV.global.const), "Globale Konstante")
const globalFnCompleter = createCompleter(getVals(ENV.global.fn), "Globale Funktion")
const stdClassCompleter = createCompleter([ENV.robot.cls, ENV.world.cls], "Klassen");
const robotCompleter = createCompleter(Object.values(ENV.robot.mth), "Roboter.__");
const worldCompleter = createCompleter(Object.values(ENV.world.mth), "Welt.__")

const allCompleters = [
    robotCompleter, 
    worldCompleter, 
    functionCompleter, 
    methodCompleter, 
    classCompleter, 
    stdClassCompleter, 
    globalConstCompleter, 
    globalFnCompleter, 
    keyWordCompleter,
    liveCompleter
];

langTools.setCompleters(allCompleters)
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


// Setup code zoom
const zoomStages = [14, 20, 26, 32, 38]
editor.setFontSize(zoomStages[0])
const zoomEditor = document.getElementById("zoom-editor")!;
const zoomEditorDecrease = document.getElementById("zoom-editor-decrease")!;
function adjustFontSize(step: number) {
    let fontSize = parseInt(editor.getFontSize());
    let atIdx = zoomStages.indexOf(fontSize);
    if (atIdx == -1) {
        editor.setFontSize(zoomStages[0])
        return
    } else {
        editor.setFontSize(zoomStages[clamp(atIdx + step, 0, zoomStages.length - 1)])
    }
    return
}
zoomEditor.onclick = () => adjustFontSize(1);
zoomEditorDecrease.onclick = () => adjustFontSize(-1);

// Fetch code error bar
const codeError = document.getElementById("code-error")!;

// Setup command line
const cmdLine = document.getElementById("cmd-line") as HTMLInputElement;
const cmdLineStack: string[] = [];
let cmdLineStackPointer = -1;
cmdLine.onkeydown = fetchCmd
document.getElementById("cmd-run")!.onclick = runCmd

// Fetch task description
const taskDescription = document.getElementById("task-description") as HTMLElement;

// Setup slider
const waitSlider = document.getElementById("wait-slider") as HTMLInputElement;
function updateSlider() {
    const val = parseInt(waitSlider.value);
    let hz = lerp((1000 / maxDt), (1000 / minDt), easeInQuint(val / 100));

    dt = 1000 / hz;
    const hzText = hz.toFixed(1) + " Hz";
    document.getElementById("wait-time")!.innerHTML =  hzText + " | " + dt.toFixed(1) + " ms pro Anweisung";
}

// waitSlider.min = (1000 / maxDt).toString();
// waitSlider.max = (1000 / minDt).toString();
// waitSlider.value = (1000 / dt).toString();
waitSlider.oninput = updateSlider
updateSlider();

// automatic parse timeout to avoid lagging the editor
let autoUpdateIDE = setTimeout(updateIDE, dtIDE);
editor.on("change", async (e: any) => {
    clearTimeout(autoUpdateIDE);
    autoUpdateIDE = setTimeout(updateIDE, dtIDE);
    setDebugTimer(true);
});

// Start / stop buttons
document.getElementById("code-start")!.onclick = startCode
document.getElementById("code-stop")!.onclick = stopCode
document.getElementById("code-next")!.onclick = nextCode

// Setup tabs
const consoleTab = document.getElementById("console-title")!;
const preloadTab = document.getElementById("preload-title")!;

consoleTab.onclick = () => {
    document.getElementById("console-log")!.style.visibility = "visible";
    document.getElementById("preload-editor")!.style.visibility = "hidden";

    consoleTab.classList.toggle("active", true);
    preloadTab.classList.toggle("active", false);
}

preloadTab.onclick = () => {
    document.getElementById("console-log")!.style.visibility = "hidden";
    document.getElementById("preload-editor")!.style.visibility = "visible";

    consoleTab.classList.toggle("active", false);
    preloadTab.classList.toggle("active", true);
}

// App logic
// Setting up debug timer
const debugTimer = document.getElementById("debug-timer")!;
function setDebugTimer(waiting = false) {
    if (waiting)
        debugTimer.innerHTML = "⌛";
    else
        debugTimer.innerHTML = "✅";
}

// Setting error bar
function setErrorBar(msg: string, errorTypeCss: string) {
    codeError.classList.toggle("none", false);
    codeError.classList.toggle("runtime", false);
    codeError.classList.toggle("lexer", false);
    codeError.classList.toggle("parser", false);
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

function setErrorMarker(msg: string, codePos: CodePosition, errorTypeCss: string) {
    const lineCount = editor.session.getLength();
    const lineLength = editor.session.getLine(codePos.lineIndex).length;

    let lineIndex = codePos.lineIndex;
    let lineIndexEnd = codePos.lineIndexEnd;
    let startPos = codePos.startPos;
    let type: "fullLine" | "text" = "text";

    if (lineCount - 1 < codePos.lineIndex) {
        // outside of line range
        lineIndex = lineCount - 1;
        lineIndexEnd = lineCount - 1;
        startPos = 0;
        type = "fullLine";
    } else if (lineLength <= codePos.startPos) {
        // beyond line length
        startPos = 0;
        type = "fullLine";
    }
    
    const markerId = editor.session.addMarker(new ace.Range(
        lineIndex, 
        startPos, 
        lineIndexEnd, 
        codePos.endPos
    ), "error-marker " + errorTypeCss, type);
    errorMarkers.push(markerId);

    setErrorBar(msg + ` (Zeile: ${codePos.lineIndex + 1}:${codePos.startPos} -> ${codePos.lineIndexEnd + 1}:${codePos.endPos})`, errorTypeCss);
}

// Updating IDE
export async function updateIDE() {
    resetErrorMarkers();

    // reset error bar
    setErrorBar("✔️ kein Fehler gefunden", "none");

    const code = editor.getValue();
    //if (!code) return;
    try {
        parser.produceAST(preloadCode, false, true);
        const program = rt.program = parser.produceAST(code, true, false);
        
        methodCompleter.updateMap(parser.collectedFields);
        classCompleter.updateList(parser.collectedClasses);
        functionCompleter.updateList(parser.collectedFunctions);

        liveCompleter.updateList(parser.collectedIdents);

        setFlowchartVisibility(toggleFlowchart.active);
        setStructogramVisibility(!toggleFlowchart.active);

        if (toggleFlowchart.active) {
            showFlowchart(program);
            unloadStructogram();
        } else {
            showStructogram(program);
            unloadFlowchart();
        }

        // set debug timer
        setDebugTimer(false);
    } catch (e) {
        let errorCssClass = "none";
        let codePos: CodePosition = ILLEGAL_CODE_POS();
        let message = "";
        
        if (e instanceof LexerError) {
            errorCssClass = "lexer";
            codePos = e.lineIndex;
            message = e.message;
        } else if (e instanceof ParserError) {
            errorCssClass = "parser";
            codePos = e.lineIndex;
            message = e.message;
        }

        // not runtime errors should appear

        if (errorCssClass !== "none") {
            setErrorMarker(`❌ ${message}`, codePos, errorCssClass);
        }

        //throw e; // temporary
    }
}

// loading tasks
function loadRawTask(key: string, task: Task, ignoreTitleInKey = false) {
    const splitKey = destructureKey(key, ignoreTitleInKey);

    preloadCode = task.preload;
    worldSpec = task.world;
    rt.taskName = `${key}`

    taskDescription.innerHTML = `
    <p><b>🤔 ${splitKey.name}: "${task.title}"</b></p>
    <p>${task.description}</p>`;

    preloadEditor.setValue(preloadCode, 0);
    preloadEditor.moveCursorTo(0, 0);

    resetEnv();
    rt.world.loadWorldLog();
}

async function loadTask(key: string) {
    await interrupt()

    if (key in rt.liveTasks) {
        loadRawTask(key, rt.liveTasks[key], false);
        return;
    }
    if (key in rt.extTasks) {
        await downloadExtTask(key, rt.extTasks[key]);
        loadRawTask(key, rt.liveTasks[key], true);
        return;
    }
}

// Resetting the environment
async function resetEnv(stage = 0) {
    const env = rt.env = declareGlobalEnv();
    // create new world and register it in the global environment
    const world = rt.world = new World(worldSpec, stage);
    declareWorld(world, "welt", env);
    world.declareAllRobots(env);
    addRobotButtons(objBar, objOverlay, world);
    // run preload so it works in the cmd
    await runCode(preloadCode, false, false, false);
}

// Run cmds
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

    if (rt.manualMode || rt.isRunning || rt.queueInterrupt) return;
    
    console.log(">>", cmdCode);
    await runCode(cmdCode, true, false, false);
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

// Start code via button
async function startCode() {
    if (rt.queueInterrupt) return; // exit during interrupt to avoid piling up executions
    if (rt.manualMode) {
        exitManualMode();
        return; // exit in manual mode, so the execution can continue
    }

    resetErrorMarkers();
    
    await interrupt();

    const code = editor.getValue();
    if (!code) return;

    setErrorBar("✔️ kein Fehler gefunden", "none");

    editor.setReadOnly(true);
    for (let i = 0; i < rt.world.getStageCount(); i++) {
        await resetEnv(i);
        if (i > 0) {
            console.log();
            rt.world.loadWorldLog();
        }
        console.log("\n▷ Code wird ausgeführt!");
        
        if (await runCode(code, true, true, true)) {
            editor.setReadOnly(false);
            return; // return immediatly if codeRun was interrupted
        }
        // await interrupt(); // for safety
        console.log("▢ Ausführung beendet!");

        await sleep(250); // wait a bit until goal has updated
        if (rt.isRunning) {
            editor.setReadOnly(false);
            return;
        }

        if (!rt.world.isGoalReached()) {
            console.log(`❌ Du hast die Teilaufgabe ${i+1} NICHT erfüllt!`);
            editor.setReadOnly(false);
            return;
        } else {
            console.log(`✔️ Du hast die Teilaufgabe ${i+1} erfüllt!`);
        }
        
        await sleep(250);
        if (rt.isRunning) {
            editor.setReadOnly(false);
            return;
        }
    }
    console.log("🏅 Du hast alle Teilaufgaben erfüllt!");
    editor.setReadOnly(false);
    return;
}

async function nextCode() {
    exitManualMode();

    if (!rt.isRunning) {
        startCode();
    }

    rt.manualMode = true; // always reenable to manual mode
}

// Stop code via button
export async function stopCode() {
    exitManualMode();
    resetErrorMarkers();
    await interrupt();
    await resetEnv();
}

// Run ANY code
async function runCode(code: string, stepped: boolean, showHighlighting: boolean, trackPos: boolean): Promise<boolean> {
    let skippedSleep = 0;
    let lastCodePos: CodePosition = ILLEGAL_CODE_POS();
    let markerIds: number[] = [];

    const cleanupMarkers = () => {
        for (const id of markerIds) {
            editor.session.removeMarker(id);
        }
    }

    try {
        const program = rt.program = parser.produceAST(code, trackPos, true);
        const env = rt.env;
        let stepper = evaluate(program, env);

        rt.isRunning = true;
        // await sleep(dt);
        frameLagSum = 0;
        while (true) {
            const next = stepper.next();
            if (next.done) break;

            if (rt.queueInterrupt) {
                console.log("▽ Ausführung wird abgebrochen!");
                rt.isRunning = false;
                cleanupMarkers();
                return true; // returns true if interrupted
            }

            if (stepped) {
                // always push marker!
                if (showHighlighting && dt > dtHighlight) {
                    markerIds.push(
                        editor.session.addMarker(
                            new ace.Range(
                                lastCodePos.lineIndex,
                                lastCodePos.startPos,
                                lastCodePos.lineIndexEnd,
                                lastCodePos.endPos
                            ), 'exec-marker', 'text'
                        )
                    )
                }

                lastCodePos = next.value;

                skippedSleep += dt; // assume sleep is skipped
                if (skippedSleep > frameLagSum) {
                    // console.timeEnd()
                    // console.time()
                    // console.log(skippedSleep, frameLagSum);
                    
                    const dtRest = skippedSleep - frameLagSum;
                    skippedSleep = 0;
                    frameLagSum = -dtRest;
                    await sleep(dtRest);
                }
            }

            /* there has got to be a better way */
            if (rt.manualMode) {
                await listenForExitManualMode();
            }

            // clean old markers
            cleanupMarkers();
        }
    } catch (e) {
        // clean runtime markers
        cleanupMarkers();

        if (e instanceof DebugError) {
            const errorCodePos = e.lineIndex.lineIndex >= 0 ? e.lineIndex : lastCodePos
            console.log("⚠️ " + e.message);
            console.error(e.stack);
            if (showHighlighting)
                setErrorMarker(`⚠️ ${e.message}`, errorCodePos, "runtime");
        } else if (e instanceof Error) {
            // throw e;
            console.log("⚠️ " + e.message);
            console.error(e.stack);
            if (showHighlighting)
                setErrorMarker(`⚠️ ${e.message}`, lastCodePos, "runtime");
        } else {
            // do nothing? IGNORE!
        }
    }
    
    rt.isRunning = false;
    return false;
}

// setup toggle buttons
export let toggleDefs = connectDebugToggle("debug-show-defs", false, updateIDE);
export let toggleLabels = connectDebugToggle("debug-show-labels", true, updateIDE);
export let toggleFunctions = connectDebugToggle("debug-show-functions", true, updateIDE);
export let toggleMethods = connectDebugToggle("debug-show-methods", true, updateIDE);
export let toggleFlowchart = connectDebugToggle("debug-show-flowchart", false, updateIDE);

export let toggleThoughts = connectSimpleToggle("thought-toggle", true);
export let toggleAnimation = connectSimpleToggle("animation-toggle", true);

// Start app
const dummyTask = STD_TASKS[DEFAULT_TASK];
rt = {
    isRunning: false,
    queueInterrupt: false,
    manualMode: false,
    dt,
    maxDt,
    playState,
    env: declareGlobalEnv(),
    world: new World(dummyTask.world, 0),

    taskCheck,
    objOverlay,

    program: parser.produceAST("", false, false),
    stopCode,

    editor,
    taskName: DEFAULT_TASK,
    liveTasks: STD_TASKS,
    extTasks: {},
    loadTask,
    loadRawTask,

    updateLagSum(dt: number) {
        frameLagSum += dt;
    },
    resetLagSum() {
        frameLagSum = 0;
    },

    toggleAnimation,
    toggleThoughts
};


const screenshotRobot = document.getElementById("robot-screenshot")!;
screenshotRobot.onclick = () => {
    robotView.saveCanvas(rt.taskName + "_" + (new Date()).toLocaleString() + ".png");
}

let robotView = setupRobotView(rt);

const setup = [
    retrieveLocalTasks().then(updateTaskSelector), // get std tasks
    loadTask(DEFAULT_TASK).catch(e => console.error(e)).then(updateIDE),
];

async function finishSetup() {
    for(let task of setup) {
        try { await task } catch(e) {}
    }
    document.getElementById("loading-overlay")?.classList.remove("loading");
}
finishSetup();
