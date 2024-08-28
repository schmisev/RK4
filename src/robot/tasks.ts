import { Octokit } from "@octokit/rest";
import { liveTasks } from "..";

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

export function destructureKey(key: string) {
    const keyParts = key.split("_");
    let name = keyParts.pop() || "unbenannt";
    let category = keyParts.pop() || "Standard";
    let author = keyParts.pop() || "unbekannt";

    return {
        name: name,
        category: category,
        author: author,
        sortStr: author + category + name,
    };
}

/**
 * Interface for tasks
 */
export interface Task {
    title: string,
    description: string,
    world: string,
    preload: string,
}

/**
 * Standard world
 */
export const STD_WORLD = `x;4;4;6;
S;_;_;_
_;_;_;_
_;_;_;_
_;_;_;_`

/**
 * Standard preload code, should be empty
 */
export const STD_PRELOAD = "# Nichts vordefiniert\n";

/**
 * Test code using pretty much all language features
 */
export const TEST_CODE = `# Großer Testcode
[ Funktionsdefinition ]
Funktion pow(Zahl basis, Zahl exponent)
    Zahl ausgabe ist 1
    wiederhole exponent mal
        ausgabe ist ausgabe * basis
    ende
    zurück ausgabe
ende

[ Methodendefinition ]
Methode stapeln(Zahl n) für Roboter
    wiederhole n mal
        hinlegen()
    ende
ende

Methode abräumen() für Roboter
    wiederhole solange siehtZiegel()
        aufheben()
    ende
ende

Methode zeileAbräumen() für Roboter
    wiederhole 2 mal
        wiederhole solange nicht siehtWand()
            abräumen()
            schritt()
        ende
    ende
ende

[ Klassendefinition ]
Klasse Vektor2
    Zahl x ist 0
    Zahl y ist 0
    
    Methode plus(Zahl dx, Zahl dy)
        x ist x + dx
        y ist y + dy
    ende

    Methode skalieren(Zahl f)
        x ist x * f
        y ist y * f
    ende
ende

[ Hauptprogramm ]
wenn welt.teilaufgabe() = 1 dann
# Erstes Level

zeig pow(3, 5)
zeig k1.linksDrehen()
zeig k1.stapeln(3)

k2.rechtsDrehen()
k2.schritt()
k2.linksDrehen()

wiederhole 3 mal
    k2.abräumen()
    k2.linksDrehen()
    k2.schritt()
    k2.rechtsDrehen()
ende

k2.schritt()
k2.rechtsDrehen()
k2.schritt()
k2.markeSetzen()

k1.abräumen()
k1.schritt()
k1.linksDrehen()
k1.schritt()
k1.markeEntfernen()
k1.schritt()
k1.rechtsDrehen()

wiederhole 2 mal
    k1.abräumen()
    k1.rechtsDrehen()
    k1.schritt()
    k1.linksDrehen()
ende

wiederhole solange nicht welt.fertig()
    k1.hinlegen()
ende

sonst
# Zweites Level
wiederhole 2 mal
    k1.zeileAbräumen()
    k2.zeileAbräumen()
    k1.linksDrehen()
    k2.linksDrehen()
    k1.abräumen()
    k2.abräumen()
    k1.schritt()
    k2.schritt()
    k1.linksDrehen()
    k2.linksDrehen()
ende

ende
`

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
        world: "x;5;1;5;\nE;_:.;_:.;_:.;_:.",
    },
    "sms_X_1": {
        title: "Chaos",
        description: "Räume alle Blöcke auf!",
        world: 
`x;8;10;8;;;;
_:+;_;rN;_;#;#;#
*:_;R:_;_;_;_;Y;_
r..:_;_;_;_;_;rrr:_Y;_
_:_;;_;_;E;rrrrrrr:_;_
;;_;;_;bgry:_;_
x;4;4;6;;
S;...:_;S;...:_
...:_;...:_;...:_;...:_
...:_;...:_;...:_;...:_
...:_;...:_;...:_;...:_`,
        preload: STD_PRELOAD,
    },
    "A_1": {
        title: "Block legen",
        description: "Lege den Block an die markierte Stelle!",
        world: 
`x;4;4;5;;
S;_;_;_
_;_;_;_
_;_;_:r;_
_;_;_;_
x;4;4;5;;
S;_;_;_:r
_;_;_;_
_;_;_:r;_
_;_;_;_`,
        preload: STD_PRELOAD,
    },
    "A_3": {
        title: "Aufräumen",
        description: "Räume alle Blöcke auf!",
        world: `x;7;7;5;;;;
S:_;_:_;_:_;_:_;_:_;rr:_;#
_:_;_:_;rr:_;r:_;_:_;rrr:_;#
_:_;_:_;_:_;_:_;_:_;r:_;#
_:_;_:_;_:_;rr:_;r:_;_:_;#
_:_;rrr:_;_:_;_:_;_:_;rrr:_;#
`,
        preload: STD_PRELOAD,
    },
    "A_4": {
        title: "Simple Welt",
        description: "Nichts zu tun!",
        world: `x;5;4;6;
_;_;;S;_
_;_;_;_;_
_;rr;_;#;_
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_1": {
        title: "Start",
        description: "Lege einen Ziegel an die markierte Stelle! Nutze dafür k1.hinlegen()",
        world: `x;4;1;6;
E:_;_:_;_:_;_:_:r
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_2": {
        title: "Um die Ecke",
        description: "Lege einen Ziegel an die markierte Stelle!",
        world: `x;3;3;6;
S:_;_:_;_:_
_:_;_:_;_:_
_:_;_:_;_:r
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_3": {
        title: "Verschieben",
        description: "Entferne den Ziegel mit k1.aufheben() und lege dann einen Ziegel an die markierte Stelle!",
        world: `x;5;3;6;
_:_;_:_;_:_;_:_;_:_
S:_;_:_;_:_;_:_;_:r
r:_;_:_;_:_;_:_;_:_
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_4": {
        title: "Umweltschutz",
        description: "Hebe alle Ziegel auf!",
        world: `x;5;1;6;
E:_;_:_;r:_;_:_;r:_
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_5": {
        title: "Treppe",
        description: "Baue die Treppe! Nutze dafür die neue Methode stapeln(), z.B. k1.stapeln(2)",
        world: `x;5;1;6;
E:_;_:r;_:rr;_:rrr;_:_
`,
        preload: `# Legt mehrere Blöcke gleichzeitig
Methode stapeln(Zahl n) für Roboter
        wiederhole n mal
            hinlegen()
        ende
ende
`,
    },
    "karol.arrrg.de_Übung_6": {
        title: "Spiegelei",
        description: "Setze eine Marke an die vorgegebene Stelle! Nutze dafür k1.markeSetzen()",
        world: `x;3;3;6;
E:_;_:_;_:_
_:_;_:Y;_:_
_:_;_:_;_:_
`,
        preload: STD_PRELOAD,
    },
    "karol.arrrg.de_Übung_7": {
        title: "Parkour",
        description: "Setz die Blöcke in einer Reihe!",
        world: `x;5;3;6;
_:_;_:_;r;_:_;_:_
E:_;_:r;r:rr;_:r;_:_
_:_;_:_;r;_:_;_:_
x;3;5;6;
_:_;S:_;_:_
_:_;_:r;_:_
r:_;r:rr;r:_
_:_;_:r;_:_
_:_;_:_;_:_
`,
        preload: STD_PRELOAD,
    }
};


/**
 * Get github files
 */
// Octokit.js
// https://github.com/octokit/core.js#readme
export async function loadExtTasks() {
    const octokit = new Octokit({
        auth: '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'
    })
    
    const allFiles = await octokit.request("GET /repos/{owner}/{repo}/git/trees/main", {
        owner: "schmisev",
        repo: "RK4Tasks",
      });
    
    for (const file of allFiles.data.tree) {
        const fileName: string = (file.path satisfies string);
        const splitFileName = fileName.split(".")
        const fileExt = splitFileName.pop();
        const key = splitFileName.pop();

        if (key && fileExt == "json") {
            console.log(fileName);
            // request all the files
            const file = await fetch("https://raw.githubusercontent.com/schmisev/RK4Tasks/main/" + fileName);
            const fileContent = await file.text();
            try {
                const task: Task = JSON.parse(fileContent);
                liveTasks[key] = task;
            } catch {
                console.error("Konnte externe Aufgabe nicht laden...")
            }
        }
    }
}

/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof STD_TASKS = "A_1";