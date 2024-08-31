
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
    world: string,
    preload: string,
}

export const STD_WORLD = `x;4;4;6;
S;_;_;_
_;_;_;_
_;_;_;_
_;_;_;_`


export const STD_PRELOAD = "// Nichts vordefiniert\n";


export const TEST_CODE = `// Großer Testcode
Zahl zeilenZähler ist 0

# Wiederholungen
wiederhole 4 mal
    Zahl n ist 0
    wiederhole solange n < 10
        wiederhole solange nicht k1.siehtWand()
            k1.hinlegen()
            k1.schritt()
        ende
        k1.linksDrehen()
        n ist n + 1
    ende
ende

Methode zeileAufräumen() für Roboter
    # Methodendefinition
    wiederhole solange nicht siehtWand()
        aufheben()
        schritt()
    ende

    zeilenZähler ist zeilenZähler + 1
ende

Funktion turmAbräumen(Objekt r)
    # Funktionsdeinition
    wiederhole solange r.siehtZiegel()
        r.zeileAufräumen()
        r.linksDrehen()
    ende
ende

turmAbräumen(k1)

wenn welt.fertig() dann
    zeig zeilenZähler, "Zeilen abgeräumt!"
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
        world: "x;5;1;5;\nE;_:_.;_:_.;_:_.;_:_.",
    },
};


/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof STD_TASKS = "Leer_4x4";