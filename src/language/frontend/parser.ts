import {
    Stmt,
    Program,
    Expr,
    VarDeclaration,
    ObjDeclaration,
    FunctionDefinition,
    ShowCommand,
    BreakCommand,
    ContinueCommand,
    ClassDefinition,
    ParamDeclaration,
    ReturnCommand,
    ExtMethodDefinition,
    StmtKind,
    IfElseBlock,
    ForBlock,
    WhileBlock,
    AlwaysBlock,
    AbruptStmtKind,
    DocComment,
    CaseBlock,
    SwitchBlock,
    FromToBlock,
    ListLiteral,
    MemberExpr,
    ForInBlock,
} from "./ast";
import {
    tokenize,
    Token,
    TokenType,
    KEYWORDS,
    ILLEGAL_CODE_POS,
    START_CODE_POS,
    mergeCodePos,
} from "./lexer";
import { ParserError } from "../../errors";
import { ValueAlias } from "../runtime/values";

export default class Parser {
    private tokens: Token[] = [];
    private lastEaten: Token = {
        type: TokenType.Empty,
        value: "",
        codePos: ILLEGAL_CODE_POS(),
    };

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at(): Token {
        return this.tokens[0];
    }

    private eat(): Token {
        const prev = this.tokens.shift()!;
        this.lastEaten = prev; // store previous token
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift();
        if (!prev) {
            throw new ParserError(
                "PARSER: " + err + " - nichts erhalten",
                ILLEGAL_CODE_POS()
            );
        }
        if (prev.type != type) {
            const codePos = prev.codePos;
            throw new ParserError(
                "PARSER: " + err + " - erhalten: " + JSON.stringify(prev.value),
                codePos
            );
        }
        this.lastEaten = prev; // store previous token
        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: StmtKind.Program,
            body: [],
            codePos: START_CODE_POS(),
        };

        // Parse until EOF
        while (this.not_eof()) {
            program.body.push(this.parse_stmt(new Set<never>()));
        }

        /*
        for (const node of program.body) {
            console.log(node.kind, JSON.stringify(node.codePos));
        }
        */

