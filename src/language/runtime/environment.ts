import { robotSketch, robotView } from "../..";
import { RuntimeError } from "../../errors";
import { Trampoline, jump, jumpAround, jumpBind, land } from "./trampoline";
import { ClassVal, MK_STRING, MethodVal, ObjectVal } from "./values";
import { MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, RuntimeVal } from "./values";

export interface GlobalEnvironment extends Environment {
    // global env holds some special values that we don't want to lookup by name
    readonly robotClass: ClassVal;
    readonly worldClass: ClassVal;
}

export function declareGlobalEnv(): GlobalEnvironment {
    class GlobalEnvironment extends Environment {
        private _robotClass: ClassVal = {
            type: "class",
            name: "Roboter",
            attributes: [],
            declenv: this,
            prototype: new ClassPrototype(this),
        };
        private _worldClass: ClassVal = {
            type: "class",
            name: "World",
            attributes: [],
            declenv: this,
            prototype: new ClassPrototype(this),
        }
        get robotClass() { return this._robotClass }
        get worldClass() { return this._worldClass }
    }
    const env = new GlobalEnvironment();
    env.declareVar("wahr", MK_BOOL(true), true);
    env.declareVar("falsch", MK_BOOL(false), true);
    env.declareVar("nix", MK_NULL(), true);
    env.declareVar("gelb", MK_STRING("Y"), true);
    env.declareVar("rot", MK_STRING("R"), true);
    env.declareVar("grün", MK_STRING("G"), true);
    env.declareVar("blau", MK_STRING("B"), true);

    env.declareVar("zufallszahl", MK_NATIVE_FN(
        (args, scope) => {
            let r = 0;
            if (args.length == 0) {
                r = 100;
            } else if (args.length == 1) {
                if (args[0].type != "number")
                    throw new RuntimeError(`Erwarte eine Zahl als Parameter, nicht '${args[0].type}'!`);
                r = args[0].value;
            }
            const n = Math.round(Math.random() * r);
            return MK_NUMBER(n);
        }
    ), true);

    env.declareVar("linksGedrückt", MK_NATIVE_FN(
        (args, scope) => {
            return MK_BOOL(robotView.keyIsDown(robotView.LEFT_ARROW));
        }
    ), true);

    env.declareVar("rechtsGedrückt", MK_NATIVE_FN(
        (args, scope) => {
            return MK_BOOL(robotView.keyIsDown(robotView.RIGHT_ARROW));
        }
    ), true);

    env.declareVar("hochGedrückt", MK_NATIVE_FN(
        (args, scope) => {
            return MK_BOOL(robotView.keyIsDown(robotView.UP_ARROW));
        }
    ), true);

    env.declareVar("runterGedrückt", MK_NATIVE_FN(
        (args, scope) => {
            return MK_BOOL(robotView.keyIsDown(robotView.DOWN_ARROW));
        }
    ), true);

    env.declareVar("Roboter", env.robotClass, true);
    env.declareVar("World", env.worldClass, true);
    return env;
}

interface ScopeMemberDefinition {
    get(): RuntimeVal;
    set(val: RuntimeVal): void;
}

export interface StaticScope {
    resolveVarImpl(varname: string): Trampoline<ScopeMemberDefinition | undefined>;
}

export class VarHolder {
    private variables: Map<string, RuntimeVal> = new Map();
    private constants: Set<string> = new Set();

    declareVar(varname: string, value: RuntimeVal, constant = false) {
        if (this.variables.has(varname)) {
            throw new RuntimeError(`Kann die Variable '${varname}' nicht erzeugen, weil es sie schon gibt!`);
        }
        this.variables.set(varname, value);
        if (constant) {
            this.constants.add(varname);
        }
    }
    resolveVar(varname: string): ScopeMemberDefinition | undefined {
        if (!this.variables.has(varname))
            return undefined;
        const isConstant = this.constants.has(varname);
        return {
            get: () => this.variables.get(varname)!,
            set: (val) => {
                if (isConstant)
                    throw new RuntimeError(`Kann die Konstante '${varname}' nicht verändern!`);
                this.variables.set(varname, val);
            }
        }
    }
}

export class Environment implements StaticScope {
    private _parent?: StaticScope;
    private _vars: VarHolder;

    constructor(parentENV?: StaticScope) {
        this._parent = parentENV;
        this._vars = new VarHolder();
    }

    public isGlobal() {
        return this._parent ? false : true;
    }

    public declareVar(varname: string, value: RuntimeVal, constant = false): RuntimeVal {
        this._vars.declareVar(varname, value, constant);
        return value;
    }

    resolveVar(varname: string): ScopeMemberDefinition | undefined {
        return jumpAround(this.resolveVarImpl(varname));
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const varDef = this.resolveVar(varname);
        if (varDef === undefined)
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        varDef.set(value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const varDef = this.resolveVar(varname);
        if (varDef === undefined)
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        return varDef.get();
    }

    public resolveVarImpl(varname: string): Trampoline<ScopeMemberDefinition | undefined> {
        const ownVar = this._vars.resolveVar(varname);
        if (ownVar)
            return land(ownVar);
        if (!this._parent)
            return land(undefined);
        return jump(() => this._parent!.resolveVarImpl(varname));
    }
}

function resolveDynamicVar(receiver: ObjectVal, varname: string, fallback?: StaticScope): Trampoline<ScopeMemberDefinition | undefined> {
    const ownVar = receiver.ownMembers.resolveVar(varname);
    if (ownVar !== undefined)
        return ownVar;
    return jumpBind(receiver.cls.prototype.resolveVarImpl(receiver, varname), (found) => {
        if (found !== undefined)
            return land(found);
        if (!fallback)
            return land(undefined)
        return fallback.resolveVarImpl(varname);
    });
}

export class BoundDynamicScope implements StaticScope {
    private _parent: StaticScope;
    private _receiver: ObjectVal;

    constructor(parent: StaticScope, receiver: ObjectVal) {
        this._parent = parent;
        this._receiver = receiver;
    }

    public resolveVarImpl(varname: string): Trampoline<ScopeMemberDefinition | undefined> {
        return resolveDynamicVar(this._receiver, varname, this._parent)
    }
}

export class ClassPrototype {
    private _env: StaticScope;
    private _methods: Map<string, MethodVal> = new Map();

    constructor(declEnv: StaticScope) {
        this._env = declEnv;
    }

    public declareMethod(name: string, method: MethodVal) {
        if (this._methods.has(name))
            throw new RuntimeError(`Die Methode '${name}' existiert schon!`);
        this._methods.set(name, method);
    }

    public lookupVar(receiver: ObjectVal, varname: string): RuntimeVal {
        const varDef = jumpAround(resolveDynamicVar(receiver, varname));
        if (varDef !== undefined)
            return varDef.get();
        throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
    }

    public assignVar(receiver: ObjectVal, varname: string, value: RuntimeVal) {
        const varDef = jumpAround(resolveDynamicVar(receiver, varname));
        if (varDef === undefined)
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        varDef.set(value);
    }

    resolveVarImpl(receiver: ObjectVal, varname: string): Trampoline<ScopeMemberDefinition | undefined> {
        const method = this._methods.get(varname);
        if (method !== undefined) {
            return land({
                get: () => {
                    const declenv = new BoundDynamicScope(this._env, receiver);
                    return {
                        type: "function",
                        body: method.body,
                        name: method.name,
                        params: method.params,
                        declenv,
                    }
                },
                set: (_newVal) => {
                    throw new RuntimeError(`Kann die Konstante '${varname}' nicht verändern!`);
                }
            })
        }
        return land(undefined);
    }
}
