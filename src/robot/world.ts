import { RuntimeError, WorldError } from "../errors";
import { ClassPrototype, GlobalEnvironment, VarHolder } from "../language/runtime/environment";
import { BuiltinClassVal, MK_BOOL, MK_NATIVE_METHOD, MK_NUMBER, ObjectVal, RuntimeVal, ValueAlias } from "../language/runtime/values";
import { ENV } from "../spec";
import { rndi } from "../utils";
import { declareRobot, Robot } from "./robot";
import { WorldGen, WorldSource } from "./tasks";

export enum BlockType {
    r = "R", 
    g = "G", 
    b = "B", 
    y = "Y"
}

export const blockList = Object.values(BlockType);

export enum MarkerType {
    None = "", 
    R = "R", 
    G = "G", 
    B = "B", 
    Y = "Y"
}

export const markerList = Object.values(MarkerType).filter((m) => (m !== MarkerType.None));

export const CBOT = "#b1b1bb";
export const CBOT2 = "#8a8a93"
export const CR = "#ED553B";
export const CY = "#F6D55C";
export const CG = "#3CAEA3";
export const CB = "#20639B";

export const CHAR2BLOCK: Record<string, BlockType> = {
    "R": BlockType.r,
    "G": BlockType.g,
    "B": BlockType.b,
    "Y": BlockType.y,
    "r": BlockType.r,
    "g": BlockType.g,
    "b": BlockType.b,
    "y": BlockType.y,
    "rot": BlockType.r,
    "grün": BlockType.g,
    "blau": BlockType.b,
    "gelb": BlockType.y,
}

export const CHAR2MARKER: Record<string, MarkerType> = {
    "R": MarkerType.R,
    "G": MarkerType.G,
    "B": MarkerType.B,
    "Y": MarkerType.Y,
    "r": MarkerType.R,
    "g": MarkerType.G,
    "b": MarkerType.B,
    "y": MarkerType.Y,
    "rot": MarkerType.R,
    "grün": MarkerType.G,
    "blau": MarkerType.B,
    "gelb": MarkerType.Y,
}

interface WorldObjVal extends ObjectVal {
    w: World,
}

export function declareWorldClass(env: GlobalEnvironment): BuiltinClassVal {
    const prototype = new ClassPrototype();
    const worldClass: BuiltinClassVal = {
        type: ValueAlias.Class,
        name: "Welt",
        internal: true,
        prototype,
    };

    function downcastWorld(self: ObjectVal): asserts self is WorldObjVal {
        if (!Object.is(self.cls, worldClass))
            throw new RuntimeError(`Diese Methode kann nur auf einer Welt ausgeführt werden.`);
    }
    function mkWorldMethod(name: string, m: (r: World, args: RuntimeVal[]) => RuntimeVal) {
        prototype.declareMethod(name, MK_NATIVE_METHOD(name, function (args) {
            downcastWorld(this);
            return m(this.w, args);
        }))
    }

    mkWorldMethod(
        ENV.world.mth.IS_GOAL_REACHED,
        (w, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.world.mth.IS_GOAL_REACHED + `() erwartet keine Parameter!`);
            return MK_BOOL(w.isGoalReached());
        }
    );

    mkWorldMethod(
        ENV.world.mth.GET_STAGE_INDEX,
        (w, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.world.mth.GET_STAGE_INDEX + `() erwartet keine Parameter!`);
            return MK_NUMBER(w.getStageIndex() + 1);
        }
    );

    return worldClass;
}

export function declareWorld(w: World, varname: string, env: GlobalEnvironment): void {
    const world_env = new VarHolder();
    const world: WorldObjVal = {
        type: ValueAlias.Object,
        cls: env.worldClass,
        ownMembers: world_env,
        w,
    };

    // add world to environment
    env.declareVar(varname, world, true);
}

export class World {
    robots: Array<Robot> = [];
    fields: Array<Field[]> = [];
    L: number = 0;
    W: number = 0;
    H: number = 0;
    stages: string[];
    stageIdx: number = -1;
    goalsRemaining: number = 0;

    constructor(src: WorldSource, stage: number) {
        this.resetWorld();
        this.stages = [];
        if (typeof src === "string")
            this.loadWorldFromString(src, stage);
        else
            this.generateWorld(src, stage);
    }

