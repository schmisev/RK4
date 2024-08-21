import * as p5 from 'p5';
import Parser from "./language/frontend/parser";
import { BlockType, CB, CBOT, CBOT2, CG, CR, CY, Field, MarkerType, World } from "./robot/world";
import Environment, { declareGlobalEnv } from "./language/runtime/environment";
import { evaluate } from "./language/runtime/interpreter";
import { Robot } from './robot/robot';
import { clamp } from './robot/utils';
import { STD_PRELOAD, STD_WORLD, TASKS, DEFAULT_TASK } from "./robot/tasks";
import { sleep } from './language/runtime/utils';

import * as ace from "ace-builds";
import "ace-builds/esm-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import './assets/ace/mode-rkscript.js';

// Global variables
let dt = 50; // ms to sleep between function calls
let interrupted = false;

let preloadCode = "\n";
let code = `
Zahl m ist 10

wiederhole solange m > 0
  zeig k1.linksDrehen()
  zeig m ist m - 1
ende

`;
let worldSpec = STD_WORLD;

const parse = new Parser();
let env: Environment;
let world: World

// Console log replacement
console.log = (function (old_log, log: HTMLElement) { 
    return function () {
        log.innerText += Array.prototype.slice.call(arguments).join(' ') + "\n";
        old_log.apply(console, arguments);
        log.scrollTop = log.scrollHeight;
    };
}(console.log.bind(console), document.querySelector('#console-log')!));

// Fetch HTML elements
// Editors

let preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: preloadCode,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/chrome",
});
preloadEditor.setReadOnly(true);

let editor = ace.edit("code-editor", {
    minLines: 30,
    mode: "ace/mode/RKScript",
	theme: "ace/theme/chrome",
    useWorker: false,
    value: code,
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
});

// Setup command line
let cmdLine = document.getElementById("cmd-line") as HTMLInputElement;
let cmdLineStack: string[] = [];
let cmdLineStackPointer = -1;

// Fetch task description
const taskDescription = document.getElementById("task-description") as HTMLElement;

// Fill task selector
const taskSelector = document.getElementById("load-task") as HTMLSelectElement;
for (const [key, task] of Object.entries(TASKS)) {
    const newOption = document.createElement("option");
    newOption.value = key;
    newOption.innerHTML = `${key} "${task.title}"`;
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

function isTaskkey(key: string): key is keyof typeof TASKS {
    return key in TASKS; // TASKS was not extended in any way and is a simple record
}
// Loading task
const loadTask = (key: string) => {
    if (!isTaskkey(key)) {
        preloadCode = STD_PRELOAD;
        worldSpec = STD_PRELOAD;
        return;
    }
    const task = TASKS[key];
    preloadCode = task.preload;
    worldSpec = task.world;

    taskDescription.innerHTML = `
    <p><b>🤔 ${key} "${task.title}"</b></p>
    <p>${task.description}</p>`;

    preloadEditor.setValue(preloadCode);
    resetEnv();
};

async function resetEnv() {
    env = declareGlobalEnv();
    world = new World(worldSpec);
    world.declareAllRobots(env);

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
    await runCode(cmdCode, true);
};

async function startCode() {
    const code = editor.getValue();
    if (!code) return;
    console.log();
    await resetEnv();
    console.log("▷ Code wird ausgeführt!");
    await runCode(code, true);
};

async function stopCode() {
    interrupted = true;
    await sleep(dt);
    await resetEnv();
}

const fetchCmd = (e: KeyboardEvent) => {
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
};

async function runCode(code: string, stepped: boolean) {
    // TODO Allow interrupts during execution... somehow...
    try {
        const program = parse.produceAST(code);
        let stepper = evaluate(program, env);
        while (!stepper.next().done) {
            if (interrupted) {
                console.log("▢ Ausführung abgebrochen!");
                interrupted = false;
                break;
            }
            stepped && await sleep(dt);
        }
    } catch (runtimeError) {
        console.log("⚠️ " + runtimeError.message);
        return;
    }
};

cmdLine.onkeydown = fetchCmd
document.getElementById("cmd-run")!.onclick = runCmd
document.getElementById("code-start")!.onclick = startCode
document.getElementById("code-stop")!.onclick = stopCode

taskSelector.onchange = (e: Event) => {
    console.log("Lade neue Aufgabe: " + taskSelector.value);
    loadTask(taskSelector.value);
};

// Setup app
loadTask(DEFAULT_TASK);

// Visualization (super inefficient)
export const sketch = (p5: p5) => {
    const TSZ = 50; // Tilesize
    const BLH = 30; // Block height
    const MRH = 1; // Marker height
    const MSZ = 50; // Marker size
    const WLH = TSZ; // Wall height
    const FLH = 10; // Floor height
    const RBH = 60; // Robot body height
    const RBW = 35;

    const createXTexture = (col: string) => {
        const xt = p5.createGraphics(TSZ, TSZ);
        xt.background(col);
        xt.strokeWeight(3);
        xt.line(TSZ * 0.25, TSZ * 0.25, TSZ * 0.75, TSZ * 0.75);
        xt.line(TSZ * 0.75, TSZ * 0.25, TSZ * 0.25, TSZ * 0.75);
        return xt;
    };

    const XNone = createXTexture("#000000");
    const XR = createXTexture(CR);
    const XY = createXTexture(CY);
    const XG = createXTexture(CG);
    const XB = createXTexture(CB);

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

    let numberPlates: Record<number, p5.Graphics> = {
    };

    let zoomLevel = 1.0;
    const aspectRatio = 3 / 4;

    const resizeToParent = () => {
        var canvasDiv = document.getElementById('robot-canvas')!;
        var width = canvasDiv.offsetWidth;
        var height = canvasDiv.offsetHeight;
        p5.resizeCanvas(width, height);
    };

    p5.preload = () => {
    };

    p5.setup = () => {
        var canvasDiv = document.getElementById('robot-canvas')!;
        var width = canvasDiv.offsetWidth;
        var height = canvasDiv.offsetHeight;
        const cvs = p5.createCanvas(width, height, p5.WEBGL);
        cvs.parent("robot-canvas");
    };

    p5.draw = () => {
        resizeToParent();

        p5.background(0);
        p5.orbitControl();
        p5.rotateX(p5.PI * 0.4);
        p5.scale(0.8);
        //p5.ambientLight(128, 128, 128);
        //p5.directionalLight(255, 255, 255, 1, 1, -1)
        // show center box
        //p5.fill(255, 255, 0);
        //p5.box(10, 10, 10);

        // draw world
        drawWorld(world);
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
        p5.translate((1-w.L) * 0.5 * TSZ, (1-w.W) * 0.5 * TSZ, (1-w.H) * 0.5 * BLH);
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
        p5.translate(0, 0, RBH * 0.1)

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
        p5.translate((1-w.L) * 0.5 * TSZ, (1-w.W) * 0.5 * TSZ);
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
        p5.translate(0, 0, (1-f.H) * 0.5 * BLH);
        
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
                )
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
    }

    const drawGoalStatus = (f: Field) => {
        if (f.isEmpty) return;
        p5.push();
        p5.translate(0, 0, (-BLH - FLH) * 0.5);
        p5.translate(0, 0, -2*FLH);
        p5.rotateX(p5.PI * 0.5);
        p5.noStroke();

        if (f.isGoalReached()) {
            p5.fill(0, 255, 0);
        } else {
            p5.fill(255, 0, 0);
        }
        p5.sphere(TSZ * 0.2);
        p5.pop();
    }

}

export const robotView = new p5(sketch, document.body);

// sound bindings
