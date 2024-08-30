import { ObjDeclaration, ParamDeclaration, Stmt, VarDeclaration } from "../frontend/ast";
import { ClassPrototype, Environment, StaticScope, VarHolder } from "./environment";

export type RuntimeVal = NullVal | NumberVal | BooleanVal | StringVal | NativeFunctionVal | FunctionVal | ClassVal | ObjectVal;
export type ValueType = RuntimeVal["type"];

export interface NullVal {
    type: "null";
    value: null;
}

export interface NumberVal {
    type: "number";
    value: number;
}

export interface BooleanVal {
    type: "boolean";
    value: boolean;
}

export interface StringVal {
    type: "string";
    value: string;
}

export type FunctionCall = (args: RuntimeVal[]) => RuntimeVal;

export interface NativeFunctionVal {
    type: "native-fn";
    call: FunctionCall;
}

export type MethodCall = (this: ObjectVal, args: RuntimeVal[]) => RuntimeVal;

export interface NativeMethodVal {
    type: "native-method";
    call: MethodCall;
}

export interface FunctionVal {
    type: "function";
    name: string;
    params: ParamDeclaration[];
    declenv: StaticScope;
    body: Stmt[];
}

// A method is an "unbound" function, i.e. without a receiver. Crucially, only a runtime value when it gets bound to a receiver
export interface MethodVal {
    type: "method";
    name: string;
    params: ParamDeclaration[];
    declenv: StaticScope;
    body: Stmt[];
}

export interface BuiltinClassVal {
    type: "class";
    name: string;
    internal: true;
    prototype: ClassPrototype;
}

export interface UserClassVal {
    type: "class";
    name: string;
    internal?: false;
    attributes: (VarDeclaration | ObjDeclaration)[];
    prototype: ClassPrototype;
}

export type ClassVal = BuiltinClassVal | UserClassVal;

export interface ObjectVal {
    type: "object";
    cls: ClassVal,
    ownMembers: VarHolder;
}

// MAKROS
export function MK_STRING(s = "") {
    return { type: "string", value: s } satisfies StringVal;
}

export function MK_NATIVE_FN(call: FunctionCall) {
    return { type: "native-fn", call } satisfies NativeFunctionVal;
}

export function MK_NATIVE_METHOD(call: MethodCall) {
    return { type: "native-method", call } satisfies NativeMethodVal;
}

export function MK_NUMBER(n = 0) {
    return { type: "number", value: n } satisfies NumberVal;
}

const NULL_VAL: NullVal = { type: "null", value: null };
export function MK_NULL() {
    return NULL_VAL;
}

const TRUE_VAL: BooleanVal = { type: "boolean", value: true };
const FALSE_VAL: BooleanVal = { type: "boolean", value: false };
export function MK_BOOL(v = true) {
    return v ? TRUE_VAL : FALSE_VAL;
}