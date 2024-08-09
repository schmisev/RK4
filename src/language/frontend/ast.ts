export type NodeType = 
    // Statements
    "Program"
    | "VarDeclaration"
    | "ObjDeclaration"
    | "ParamDeclaration"
    | "ShowCommand"
    | "BreakCommand"
    | "ContinueCommand"
    | "ReturnCommand"
    | "IfElseBlock"
    | "ForBlock"
    | "WhileBlock"
    // Expressions
    | "NumericLiteral" 
    | "NullLiteral"
    | "BooleanLiteral"
    | "StringLiteral"
    | "Identifier" 
    | "AssignmentExpr"
    | "BinaryExpr"
    | "UnaryExpr"
    | "MemberExpr"
    | "CallExpr"
    // Utility
    | "EmptyLine"
    // Definitions
    | "ClassDefinition"
    | "FunctionDefinition"
    | "ExtMethodDefinition"
    | "Attribute"
    | "Property"
    ;


export interface Stmt {
    kind: NodeType;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface VarDeclaration extends Stmt {
    kind: "VarDeclaration";
    ident: string;
    type: string;
    value: Expr;
}

export interface ObjDeclaration extends Stmt {
    kind: "ObjDeclaration";
    ident: string;
    type: string;
    classname: string;
}

export interface Property extends Stmt {
    kind: "Property";
    key: string;
    value: Expr;
}

export interface EmptyLine extends Stmt {
    kind: "EmptyLine";
}

export interface IfElseBlock extends Stmt {
    kind: "IfElseBlock";
    condition: Expr;
    ifTrue: Stmt[];
    ifFalse: Stmt[];
}

export interface ForBlock extends Stmt {
    kind: "ForBlock";
    counter: Expr;
    body: Stmt[];
}

export interface WhileBlock extends Stmt {
    kind: "WhileBlock";
    condition: Expr;
    body: Stmt[];
}

export interface ShowCommand extends Stmt {
    kind: "ShowCommand";
    values: Expr[];
}

export interface BreakCommand extends Stmt {
    kind: "BreakCommand";
}

export interface ContinueCommand extends Stmt {
    kind: "ContinueCommand";
}

export interface ReturnCommand extends Stmt {
    kind: "ReturnCommand";
    value: Stmt;
}

export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
    kind: "AssignmentExpr";
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr extends Expr {
    kind: "UnaryExpr";
    right: Expr;
    operator: string;
}

export interface Identifier extends Expr {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr {
    kind: "NumericLiteral";
    value: number;
}

export interface NullLiteral extends Expr {
    kind: "NullLiteral";
    value: "null";
}

export interface BooleanLiteral extends Expr {
    kind: "BooleanLiteral";
    value: boolean;
}

export interface StringLiteral extends Expr {
    kind: "StringLiteral";
    value: string;
}

export interface MemberExpr extends Expr {
    kind: "MemberExpr";
    container: Expr;
    member: Expr;
}

export interface CallExpr extends Expr {
    kind: "CallExpr";
    ident: Expr;
    args: Expr[];
}

export interface ClassDefinition extends Expr {
    kind: "ClassDefinition";
    ident: string;
    attributes: VarDeclaration[];
    methods: FunctionDefinition[];
}

export interface ParamDeclaration extends Stmt {
    kind: "ParamDeclaration";
    ident: string;
    type: string;
}

export interface FunctionDefinition extends Stmt {
    kind: "FunctionDefinition";
    params: ParamDeclaration[];
    name: string;
    body: Stmt[];
}

export interface ExtMethodDefinition extends Stmt {
    kind: "ExtMethodDefinition";
    params: ParamDeclaration[];
    name: string;
    classname: string;
    body: Stmt[];
}