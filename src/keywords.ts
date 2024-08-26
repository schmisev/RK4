export namespace KW {
    export namespace GLOBAL_ENV {
        export namespace CONSTANTS {
            export const TRUE = "wahr";
            export const FALSE = "falsch";
            export const NULL = "nix";
            export const YELLOW = "gelb";
            export const RED = "rot";
            export const GREEN = "grün";
            export const BLUE = "blau";
        }
        
        export namespace FUNCTIONS {
            export const RANDOM_NUMBER = "zufallszahl";
        }
    }

    export namespace ROBOT {
        export const CLASSNAME = "Roboter";

        export namespace ATTRIBUTES {
            export const X = "x";
            export const Y = "y";
            export const DIR = "richtung"
        }

        export namespace METHODS {
            export const GET_X = "x";
            export const GET_Y = "y";
            export const GET_DIR = "richtung";
            export const STEP = "schritt";
            export const TURN_LEFT = "linksDrehen";
            export const TURN_RIGHT = "rechtsDrehen";
            export const PLACE_BLOCK = "hinlegen";
            export const PICKUP_BLOCK = "aufheben";
            export const SET_MARKER = "markeSetzen";
            export const REMOVE_MARKER = "markeEntfernen";
            export const IS_ON_MARKER = "istAufMarke";
            export const SEES_BLOCK = "siehtZiegel";
            export const SEES_WALL = "siehtWand";
            export const SEES_VOID = "siehtAbgrund";
        }
    }

    export namespace WORLD {
        export const CLASSNAME = "Welt";

        export namespace METHODS {
            export const IS_GOAL_REACHED = "fertig";
            export const GET_STAGE_INDEX = "teilaufgabe";
        }
    }
}