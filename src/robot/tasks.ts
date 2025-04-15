import { World, Field, BlockType, MarkerType } from "./world";
import { deepCopy, rndi } from "../utils";
import { WorldError } from "../errors";

export type WorldGen = (w: World, idx: number) => void;
export type WorldSource = string | WorldGen;

function generateHomogeneousWorld(
    l: number,
    w: number,
    h: number,
    fieldCode = "_"
) {
    let result = `x;${l};${w};${h};\n`;
    for (let j = 0; j < w; j++) {
        for (let i = 0; i < l - 1; i++) {
            if (i == 0 && j == 0) result += "S_;";
            else result += fieldCode + ";";
        }
        result += fieldCode + "\n";
    }
    return result;
}

export interface Task {
    title: string;
    description: string;
    world: string | ((w: World, idx: number) => void);
    preload: string;
    solution?: string;
}

export const STD_WORLD = `x;4;4;6;
S;_;_;_
_;_;_;_
_;_;_;_
_;_;_;_`;

export const STD_PRELOAD = "// Nichts vordefiniert\n";

export const STD_CODE = ``;

export const STD_TASKS: Record<string, Task> = {
    Leer_4x4: {
        title: "Kleine leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(4, 4, 10),
        preload: STD_PRELOAD,
    },
    Leer_8x6: {
        title: "Mittlere leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(8, 6, 10),
        preload: STD_PRELOAD,
    },
    Leer_16x8: {
        title: "Große leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(16, 8, 10),
        preload: STD_PRELOAD,
    },
    Leer_Hoch: {
        title: "Sehr hohe Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(2, 2, 30),
        preload: STD_PRELOAD,
    },
    Zufall_4x4: {
        title: "Klein und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(4, 4, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    Zufall_8x6: {
        title: "Mittel und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(8, 6, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    Zufall_16x8: {
        title: "Groß und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(16, 8, 6, "...:_"),
        preload: STD_PRELOAD,
    },
    Zufall_1x4: {
        title: "Alles versucht?",
        description:
            "Lege die Blöcke an die richtigen Stellen - aber Achtung! Wo sie liegen sollen wird jedes Mal ausgewürfelt. Nutze dafür welt.fertig()!",
        preload:
            "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: "x;5;1;5;\nE;_:_.;_:_.;_:_.;_:_.",
    },
    Test_Fallen: {
        title: "Fallen",
        description: "Nichts zu sehen!",
        preload: "",
        world: "x;5;1;5;\nrrrrS;W;_:2;",
    },
    Generiert_1: {
        title: "Block auf Marke!",
        description: "Lege einen Block an die Stelle, wo die Marke liegt!",
        preload:
            "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            w.H = 10;
            w.W = 5 + Math.floor(Math.random() * 10);
            w.L = 5 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            const rX = Math.floor(Math.random() * w.L);
            const rY = Math.floor(Math.random() * w.W);
            w.createRobot(rX, rY, "S", "k0", 0);

            const mX = Math.floor(Math.random() * w.L);
            const mY = Math.floor(Math.random() * w.W);
            const mF = w.fields[mY][mX];
            mF.addBlock(BlockType.r, true);
            mF.setMarker(MarkerType.Y, false);
            mF.setMarker(MarkerType.None, true);
            mF.lastGoalStatus = mF.checkGoal();
            w.addGoal();
        },
    },
    Generiert_2: {
        title: "Rette den Roboter!",
        description: "Entferne die Blocks unter dem zweiten Roboter!",
        preload:
            "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            w.H = 10;
            w.W = 5;
            w.L = 5 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 0, "S", "k1", 1);
            const rX = 1 + Math.floor(Math.random() * (w.L - 2));
            const rY = 1 + Math.floor(Math.random() * (w.W - 2));
            w.createRobot(rX, rY, "S", "k2", 2);
            const mF = w.fields[rY][rX];
            for (let i = 0; i < Math.random() * 8 + 2; i++) {
                mF.addBlock(BlockType.b);
            }
            mF.goalBlocks = Array<BlockType>();

            w.fields[0][0].setGoalRobotIndex(1);
            w.fields[0][1].setGoalRobotIndex(2);
        },
    },
    sms_Basics_1: {
        title: "Start",
        description:
            "Lege einen Ziegel an die markierte Stelle! Nutze dafür k1.hinlegen()",
        world: "x;4;1;6;\nE:_;_:_;_:_;_:_:r",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_2: {
        title: "Um die Ecke",
        description: "Lege einen Ziegel an die markierte Stelle!",
        world: "x;3;3;6;\nS:_;_:_;_:_\n_:_;_:_;_:_\n_:_;_:_;_:r",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_3: {
        title: "Verschieben",
        description:
            "Entferne den Ziegel mit <code>k1.aufheben()</code> und lege dann einen Ziegel an die markierte Stelle!",
        world: "x;5;3;6;\n_:_;_:_;_:_;_:_;_:_\nS:_;_:_;_:_;_:_;_:r\nr:_;_:_;_:_;_:_;_:_",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_4: {
        title: "Umweltschutz",
        description: "Hebe alle Ziegel auf!",
        world: "x;5;1;6;\nE:_;_:_;r:_;_:_;r:_",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_5: {
        title: "Treppe",
        description:
            "Baue die Treppe! Nutze dafür die neue Methode <code>stapeln()</code>, z.B. <code>k1.stapeln(2)</code>",
        world: "x;5;1;6;\nE:_;_:r;_:rr;_:rrr;_:_",
        preload:
            "// Legt mehrere Blöcke gleichzeitig\nMethode stapeln(Zahl n) für Roboter\n    wiederhole n mal\n        hinlegen()\n    ende\nende",
    },
    sms_Basics_6: {
        title: "Spiegelei",
        description:
            "Setze eine Marke an die vorgegebene Stelle! Nutze dafür <code>k1.markeSetzen()</code>",
        world: "x;3;3;6;\nE:_;_:_;_:_\n_:_;_:Y;_:_\n_:_;_:_;_:_",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_7: {
        title: "Parkour",
        description: "Setz die Blöcke in einer Reihe!",
        world: "x;5;3;6;\n_:_;_:_;r;_:_;_:_\nE:_;_:r;r:rr;_:r;_:_\n_:_;_:_;r;_:_;_:_\nx;3;5;6;\n_:_;S:_;_:_\n_:_;_:r;_:_\nr:r;r:rr;r:r\n_:_;_:r;_:_\n_:_;_:_;_:_",
        preload: "// Nichts vorgegeben",
    },
    sms_Basics_8: {
        title: "Zick-Zack-Linie",
        description: "Lege eine Zick-Zack-Linie.",
        preload: "// Nichts vorgegeben",
        world: "x;4;4;6;\nS:_;_:_;_:_;_:_\n_:r;_:r;_:_;_:_\n_:_;_:r;_:r;_:_\n_:_;_:_;_:r;_:r\n",
    },
    sms_Basics_9: {
        title: "Buchstaben",
        description: "Schreibe den Anfangsbuchstaben deines Namens mit Marken.",
        preload: "// Nichts vorgegeben",
        world: "x;6;6;6;\nN;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n_;_;_;_;_;_\n",
    },
    "sms_X-Mal-Wiederholen_1": {
        title: "Ecken",
        description:
            "Benutze <code>wiederhole 4 mal ... ende</code>, um in jede Ecke einen Ziegelstein zu legen.",
        preload: "// Nichts vorgegeben",
        world: "x;5;5;6;\nS:r;_:_;_:_;_:_;_:r\n_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_\n_:r;_:_;_:_;_:_;_:r\n",
    },
    "sms_X-Mal-Wiederholen_2": {
        title: "Markierungen",
        description:
            "Nutze eine Wiederholung und <code>k1.markeSetzen()</code>!",
        preload: "// Nichts vorgegeben",
        world: "x;8;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nEY:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    "sms_X-Mal-Wiederholen_3": {
        title: "Markierungen XXL",
        description: "...",
        preload: "// Nichts vorgegeben",
        world: "x;22;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y;_:_;_:Y\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    "sms_X-Mal-Wiederholen_4": {
        title: "Türmchen",
        description:
            "Nutze eine Wiederholung um einen Turm zu Bauen, der 18 Ziegel hoch ist!",
        preload: "// Nichts vorgegeben",
        world: "x;4;4;20;\nS:_;_:_;_:_;_:_\n_:_;_:rrrrrrrrrrrrrrrrrr;_:rrrrrrrrrrrrrrrrrr;_:_\n_:_;_:rrrrrrrrrrrrrrrrrr;_:rrrrrrrrrrrrrrrrrr;_:_\n_:_;_:_;_:_;_:_\n",
    },
    "sms_X-Mal-Wiederholen_5": {
        title: "Boden verlegen",
        description:
            "Nutze eine geschachtelte Wiederholung, um den gestreiften Fließenboden zu legen.",
        preload: "// Nichts vorgegeben",
        world: "x;6;7;3;\n_:b;_:b;_:b;_:b;_:b;_:b\n_:r;_:r;_:r;_:r;_:r;_:r\n_:b;_:b;_:b;_:b;_:b;_:b\n_:r;_:r;_:r;_:r;_:r;_:r\n_:b;_:b;_:b;_:b;_:b;_:b\n_:r;_:r;_:r;_:r;_:r;_:r\nN:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    "sms_X-Mal-Wiederholen_6": {
        title: "Umbau",
        description:
            "Benutze <code>wiederhole 3 mal ... ende</code>, um den Ziegelhaufen abzubauen und auf der anderen Seite wieder aufzubauen! ",
        preload: "// Nichts vorgegeben",
        world: "x;5;5;6;\n_:_;rrr:_;rrr:_;rrr:_;_:_\n_:_;N:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_\n_:_;_:rrr;_:rrr;_:rrr;_:_\n",
    },
    sms_Methoden_1: {
        title: "Demo: Hilfsmethoden",
        description:
            "Löse die Aufgabe, indem du Hilfsmethoden wie <code>umdrehen()</code>, <code>stapeln()</code> und <code>gehen()</code> definierst.",
        preload: "// Nichts vorgegeben",
        world: "x;7;6;10;\n_:rrr;S:_;bbbb:_;_:_;_:_;_:_;_:Y\n_:rrrr;_:_;bb:_;_:_;_:_;_:_;_:R\n_:r;_:_;b:_;_:_;_:_;_:_;_:G\n_:rrrrr;_:_;bbbbbbb:_;_:_;_:_;_:_;_:B\n_:rrr;_:_;bb:_;_:_;_:_;_:_;_:Y\n_:rrrrrr;_:_;b:_;_:_;_:_;_:_;_:R\n",
    },
    sms_Methoden_2: {
        title: "Dreierreihe",
        description:
            "Erstelle eine Methode für die Roboterklasse, die eine Reihe aus drei Ziegeln legt. Führe sie dann mit jedem Roboter einmal aus!",
        preload: "// Nichts vorgegeben",
        world: "x;4;4;6;\nE:_;_:r;_:r;_:r\nE:_;_:r;_:r;_:r\nE:_;_:r;_:r;_:r\nE:_;_:r;_:r;_:r\n",
    },
    sms_Methoden_3: {
        title: "Turm aus Dreierreihen",
        description:
            "Baue einen Turm, indem du immer wieder die Methode <code>k1.dreierreihe()</code>, die du selbst geschrieben hast, aufrufst!",
        preload: "// Nichts vorgegeben",
        world: "x;7;7;6;\nS:rrrrrr;_:rrrrrr;_:rrrrrr;_:rrrrrr;_:_;_:_;_:_\n_:rrrrrr;_:_;_:_;_:rrrrrr;_:_;_:_;_:_\n_:rrrrrr;_:_;_:_;_:rrrrrr;_:_;_:_;_:_\n_:rrrrrr;_:rrrrrr;_:rrrrrr;_:rrrrrr;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    sms_Methoden_4: {
        title: "Meine Burg",
        description:
            "Baue eine (niedrige) Burg, indem du erst die Methode <code>zinneBauen</code> entwirfst und diese dann wiederholt aufrufst.",
        preload: "// Nichts vorgegeben",
        world: "x;5;5;2;\nE:rr;_:r;_:rr;_:r;_:rr\n_:r;_:_;_:_;_:_;_:r\n_:rr;_:_;_:_;_:_;_:rr\n_:r;_:_;_:_;_:_;_:r\n_:rr;_:r;_:rr;_:r;_:rr\n",
    },
    sms_Methoden_5: {
        title: "Teppich flicken",
        description:
            "Schreibe eine Methode <code>flicken(Zahl anzahl)</code> und nutze sie, um den Teppich zu flicken.",
        preload: "// Nichts vorgegeben",
        world: "x;6;6;8;\nS;_;_;_;_;_;_\n_:Y;_:Y;_:Y;_:Y;_:Y;Y:Y;_:Y\n_:Y;Y:Y;_:Y;_:Y;_:Y;Y:Y;_:Y\n_:Y;Y:Y;_:Y;_:Y;Y:Y;Y:Y;_:Y\nY:Y;Y:Y;_:Y;_:Y;Y:Y;Y:Y;Y:Y\nY:Y;Y:Y;Y:Y;_:Y;Y:Y;Y:Y;Y:Y\n",
    },
    "sms_Bedingte-Wiederholung_1": {
        title: "Reihen räumen",
        description:
            "Hebe alle Blöcke auf! Nutze dafür 'wiederhole solange nicht k1.siehtWand()'",
        preload: "// Nichts vorgegeben",
        world: "x;4;1;6;\nE:_;_r:_;_r:_;_r:_\nx;7;1;6;\nE:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_\nx;12;1;6;\nE:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_;_r:_\n",
    },
    "sms_Bedingte-Wiederholung_2": {
        title: "Block hinter die Marke",
        description:
            "Lege einen Block hinter die Marke und entferne die Marke daraufhin. Verwende <code>wiederhole solange</code> ",
        preload: "// Nichts vorgegeben",
        world: "x;4;3;6;\n_:_;_:_;_:_;_:_\nE:_;_:_;Y:_;_:r\n_:_;_:_;_:_;_:_\nx;6;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:_;Y:_;_:r;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_\nx;11;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:_;_:_;_:_;_:_;Y:_;_:r;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    "sms_Bedingte-Wiederholung_3": {
        title: "Blöcke um die Marke",
        description:
            "Lege nun 4 Blöcke rund um die Marke, entfene sie und ersetze sie durch eine rote Marke mit <code>k1.markeSetzen(rot)</code>",
        preload: "// Nichts vorgegeben",
        world: "x;4;3;6;\n_:_;_:_;_:r;_:_\nE:_;_:r;Y:R;_:r\n_:_;_:_;_:r;_:_\nx;9;3;6;\n_:_;_:_;_:r;_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:r;Y:R;_:r;_:_;_:_;_:_;_:_;_:_\n_:_;_:_;_:r;_:_;_:_;_:_;_:_;_:_;_:_\nx;9;3;6;\n_:_;_:_;_:_;_:_;_:_;_:r;_:_;_:_;_:_\nE:_;_:_;_:_;_:_;_:r;Y:R;_:r;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:r;_:_;_:_;_:_\n",
    },
    "sms_Bedingte-Wiederholung_4": {
        title: "Marke auf die Blöcke",
        description:
            "Setze eine Marke auf die Spitze des Blockstapels. Achtung, danach soll der Stapel wieder genauso hoch werden wie zuvor! Tipp: Lege die entfernten Blöcke neben dem Roboter ab!",
        preload: "// Nichts vorgegeben",
        world: "x;4;3;6;\n_:_;_:_;_:_;_:_\nE:_;rrrrr:rrrrrY;_:_;_:_\n_:_;_:_;_:_;_:_\nx;14;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;rrrrr:rrrrrY;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nx;10;3;6;\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\nE:_;_:_;_:_;_:_;_:_;rrrrr:rrrrrY;_:_;_:_;_:_;_:_\n_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_;_:_\n",
    },
    "sms_Bedingte-Wiederholung_5": {
        title: "Einmal durchputzen, bitte!",
        description:
            "Nutze geschachtelte, bedingte Wiederholungen, um den Raum aufzuräumen.",
        preload: "// Nichts vorgegeben",
        world: "x;1;6;6;\nS:_\n+:_\n+:_\n+:_\n+:_\n+:_\nx;1;3;6;\nS:_\n+:_\n+:_\nx;1;8;6;\nS:_\n+:_\n+:_\n+:_\n+:_\n+:_\n+:_\n+:_\n",
    },
    "sms_Bedingte-Wiederholung_6": {
        title: "Teppich auslegen",
        description:
            "Benutze geschachtelte, bedingte Wiederholungen, um den Boden mit roten Marken auszulegen.",
        preload: "// Nichts vorgegeben",
        world: "x;4;4;6;\nS:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R\n_:_;_:_;_:_;_:_\nx;6;7;6;\nS:R;_:R;_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R;_:R;_:R\n_:R;_:R;_:R;_:R;_:R;_:R\n_:_;_:_;_:_;_:_;_:_;_:_\nx;2;6;6;\nS:R;_:R\n_:R;_:R\n_:R;_:R\n_:R;_:R\n_:R;_:R\n_:_;_:_\n",
    },
    "sms_Wenn-Dann-Sonst_1": {
        title: "Links oder rechts?",
        description: "Benutze <code>wenn ... dann ... sonst ... ende</code>, um die Aufgabe zu lösen. Wenn die Marke unter dem Roboter rot ist, soll er sich dabei nach links drehen und einen <b>roten</b> Block platzieren, ansonsten nach rechts und dort einen <b>blauen</b> Block setzen. Führe die Aufgabe mehrere Male durch. Klappt deine Lösung <i>immer</i>?",
        preload: "// Nichts vorgegeben",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = 2;
            w.W = 3;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 1, "E", "k1", 1);
            const left = Math.random() > 0.5;
            w.fields[1][0].setMarker(left ? MarkerType.R : MarkerType.B);
            if (left) {
                w.fields[0][0].addBlock(BlockType.r, true);
            } else {
                w.fields[2][0].addBlock(BlockType.b, true);
            }
        }
    },
    "sms_Wenn-Dann-Sonst_2": {
        title: "Links oder rechts? XXL",
        description: "Nutze nun zusätzlich eine bedingte Wiederholung, um je nach Marke links oder rechts den passenden Block zu legen.",
        preload: "// Nichts vorgegeben",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = 5 + Math.floor(Math.random() * 10);
            w.W = 3;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 1, "E", "k1", 1);
            for (let x = 1; x  < w.L; x++) {
                const left = Math.random() > 0.5;
                w.fields[1][x].setMarker(left ? MarkerType.R : MarkerType.B);
                if (left) {
                    w.fields[0][x].addBlock(BlockType.r, true);
                } else {
                    w.fields[2][x].addBlock(BlockType.b, true);
                }
            }
        }
    },
    "sms_Wenn-Dann-Sonst_3": {
        title: "Links, rechts oder weg?",
        description: "Nun kommen auch noch gelbe Marken dazu: Diese sollen alle entfernt werden.",
        preload: "// Nichts vorgegeben",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = 10 + Math.floor(Math.random() * 10);
            w.W = 3;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 1, "E", "k1", 1);
            for (let x = 1; x  < w.L; x++) {
                if (Math.random() < 0.33) {
                    w.fields[1][x].setMarker(MarkerType.Y);
                    w.fields[1][x].setMarker(MarkerType.None, true);
                    continue;
                }

                const left = Math.random() > 0.5;
                w.fields[1][x].setMarker(left ? MarkerType.R : MarkerType.B);
                if (left) {
                    w.fields[0][x].addBlock(BlockType.r, true);
                } else {
                    w.fields[2][x].addBlock(BlockType.b, true);
                }
            }
        },
    },
    "sms_Wenn-Dann-Sonst_4": {
        title: "Links, rechts, weg oder Stolperstein?",
        description: "Grüne Marker sollen hingegen mit einem grünen Block ersetzt werden.",
        preload: "Methode umdrehen() für Roboter\n    linksDrehen()\n    linksDrehen()\nende",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = 10 + Math.floor(Math.random() * 10);
            w.W = 3;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 1, "E", "k1", 1);
            for (let x = 1; x  < w.L; x++) {
                if (Math.random() < 0.25) {
                    w.fields[1][x].setMarker(MarkerType.Y);
                    w.fields[1][x].setMarker(MarkerType.None, true);
                    continue;
                }

                if (Math.random() < 0.33) {
                    w.fields[1][x].setMarker(MarkerType.G);
                    w.fields[1][x].setMarker(MarkerType.None, true);
                    w.fields[1][x].addBlock(BlockType.g, true);
                    continue;
                }

                const left = Math.random() > 0.5;
                w.fields[1][x].setMarker(left ? MarkerType.R : MarkerType.B);
                if (left) {
                    w.fields[0][x].addBlock(BlockType.r, true);
                } else {
                    w.fields[2][x].addBlock(BlockType.b, true);
                }
            }
        }
    },
    "sms_Wenn-Dann-Sonst_5": {
        title: "Um die Ecke EXTREME",
        description: "Nutze <code>siehtAbgrund()</code> um den Robotern nach Hause zu helfen. Allerdings müssen sie dabei manchmal rechts, manchmal links abbiegen.",
        preload: "Methode umdrehen() für Roboter\n    linksDrehen()\n    linksDrehen()\nende",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = 10 + Math.floor(Math.random() * 10);
            w.W = 10 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, true, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            let yTurn = 0;
            let lastTurns: number[] = [];
            for (let i = 0; i < 3; i++) {

                let xTurn = w.L - 2 - i * 2;
                
                let yTurnNew = yTurn;
                testLoop: for (let j = 0; j < 1000; j++) {
                    yTurnNew = 1 + Math.floor(Math.random() * (w.W - 2));
                    for (let yTurnLast of lastTurns) {
                        if (Math.abs(yTurnLast - yTurnNew) < 2) {
                            continue testLoop;
                        }
                    }
                    break;
                }
                lastTurns.push(yTurnNew);
                yTurn = yTurnNew;

                let direction = Math.random() > 0.5 ? -1 : 1;

                for (let x = 0; x < xTurn; x++) {
                    w.fields[yTurn][x].isEmpty = false;
                    w.fields[yTurn][x].isEditable = true;
                }

                for (let y = yTurn; y >= 0 && y < w.W; y += direction) {
                    w.fields[y][xTurn].isEmpty = false;
                    w.fields[y][xTurn].isEditable = true;
                }

                w.createRobot(0, yTurn, "E", "k" + (i+1), i + 1);
                w.fields[direction > 0 ? (w.W - 1) : 0][xTurn].setGoalRobotIndex(i+1);

            }
        }
    },
    "sms_Wenn-Dann-Sonst_6": {
        title: "Wegfindung",
        description: "Wenn der Roboter auf einen roten Block trifft, soll er den Block aufheben und nach rechts weitergehen. Bei einem blauen Block soll er nach links abbiegen, bis er sein Ziel erreicht hat.",
        preload: "// Nichts vorgegeben",
        world: (w: World, idx: number) => {
            let buffer = 5;
            
            w.H = 6;
            w.L = 20;
            w.W = 5 + 2 * buffer;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            let x = w.L - 1;
            let y = Math.floor(w.W / 2);

            w.createRobot(x, y, "W", "k1", 1);

            function randomDistance(min: number, max: number) {
                return Math.floor(Math.random() * (max - min)) + min;
            }

            let trys = 0;
            let direction: number = 0;
            while (x > 0 && trys < 1000) {
                trys += 1;
                if (direction === 0) {
                    // moving forward
                    let d = randomDistance(2, 5)
                    let xNew = Math.max(0, x - d);

                    for (let xTmp = x; xTmp > xNew; xTmp -= 1) {
                        w.fields[y][xTmp].setMarker(MarkerType.Y);
                    }
                    w.fields[y][x].setMarker(MarkerType.None);

                    if (xNew === 0) {
                        break;
                    }

                    x = xNew;

                    if (Math.random() > 0.5) {
                        w.fields[y][x].addBlock(BlockType.r);
                        direction -= 1
                    } else {
                        w.fields[y][x].addBlock(BlockType.b);
                        direction += 1
                    }
                } else {
                    // move laterally
                    let d = randomDistance(2, 7);
                    let yNew = y + direction * d;
                    if (yNew < 0 || yNew >= w.W) {
                        // recovery --> flip direction, replace stone
                        direction = -direction;
                        yNew = y + direction * d;
                        w.fields[y][x].blocks[0] = direction > 0 ? BlockType.b : BlockType.r;
                    }

                    for (let yTmp = y; yTmp !== yNew; yTmp += direction) {
                        w.fields[yTmp][x].setMarker(MarkerType.Y);
                    }
                    w.fields[y][x].setMarker(MarkerType.None);

                    y = yNew;
                    w.fields[y][x].addBlock(direction > 0 ? BlockType.r : BlockType.b);
                    direction = 0
                }
            }

            w.fields[y][0].setGoalRobotIndex(1);
        }
    },
    "sms_Algorithmen_1": {
        title: "Zimmer aufräumen",
        description: "Der Roboter soll ALLE Blöcke im Raum mithilfe der Methode <code>zimmerAufräumen()</code> entfernen. Implementiere dafür einzelne Hilfsmethoden!",
        preload: "// Nichts vorgegeben",
        world: (w: World, idx: number) => {
            w.H = 6;
            w.L = Math.floor(Math.random() * 5) + 5;
            w.W = Math.floor(Math.random() * 5) + 5;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    if (x != 0 || y != 0) {
                        
                        f.addMultipleBlocks(Math.floor(Math.random() * w.H / 2), BlockType.r, false);
                        f.goalBlocks = [];
                    }
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 0, "E", "k1", 1);
        }
    },
    "sms_Algorithmen_2": {
        title: "Rette den Roboter!",
        description: "Entferne die Blocks unter dem zweiten Roboter!",
        preload:
            "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            w.H = 10;
            w.W = 5;
            w.L = 5 + Math.floor(Math.random() * 10);

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            w.createRobot(0, 0, "S", "k1", 1);
            const rX = 1 + Math.floor(Math.random() * (w.L - 2));
            const rY = 1 + Math.floor(Math.random() * (w.W - 2));
            w.createRobot(rX, rY, "S", "k2", 2);
            const mF = w.fields[rY][rX];
            for (let i = 0; i < Math.random() * 8 + 2; i++) {
                mF.addBlock(BlockType.b);
            }
            mF.goalBlocks = Array<BlockType>();

            w.fields[0][0].setGoalRobotIndex(1);
            w.fields[0][1].setGoalRobotIndex(2);
        },
    },
    "sms_Algorithmen_3": {
        title: "Labyrinth",
        description: "Finde die rote Marke im Labyrinth und entferne sie! Tipp: Halte dich immer an der rechten Wand!",
        preload:
            "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: (w: World, idx: number) => {
            let kernelW = rndi(5, 11);
            let kernelL = rndi(5, 11);
            
            w.H = 2;
            w.W = 1 + 2 * kernelW;
            w.L = 1 + 2 * kernelL;

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    let isWall: boolean = (x%2==0) || (y%2==0);
                    const f = new Field(w, false, isWall, w.H, x, y);
                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            function getNeighbors(f: Field) {
                let neighbors: Field[] = [];
                let w = f.world;
                
                function pushUnvisited(nf: Field | undefined) {
                    if (nf && nf.marker === MarkerType.None) {
                        neighbors.push(nf);
                    }
                }

                // try to fetch all neighbors
                pushUnvisited(w.getField(f.x - 2, f.y));
                pushUnvisited(w.getField(f.x + 2, f.y));
                pushUnvisited(w.getField(f.x, f.y - 2));
                pushUnvisited(w.getField(f.x, f.y + 2));

                return neighbors;
            }

            function generateMaze(f: Field) {
                f.setMarker(MarkerType.G); // set as visited
                let neighbors = getNeighbors(f);
                let lastGoTo = f;
                while (neighbors.length > 0) {
                    idx = rndi(0, neighbors.length);
                    // remove neighbor from the list
                    let goTo = neighbors.splice(idx, 1)[0];
                    if (goTo.marker !== MarkerType.None) break;

                    let wallX = (f.x + goTo.x) / 2;
                    let wallY = (f.y + goTo.y) / 2;

                    let wall = w.getField(wallX, wallY)!;
                    if (!wall) break;
                    wall.isEditable = true;
                    wall.isWall = false;
                    wall.setMarker(MarkerType.G);

                    lastGoTo = generateMaze(goTo); // recursively calling
                }
                return lastGoTo;
            }

            let startX = 1 + rndi(0, kernelL) * 2;
            let startY = 1 + rndi(0, kernelW) * 2;
            let start = w.getField(startX, startY);
            if (!start) throw new WorldError(`Konnte keinen Einstieg bei (${startX}, ${startY}) finden! Weltgröße: (${w.W}, ${w.L})`);

            let goal = generateMaze(start);

            for (const row of w.fields) {
                for (const field of row) {
                    if (field.isEditable)
                        field.setMarker(MarkerType.None);
                }
            }

            start.setMarker(MarkerType.Y);
            goal.setMarker(MarkerType.R);
            goal.setMarker(MarkerType.None, true);

            w.createRobot(start.x, start.y, "S", "k1", 1);
        },
        solution: `
Methode herumirren() für Roboter
    wiederhole solange nicht istAufMarke(rot)
        // an Wand entlangtasten
        rechtsDrehen()
        wenn siehtWand() dann
            linksDrehen()
        ende
        
        // Wänden ausweichen
        wiederhole solange siehtWand()
            linksDrehen()
        ende
        schritt()
    ende
    k1.markeEntfernen()
ende

k1.herumirren()
        `
    },
    "sms_Algorithmen_4": {
        title: "Sortieren",
        description: "Bringe die Blockstapel in aufsteigend sortierte Reihenfolge!",
        preload: `// Nichts`,
        world: (w: World, idx: number) => {
            let maxValue: number = rndi(5, 10);
            let numOfValues: number = rndi(5, 15);
            let randomValues: number[] = [];

            for (let i = 0; i < numOfValues; i++) {
                randomValues.push(rndi(1, maxValue));
            }

            let sortedValues = deepCopy(randomValues).sort();
            maxValue = sortedValues.at(-1)!;
            
            w.H = maxValue + 1;
            w.W = 11;
            w.L = numOfValues;

            w.createRobot(0, 1, "N", "k1", 1);

            for (let y = 0; y < w.W; y++) {
                w.fields.push([]);

                for (let x = 0; x < w.L; x++) {
                    const f = new Field(w, false, false, w.H, x, y);

                    if (y === 0) {
                        f.addMultipleBlocks(randomValues[x], BlockType.r, false);
                        f.addMultipleBlocks(sortedValues[x], BlockType.r, true);
                    }

                    // add field to line
                    f.lastGoalStatus = f.checkGoal();
                    if (!f.lastGoalStatus) w.addGoal();
                    w.fields[y].push(f);
                }
            }

            // w.fields[0][w.L-1].isWall = true;
        }
    }
};

/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof STD_TASKS = "Leer_4x4";
