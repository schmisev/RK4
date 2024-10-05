import { random } from "mermaid/dist/utils";
import { World, Field, BlockType, MarkerType } from "./world";

export type WorldGen = ((w: World, idx: number) => void)
export type WorldSource = string | WorldGen

function generateHomogeneousWorld(l: number, w: number, h: number, fieldCode = "_") {
    let result = `x;${l};${w};${h};\n`;
    for (let j = 0; j < w; j++) {
        for (let i = 0; i < l-1; i++) {
            if (i == 0 && j == 0) result += "S";
            result += fieldCode + ";";
        }
        result += fieldCode + "\n";
    }
    return result;
}

/**
 * Interface for tasks
 */
export interface Task {
    title: string,
    description: string,
    world: string | ((w: World, idx: number) => void),
    preload: string,
}

export const STD_WORLD = `x;4;4;6;
S;_;_;_
_;_;_;_
_;_;_;_
_;_;_;_`


export const STD_PRELOAD = "// Nichts vordefiniert\n";

export const STD_CODE = ``

export const STD_TASKS: Record<string, Task> = {
    "Leer_4x4": {
        title: "Kleine leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(4, 4, 10),
        preload: STD_PRELOAD,
    },
    "Leer_8x6": {
        title: "Mittlere leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(8, 6, 10),
        preload: STD_PRELOAD,
    },
    "Leer_16x8": {
        title: "Große leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(16, 8, 10),
        preload: STD_PRELOAD,
    },
    "Zufall_4x4": {
        title: "Klein und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(4, 4, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    "Zufall_8x6": {
        title: "Mittel und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(8, 6, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    "Zufall_16x8": {
        title: "Groß und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(16, 8, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    "Zufall_1x4": {
        title: "Alles versucht?",
        description: "Lege die Blöcke an die richtigen Stellen - aber Achtung! Wo sie liegen sollen wird jedes Mal ausgewürfelt. Nutze dafür welt.fertig()!",
        preload: "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: "x;5;1;5;\nE;_:_.;_:_.;_:_.;_:_.",
    },
    "Generiert_1": {
        title: "Block auf Marke!",
        description: "Lege einen Block an die Stelle, wo die Marke liegt!",
        preload: "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            w.H = 10;
            w.W = 5 + Math.floor(Math.random() * 10);
            w.L = 5 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push( [] );
                
                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f)
                }
            }

            const rX = Math.floor(Math.random() * w.L);
            const rY = Math.floor(Math.random() * w.W);
            w.createRobot(rX, rY, "S", "k0", 0)

            const mX = Math.floor(Math.random() * w.L);
            const mY = Math.floor(Math.random() * w.W);
            const mF = w.fields[mY][mX];
            mF.addBlock(BlockType.r, true);
            mF.setMarker(MarkerType.Y, false);
            mF.setMarker(MarkerType.None, true);
            mF.lastGoalStatus = mF.checkGoal()
            w.addGoal();
        }
    },
    "Generiert_2": {
        title: "Rette den Roboter!",
        description: "Entferne die Blocks unter dem zweiten Roboter!",
        preload: "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            w.H = 10;
            w.W = 5;
            w.L = 5 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push( [] );
                
                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f)
                }
            }

            w.createRobot(0, 0, "S", "k1", 1)
            const rX = 1 + Math.floor(Math.random() * (w.L - 2));
            const rY = 1 + Math.floor(Math.random() * (w.W - 2));
            w.createRobot(rX, rY, "S", "k2", 2);
            const mF = w.fields[rY][rX];
            for (let i = 0; i < Math.random() * 8 + 2; i++) {
                mF.addBlock(BlockType.b);
            }
            mF.goalBlocks = Array<BlockType>();
            
        }
    }
};


/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof STD_TASKS = "Leer_4x4";