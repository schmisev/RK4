import { RuntimeError, WorldError } from "../errors";
import { ClassPrototype, Environment, GlobalEnvironment, VarHolder } from "../language/runtime/environment";
import { MK_BOOL, MK_NATIVE_FN, MK_NUMBER, RuntimeVal } from "../language/runtime/values";
import { KW } from "./keywords";
import { declareRobot, Robot } from "./robot";
import { rndi } from "./utils";

export enum BlockType {
    r, g, b, y
}

export enum MarkerType {
    None, R, G, B, Y
}

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

export function declareWorld(w: World, varname: string, env: GlobalEnvironment): void {
    const world_env = new VarHolder();
    const world: RuntimeVal = {
        type: "object",
        cls: env.worldClass,
        ownMembers: world_env,
    };

    // add world to environment
    env.declareVar(varname, world, true);
    // declare its properties
    world_env.declareVar(KW.WORLD.METHODS.IS_GOAL_REACHED, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.WORLD.METHODS.IS_GOAL_REACHED + `() erwartet keine Parameter!`);
            return MK_BOOL(w.isGoalReached());
        }
    ), true);

    world_env.declareVar(KW.WORLD.METHODS.GET_STAGE_INDEX, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.WORLD.METHODS.GET_STAGE_INDEX + `() erwartet keine Parameter!`);
            return MK_NUMBER(w.getStageIndex() + 1);
        }
    ), true);
}

export class World {
    robots: Robot[];
    fields: Array<Field[]>;
    L: number;
    W: number;
    H: number;
    stages: string[];
    stageIdx: number;
    
    constructor(src: string, stage: number) {
        this.resetWorld();
        this.stages = [];
        this.loadWorld(src, stage);
    }

    getStageCount() {
        return this.stages.length;
    }

    resetWorld() {
        this.robots = Array<Robot>();
        this.fields = [];
        this.L = 0;
        this.W = 0;
        this.H = 0;
    }

    loadWorld(src: string, stage: number) {
        src = src.replaceAll("\r", ""); // clean up windows carriage returns
        this.stages = src.split("x;"); //
        if (this.stages[0] == "") this.stages.shift();

        // load first stage
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

        let robotCounter = 1;

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
                const f = new Field(expr == "", expr == "#", this.H);
                let robotCreated = false;
                for (const c of expr) {
                    switch (c) {
                        case ".":
                            f.addMultipleBlocks(rndi(0, 2), BlockType.r, goalMode);
                            break;
                        case "*":
                            // put down 0 or more blocks
                            f.addMultipleBlocks(rndi(0, this.H - f.getBlockHeight()), BlockType.r, goalMode);
                            break;
                        case "+":
                            // put down 1 or more blocks
                            f.addMultipleBlocks(rndi(1, this.H - f.getBlockHeight()), BlockType.r, goalMode);
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
                            if (robotCreated) throw new WorldError("Kann nicht zwei Roboter auf dasselbe Feld stellen!");
                            if (goalMode) break;
                            this.createRobot(x, y, c, "k" + robotCounter, robotCounter);
                            robotCreated = true;
                            robotCounter += 1;
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
                        case "_":
                            if (goalMode) {
                                f.goalBlocks = Array<BlockType>();
                                f.goalMarker = MarkerType.None;
                            }
                            break;
                        case "#":
                            break;
                        default:
                            break;
                            //throw new WorldError(`Welt-Datei enthält unbekannten Buchstaben: '${c}'`);
                    }
                }
                
                // add field to line
                this.fields[y].push(f);
            }
        }
    }

    loadWorldLog() {
        console.log("🌍 Welt wird geladen");
        console.log("... 🤔 Teilaufgabe", this.stageIdx + 1);
        console.log("... 🗺️ Welt:", "L", this.L, "| B", this.W, "| H", this.H);
        console.log("... 🤖 Roboter:", this.robots.map((r) => {return r.name}).join(", "));
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

    isGoalReached() {
        for (const line of this.fields) {
            for (const field of line) {
                if (!field.isGoalReached()) return false;
            }
        }
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
    blocks: BlockType[];
    goalBlocks: BlockType[] | null;
    marker: MarkerType;
    goalMarker: MarkerType | null;

    constructor(isEmpty: boolean, isWall: boolean, H: number) {
        this.isEmpty = isEmpty;
        this.isWall = isWall;
        this.isEditable = !(isWall || isEmpty);
        this.H = H;
        this.blocks = Array<BlockType>();
        this.goalBlocks = null;
        this.marker = MarkerType.None;
        this.goalMarker = null;
    }

    addBlock(b: BlockType, goal = false) {
        if (!goal) {
            this.blocks.push(b);
            if (!this.isEditable || this.blocks.length > this.H)
                throw new RuntimeError(`Kann hier keinen Block hinlegen!`);
        } else {
            if (this.goalBlocks == null) this.goalBlocks = Array<BlockType>();
            this.goalBlocks.push(b);
        }
    }

    addMultipleBlocks(n: number, b: BlockType, goal = false) {
        for (let i = 0; i < n; i++) {
            this.addBlock(b, goal);
        }
    }

    removeBlock() {
        if (!this.isEditable || this.blocks.length <= 0)
            throw new RuntimeError(`Kann hier keinen Block aufheben!`);
        this.blocks.pop();
    }

    getBlockHeight(): number {
        return this.blocks.length;
    }

    setMarker(m: MarkerType, goal = false) {
        if (!this.isEditable)
            throw new RuntimeError(`Kann hier keine Marke setzen!`);
        if (!goal) this.marker = m;
        else {
            this.goalMarker = m;
        }
    }

    removeMarker() {
        if (!this.isEditable || this.marker == MarkerType.None)
            throw new RuntimeError(`Kann hier keine Marke entfernen!`);
        this.marker = MarkerType.None;
    }

    isGoalReached() {
        if (!this.isEditable) return true;
        if (this.goalBlocks != null) {
            if (this.goalBlocks.toString() != this.blocks.toString()) return false;
        }
        if (this.goalMarker != null) {
            if (this.goalMarker != this.marker) return false;
        }
        return true;
    }
}