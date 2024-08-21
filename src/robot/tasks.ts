
export interface Task {
    title: string,
    description: string,
    world: string,
    preload: string,
}

export const STD_WORLD = `6;;;;
S;_;_;_
_;_;_;_
_;_;_;_
_;_;_;_`

export const STD_PRELOAD = "\n";

export const TASKS = {
    "A0.0": {
        title: "Block legen",
        description: "Lege den Block an die markierte Stelle!",
        world: 
`4;4;5;;
S;_;_;_
_;_;_;_
_;_;_:r;_
_;_;_;_x
4;4;5;;
S;_;_;_:r
_;_;_;_
_;_;_:r;_
_;_;_;_x`,
        preload: "# Kein vordefinierter Code",
    },

    "A0.1": {
        title: "Chaos",
        description: "Räume alle Blöcke auf!",
        world: 
`8;10;8;;;;
_:+;_;rN;_;#;#;#
*:_;R:_;_;_;_;Y;_
r..:_;_;_;_;_;rrr:_Y;_
_:_;;_;_;E;rrrrrrr:_;_
;;_;;_;bgry:_;_x
4;4;6;;
S;...:_;S;...:_
...:_;...:_;...:_;...:_
...:_;...:_;...:_;...:_
...:_;...:_;...:_;...:_`,
        preload: 
`Methode schritte(Zahl n) für Roboter
    wiederhole n mal
        schritt()
    ende
ende

Methode umdrehen() für Roboter
    wiederhole 2 mal
        linksDrehen()
    ende
ende
`
    },

    "A0.2": {
        title: "Aufräumen",
        description: "Räume alle Blöcke auf!",
        world: `7;7;5;;;;
S:_;_:_;_:_;_:_;_:_;rr:_;#
_:_;_:_;rr:_;r:_;_:_;rrr:_;#
_:_;_:_;_:_;_:_;_:_;r:_;#
_:_;_:_;_:_;rr:_;r:_;_:_;#
_:_;rrr:_;_:_;_:_;_:_;rrr:_;#
x;;;;;;
`,
        preload: STD_PRELOAD,
    },

    "A0.3": {
        title: "Simple Welt",
        description: "Nichts zu tun!",
        world: `5;4;6;
_;_;;S;_
_;_;_;_;_
_;rr;_;#;_x
`,
        preload: STD_PRELOAD,
    }
} satisfies Record<string, Task>;

export const DEFAULT_TASK: keyof typeof TASKS = "A0.1";
