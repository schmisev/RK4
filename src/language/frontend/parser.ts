import { Stmt, Program, Expr, BinaryExpr, NumericLiteral, Identifier, VarDeclaration, ObjDeclaration, FunctionDefinition, UnaryExpr, ShowCommand, AssignmentExpr, IfElseBlock, BreakCommand, ContinueCommand, StringLiteral, ClassDefinition, CallExpr, ParamDeclaration, EmptyLine, MemberExpr, ReturnCommand, ExtMethodDefinition } from "./ast";
import { tokenize, Token, TokenType } from "./lexer";
import { ForBlock } from "./ast";
import { WhileBlock } from "./ast";
import { ParserError } from "../../errors";

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
        if (!prev || prev.type != type) {
            throw new ParserError("PARSER:\n" + err + JSON.stringify(prev) + " - erwarte: " + type.toString());
        }
        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: "Program",
            body: [],
        };

        // Parse until EOF
        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }

        return program;
    }

    private parse_stmt(): Stmt {
        let statement: Stmt
        switch (this.at().type) {
            case TokenType.ClassDef:
                statement = this.parse_class_definition();
                break;
            case TokenType.Repeat:
                statement = this.parse_loop_block();
                break;
            case TokenType.If:
                statement = this.parse_if_else_block();
                break;
            case TokenType.Break:
                statement = this.parse_break();
                break;
            case TokenType.Continue:
                statement = this.parse_continue();
                break;
            case TokenType.Return:
                statement = this.parse_return();
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
                return { kind: "EmptyLine" }
            default:
                statement = this.parse_expr();
                break;
        }
        this.expect(TokenType.EndLine, "Erwarte neue Zeile nach Anweisung!");
        return statement;
    }

    parse_show(): Stmt {
        this.eat();
        const values: Expr[] = [];
        while (this.at().type != TokenType.EndLine) {
            values.push(this.parse_expr());
        }
        return {
            kind: "ShowCommand",
            values,
        };
    }

    parse_break(): Stmt {
        this.eat();
        return {
            kind: "BreakCommand",
        };
    }

    parse_continue(): Stmt {
        this.eat();
        return {
            kind: "ContinueCommand",
        };
    }

    parse_return(): Stmt {
        this.eat();
        const result = this.parse_expr();
        return {
            kind: "ReturnCommand",
            value: result,
        }
    }

    parse_class_definition(): ClassDefinition {
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte einen Klassennamen nach 'Klasse'!").value;
        this.expect(TokenType.EndLine, "Nach dem Klassennamen sollte eine neue Zeile beginnen!");
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
        return { kind: "ClassDefinition", ident, attributes, methods }
    }

    parse_if_else_block(): IfElseBlock {
        const ifTrue: Stmt[] = [];
        const ifFalse: Stmt[] = [];
        this.eat(); // eat 'wenn'
        const condition = this.parse_expr();
        this.expect(TokenType.Then, "Auf 'wenn' sollte 'dann' folgen!");
        this.expect(TokenType.EndLine, "Nach 'dann' sollte eine neue Zeile beginnen!");
        
        while (this.at().type != TokenType.Else && this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt();
            ifTrue.push(statement);
        }
        if (this.eat().type == TokenType.EndBlock) {
            return { kind: "IfElseBlock", condition, ifTrue, ifFalse };
        }
        if (this.at().type == TokenType.If) {
            // if-else chaining
            ifFalse.push(this.parse_if_else_block());
            return {
                kind: "IfElseBlock", 
                condition, 
                ifTrue, 
                ifFalse,
            };
        }
        this.expect(TokenType.EndLine, "Nach 'sonst' sollte eine neue Zeile beginnen!");
        
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt();
            //console.log(statement);
            ifFalse.push(statement);
        }
        this.eat(); // eat 'ende'

        return { kind: "IfElseBlock", condition, ifTrue, ifFalse };
    }

    parse_loop_block(): Stmt {
        this.eat(); // eat 'wiederhole'
        if (this.at().type == TokenType.RepWhile) {
            this.eat(); // eat 'solange'
            return this.parse_while_loop();
        } else {
            return this.parse_for_loop();
        }
    }

    parse_for_loop(): ForBlock {
        const counter = this.parse_expr();
        this.expect(TokenType.RepTimes, "Auf den Zähler sollte 'mal' folgen!");
        this.expect(TokenType.EndLine, "Nach 'mal' sollte eine neue Zeile folgen!");
        const body: Stmt[] = []
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt();
            body.push(statement);
        }
        this.eat(); // eat 'ende'
        return {
            kind: "ForBlock",
            counter,
            body
        };
    }

    parse_while_loop(): WhileBlock {
        const condition = this.parse_expr();
        this.expect(TokenType.EndLine, "Nach der Bedingung sollte eine neue Zeile folgen!");
        const body: Stmt[] = [];
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt();
            body.push(statement);
        }
        this.eat();
        return {
            kind: "WhileBlock",
            condition,
            body,
        };
    }

    parse_var_declaration(): VarDeclaration | ObjDeclaration {
        let type: VarDeclaration["type"] = "null";
        if (this.at().type == TokenType.DeclBoolean) {
            type = "boolean";
        } else if (this.at().type == TokenType.DeclNumber) {
            type = "number";
        } else if (this.at().type == TokenType.DeclString) {
            type = "string";
        } else if (this.at().type == TokenType.DeclObject) {
            return this.parse_obj_declaration();
        }
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Variablennamen nach 'Zahl', 'Wahrheitswert' oder 'Objekt'!").value;
        this.expect(TokenType.Assign, "Erwarte 'ist' nach Variablennamen!");

        return {
            kind: "VarDeclaration",
            ident: ident,
            type: type,
            value: this.parse_expr(),
        };
    }

    parse_param_declaration(): ParamDeclaration {
        let type = "null";
        if (this.at().type == TokenType.DeclBoolean) {
            type = "boolean";
        } else if (this.at().type == TokenType.DeclNumber) {
            type = "number";
        } else if (this.at().type == TokenType.DeclString) {
            type = "string";
        }
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Variablennamen nach 'Zahl', 'Wahrheitswert' oder 'Objekt'!").value;
        return { kind: "ParamDeclaration", type, ident };
    }

    parse_fn_definition(): FunctionDefinition {
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
        const body: Stmt[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt());
        }
        this.eat();

        return { kind: "FunctionDefinition", name, params, body };
    }

    parse_ext_method_definition(): ExtMethodDefinition {
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

        const body: Stmt[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt());
        }
        this.eat();

        return { kind: "ExtMethodDefinition", name, params, body, classname };
    }

    parse_obj_declaration(): ObjDeclaration {
        this.eat();
        const ident = this.expect(TokenType.Identifier, "Erwarte Objektname nach 'Objekt'").value;
        this.expect(TokenType.Instance, "Erwarte 'als' nach Objektnamen!");
        const classname = this.expect(TokenType.Identifier, "Erwarte Klassenname nach 'als'!").value;

        return {
            kind: "ObjDeclaration",
            ident,
            type: "object",
            classname,
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
        const left = this.parse_logical_expr();
        if (this.at().type == TokenType.Assign) {
            this.eat();
            const value = this.parse_assignment_expr();
            return { kind: "AssignmentExpr", value, assigne: left };
        }

        return left;
    }

    private parse_logical_expr(): Expr {
        let left = this.parse_comparison_expr();
        while (this.at().value == "und" || this.at().value == "oder") {
            const operator = this.eat().value;
            const right = this.parse_comparison_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }

        return left;
    }

    private parse_comparison_expr(): Expr {
        let left = this.parse_additive_expr();
        while (this.at().value == "<" || this.at().value == ">" || this.at().value == "=") {
            const operator = this.eat().value;
            const right = this.parse_additive_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }

        return left;
    }

    private parse_additive_expr(): Expr {
        let left = this.parse_multiplicative_expr();
        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }

        return left;
    }

    private parse_multiplicative_expr(): Expr {
        let left = this.parse_unary_expr();
        while (this.at().value == "*" || this.at().value == ":" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.eat().value;
            const right = this.parse_unary_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }

        return left;
    }

    private parse_unary_expr(): Expr {
        if (this.at().type == TokenType.UnaryOperator || this.at().type == TokenType.BinaryOperator) {
            const operator = this.eat().value;
            const right = this.parse_call_expr();
            return { kind: "UnaryExpr", right, operator };
        } else {
            return this.parse_call_expr();
        }
    }

    private parse_call_expr(): Expr {
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
            return { kind: "CallExpr", ident, args };
        } else {
            return ident;
        }
    }

    private parse_member_expr(): Expr {
        let container = this.parse_primary_expr();
        while (this.at().type == TokenType.Period) {
            this.eat();
            const member = this.parse_primary_expr(); // has to be identifier
            if (member.kind != "Identifier")
                throw new ParserError(`Kann Punktoperator nicht nutzen, wenn rechts kein Name steht!`);

            container = {
                kind: "MemberExpr",
                container,
                member
            };
        }

        return container;
    }

    private parse_primary_expr(): Expr {
        const tk = this.at().type;
        switch (tk) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.eat().value };
            case TokenType.Number:
                return { kind: "NumericLiteral", value: parseInt(this.eat().value) };
            case TokenType.String:
                return { kind: "StringLiteral", value: this.eat().value };
            case TokenType.OpenParen: {
                this.eat(); // eat opening paren
                const value = this.parse_expr();
                this.expect(TokenType.CloseParen, "Schließende Klammer fehlt!"); // eat closing paren
                return value;
            }
            case TokenType.EndLine:
                this.eat();
                return { kind: "EmptyLine" };
            default:
                throw new ParserError(`Unerwarteter Token beim Parsing gefunden: '${tk}'`);
        }
    }
}
