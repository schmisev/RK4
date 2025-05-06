import { RuntimeError } from "../../errors";
import { declareRobotClass } from "../../robot/robot";
import { declareWorldClass } from "../../robot/world";
import { ENV } from "../../spec";
import { formatValue } from "../../utils";
import { Trampoline, jump, jumpAround, jumpBind, land } from "./trampoline";
import {
    BuiltinClassVal,
    ClassVal,
    MK_FLOAT,
    MK_STRING,
    MethodVal,
    NativeGetterVal,
    NativeMethodVal,
    NumberLikeVal,
    ObjectVal,
    ValueAlias,
    isLikeNumber,
} from "./values";
import {
    MK_BOOL,
    MK_NATIVE_FN,
    MK_NULL,
    MK_NUMBER,
    RuntimeVal,
} from "./values";

export interface GlobalEnvironment extends Environment {
    // global env holds some special values that we don't want to lookup by name
    readonly robotClass: ClassVal;
    readonly worldClass: ClassVal;
}

export function declareGlobalEnv(): GlobalEnvironment {
    class GlobalEnvironment extends Environment {
        private _robotClass: BuiltinClassVal = declareRobotClass(this);
        private _worldClass: BuiltinClassVal = declareWorldClass(this);
        get robotClass() {
            return this._robotClass;
        }
        get worldClass() {
            return this._worldClass;
        }
    }
    const env = new GlobalEnvironment();
    env.declareVar(ENV.global.const.TRUE, MK_BOOL(true), true);
    env.declareVar(ENV.global.const.FALSE, MK_BOOL(false), true);
    env.declareVar(ENV.global.const.NULL, MK_NULL(), true);
    env.declareVar(ENV.global.const.YELLOW, MK_STRING("Y"), true);
    env.declareVar(ENV.global.const.RED, MK_STRING("R"), true);
    env.declareVar(ENV.global.const.GREEN, MK_STRING("G"), true);
    env.declareVar(ENV.global.const.BLUE, MK_STRING("B"), true);

    env.declareVar(
        ENV.global.fn.RANDOM_NUMBER,
        MK_NATIVE_FN(ENV.global.fn.RANDOM_NUMBER, (args) => {
            let r = 0;
            let b = 0;
            if (args.length == 0) {
                r = 1;
            } else if (args.length <= 2) {
                let v1 = args[0];
                if (v1.type !== ValueAlias.Number)
                    throw new RuntimeError(
                        `Erwarte mindestens Zahl als Parameter, nicht '${args[0].type}'!`
                    );
                r = v1.value;

                if (args.length == 2) {
                    let v2 = args[1];
                    if (v2.type !== ValueAlias.Number)
                        throw new RuntimeError(
                            `Erwarte zwei (Komma-)zahlen als Parameter, nicht '${args[0].type}' und '${args[1].type}'!`
                        );
                    r = v2.value - v1.value;
                    b = v1.value;
                }
            } else throw new RuntimeError(`Zu viele Parameter!`);

            const n = b + Math.floor(Math.random() * r);
            return MK_NUMBER(n);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.RANDOM_FLOAT,
        MK_NATIVE_FN(ENV.global.fn.RANDOM_FLOAT, (args) => {
            let r = 0;
            let b = 0;
            if (args.length == 0) {
                r = 1;
            } else if (args.length <= 2) {
                let v1 = args[0];
                if (!isLikeNumber(v1))
                    throw new RuntimeError(
                        `Erwarte mindestens (Komma-)zahl als Parameter, nicht '${args[0].type}'!`
                    );
                r = v1.value;

                if (args.length == 2) {
                    let v2 = args[1];
                    if (!isLikeNumber(v2))
                        throw new RuntimeError(
                            `Erwarte zwei (Komma-)zahlen als Parameter, nicht '${args[0].type}' und '${args[1].type}'!`
                        );
                    r = v2.value - v1.value;
                    b = v1.value;
                }
            } else throw new RuntimeError(`Zu viele Parameter!`);

            const n = b + Math.random() * r;
            return MK_FLOAT(n);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.LENGTH,
        MK_NATIVE_FN(ENV.global.fn.LENGTH, (args) => {
            if (args.length != 1)
                throw new RuntimeError(`Erwarte genau eine Liste als Eingabe!`);
            if (args[0].type != ValueAlias.List)
                throw new RuntimeError(`Erwarte eine Liste als Eingabe!`);
            return MK_NUMBER(args[0].elements.length);
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.TO_TEXT,
        MK_NATIVE_FN(ENV.global.fn.TO_TEXT, (args) => {
            if (args.length != 1)
                throw new RuntimeError(`Erwarte genau einen Eingabewert!`);
            return MK_STRING(formatValue(args[0]));
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.JOIN,
        MK_NATIVE_FN(ENV.global.fn.JOIN, (args) => {
            if (args.length == 0) return MK_STRING("");
            if (args[0].type != ValueAlias.String)
                throw new RuntimeError("Erwarte einen Text als erste Eingabe!");
            const [sep, ...rest] = args;
            return MK_STRING(rest.map((v) => formatValue(v)).join(sep.value));
        }),
        true
    );

    env.declareVar(
        ENV.global.fn.TO_INT,
        MK_NATIVE_FN(ENV.global.fn.TO_INT, (args) => {
            if ((args.length === 0 || args.length > 1) || (args[0].type != ValueAlias.Number && args[0].type != ValueAlias.Float)) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            return MK_NUMBER(Math.trunc(args[0].value));
        })
    );

    env.declareVar(
        ENV.global.fn.TO_FLOAT,
        MK_NATIVE_FN(ENV.global.fn.TO_FLOAT, (args) => {
            if ((args.length === 0 || args.length > 1) || (args[0].type != ValueAlias.Number && args[0].type != ValueAlias.Float)) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            return MK_FLOAT(args[0].value);
        })
    );

    env.declareVar(
        ENV.global.fn.TRUNC,
        MK_NATIVE_FN(ENV.global.fn.TRUNC, (args) => {
            if ((args.length === 0 || args.length > 1) || args[0].type != ValueAlias.Float) throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.trunc(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.CEIL,
        MK_NATIVE_FN(ENV.global.fn.CEIL, (args) => {
            if ((args.length === 0 || args.length > 1) || args[0].type != ValueAlias.Float) throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.ceil(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.FLOOR,
        MK_NATIVE_FN(ENV.global.fn.FLOOR, (args) => {
            if ((args.length === 0 || args.length > 1) || args[0].type != ValueAlias.Float) throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.floor(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.ROUND,
        MK_NATIVE_FN(ENV.global.fn.ROUND, (args) => {
            if ((args.length === 0 || args.length > 1) || args[0].type != ValueAlias.Float) throw new RuntimeError("Erwarte eine Kommazahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.round(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.SIN,
        MK_NATIVE_FN(ENV.global.fn.SIN, (args) => {
            if ((args.length === 0 || args.length > 1) || !isLikeNumber(args[0])) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.sin(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.COS,
        MK_NATIVE_FN(ENV.global.fn.COS, (args) => {
            if ((args.length === 0 || args.length > 1) || !isLikeNumber(args[0])) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.cos(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.TAN,
        MK_NATIVE_FN(ENV.global.fn.TAN, (args) => {
            if ((args.length === 0 || args.length > 1) || !isLikeNumber(args[0])) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            let {value, type} = args[0];
            value = Math.tan(value);
            return MK_FLOAT(value);
        })
    );

    env.declareVar(
        ENV.global.fn.ABS,
        MK_NATIVE_FN(ENV.global.fn.ABS, (args) => {
            if ((args.length === 0 || args.length > 1)) throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
            let val = args[0];
            if (val.type === ValueAlias.Number) return MK_NUMBER(Math.abs(val.value));
            else if (val.type === ValueAlias.Float) return MK_FLOAT(Math.abs(val.value));
            else throw new RuntimeError("Erwarte eine (Komma-)zahl als Eingabe!");
        })
    );

    env.declareVar(ENV.robot.cls, env.robotClass, true);
    env.declareVar(ENV.world.cls, env.worldClass, true);
    return env;
}

interface ScopeMemberDefinition {
    get(): RuntimeVal;
    set(val: RuntimeVal): void;
}

export interface StaticScope {
    resolveVarImpl(
        varname: string
    ): Trampoline<ScopeMemberDefinition | undefined>;
}

export class VarHolder {
    private variables: Map<string, RuntimeVal> = new Map();
    private constants: Set<string> = new Set();

    declareVar(varname: string, value: RuntimeVal, constant = false) {
        if (this.variables.has(varname)) {
            throw new RuntimeError(
                `Kann die Variable '${varname}' nicht erzeugen, weil es sie schon gibt!`
            );
        }
        this.variables.set(varname, value);
        if (constant) {
            this.constants.add(varname);
        }
    }
    resolveVar(varname: string): ScopeMemberDefinition | undefined {
        if (!this.variables.has(varname)) return undefined;
        const isConstant = this.constants.has(varname);
        return {
            get: () => this.variables.get(varname)!,
            set: (val) => {
                if (isConstant)
                    throw new RuntimeError(
                        `Kann die Konstante '${varname}' nicht verändern!`
                    );
                this.variables.set(varname, val);
            },
        };
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

    public declareVar(
        varname: string,
        value: RuntimeVal,
        constant = false
    ): RuntimeVal {
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
        const varVal = varDef.get();
        if (varVal.type != value.type)
            throw new RuntimeError(
                `Eine Variable mit Typ '${varVal.type}' kann nicht auf '${value.type}' gesetzt werden.`
            );
        if (
            varVal.type == ValueAlias.Object &&
            value.type == ValueAlias.Object &&
            varVal.cls != value.cls
        )
            throw new RuntimeError(
                `Ein Objekt der Klasse '${varVal.cls.name}' kann nicht auf '${value.cls.name}' gesetzt werden.`
            );
        varDef.set(value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const varDef = this.resolveVar(varname);
        if (varDef === undefined)
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        return varDef.get();
    }

    public resolveVarImpl(
        varname: string
    ): Trampoline<ScopeMemberDefinition | undefined> {
        const ownVar = this._vars.resolveVar(varname);
        if (ownVar) return land(ownVar);
        if (!this._parent) return land(undefined);
        return jump(() => this._parent!.resolveVarImpl(varname));
    }
}

function resolveDynamicVar(
    receiver: ObjectVal,
    varname: string,
    fallback?: StaticScope
): Trampoline<ScopeMemberDefinition | undefined> {
    const ownVar = receiver.ownMembers.resolveVar(varname);
    if (ownVar !== undefined) return ownVar;
    return jumpBind(
        receiver.cls.prototype.resolveVarImpl(receiver, varname),
        (found) => {
            if (found !== undefined) return land(found);
            if (!fallback) return land(undefined);
            return fallback.resolveVarImpl(varname);
        }
    );
}

export class BoundDynamicScope implements StaticScope {
    private _parent: StaticScope;
    private _receiver: ObjectVal;

    constructor(parent: StaticScope, receiver: ObjectVal) {
        this._parent = parent;
        this._receiver = receiver;
    }

    public resolveVarImpl(
        varname: string
    ): Trampoline<ScopeMemberDefinition | undefined> {
        return resolveDynamicVar(this._receiver, varname, this._parent);
    }
}

export class ClassPrototype {
    private _methods: Map<string, MethodVal | NativeMethodVal | NativeGetterVal> = new Map();

    public declareMethod(name: string, method: MethodVal | NativeMethodVal | NativeGetterVal) {
        if (this._methods.has(name))
            throw new RuntimeError(`Die Methode '${name}' existiert schon!`);
        this._methods.set(name, method);
    }

    public lookupVar(receiver: ObjectVal, varname: string): RuntimeVal {
        const varDef = jumpAround(resolveDynamicVar(receiver, varname));
        if (varDef !== undefined) return varDef.get();
        throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
    }

    public assignVar(receiver: ObjectVal, varname: string, value: RuntimeVal) {
        const varDef = jumpAround(resolveDynamicVar(receiver, varname));
        if (varDef === undefined)
            throw new RuntimeError(`Variablenname nicht gefunden: ${varname}`);
        const varVal = varDef.get();
        if (varVal.type != value.type)
            throw new RuntimeError(
                `Eine Variable mit Typ '${varVal.type}' kann nicht auf '${value.type}' gesetzt werden.`
            );
        if (
            varVal.type == ValueAlias.Object &&
            value.type == ValueAlias.Object &&
            varVal.cls != value.cls
        )
            throw new RuntimeError(
                `Ein Objekt der Klasse '${varVal.cls.name}' kann nicht auf '${value.cls.name}' gesetzt werden.`
            );
        varDef.set(value);
    }

    resolveVarImpl(
        receiver: ObjectVal,
        varname: string
    ): Trampoline<ScopeMemberDefinition | undefined> {
        const method = this._methods.get(varname);
        if (method !== undefined) {
            return land({
                get: () => {
                    if (method.type === ValueAlias.Method)
                        return {
                            type: ValueAlias.Function,
                            body: method.body,
                            name: method.name,
                            params: method.params,
                            declenv: new BoundDynamicScope(
                                method.declenv,
                                receiver
                            ),
                        };
                    else if (method.type === ValueAlias.NativeGetter)
                        return method.call.bind(receiver)(); // return underlying value
                    else if (method.type === ValueAlias.NativeMethod)
                        return {
                            type: ValueAlias.NativeFunction,
                            name: method.name,
                            call: method.call.bind(receiver),
                        };
                    // unreachable!
                    return method satisfies never;
                },
                set: (_newVal) => {
                    if (method.type === ValueAlias.Method || method.type === ValueAlias.NativeMethod)
                        throw new RuntimeError(`Kann die Methode '${varname}' nicht überschreiben.`);
                    else if (method.type === ValueAlias.NativeGetter)
                        throw new RuntimeError(`Kann das Attribut '${varname}' nicht abändern.`);
                    throw new RuntimeError(
                        `Kann die Konstante '${varname}' nicht verändern!`
                    );
                },
            });
        }
        return land(undefined);
    }
}
