import { type WorldProxy } from "./editor";
import { type Program } from "./language/frontend/ast";
import { type GlobalEnvironment } from "./language/runtime/environment";
import { STD_TASKS, type Task } from "./robot/tasks";
import { type World } from "./robot/world";
import { type Toggle } from "./ui/toggle-buttons";
import { type Ace } from "ace-builds";

export interface WorldViewEnv {
  isRunning: boolean;
  manualMode: boolean;
  queueInterrupt: boolean;
  world: World;
  taskCheck: HTMLElement;
  objOverlay: HTMLElement;
  playState: HTMLElement;
  dt: number;
  maxDt: number;
  toggleAnimation: Toggle;
  toggleThoughts: Toggle;
  updateLagSum(dts: number): void;
  resetLagSum(): void;
}

export interface InterpreterEnv {
  program: Program;
  env: GlobalEnvironment;
  stopCode(): Promise<void>;
}

export interface EditorEnv {
  editor: Ace.Editor;
  taskName: string;
  liveTasks: typeof STD_TASKS;
  extTasks: Record<string, string>;
  loadTask(key: string): Promise<void>;
  loadRawTask(key: string, task: Task, ignoreTitleInKey?: boolean): void;
}

export interface WorldEditEnv {
  idx: number;
  author: HTMLInputElement;
  category: HTMLInputElement;
  name: HTMLInputElement;
  title: HTMLInputElement;
  description: Ace.Editor;
  preload: Ace.Editor;
  descriptionPreview: HTMLDivElement;
  titlePreview: HTMLDivElement;
  paintInput: HTMLInputElement;
  codeError: HTMLDivElement;
  proxies: WorldProxy[];
  indexView: HTMLElement;
  reloadWorld: (idx?: number) => void;
  reloadEditor: () => void;
  reloadMetaInfo: () => void;
  generateTask: () => Task;
}

export interface AppRuntime extends WorldViewEnv, InterpreterEnv, EditorEnv {
}