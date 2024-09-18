import mermaid from "mermaid"
import { AnyAlwaysBlock, AnyForBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, Expr, ForBlock, IfElseBlock, Program, StmtKind, SwitchBlock } from "../language/frontend/ast";
import { content } from "html2canvas/dist/types/css/property-descriptors/content";
import { skip } from "node:test";
import { stringify } from "node:querystring";
import { error } from "node:console";
mermaid.initialize({ startOnLoad: true });

// state
let idCounter = 0;
let declStack: string[] = []; // all node names
let connStack: string[] = []; // all node connections

enum Type {
    Program = "Prg",
    Regular = "Reg",
    Return = "Ret",
    Break = "Brk",
    Continue = "Cnt",
    Call = "Cll",
    Ignore =  "Ign",
    Unwrapped = "Uwr",
    Error = "Err"
}

interface ChartNode {
    type: Type;
    id?: string;
    str?: string;
    outLabel?: string
}

function nextId() {
    idCounter ++;
    return "" + idCounter;
}

function declare(content: string, info = Type.Regular, lb = "[", rb = "]"): ChartNode {
    const id = nextId();
    declStack.push(id + lb + '"`' + content + '`"' + rb);
    return {str: content, id, type: info};
}

function connect(seq: string) {
    connStack.push(seq);
}

function connectTwo(nodeA: ChartNode, nodeB: ChartNode): ChartNode {
    if (!nodeA.id) return mkError();
    if (!nodeB.id || nodeB.type == Type.Ignore) return nodeA;
    if (nodeA.outLabel) {
        connect(`${nodeA.id} -->|${nodeA.outLabel}| ${nodeB.id}`);
    } else {
        connect(`${nodeA.id} --> ${nodeB.id}`);
    }
    return nodeB;
}

function connectAll(fromNodes: ChartNode[], toNode: ChartNode): ChartNode[] {
    const looseEnds = new Set<ChartNode>();
    if (!toNode.id || toNode.type == Type.Ignore) return fromNodes;
    for (const node of fromNodes) {
        looseEnds.add(connectTwo(node, toNode));
    }
    return Array.from(looseEnds);
}

const declTerm = (content: string, info = Type.Regular) => declare(content, info, "([", "])");
const declIO = (content: string, info = Type.Regular) => declare(content, info, "[/", "/]");
const declCall = (content: string, info = Type.Regular) => declare(content, info, "[[", "]]");
const declCon = (content: string, info = Type.Regular) => declare(content, info, "((", "))");
const declProc = (content: string, info = Type.Regular) => declare(content, info, "[", "]");
const declDec = (content: string, info = Type.Regular) => declare(content, info, "{{", "}}");
const declCtrl = (content: string, info: Type.Break | Type.Return | Type.Continue) => declare(content, info, "(", ")");

function mkIgnore(): ChartNode { return { type: Type.Ignore }; }
function mkError() { return { type: Type.Error }; }

export function showFlowchart(program: Program) {
    const flowchartView = document.getElementById("code-flowchart")!;
    flowchartView.innerHTML = "flowchart TD\n" + makeFlowchart(program);
    console.log(flowchartView.innerText);
    flowchartView.removeAttribute("data-processed")
    mermaid.contentLoaded();
}

function makeFlowchart(program: Program) {
    // reset
    idCounter = 0;
    declStack = [];
    connStack = [];
    // make new flowchart
    chartProgram(program);
    const fullStr = declStack.join("\n") + "\n" + connStack.join("\n");
    // reset
    idCounter = 0;
    declStack = [];
    connStack = [];
    
    return fullStr;
}

function chart(stmt: AnyStmt): ChartNode {
    switch (stmt.kind) {
        case StmtKind.VarDeclaration:
            return declProc(stmt.ident + " := " + chartExpr(stmt.value).str);
        case StmtKind.ObjDeclaration:
            return declProc(stmt.ident + " := " + stmt.classname + "(" + stmt.args.map(chartExpr).map((a) => a.str).join(", ") + ")");
        case StmtKind.EmptyLine:
            return mkIgnore();
        case StmtKind.DocComment:
            return mkIgnore();
        case StmtKind.IfElseBlock:
        case StmtKind.SwitchBlock:
        case StmtKind.ForBlock:
        case StmtKind.WhileBlock:
        case StmtKind.AlwaysBlock:
            return mkError();
        case StmtKind.ShowCommand:
            return declIO(stmt.values.map(chartExpr).map((a) => a.str).join("\n"));
        case StmtKind.BreakCommand:
            return declTerm("abbrechen", Type.Break);
        case StmtKind.ContinueCommand:
            return declTerm("weiter", Type.Continue);
        case StmtKind.ReturnCommand:
            return declTerm("zurück", Type.Break);
        case StmtKind.ClassDefinition:
        case StmtKind.FunctionDefinition:
        case StmtKind.ExtMethodDefinition:
            break;
        case StmtKind.AssignmentExpr:
        case StmtKind.BinaryExpr:
        case StmtKind.UnaryExpr:
        case StmtKind.Identifier:
        case StmtKind.NumericLiteral:
        case StmtKind.NullLiteral:
        case StmtKind.BooleanLiteral:
        case StmtKind.StringLiteral:
        case StmtKind.MemberExpr:
        case StmtKind.CallExpr:
            return chartExpr(stmt);
    }
    return mkIgnore();
}

