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
import { deepCopy } from "./utils";

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
];

const stdWorldProxy = {
  L: 3, W: 3, H: 5,
  fields: [
    ["S_", "_", "_"],
    ["_", "_", "_"],
    ["_", "_", "_"],
  ]
}

document.getElementById("next-index")!.onclick = () => {
  worldIndex = (worldIndex + 1) % worldProxies.length;
  reloadWorld();
}
document.getElementById("prev-index")!.onclick = () => {
  worldIndex = (worldIndex + worldProxies.length - 1) % worldProxies.length;
  reloadWorld();
}

function addColumns(worldProxy: WorldProxy, count: number) {
  for (let row of worldProxy.fields) {
    let extention = Array<string>(count).fill("_");
    row.push(...extention);
  }
}

function addRows(worldProxy: WorldProxy, count: number) {
  for (let i = 0; i < count; i++) {
    let newRow = Array(worldProxy.fields[0].length).fill(["_"]);
    worldProxy.fields.push(newRow);
  }
}

function buildWorldEdit(worldProxies: WorldProxy[], id: string, reloadWorld: () => void, reloadEditor: () => void) {
  let container = document.getElementById(id);
  if (!container) return;
  container.replaceChildren();

  for (let [proxyIndex, worldProxy] of worldProxies.entries()) {  
    let wrapper = document.createElement("div") as HTMLDivElement;
    wrapper.classList.add("world-wrapper");

    let editBar = document.createElement("div") as HTMLDivElement;
    editBar.classList.add("lc30", "wsr", "text", "edit-bar");
    wrapper.appendChild(editBar);

    for (let key of ["L", "W", "H"] as (keyof WorldProxy)[]) {
      let keyEdit = document.createElement("input");
      keyEdit.classList.add("key-edit");
      keyEdit.type = "number";
      keyEdit.value = worldProxy[key].toString();

      // dim editing
      keyEdit.onchange = (evt: Event) => {
        let newValue = parseInt(keyEdit.value);
        // we need to add some rows/columns
        // TODO: UGLY
        if (key === "L") {
          if (newValue > worldProxy.fields[0].length) {
            addColumns(worldProxy, newValue - worldProxy.fields[0].length);
            reloadEditor();
          }
        } else if (key === "W") {
          if (newValue > worldProxy.fields.length) {
            addRows(worldProxy, newValue - worldProxy.fields.length);
            reloadEditor();
          }
        }
        worldProxy[key] = newValue as any;
        reloadWorld();
      }

      editBar.appendChild(keyEdit);
    }

    let removeButton = document.createElement("button") as HTMLButtonElement;
    removeButton.innerHTML = "❌";
    removeButton.classList.add("toggle-button");
    removeButton.onclick = () => {
      if (worldProxies.length <= 1) return;
      if (proxyIndex < worldIndex) worldIndex -= 1;
      worldProxies.splice(proxyIndex, 1);
      reloadEditor();
      reloadWorld();
    }
    editBar.appendChild(removeButton);

    let addButton = document.createElement("button") as HTMLButtonElement;
    addButton.innerHTML = "➕";
    addButton.classList.add("toggle-button");
    addButton.onclick = () => {
      if (proxyIndex < worldIndex) worldIndex += 1;
      worldProxies.splice(proxyIndex + 1, 0, deepCopy(stdWorldProxy));
      reloadEditor();
      reloadWorld();
    }
    editBar.appendChild(addButton);

    if (proxyIndex < worldProxies.length - 1) {
      let downButton = document.createElement("button") as HTMLButtonElement;
      downButton.innerHTML = "⬇️";
      downButton.classList.add("toggle-button");
      downButton.onclick = () => {
        if (proxyIndex >= worldProxies.length - 1) return;
        worldProxies.splice(proxyIndex, 0, worldProxies.splice(proxyIndex+1, 1)[0]);
        reloadEditor();
        reloadWorld();
      }
      editBar.appendChild(downButton);
    }

    if (proxyIndex > 0) {
      let upButton = document.createElement("button") as HTMLButtonElement;
      upButton.innerHTML = "⬆️";
      upButton.classList.add("toggle-button");
      upButton.onclick = () => {
        if (proxyIndex === 0) return;
        worldProxies.splice(proxyIndex, 0, worldProxies.splice(proxyIndex-1, 1)[0]);
        reloadEditor();
        reloadWorld();
      }
      editBar.appendChild(upButton);
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
          reloadWorld();
        }

        field.appendChild(fieldEdit);
        row.appendChild(field);
      }
      worldTable.appendChild(row);
    }
    wrapper.appendChild(worldTable);
    container.appendChild(wrapper);
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

function reloadEditor(): void {
  buildWorldEdit(worldProxies, "world-edit-container", reloadWorld, reloadEditor);
  if (worldIndex >= worldProxies.length) worldIndex = 0;
}

reloadEditor();
reloadWorld();