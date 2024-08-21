export type NodeType = Stmt["kind"];

export type Stmt = Program | VarDeclaration | ObjDeclaration | IfElseBlock | ForBlock | WhileBlock | ShowCommand | BreakCommand | ContinueCommand | ReturnCommand | Expr;

export interface Program {
    kind: "Program";
    body: Stmt[];
}

export interface VarDeclaration {
    kind: "VarDeclaration";
    ident: string;
    type: "null" | "boolean" | "number" | "string";
    value: Expr;
}

export interface ObjDeclaration {
    kind: "ObjDeclaration";
    ident: string;
    type: "object";
    classname: string;
}

export interface EmptyLine {
    kind: "EmptyLine";
}

export interface IfElseBlock {
    kind: "IfElseBlock";
    condition: Expr;
    ifTrue: Stmt[];
    ifFalse: Stmt[];
}

export interface ForBlock {
    kind: "ForBlock";
    counter: Expr;
    body: Stmt[];
}

export interface WhileBlock {
    kind: "WhileBlock";
    condition: Expr;
    body: Stmt[];
}

export interface ShowCommand {
    kind: "ShowCommand";
    lineIndex: number;
    values: Expr[];
}

export interface BreakCommand {
    kind: "BreakCommand";
    lineIndex: number;
}

export interface ContinueCommand {
    kind: "ContinueCommand";
    lineIndex: number;
}

export interface ReturnCommand {
    kind: "ReturnCommand";
    lineIndex: number;
    value: Stmt;
}

export type Expr = AssignmentExpr | BinaryExpr | UnaryExpr | Identifier | NumericLiteral | NullLiteral | BooleanLiteral | StringLiteral | EmptyLine | MemberExpr | CallExpr | ClassDefinition | FunctionDefinition | ExtMethodDefinition;

export interface AssignmentExpr {
    kind: "AssignmentExpr";
    lineIndex: number;
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr {
    kind: "UnaryExpr";
    right: Expr;
    operator: string;
}

export interface Identifier {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral {
    kind: "NumericLiteral";
    value: number;
}

export interface NullLiteral {
    kind: "NullLiteral";
    value: "null";
}

export interface BooleanLiteral {
    kind: "BooleanLiteral";
    value: boolean;
}

export interface StringLiteral {
    kind: "StringLiteral";
    value: string;
}

export interface MemberExpr {
    kind: "MemberExpr";
    container: Expr;
    member: Identifier;
}

export interface CallExpr {
    kind: "CallExpr";
    ident: Expr;
    args: Expr[];
    lineIndex: number;
}

export interface ClassDefinition {
    kind: "ClassDefinition";
    ident: string;
    attributes: (VarDeclaration | ObjDeclaration)[];
    methods: FunctionDefinition[];
}

export interface ParamDeclaration {
    kind: "ParamDeclaration";
    ident: string;
    type: string;
}

export interface FunctionDefinition {
    kind: "FunctionDefinition";
    params: ParamDeclaration[];
    name: string;
    body: Stmt[];
}

export interface ExtMethodDefinition {
    kind: "ExtMethodDefinition";
    params: ParamDeclaration[];
    name: string;
    classname: string;
    body: Stmt[];
}
