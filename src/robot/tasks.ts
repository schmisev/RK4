let range = (n: number) => [...Array(n).keys()]

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
    author: string,
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

export const TASKS = {
    "Leer 4x4": {
        title: "Kleine leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(4, 4, 10),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Leer 8x6": {
        title: "Mittlere leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(8, 6, 10),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Leer 16x8": {
        title: "Große leere Welt",
        description: "Eine leere Welt.",
        world: generateHomogeneousWorld(16, 8, 10),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Zufall 4x4": {
        title: "Klein und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(4, 4, 6, "...:_"),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Zufall 8x6": {
        title: "Mittel und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(8, 6, 6, "...:_"),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Zufall 16x8": {
        title: "Groß und verrümpelt",
        description: "Eine vollgerümpelte Welt.",
        world: generateHomogeneousWorld(16, 8, 6, "...:_"),
        preload: STD_PRELOAD,
        author: "std",
    },
    "Zufall 1x4": {
        title: "Alles versucht?",
        description: "Lege die Blöcke an die richtigen Stellen - aber Achtung! Wo sie liegen sollen wird jedes Mal ausgewürfelt. Nutze dafür welt.fertig()!",
        preload: "Methode gehen(Zahl n) für Roboter\n    wiederhole n mal\n        schritt()\n    ende\nende",
        world: "x;5;1;5;\nE;_:.;_:.;_:.;_:.",
        author: "std",
    },
    "X1": {
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
        author: "sms",
    },
    "A1": {
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
        author: "sms",
    },
    "A3": {
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
        author: "sms",
    },
    "A4": {
        title: "Simple Welt",
        description: "Nichts zu tun!",
        world: `x;5;4;6;
_;_;;S;_
_;_;_;_;_
_;rr;_;#;_
`,
        preload: STD_PRELOAD,
        author: "sms",
    }
} satisfies Record<string, Task>;

/**
 * Default task loaded on startup
 */
export const DEFAULT_TASK: keyof typeof TASKS = "X1";