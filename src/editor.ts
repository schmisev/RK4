// UI imports
import { type WorldViewEnv } from "./app";
import { DEFAULT_TASK, STD_TASKS } from "./robot/tasks";
import { World } from "./robot/world";
import { setup as setupRobotView } from "./ui/robot-view";
import { makeToggle } from "./ui/toggle-buttons";

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

let robotView = setupRobotView(env);