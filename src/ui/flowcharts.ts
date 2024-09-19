import mermaid from "mermaid"
import { AnyAlwaysBlock, AnyForBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, Expr, Program, StmtKind } from "../language/frontend/ast";
import { RuntimeError } from "../errors";
mermaid.initialize({ startOnLoad: true });

// diagram formatting

const frontmatter = `%%{
    init: {
        'theme':'base',
        'themeVariables': {
            'primaryColor': '#f5f5f5',
            'primaryTextColor': '#000',
            'primaryBorderColor': 'rgba(0, 0, 0, 0.5)',
            'lineColor': '#000',
            'secondaryColor': 'rgba(255, 255, 255, 0.2)',
            'tertiaryColor': 'rgba(255, 255, 255, 0.2)'
        },
        'layout':'elk'
    }
}%%
flowchart TD
`;

// state
let idCounter = 0;
let declStack: string[] = []; // all node names
let connStack: string[] = []; // all node connections
let lateConnStack: string[] = []; // late connections

// style mapping
const styleMap: Record<string, [string, Array<string>]> = {
    "Dec": ["fill:#FADA5E", []],
    "Term": ["fill:lightgreen", []],
    "IO": ["fill:#CF9FFF", []],
    "Call": ["fill:lightblue", []],
    "Con": ["fill:black", []],
    "Proc": ["fill:whitesmoke", []],
    "Ctrl": ["fill:lightcoral", []],
}

function flushStyleMap() {
    for (const k of Object.keys(styleMap)) {
        styleMap[k][1] = [];
    }
}

function generateStyleStr() {
    let styleStr = ""
    for (const k of Object.keys(styleMap)) {
        const [css, nodes] = styleMap[k];
        if (nodes.length > 0) {
            styleStr += "classDef " + k + " " + css + "\n";
            styleStr += "class " + nodes.join(",") + " " + k + "\n";
        }
    }
    return styleStr;
}

// node logic
enum Type {
    Program = "Prg",
    Regular = "Reg",
    Return = "Ret",
    Break = "Brk",
    Continue = "Cnt",
    Call = "Cll",
    Unwrapped = "Uwr",
    Error = "Err"
}

interface ChartNode {
    type: Type;
    id: string;
    str?: string;
}

interface Port {
    type?: Type;
    id: string;
    outLabel?: string;
}

function nextId() {
    idCounter ++;
    return `n${idCounter}`;
}

function declare(content: string, info = Type.Regular, lb = "[", rb = "]", cls?: string): ChartNode {
    const id = nextId();
    declStack.push(id + lb + '"`' + content + '`"' + rb);
    if (cls) styleMap[cls][1].push(id);
    return {str: content, id, type: info};
}

function connect(seq: string) {
    connStack.push(seq);
}

function connectForward(port: Port, nodeB: ChartNode): Port {
    if (port.outLabel) {
        connect(`${port.id} -->|${port.outLabel}| ${nodeB.id}`);
    } else {
        connect(`${port.id} --> ${nodeB.id}`);
    }
    return { ...nodeB };
}

function connectAll(fromPorts: Port[], toNode: ChartNode) {
    for (const port of fromPorts) {
        connectForward(port, toNode);
    }
}

