import mermaid from "mermaid"
import { AnyAlwaysBlock, AnyForBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, Expr, ForBlock, IfElseBlock, Program, StmtKind, SwitchBlock } from "../language/frontend/ast";
import { content } from "html2canvas/dist/types/css/property-descriptors/content";
import { skip } from "node:test";
import { stringify } from "node:querystring";
mermaid.initialize({ startOnLoad: true });

// state
let idCounter = 0;
let declStack: string[] = []; // all node names
let connStack: string[] = []; // all node connections

enum FlowInfo {
    Program = "Prg",
    Regular = "Reg",
    Return = "Ret",
    Break = "Brk",
    Resolved = "Res",
    Continue = "Cnt",
    Call = "Cll",
    Ignore =  "Ign",
    Disconnect = "Dsc",
    Unwrapped = "Uwr",
}

interface ChartNode {
    info: FlowInfo;
    id?: string;
    str?: string;
    outLabel?: string
}

function nextId() {
    idCounter ++;
    return "" + idCounter;
}

function declare(content: string, info = FlowInfo.Regular, lb = "[", rb = "]"): ChartNode {
    const id = nextId();
    declStack.push(id + lb + '"`' + content + '`"' + rb);
    return {str: content, id, info};
}

function connect(seq: string) {
    connStack.push(seq);
}

function connectTwo(nodeA: ChartNode, nodeB: ChartNode): ChartNode {
    if (!nodeA.id || !nodeB.id || nodeB.info == FlowInfo.Ignore) return nodeA;
    if (nodeA.outLabel) {
        connect(`${nodeA.id} -->|${nodeA.outLabel}| ${nodeB.id}`);
    } else {
        connect(`${nodeA.id} --> ${nodeB.id}`);
    }
    return nodeB;
}

const declTerm = (content: string, info = FlowInfo.Regular) => declare(content, info, "([", "])");
const declIO = (content: string, info = FlowInfo.Regular) => declare(content, info, "[/", "/]");
const declCall = (content: string, info = FlowInfo.Regular) => declare(content, info, "[[", "]]");
const declCon = (content: string, info = FlowInfo.Regular) => declare(content, info, "((", "))");
const declProc = (content: string, info = FlowInfo.Regular) => declare(content, info, "[", "]");
const declDec = (content: string, info = FlowInfo.Regular) => declare(content, info, "{{", "}}");
const declCtrl = (content: string, info: FlowInfo.Break | FlowInfo.Return | FlowInfo.Continue) => declare(content, info, "(", ")");

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

function chart(stmt: AnyStmt, entry: ChartNode): ChartNode {
    switch (stmt.kind) {
        case StmtKind.VarDeclaration:
            return connectTwo(entry, declProc(stmt.ident + " := " + chartExpr(stmt.value).str));
        case StmtKind.ObjDeclaration:
            return connectTwo(entry, declProc(stmt.ident + " := " + stmt.classname + "(" + stmt.args.map(chartExpr).map((a) => a.str).join(", ") + ")"));
        case StmtKind.EmptyLine:
            return connectTwo(entry, {info: FlowInfo.Ignore});
        case StmtKind.DocComment:
            return connectTwo(entry, {info: FlowInfo.Ignore});
        case StmtKind.IfElseBlock:
            return chartIfElse(stmt, entry);
        case StmtKind.SwitchBlock:
            return connectTwo({info: FlowInfo.Ignore}, entry);
        case StmtKind.ForBlock:
            return chartForLoop(stmt, entry);
        case StmtKind.WhileBlock:
            return chartWhileLoop(stmt, entry);
        case StmtKind.AlwaysBlock:
            return chartAlwaysLoop(stmt, entry);
        case StmtKind.ShowCommand:
            return connectTwo(entry, declIO(stmt.values.map(chartExpr).map((a) => a.str).join("\n")));
        case StmtKind.BreakCommand:
            return connectTwo(entry, declTerm("abbrechen", FlowInfo.Break));
        case StmtKind.ContinueCommand:
            return connectTwo(entry, declTerm("weiter", FlowInfo.Continue));
        case StmtKind.ReturnCommand:
            return connectTwo(entry, declTerm("zurück", FlowInfo.Break));
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
            return connectTwo(entry, chartExpr(stmt));
    }
    return connectTwo(entry,{info: FlowInfo.Ignore});
}

function chartExpr(expr: Expr): ChartNode {
    switch (expr.kind) {
        case StmtKind.AssignmentExpr:
            const val = chartExpr(expr.value);
            return {str: chartExpr(expr.assigne).str + " := " + val.str, info: val.info};
        case StmtKind.BinaryExpr:
            return {str: chartExpr(expr.left).str + " " + expr.operator + " " + chartExpr(expr.right).str, info: FlowInfo.Unwrapped};
        case StmtKind.UnaryExpr:
            return {str: expr.operator + " " + chartExpr(expr.right).str, info: FlowInfo.Unwrapped};
        case StmtKind.Identifier:
            return {str: expr.symbol, info: FlowInfo.Unwrapped};
        case StmtKind.NumericLiteral:
            return {str: `${expr.value}`, info: FlowInfo.Unwrapped};
        case StmtKind.NullLiteral:
            return {str: `nix`, info: FlowInfo.Unwrapped};
        case StmtKind.BooleanLiteral:
            return {str: `${expr.value ? "wahr" : "falsch"}`, info: FlowInfo.Unwrapped};
        case StmtKind.StringLiteral:
            return {str: `#quot;${expr.value}#quot;`, info: FlowInfo.Unwrapped};
        case StmtKind.MemberExpr:
            const member = chartExpr(expr.member);
            return {str: chartExpr(expr.container).str + "." + member.str, info: member.info};
        case StmtKind.CallExpr:
            return {str: chartExpr(expr.ident).str + "(" + expr.args.map(chartExpr).map((a) => a.str).join(", ") + ")", info: FlowInfo.Call};
    }
    return {info: FlowInfo.Ignore};
}

function chartProgram(program: Program): ChartNode {
    return {info: FlowInfo.Ignore};
}

function chartSequence(body: AnyStmt[], entry: ChartNode): ChartNode {
    return {info: FlowInfo.Ignore};
}

function chartForLoop(loop: AnyForBlock, entry: ChartNode): ChartNode {
    return entry;
}

function chartWhileLoop(loop: AnyWhileBlock, entry: ChartNode): ChartNode {
    return entry;
}

function chartAlwaysLoop(loop: AnyAlwaysBlock, entry: ChartNode): ChartNode {
    return entry;
}

function chartIfElse(block: AnyIfElseBlock, entry: ChartNode): ChartNode {
    return entry;
}