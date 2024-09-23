import mermaid from "mermaid"
import { AnyAlwaysBlock, AnyForBlock, AnyFromToBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, ClassDefinition, Expr, ExtMethodDefinition, FunctionDefinition, Program, StmtKind } from "../language/frontend/ast";
import { RuntimeError } from "../errors";
import { toggleFunctions, toggleMethods } from "./toggle-buttons";
import { translateOperator } from "../utils";
mermaid.initialize({ startOnLoad: true });

// diagram formatting

const frontmatter = `%%{
    init: {
        'theme':'base',
    }
}%%
graph TD
`;

// state
let idCounter = 0;

interface ChartBlock {
    title: string;
    declStack: string[];
    connStack: string[];
}

const defaultBlockKey = "m";
const defaultBlockTitle = "Hauptprogramm"
let blockKey = defaultBlockKey;
let blockMap: Record<string, ChartBlock> = {
    [defaultBlockKey]: {title: defaultBlockTitle, declStack: [], connStack: []},
}

function resetBlockKey() {
    blockKey = defaultBlockKey;
}

function flushBlockMap() {
    blockMap = {[defaultBlockKey]: {title: defaultBlockTitle, declStack: [], connStack: []}};
}

function openNewBlock(key: string, title: string) {
    blockKey = key;
    blockMap[key] = {title, declStack: [], connStack: []};
}

// style mapping
const styleMap: Record<string, Array<string>> = {
    "flow-dec":  [],
    "flow-term": [],
    "flow-io":   [],
    "flow-call": [],
    "flow-con":  [],
    "flow-proc": [],
    "flow-ctrl": [],
    "flow-meth": [],
    "flow-func": [],
}

function flushStyleMap() {
    for (const k of Object.keys(styleMap)) {
        styleMap[k] = [];
    }
}

