import type { AbruptBreak, AbruptContinue, AbruptReturn, ValueAlias } from "../runtime/values";

export const enum StmtKind {
    Program = "Programm",
    VarDeclaration = "VarDeklaration",
    ObjDeclaration = "ObjDeklaration",
    EmptyLine = "LeereZeile",
    DocComment = "DokuKommentar",
    IfElseBlock = "WennDannBlock",
    SwitchBlock = "UnterscheidungsBlock",
    CaseBlock = "FallBlock",
    ForBlock = "MalBlock",
    WhileBlock = "SolangeBlock",
    AlwaysBlock = "ImmerBlock",
    ShowCommand = "ZeigAnweisung",
    BreakCommand = "AbbrechenAnweisung",
    ContinueCommand = "WeiterAnweisung",
    ReturnCommand = "ZurückAnweisung",
    AssignmentExpr = "ZuweisungsAusdruck",
    BinaryExpr = "BinärerAusdruck",
    UnaryExpr = "UnärerAusdruck",
    Identifier = "Bezeichner",
    NumericLiteral = "NumerischerLiteral",
    NullLiteral = "NixLiteral",
    BooleanLiteral = "WahrheitswertLiteral",
    StringLiteral = "TextLiteral",
    MemberExpr = "MitgliedsAudruck",
    CallExpr = "AufrufsAusdruck",
    ClassDefinition = "KlassenDefinition",
    FunctionDefinition = "FunktionsDefinition",
    ExtMethodDefinition = "ExtMethodenDefinition",
};
export type AbruptStmtKind = StmtKind.BreakCommand | StmtKind.ContinueCommand | StmtKind.ReturnCommand;
type AbruptToStmt = {
    [StmtKind.BreakCommand]: BreakCommand;
    [StmtKind.ContinueCommand]: ContinueCommand;
    [StmtKind.ReturnCommand]: ReturnCommand;
}
type AbruptStmt<Ctrl> = Ctrl extends AbruptStmtKind ? AbruptToStmt[Ctrl] : never;

export type Stmt<Ctrl> =
    | DocComment
    | VarDeclaration
    | ObjDeclaration
    | IfElseBlock<Ctrl>
    | SwitchBlock<Ctrl>
    | ForBlock<Ctrl>
    | WhileBlock<Ctrl>
    | AlwaysBlock<Ctrl>
    | AbruptStmt<Ctrl>
    | ShowCommand
    | ClassDefinition
    | FunctionDefinition
    | ExtMethodDefinition
    | EmptyLine
    | Expr
    ;

export type BareStmt = Stmt<never>;
export type AnyStmt = Stmt<AbruptStmtKind>;

type AbruptToReturn = {
    [StmtKind.BreakCommand]: AbruptBreak;
    [StmtKind.ContinueCommand]: AbruptContinue;
    [StmtKind.ReturnCommand]: AbruptReturn;
};
export type AbruptEvalResult<Ctrl> = Ctrl extends AbruptStmtKind ? AbruptToReturn[Ctrl] : never;

export interface Program {
    kind: StmtKind.Program;
    lineIndex: number;
    body: BareStmt[];
}

export interface DocComment {
    kind: StmtKind.DocComment;
    lineIndex: number;
    content: string;
}

export interface VarDeclaration {
    kind: StmtKind.VarDeclaration;
    lineIndex: number;
    ident: string;
    type: ValueAlias.Null | ValueAlias.Boolean | ValueAlias.Number | ValueAlias.String;
    value: Expr;
}

export interface ObjDeclaration {
    kind: StmtKind.ObjDeclaration;
    lineIndex: number;
    ident: string;
    type: ValueAlias.Object;
    classname: string;
    args: Expr[];
}

export interface EmptyLine {
    lineIndex: number;
    kind: StmtKind.EmptyLine;
}

export interface IfElseBlock<Ctrl> {
    kind: StmtKind.IfElseBlock;
    lineIndex: number;
    condition: Expr;
    ifTrue: Stmt<Ctrl>[];
    ifFalse: Stmt<Ctrl>[];
}
export type AnyIfElseBlock = IfElseBlock<AbruptStmtKind>;

export interface SwitchBlock<Ctrl> {
    kind: StmtKind.SwitchBlock;
    lineIndex: number;
    selection: Expr;
    cases: CaseBlock<Ctrl>[];
    fallback: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnySwitchBlock = SwitchBlock<AbruptStmtKind>;

export interface CaseBlock<Ctrl> {
    kind: StmtKind.CaseBlock;
    lineIndex: number;
    comp: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyCaseBlock = CaseBlock<AbruptStmtKind>;

export interface ForBlock<Ctrl> {
    kind: StmtKind.ForBlock;
    lineIndex: number;
    counter: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyForBlock = ForBlock<AbruptStmtKind>;

export interface WhileBlock<Ctrl> {
    kind: StmtKind.WhileBlock;
    lineIndex: number;
    condition: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyWhileBlock = WhileBlock<AbruptStmtKind>;

export interface AlwaysBlock<Ctrl> {
    kind: StmtKind.AlwaysBlock;
    lineIndex: number;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyAlwaysBlock = AlwaysBlock<AbruptStmtKind>;

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
    value: Expr;
}

export type Expr = AssignmentExpr | BinaryExpr | UnaryExpr | Identifier | NumericLiteral | NullLiteral | BooleanLiteral | StringLiteral | MemberExpr | CallExpr;

export interface AssignmentExpr {
    kind: StmtKind.AssignmentExpr;
    lineIndex: number;
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr {
    kind: StmtKind.BinaryExpr;
    lineIndex: number;
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr {
    kind: StmtKind.UnaryExpr;
    lineIndex: number;
    right: Expr;
    operator: string;
}

export interface Identifier {
    kind: StmtKind.Identifier;
    lineIndex: number;
    symbol: string;
}

export interface NumericLiteral {
    kind: StmtKind.NumericLiteral;
    lineIndex: number;
    value: number;
}

export interface NullLiteral {
    kind: StmtKind.NullLiteral;
    lineIndex: number;
    value: ValueAlias.Null;
}

export interface BooleanLiteral {
    kind: StmtKind.BooleanLiteral;
    lineIndex: number;
    value: boolean;
}

export interface StringLiteral {
    kind: StmtKind.StringLiteral;
    lineIndex: number;
    value: string;
}

export interface MemberExpr {
    kind: StmtKind.MemberExpr;
    lineIndex: number;
    container: Expr;
    member: Identifier;
}

export interface CallExpr {
    kind: StmtKind.CallExpr;
    lineIndex: number;
    ident: Expr;
    args: Expr[];
}

export interface ClassDefinition {
    kind: StmtKind.ClassDefinition;
    lineIndex: number;
    ident: string;
    params: ParamDeclaration[];
    attributes: (VarDeclaration | ObjDeclaration)[];
    methods: FunctionDefinition[];
}

export interface ParamDeclaration {
    ident: string;
    type: string;
    lineIndex: number;
}

export interface FunctionDefinition {
    kind: StmtKind.FunctionDefinition;
    lineIndex: number;
    params: ParamDeclaration[];
    name: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}

export interface ExtMethodDefinition {
    kind: StmtKind.ExtMethodDefinition;
    lineIndex: number;
    params: ParamDeclaration[];
    name: string;
    classname: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}
