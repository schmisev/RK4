// UI imports
import "./ui/panels";
import "./ui/robot-view";
import "./ui/console-log";
import "./ui/save-load-files";
import "./ui/task-selector";
import "./ui/store-code";
import { updateTaskSelector } from "./ui/task-selector";
import { setStructogramVisibility, showStructogram, unloadStructogram } from './ui/structograms';
import { addRobotButtons } from './ui/objectigrams';
import "./ui/flowcharts";

// language imports
import Parser from "./language/frontend/parser";
import { Program } from './language/frontend/ast';
import { GlobalEnvironment, declareGlobalEnv } from "./language/runtime/environment";
import { evaluate } from "./language/runtime/interpreter";
import { easeInCubic, sleep } from "./utils";

// Robot imports
import { declareWorld, World } from "./robot/world";
import { STD_PRELOAD, STD_WORLD, STD_TASKS, DEFAULT_TASK, STD_CODE, Task, WorldSource } from "./robot/tasks";
import { destructureKey } from "./ui/task-selector";
import { loadExtTasks, downloadExtTask } from "./ui/task-selector";
import { clamp } from './utils';

// ACE imports
import * as ace from "ace-builds";
// import "ace-builds/esm-resolver";
import { setCompleters, snippetCompleter, keyWordCompleter } from "ace-builds/src-noconflict/ext-language_tools";
// const aceLangTools = require("ace-builds/src-noconflict/ext-language_tools");
import './assets/ace/mode-rkscript.js';
import './assets/ace/theme-rklight.js';

// General errors 
import { DebugError, LexerError, ParserError } from './errors';
import { setFlowchartVisibility, showFlowchart, unloadFlowchart } from "./ui/flowcharts";
import { toggleFlowchart } from "./ui/toggle-buttons";
import { CodePosition, ILLEGAL_CODE_POS } from "./language/frontend/lexer";
import { ENV } from "./spec";

// Global variables
export let maxDt = 500;
export let dt = 50; // ms to sleep between function calls
let dtIDE = 200; // ms to wait for IDE update
let frameLagSum = 0; // running sum of frame lag
export let isRunning = false;
export let queueInterrupt = false;
export let liveTasks = STD_TASKS;
export let extTasks: Record<string, string> = {};
export let taskName: string

// Code state
let preloadCode = STD_PRELOAD;
let code = STD_CODE;
let worldSpec: WorldSource = STD_WORLD;
const errorMarkers: number[] = [];

// Parser and environment
const parser = new Parser();
let env: GlobalEnvironment;
export let world: World
let program: Program;

// HTML elements
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
    showPrintMargin: false,
});

// deactivate text completer
function createCompleter(wordList: string[], metaText: string) {
    return {
        getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
            callback(null, wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    meta: metaText,
                };
            }));
        }
    }
}

function updateLiveWordList(wordList: string[], newWordList: string[] | Set<string>) {
    while (wordList.length > 0) {
        wordList.shift();
    }
    for (const ident of newWordList) {
        wordList.push(ident)
    }
}

const liveWordList: string[] = []; // this will be updated live
const preloadWordList: string[] = []; // this will be updated on reset
const liveCompleter = createCompleter(liveWordList, "✒️ im Skript")
const preloadCompleter = createCompleter(preloadWordList, "📖 Bibliothek")
const robotCompleter = createCompleter(Object.values(ENV.robot.mth), "🤖 Roboter");
const worldCompleter = createCompleter(Object.values(ENV.world.mth), "🌍 Welt")
const allCompleters = [robotCompleter, worldCompleter, preloadCompleter, liveCompleter, snippetCompleter, keyWordCompleter];

setCompleters(allCompleters)
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
    const value = parseInt(waitSlider.value);
    dt = maxDt * easeInCubic((value / 10) / maxDt);
    const hz = 1000 / dt;
    const hzText = hz > 5000 ? ">5000 Hz" : hz.toFixed(0) + " Hz";
    document.getElementById("wait-time")!.innerHTML =  hzText + " | ~" + dt.toFixed(2) + " ms pro Anweisung";
}