function generateStyleStr() {
    let styleStr = ""
    for (const k of Object.keys(styleMap)) {
        const nodes = styleMap[k];
        if (nodes.length > 0) {
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
    const name = id + lb + '"`' + content + '`"' + rb;
    blockMap[blockKey].declStack.push(name);

    if (cls) styleMap[cls].push(id);
    return {str: content, id, type: info};
}

function connect(seq: string) {
    blockMap[blockKey].connStack.push(seq);
}

function connectDirect(nodeA: ChartNode, nodeB: ChartNode, arrow: string = "~~~", label?: string): void {
    if (label) {
        connect(`${nodeA.id} ${arrow}|${label}| ${nodeB.id}`);
    } else {
        connect(`${nodeA.id} ${arrow} ${nodeB.id}`);
    }
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

const declTerm = (content: string, info = Type.Regular) => declare(content, info, "([", "])", "flow-term");
const declIO = (content: string, info = Type.Regular) => declare(content, info, "[/", "/]", "flow-io");
const declCall = (content: string, info = Type.Call) => declare(content, info, "[[", "]]", "flow-call");
const declCon = (content: string, info = Type.Regular) => declare(content, info, "((", "))", "flow-con");
const declProc = (content: string, info = Type.Regular) => declare(content, info, "[", "]", "flow-proc");
const declDec = (content: string, info = Type.Regular) => declare(content, info, "{{", "}}", "flow-dec");
const declCtrl = (content: string, info: Type.Break | Type.Return | Type.Continue) => declare(content, info, "(", ")", "flow-ctrl");

function mkIgnore(): ChartNode | undefined { return undefined; }

export function showFlowchart(program: Program) {
    const flowchartView = document.getElementById("code-flowchart")!;
    const flowchartStr = frontmatter + makeFlowchart(program);
    flowchartView.innerHTML = flowchartStr;
    flowchartView.removeAttribute("data-processed")
    mermaid.contentLoaded();
}

export function setFlowchartVisibility(visible: boolean) {
    document.getElementById("flowchart-diagram-canvas")!.style.visibility = visible ? "visible" : "hidden";
    document.getElementById("flowchart-diagram-title")!.style.visibility = visible ? "visible" : "hidden";
}

function makeFlowchart(program: Program) {
    // reset
    flushBlockMap();
    flushStyleMap();
    // make new flowchart
    chartProgram(program);
    const styleStr = generateStyleStr();
    /*
    const fullStr = 
        declStack.join("\n") + "\n" + 
        connStack.join("\n") + "\n" +  
        styleStr;
    */
    let fullStr = "";
    // fullStr += "%%main decl%%\n" + blockMap[defaultBlockKey].declStack.join("\n") + "\n"
    // fullStr += "%%main conn%%\n" + blockMap[defaultBlockKey].connStack.join("\n") + "\n"

    for (const [id, block] of Object.entries(blockMap)) {
        fullStr += `%%block: ${id}%%\n`;
        fullStr += "subgraph " + id + ' ["`' + block.title + '`"]\n';
        fullStr += `%%decl%%\n`;
        fullStr += block.declStack.join("\n") + "\n";
        fullStr += `%%conn%%\n`;
        fullStr += block.connStack.join("\n") + "\n";
        fullStr += "end\n";
    }
    // connect all blocks for vertical layout
    fullStr += "%%connect blocks%%\n" + Object.keys(blockMap).join("~~~") + "\n";

    fullStr += styleStr;
    // reset
    flushBlockMap();
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
        case StmtKind.FromToBlock:
            throw new RuntimeError("a control flow block is not a simple statement!");
        case StmtKind.ShowCommand:
            return declIO(stmt.values.map(chartExpr).map((a) => a.str).join("\n"));
        case StmtKind.BreakCommand:
            return declCtrl("abbrechen", Type.Break);
        case StmtKind.ContinueCommand:
            return declCtrl("weiter", Type.Continue);
        case StmtKind.ReturnCommand:
            return declCtrl("zurück", Type.Break);
        case StmtKind.FunctionDefinition:
            if (toggleFunctions.active)    
                chartFunction(stmt);
            return mkIgnore();
        case StmtKind.ClassDefinition:
            if (toggleMethods.active)    
                chartClass(stmt);
            return mkIgnore();
        case StmtKind.ExtMethodDefinition:
            if (toggleMethods.active)    
                chartExtMethod(stmt);
            return mkIgnore();
        case StmtKind.AssignmentExpr:
        case StmtKind.BinaryExpr:
        case StmtKind.UnaryExpr:
        case StmtKind.Identifier:
        case StmtKind.NumericLiteral:
        case StmtKind.NullLiteral:
        case StmtKind.BooleanLiteral:
        case StmtKind.StringLiteral:
        case StmtKind.ListLiteral:
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
            return {str: "(" + chartExpr(expr.left).str + " " + translateOperator(expr.operator) + " " + chartExpr(expr.right).str + ")", type: Type.Unwrapped};
        case StmtKind.UnaryExpr:
            return {str: translateOperator(expr.operator) + " " + chartExpr(expr.right).str, type: Type.Unwrapped};
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
        case StmtKind.ListLiteral:
            return {str: `#lsqb;${expr.elements.map(chartExpr).map((a) => a.str).join(", ")}#rsqb;`, type: Type.Unwrapped}
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

function chartSubgraph(id: string, subgraphName: string, body: AnyStmt[]) {
    openNewBlock(id, subgraphName);

    const startNode = declTerm("START");
    const connections = startEnds(startNode);
    const looseEnds = chartSequence(body, connections);
    const endNode = declTerm("ENDE");
    // connectDirect(startNode, endNode);
    tieNodeToEnds(looseEnds, endNode);

    // connect("end\n");
    resetBlockKey();
}

function chartFunction(func: FunctionDefinition, classname?: string): void {
    const id = nextId();

    chartSubgraph(
        id,
        (classname ? classname + "." : "") + "__" + func.name + "__" + "(" + func.params.map((p) => p.ident).join(", ") + ')',
        func.body
    )
    styleMap["flow-func"].push(id);
}

function chartMethod(func: FunctionDefinition, classname?: string): void {
    const id = nextId();

    chartSubgraph(
        id,
        (classname ? classname + "." : "") + "__" + func.name + "__" + "(" + func.params.map((p) => p.ident).join(", ") + ')',
        func.body
    )
    styleMap["flow-meth"].push(id);
}

function chartExtMethod(meth: ExtMethodDefinition): void {
    const id = nextId();

    chartSubgraph(
        id,
        meth.classname + "." + "__" + meth.name + "__" + "(" + meth.params.map((p) => p.ident).join(", ") + ')',
        meth.body
    )
    styleMap["flow-meth"].push(id);
}

function chartClass(cls: ClassDefinition): void {
    // we are just dumping the methods into seperate blocks
    for (const meth of cls.methods) {
        chartMethod(meth, cls.ident);
    }
}

function chartSequence(body: AnyStmt[], ends: LooseEnds): LooseEnds {
    for (const stmt of body) {
        let innerEnds: LooseEnds;
        switch (stmt.kind) {
            case StmtKind.FromToBlock:
                innerEnds = chartFromToLoop(stmt, ends);
                ends = tieEndsSequentially(ends, innerEnds);
                break;
            case StmtKind.ForBlock:
                innerEnds = chartForLoop(stmt, ends);
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
    const endsCtrl = tieNodeToEnds(ends, loopControl, "🔁 nochmal");
    const seq = chartSequence(loop.body, endsCtrl);
    seq.break = [...(seq.break || []), { id: loopControl.id, outLabel: "⏹️ beendet" }];
    return tieUpLoop(seq, loopControl);
}

function chartFromToLoop(loop: AnyFromToBlock, ends: LooseEnds): LooseEnds {
    const loopControl = declDec(
        (loop.iterIdent ? loop.iterIdent + " := " : "") + chartExpr(loop.start).str + "..." + chartExpr(loop.end).str
    )
    const endsCtrl = tieNodeToEnds(ends, loopControl, "⏭️ nächster Wert");
    const seq = chartSequence(loop.body, endsCtrl);
    seq.break = [...(seq.break || []), { id: loopControl.id, outLabel: "⏹️ beendet" }];
    return tieUpLoop(seq, loopControl);
}

function chartWhileLoop(loop: AnyWhileBlock, ends: LooseEnds): LooseEnds {
    const loopControl = declDec(chartExpr(loop.condition).str + "?");
    const endsCtrl = tieNodeToEnds(ends, loopControl, "✔️ wahr");
    const seq = chartSequence(loop.body, endsCtrl);
    seq.break = [...(seq.break || []), { id: loopControl.id, outLabel: "❌ falsch" }];
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
    const endsCtrl = tieNodeToEnds(ends, choice, "✔️ wahr");
    const trueEnds = chartSequence(block.ifTrue, endsCtrl);
    endsCtrl.runover[0].outLabel = "❌ falsch";
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
