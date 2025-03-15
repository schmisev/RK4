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
  dt: 10,
  maxDt: 10,
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
  //readOnly: true,
  showPrintMargin: false,
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

// world editor
interface WorldProxy {
  L: number,
  W: number,
  H: number,
  fields: string[][],
}

let worldIndex: number = 0;
let worldProxies: WorldProxy[] = [
  {
    L: 4, W: 3, H: 6,
    fields: [
      ["S_", "_", "_", "_"],
      ["_", "_", "_", "_"],
      ["_", "_", "_", "_"],
    ]
  },
  {
    L: 3, W: 5, H: 4,
    fields: [
      ["S_", "_", "_"],
      ["_", "_", "_"],
      ["_", "_", "_"],
      ["_", "_", "_"],
      ["_", "_", "_"],
    ]
  },
]

document.getElementById("next-index")!.onclick = () => {
  worldIndex = (worldIndex + 1) % worldProxies.length;
  reloadWorld();
}
document.getElementById("prev-index")!.onclick = () => {
  worldIndex = (worldIndex + worldProxies.length - 1) % worldProxies.length;
  reloadWorld();
}

function buildWorldEdit(worldProxy: WorldProxy, container: HTMLDivElement, callback: () => void) {
  let wrapper = document.createElement("div") as HTMLDivElement;

  for (let key of ["L", "W", "H"] as (keyof WorldProxy)[]) {
    let keyEdit = document.createElement("input");
    keyEdit.classList.add("key-edit");
    keyEdit.type = "number";
    keyEdit.value = worldProxy[key].toString();

    // dim editing
    keyEdit.onchange = (evt: Event) => {
      worldProxy[key] = parseInt(keyEdit.value) as any;
      callback();
    }

    wrapper.appendChild(keyEdit);
  }

  let worldTable = document.createElement("table") as HTMLTableElement;
  worldTable.classList.add("world-table");

  let w = worldProxy.fields;
  for (let r of w) {
    let row = document.createElement("tr") as HTMLTableRowElement;
    for (let [i, f] of r.entries()) {
      let field = document.createElement("td") as HTMLTableCellElement;
      field.classList.add("world-field");

      let fieldEdit = document.createElement("input") as HTMLInputElement;
      fieldEdit.value = f;

      // field editing
      fieldEdit.onchange = (evt: Event) => {
        r[i] = fieldEdit.value;
        callback();
      }

      field.appendChild(fieldEdit);
      row.appendChild(field);
    }
    worldTable.appendChild(row);
  }
  wrapper.appendChild(worldTable);
  container.appendChild(wrapper);
}

function reloadWorldEdit(worldProxies: WorldProxy[], id: string, callback: () => void) {
  let container = document.getElementById(id) as HTMLDivElement;
  if (!container) return;
  container.replaceChildren();

  for (let w of worldProxies) {
    buildWorldEdit(w, container, callback);
  }
}

function reloadWorld(): void {
  let genStr = "";
  for (let i = 0; i < worldProxies.length; i++) {
    let world = worldProxies[i];
    genStr += `x;${world.L};${world.W};${world.H};\n`
    genStr += world.fields.map((r) => r.join(";")).join("\n");
  }
  env.world = new World(genStr, worldIndex);
}

reloadWorldEdit(worldProxies, "world-edit-container", reloadWorld);
reloadWorld();