import type { AbruptBreak, AbruptContinue, AbruptReturn, ValueAlias } from "../runtime/values";
import { CodePosition } from "./lexer";

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
    FromToBlock = "VonBisBlock",
    ForInBlock = "FürInBlock",
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
    ListLiteral = "ListenLiteral",
    MemberExpr = "MitgliedsAudruck",
    ComputedMemberExpr = "BerechneterMitgliedsAusdruck",
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
    | FromToBlock<Ctrl>
    | ForInBlock<Ctrl>
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
    codePos: CodePosition;
    body: BareStmt[];
}

export interface DocComment {
    kind: StmtKind.DocComment;
    codePos: CodePosition;
    content: string;
}

export interface VarDeclaration {
    kind: StmtKind.VarDeclaration;
    codePos: CodePosition;
    ident: string;
    type: ValueAlias.Null | ValueAlias.Boolean | ValueAlias.Number | ValueAlias.String | ValueAlias.List;
    value: Expr;
}

export interface ObjDeclaration {
    kind: StmtKind.ObjDeclaration;
    codePos: CodePosition;
    ident: string;
    type: ValueAlias.Object;
    classname: string;
    args: Expr[];
}

export interface EmptyLine {
    codePos: CodePosition;
    kind: StmtKind.EmptyLine;
}

export interface IfElseBlock<Ctrl> {
    kind: StmtKind.IfElseBlock;
    codePos: CodePosition;
    condition: Expr;
    ifTrue: Stmt<Ctrl>[];
    ifFalse: Stmt<Ctrl>[];
}
export type AnyIfElseBlock = IfElseBlock<AbruptStmtKind>;

export interface SwitchBlock<Ctrl> {
    kind: StmtKind.SwitchBlock;
    codePos: CodePosition;
    selection: Expr;
    cases: CaseBlock<Ctrl>[];
    fallback: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnySwitchBlock = SwitchBlock<AbruptStmtKind>;

export interface CaseBlock<Ctrl> {
    kind: StmtKind.CaseBlock;
    codePos: CodePosition;
    comp: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyCaseBlock = CaseBlock<AbruptStmtKind>;

export interface ForBlock<Ctrl> {
    kind: StmtKind.ForBlock;
    codePos: CodePosition;
    counter: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyForBlock = ForBlock<AbruptStmtKind>;

export interface WhileBlock<Ctrl> {
    kind: StmtKind.WhileBlock;
    codePos: CodePosition;
    condition: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyWhileBlock = WhileBlock<AbruptStmtKind>;

export interface AlwaysBlock<Ctrl> {
    kind: StmtKind.AlwaysBlock;
    codePos: CodePosition;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyAlwaysBlock = AlwaysBlock<AbruptStmtKind>;

export interface FromToBlock<Ctrl> {
    kind: StmtKind.FromToBlock;
    codePos: CodePosition;
    iterIdent: string | undefined;
    start: Expr;
    end: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyFromToBlock = FromToBlock<AbruptStmtKind>;

export interface ForInBlock<Ctrl> {
    kind: StmtKind.ForInBlock;
    codePos: CodePosition;
    iterIdent: string;
    list: Expr;
    body: Stmt<StmtKind.BreakCommand | StmtKind.ContinueCommand | Ctrl>[];
}
export type AnyForInBlock = ForInBlock<AbruptStmtKind>;

export interface ShowCommand {
    kind: StmtKind.ShowCommand;
    codePos: CodePosition;
    values: Expr[];
}

export interface BreakCommand {
    kind: StmtKind.BreakCommand;
    codePos: CodePosition;
}

export interface ContinueCommand {
    kind: StmtKind.ContinueCommand;
    codePos: CodePosition;
}

export interface ReturnCommand {
    kind: StmtKind.ReturnCommand;
    codePos: CodePosition;
    // Do NOT allow control flow expressions in computation for return. This is confusing!
    value: Expr;
}

export type Expr = AssignmentExpr | BinaryExpr | UnaryExpr | Identifier | NumericLiteral | NullLiteral | BooleanLiteral | StringLiteral  | ListLiteral | MemberExpr | ComputedMemberExpr | CallExpr;

export interface AssignmentExpr {
    kind: StmtKind.AssignmentExpr;
    codePos: CodePosition;
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr {
    kind: StmtKind.BinaryExpr;
    codePos: CodePosition;
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr {
    kind: StmtKind.UnaryExpr;
    codePos: CodePosition;
    right: Expr;
    operator: string;
}

export interface Identifier {
    kind: StmtKind.Identifier;
    codePos: CodePosition;
    symbol: string;
}

export interface NumericLiteral {
    kind: StmtKind.NumericLiteral;
    codePos: CodePosition;
    value: number;
}

export interface NullLiteral {
    kind: StmtKind.NullLiteral;
    codePos: CodePosition;
    value: ValueAlias.Null;
}

export interface BooleanLiteral {
    kind: StmtKind.BooleanLiteral;
    codePos: CodePosition;
    value: boolean;
}

export interface StringLiteral {
    kind: StmtKind.StringLiteral;
    codePos: CodePosition;
    value: string;
}

export interface ListLiteral {
    kind: StmtKind.ListLiteral;
    codePos: CodePosition;
    elements: Expr[];
}

export interface ComputedMemberExpr {
    kind: StmtKind.ComputedMemberExpr;
    codePos: CodePosition;
    container: Expr;
    accessor: Expr;
}

export interface MemberExpr {
    kind: StmtKind.MemberExpr;
    codePos: CodePosition;
    container: Expr;
    member: Identifier;
}

export interface CallExpr {
    kind: StmtKind.CallExpr;
    codePos: CodePosition;
    ident: Expr;
    args: Expr[];
}

export interface ClassDefinition {
    kind: StmtKind.ClassDefinition;
    codePos: CodePosition;
    ident: string;
    params: ParamDeclaration[];
    attributes: (VarDeclaration | ObjDeclaration)[];
    methods: FunctionDefinition[];
}

export interface ParamDeclaration {
    ident: string;
    type: string;
    codePos: CodePosition;
}

export interface FunctionDefinition {
    kind: StmtKind.FunctionDefinition;
    codePos: CodePosition;
    params: ParamDeclaration[];
    name: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}

export interface ExtMethodDefinition {
    kind: StmtKind.ExtMethodDefinition;
    codePos: CodePosition;
    params: ParamDeclaration[];
    name: string;
    classname: string;
    body: Stmt<StmtKind.ReturnCommand>[];
}
