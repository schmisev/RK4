import { FunctionDefinition, ParamDeclaration, Stmt, VarDeclaration } from "../frontend/ast";
import Environment from "./environment";

export type ValueType = "null" | "number" | "boolean" | "string" | "object" | "native-fn"  | "function" | "class" | "object" | "native-obj";

export interface RuntimeVal {
    type: ValueType;
}

export interface NullVal extends RuntimeVal {
    type: "null";
    value: null;
}

export interface NumberVal extends RuntimeVal {
    type: "number";
    value: number;
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean";
    value: boolean;
}

export interface StringVal extends RuntimeVal {
    type: "string";
    value: string;
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;

export interface NativeFunctionVal extends RuntimeVal {
    type: "native-fn";
    call: FunctionCall;
}

export interface FunctionVal extends RuntimeVal {
    type: "function";
    name: string;
    params: ParamDeclaration[];
    declenv: Environment;
    body: Stmt[];
}

export interface ClassVal extends RuntimeVal {
    type: "class";
    name: string;
    attributes: VarDeclaration[];
    methods: FunctionDefinition[];
    declenv: Environment;
}

export interface ObjectVal extends RuntimeVal {
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

export function MK_BOOL(v = true) {
    return {type: "boolean", value: v} as BooleanVal
}