        return program;
    }

    private parse_stmt<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): Stmt<A> {
        const checkControl: Set<AbruptStmtKind> = allowedControl;
        let statement: Stmt<A>;
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
            case TokenType.Switch:
                statement = this.parse_switch_block(allowedControl);
                break;
            case TokenType.Break:
                if (!checkControl.has(StmtKind.BreakCommand))
                    throw new ParserError(
                        `PARSER: "${
                            "abbrechen" satisfies keyof typeof KEYWORDS
                        }" is nur in Schleifen und Unterschiedungen erlaubt.`,
                        this.at().codePos
                    );
                statement = this.parse_break() as any;
                break;
            case TokenType.Continue:
                if (!checkControl.has(StmtKind.ContinueCommand))
                    throw new ParserError(
                        `PARSER: "${
                            "weiter" satisfies keyof typeof KEYWORDS
                        }" is nur in Schleifen und Unterschiedungen erlaubt.`,
                        this.at().codePos
                    );
                statement = this.parse_continue() as any;
                break;
            case TokenType.Return:
                if (!checkControl.has(StmtKind.ReturnCommand))
                    throw new ParserError(
                        `PARSER: "${
                            "zurück" satisfies keyof typeof KEYWORDS
                        }" is nur in Funktionen und Methoden erlaubt.`,
                        this.at().codePos
                    );
                statement = this.parse_return() as any;
                break;
            case TokenType.Show:
                statement = this.parse_show();
                break;
            case TokenType.DeclBoolean:
            case TokenType.DeclNumber:
            case TokenType.DeclString:
            case TokenType.DeclList:
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
                return { kind: StmtKind.EmptyLine, codePos: this.at().codePos };
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
        const codePos = this.at().codePos;
        let content = "";

        while (this.at().type == TokenType.DocComment) {
            content += `${this.at().value}\n`;
            this.eat();
            this.expect(
                TokenType.EndLine,
                "Erwarte neue Zeile nach #-Dokumentation!"
            );
        }

        return {
            kind: StmtKind.DocComment,
            content,
            codePos: mergeCodePos(codePos, this.lastEaten.codePos),
        };
    }

    parse_show(): ShowCommand {
        let codePos = this.at().codePos;

        this.eat();
        const values: Expr[] = [];
        while (this.at().type != TokenType.EndLine) {
            values.push(this.parse_expr());
            if (this.at().type != TokenType.EndLine)
                this.expect(
                    TokenType.Comma,
                    "Erwarte Kommas zwischen zu zeigenden Ausdrücken!"
                );
        }

        return {
            kind: StmtKind.ShowCommand,
            codePos: mergeCodePos(codePos, this.lastEaten.codePos),
            values,
        };
    }

    parse_break(): BreakCommand {
        const codePos = this.at().codePos;

        this.eat();
        return {
            kind: StmtKind.BreakCommand,
            codePos,
        };
    }

    parse_continue(): ContinueCommand {
        const codePos = this.at().codePos;

        this.eat();
        return {
            kind: StmtKind.ContinueCommand,
            codePos,
        };
    }

    parse_return(): ReturnCommand {
        const codePos = this.at().codePos;

        this.eat();
        const result = this.parse_expr();
        return {
            kind: StmtKind.ReturnCommand,
            codePos: mergeCodePos(codePos, result.codePos),
            value: result,
        };
    }

    parse_class_definition(): ClassDefinition {
        let codePos = this.at().codePos;

        this.eat();
        const ident = this.expect(
            TokenType.Identifier,
            "Erwarte einen Klassennamen nach 'Klasse'!"
        ).value;
        const params: ParamDeclaration[] = []; // constructor parameters
        if (this.at().type == TokenType.OpenParen) {
            this.eat();
            // get constructor parameters
            while (this.at().type != TokenType.CloseParen) {
                const param = this.parse_param_declaration();
                params.push(param);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(TokenType.Comma, "Warte Komma nach Paramtern!");
            }
            this.eat(); // found closed paren
        }
        this.expect(
            TokenType.EndLine,
            "Nach dem Klassenkopf sollte eine neue Zeile beginnen!"
        );
        const attributes: (VarDeclaration | ObjDeclaration)[] = [];
        const methods: FunctionDefinition[] = [];
        while (
            this.at().type != TokenType.EndBlock &&
            this.at().type != TokenType.MethodDef
        ) {
            const declaration = this.parse_any_declaration();
            this.expect(
                TokenType.EndLine,
                "Erwarte eine neue Zeile nach jedem Attribut!"
            );
            attributes.push(declaration);
        }
        while (
            this.at().type != TokenType.EndBlock &&
            this.at().type == TokenType.MethodDef
        ) {
            const definition = this.parse_fn_definition();
            this.expect(
                TokenType.EndLine,
                "Erwarte eine neue Zeile nach jeder Methode!"
            );
            methods.push(definition);
        }
        this.eat(); // eat 'ende'

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ClassDefinition,
            ident,
            attributes,
            methods,
            codePos,
            params,
        };
    }

    parse_if_else_block<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): IfElseBlock<A> {
        let codePos = this.at().codePos;

        const ifTrue: Stmt<A>[] = [];
        const ifFalse: Stmt<A>[] = [];
        this.eat(); // eat 'wenn'
        const condition = this.parse_expr();
        this.expect(TokenType.Then, "Auf 'wenn' sollte 'dann' folgen!");
        this.expect(
            TokenType.EndLine,
            "Nach 'dann' sollte eine neue Zeile beginnen!"
        );

        while (
            this.at().type != TokenType.Else &&
            this.at().type != TokenType.EndBlock
        ) {
            const statement = this.parse_stmt(allowedControl);
            ifTrue.push(statement);
        }
        if (this.eat().type == TokenType.EndBlock) {
            return {
                kind: StmtKind.IfElseBlock,
                condition,
                ifTrue,
                ifFalse,
                codePos,
            };
        }
        if (this.at().type == TokenType.If) {
            // if-else chaining
            ifFalse.push(this.parse_if_else_block(allowedControl));
            return {
                kind: StmtKind.IfElseBlock,
                condition,
                ifTrue,
                ifFalse,
                codePos,
            };
        }
        this.expect(
            TokenType.EndLine,
            "Nach 'sonst' sollte eine neue Zeile beginnen!"
        );

        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt(allowedControl);
            //console.log(statement);
            ifFalse.push(statement);
        }

        this.eat(); // eat 'ende'

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.IfElseBlock,
            condition,
            ifTrue,
            ifFalse,
            codePos,
        };
    }

    parse_switch_block<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): SwitchBlock<A> {
        let codePos = this.at().codePos;
        const allowedInSwitch = new Set([
            StmtKind.BreakCommand,
            ...allowedControl,
        ] as const);

        const cases: CaseBlock<A>[] = [];
        const fallback: Stmt<StmtKind.BreakCommand | A>[] = [];

        this.eat(); // eat 'unterscheide'
        const selection = this.parse_expr();
        this.expect(
            TokenType.EndLine,
            "Nach 'unterscheide' sollte auf den Wert eine neue Zeile folgen!"
        );

        while (this.at().type == TokenType.Case) {
            cases.push(this.parse_case_block(allowedControl));
        }
        if (this.at().type == TokenType.Else) {
            this.eat(); // eat 'sonst'
            this.expect(
                TokenType.EndLine,
                "Erwarte eine neue Zeile nach 'sonst'!"
            );
            while (this.at().type != TokenType.EndBlock) {
                const statement = this.parse_stmt(allowedInSwitch);
                fallback.push(statement);
            }
        }

        this.expect(TokenType.EndBlock, "Erwarte 'ende' nach Unterscheidung!");
        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.SwitchBlock,
            selection,
            cases,
            fallback,
            codePos,
        };
    }

    parse_case_block<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): CaseBlock<A> {
        let codePos = this.at().codePos;

        const allowedInCase = new Set([
            StmtKind.ContinueCommand,
            StmtKind.BreakCommand,
            ...allowedControl,
        ] as const);

        this.eat(); // eat 'falls'
        const comp = this.parse_expr();
        this.expect(
            TokenType.EndLine,
            "Nach 'falls' sollte auf den Wert eine neue Zeile folgen."
        );
        const body: Stmt<
            StmtKind.ContinueCommand | StmtKind.BreakCommand | A
        >[] = [];

        while (
            this.at().type != TokenType.Case &&
            this.at().type != TokenType.Else &&
            this.at().type != TokenType.EndBlock
        ) {
            const statement = this.parse_stmt(allowedInCase);
            body.push(statement);
        }

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.CaseBlock,
            comp,
            body,
            codePos,
        };
    }

    parse_loop_block<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): Stmt<A> {
        this.eat(); // eat 'wiederhole'
        if (this.at().type == TokenType.RepWhile) {
            this.eat(); // eat 'solange'
            return this.parse_while_loop(allowedControl);
        } else if (this.at().type == TokenType.RepAlways) {
            this.eat(); // eat 'immer'
            return this.parse_always_loop(allowedControl);
        } else if (this.at().type == TokenType.For) {
            return this.parse_iter_loop(allowedControl);
            // return this.parse_from_to_loop(allowedControl);
        } else if (this.at().type == TokenType.From) {
            return this.parse_from_to_loop(allowedControl, undefined);
        } else {
            return this.parse_for_loop(allowedControl);
        }
    }

    parse_for_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): ForBlock<A> {
        let codePos = this.at().codePos;

        const counter = this.parse_expr();
        this.expect(TokenType.RepTimes, "Auf den Zähler sollte 'mal' folgen!");
        this.expect(
            TokenType.EndLine,
            "Nach 'mal' sollte eine neue Zeile folgen!"
        );
        const body = this.parse_bare_loop(allowedControl);

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ForBlock,
            codePos,
            counter,
            body,
        };
    }

    parse_while_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): WhileBlock<A> {
        let codePos = this.lastEaten.codePos;

        const condition = this.parse_expr();
        this.expect(
            TokenType.EndLine,
            "Nach der Bedingung sollte eine neue Zeile folgen!"
        );
        const body = this.parse_bare_loop(allowedControl);

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.WhileBlock,
            codePos,
            condition,
            body,
        };
    }

    parse_always_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): AlwaysBlock<A> {
        let codePos = this.lastEaten.codePos;

        this.expect(
            TokenType.EndLine,
            "Nach 'immer' sollte eine neue Zeile folgen!"
        );
        const body = this.parse_bare_loop(allowedControl);

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.AlwaysBlock,
            codePos,
            body,
        };
    }

    parse_from_to_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>,
        iterIdent: string | undefined
    ): FromToBlock<A> {
        let codePos = this.lastEaten.codePos;

        this.eat(); // eat 'von'
        const start = this.parse_expr();
        this.expect(TokenType.To, "Erwarte 'bis' nach Startwert.");
        const end = this.parse_expr();
        this.expect(TokenType.EndLine, "Erwarte neue Zeile nach Endwert!");

        const body = this.parse_bare_loop(allowedControl);

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.FromToBlock,
            codePos,
            iterIdent,
            start,
            end,
            body,
        };
    }

    parse_for_in_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>,
        iterIdent: string
    ): ForInBlock<A> {
        let codePos = this.lastEaten.codePos;

        this.eat(); // eat 'in'
        const list = this.parse_expr();
        this.expect(TokenType.EndLine, "Erwarte neue Zeile nach Liste!");

        const body = this.parse_bare_loop(allowedControl);

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ForInBlock,
            codePos,
            iterIdent,
            list,
            body,
        };
    }

    parse_iter_loop<A extends AbruptStmtKind>(allowedControl: Set<A>): Stmt<A> {
        let iterIdent: string | undefined = undefined;
        this.eat(); // eat 'für'
        iterIdent = this.expect(
            TokenType.Identifier,
            "Nach 'für' muss ein noch undefinierter (!) Variablenname folgen!"
        ).value;

        if (this.at().type == TokenType.From) {
            return this.parse_from_to_loop(allowedControl, iterIdent);
        } else if (this.at().type == TokenType.In) {
            return this.parse_for_in_loop(allowedControl, iterIdent);
        }
        throw new ParserError(
            "Erwarte 'von' oder 'in' nach Iterationsvariable!",
            this.at().codePos
        );
    }

    // helper function
    parse_bare_loop<A extends AbruptStmtKind>(
        allowedControl: Set<A>
    ): Stmt<StmtKind.ContinueCommand | StmtKind.BreakCommand | A>[] {
        const allowedInLoop = new Set([
            StmtKind.ContinueCommand,
            StmtKind.BreakCommand,
            ...allowedControl,
        ] as const);
        const body: Stmt<
            StmtKind.ContinueCommand | StmtKind.BreakCommand | A
        >[] = [];
        while (this.at().type != TokenType.EndBlock) {
            const statement = this.parse_stmt(allowedInLoop);
            body.push(statement);
        }
        this.eat(); // eat 'ende'
        return body;
    }

    parse_any_declaration(): VarDeclaration | ObjDeclaration {
        switch (this.at().type) {
            case TokenType.DeclNumber:
            case TokenType.DeclString:
            case TokenType.DeclBoolean:
            case TokenType.DeclList:
                return this.parse_var_declaration();
            case TokenType.DeclObject:
                return this.parse_obj_declaration();
        }
        throw new ParserError(
            `Erwartete Deklaration, erhielt aber '${this.at().value}...'`,
            this.at().codePos
        );
    }

    parse_var_declaration(): VarDeclaration {
        let codePos = this.at().codePos;

        let type: VarDeclaration["type"] = ValueAlias.Null;
        if (this.at().type == TokenType.DeclBoolean) {
            type = ValueAlias.Boolean;
        } else if (this.at().type == TokenType.DeclNumber) {
            type = ValueAlias.Number;
        } else if (this.at().type == TokenType.DeclString) {
            type = ValueAlias.String;
        } else if (this.at().type == TokenType.DeclList) {
            type = ValueAlias.List;
        }

        this.eat();
        const ident = this.expect(
            TokenType.Identifier,
            "Erwarte Variablennamen nach 'Zahl', 'Text', 'Wahrheitswert', 'Liste' oder 'Objekt'!"
        ).value;
        this.expect(TokenType.Assign, "Erwarte 'ist' nach Variablennamen!");
        const value = this.parse_expr();

        return {
            kind: StmtKind.VarDeclaration,
            ident,
            type,
            value,
            codePos: mergeCodePos(codePos, this.lastEaten.codePos),
        };
    }

    parse_param_declaration(): ParamDeclaration {
        let codePos = this.at().codePos;

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
        const ident = this.expect(
            TokenType.Identifier,
            "Erwarte Variablennamen nach 'Zahl', 'Wahrheitswert', 'Text' oder 'Objekt'!"
        ).value;

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return { type, ident, codePos };
    }

    parse_fn_definition(): FunctionDefinition {
        let codePos = this.at().codePos;

        this.eat();
        const name = this.expect(
            TokenType.Identifier,
            "Erwarte einen Funktionsnamen nach 'Funktion'"
        ).value;
        const params: ParamDeclaration[] = [];
        this.expect(TokenType.OpenParen, "Erwarte Klammer nach Funktiosnname!");
        while (this.at().type != TokenType.CloseParen) {
            const param = this.parse_param_declaration();
            params.push(param);
            if (this.at().type == TokenType.CloseParen) break;
            this.expect(TokenType.Comma, "Warte Komma nach Paramtern!");
        }
        this.eat();
        this.expect(
            TokenType.EndLine,
            "Erwarte neue Zeile vor Funktionskörper!"
        );
        const body: Stmt<StmtKind.ReturnCommand>[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt(new Set([StmtKind.ReturnCommand])));
        }
        this.eat();

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.FunctionDefinition,
            name,
            params,
            body,
            codePos,
        };
    }

    parse_ext_method_definition(): ExtMethodDefinition {
        let codePos = this.at().codePos;

        this.eat();
        const name = this.expect(
            TokenType.Identifier,
            "Erwarte einen Funktionsnamen nach 'Funktion'"
        ).value;
        const params: ParamDeclaration[] = [];
        this.expect(TokenType.OpenParen, "Erwarte Klammer nach Methodenname!");
        while (this.at().type != TokenType.CloseParen) {
            const param = this.parse_param_declaration();
            params.push(param);
            if (this.at().type == TokenType.CloseParen) break;
            this.expect(TokenType.Comma, "Erwarte Komma nach Paramtern!");
        }
        this.eat();

        this.expect(
            TokenType.For,
            "Erwarte 'für' bei Definition einer ext. Methode!"
        );
        const classname = this.expect(
            TokenType.Identifier,
            "Erwarte Klassenname nach 'für'!"
        ).value;
        this.expect(
            TokenType.EndLine,
            "Erwarte neue Zeile vor Funktionskörper!"
        );

        const body: Stmt<StmtKind.ReturnCommand>[] = [];
        while (this.at().type != TokenType.EndBlock) {
            body.push(this.parse_stmt(new Set([StmtKind.ReturnCommand])));
        }
        this.eat();

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ExtMethodDefinition,
            name,
            params,
            body,
            classname,
            codePos,
        };
    }

    parse_obj_declaration(): ObjDeclaration {
        let codePos = this.at().codePos;

        this.eat();
        const ident = this.expect(
            TokenType.Identifier,
            "Erwarte Objektname nach 'Objekt'"
        ).value;
        this.expect(TokenType.Instance, "Erwarte 'als' nach Objektnamen!");
        const classname = this.expect(
            TokenType.Identifier,
            "Erwarte Klassenname nach 'als'!"
        ).value;

        const args: Expr[] = [];
        if (this.at().type == TokenType.OpenParen) {
            this.eat();
            while (this.at().type != TokenType.CloseParen) {
                const arg = this.parse_expr();
                args.push(arg);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(
                    TokenType.Comma,
                    "Erwarte Kommas zwischen Parametern!"
                );
            }
            this.expect(
                TokenType.CloseParen,
                "Erwarte schließende Klammer nach Parametern!"
            ); // eat close paren
        }

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ObjDeclaration,
            ident,
            type: ValueAlias.Object,
            classname,
            args,
            codePos,
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
        let codePos = this.at().codePos;

        const left = this.parse_logical_expr();
        if (this.at().type == TokenType.Assign) {
            this.eat();
            const value = this.parse_assignment_expr();

            codePos = mergeCodePos(this.lastEaten.codePos, codePos);
            return {
                kind: StmtKind.AssignmentExpr,
                value,
                assigne: left,
                codePos,
            };
        }

        return left;
    }

    private parse_logical_expr(): Expr {
        let codePos = this.at().codePos;

        let left = this.parse_comparison_expr();
        while (
            this.at().type == TokenType.And ||
            this.at().type == TokenType.Or
        ) {
            const operator = this.eat().value;
            const right = this.parse_comparison_expr();

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                codePos,
            };
        }

        return left;
    }

    private parse_comparison_expr(): Expr {
        let codePos = this.at().codePos;

        let left = this.parse_additive_expr();
        while (
            this.at().type == TokenType.Equal ||
            this.at().type == TokenType.Greater ||
            this.at().type == TokenType.Lesser
        ) {
            const operator = this.eat().value;
            const right = this.parse_additive_expr();

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                codePos,
            };
        }

        return left;
    }

    private parse_additive_expr(): Expr {
        let codePos = this.at().codePos;

        let left = this.parse_multiplicative_expr();
        while (
            this.at().type == TokenType.Plus ||
            this.at().type == TokenType.Minus
        ) {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expr();

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                codePos,
            };
        }

        return left;
    }

    private parse_multiplicative_expr(): Expr {
        let codePos = this.at().codePos;

        let left = this.parse_unary_expr();
        while (
            this.at().type == TokenType.Multiply ||
            this.at().type == TokenType.Divide ||
            this.at().type == TokenType.Mod
        ) {
            const operator = this.eat().value;
            const right = this.parse_unary_expr();

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            left = {
                kind: StmtKind.BinaryExpr,
                left,
                right,
                operator,
                codePos,
            };
        }

        return left;
    }

    private parse_unary_expr(): Expr {
        let codePos = this.at().codePos;

        if (
            this.at().type == TokenType.Not ||
            this.at().type == TokenType.Minus ||
            this.at().type == TokenType.Plus
        ) {
            const operator = this.eat().value;
            const right = this.parse_call_expr();

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            return { kind: StmtKind.UnaryExpr, right, operator, codePos };
        } else {
            return this.parse_call_expr();
        }
    }

    private parse_call_expr(): Expr {
        let codePos = this.at().codePos;

        const ident = this.parse_member_expr();
        if (this.at().type == TokenType.OpenParen) {
            this.eat();
            const args: Expr[] = [];
            while (this.at().type != TokenType.CloseParen) {
                const arg = this.parse_expr();
                args.push(arg);
                if (this.at().type == TokenType.CloseParen) break;
                this.expect(
                    TokenType.Comma,
                    "Erwarte Kommas zwischen Parametern!"
                );
            }
            this.expect(
                TokenType.CloseParen,
                "Erwarte schließende Klammer nach Parametern!"
            ); // eat close paren

            codePos = mergeCodePos(codePos, this.lastEaten.codePos);
            return { kind: StmtKind.CallExpr, ident, args, codePos };
        } else {
            return ident;
        }
    }

    private parse_member_expr(): Expr {
        let codePos = this.at().codePos;

        let container = this.parse_primary_expr();

        while (
            this.at().type == TokenType.Period ||
            this.at().type == TokenType.OpenBracket
        ) {
            const operator = this.eat(); // eat either '.' or '['

            if (operator.type == TokenType.Period) {
                const member = this.parse_primary_expr(); // has to be identifier
                if (member.kind != StmtKind.Identifier)
                    throw new ParserError(
                        `Kann Punktoperator nicht nutzen, wenn rechts kein Name steht!`,
                        this.at().codePos
                    );

                codePos = mergeCodePos(codePos, this.lastEaten.codePos);
                container = {
                    kind: StmtKind.MemberExpr,
                    container,
                    member,
                    codePos,
                };
            } else if (operator.type == TokenType.OpenBracket) {
                const member = this.parse_expr(); // can be anything
                this.expect(
                    TokenType.CloseBracket,
                    "Erwarte ']' nach Zugriffswert!"
                );

                codePos = mergeCodePos(codePos, this.lastEaten.codePos);
                container = {
                    kind: StmtKind.ComputedMemberExpr,
                    container,
                    accessor: member,
                    codePos,
                };
            }
        }

        return container;
    }

    private parse_primary_expr(): Expr {
        const codePos = this.at().codePos;

        const tk = this.at().type;
        switch (tk) {
            case TokenType.Identifier:
                return {
                    kind: StmtKind.Identifier,
                    symbol: this.eat().value,
                    codePos,
                };
            case TokenType.Number:
                return {
                    kind: StmtKind.NumericLiteral,
                    value: parseInt(this.eat().value),
                    codePos,
                };
            case TokenType.String:
                return {
                    kind: StmtKind.StringLiteral,
                    value: this.eat().value,
                    codePos,
                };
            case TokenType.OpenBracket:
                return this.parse_list_expr();
            case TokenType.OpenParen: {
                this.eat(); // eat opening paren
                const value = this.parse_expr();
                this.expect(TokenType.CloseParen, "Schließende Klammer fehlt!"); // eat closing paren
                return value;
            }
            default:
                throw new ParserError(
                    `PARSER: Unerwarteter Token gefunden: ${JSON.stringify(
                        this.at().value
                    )}`,
                    codePos
                );
        }
    }

    parse_list_expr(): ListLiteral {
        let codePos = this.at().codePos;

        this.eat(); // eat [
        const elements: Expr[] = [];
        while (this.at().type !== TokenType.CloseBracket) {
            elements.push(this.parse_expr());
            if (this.at().type == TokenType.CloseBracket) break;
            this.expect(
                TokenType.Comma,
                `Erwarte Kommas zwischen Listenelementen!`
            );
        }

        this.eat(); // eat ]

        codePos = mergeCodePos(codePos, this.lastEaten.codePos);
        return {
            kind: StmtKind.ListLiteral,
            elements,
            codePos,
        };
    }
}
