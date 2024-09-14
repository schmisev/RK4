import mermaid from "mermaid"
import { AbruptEvalResult, AbruptStmtKind, AnyAlwaysBlock, AnyForBlock, AnyIfElseBlock, AnyStmt, AnySwitchBlock, AnyWhileBlock, Expr, ForBlock, IfElseBlock, Program, ShowCommand, Stmt, StmtKind } from "../language/frontend/ast";
import { AbruptAlias } from "../language/runtime/values";
mermaid.initialize({ startOnLoad: true });

class FlowCharter {
    id = 0;
    flowStack: string[] = [];

    constructor() {
        this.id = 0;
        this.flowStack = [];
    }

    nextId(): number {
        this.id ++;
        return this.id;
    }

    makeBox(str: string) {
        const id = this.nextId();
        this.push("." + id + '["`' + str + '`"]');
        return "." + id;
    }

    makeBulb(str: string) {
        const id = this.nextId();
        this.push("." + id + '(["`' + str + '`"])');
        return "." + id;
    }

    makeDecision(str: string) {
        const id = this.nextId();
        this.push("." + id + '{{"`' + str + '`"}}');
        return "." + id;
    }

    makeNode(str: string) {
        const id = this.nextId();
        this.push("." + id + '(("`' + str + '`"))');
        return "." + id;
    }

    makeOutput(str: string) {
        const id = this.nextId();
        this.push("." + id + '[/"`' + str + '`"/]');
        return "." + id;
    }

    push(str: string) {
        this.flowStack.push(str);
    }

    chart(astNode: Program | AnyStmt): string {
        switch (astNode.kind) {
            case StmtKind.Program:
                this.chartProgram(astNode);
                return "";
            case StmtKind.VarDeclaration:
                return this.makeBox(`${astNode.ident} := ${this.chart(astNode.value)}`);
            case StmtKind.ObjDeclaration:
                return this.makeBox(`${astNode.ident} := ${(astNode.classname)}`);
            case StmtKind.EmptyLine:
                return "";
            case StmtKind.DocComment:
                return "";
            case StmtKind.IfElseBlock:
                return this.chartIfElse(astNode);
            case StmtKind.SwitchBlock:
                return this.chartSwitchBlock(astNode);
            case StmtKind.ForBlock:
                return this.chartForBlock(astNode);
            case StmtKind.WhileBlock:
                return this.chartWhileBlock(astNode);
            case StmtKind.AlwaysBlock:
                return this.chartAlwaysBlock(astNode);
            case StmtKind.ShowCommand:
                return this.chartShow(astNode);
            case StmtKind.BreakCommand:
                return AbruptAlias.Break;
            case StmtKind.ContinueCommand:
                return AbruptAlias.Continue;
            case StmtKind.ReturnCommand:
                return AbruptAlias.Return;
            case StmtKind.AssignmentExpr:
                return `${this.chart(astNode.assigne)} := ${this.chart(astNode.value)}`;
            case StmtKind.ClassDefinition:
                return "";
            case StmtKind.FunctionDefinition:
                return "";
            case StmtKind.ExtMethodDefinition:
                return "";
            case StmtKind.BinaryExpr:
            case StmtKind.UnaryExpr:
            case StmtKind.Identifier:
            case StmtKind.NumericLiteral:
            case StmtKind.NullLiteral:
            case StmtKind.BooleanLiteral:
            case StmtKind.StringLiteral:
            case StmtKind.MemberExpr:
            case StmtKind.CallExpr:
                return this.chartExpr(astNode);
        }
    }

    chartExpr(astNode: Expr): string {
        switch (astNode.kind) {
            case StmtKind.AssignmentExpr:
                return `${this.chartExpr(astNode.assigne)} := ${this.chartExpr(astNode.value)}`;
            case StmtKind.BinaryExpr:
                return `${this.chartExpr(astNode.left)} ${astNode.operator} ${this.chartExpr(astNode.right)}`;
            case StmtKind.UnaryExpr:
                return `${astNode.operator} ${this.chartExpr(astNode.right)}`;
            case StmtKind.Identifier:
                return `${astNode.symbol}`;
            case StmtKind.NumericLiteral:
                return `${astNode.value}`;
            case StmtKind.NullLiteral:
                return `${astNode.value}`;
            case StmtKind.BooleanLiteral:
                return `${astNode.value}`;
            case StmtKind.StringLiteral:
                return `${astNode.value}`;
            case StmtKind.MemberExpr:
                return `${this.chartExpr(astNode.container)}.${this.chartExpr(astNode.member)}`;
            case StmtKind.CallExpr:
                return `${this.chartExpr(astNode.ident)}(${astNode.args.map((x) => {return this.chartExpr(x)}).join(", ")})`;
        }
    }

    chartProgram(astNode: Program): string {
        return this.chartSequence(astNode.body, this.makeBulb("Start"), this.makeBulb("End"));
    }

    chartSequence(body: AnyStmt[], startNode: string, endNode?: string): string {
        let prevNode = startNode;
        let currNode = startNode;
        for (const stmt of body) {
            let stmtNode = this.chart(stmt);
            if (stmtNode == "") continue;
            if (stmtNode[0] != ".") stmtNode = this.makeBox(stmtNode);
            
            currNode = stmtNode;
            this.push(prevNode + "-->" + currNode);
            prevNode = currNode;
        }
        if (endNode) {
            this.push(currNode + "-->" + endNode);
            currNode = endNode;
        }
        return currNode;
    }

    chartForBlock(astNode: AnyForBlock): string {
        const decisionNode = this.makeDecision(this.chartExpr(astNode.counter) + " mal?");
        const seqNode = this.chartSequence(astNode.body, decisionNode + "--❌", decisionNode);
        return seqNode;
    }

    chartWhileBlock(astNode: AnyWhileBlock): string {
        return "";
    }

    chartAlwaysBlock(astNode: AnyAlwaysBlock): string {
        return "";
    }

    chartIfElse(astNode: AnyIfElseBlock): string {
        return "";
    }

    chartSwitchBlock(astNode: AnySwitchBlock): string {
        return "";
    }

    chartShow(astNode: ShowCommand): string {
        let ret = "";
        for (const expr of astNode.values) {
            ret += this.chartExpr(expr) + "\n";
        }
        const id = this.makeOutput("__Ausgabe__\n" + ret);
        return id;
    }

    makeChart(astNode: Program): string {
        this.flowStack = [];
        this.id = 0;
        this.chartProgram(astNode);
        return this.flowStack.reverse().join("\n");
    }
}

// business logic 
const flowcharter = new  FlowCharter();

export function showFlowchart(program: Program) {
    const flowchartView = document.getElementById("code-flowchart")!;
    flowchartView.innerHTML = "flowchart TD\n" + flowcharter.makeChart(program);
    console.log(flowchartView.innerText);
    flowchartView.removeAttribute("data-processed")
    mermaid.contentLoaded();
}