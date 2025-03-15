// UI imports
import { type WorldViewEnv } from "./app";
import { DEFAULT_TASK, STD_TASKS } from "./robot/tasks";
import { World } from "./robot/world";
import { setup as setupRobotView } from "./ui/robot-view";
import { makeToggle } from "./ui/toggle-buttons";

// ACE imports
import * as ace from "ace-builds";
import './assets/ace/mode-rkscript.js';
import './assets/ace/theme-rklight.js';

const objOverlay = document.getElementById("object-overlay")!;
const objBar = document.getElementById("object-bar")!;
const playState = document.getElementById("play-state-symbol")!;
const taskCheck = document.getElementById("task-check")!;

document.getElementById("loading-overlay")?.classList.remove("loading");

const dummyTask = STD_TASKS[DEFAULT_TASK];
let env: WorldViewEnv;
env = {
  isRunning: false,
  dt: 0,
  maxDt: 0,
  manualMode: false,
  objOverlay,
  playState,
  queueInterrupt: false,
  taskCheck,
  world: new World(dummyTask.world, 0),
  updateLagSum(dt: number) {},
  resetLagSum() {},
  toggleAnimation: makeToggle(true),
  toggleThoughts: makeToggle(true),
}

// Setup editors
const descriptionEditor = ace.edit("task-description", {
  minLines: 1,
  value: "",
  mode: "ace/mode/html",
  theme: "ace/theme/monokai",
  //readOnly: true,
  showPrintMargin: false,
  enableBasicAutocompletion: true
});

const preloadEditor = ace.edit("preload-editor", {
    minLines: 1,
    value: "// Bibliothek",
    mode: "ace/mode/RKScript",
    theme: "ace/theme/RKLight",
    //readOnly: true,
    showPrintMargin: false,
});

let robotView = setupRobotView(env);