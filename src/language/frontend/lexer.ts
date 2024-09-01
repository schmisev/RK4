import { LexerError } from "../../errors";


export enum TokenType {
    // Literals
    Number,
    Identifier,
    String,
    DocComment,

    // Keywords
    Show,
    Assign, Instance,
    DeclNumber, DeclBoolean, DeclString,
    DeclObject, Self, DotOp,
    If, Then, IfElse, Else,
    Return,
    Repeat, RepTimes, RepWhile, RepAlways, Break, Continue,

    // Operations
    OpenParen, CloseParen,
    OpenBrace, CloseBrace,
    Comma, Period,
    Plus,
    Minus,
    Multiply,
    Divide,
    Mod,
    Greater,
    Lesser,
    Equal,
    Not,
    And,
    Or,
    // GeneralOperator,
    // BinaryOperator,
    // UnaryOperator,

    // Declarations
    ClassDef,
    FunctionDef,
    MethodDef, MethodFor,

    EndBlock,
    EndLine,
    EOF,
}

export const KEYWORDS: Record<string, TokenType> = {
    Zahl: TokenType.DeclNumber,
    Wahrheitswert: TokenType.DeclBoolean,
    Text: TokenType.DeclString,
    Objekt: TokenType.DeclObject,
    selbst: TokenType.Self,

    nicht: TokenType.Not,
    und: TokenType.And,
    oder: TokenType.Or,

    zeig: TokenType.Show,
    wenn: TokenType.If,
    dann: TokenType.Then,
    sonst: TokenType.Else,
    ist: TokenType.Assign,
    als: TokenType.Instance,
    wiederhole: TokenType.Repeat,
    solange: TokenType.RepWhile,
    mal: TokenType.RepTimes,
    immer: TokenType.RepAlways,
    abbrechen: TokenType.Break,
    weiter: TokenType.Continue,
    zurück: TokenType.Return,
    ende: TokenType.EndBlock,

    Funktion: TokenType.FunctionDef,
    Klasse: TokenType.ClassDef,
    Methode: TokenType.MethodDef,
    für: TokenType.MethodFor,
}

export interface Token {
    value: string;
    type: TokenType;
    lineIndex: number;
}

function token(value = "", type: TokenType, lineIndex: number): Token {
    return { value, type, lineIndex };
}

function isalpha(src: string) {
    return src.toUpperCase() != src.toLocaleLowerCase();
}

function isint(src: string) {
    const c = src.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)]
    return (c >= bounds[0] && c <= bounds[1]);
}