function chartExpr(expr: Expr): ChartNode {
    switch (expr.kind) {
        case StmtKind.AssignmentExpr:
            const val = chartExpr(expr.value);
            return {str: chartExpr(expr.assigne).str + " := " + val.str, type: val.type};
        case StmtKind.BinaryExpr:
            return {str: chartExpr(expr.left).str + " " + expr.operator + " " + chartExpr(expr.right).str, type: Type.Unwrapped};
        case StmtKind.UnaryExpr:
            return {str: expr.operator + " " + chartExpr(expr.right).str, type: Type.Unwrapped};
        case StmtKind.Identifier:
            return {str: expr.symbol, type: Type.Unwrapped};
        case StmtKind.NumericLiteral:
            return {str: `${expr.value}`, type: Type.Unwrapped};
        case StmtKind.NullLiteral:
            return {str: `nix`, type: Type.Unwrapped};
        case StmtKind.BooleanLiteral:
            return {str: `${expr.value ? "wahr" : "falsch"}`, type: Type.Unwrapped};
        case StmtKind.StringLiteral:
            return {str: `#quot;${expr.value}#quot;`, type: Type.Unwrapped};
        case StmtKind.MemberExpr:
            const member = chartExpr(expr.member);
            return {str: chartExpr(expr.container).str + "." + member.str, type: member.type};
        case StmtKind.CallExpr:
            return {str: chartExpr(expr.ident).str + "(" + expr.args.map(chartExpr).map((a) => a.str).join(", ") + ")", type: Type.Call};
    }
    return {type: Type.Ignore};
}

function chartProgram(program: Program): void {
    const startNode = declTerm("START");
    connectAll(chartSequence(program.body, [startNode]), declTerm("ENDE"));
}

function chartSequence(body: AnyStmt[], entry: ChartNode[]): ChartNode[] {
    let looseEnds: ChartNode[] = []
    let lastNodes = entry;
    for (const stmt of body) {
        switch (stmt.kind) {
            case StmtKind.ForBlock:
                lastNodes = chartForLoop(stmt, lastNodes);
                break;
            case StmtKind.IfElseBlock:
            case StmtKind.SwitchBlock:
            case StmtKind.WhileBlock:
            case StmtKind.AlwaysBlock:
                lastNodes = connectAll(lastNodes, declProc("Platzhalter: " + stmt.kind));
                continue; // ignore for now
            default:
                const singleNode = chart(stmt);
                lastNodes = connectAll(lastNodes, singleNode);
        }
    }
    looseEnds = looseEnds.concat(lastNodes);
    return looseEnds;
}

function chartForLoop(loop: AnyForBlock, entry: ChartNode[]): ChartNode[] {
    const looseEnds: ChartNode[] = [];
    const repeatSeq: ChartNode[] = [];
    
    const dec = connectAll(entry, declDec(chartExpr(loop.counter).str + " mal?"))[0];
    dec.outLabel = "✔️";
    const seq = chartSequence(loop.body, [dec]);

    for (const s of seq) {
        switch (s.type) {
            case Type.Return:
            case Type.Break:
            case Type.Continue:
                looseEnds.push(declProc("Strg"));
                continue;
            default:
                repeatSeq.push(s);
        }
    }

    dec.outLabel = "❌";
    const exit = connectAll(repeatSeq, dec);
    return exit;
}

function chartWhileLoop(loop: AnyWhileBlock, entry: ChartNode): ChartNode[] {
    return [entry];
}

function chartAlwaysLoop(loop: AnyAlwaysBlock, entry: ChartNode): ChartNode[] {
    return [entry];
}

function chartIfElse(block: AnyIfElseBlock, entry: ChartNode): ChartNode[] {
    return [entry];
}