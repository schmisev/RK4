export const ENV = {
    "global": {
        "const": {
            TRUE : "wahr",
            FALSE : "falsch",
            NULL : "nix",
            YELLOW : "gelb",
            RED : "rot",
            GREEN : "grün",
            BLUE : "blau",
        },
        "fn": {
            RANDOM_NUMBER: "zufallszahl",
            RANDOM_FLOAT: "zufallsbereich",
            LENGTH: "länge",
            TO_TEXT: "zuText",
            TO_INT: "zuZahl",
            TO_FLOAT: "zuKommazahl",
            JOIN: "verketten",
            FLOOR: "abrunden",
            CEIL: "aufrunden",
            ROUND: "runden",
            TRUNC: "stutzen",
            SIN: "sin",
            COS: "cos",
            TAN: "tan",
            ABS: "betrag",
        }
    },
    "robot": {
        "cls": "Roboter",
        "attr": {
            X: "x",
            Y: "y",
            DIR: "richtung"
        },
        "mth": {
            GET_HEIGHT: "höhe",
            STEP : "schritt",
            TURN_LEFT : "linksDrehen",
            TURN_RIGHT : "rechtsDrehen",
            PLACE_BLOCK : "hinlegen",
            PICKUP_BLOCK : "aufheben",
            SET_MARKER : "markeSetzen",
            REMOVE_MARKER : "markeEntfernen",
            IS_ON_MARKER : "istAufMarke",
            SEES_BLOCK : "siehtZiegel",
            SEES_WALL : "siehtWand",
            SEES_VOID : "siehtAbgrund",
            SEES_ROBOT: "siehtRoboter",
            CAN_MOVE_HERE: "schrittMöglich",
            WAIT: "warten",
            DON: "anziehen",
        }
    },
    "world": {
        "cls": "Welt",
        "attr": {
            LENGTH: "l",
            HEIGHT: "h",
            WIDTH: "b",
        },
        "mth": {
            IS_GOAL_REACHED : "fertig",
            GET_STAGE_INDEX : "teilaufgabe",
        }
    }
}
