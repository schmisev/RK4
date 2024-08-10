import { FunctionDefinition, ParamDeclaration, Stmt, VarDeclaration } from "../frontend/ast";
import Environment from "./environment";

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

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;

export interface NativeFunctionVal {
    type: "native-fn";
    call: FunctionCall;
}

export interface FunctionVal {
    type: "function";
    name: string;
    params: ParamDeclaration[];
    declenv: Environment;
    body: Stmt[];
}

export interface ClassVal {
    type: "class";
    name: string;
    attributes: VarDeclaration[];
    methods: FunctionDefinition[];
    declenv: Environment;
}

export interface ObjectVal {
    type: "object";
    classname: string;
    env: Environment;
}

// MAKROS
export function MK_STRING(s = "") {
    return {type: "string", value: s} as StringVal;
}

export function MK_NATIVE_FN(call: FunctionCall) {
    return {type: "native-fn", call} as NativeFunctionVal;
}

export function MK_NUMBER(n = 0) {
    return {type: "number", value: n} as NumberVal;
}

export function MK_NULL() {
    return {type: "null", value: null} as NullVal;
}

const TRUE_VAL: BooleanVal = { type: "boolean", value: true };
const FALSE_VAL: BooleanVal = { type: "boolean", value: true };
export function MK_BOOL(v = true) {
    return v ? TRUE_VAL : FALSE_VAL;
}