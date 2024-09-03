export class DebugError extends Error {
    lineIndex: number
    constructor(msg: string, lineIndex: number) {
        super(msg);
        this.lineIndex = lineIndex;
    }
}

export class ParserError extends DebugError {}

export class LexerError extends DebugError {}

export class RuntimeError extends Error {
    lineIndex?: number
    constructor(msg: string, lineIndex?: number) {
        super(msg);
        this.lineIndex = lineIndex;
    }
}

export class WorldError extends Error {}