    getStageCount() {
        return this.stages.length || 1;
    }

    resetWorld() {
        this.robots = [];
        this.fields = [];
        this.L = 0;
        this.W = 0;
        this.H = 0;
    }

    generateWorld(gen: WorldGen, stage: number) {
        this.resetWorld();
        gen(this, stage); // generate specified stage with generator
        this.stageIdx = stage;
    }

    loadWorldFromString(src: string, stage: number) {
        src = src.replaceAll("\r", ""); // clean up windows carriage returns
        this.stages = src.split("x;"); //
        if (this.stages[0] == "") this.stages.shift();

        // load indicated stage
        this.stageIdx = stage;
        this.loadStage(stage);
    }

    loadStage(idx: number) {
        this.resetWorld();
        const src = this.stages[idx];
        const srcLines = src.split("\n");
        //srcLines.pop();
        const srcTokens = srcLines.map((l) => {return l.split(";")});
        if (!srcLines[0]) {
            throw new WorldError("WELT: Leere Welt-Datei!");
        }
        const srcFirstLineTokens = srcTokens.shift();
        if (srcFirstLineTokens && srcFirstLineTokens.length >= 3) {
            this.L = parseInt(srcFirstLineTokens[0]);
            this.W = parseInt(srcFirstLineTokens[1]);
            this.H = parseInt(srcFirstLineTokens[2]);
        }
        else throw new WorldError("WELT: Format der Welt-Datei ist ungültig!");

        /*
        if (srcTokens.length == 0) throw new WorldError("Die Welt hat eine Breite von 0!");
        this.W = srcTokens.length
        if (srcTokens[0].length == 0) throw new WorldError("Die Welt hat eine Länge von 0!");
        this.L = srcTokens[0].length
        */
        let registeredRobots: number[] = [0]; // 0 is blocked

        this.fields = [];
        for (let y = 0; y < this.W; y++) {
            // add new line
            this.fields.push( [] );
            for (let x = 0; x < this.L; x++) {
                let goalMode = false;
                
                let expr = "";
                if (y < srcTokens.length && x < srcTokens[y].length)
                    expr = srcTokens[y][x];
                    
                
                // create new field
                const f = new Field(this, expr == "", expr == "#", this.H, x, y);
                let robotCreated = false;
                for (const c of expr) {
                    switch (c) {
                        case "0":
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                        case "5":
                        case "6":
                        case "7":
                        case "9":
                            let robotIndex = parseInt(c);
                            if (goalMode) {
                                f.setGoalRobotIndex(robotIndex);
                            } else {
                                if (registeredRobots.includes(robotIndex)) throw new WorldError(`WELT: k${robotIndex} existiert bereits.`);
                                if (robotCreated) throw new WorldError("WELT: Kann nicht zwei Roboter auf dasselbe Feld stellen!");
                                registeredRobots.push(robotIndex);
                                this.createRobot(x, y, "S", `k${robotIndex}` , robotIndex);
                                robotCreated = true;
                            }
                            break;
                        case ".":
                            f.addMultipleBlocks(rndi(0, 2), BlockType.r, goalMode);
                            break;
                        case "*":
                            // put down 0 or more blocks
                            f.addMultipleBlocks(rndi(0, this.H - f.getBlockHeight(goalMode)), BlockType.r, goalMode);
                            break;
                        case "+":
                            // put down 1 or more blocks
                            f.addMultipleBlocks(rndi(1, this.H - f.getBlockHeight(goalMode)), BlockType.r, goalMode);
                            break;
                        case "-": {
                            // remove random block from block list
                            if (goalMode && f.goalBlocks) {
                                let i = rndi(0, f.goalBlocks.length);
                                f.goalBlocks.splice(i, 1);
                            } else {
                                let i = rndi(0, f.blocks.length);
                                f.blocks.splice(i, 1);
                            }
                            break;
                        }
                        case "c": {
                            // add block of random color
                            let type = blockList[rndi(0, blockList.length)];
                            f.addMultipleBlocks(1, type, goalMode);
                            break;
                        }
                        case "f":
                            // fill with blocks to top
                            f.addMultipleBlocks(this.H - f.getBlockHeight(goalMode), BlockType.r, goalMode);
                            break;
                        case "?":
                            // put down 0 or 1 marker
                            if (rndi(0, 2))
                                f.setMarker(MarkerType.Y, goalMode);
                            break;
                        case "!":
                            // put down inverse of current marker state (only makes sense when part of goal state)
                            if (f.marker == MarkerType.None)
                                f.setMarker(MarkerType.Y, goalMode)
                            else if (f.marker)
                                f.setMarker(MarkerType.None, goalMode)
                            break;
                        case ":":
                            goalMode = true;
                            break;
                        case "N":
                        case "E":
                        case "S":
                        case "W":
                            if (robotCreated) throw new WorldError("WELT: Kann nicht zwei Roboter auf dasselbe Feld stellen!");
                            if (goalMode) break;
                            let i = 0;
                            for (const v of registeredRobots) {
                                if (i === v) i += 1;
                            }
                            registeredRobots.push(i); // register robot
                            this.createRobot(x, y, c, "k" + i, i);
                            robotCreated = true;
                            break;
                        case "r":
                        case "g":
                        case "b":
                        case "y":
                            f.addBlock(CHAR2BLOCK[c], goalMode);
                            break;
                        case "R":
                        case "G":
                        case "B":
                        case "Y":
                            f.setMarker(CHAR2MARKER[c], goalMode);
                            break;
                        case "X":
                            // explicitly set NO marker
                            f.setMarker(MarkerType.None, goalMode);
                            break;
                        case "C": {
                            // set random marker
                            let type = markerList[rndi(0, markerList.length)];
                            f.setMarker(type, goalMode);
                            break;
                        }
                        case "_":
                            if (goalMode) {
                                f.goalBlocks = Array<BlockType>();
                                f.goalMarker = MarkerType.None;
                            }
                            break;
                        case "#":
                            break;
                        default:
                            throw new WorldError(`Welt-Datei enthält unbekannten Buchstaben: '${c}'`);
                    }
                }
                
                // add field to line
                f.lastGoalStatus = f.checkGoal();
                if (!f.lastGoalStatus) this.addGoal();
                this.fields[y].push(f);
            }
        }
    }

