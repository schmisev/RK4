import type { AbruptBreak, AbruptContinue, AbruptReturn } from "../runtime/values";

export type NodeType = AnyStmt["kind"];

export const enum StmtKind {
    Program = "Program",
    VarDeclaration = "VarDeclaration",
    ObjDeclaration = "ObjDeclaration",
    EmptyLine = "EmptyLine",
    DocComment = "DocComment",
    IfElseBlock = "IfElseBlock",
    ForBlock = "ForBlock",
    WhileBlock = "WhileBlock",
    AlwaysBlock = "AlwaysBlock",
    ShowCommand = "ShowCommand",
    BreakCommand = "BreakCommand",
    ContinueCommand = "ContinueCommand",
    ReturnCommand = "ReturnCommand",
    AssignmentExpr = "AssignmentExpr",
    BinaryExpr = "BinaryExpr",
    UnaryExpr = "UnaryExpr",
    Identifier = "Identifier",
    NumericLiteral = "NumericLiteral",
    NullLiteral = "NullLiteral",
    BooleanLiteral = "BooleanLiteral",
    StringLiteral = "StringLiteral",
    MemberExpr = "MemberExpr",
    CallExpr = "CallExpr",
    ClassDefinition = "ClassDefinition",
    FunctionDefinition = "FunctionDefinition",
    ExtMethodDefinition = "ExtMethodDefinition",
};
export type AbrubtStmtKind = StmtKind.BreakCommand | StmtKind.ContinueCommand | StmtKind.ReturnCommand;
type AbrubtToStmt = {
    [StmtKind.BreakCommand]: BreakCommand;
    [StmtKind.ContinueCommand]: ContinueCommand;
    [StmtKind.ReturnCommand]: ReturnCommand;
}

export type Stmt<Ctrl extends AbrubtStmtKind> = | DocComment |  VarDeclaration | ObjDeclaration | IfElseBlock<Ctrl> | ForBlock<Ctrl> | WhileBlock<Ctrl> | AlwaysBlock<Ctrl> | AbrubtToStmt[Ctrl] | ShowCommand | ClassDefinition | FunctionDefinition | ExtMethodDefinition | Expr;
export type BareStmt = Stmt<never>;
export type AnyStmt = Stmt<AbrubtStmtKind>;

type AbruptToReturn = {
    [StmtKind.BreakCommand]: AbruptBreak;
    [StmtKind.ContinueCommand]: AbruptContinue;
    [StmtKind.ReturnCommand]: AbruptReturn;
};
export type StmtReturn<Ctrl extends AbrubtStmtKind> = Ctrl extends AbrubtStmtKind ? AbruptToReturn[Ctrl] : never;

export interface Program {
    kind: StmtKind.Program;
    body: BareStmt[];
}

export interface DocComment {
    kind: StmtKind.DocComment;
    content: string;
}

export interface VarDeclaration {
    kind: StmtKind.VarDeclaration;
    ident: string;
    type: "null" | "boolean" | "number" | "string";
    value: Expr;
}

export interface ObjDeclaration {
    kind: StmtKind.ObjDeclaration;
    ident: string;
    type: "object";
    classname: string;
}

export interface EmptyLine {
    kind: StmtKind.EmptyLine;
}

export interface IfElseBlock<Ctrl extends AbrubtStmtKind> {
    kind: StmtKind.IfElseBlock;
    condition: Expr;
    ifTrue: Stmt<Ctrl>[];
    ifFalse: Stmt<Ctrl>[];
}
export type AnyIfElseBlock = IfElseBlock<AbrubtStmtKind>;

export interface ForBlock<Ctrl extends AbrubtStmtKind> {
    kind: StmtKind.ForBlock;
    lineIndex: number;
    counter: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyForBlock = ForBlock<AbrubtStmtKind>;

export interface WhileBlock<Ctrl extends AbrubtStmtKind> {
    kind: StmtKind.WhileBlock;
    lineIndex: number;
    condition: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyWhileBlock = WhileBlock<AbrubtStmtKind>;

export interface AlwaysBlock<Ctrl extends AbrubtStmtKind> {
    kind: StmtKind.AlwaysBlock;
    lineIndex: number;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyAlwaysBlock = AlwaysBlock<AbrubtStmtKind>;

export interface ShowCommand {
    kind: StmtKind.ShowCommand;
    lineIndex: number;
    values: Expr[];
}

export interface BreakCommand {
    kind: StmtKind.BreakCommand;
    lineIndex: number;
}

export interface ContinueCommand {
    kind: StmtKind.ContinueCommand;
    lineIndex: number;
}

export interface ReturnCommand {
    kind: StmtKind.ReturnCommand;
    lineIndex: number;
    // Do NOT allow control flow expressions in computation for return. This is confusing!
    value: BareStmt;
}

export type Expr = AssignmentExpr | BinaryExpr | UnaryExpr | Identifier | NumericLiteral | NullLiteral | BooleanLiteral | StringLiteral | EmptyLine | MemberExpr | CallExpr;

export interface AssignmentExpr {
    kind: StmtKind.AssignmentExpr;
    lineIndex: number;
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr {
    kind: StmtKind.BinaryExpr;
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr {
    kind: StmtKind.UnaryExpr;
    right: Expr;
    operator: string;
}

export interface Identifier {
    kind: StmtKind.Identifier;
    symbol: string;
}

export interface NumericLiteral {
    kind: StmtKind.NumericLiteral;
    value: number;
}

export interface NullLiteral {
    kind: StmtKind.NullLiteral;
    value: "null";
}

export interface BooleanLiteral {
    kind: StmtKind.BooleanLiteral;
    value: boolean;
}

export interface StringLiteral {
    kind: StmtKind.StringLiteral;
    value: string;
}

export interface MemberExpr {
    kind: StmtKind.MemberExpr;
    container: Expr;
    member: Identifier;
}

export interface CallExpr {
    kind: StmtKind.CallExpr;
    ident: Expr;
    args: Expr[];
    lineIndex: number;
}

export interface ClassDefinition {
    kind: StmtKind.ClassDefinition;
    ident: string;
    attributes: (VarDeclaration | ObjDeclaration)[];
    methods: FunctionDefinition[];
}

export interface ParamDeclaration {
    ident: string;
    type: string;
}

export interface FunctionDefinition {
    kind: StmtKind.FunctionDefinition;
    params: ParamDeclaration[];
    name: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}

export interface ExtMethodDefinition {
    kind: StmtKind.ExtMethodDefinition;
    params: ParamDeclaration[];
    name: string;
    classname: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}
