import { RuntimeError } from "../../errors";
import { jumpAround, Trampoline, land, jump, jumpBind } from "./trampoline";
import {
    MethodVal,
    NativeMethodVal,
    NativeGetterVal,
    ObjectVal,
    RuntimeVal,
    ValueAlias,
    BuiltinClassVal,
    MK_NATIVE_GETTER,
    MK_NATIVE_METHOD,
} from "./values";

export interface ScopeMemberDefinition {
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

    public instanceNativeObject<C>(
        clsName: string,
        args: RuntimeVal[]
    ): NativeObjectVal<C> {
        let cls = this.lookupVar(clsName);
        if (cls.type !== ValueAlias.Class)
            throw `'${clsName}' ist kein Klassenname!`;
        if (!cls.internal)
            throw `'${clsName}' ist keine interne Klasse und sollte nicht auf diesem Weg instaziiert werden.`;

        // this is a bit of a cheat.
        return instanceNativeObjectFromClass<C>(cls as BuiltinClassVal<C>, args);
    }

    public wrapNativeObject<C>(
        clsName: string,
        obj: C,
    ): NativeObjectVal<C> {
        let cls = this.lookupVar(clsName);
        if (cls.type !== ValueAlias.Class)
            throw `'${clsName}' ist kein Klassenname!`;
        if (!cls.internal)
            throw `'${clsName}' ist keine interne Klasse und sollte nicht auf diesem Weg instaziiert werden.`;
        
        const ownMembers = new VarHolder();
        const nativeObj: NativeObjectVal<C> = {
            type: ValueAlias.Object,
            cls,
            ownMembers,
            nativeRepr: obj,
        }

        return nativeObj;
    }
}

export function resolveDynamicVar(
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
    private _methods: Map<
        string,
        MethodVal | NativeMethodVal | NativeGetterVal
    > = new Map();

    public declareMethod(
        name: string,
        method: MethodVal | NativeMethodVal | NativeGetterVal
    ) {
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
                        return method.call.bind(receiver)();
                    // return underlying value
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
                    if (
                        method.type === ValueAlias.Method ||
                        method.type === ValueAlias.NativeMethod
                    )
                        throw new RuntimeError(
                            `Kann die Methode '${varname}' nicht überschreiben.`
                        );
                    else if (method.type === ValueAlias.NativeGetter)
                        throw new RuntimeError(
                            `Kann das Attribut '${varname}' nicht abändern.`
                        );
                    throw new RuntimeError(
                        `Kann die Konstante '${varname}' nicht verändern!`
                    );
                },
            });
        }
        return land(undefined);
    }
}

// General internal class declarations
export interface NativeObjectVal<C> extends ObjectVal {
    nativeRepr: C;
}
export function createInternalClass<C>({
    clsName,
    clsConstructor,
    clsMethods = {},
    clsAttributes = {},
}: {
    clsName: string;
    clsConstructor?: (args: RuntimeVal[]) => C;
    clsMethods?: Record<string, (self: C, args: RuntimeVal[]) => RuntimeVal>;
    clsAttributes?: Record<string, (self: C) => RuntimeVal>;
}) {
    const prototype = new ClassPrototype();
    const cls: BuiltinClassVal<C> = {
        type: ValueAlias.Class,
        name: clsName,
        internal: true,
        prototype,
        internalConstructor: clsConstructor,
    };

    function downcastClass(
        self: ObjectVal
    ): asserts self is NativeObjectVal<C> {
        if (!Object.is(self.cls, cls))
            throw new RuntimeError(
                `Diese Methode kann nur auf '${cls.name}' ausgeführt werden.`
            );
    }

    function mkClassMethod(
        name: string,
        m: (o: C, args: RuntimeVal[]) => RuntimeVal
    ) {
        prototype.declareMethod(
            name,
            MK_NATIVE_METHOD(name, function (args) {
                downcastClass(this);
                return m(this.nativeRepr, args);
            })
        );
    }

    function mkClassAttribute(name: string, m: (o: C) => RuntimeVal) {
        prototype.declareMethod(
            name,
            MK_NATIVE_GETTER(name, function () {
                downcastClass(this);
                return m(this.nativeRepr);
            })
        );
    }

    // insert methods into class
    for (const methodName in clsMethods) {
        mkClassMethod(methodName, clsMethods[methodName]);
    }

    // insert attributes (getters) into class
    for (const attributeName in clsAttributes) {
        mkClassAttribute(attributeName, clsAttributes[attributeName]);
    }

    return cls;
}

export function instanceNativeObjectFromClass<C>(
    cls: BuiltinClassVal<C>,
    args: RuntimeVal[]
): NativeObjectVal<C> {
    if (!cls.internalConstructor)
        throw `Die Klasse '${cls.name}' hat keinen Konstruktor!`;

    const ownMembers = new VarHolder();
    const obj: NativeObjectVal<C> = {
        type: ValueAlias.Object,
        cls,
        ownMembers,
        nativeRepr: cls.internalConstructor(args),
    };
    return obj;
}
