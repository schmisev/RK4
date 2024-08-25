import * as p5 from 'p5';

import "./ui/panels";

import Parser from "./language/frontend/parser";
import { BlockType, CB, CBOT, CBOT2, CG, CR, CY, declareWorld, Field, MarkerType, World } from "./robot/world";
import { Environment, GlobalEnvironment, declareGlobalEnv } from "./language/runtime/environment";
import { evaluate } from "./language/runtime/interpreter";
import { Robot } from './robot/robot';
import { clamp, lerp } from './robot/utils';
import { STD_PRELOAD, STD_WORLD, TASKS, DEFAULT_TASK, TEST_CODE, Task } from "./robot/tasks";
import { sleep } from './language/runtime/utils';

import * as ace from "ace-builds";
import "ace-builds/esm-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import './assets/ace/mode-rkscript.js';
import { LexerError, ParserError } from './errors';
import { Program } from './language/frontend/ast';
import { showStructogram } from './ui/structograms';
import { addRobotButtons, hideRobotDiagram, robotDiagramIndex, showRobotDiagram } from './ui/objectigrams';

// Global variables
let dt = 50; // ms to sleep between function calls
let isRunning = false;
let queueInterrupt = false;
let taskName: string

let preloadCode = "\n";
let code = TEST_CODE;
let worldSpec = STD_WORLD;

const parse = new Parser();
let env: GlobalEnvironment;
let world: World
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
const taskCheck = document.getElementById("task-check")!;

// Fetch object overlay & object bar
const objOverlay = document.getElementById("object-overlay")!;
const objBar = document.getElementById("object-bar")!;

// Setup editors
const preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: preloadCode,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/chrome",
    readOnly: true,
});

