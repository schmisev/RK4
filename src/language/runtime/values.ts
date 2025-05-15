import { RuntimeError } from "../../errors";
import { mod } from "../../utils";
import { ObjDeclaration, ParamDeclaration, Stmt, StmtKind, VarDeclaration } from "../frontend/ast";
import { VarHolder, StaticScope, ClassPrototype } from "./environment";

export const enum ValueAlias {
    Null = "Nix",
    Number = "Zahl",
    Float = "Kommazahl",
    Boolean = "Wahrheitswert",
    String = "Text",
    List = "Liste",
    NativeFunction = "NativeFunktion",
    NativeMethod = "NativeMethode",
    NativeGetter = "NativeZugriffsmethode",
    Function = "Funktion",
    Method = "Methode",
    Class = "Klasse",
    Object = "Objekt",
};

export const enum AbruptAlias {
    Continue = "weiter",
    Break = "abbrechen",
    Return = "return",
}

export type NumberLikeVal = NumberVal | FloatVal;
export type NumberLikeType = NumberLikeVal["type"];

export function isLikeNumber(val: RuntimeVal): val is NumberLikeVal {
    return val.type === ValueAlias.Number || val.type === ValueAlias.Float;
}

export type RuntimeVal = NullVal | NumberLikeVal | BooleanVal | StringVal | ListVal | NativeFunctionVal | FunctionVal | ClassVal | ObjectVal;
export type ValueType = RuntimeVal["type"];

export interface NullVal {
    type: ValueAlias.Null;
    value: null;
}

export interface NumberVal {
    type: ValueAlias.Number;
    value: number;
}

export interface FloatVal {
    type: ValueAlias.Float;
    value: number;
}

export interface BooleanVal {
    type: ValueAlias.Boolean;
    value: boolean;
}

export interface StringVal {
    type: ValueAlias.String;
    value: string;
}

export interface ListVal {
    type: ValueAlias.List;
    elements: RuntimeVal[];
}

export type FunctionCall = (args: RuntimeVal[]) => RuntimeVal;

export interface NativeFunctionVal {
    type: ValueAlias.NativeFunction;
    name: string;
    call: FunctionCall;
}

export type MethodCall = (this: ObjectVal, args: RuntimeVal[]) => RuntimeVal;
export type GetterCall = (this: ObjectVal) => RuntimeVal;

export interface NativeMethodVal {
    type: ValueAlias.NativeMethod;
    name: string;
    call: MethodCall;
}

export interface NativeGetterVal {
    type: ValueAlias.NativeGetter;
    name: string;
    call: GetterCall;
}

export interface FunctionVal {
    type: ValueAlias.Function;
    name: string;
    params: ParamDeclaration[];
    declenv: StaticScope;
    body: Stmt<StmtKind.ReturnCommand>[];
}

// A method is an "unbound" function, i.e. without a receiver. Crucially, only a runtime value when it gets bound to a receiver
export interface MethodVal {
    type: ValueAlias.Method;
    name: string;
    params: ParamDeclaration[];
    declenv: StaticScope;
    body: Stmt<StmtKind.ReturnCommand>[];
}

export interface BuiltinClassVal<C> {
    type: ValueAlias.Class;
    name: string;
    internal: true;
    prototype: ClassPrototype;
    internalConstructor?: ((args: RuntimeVal[]) => C);
}

export interface UserClassVal {
    type: ValueAlias.Class;
    name: string;
    internal?: false;
    attributes: (VarDeclaration | ObjDeclaration)[];
    prototype: ClassPrototype;
    params: ParamDeclaration[]; // for constructor
}

export type ClassVal = BuiltinClassVal<unknown> | UserClassVal;

export interface ObjectVal {
    type: ValueAlias.Object;
    cls: ClassVal,
    ownMembers: VarHolder;
}

export interface AbruptBreak {
    type: AbruptAlias.Break;
}

export interface AbruptContinue {
    type: AbruptAlias.Continue;
}

export interface AbruptReturn {
    type: AbruptAlias.Return;
    value: RuntimeVal;
}

// MAKROS
export function MK_STRING(s = "") {
    return { type: ValueAlias.String, value: s } satisfies StringVal;
}

export function MK_NATIVE_FN(name: string, call: FunctionCall) {
    return { type: ValueAlias.NativeFunction, name, call } satisfies NativeFunctionVal;
}

export function MK_NATIVE_METHOD(name: string, call: MethodCall) {
    return { type: ValueAlias.NativeMethod, name, call } satisfies NativeMethodVal;
}

export function MK_NATIVE_GETTER(name: string, call: GetterCall) {
    return { type: ValueAlias.NativeGetter, name, call } satisfies NativeGetterVal;
}

export function MK_NUMBER(n = 0) {
    if (mod(n, 1) !== 0) throw new RuntimeError("Kann keine ganze Zahl mit Nachkommastellen erzeugen!");
    return { type: ValueAlias.Number, value: n } satisfies NumberVal;
}

export function MK_FLOAT(n = 0) {
    return { type: ValueAlias.Float, value: n } satisfies FloatVal;
}

export function MK_LIST(elements: RuntimeVal[]) {
    return { type: ValueAlias.List, elements } satisfies ListVal;
}

const NULL_VAL: NullVal = { type: ValueAlias.Null, value: null };
export function MK_NULL() {
    return NULL_VAL;
}

const TRUE_VAL: BooleanVal = { type: ValueAlias.Boolean, value: true };
const FALSE_VAL: BooleanVal = { type: ValueAlias.Boolean, value: false };
export function MK_BOOL(v = true) {
    return v ? TRUE_VAL : FALSE_VAL;
}