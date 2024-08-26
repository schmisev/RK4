import { RuntimeError } from "../errors";
import { GlobalEnvironment, VarHolder } from "../language/runtime/environment";
import { MK_BOOL, MK_STRING, MK_NATIVE_FN, MK_NUMBER, RuntimeVal } from "../language/runtime/values";
import { KW } from "../keywords";
import { Vec2 } from "./utils";
import { BlockType, CHAR2BLOCK, CHAR2MARKER, Field, MarkerType, World } from "./world";

export const DIR2GER: Record<string, string> = {
    "N": "Nord",
    "E": "Ost",
    "S": "Süden",
    "W": "Westen"
}

export const DIR2SHORTGER: Record<string, string> = {
    "N": "N",
    "E": "O",
    "S": "S",
    "W": "W"
}

export function declareRobot(r: Robot, varname: string, env: GlobalEnvironment): void {
    const karol_env = new VarHolder();
    const robot: RuntimeVal = {
        type: "object",
        cls: env.robotClass,
        ownMembers: karol_env,
    };

    // add robot to environment
    env.declareVar(varname, robot, true);
    // declare its properties
    karol_env.declareVar(KW.ROBOT.METHODS.GET_X, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.GET_X + `() erwartet keine Parameter!`);
            return MK_NUMBER(r.pos.x);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.GET_Y, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.GET_Y + `() erwartet keine Parameter!`);
            return MK_NUMBER(r.pos.y);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.GET_DIR, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.GET_DIR + `() erwartet keine Parameter!`);
            return MK_STRING(DIR2SHORTGER[r.dir]);
        }
    ), true);
    
    karol_env.declareVar(KW.ROBOT.METHODS.STEP, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.STEP + `() erwartet keine Parameter!`);
            r.step();
            return MK_STRING(`Schritt nach: ( ${r.pos.x} | ${r.pos.y} )`);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.TURN_LEFT, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.TURN_LEFT + `() erwartet keine Parameter!`);
            r.turnLeft();
            return MK_STRING("Gedreht nach: " + DIR2GER[r.dir]);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.TURN_RIGHT, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.TURN_RIGHT + `() erwartet keine Parameter!`);
            r.turnRight();
            return MK_STRING("Gedreht nach: " + DIR2GER[r.dir]);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.PLACE_BLOCK, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length > 1)
                throw new RuntimeError(KW.ROBOT.METHODS.PLACE_BLOCK + `() erwartet einen oder keine Parameter!`);
            let col = "R";
            if (args.length == 1) {
                if (args[0].type != "string") throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                col = args[0].value;
            }
            r.placeBlock(CHAR2BLOCK[col.toLowerCase()]);
            return MK_STRING(`Schritt nach: ( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.PICKUP_BLOCK, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.PICKUP_BLOCK + `() erwartet keine Parameter!`);
            r.pickUpBlock();
            return MK_STRING(`Schritt nach: ( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.SET_MARKER, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length > 1)
                throw new RuntimeError(KW.ROBOT.METHODS.SET_MARKER + `() erwartet einen oder keine Parameter, z.B. markSetzen(blau)!`);
            let col = "Y";
            if (args.length == 1) {
                if (args[0].type != "string") throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                col = args[0].value;
            }
            r.setMarker(CHAR2MARKER[col]);
            return MK_STRING(`Schritt nach: ( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.REMOVE_MARKER, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.REMOVE_MARKER + `() erwartet keine Parameter!`);
            r.removeMarker();
            return MK_STRING(`Schritt nach: ( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.IS_ON_MARKER, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length > 1)
                throw new RuntimeError(KW.ROBOT.METHODS.IS_ON_MARKER +`() erwartet einen oder keine Parameter, z.B. istAufMarke(blau)!`);
            if (args.length == 1) {
                if (args[0].type != "string") throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                const col = args[0].value;
                return MK_BOOL(r.isOnMarker(CHAR2MARKER[col]));
            } else {
                return MK_BOOL(r.isOnMarker());
            }
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.SEES_BLOCK, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length > 1)
                throw new RuntimeError(KW.ROBOT.METHODS.SEES_BLOCK + `() erwartet einen oder keine Parameter, z.B. siehtZiegel(blau)!`);
            if (args.length == 1) {
                if (args[0].type != "string") throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                const col = args[0].value;
                return MK_BOOL(r.seesBlock(CHAR2BLOCK[col.toLowerCase()]));
            } else {
                return MK_BOOL(r.seesBlock());
            }
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.SEES_WALL, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.SEES_WALL + `() erwartet keine Parameter!`);
            return MK_BOOL(r.seesWall());
        }
    ), true);

    karol_env.declareVar(KW.ROBOT.METHODS.SEES_VOID, MK_NATIVE_FN(
        (args, scope) => {
            if (args.length != 0)
                throw new RuntimeError(KW.ROBOT.METHODS.SEES_VOID + `() erwartet keine Parameter!`);
            return MK_BOOL(r.seesVoid());
        }
    ), true);
}

