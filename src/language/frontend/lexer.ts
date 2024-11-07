import { LexerError } from "../../errors";


export enum TokenType {
    // Empty
    Empty,

    // Literals
    Number,
    Identifier,
    String,
    DocComment,

    // Keywords
    Show,
    Assign, Instance,
    DeclNumber, DeclBoolean, DeclString, DeclList,
    DeclObject, Self, DotOp,
    If, Then, IfElse, Else,
    Return,
    Repeat, RepTimes, RepWhile, RepAlways, Break, Continue, From, To, In,
    Switch, Case,

    // Operations
    OpenParen, CloseParen,
    OpenBrace, CloseBrace,
    OpenBracket, CloseBracket,
    Comma, Period,
    Plus,
    Minus,
    Multiply,
    Divide,
    Mod,
    Greater,
    GEQ,
    Lesser,
    LEQ,
    Equal,
    Not,
    NEQ,
    And,
    Or,
    // GeneralOperator,
    // BinaryOperator,
    // UnaryOperator,

    // Declarations
    ClassDef,
    FunctionDef,
    MethodDef, For,

    EndBlock,
    EndLine,
    EOF,
}

export const KEYWORDS: Record<string, TokenType> = {
    Zahl: TokenType.DeclNumber,
    Wahrheitswert: TokenType.DeclBoolean,
    Text: TokenType.DeclString,
    Liste: TokenType.DeclList,
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
    sei: TokenType.Assign,
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
    für: TokenType.For,
    von: TokenType.From,
    bis: TokenType.To,
    in: TokenType.In,

    unterscheide: TokenType.Switch,
    falls: TokenType.Case,
}

export interface Token {
    value: string;
    type: TokenType;
    codePos: CodePosition;
}

export interface CodePosition {
    lineIndex: number;
    lineIndexEnd: number;
    startPos: number;
    endPos: number;
}

export function mergeCodePos(a: CodePosition, b: CodePosition): CodePosition {
    let lineIndex = -1;
    let lineIndexEnd = -1;
    let startPos = -1;
    let endPos = -1;
    
    if (a.lineIndex == b.lineIndex) {
        lineIndex = a.lineIndex;
        startPos = Math.min(a.startPos, b.startPos);
    }
    else if (a.lineIndex < b.lineIndex) {
        lineIndex = a.lineIndex;
        startPos = a.startPos;
    } else {
        lineIndex = b.lineIndex;
        startPos = b.startPos;
    }

    if (a.lineIndexEnd == b.lineIndexEnd) {
        lineIndexEnd = a.lineIndexEnd;
        endPos = Math.max(a.endPos, b.endPos);
    }
    else if (a.lineIndexEnd > b.lineIndexEnd) {
        lineIndexEnd = a.lineIndexEnd;
        endPos = a.endPos;
    } else {
        lineIndexEnd = b.lineIndexEnd;
        endPos = b.endPos;
    }

    return {lineIndex, lineIndexEnd, startPos, endPos};
}

export function ILLEGAL_CODE_POS(): CodePosition {
    return {lineIndex: -1, lineIndexEnd: -1, startPos: -1, endPos: -1};
}

export function START_CODE_POS(): CodePosition {
    return {lineIndex: 0, lineIndexEnd: 0, startPos: 0, endPos: 1};
}