waitSlider.max = (maxDt * 10).toString();
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
        program = parser.produceAST(code, true);
        updateLiveWordList(liveWordList, parser.collectedIdents);
        // liveWordList = Array(...parser.collectedIdents);

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
export function loadRawTask(key: string, task: Task, ignoreTitleInKey = false) {
    const splitKey = destructureKey(key, ignoreTitleInKey);

    preloadCode = task.preload;
    worldSpec = task.world;
    taskName = `${key}`

    taskDescription.innerHTML = `
    <p><b>🤔 ${splitKey.name}: "${task.title}"</b></p>
    <p>${task.description}</p>`;

    preloadEditor.setValue(preloadCode, 0);
    preloadEditor.moveCursorTo(0, 0);

    resetEnv();
    world.loadWorldLog();
}

export async function loadTask(key: string) {
    await interrupt()

    if (key in liveTasks) {
        loadRawTask(key, liveTasks[key], false);
        return;
    }
    if (key in extTasks) {
        await downloadExtTask(key, extTasks[key]);
        loadRawTask(key, liveTasks[key], true);
        return;
    }
}

// Resetting the environment
async function resetEnv(stage = 0) {
    env = declareGlobalEnv();
    // create new world and register it in the global environment
    world = new World(worldSpec, stage);
    declareWorld(world, "welt", env);
    world.declareAllRobots(env);
    addRobotButtons(objBar, objOverlay, world);
    // run preload so it works in the cmd
    await runCode(preloadCode, false, false, false);
    // update word list
    updateLiveWordList(preloadWordList, parser.collectedIdents);
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
    resetErrorMarkers();
    
    await interrupt();

    const code = editor.getValue();
    if (!code) return;

    setErrorBar("✔️ kein Fehler gefunden", "none");

    editor.setReadOnly(true);
    for (let i = 0; i < world.getStageCount(); i++) {
        await resetEnv(i);
        if (i > 0) {
            console.log();
            world.loadWorldLog();
        }
        console.log("\n▷ Code wird ausgeführt!");
        
        if (await runCode(code, true, true, true)) {
            editor.setReadOnly(false);
            return; // return immediatly if codeRun was interrupted
        }
        // await interrupt(); // for safety
        console.log("▢ Ausführung beendet!");

        await sleep(250); // wait a bit until goal has updated
        if (isRunning) {
            editor.setReadOnly(false);
            return;
        }

        if (!world.isGoalReached()) {
            console.log(`❌ Du hast die Teilaufgabe ${i+1} NICHT erfüllt!`);
            editor.setReadOnly(false);
            return;
        } else {
            console.log(`✔️ Du hast die Teilaufgabe ${i+1} erfüllt!`);
        }
        
        await sleep(250);
        if (isRunning) {
            editor.setReadOnly(false);
            return;
        }
    }
    console.log("🏅 Du hast alle Teilaufgaben erfüllt!");
    editor.setReadOnly(false);
    return;
}

// Stop code via button
export async function stopCode() {
    // if (!isRunning) return;
    resetErrorMarkers();
    await interrupt();
    await resetEnv();
}

// interrupts for run code
async function interrupt() {
    if (!isRunning) return;
    queueInterrupt = true;
    while (isRunning) {
        await sleep(10); // wait long enough for execution loop to exit
    }
    queueInterrupt = false;
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
        program = parser.produceAST(code, trackPos);
        let stepper = evaluate(program, env);

        isRunning = true;
        await sleep(dt);
        frameLagSum = 0;
        while (true) {
            const next = stepper.next();
            if (next.done) break;

            if (queueInterrupt) {
                console.log("▽ Ausführung wird abgebrochen!");
                isRunning = false;
                cleanupMarkers();
                return true; // returns true if interrupted
            }

            if (stepped) {
                // always push marker!
                if (showHighlighting) {
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

    isRunning = false;
    return false;
}

// updating lag sum
export function updateLagSum(dt: number) {
    frameLagSum += dt;
}

export function resetLagSum() {
    frameLagSum = 0;
}

// Start app
loadExtTasks().catch(e => console.error(e)).then(updateTaskSelector); // get std tasks
loadTask(DEFAULT_TASK);