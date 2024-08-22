
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
    "A0.0": {
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
_;_;_;_x`,
        preload: "# Kein vordefinierter Code",
    },

    "A0.1": {
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
        world: `x;7;7;5;;;;
S:_;_:_;_:_;_:_;_:_;rr:_;#
_:_;_:_;rr:_;r:_;_:_;rrr:_;#
_:_;_:_;_:_;_:_;_:_;r:_;#
_:_;_:_;_:_;rr:_;r:_;_:_;#
_:_;rrr:_;_:_;_:_;_:_;rrr:_;#
`,
        preload: STD_PRELOAD,
    },

    "A0.3": {
        title: "Simple Welt",
        description: "Nichts zu tun!",
        world: `x;5;4;6;
_;_;;S;_
_;_;_;_;_
_;rr;_;#;_
`,
        preload: STD_PRELOAD,
    }
} satisfies Record<string, Task>;

export const DEFAULT_TASK: keyof typeof TASKS = "A0.1";
