import { RuntimeError, WorldError } from "../errors";
import Environment from "../language/runtime/environment";
import { declareRobot, Robot } from "./robot";
import { Vec2 } from "./utils";

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

export class World {
    robots: Robot[];
    fields: Array<Field[]>;
    L: number;
    W: number;
    H: number;
    
    constructor(src: string) {
        this.robots = Array<Robot>();
        this.fields = [];
        this.L = 0;
        this.W = 0;
        this.H = 0;
        this.loadWorld(src);
    }

    loadWorld(src: string) {
        console.log("=========================");
        console.log("Welt wird geladen...");

        src = src.replaceAll("\r", ""); // clean up windows carriage returns
        const srcBlocks = src.split("\nx"); // cut off at x!
        const srcLines = srcBlocks[0].split("\n");
        //srcLines.pop();
        const srcTokens = srcLines.map((l) => {return l.split(";")});
        if (!srcLines[0]) {
            throw "Leere Welt-Datei!";
        }
        const srcFirstLineTokens = srcTokens.shift();
        if (srcFirstLineTokens && srcFirstLineTokens.length > 0)
            this.H = parseInt(srcFirstLineTokens[0]);
        else throw "Format der Welt-Datei ist ungültig!";

        if (srcTokens.length == 0) throw "Die Welt hat eine Breite von 0!";
        this.W = srcTokens.length
        if (srcTokens[0].length == 0) throw "Die Welt hat eine Länge von 0!";
        this.L = srcTokens[0].length

        console.log("Welt:", "L", this.L, "| W", this.W, "| H", this.H);

        let robotCounter = 1;

        this.fields = [];
        for (let y = 0; y < this.W; y++) {
            // add new line
            this.fields.push( [] );
            for (let x = 0; x < this.L; x++) {
                let goalMode = false;
                const expr = srcTokens[y][x];
                if (expr == undefined) break;
                //console.log(expr);
                const f = new Field(expr == "", expr == "#", this.H);
                let robotCreated = false;
                for (const c of expr) {
                    switch (c) {
                        case ":":
                            goalMode = true;
                            break;
                        case "N":
                        case "E":
                        case "S":
                        case "W":
                            if (robotCreated) throw "Kann nicht zwei Roboter auf dasselbe Feld stellen!";
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

        console.log("Roboter:", ...this.robots.map((r) => {return r.name}));
        console.log("Welt erfolgreich geladen!");
        console.log("=========================");
    }

    createRobot(x: number, y: number, dir: string, name: string, index: number) {
        const bot = new Robot(x, y, dir, name, index, this);
        this.robots.push(bot);
    }

    declareAllRobots(env: Environment) {
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