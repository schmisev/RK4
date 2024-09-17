import mermaid from "mermaid"
import { AnyAlwaysBlock, AnyForBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, Expr, ForBlock, IfElseBlock, Program, StmtKind, SwitchBlock } from "../language/frontend/ast";
import { content } from "html2canvas/dist/types/css/property-descriptors/content";
import { skip } from "node:test";
mermaid.initialize({ startOnLoad: true });

// state
let idCounter = 0;
let declStack: string[] = []; // all node names
let connStack: string[] = []; // all node connections

enum Info {
    Program,
    Regular,
    Return,
    Break,
    Continue,
    Call,
    Ignore,
    Disconnect,
    Unwrapped,
}

function nextId() {
    idCounter ++;
    return "" + idCounter;
}

function declare(content: string, info = Info.Regular, lb = "[", rb = "]"): [string, Info] {
    const id = nextId();
    declStack.push(id + lb + '"`' + content + '`"' + rb);
    return [id, info];
}

function connect(seq: string) {
    connStack.push(seq);
}

const declTerm = (content: string, info = Info.Regular) => declare(content, info, "([", "])");
const declIO = (content: string, info = Info.Regular) => declare(content, info, "[/", "/]");
const declCall = (content: string, info = Info.Regular) => declare(content, info, "[[", "]]");
const declCon = (content: string, info = Info.Regular) => declare(content, info, "((", "))");
const declProc = (content: string, info = Info.Regular) => declare(content, info, "[", "]");
const declDec = (content: string, info = Info.Regular) => declare(content, info, "{{", "}}");

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
    connect(chartProgram(program)[0]);
    const fullStr = declStack.join("\n") + "\n" + connStack.join("\n");
    // reset
    idCounter = 0;
    declStack = [];
    connStack = [];
    
    return fullStr;
}

function chart(stmt: AnyStmt): [string, Info] {
    switch (stmt.kind) {
        case StmtKind.VarDeclaration:
            return declProc(stmt.ident + " := " + chartExpr(stmt.value)[0]);
        case StmtKind.ObjDeclaration:
            return declProc(stmt.ident + " := " +  + "(" + stmt.args.map(chartExpr).map((a) => a[0]).join(", ") + ")");
        case StmtKind.EmptyLine:
            return ["", Info.Ignore];
        case StmtKind.DocComment:
            return ["", Info.Ignore];
        case StmtKind.IfElseBlock:
            return ["", Info.Ignore];
        case StmtKind.SwitchBlock:
            return ["", Info.Ignore];
        case StmtKind.ForBlock:
            return chartForLoop(stmt);
        case StmtKind.WhileBlock:
            return chartWhileLoop(stmt);
        case StmtKind.AlwaysBlock:
            return chartAlwaysLoop(stmt);
        case StmtKind.ShowCommand:
            return declIO(stmt.values.map(chartExpr).map((a) => a[0]).join("\n"));
        case StmtKind.BreakCommand:
            return ["", Info.Break];
        case StmtKind.ContinueCommand:
            return ["", Info.Continue];
        case StmtKind.ReturnCommand:
            return ["", Info.Return];
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
    return ["", Info.Ignore];
}

function chartExpr(expr: Expr): [string, Info] {
    switch (expr.kind) {
        case StmtKind.AssignmentExpr:
            const val = chartExpr(expr.value);
            return [chartExpr(expr.assigne)[0] + " := " + val[0], val[1]];
        case StmtKind.BinaryExpr:
            return [chartExpr(expr.left)[0] + " " + expr.operator + " " + chartExpr(expr.right)[0], Info.Unwrapped];
        case StmtKind.UnaryExpr:
            return [expr.operator + " " + chartExpr(expr.right)[0], Info.Unwrapped];
        case StmtKind.Identifier:
            return [expr.symbol, Info.Unwrapped];
        case StmtKind.NumericLiteral:
            return [`${expr.value}`, Info.Unwrapped];
        case StmtKind.NullLiteral:
            return [`nix`, Info.Unwrapped];
        case StmtKind.BooleanLiteral:
            return [`${expr.value ? "wahr" : "falsch"}`, Info.Unwrapped];
        case StmtKind.StringLiteral:
            return [`#quot;${expr.value}#quot;`, Info.Unwrapped];
        case StmtKind.MemberExpr:
            const member = chartExpr(expr.member);
            return [chartExpr(expr.container)[0] + "." + member[0], member[1]];
        case StmtKind.CallExpr:
            return [chartExpr(expr.ident)[0] + "(" + expr.args.map(chartExpr).map((a) => a[0]).join(", ") + ")", Info.Call];
    }
    return ["", Info.Ignore];
}

function chartProgram(program: Program): [string, Info] {
    const seq = chartSequence(program.body, declTerm("Start"));
    const end = declTerm("Ende");
    if (seq[0].slice(-1) != "\n") return [seq[0] + "-->" + end[0], Info.Program]; 
    return [seq[0] + end[0], Info.Program];
}

function chartSequence(body: AnyStmt[], start: [string, Info]): [string, Info] {
    let flow = start[0];
    let info = start[1];
    loop: for (const stmt of body) {
        let [f, i] = chart(stmt);
        switch (i) {
            case Info.Return:
            case Info.Break:
            case Info.Continue:
                return [flow, i];
            case Info.Call:
                [f, i] = declCall(f);
                break;
            case Info.Ignore:
                continue loop;
            case Info.Disconnect:
                if (flow.slice(-1) != "\n") flow += "-->|??|";
                flow += f + "\n";
                continue loop;
            case Info.Unwrapped:
                [f, i] = declProc(f);
                break;
        }
        if (flow.slice(-1) != "\n") flow += "-->|?|";
        flow += f;
        info = i;
    }
    return [flow, info];
}

function chartLoop(dec: [string, Info], body: AnyStmt[], onLoop: string, onExit: string): [string, Info] {
    const [df, di] = dec;
    let [f, i] = chartSequence(body, [df + "--" + onLoop, di]);
    switch (i) {
        case Info.Return:
        case Info.Break:
            break;
        default:
            f += "-->" + df;
    }
    return [f + "--" + onExit, i];
}

function chartForLoop(loop: AnyForBlock): [string, Info] {
    const dec = declDec(chartExpr(loop.counter)[0] + " mal?");
    return chartLoop(dec, loop.body, "❌", "✔️");
}

function chartWhileLoop(loop: AnyWhileBlock): [string, Info] {
    const dec = declDec(chartExpr(loop.condition)[0] + " ?");
    return chartLoop(dec, loop.body, "✔️", "❌");
}

function chartAlwaysLoop(loop: AnyAlwaysBlock): [string, Info] {
    const [cf, ci] = declCon("↺");
    let [f, i] = chartSequence(loop.body, [cf, ci]);
    switch (i) {
        case Info.Return:
        case Info.Break:
            break;
        case Info.Disconnect:
            return [f, Info.Disconnect];
        default:
            f += "-->|!!|" + cf;
    }
    return [f, Info.Disconnect];
}