function isskippable(src: string) {
    return src == " " || src == "\t" || src == "\r";
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");
    let lineCount = 0;

    while (src.length > 0) {
        if (src[0] == "(") {
            tokens.push(token(src.shift(), TokenType.OpenParen, lineCount));
        } else if (src[0] == ")"){
            tokens.push(token(src.shift(), TokenType.CloseParen, lineCount));
        } else if (src[0] == '+'){
            tokens.push(token(src.shift(), TokenType.Plus, lineCount));
        } else if (src[0] == '-'){
            tokens.push(token(src.shift(), TokenType.Minus, lineCount));
        } else if (src[0] == '*'){
            tokens.push(token(src.shift(), TokenType.Multiply, lineCount));
        } else if (src[0] == ':'){
            tokens.push(token(src.shift(), TokenType.Divide, lineCount));
        } else if (src[0] == '%'){
            tokens.push(token(src.shift(), TokenType.Mod, lineCount));
        } else if (src[0] == '='){
            tokens.push(token(src.shift(), TokenType.Equal, lineCount));
        } else if (src[0] == '>'){
            tokens.push(token(src.shift(), TokenType.Greater, lineCount));
        } else if (src[0] == '<'){
            tokens.push(token(src.shift(), TokenType.Lesser, lineCount));
        } else if (src[0] == '-'){
            tokens.push(token(src.shift(), TokenType.Minus, lineCount));
        } else if (src[0] == '\n'){
            if (tokens.length > 0 && tokens[tokens.length - 1].type == TokenType.EndLine) {
                src.shift();
            } else {
                tokens.push(token(src.shift(), TokenType.EndLine, lineCount));
            }
            // increase line count for debug
            lineCount += 1;
        } else if (src[0] == '.'){
            tokens.push(token(src.shift(), TokenType.Period, lineCount));
        } else if (src[0] == ','){
            tokens.push(token(src.shift(), TokenType.Comma, lineCount));
        } else if (src[0] == '{'){
            tokens.push(token(src.shift(), TokenType.OpenBrace, lineCount));
        } else if (src[0] == '}'){
            tokens.push(token(src.shift(), TokenType.OpenBrace, lineCount));
        } else {
            // Handle multicharacter tokens
            if (src[0] == "/"){
                if (src.length <= 1) {
                    // tailing divide???
                    tokens.push(token(src.shift(), TokenType.Divide, lineCount));
                }
                // c-style comments
                else {
                    if (src[1] == "/") {
                        // single line comment
                        src.shift();
                        src.shift(); // get rid of "//"
                        // loop through until newline
                        let chr = src[0];
                        while (src.length > 0 && chr != "\n") {
                            src.shift();
                            chr = src[0];
                        }
                        //if (chr == "\n") lineCount ++;
                    } else if (src[1] == "*") {
                        // multi line comment
                        src.shift();
                        src.shift(); // get rid of "/*"
                        // loop through until */
                        let chr0 = src[0];
                        let chr1 = src[1];
                        while (src.length > 1 && chr0 != "*" && chr1 != "/") {
                            if (chr0 == "\n") lineCount ++;
                            src.shift();
                            chr0 = src[0];
                            chr1 = src[1];
                        }
                        src.shift();
                        src.shift(); // get rid of */
                    } else {
                        // nope, its just a divide
                        tokens.push(token(src.shift(), TokenType.Divide, lineCount));
                    }
                }
            } else if (src[0] == '"') {
                // strings
                src.shift();
                let str = "";
                while(src.length > 0) {
                    if (src[0] == '"') break;
                    if (src[0] == "\n") lineCount ++;
                    str += src.shift();
                }
                src.shift();
                tokens.push(token(str, TokenType.String, lineCount));
            }
            else if (src[0] == "#") {
                // Doc comments
                src.shift();
                let chr;
                let str = "";
                while(src.length > 0) {
                    chr = src[0];
                    if (chr == "\n") {
                        break;
                    }
                    str += chr; // add to doc comment
                    src.shift(); // NOTICE: we are not shifting newline
                }
                tokens.push(token(str, TokenType.DocComment, lineCount));
            }
            /*
            else if (src[0] == "[") {
                let chr = src[0];
                while (src.length > 0 && chr != "]") {
                    if (chr == "\n") lineCount ++;
                    src.shift();
                    chr = src[0];
                }
                src.shift();
            }
            */
            else if (isint(src[0])) {
                let num = "";
                while(src.length > 0 && isint(src[0])) {
                    num += src.shift();
                }

                tokens.push(token(num, TokenType.Number, lineCount));
            }
            else if (isalpha(src[0])) {
                let ident = "";
                ident += src.shift();
                while(src && src.length > 0 && (isalpha(src[0]) || isint(src[0]))) {
                    ident += src.shift();
                }

                // check for reserved keywords
                const reserved = KEYWORDS[ident];
                if (typeof reserved != "number") {
                    tokens.push(token(ident, TokenType.Identifier, lineCount));
                } else {
                    tokens.push(token(ident, reserved, lineCount));
                }
            }
            else if (isskippable(src[0])) {
                src.shift();
            }
            else {
                throw new LexerError("LEXER: Unbekanntes Zeichen: " + src[0], lineCount);
            }
        }
    }

    if (tokens.length > 0 && tokens[tokens.length - 1].type != TokenType.EndLine)
        tokens.push(token("forced newline", TokenType.EndLine, ++ lineCount));
    tokens.push(token("eof", TokenType.EOF, lineCount));

    while (tokens[0].type == TokenType.EndLine) {
        tokens.shift();
    }

    return tokens;
}