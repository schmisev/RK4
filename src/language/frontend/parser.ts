import { Stmt, Program, Expr, VarDeclaration, ObjDeclaration, FunctionDefinition, ShowCommand, BreakCommand, ContinueCommand, ClassDefinition, ParamDeclaration, ReturnCommand, ExtMethodDefinition, StmtKind, IfElseBlock, ForBlock, WhileBlock, AlwaysBlock, AbruptStmtKind, DocComment } from "./ast";
import { tokenize, Token, TokenType, KEYWORDS } from "./lexer";
import { ParserError } from "../../errors";
import { ValueAlias } from "../runtime/values";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at(): Token {
        return this.tokens[0];
    }

    private eat(): Token {
        const prev = this.tokens.shift()!;
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift();
        if (!prev) {
            throw new ParserError("PARSER: " + err + " - nichts erhalten", -1);
        }
        if (prev.type != type) {
            const lineIndex = prev.lineIndex;
            throw new ParserError("PARSER: " + err + " - erhalten: " + JSON.stringify(prev.value), lineIndex);
        }
        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: StmtKind.Program,
            body: [],
            lineIndex: 0
        };

        // Parse until EOF
        while (this.not_eof()) {
            program.body.push(this.parse_stmt(new Set<never>()));
        }

        return program;
    }

    private parse_stmt<A extends AbruptStmtKind>(allowedControl: Set<A>): Stmt<A> {
        const checkControl: Set<AbruptStmtKind> = allowedControl;
        let statement: Stmt<A>
        switch (this.at().type) {
            case TokenType.ClassDef:
                statement = this.parse_class_definition();
                break;
            case TokenType.Repeat:
                statement = this.parse_loop_block(allowedControl);
                break;
            case TokenType.If:
                statement = this.parse_if_else_block(allowedControl);
                break;
            case TokenType.Break:
                if (!checkControl.has(StmtKind.BreakCommand))
                    throw new ParserError(`PARSER: "${("abbrechen" satisfies keyof typeof KEYWORDS)}" is nur in Schleifen erlaubt.`, this.at().lineIndex);
                statement = this.parse_break() as any;
                break;
            case TokenType.Continue:
                if (!checkControl.has(StmtKind.ContinueCommand))
                    throw new ParserError(`PARSER: "${("weiter" satisfies keyof typeof KEYWORDS)}" is nur in Schleifen erlaubt.`, this.at().lineIndex);
                statement = this.parse_continue() as any;
                break;
            case TokenType.Return:
                if (!checkControl.has(StmtKind.ReturnCommand))
                    throw new ParserError(`PARSER: "${("zurück" satisfies keyof typeof KEYWORDS)}" is nur in Funktionen und Methoden erlaubt.`, this.at().lineIndex);
                statement = this.parse_return() as any;
                break;
            case TokenType.Show:
                statement =  this.parse_show();
                break;
            case TokenType.DeclBoolean:
            case TokenType.DeclNumber:
            case TokenType.DeclString:
                statement = this.parse_var_declaration();
                break;
            case TokenType.DeclObject:
                statement = this.parse_obj_declaration();
                break;
            case TokenType.FunctionDef:
                statement = this.parse_fn_definition();
                break;
            case TokenType.MethodDef:
                statement = this.parse_ext_method_definition();
                break;
            case TokenType.EndLine:
                this.eat();
                return { kind: StmtKind.EmptyLine, lineIndex: this.at().lineIndex }
            case TokenType.DocComment:
                return this.parse_doc_comment();
            default:
                statement = this.parse_expr();
                break;
        }
        this.expect(TokenType.EndLine, "Erwarte neue Zeile nach Anweisung!");
        return statement;
    }

    parse_doc_comment(): DocComment {
        let result: DocComment = {
            kind: StmtKind.DocComment,
            content: "",
            lineIndex: this.at().lineIndex,
        };

        while (this.at().type == TokenType.DocComment) {
            result.content += `${this.at().value}\n`;
            this.eat();
            this.expect(TokenType.EndLine, "Erwarte neue Zeile nach #-Dokumentation!");
        }

        return result;
    }

    parse_show(): ShowCommand {
        const lineIndex = this.at().lineIndex;

        this.eat();
        const values: Expr[] = [];
        while (this.at().type != TokenType.EndLine) {
            values.push(this.parse_expr());
            if (this.at().type != TokenType.EndLine) this.expect(TokenType.Comma, "Erwarte Kommas zwischen zu zeigenden Ausdrücken!");
        }
        return {
            kind: StmtKind.ShowCommand,
            lineIndex,
            values,
        };
    }

    parse_break(): BreakCommand {
        const lineIndex = this.at().lineIndex;

        this.eat();
        return {
            kind: StmtKind.BreakCommand,
            lineIndex,
        };
    }

    parse_continue(): ContinueCommand {
        const lineIndex = this.at().lineIndex;

        this.eat();
        return {
            kind: StmtKind.ContinueCommand,
            lineIndex,
        };
    }

    parse_return(): ReturnCommand {
        const lineIndex = this.at().lineIndex;

        this.eat();
        const result = this.parse_expr();
        return {
            kind: StmtKind.ReturnCommand,
            lineIndex,
            value: result,
        }
    }

    parse_class_definition(): ClassDefinition {
        const lineIndex = this.at().lineIndex;
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte einen Klassennamen nach 'Klasse'!").value;
        const params: ParamDeclaration[] = [] // constructor parameters
        if (this.at().type == TokenType.OpenParen) {
            this.eat();
            // get constructor parameters
            while (this.at().type != TokenType.CloseParen) {
                const param = this.parse_param_declaration();
                params.push(param);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(TokenType.Comma, "Warte Komma nach Paramtern!");
            }
            this.eat() // found closed paren
        }
        this.expect(TokenType.EndLine, "Nach dem Klassenkopf sollte eine neue Zeile beginnen!");
        const attributes: (VarDeclaration | ObjDeclaration)[] = []; 
        const methods: FunctionDefinition[] = []; 
        while (this.at().type != TokenType.EndBlock && this.at().type != TokenType.MethodDef) {
            const declaration = this.parse_var_declaration();
            this.expect(TokenType.EndLine, "Erwarte eine neue Zeile nach jedem Attribut!");
            attributes.push(declaration);
        }
        while (this.at().type != TokenType.EndBlock && this.at().type == TokenType.MethodDef) {
            const definition = this.parse_fn_definition();
            this.expect(TokenType.EndLine, "Erwarte eine neue Zeile nach jeder Methode!");
            methods.push(definition);
        }
        this.eat(); // eat 'ende'
        return { kind: StmtKind.ClassDefinition, ident, attributes, methods, lineIndex, params }
    }

    parse_if_else_block<A extends AbruptStmtKind>(allowedControl: Set<A>): IfElseBlock<A> {
        const lineIndex = this.at().lineIndex;
        
        const ifTrue: Stmt<A>[] = [];
        const ifFalse: Stmt<A>[] = [];
        this.eat(); // eat 'wenn'
        const condition = this.parse_expr();
        this.expect(TokenType.Then, "Auf 'wenn' sollte 'dann' folgen!");
        this.expect(TokenType.EndLine, "Nach 'dann' sollte eine neue Zeile beginnen!");
        
        while (this.at().type != TokenType.Else && this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt(allowedControl);
            ifTrue.push(statement);
        }
        if (this.eat().type == TokenType.EndBlock) {
            return { kind: StmtKind.IfElseBlock, condition, ifTrue, ifFalse, lineIndex };
        }
        if (this.at().type == TokenType.If) {
            // if-else chaining
            ifFalse.push(this.parse_if_else_block(allowedControl));
            return {
                kind: StmtKind.IfElseBlock, 
                condition, 
                ifTrue, 
                ifFalse,
                lineIndex
            };
        }
        this.expect(TokenType.EndLine, "Nach 'sonst' sollte eine neue Zeile beginnen!");
        
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt(allowedControl);
            //console.log(statement);
            ifFalse.push(statement);
        }
        this.eat(); // eat 'ende'

        return { kind: StmtKind.IfElseBlock, condition, ifTrue, ifFalse, lineIndex };
    }

    parse_loop_block<A extends AbruptStmtKind>(allowedControl: Set<A>): Stmt<A> {
        this.eat(); // eat 'wiederhole'
        if (this.at().type == TokenType.RepWhile) {
            this.eat(); // eat 'solange'
            return this.parse_while_loop(allowedControl);
        } else if (this.at().type == TokenType.RepAlways) {
            this.eat(); // eat immer'
            return this.parse_always_loop(allowedControl);
        } else {
            return this.parse_for_loop(allowedControl);
        }
    }

    parse_for_loop<A extends AbruptStmtKind>(allowedControl: Set<A>): ForBlock<A> {
        const lineIndex = this.at().lineIndex;
        
        const counter = this.parse_expr();
        this.expect(TokenType.RepTimes, "Auf den Zähler sollte 'mal' folgen!");
        this.expect(TokenType.EndLine, "Nach 'mal' sollte eine neue Zeile folgen!");
        return {
            kind: StmtKind.ForBlock,
            lineIndex,
            counter,
            body: this.parse_bare_loop(allowedControl)
        };
    }

    parse_while_loop<A extends AbruptStmtKind>(allowedControl: Set<A>): WhileBlock<A> {
        const lineIndex = this.at().lineIndex;

        const condition = this.parse_expr();
        this.expect(TokenType.EndLine, "Nach der Bedingung sollte eine neue Zeile folgen!");
        
        return {
            kind: StmtKind.WhileBlock,
            lineIndex,
            condition,
            body: this.parse_bare_loop(allowedControl),
        };
    }

    parse_always_loop<A extends AbruptStmtKind>(allowedControl: Set<A>): AlwaysBlock<A> {
        const lineIndex = this.at().lineIndex;
        
        this.expect(TokenType.EndLine, "Nach 'immer' sollte eine neue Zeile folgen!");
        
        return {
            kind: StmtKind.AlwaysBlock,
            lineIndex,
            body: this.parse_bare_loop(allowedControl),
        };
    }

    // helper function
    parse_bare_loop<A extends AbruptStmtKind>(allowedControl: Set<A>): Stmt<StmtKind.ContinueCommand | StmtKind.BreakCommand | A>[] {
        const allowedInLoop = new Set([StmtKind.ContinueCommand, StmtKind.BreakCommand, ...allowedControl] as const);
        const body: Stmt<StmtKind.ContinueCommand | StmtKind.BreakCommand | A>[] = [];
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt(allowedInLoop);
            body.push(statement);
        }
        this.eat();
        return body;
    }

    parse_var_declaration(): VarDeclaration | ObjDeclaration {
        const lineIndex = this.at().lineIndex;

        let type: VarDeclaration["type"] = ValueAlias.Null;
        if (this.at().type == TokenType.DeclBoolean) {
            type = ValueAlias.Boolean;
        } else if (this.at().type == TokenType.DeclNumber) {
            type = ValueAlias.Number;
        } else if (this.at().type == TokenType.DeclString) {
            type = ValueAlias.String;
        } else if (this.at().type == TokenType.DeclObject) {
            return this.parse_obj_declaration();
        }
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Variablennamen nach 'Zahl', 'Wahrheitswert' oder 'Objekt'!").value;
        this.expect(TokenType.Assign, "Erwarte 'ist' nach Variablennamen!");
        const value = this.parse_expr();

        return {
            kind: StmtKind.VarDeclaration,
            ident,
            type,
            value,
            lineIndex
        };
    }

    parse_param_declaration(): ParamDeclaration {
        const lineIndex = this.at().lineIndex;
        
        let type = ValueAlias.Null;
        if (this.at().type == TokenType.DeclBoolean) {
            type = ValueAlias.Boolean;
        } else if (this.at().type == TokenType.DeclNumber) {
            type = ValueAlias.Number;
        } else if (this.at().type == TokenType.DeclString) {
            type = ValueAlias.String;
        } else if (this.at().type == TokenType.DeclObject) {
            type = ValueAlias.Object;
        }
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Variablennamen nach 'Zahl', 'Wahrheitswert', 'Text' oder 'Objekt'!").value;
        return { type, ident, lineIndex };
    }

    parse_fn_definition(): FunctionDefinition {
        const lineIndex = this.at().lineIndex;
        
        this.eat();
        const name = this.expect(TokenType.Identifier, "Erwarte einen Funktionsnamen nach 'Funktion'").value;
        const params: ParamDeclaration[] = []
        this.expect(TokenType.OpenParen, "Erwarte Klammer nach Funktiosnname!");
        while (this.at().type != TokenType.CloseParen) {
            const param = this.parse_param_declaration();
            params.push(param);
            if (this.at().type == TokenType.CloseParen) break;
            this.expect(TokenType.Comma, "Warte Komma nach Paramtern!");
        }
        this.eat();
        this.expect(TokenType.EndLine, "Erwarte neue Zeile vor Funktionskörper!");
        const body: Stmt<StmtKind.ReturnCommand>[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt(new Set([StmtKind.ReturnCommand])));
        }
        this.eat();

        return { kind: StmtKind.FunctionDefinition, name, params, body, lineIndex };
    }

    parse_ext_method_definition(): ExtMethodDefinition {
        const lineIndex = this.at().lineIndex;
        
        this.eat();
        const name = this.expect(TokenType.Identifier, "Erwarte einen Funktionsnamen nach 'Funktion'").value;
        const params: ParamDeclaration[] = []
        this.expect(TokenType.OpenParen, "Erwarte Klammer nach Methodenname!");
        while (this.at().type != TokenType.CloseParen) {
            const param = this.parse_param_declaration();
            params.push(param);
            if (this.at().type == TokenType.CloseParen) break;
            this.expect(TokenType.Comma, "Erwarte Komma nach Paramtern!");
        }
        this.eat();

        this.expect(TokenType.MethodFor, "Erwarte 'für' bei Definition einer ext. Methode!");
        const classname = this.expect(TokenType.Identifier, "Erwarte Klassenname nach 'für'!").value;
        this.expect(TokenType.EndLine, "Erwarte neue Zeile vor Funktionskörper!");

        const body: Stmt<StmtKind.ReturnCommand>[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt(new Set([StmtKind.ReturnCommand])));
        }
        this.eat();

        return { kind: StmtKind.ExtMethodDefinition, name, params, body, classname, lineIndex };
    }

    parse_obj_declaration(): ObjDeclaration {
        const lineIndex = this.at().lineIndex;
        
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Objektname nach 'Objekt'").value;
        this.expect(TokenType.Instance, "Erwarte 'als' nach Objektnamen!");
        const classname = this.expect(TokenType.Identifier, "Erwarte Klassenname nach 'als'!").value;
        
        const args: Expr[] = [];
        if(this.at().type == TokenType.OpenParen) {
            this.eat();
            while(this.at().type != TokenType.CloseParen) {
                const arg = this.parse_expr();
                args.push(arg);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(TokenType.Comma, "Erwarte Kommas zwischen Parametern!");
            }
            this.expect(TokenType.CloseParen, "Erwarte schließende Klammer nach Parametern!"); // eat close paren
        }

        return {
            kind: StmtKind.ObjDeclaration,
            ident,
            type: ValueAlias.Object,
            classname,
            args,
            lineIndex,
        };
    }

    private parse_expr(): Expr {
        return this.parse_assignment_expr();
    }

    //// Order of operation
    // AssignmentExpr
    // MemberExpr
    // FunctionCall
    // LogicalExpr
    // ComparisonExpr
    // AdditiveExpr
    // MultiplicativeExpr
    // UnaryExpr
    // PrimaryExpr

    private parse_assignment_expr(): Expr {
        const lineIndex = this.at().lineIndex;

        const left = this.parse_logical_expr();
        if (this.at().type == TokenType.Assign) {
            this.eat();
            const value = this.parse_assignment_expr();
            return { kind: StmtKind.AssignmentExpr, value, assigne: left, lineIndex };
        }

        return left;
    }

    private parse_logical_expr(): Expr {
        const lineIndex = this.at().lineIndex;
        
        let left = this.parse_comparison_expr();
        while (this.at().type == TokenType.And || this.at().type == TokenType.Or) {
            const operator = this.eat().value;
            const right = this.parse_comparison_expr();
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                lineIndex
            };
        }

        return left;
    }

    private parse_comparison_expr(): Expr {
        const lineIndex = this.at().lineIndex;
        
        let left = this.parse_additive_expr();
        while (this.at().type == TokenType.Equal || this.at().type == TokenType.Greater || this.at().type == TokenType.Lesser) {
            const operator = this.eat().value;
            const right = this.parse_additive_expr();
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                lineIndex
            };
        }

        return left;
    }

    private parse_additive_expr(): Expr {
        const lineIndex = this.at().lineIndex;

        let left = this.parse_multiplicative_expr();
        while (this.at().type == TokenType.Plus || this.at().type == TokenType.Minus) {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expr();
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                lineIndex
            };
        }

        return left;
    }

    private parse_multiplicative_expr(): Expr {
        const lineIndex = this.at().lineIndex;
        
        let left = this.parse_unary_expr();
        while (this.at().type == TokenType.Multiply || this.at().type == TokenType.Divide || this.at().type == TokenType.Mod) {
            const operator = this.eat().value;
            const right = this.parse_unary_expr();
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                lineIndex
            };
        }

        return left;
    }

    private parse_unary_expr(): Expr {
        const lineIndex = this.at().lineIndex;

        if (this.at().type == TokenType.Not || this.at().type == TokenType.Minus || this.at().type == TokenType.Plus) {
            const operator = this.eat().value;
            const right = this.parse_call_expr();
            return { kind: StmtKind.UnaryExpr, right, operator, lineIndex };
        } else {
            return this.parse_call_expr();
        }
    }

    private parse_call_expr(): Expr {
        const lineIndex = this.at().lineIndex;

        const ident = this.parse_member_expr();
        if(this.at().type == TokenType.OpenParen) {
            this.eat();
            const args: Expr[] = [];
            while(this.at().type != TokenType.CloseParen) {
                const arg = this.parse_expr();
                args.push(arg);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(TokenType.Comma, "Erwarte Kommas zwischen Parametern!");
            }
            this.expect(TokenType.CloseParen, "Erwarte schließende Klammer nach Parametern!"); // eat close paren
            return { kind: StmtKind.CallExpr, ident, args, lineIndex };
        } else {
            return ident;
        }
    }

    private parse_member_expr(): Expr {
        const lineIndex = this.at().lineIndex;
        
        let container = this.parse_primary_expr();
        while (this.at().type == TokenType.Period) {
            this.eat();
            const member = this.parse_primary_expr(); // has to be identifier
            if (member.kind != StmtKind.Identifier)
                throw new ParserError(`Kann Punktoperator nicht nutzen, wenn rechts kein Name steht!`, this.at().lineIndex);

            container = {
                kind: StmtKind.MemberExpr,
                container,
                member,
                lineIndex
            };
        }

        return container;
    }

    private parse_primary_expr(): Expr {
        const lineIndex = this.at().lineIndex;

        const tk = this.at().type;
        switch (tk) {
            case TokenType.Identifier:
                return { kind: StmtKind.Identifier, symbol: this.eat().value, lineIndex };
            case TokenType.Number:
                return { kind: StmtKind.NumericLiteral, value: parseInt(this.eat().value), lineIndex};
            case TokenType.String:
                return { kind: StmtKind.StringLiteral, value: this.eat().value, lineIndex };
            case TokenType.OpenParen: {
                this.eat(); // eat opening paren
                const value = this.parse_expr();
                this.expect(TokenType.CloseParen, "Schließende Klammer fehlt!"); // eat closing paren
                return value;
            }
            default:
                throw new ParserError(`PARSER: Unerwarteter Token gefunden: '${JSON.stringify(this.at().value)}'`, lineIndex);
        }
    }
}