function token(value = "", type: TokenType, lineIndex: CodePosition): Token {
    return { value, type, codePos: lineIndex };
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

export function tokenize(sourceCode: string, trackPos: boolean): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");
    let lineIndex = 0;
    let lineIndexEnd = 0;
    let startPos = 0;
    let endPos = 1;

    // helper functions
    const getPos = () => {
        if (!trackPos) return ILLEGAL_CODE_POS();
        return {lineIndex, lineIndexEnd, startPos, endPos};
    }

    const widenPos = () => {
        endPos ++;
    }

    const narrowPos = () => {
        endPos --;
    }

    const nextPos = () => {
        lineIndex = lineIndexEnd;
        startPos = endPos;
        endPos = startPos + 1;
    }

    const newLine = () => {
        lineIndex = lineIndexEnd + 1;
        lineIndexEnd ++;
        startPos = 0;
        endPos = 1;
    }

    const addLine = () => {
        lineIndexEnd ++;
        endPos = 1;
    }

    while (src.length > 0) {
        if (src[0] == "(") {
            tokens.push(token(src.shift(), TokenType.OpenParen, getPos()));
            nextPos();
        } else if (src[0] == ")"){
            tokens.push(token(src.shift(), TokenType.CloseParen, getPos()));
            nextPos();
        } else if (src[0] == '+'){
            tokens.push(token(src.shift(), TokenType.Plus, getPos()));
            nextPos();
        } else if (src[0] == '-'){
            tokens.push(token(src.shift(), TokenType.Minus, getPos()));
            nextPos();
        } else if (src[0] == '*'){
            tokens.push(token(src.shift(), TokenType.Multiply, getPos()));
            nextPos();
        } else if (src[0] == ':'){
            tokens.push(token(src.shift(), TokenType.Divide, getPos()));
            nextPos();
        } else if (src[0] == '%'){
            tokens.push(token(src.shift(), TokenType.Mod, getPos()));
            nextPos();
        } else if (src[0] == '='){
            tokens.push(token(src.shift(), TokenType.Equal, getPos()));
            nextPos();
        } else if (src[0] == '>'){
            let str = src.shift()!;
            if (src.length > 0 && src.at(0) == "=") {
                str += src.shift()!;
                widenPos();
                tokens.push(token(str, TokenType.GEQ, getPos()));
            } else {
                tokens.push(token(str, TokenType.Greater, getPos()));
            }
            nextPos();
        } else if (src[0] == '<'){
            let str = src.shift()!;
            if (src.length > 0 && src.at(0) == "=") {
                str += src.shift()!;
                widenPos();
                tokens.push(token(str, TokenType.LEQ, getPos()));
            } else {
                tokens.push(token(str, TokenType.Lesser, getPos()));
            }
            nextPos();
        } else if (src[0] == '!'){
            let str = src.shift();
            if (src.length > 0 && src.at(0) == "=") {
                str += src.shift()!;
                widenPos();
                tokens.push(token(str, TokenType.NEQ, getPos()));
            } else {
                tokens.push(token(str, TokenType.Not, getPos()));
            }
            nextPos();
        } else if (src[0] == '-'){
            tokens.push(token(src.shift(), TokenType.Minus, getPos()));
            nextPos();
        } else if (src[0] == '\n'){
            if (tokens.length > 0 && tokens[tokens.length - 1].type == TokenType.EndLine) {
                src.shift();
            } else {
                tokens.push(token(src.shift(), TokenType.EndLine, getPos()));
            }
            // increase line count for debug
            newLine(); // lineCount += 1;
        } else if (src[0] == ';') {
            tokens.push(token(src.shift(), TokenType.EndLine, getPos()));
            nextPos();
        } else if (src[0] == '.'){
            tokens.push(token(src.shift(), TokenType.Period, getPos()));
            nextPos();
        } else if (src[0] == ','){
            tokens.push(token(src.shift(), TokenType.Comma, getPos()));
            nextPos();
        } else if (src[0] == '{'){
            tokens.push(token(src.shift(), TokenType.OpenBrace, getPos()));
            nextPos();
        } else if (src[0] == '}'){
            tokens.push(token(src.shift(), TokenType.CloseBrace, getPos()));
            nextPos();
        } else if (src[0] == '['){
            tokens.push(token(src.shift(), TokenType.OpenBracket, getPos()));
            nextPos();
        } else if (src[0] == ']'){
            tokens.push(token(src.shift(), TokenType.CloseBracket, getPos()));
            nextPos();
        } else {
            // Handle multicharacter tokens
            if (src[0] == "/"){
                if (src.length <= 1) {
                    // tailing divide???
                    tokens.push(token(src.shift(), TokenType.Divide, getPos()));
                    nextPos();
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
                            if (chr0 == "\n") newLine(); // lineCount ++;
                            src.shift();
                            chr0 = src[0];
                            chr1 = src[1];
                        }
                        src.shift();
                        src.shift(); // get rid of */
                    } else {
                        // nope, its just a divide
                        tokens.push(token(src.shift(), TokenType.Divide, getPos()));
                        nextPos();
                    }
                }
            } else if (src[0] == '"') {
                // strings
                src.shift();
                widenPos();
                
                let str = "";
                while(src.length > 0) {
                    if (src[0] == '"') break;
                    if (src[0] == "\n") {
                        addLine(); // lineCount ++;
                        str += src.shift();
                        continue;
                    }
                    str += src.shift();
                    widenPos();
                }
                src.shift();
                //widenPos();

                tokens.push(token(str, TokenType.String, getPos()));
                nextPos();
            }
            else if (src[0] == "#") {
                // Doc comments
                src.shift();
                widenPos();

                let chr;
                let str = "";
                while(src.length > 0) {
                    chr = src[0];
                    if (chr == "\n") {
                        break;
                    }
                    str += chr; // add to doc comment
                    src.shift(); // NOTICE: we are not shifting newline
                    widenPos();
                }
                narrowPos();
                tokens.push(token(str, TokenType.DocComment, getPos()));
                nextPos();
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
                    widenPos();
                }
                narrowPos();
                tokens.push(token(num, TokenType.Number, getPos()));
                nextPos();
            }
            else if (isalpha(src[0]) || src[0] == "_") {
                let ident = "";
                while(src && src.length > 0 && (isalpha(src[0]) || isint(src[0]) || src[0] == "_")) {
                    ident += src.shift();
                    widenPos();
                }
                narrowPos()
                // check for reserved keywords
                const reserved = KEYWORDS[ident];
                if (typeof reserved != "number") {
                    tokens.push(token(ident, TokenType.Identifier, getPos()));
                } else {
                    tokens.push(token(ident, reserved, getPos()));
                }
                nextPos();
            }
            else if (isskippable(src[0])) {
                src.shift();
                nextPos();
            }
            else {
                throw new LexerError("LEXER: Unbekanntes Zeichen: " + src[0], getPos());
            }
        }
    }

    if (tokens.length > 0 && tokens[tokens.length - 1].type != TokenType.EndLine) {
        newLine();
        tokens.push(token("Erzwungene neue Zeile", TokenType.EndLine, getPos() /*++ lineCount*/));
    }
    tokens.push(token("EOF", TokenType.EOF, getPos()));

    while (tokens[0].type == TokenType.EndLine) {
        tokens.shift();
    }

    return tokens;
}