    loadWorldLog() {
        console.log("🌍 Welt wird geladen");
        console.log("-> 🤔 Teilaufgabe", this.stageIdx + 1, "|", this.goalsRemaining, "Felder zu lösen");
        console.log("-> 🗺️ Welt:", "L", this.L, "| B", this.W, "| H", this.H);
        console.log("-> 🤖 Roboter:", this.robots.map((r) => {return r.name}).join(", "));
    }

    createRobot(x: number, y: number, dir: string, name: string, index: number) {
        const bot = new Robot(x, y, dir, name, index, this);
        this.robots.push(bot);
    }

    declareAllRobots(env: GlobalEnvironment) {
        for (const r of this.robots) {
            declareRobot(r, r.name, env);
        }
    }

    getField(x: number, y: number): Field | undefined {
        if (x < 0 || x >= this.L) return undefined
        if (y < 0 || y >= this.W) return undefined
        return this.fields[y][x];
    }

    getRobotAt(x: number, y: number): Robot | undefined {
        for (const r of this.robots) {
            if (r.pos.x == x && r.pos.y == y)
                return r;
        }
        return undefined;
    }

    addGoal() {
        this.goalsRemaining += 1;
        // console.log(`Feldziel NICHT erfüllt, jetzt noch ${this.goalsRemaining}`);
    }

    solveGoal() {
        this.goalsRemaining -= 1;
        // console.log(`Feldziel ERFÜLLT, noch ${this.goalsRemaining}`);
    }

    isGoalReached() {
        if (this.goalsRemaining < 0) throw new RuntimeError("Mit der Welt ist etwas falsch!");
        if (this.goalsRemaining > 0) return false;
        // when goalsRemaining is exactly 0
        return true;
    }

    getStageIndex() {
        return this.stageIdx;
    }
}

export class Field {
    isEmpty: boolean;
    isWall: boolean;
    isEditable: boolean;
    H: number;
    x: number;
    y: number;
    world: World;
    blocks: BlockType[];
    goalBlocks: BlockType[] | null;
    marker: MarkerType;
    goalMarker: MarkerType | null;
    goalRobotIdx: number | null;

    lastGoalStatus: boolean;
    wasChanged: boolean;

