export class RuntimeError extends Error {}
export class ParserError extends Error {
    lineIndex: number
    constructor(msg: string, lineIndex: number) {
        super(msg);
        this.lineIndex = lineIndex;
    }
}
export class LexerError extends Error {}
export class WorldError extends Error {}