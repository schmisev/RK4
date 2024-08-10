
export interface Task {
    title: string,
    description: string,
    world: string
    preload: string,
}

export const STD_WORLD = `6;;;;
S;.;.;.
.;.;.;.
.;.;.;.
.;.;.;.`

export const STD_PRELOAD = "\n";

export const TASKS = {
    "A0.0": {
        title: "Block legen",
        description: "Lege den Block an die markierte Stelle!",
        world: 
`6;;;;
S;_;_;_
_;_;_;_
_;_;_:r;_
_;_;_;_
x`,
        preload: "# Kein vordefinierter Code",
    } as Task,

    "A0.1": {
        title: "Chaos",
        description: "Räume alle Blöcke auf!",
        world: 
`8;;;;;;
_;_;rN;_;#;#;#
_;R:Y;_;_;_;Y;_
_;_;_;_;_;rrr:_;_
_;;_;_;E;rrrrrrr:_;_
;;_;;_;bgry:_;_
x`,
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
    } as Task,

    "A0.2": {
        title: "Aufräumen",
        description: "Räume alle Blöcke auf!",
        world: `5;;;;;;
S:_;_:_;_:_;_:_;_:_;rr:_;#
_:_;_:_;rr:_;r:_;_:_;rrr:_;#
_:_;_:_;_:_;_:_;_:_;r:_;#
_:_;_:_;_:_;rr:_;r:_;_:_;#
_:_;rrr:_;_:_;_:_;_:_;rrr:_;#
x;;;;;;
`,
        preload: STD_PRELOAD,
    } as Task,
} as const;
const _ASSERT_TASK_TYPES: Record<string, Task> = TASKS;

export const DEFAULT_TASK: keyof typeof TASKS = "A0.1";