interface LooseEnds {
    return?: Port[],
    continue?: Port[],
    break?: Port[],
    runover: Port[],
}
const startEnds = (node: ChartNode, outLabel?: string): LooseEnds => {
    return { runover: [{ id: node.id, outLabel }] } 
}
const tieEndsSequentially = (first: LooseEnds, follow: LooseEnds): LooseEnds => {
    const ret = first.return || follow.return ? [...(first.return || []), ...(follow.return || [])] : undefined;
    const cont = first.continue || follow.continue ? [...(first.continue || []), ...(follow.continue || [])] : undefined;
    const brk = first.break || follow.break ? [...(first.break || []), ...(follow.break || [])] : undefined;
    return { return: ret, continue: cont, break: brk, runover: follow.runover };
}
const tieEndsParallel = (first: LooseEnds, second: LooseEnds): LooseEnds => {
    const ret = first.return || second.return ? [...(first.return || []), ...(second.return || [])] : undefined;
    const cont = first.continue || second.continue ? [...(first.continue || []), ...(second.continue || [])] : undefined;
    const brk = first.break || second.break ? [...(first.break || []), ...(second.break || [])] : undefined;
    return { return: ret, continue: cont, break: brk, runover: [...first.runover, ...second.runover] };

}
const tieNodeToEnds = (ends: LooseEnds, node?: ChartNode, outLabel?: string): LooseEnds => {
    if (!node) return ends;
    connectAll(ends.runover, node);
    const follow = { id: node.id, outLabel };
    switch (node.type) {
        case Type.Break:
            return { ...ends, break: (ends.break || []).concat(follow), runover: [] };
        case Type.Continue:
            return { ...ends, continue: (ends.continue || []).concat(follow), runover: [] };
        case Type.Return:
            return { ...ends, return: (ends.return || []).concat(follow), runover: [] };
        default:
            return { ...ends, runover: [follow] }
    }
}
const tieUpLoop = (ends: LooseEnds, loopCtrl: ChartNode): LooseEnds => {
    // In a loop, any runover or continue gets connected to the loop control
    connectAll([...ends.runover, ...(ends.continue || [])], loopCtrl);
    return { return: ends.return, runover: ends.break || [] }
}

const declTerm = (content: string, info = Type.Regular) => declare(content, info, "([", "])", "Term");
const declIO = (content: string, info = Type.Regular) => declare(content, info, "[/", "/]", "IO");
const declCall = (content: string, info = Type.Call) => declare(content, info, "[[", "]]", "Call");
const declCon = (content: string, info = Type.Regular) => declare(content, info, "((", "))", "Con");
const declProc = (content: string, info = Type.Regular) => declare(content, info, "[", "]", "Proc");
const declDec = (content: string, info = Type.Regular) => declare(content, info, "{{", "}}", "Dec");
const declCtrl = (content: string, info: Type.Break | Type.Return | Type.Continue) => declare(content, info, "(", ")", "Ctrl");

function mkIgnore(): ChartNode | undefined { return undefined; }

export function showFlowchart(program: Program) {
    const flowchartView = document.getElementById("code-flowchart")!;
    const flowchartStr = frontmatter + makeFlowchart(program);
    flowchartView.innerHTML = flowchartStr;
    console.log(flowchartStr);
    flowchartView.removeAttribute("data-processed")
    mermaid.contentLoaded();
}

function makeFlowchart(program: Program) {
    // reset
    declStack = [];
    connStack = [];
    flushStyleMap();
    // make new flowchart
    chartProgram(program);
    const styleStr = generateStyleStr();
    const fullStr = 
        declStack.join("\n") + "\n" + 
        connStack.join("\n") + "\n" + 
        lateConnStack.join("\n") + "\n" + 
        styleStr;
    // reset
    declStack = [];
    connStack = [];
    flushStyleMap();
    
    return fullStr;
}

function chartSimpleStmt(stmt: AnyStmt): ChartNode | undefined {
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
            throw new RuntimeError("a control flow block is not a simple statement!");
        case StmtKind.ShowCommand:
            return declIO(stmt.values.map(chartExpr).map((a) => a.str).join("\n"));
        case StmtKind.BreakCommand:
            return declCtrl("abbrechen", Type.Break);
        case StmtKind.ContinueCommand:
            return declCtrl("weiter", Type.Continue);
        case StmtKind.ReturnCommand:
            return declCtrl("zurück", Type.Break);
        case StmtKind.ClassDefinition:
        case StmtKind.FunctionDefinition:
        case StmtKind.ExtMethodDefinition:
            return mkIgnore();
        case StmtKind.AssignmentExpr:
        case StmtKind.BinaryExpr:
        case StmtKind.UnaryExpr:
        case StmtKind.Identifier:
        case StmtKind.NumericLiteral:
        case StmtKind.NullLiteral:
        case StmtKind.BooleanLiteral:
        case StmtKind.StringLiteral:
        case StmtKind.MemberExpr:
            const val = chartExpr(stmt);
            return declare(val.str, val.type);
        case StmtKind.CallExpr:
            const callVal = chartExpr(stmt);
            return declCall(callVal.str);
    }
    const _unreachable: never = stmt;
}