const editor = ace.edit("code-editor", {
    minLines: 30,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/chrome",
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

// Setup robot sketch
export function robotSketch(p5: p5) {
    let bg = 0; // Background color
    const canvasDiv = document.getElementById('robot-canvas')!;
    let cam: p5.Camera;
    let pan = 0.0;
    let tilt = 0.0;
    let worldGoalReached = false;

    const CPS = 100; // Compass size
    const TSZ = 50; // Tilesize
    const BLH = 30; // Block height
    const MRH = 1; // Marker height
    const MSZ = 50; // Marker size
    const WLH = TSZ; // Wall height
    const FLH = 10; // Floor height
    const RBH = 60; // Robot body height
    const RBW = 35;

    const HUDF: number = 100; // HUD-factor
    const SQHUDF: number = p5.sqrt(HUDF);

    const createXTexture = (col: string) => {
        const xt = p5.createGraphics(TSZ, TSZ);
        xt.background(col);
        xt.strokeWeight(3);
        xt.line(TSZ * 0.25, TSZ * 0.25, TSZ * 0.75, TSZ * 0.75);
        xt.line(TSZ * 0.75, TSZ * 0.25, TSZ * 0.25, TSZ * 0.75);
        return xt;
    };

    const createCompassTexture = () => {
        const ct = p5.createGraphics(CPS, CPS);
        ct.strokeWeight(3);
        ct.stroke(255);

        ct.line(0.5 * CPS, 0, 0.5 * CPS, CPS);
        ct.line(0, 0.5 * CPS, CPS, 0.5 * CPS);
        ct.line(0.75 * CPS, 0.25 * CPS, 0.25 * CPS, 0.75 * CPS);
        ct.line(0.25 * CPS, 0.25 * CPS, 0.75 * CPS, 0.75 * CPS);

        ct.textAlign(p5.CENTER);
        ct.text("N", 0.5 * CPS, 0.1 * CPS);

        return ct;
    };

    const createTextTexture = (str: string) => {
        const ct = p5.createGraphics(TSZ, TSZ);
        ct.fill(255);
        ct.textAlign(p5.CENTER);
        ct.textSize(TSZ);
        ct.text(str, 0.5 * TSZ, 1 * TSZ);
        return ct;
    };

    const XNone = createXTexture("#000000");
    const XR = createXTexture(CR);
    const XY = createXTexture(CY);
    const XG = createXTexture(CG);
    const XB = createXTexture(CB);

    const CMP = createCompassTexture();

    const NT = createTextTexture("N");
    const WT = createTextTexture("W");
    const ET = createTextTexture("O");
    const ST = createTextTexture("S");

    const BLOCK2COLOR: Record<BlockType, string> = {
        "0": CR,
        "1": CG,
        "2": CB,
        "3": CY,
    };

    const BLOCK2XTEXTURE: Record<BlockType, p5.Graphics> = {
        "0": XR,
        "1": XG,
        "2": XB,
        "3": XY,
    };

    const MARKER2COLOR: Record<MarkerType, string> = {
        "0": "#000000",
        "1": CR,
        "2": CG,
        "3": CB,
        "4": CY,
    };

    const MARKER2XTEXTURE: Record<MarkerType, p5.Graphics> = {
        "0": XNone,
        "1": XR,
        "2": XG,
        "3": XB,
        "4": XY,
    };

    const numberPlates: Record<number, p5.Graphics> = {};

    const resizeToParent = () => {
        const width = canvasDiv.offsetWidth;
        const height = canvasDiv.offsetHeight;
        p5.resizeCanvas(width, height);
    };

    p5.setup = () => {
        const width = canvasDiv.offsetWidth;
        const height = canvasDiv.offsetHeight;
        const cvs = p5.createCanvas(width, height, p5.WEBGL);
        cam = p5.createCamera();
        cvs.parent("robot-canvas");
    };

    p5.draw = () => {
        resizeToParent();

        // bg color ramping
        if (isRunning && bg == 0) {
            bg = 255;
        }
        if (bg > 0) bg = lerp(0, bg, 0.9);
        if (!isRunning || queueInterrupt) bg = 0;

        p5.background(bg);

        p5.orbitControl();
        pan = p5.atan2(cam.eyeZ - cam.centerZ, cam.eyeX - cam.centerX);
        tilt = p5.atan2(cam.eyeY - cam.centerY, p5.dist(cam.centerX, cam.centerZ, cam.eyeX, cam.eyeZ));

        p5.push();

        // tilt and zoom out
        //cam.tilt(p5.PI * 0.4);
        p5.rotateX(p5.PI * 0.5);
        p5.scale(0.8);

        drawWorld(world);

        // draw object diagrams
        if (robotDiagramIndex >= 0) {
            //console.log("show");
            showRobotDiagram(world.robots[robotDiagramIndex], objOverlay, p5.winMouseX, p5.winMouseY);
        } else {
            hideRobotDiagram(objOverlay);
        }

        // update task status
        if (!world.isGoalReached()) {
            taskCheck.style.backgroundColor = "whitesmoke";
            taskCheck.innerHTML = "❌<br>" + `${world.getStageIndex()} / ${world.getStageCount()}`;
        } else {
            taskCheck.style.backgroundColor = "lightgreen";
            taskCheck.innerHTML = "✔️<br>" + `${world.getStageIndex() + 1} / ${world.getStageCount()}`;
        }

        // draw compass
        drawCompass(world);

        p5.pop();

        // draw heads up display
        drawHUD();
    };

    const drawHUD = () => {
        p5.push();
        p5.translate(cam.eyeX, cam.eyeY, cam.eyeZ);
        p5.rotateY(-pan);
        p5.rotateZ(tilt + p5.PI);
        p5.translate(HUDF, 0, 0);
        p5.rotateY(-p5.PI / 2);
        p5.rotateZ(p5.PI);

        // draw UI here
        p5.pop();
    };

    const drawCompass = (w: World) => {
        p5.push();
        p5.noStroke();
        p5.translate(0, 0, -w.H * BLH * 0.5 - FLH);

        // draw compass letters
        p5.push();
        p5.translate((-w.L * 0.5 - 1) * TSZ, 0, 0);
        p5.texture(WT);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(-(-w.L * 0.5 - 1) * TSZ, 0, 0);
        p5.texture(ET);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(0, (-w.W * 0.5 - 1) * TSZ, 0);
        p5.texture(NT);
        p5.plane();
        p5.pop();

        p5.push();
        p5.translate(0, -(-w.W * 0.5 - 1) * TSZ, 0);
        p5.texture(ST);
        p5.plane();
        p5.pop();

        p5.pop();
    };

    const drawWorld = (w: World) => {
        p5.push();
        drawWorldOutline(w);
        drawWorldFields(w);
        drawRobots(w);
        p5.pop();
    };

    const drawRobots = (w: World) => {
        p5.push();
        p5.translate((1 - w.L) * 0.5 * TSZ, (1 - w.W) * 0.5 * TSZ, (1 - w.H) * 0.5 * BLH);
        for (const [i, r] of w.robots.entries()) {
            // do the drawing
            p5.push();
            p5.translate(0, 0, 5 * p5.abs(p5.sin(i + p5.frameCount * 0.1)));
            const f = w.getField(r.pos.x, r.pos.y)!;
            p5.translate(
                r.pos.x * TSZ,
                r.pos.y * TSZ,
                (f.blocks.length - 0.5) * BLH
            );
            p5.rotateZ(2 * p5.PI * r.dir2Angle() / 360);

            drawSingleRobot(r);

            p5.pop();
        }
        p5.pop();
    };

    const drawSingleRobot = (r: Robot) => {
        p5.push();
        p5.translate(0, 0, RBH * 0.5);
        p5.fill(CBOT);

        p5.push();
        p5.box(RBW, RBW, RBH);
        p5.pop();

        p5.push();
        let numberPlate = numberPlates[r.index];
        if (!numberPlate) {
            numberPlate = p5.createGraphics(RBW, RBH);
            numberPlate.textFont("Consolas");
            numberPlate.textSize(20);
            numberPlate.textAlign(p5.CENTER, p5.CENTER);
            numberPlate.text(r.index.toString(), 0, 0, RBW, RBH);
            numberPlates[r.index] = numberPlate;
        }

        p5.noStroke();
        p5.translate(RBW * 0.51, 0, 0);
        p5.texture(numberPlate);
        p5.rotateX(-p5.PI * 0.5);
        p5.rotateY(p5.PI * 0.5);
        p5.plane(RBW, RBH);

        p5.translate(0, 0, -RBW * 1.02);
        p5.rotateY(p5.PI);
        p5.plane(RBW, RBH);

        p5.pop();

        // eye
        p5.translate(0, 0, RBH * 0.1);

        p5.push();
        p5.noStroke();
        p5.fill(255);
        p5.translate(0, RBW * 0.3, 0);
        p5.sphere(RBW * 0.4);
        p5.pop();

        p5.push();
        p5.noStroke();
        p5.fill(0);
        p5.translate(0, RBW * 0.42, 0);
        p5.sphere(RBW * 0.3);
        p5.pop();

        // arms
        p5.fill(CBOT2);
        p5.push();
        p5.noStroke();
        p5.translate(-RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop();

        p5.push();
        p5.noStroke();
        p5.translate(RBW * 0.4, RBW * 0.6, -RBW * 0.4);
        p5.sphere(RBW * 0.2);
        p5.pop();

        // backplate
        p5.push();
        p5.noStroke();
        p5.fill(0);
        p5.translate(0, -RBW * 0.5, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(-RBW * 0.2, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.translate(RBW * 0.4, 0, 0);
        p5.box(RBW * 0.1, 1, RBW * 0.4);
        p5.pop();

        // name
        p5.pop();

    };

    const drawWorldOutline = (w: World) => {
        p5.push();
        p5.translate(0, 0, -FLH * 0.5);
        p5.noFill();
        p5.stroke(255);
        p5.box(w.L * TSZ + 2, w.W * TSZ + 2, w.H * BLH + FLH + 2);

        p5.pop();
    };

    const drawWorldFields = (w: World) => {
        p5.push();
        p5.translate((1 - w.L) * 0.5 * TSZ, (1 - w.W) * 0.5 * TSZ);
        for (const [y, line] of w.fields.entries()) {
            for (const [x, field] of line.entries()) {
                p5.push();
                p5.translate(x * TSZ, y * TSZ, 0);
                // debug
                //drawFieldBoundary(field);
                drawField(field);
                p5.pop();
            }
        }
        p5.pop();
    };

    const drawField = (f: Field) => {
        p5.push();
        p5.translate(0, 0, (1 - f.H) * 0.5 * BLH);

        // field goal
        drawGoalStatus(f);

        // draw floor
        if (!f.isEmpty) {
            p5.push();
            p5.fill(250);
            p5.stroke(200);
            p5.translate(0, 0, (-BLH - FLH) * 0.5);
            p5.box(TSZ, TSZ, FLH);
            p5.pop();
        }

        // draw wall
        if (f.isWall) {
            p5.push();
            p5.fill(200);
            p5.stroke(0);
            p5.translate(0, 0, (-BLH + WLH) * 0.5);
            p5.box(TSZ, TSZ, WLH);
            p5.pop();
        }


        for (const [z, block] of f.blocks.entries()) {
            p5.push();
            p5.translate(0, 0, z * BLH);
            p5.fill(BLOCK2COLOR[block]);
            p5.stroke(0, 0, 0);
            //p5.texture(BLOCK2XTEXTURE[block]);
            if (f.goalBlocks != null) {
                if (f.goalBlocks.length <= z || f.goalBlocks[z] != block) {
                    p5.texture(BLOCK2XTEXTURE[block]);
                }
            }
            p5.box(TSZ, TSZ, BLH);
            p5.pop();
        }

        // goal blocks
        if (f.goalBlocks != null && !f.isGoalReached()) {
            for (const [z, block] of f.goalBlocks.entries()) {
                p5.push();
                p5.translate(0, 0, z * BLH);
                p5.rotateZ(p5.frameCount * 0.02 + z);
                p5.scale(0.5);
                p5.fill(BLOCK2COLOR[block]);
                p5.stroke(0, 0, 0);
                p5.box(TSZ, TSZ, BLH);
                p5.pop();
            }
        }

        // markers
        if (f.marker != MarkerType.None) {
            p5.push();
            p5.translate(0, 0, (-BLH + MRH) * 0.5);
            const h = f.blocks.length;
            p5.translate(0, 0, h * BLH);
            p5.fill(MARKER2COLOR[f.marker]);
            if (f.goalMarker != null && f.goalMarker != f.marker) p5.texture(MARKER2XTEXTURE[f.marker]);
            p5.stroke(0);
            p5.box(MSZ, MSZ, MRH);
            p5.pop();
        }

        // goal markers
        if (f.goalMarker != null && !f.isGoalReached()) {
            if (f.goalMarker != MarkerType.None) {
                p5.push();
                p5.translate(0, 0, (-BLH + MRH) * 0.5);
                const h = f.blocks.length;
                p5.translate(0, 0, h * BLH);
                p5.scale(0.5);
                p5.rotateZ(p5.frameCount * 0.02 + h);
                p5.translate(
                    0,
                    0,
                    p5.sin(p5.frameCount * 0.05) * BLH * 0.4 + BLH * 0.5
                );
                p5.fill(MARKER2COLOR[f.goalMarker]);
                p5.stroke(0);
                p5.box(MSZ, MSZ, MRH);
                p5.pop();
            }
        }

        p5.pop();
    };

    const drawFieldBoundary = (f: Field) => {
        p5.push();
        p5.noFill();
        p5.scale(0.98);
        if (f.isGoalReached()) {
            p5.stroke(0, 255, 0);
        } else {
            p5.stroke(255, 0, 0);
        }
        p5.box(TSZ, TSZ, f.H * BLH);
        p5.pop();
    };

    const drawGoalStatus = (f: Field) => {
        if (f.isEmpty) return;
        p5.push();
        p5.translate(0, 0, (-FLH));
        p5.translate(0, 0, -2 * FLH);
        p5.rotateX(p5.PI * 0.5);
        p5.noStroke();

        if (f.isGoalReached()) {
            p5.fill(0, 255, 0);
        } else {
            p5.fill(255, 0, 0);
        }
        p5.box(TSZ * 0.4, FLH, TSZ * 0.4);
        p5.pop();
    };

}

const robotView = new p5(robotSketch, document.body);

/**
 * Start app
 */
loadTask(DEFAULT_TASK);