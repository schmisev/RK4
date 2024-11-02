import { RuntimeError } from "../errors";
import { ClassPrototype, GlobalEnvironment, VarHolder } from "../language/runtime/environment";
import { MK_BOOL, MK_STRING, MK_NUMBER, RuntimeVal, BuiltinClassVal, ObjectVal, MK_NATIVE_METHOD, ValueAlias } from "../language/runtime/values";
import { ENV } from "../spec";
import { easeInOutQuad, toZero, Vec2 } from "../utils";
import { BlockType, CHAR2BLOCK, CHAR2MARKER, Field, MarkerType, World } from "./world";

export enum ThoughtType {
    Nothing,
    Wall,
    Block,
    Void,
    RedBlock,
    GreenBlock,
    BlueBlock,
    YellowBlock,
    RedMarker,
    GreenMarker,
    BlueMarker,
    YellowMarker,
    Place,
    Pickup,
    Mark,
    Remove,
    Robot,
}

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

interface RobotObjVal extends ObjectVal {
    r: Robot,
}

export function declareRobotClass(env: GlobalEnvironment): BuiltinClassVal {
    const prototype = new ClassPrototype();
    const robotCls: BuiltinClassVal = {
        type: ValueAlias.Class,
        name: "Roboter",
        internal: true,
        prototype,
    };

    function downcastRoboter(self: ObjectVal): asserts self is RobotObjVal {
        if (!Object.is(self.cls, robotCls))
            throw new RuntimeError(`Diese Methode kann nur auf Robotern ausgeführt werden.`);
    }
    function mkRobotMethod(name: string, m: (r: Robot, args: RuntimeVal[]) => RuntimeVal) {
        prototype.declareMethod(name, MK_NATIVE_METHOD(name, function (args) {
            downcastRoboter(this);
            return m(this.r, args);
        }))
    }

    mkRobotMethod(
        ENV.robot.mth.GET_X,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.GET_X + `() erwartet keine Parameter!`);
            return MK_NUMBER(r.pos.x);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.GET_Y,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.GET_Y + `() erwartet keine Parameter!`);
            return MK_NUMBER(r.pos.y);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.GET_DIR,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.GET_DIR + `() erwartet keine Parameter!`);
            return MK_STRING(DIR2SHORTGER[r.dir]);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.GET_HEIGHT,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.GET_HEIGHT + `() erwartet keine Parameter!`);
            const field = r.world.getField(r.pos.x, r.pos.y)!;
            return MK_NUMBER(field.blocks.length);
        }
    );
    
    mkRobotMethod(
        ENV.robot.mth.STEP,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.STEP + `() erwartet keine Parameter!`);
            r.step();
            return MK_STRING(`( ${r.pos.x} | ${r.pos.y} )`);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.TURN_LEFT,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.TURN_LEFT + `() erwartet keine Parameter!`);
            r.turnLeft();
            return MK_STRING(DIR2GER[r.dir]);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.TURN_RIGHT,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.TURN_RIGHT + `() erwartet keine Parameter!`);
            r.turnRight();
            return MK_STRING(DIR2GER[r.dir]);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.PLACE_BLOCK,
        (r, args) => {
            if (args.length > 1)
                throw new RuntimeError(ENV.robot.mth.PLACE_BLOCK + `() erwartet einen oder keine Parameter!`);
            let col = "R";
            if (args.length == 1) {
                if (args[0].type != ValueAlias.String) throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                col = args[0].value;
            }
            r.placeBlock(CHAR2BLOCK[col.toLowerCase()]);
            return MK_STRING(`( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.PICKUP_BLOCK,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.PICKUP_BLOCK + `() erwartet keine Parameter!`);
            const pickedBlock = r.pickUpBlock();
            if (pickedBlock == undefined)
                throw new RuntimeError("Irgendetwas ist schiefgegangen...");
            return MK_STRING(pickedBlock);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.SET_MARKER,
        (r, args) => {
            if (args.length > 1)
                throw new RuntimeError(ENV.robot.mth.SET_MARKER + `() erwartet einen oder keine Parameter, z.B. markSetzen(blau)!`);
            let col = "Y";
            if (args.length == 1) {
                if (args[0].type != ValueAlias.String) throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                col = args[0].value;
            }
            r.setMarker(CHAR2MARKER[col]);
            return MK_STRING(`( ${r.targetPos().x} | ${r.targetPos().y} )`);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.REMOVE_MARKER,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.REMOVE_MARKER + `() erwartet keine Parameter!`);
            const removedMarker = r.removeMarker();
            if (removedMarker == undefined)
                throw new RuntimeError("Irgendetwas ist schiefgegangen...");
            return MK_STRING(removedMarker);
        }
    );

    mkRobotMethod(
        ENV.robot.mth.IS_ON_MARKER,
        (r, args) => {
            if (args.length > 1)
                throw new RuntimeError(ENV.robot.mth.IS_ON_MARKER +`() erwartet einen oder keine Parameter, z.B. istAufMarke(blau)!`);
            if (args.length == 1) {
                if (args[0].type != ValueAlias.String) throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                const col = args[0].value;
                return MK_BOOL(r.isOnMarker(CHAR2MARKER[col]));
            } else {
                return MK_BOOL(r.isOnMarker());
            }
        }
    );

    mkRobotMethod(
        ENV.robot.mth.SEES_BLOCK,
        (r, args) => {
            if (args.length > 1)
                throw new RuntimeError(ENV.robot.mth.SEES_BLOCK + `() erwartet einen oder keine Parameter, z.B. siehtZiegel(blau)!`);
            if (args.length == 1) {
                if (args[0].type != ValueAlias.String) throw new RuntimeError("Erwarte 'gelb', 'blau', 'rot' oder 'grün' als Parameter!");
                const col = args[0].value;
                return MK_BOOL(r.seesBlock(CHAR2BLOCK[col.toLowerCase()]));
            } else {
                return MK_BOOL(r.seesBlock());
            }
        }
    );

    mkRobotMethod(
        ENV.robot.mth.SEES_WALL,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.SEES_WALL + `() erwartet keine Parameter!`);
            return MK_BOOL(r.seesWall());
        }
    );

    mkRobotMethod(
        ENV.robot.mth.SEES_VOID,
        (r, args) => {
            if (args.length != 0)
                throw new RuntimeError(ENV.robot.mth.SEES_VOID + `() erwartet keine Parameter!`);
            return MK_BOOL(r.seesVoid());
        }
    );

    mkRobotMethod(
        ENV.robot.mth.SEES_ROBOT,
        (r, args) => {
            if (args.length > 1)
                throw new RuntimeError(ENV.robot.mth.SEES_ROBOT + `() erwartet einen oder keinen Parameter!`);
            if (args.length == 1) {
                if (args[0].type != ValueAlias.Number) throw new RuntimeError(`Erwarte eine Zahl als Parameter!`);
                return MK_BOOL(r.seesRobot(args[0].value));
            }
            else return MK_BOOL(r.seesRobot(null));
        }
    );

    mkRobotMethod(
        ENV.robot.mth.CAN_MOVE_HERE,
        (r, args) => {
            if (args.length > 0)
                throw new RuntimeError(ENV.robot.mth.CAN_MOVE_HERE + `() erwartet keine Parameter!`);
            try {
                r.canMoveTo(r.targetPos());
                return MK_BOOL(true);
            } catch {
                return MK_BOOL(false);
            }
        }
    );

    return robotCls;
}

export function declareRobot(r: Robot, varname: string, env: GlobalEnvironment): void {
    const karol_env = new VarHolder();
    const robot: RobotObjVal = {
        type: ValueAlias.Object,
        cls: env.robotClass,
        ownMembers: karol_env,
        r,
    };

    // add robot to environment
    env.declareVar(varname, robot, true);
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

        // animation state
        this.animLastPos = new Vec2(x, y);
        this.animCurrRot = this.dir2Angle();
        this.animLastRot = this.dir2Angle();
        this.animLastHeight = this.world.H;
        this.animCurrHeight = 0;
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
        // animation
        this.triggerRotAnim();
        return this.dir;
    }

    turnLeft() {
        switch (this.dir) {
            case "N":
                this.dir = "W"
                break;
            case "E":
                this.dir = "N"
                break;
            case "S":
                this.dir = "E"
                break;
            case "W":
                this.dir = "S"
                break;
        }
        /*
        for(let i = 0; i < 3; i++) {
            this.turnRight()
        }
        */
        // animation
        this.triggerRotAnim();
        return this.dir;
    }

    step() {
        // animation
        this.triggerHopAnim();
        // logic
        const target = this.targetPos();
        if (this.canMoveTo(target)) {
            // this is kinda hacky right now
            const currentField = this.world.getField(this.pos.x, this.pos.y);
            if (currentField)
                currentField.wasChanged = true;
            const targetField = this.world.getField(target.x, target.y);
            if (targetField)
                targetField.wasChanged = true;
            // the actual movement
            this.pos = target;
        }
    }

    placeBlock(t: BlockType = BlockType.r) {
        const target = this.targetPos();
        const field = this.world.getField(target.x, target.y);
        if (this.canPlaceAt(field)) {
            // animation
            this.triggerPlaceAnim(-1);
            this.triggerThoughtAnim(true, ThoughtType.Place);
            field.addBlock(t);
        }
    }

    pickUpBlock() {
        const target = this.targetPos();
        const field = this.world.getField(target.x, target.y);
        if (this.canPickUpFrom(field)) {
            // animation
            this.triggerPlaceAnim(1);
            this.triggerThoughtAnim(true, ThoughtType.Pickup);
            return field.removeBlock();
        }
    }

    setMarker(m: MarkerType = MarkerType.Y) {
        const target = this.pos;
        const field = this.world.getField(target.x, target.y);
        if (this.canMarkAt(field)) {
            this.triggerMarkerAnim(false);
            this.triggerThoughtAnim(true, ThoughtType.Mark);
            field.setMarker(m);
        }
    }

    removeMarker() {
        const target = this.pos;
        const field = this.world.getField(target.x, target.y);
        if (this.canUnmarkAt(field)) {
            // animation
            this.triggerMarkerAnim(false);
            this.triggerThoughtAnim(true, ThoughtType.Remove);
            return field.removeMarker();
        }
    }

    isOnMarker(m: MarkerType | null = null): boolean {
        // logic
        const target = this.pos;

        let check = false;
        try {
            const field = this.world.getField(target.x, target.y)!;
            if (m == null) {
                if (field.marker != MarkerType.None) check = true
                else check = false;
            }
            else if (field.marker == m) check = true;
            else check = false
        } catch {
            check = false;
        }
        // animation
        let thought: ThoughtType;
        if (!m) thought = ThoughtType.YellowMarker;
        else {
            switch (m) {
                case MarkerType.R:
                    thought = ThoughtType.RedMarker;
                    break;
                case MarkerType.G:
                    thought = ThoughtType.GreenMarker;
                    break;
                case MarkerType.B:
                    thought = ThoughtType.BlueMarker;
                    break;
                case MarkerType.Y:
                    thought = ThoughtType.YellowMarker;
                    break;
            }
        }
        this.triggerThoughtAnim(check, thought);
        // exit
        return check;
    }

    seesBlock(b: BlockType | null = null) {
        // logic
        const target = this.targetPos();
        
        let check = false;
        try {
            const field = this.world.getField(target.x, target.y)!;
            if (b == null) {
                if (field.blocks.length >= 1) check = true;
                else check = false;
            }
            else if (field.blocks[field.blocks.length - 1] == b) check = true;
            else check = false;
        } catch {
            check = false;
        }

        // animation trigger
        this.triggerWatchAnim(check);
        let thought: ThoughtType;
        if (!b) thought = ThoughtType.RedBlock;
        else {
            switch (b) {
                case BlockType.r:
                    thought = ThoughtType.RedBlock;
                    break;
                case BlockType.g:
                    thought = ThoughtType.GreenBlock;
                    break;
                case BlockType.b:
                    thought = ThoughtType.BlueBlock;
                    break;
                case BlockType.y:
                    thought = ThoughtType.YellowBlock;
                    break;
            }
        }
        this.triggerThoughtAnim(check, thought);
        // exit
        return check;
    }

    seesWall() {
        // logic
        const target = this.targetPos();
        const check = this.isWall(target);
        // animation trigger
        this.triggerWatchAnim(check);
        this.triggerThoughtAnim(check, ThoughtType.Wall);
        return check;
    }

    seesVoid() {
        // logic
        const target = this.targetPos();
        const check = this.isEmpty(target);
        // animation trigger
        this.triggerWatchAnim(check);
        this.triggerThoughtAnim(check, ThoughtType.Void);
        return check;
    }

    seesRobot(index: number | null) {
        // logic
        let check = false;
        const target = this.targetPos();
        for (const r of this.world.robots) {
            if (r.index != this.index && r.pos.x == target.x && r.pos.y == target.y) {
                if (index == null || r.index == index) {
                    check = true;
                    break;
                }
            }
        }
        // animation
        this.triggerWatchAnim(check);
        this.triggerThoughtAnim(check, ThoughtType.Robot);
        return check;
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
        if (currentField.getBlockHeight() > targetField.getBlockHeight() + 1) throw new RuntimeError(`${this.name}: Kann diese Höhe hicht überwinden!`);
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

    /**
     * Animation
     * 
     * anim_Prog (progress) variables are timers that count down from 1.0 to 0.0.
     * During this time, the associated animation is active.
     * 
     * prepare() updates the robot state FROM an external source,
     * in this case robot-view.ts
     * animate() updates the timers
     */
    animLastPos: Vec2;
    animCurrRot: number;
    animLastRot: number;
    animCurrHeight: number;
    animLastHeight: number;
    animThoughtProg: number = 0.0;
    animThoughtType: ThoughtType = ThoughtType.Void;
    animThoughtCond: boolean = true;
    animWatchCond: boolean = false;
    animWatchProg: number = 0.0;
    animHopProg: number = 0.0;
    animFallProg: number = 0.0;
    animRotProg: number = 0.0;
    animPlaceProg: number = 0.0;
    animPlaceDir: number = 1; // picking up (+1) or setting down (-1)
    animRotRnd: number = 0.0;
    animBlinkProg: number = 0.0;
    animMarkerProg: number = 0.0;
    animMarkerCond: boolean = false; // false is "remove"

    interpHop: number = 0;
    interpFall: number = 0;
    interpRot: number = 0;

    prepare(fieldHeight: number): void {
        // update height
        if (this.animCurrHeight != fieldHeight) {
            this.animCurrHeight = fieldHeight;
            if (this.animCurrHeight != this.animLastHeight) this.triggerFallAnim();
        }
        // trigger falls
        if (this.animFallProg <= 0 || Math.abs(this.animCurrHeight - this.animLastHeight) > 1)
            this.animLastHeight = this.animCurrHeight;
        // auto blink
        if (this.animBlinkProg == 0 && Math.random() < 0.001) {
            this.triggerBlinkAnim();
        }
        // auto reset view
        if (this.animThoughtProg <= 0) this.animThoughtType = ThoughtType.Nothing;
    }

    animate(deltaProg: number, delta: number): void {
        // update progress variables
        this.animWatchProg = toZero(this.animWatchProg, deltaProg);
        this.animHopProg = toZero(this.animHopProg, deltaProg);
        this.animFallProg = toZero(this.animFallProg, deltaProg * 2);
        this.animRotProg = toZero(this.animRotProg, deltaProg);
        this.animPlaceProg = toZero(this.animPlaceProg, deltaProg);
        this.animMarkerProg = toZero(this.animMarkerProg, deltaProg);
        // real time
        this.animThoughtProg = toZero(this.animThoughtProg, deltaProg * 0.5);
        this.animBlinkProg = toZero(this.animBlinkProg, 0.005 * delta);
        // interps
        this.interpHop = easeInOutQuad(1 - this.animHopProg);
        this.interpFall = 1 - this.animFallProg;
        this.interpRot = easeInOutQuad(1 - this.animRotProg);
    }

    triggerWatchAnim(condition: boolean) {
        this.animWatchProg = 1.0;
        this.animWatchCond = condition;
    }

    triggerHopAnim() {
        this.animHopProg = 1.0;
        this.animLastPos.x = this.pos.x;
        this.animLastPos.y = this.pos.y;
        this.animRotRnd = 5 * (1 - 2 * Math.random()); // in degrees
    }

    triggerRotAnim() {
        this.animRotProg = 1.0;
        this.animLastRot = this.animCurrRot;
        this.animCurrRot = this.dir2Angle();

        // making sure the rotation will alsways be < 360 degrees
        const rotDiff = this.animCurrRot - this.animLastRot;
        if (Math.abs(rotDiff) > 180) {
            if (rotDiff > 0) this.animLastRot += 360;
            else this.animLastRot -= 360;
        }
    }

    triggerPlaceAnim(dir: number) {
        this.animPlaceProg = 1.0;
        this.animPlaceDir = dir;
    }

    triggerFallAnim() {
        this.animFallProg = 1.0;
    }

    triggerBlinkAnim() {
        this.animBlinkProg = 1.0;
    }

    triggerMarkerAnim(condition: boolean) {
        this.animMarkerProg = 1.0
        this.animMarkerCond = condition;
    }

    triggerThoughtAnim(condition: boolean, type: ThoughtType) {
        this.animThoughtProg = 1.0;
        this.animThoughtCond = condition;
        this.animThoughtType = type;
    }
}