function chartExpr(expr: Expr): { str: string, type: Type } {
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
    const _unreachable: never = expr;
}

function chartProgram(program: Program): void {
    const startNode = declTerm("START");
    const connections = startEnds(startNode);
    const looseEnds = chartSequence(program.body, connections);
    const endNode = declTerm("ENDE");
    // assert: looseEnds.return.length == 0
    // assert: looseEnds.continue.length == 0
    // assert: looseEnds.break.length == 0
    tieNodeToEnds(looseEnds, endNode);
}

function chartSequence(body: AnyStmt[], ends: LooseEnds): LooseEnds {
    for (const stmt of body) {
        switch (stmt.kind) {
            case StmtKind.ForBlock:
                const innerEnds = chartForLoop(stmt, ends);
                ends = tieEndsSequentially(ends, innerEnds);
                break;
            case StmtKind.IfElseBlock:
                ends = chartIfElse(stmt, ends);
                break;
            case StmtKind.WhileBlock:
                ends = chartWhileLoop(stmt, ends);
                break;
            case StmtKind.AlwaysBlock:
                ends = chartAlwaysLoop(stmt, ends);
                break;
            case StmtKind.SwitchBlock:
                ends = chartSwitch(stmt, ends);
                break;
            default:
                const singleNode = chartSimpleStmt(stmt);
                ends = tieNodeToEnds(ends, singleNode);
        }
    }
    return ends;
}

function chartForLoop(loop: AnyForBlock, ends: LooseEnds): LooseEnds {
    const loopControl = declDec(chartExpr(loop.counter).str + " mal?");
    const endsCtrl = tieNodeToEnds(ends, loopControl, "❌");
    const seq = chartSequence(loop.body, endsCtrl);
    seq.break = [...(seq.break || []), { id: loopControl.id, outLabel: "✔️" }];
    return tieUpLoop(seq, loopControl);
}

function chartWhileLoop(loop: AnyWhileBlock, ends: LooseEnds): LooseEnds {
    const loopControl = declDec(chartExpr(loop.condition).str + "?");
    const endsCtrl = tieNodeToEnds(ends, loopControl, "✔️");
    const seq = chartSequence(loop.body, endsCtrl);
    seq.break = [...(seq.break || []), { id: loopControl.id, outLabel: "❌" }];
    return tieUpLoop(seq, loopControl);
}

function chartAlwaysLoop(loop: AnyAlwaysBlock, ends: LooseEnds): LooseEnds {
    const loopControl = declDec("immer");
    const endsCtrl = tieNodeToEnds(ends, loopControl);
    const seq = chartSequence(loop.body, endsCtrl);
    return tieUpLoop(seq, loopControl);
}

function chartIfElse(block: AnyIfElseBlock, ends: LooseEnds): LooseEnds {
    const choice = declDec(chartExpr(block.condition).str + "?");
    const endsCtrl = tieNodeToEnds(ends, choice, "✔️");
    const trueEnds = chartSequence(block.ifTrue, endsCtrl);
    endsCtrl.runover[0].outLabel = "❌";
    const falseEnds = chartSequence(block.ifFalse, endsCtrl);
    return tieEndsParallel(trueEnds, falseEnds);
}

function chartSwitch(block: AnySwitchBlock, ends: LooseEnds): LooseEnds {
    const choice = declDec(chartExpr(block.selection).str + "?");
    const endsCtrl = tieNodeToEnds(ends, choice, "<to be replaced>");
    let overallRets: Port[] = [];
    let switchRunover: Port[] = [];

    for (const cas of block.cases) {
        endsCtrl.runover[0].outLabel = chartExpr(cas.comp).str;
        const { runover: caseRunover, break: caseBreak = [], continue: caseContinue = [], return: caseReturn = [] } = chartSequence(cas.body, endsCtrl);
        // fallthrough to next case
        endsCtrl.runover = [endsCtrl.runover[0], ...caseContinue];
        overallRets.push(...caseReturn);
        switchRunover.push(...caseRunover, ...caseBreak);
    }
    const returns = overallRets.length > 0 ? overallRets : undefined;
    return { runover: switchRunover, return: returns };
}