    constructor(world: World, isEmpty: boolean, isWall: boolean, H: number, x: number, y: number) {
        this.world = world;
        this.isEmpty = isEmpty;
        this.isWall = isWall;
        this.isEditable = !(isWall || isEmpty);
        this.H = H;
        this.x = x;
        this.y = y;
        this.blocks = Array<BlockType>();
        this.goalBlocks = null;
        this.marker = MarkerType.None;
        this.goalMarker = null;
        this.goalRobotIdx = null;

        this.lastGoalStatus = false;
        this.wasChanged = true;
    }

    addBlock(b: BlockType, goal: boolean = false) {
        if (!goal) {
            if (!this.isEditable || this.blocks.length >= this.H)
                throw new RuntimeError(`Kann hier keinen Block hinlegen!`);
            this.blocks.push(b);
        } else {
            if (this.goalBlocks == null) this.goalBlocks = Array<BlockType>();
            if (!this.isEditable || this.goalBlocks.length >= this.H)
                throw new RuntimeError(`Kann hier keinen Ziel-Block hinlegen!`);
            this.goalBlocks.push(b);
        }
        this.wasChanged = true;
    }

    addMultipleBlocks(n: number, b: BlockType, goal: boolean = false) {
        for (let i = 0; i < n; i++) {
            this.addBlock(b, goal);
        }
    }

    removeBlock(): BlockType {
        if (!this.isEditable || this.blocks.length <= 0)
            throw new RuntimeError(`Kann hier keinen Block aufheben!`);
        const oldBlock = this.blocks.pop();
        if (oldBlock == undefined)
            throw new RuntimeError(`Kein Block auf dem Stapel...?`);
        // register change
        this.wasChanged = true;
        return oldBlock;
    }

    getBlockHeight(goal: boolean = false): number {
        if (!goal) return this.blocks.length;
        if (!this.goalBlocks) return 0;
        return this.goalBlocks.length;
    }

    setMarker(m: MarkerType, goal: boolean = false) {
        if (!this.isEditable)
            throw new RuntimeError(`Kann hier keine Marke setzen!`);
        if (!goal) this.marker = m;
        else {
            this.goalMarker = m;
        }
        this.wasChanged = true;
    }

    removeMarker(): MarkerType {
        if (!this.isEditable || this.marker == MarkerType.None)
            throw new RuntimeError(`Kann hier keine Marke entfernen!`);
        const oldMarker = this.marker;
        this.marker = MarkerType.None;
        // register change
        this.wasChanged = true;
        return oldMarker;
    }

    setGoalRobotIndex(robotIdx: number) {
        if (!this.isEditable)
            throw new RuntimeError(`Kann hier kein Roboterziel setzen!`);
        if (robotIdx >= 0 && robotIdx < 10)
            this.goalRobotIdx = robotIdx;
        else
            throw new RuntimeError(`Als Roboterziel sind nur Zahlen zwischen 0 und einschließlich 9 zulässig.`)
        this.wasChanged = true
    }

    isGoalReached() {
        // if nothing changed, the goal status can't have changed
        if (!this.wasChanged) return this.lastGoalStatus;
        this.wasChanged = false; // after the following, we know the state of the goal

        const tmpGoalStatus = this.lastGoalStatus;
        this.lastGoalStatus = this.checkGoal();
        
        if (tmpGoalStatus && !this.lastGoalStatus) this.world.addGoal();
        if (!tmpGoalStatus && this.lastGoalStatus) this.world.solveGoal();

        return this.lastGoalStatus;
    }

    checkGoal(): boolean {
        if (!this.isEditable) return true;
        // this first, because no array ops
        if (this.goalMarker != null && this.goalMarker != this.marker) {
            return false;
        }

        // this is inexpensive
        if (this.goalRobotIdx != null /* && this.goalRobotIdx < this.world.robots.length */) {
            for (const r of this.world.robots) {
                if (r.index !== this.goalRobotIdx) continue; // not the right robot
                if (r.pos.x !== this.x || r.pos.y !== this.y)
                    return false;
            }
            // right now, unoccupyable goals are ignored... TODO?
        }

        // this is super cheap
        if (this.goalBlocks == null) return true;

        // this is cheap
        if (this.goalBlocks.length != this.blocks.length) {
            return false;
        }

        // this is expensive
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i] != this.goalBlocks[i]) {
                return false;
            }
        }
        // fallback
        return true;
    }
}