export class Robot {
    pos: Vec2;
    moveH: number;
    dir: string;
    name: string;
    index: number;
    world: World;

    constructor(x: number, y: number, dir: string, name = "Karol", index: number, w: World) {
        this.pos = new Vec2(x, y);
        this.moveH = 0.0;
        if (!["N", "E", "S", "W"].includes(dir))
            throw new RuntimeError(`${name}: '${dir}' ist keine valide Richtung!`);
        this.dir = dir;
        this.name = name;
        this.index = index;
        this.world = w;
    }

    dir2Vec(): Vec2 {
        switch (this.dir) {
            case "N":
                return new Vec2(0, -1);
            case "S":
                return new Vec2(0, 1);
            case "W":
                return new Vec2(-1, 0);
            case "E":
                return new Vec2(1, 0);
        }
        this.dir = "N";
        return new Vec2(0, 1);
    }

    dir2Angle(): number {
        switch (this.dir) {
            case "N":
                return 180;
            case "S":
                return 0;
            case "W":
                return 90;
            case "E":
                return 270;
        }
        this.dir = "N";
        return 180;
    }

    turnRight() {
        switch (this.dir) {
            case "N":
                this.dir = "E"
                break;
            case "E":
                this.dir = "S"
                break;
            case "S":
                this.dir = "W"
                break;
            case "W":
                this.dir = "N"
                break;
        }
        return this.dir;
    }

    turnLeft() {
        for(let i = 0; i < 3; i++) {
            this.turnRight()
        }
        return this.dir;
    }

    step() {
        const target = this.targetPos();
        if (this.canMoveTo(target)) {
            this.pos = target;
        }
    }

    placeBlock(t: BlockType = BlockType.r) {
        const target = this.targetPos();
        const field = this.world.getField(target.x, target.y);
        if (this.canPlaceAt(field)) {
            field.addBlock(t);
        }
    }

    pickUpBlock() {
        const target = this.targetPos();
        const field = this.world.getField(target.x, target.y);
        if (this.canPickUpFrom(field)) {
            field.removeBlock();
        }
    }

    setMarker(m: MarkerType = MarkerType.Y) {
        const target = this.pos;
        const field = this.world.getField(target.x, target.y);
        if (this.canMarkAt(field)) {
            field.setMarker(m);
        }
    }

    removeMarker() {
        const target = this.pos;
        const field = this.world.getField(target.x, target.y);
        if (this.canUnmarkAt(field)) {
            field.removeMarker();
        }
    }

    isOnMarker(m: MarkerType | null = null): boolean {
        const target = this.pos;
        try {
            const field = this.world.getField(target.x, target.y)!;
            if (m == null) {
                if (field.marker != MarkerType.None) return true
                return false;
            }
            if (field.marker == m) return true;
            return false
        } catch {
            return false;
        }
    }

    seesBlock(b: BlockType | null = null) {
        const target = this.targetPos();
        try {
            const field = this.world.getField(target.x, target.y)!;
            if (b == null) {
                if (field.blocks.length >= 1) return true;
                return false;
            }
            if (field.blocks[field.blocks.length - 1] == b) return true;
            return false;
        } catch {
            return false;
        }
    }

    seesWall() {
        const target = this.targetPos();
        return this.isWall(target);
    }

