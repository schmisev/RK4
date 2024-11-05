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
    "Test_Fallen": {
        title: "Fallen",
        description: "Nichts zu sehen!",
        preload: "",
        world: "x;5;1;5;\nrrrrS;W;_;"
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
                    const f = new Field(w, false, false, w.H, x, y);
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
                    const f = new Field(w, false, false, w.H, x, y);
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
            
            w.fields[0][0].setGoalRobotIndex(0);
            w.fields[0][1].setGoalRobotIndex(1);
        }
    },
    "sms_Kurs_1": {
        "title": "Start",
        "description": "Lege einen Ziegel an die markierte Stelle! Nutze dafür k1.hinlegen()",
        "world": "x;4;1;6;\nE:_;_:_;_:_;_:_:r",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_2": {
        "title": "Um die Ecke",
        "description": "Lege einen Ziegel an die markierte Stelle!",
        "world": "x;3;3;6;\nS:_;_:_;_:_\n_:_;_:_;_:_\n_:_;_:_;_:r",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_3": {
        "title": "Verschieben",
        "description": "Entferne den Ziegel mit k1.aufheben() und lege dann einen Ziegel an die markierte Stelle!",
        "world": "x;5;3;6;\n_:_;_:_;_:_;_:_;_:_\nS:_;_:_;_:_;_:_;_:r\nr:_;_:_;_:_;_:_;_:_",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_4": {
        "title": "Umweltschutz",
        "description": "Hebe alle Ziegel auf!",
        "world": "x;5;1;6;\nE:_;_:_;r:_;_:_;r:_",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_5": {
        "title": "Treppe",
        "description": "Baue die Treppe! Nutze dafür die neue Methode stapeln(), z.B. k1.stapeln(2)",
        "world": "x;5;1;6;\nE:_;_:r;_:rr;_:rrr;_:_",
        "preload": "// Legt mehrere Blöcke gleichzeitig\nMethode stapeln(Zahl n) für Roboter\n    wiederhole n mal\n        hinlegen()\n    ende\nende"
    },
    "sms_Kurs_6": {
        "title": "Spiegelei",
        "description": "Setze eine Marke an die vorgegebene Stelle! Nutze dafür k1.markeSetzen()",
        "world": "x;3;3;6;\nE:_;_:_;_:_\n_:_;_:Y;_:_\n_:_;_:_;_:_",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_7": {
        "title": "Parkour",
        "description": "Setz die Blöcke in einer Reihe!",
        "world": "x;5;3;6;\n_:_;_:_;r;_:_;_:_\nE:_;_:r;r:rr;_:r;_:_\n_:_;_:_;r;_:_;_:_\nx;3;5;6;\n_:_;S:_;_:_\n_:_;_:r;_:_\nr:r;r:rr;r:r\n_:_;_:r;_:_\n_:_;_:_;_:_",
        "preload": "// Nichts vorgegeben"
    },
    "sms_Kurs_8": {
        "title": "Zick-Zack-Linie",
        "description": "Lege eine Zick-Zack-Linie.",
        "preload": "// Nichts vorgegeben",
        "world": "x;4;4;6;\nS:_;_:_;_:_;_:_\n_:r;_:r;_:_;_:_\n_:_;_:r;_:r;_:_\n_:_;_:_;_:r;_:r\n"
    },
    "sms_Kurs_9": {
        "title": "Dreierreihe",
        "description": "Erstelle eine Methode für die Roboterklasse, die eine Reihe aus drei Ziegeln legt.",
        "preload": "// Nichts vorgegeben",
        "world": "x;1;4;6;\nS:_\n_:r\n_:r\n_:r\n"
    },
    "sms_Kurs_10": {
        "title": "Buchstaben",
        "description": "Schreibe den Anfangsbuchstaben deines Namens mit Marken.",
        "preload": "// Nichts vorgegeben",
        "world": "x;6;6;6;\nN;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n"
    },
    "sms_Kurs_11": {
        "title": "Reihen räumen",
        "description": "Hebe alle Blöcke auf! Nutze dafür 'wiederhole solange nicht k1.siehtWand()'",
        "preload": "// Nichts vorgegeben",
        "world": "x;4;1;6;\nE:_;_r:_;_r:_;_r:_\nx;7;1;6;\nE:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_\nx;12;1;6;\nE:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_\n"
    }
};


/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof STD_TASKS = "Leer_4x4";