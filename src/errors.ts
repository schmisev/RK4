import { CodePosition, ILLEGAL_CODE_POS } from "./language/frontend/lexer";

export class DebugError extends Error {
    lineIndex: CodePosition
    constructor(msg: string, lineIndex: CodePosition) {
        super(msg);
        this.lineIndex = Object.assign({}, lineIndex);
    }
}

export class ParserError extends DebugError {}

export class LexerError extends DebugError {}

export class RuntimeError extends DebugError {
    constructor(msg: string, lineIndex?: CodePosition) {
        super(msg, lineIndex != undefined ? Object.assign({}, lineIndex) : ILLEGAL_CODE_POS());
    }
}

export class WorldError extends Error {}