    seesVoid() {
        const target = this.targetPos();
        return this.isEmpty(target);
    }

    // utils
    targetPos() {
        const dirVec = this.dir2Vec();
        const target = this.pos.add(dirVec);

        return target;
    }

    isWall(target: Vec2): boolean {
        const targetField = this.world.getField(target.x, target.y);
        if (!targetField) return true;
        if (targetField.isWall) return true
        return false;
    }

    isEmpty(target: Vec2): boolean {
        const targetField = this.world.getField(target.x, target.y);
        if (!targetField) return true;
        if (targetField.isEmpty) return true;
        return false
    }

    canMoveTo(target: Vec2): boolean {
        // if there is a world with other robots, etc.
        // check if this robot is legally positioned
        const currentField = this.world.getField(this.pos.x, this.pos.y);
        if (!currentField) throw new RuntimeError(`${this.name}: Illegale Position!`);
        // check if target field isn't accessible
        const targetField = this.world.getField(target.x, target.y);
        if (!targetField) throw new RuntimeError(`${this.name}: Dieses Feld existiert nicht!`);
        if (currentField.getBlockHeight() < targetField.getBlockHeight() - 1) throw new RuntimeError(`${this.name}: Kann diese Höhe hicht überwinden!`);
        if (targetField.isEmpty) throw new RuntimeError(`${this.name}: Kann nicht ins Nichts laufen!`);
        if (targetField.isWall) throw new RuntimeError(`${this.name}: Kann nicht gegen die Wand laufen!`);
        // check if robot is in the way
        const targetRobot = this.world.getRobotAt(target.x, target.y);
        if (targetRobot) throw new RuntimeError(`${this.name}: Roboter '${targetRobot.name}' ist im Weg!`);
        return true
    }

    canPlaceAt(targetField: Field | undefined): targetField is Field {
        // check if target field isn't accessible
        if (!targetField) throw new RuntimeError(`${this.name}: Dieses Feld existiert nicht!`);
        if (targetField.isEmpty) throw new RuntimeError(`${this.name}: Kann Blöcke nicht ins Nichts legen!`);
        if (targetField.isWall) throw new RuntimeError(`${this.name}: Kann Blöcke nicht auf Wände legen!`);
        if (targetField.blocks.length >= targetField.H) throw new RuntimeError(`${this.name}: Kann keinen Block mehr legen, da es keinen Platz mehr gibt!`);
        return true;
    }

    canPickUpFrom(targetField: Field | undefined): targetField is Field {
        // check if target field isn't accessible
        if (!targetField) throw new RuntimeError(`${this.name}: Dieses Feld existiert nicht!`);
        if (targetField.isEmpty) throw new RuntimeError(`${this.name}: Kann Blöcke nicht aus dem Nichts aufheben!`);
        if (targetField.isWall) throw new RuntimeError(`${this.name}: Kann Wände nicht aufheben!`);
        if (targetField.blocks.length == 0) throw new RuntimeError(`${this.name}: Kann keinen Block aufheben, weil hier keiner liegt!`);
        return true;
    }

    canMarkAt(targetField: Field | undefined): targetField is Field {
        // check if target field isn't accessible
        if (!targetField) throw new RuntimeError(`${this.name}: Dieses Feld existiert nicht!`);
        if (targetField.isEmpty) throw new RuntimeError(`${this.name}: Kann Marker nicht ins Nichts legen!`);
        if (targetField.isWall) throw new RuntimeError(`${this.name}: Kann Marker nicht auf Wände legen!`);
        return true;
    }

    canUnmarkAt(targetField: Field | undefined): targetField is Field {
        // check if target field isn't accessible
        if (!targetField) throw new RuntimeError(`${this.name}: Dieses Feld existiert nicht!`);
        if (targetField.isEmpty) throw new RuntimeError(`${this.name}: Kann Marker nicht im Nichts entfernen!`);
        if (targetField.isWall) throw new RuntimeError(`${this.name}: Kann Marker nicht von Wände entfernen!`);
        return true;
    }
}

// export const karol = new Robot(1, 1, "N", "Karol1", null);
// export const karol2 = new Robot(1, 2, "S", "Karol2", null);