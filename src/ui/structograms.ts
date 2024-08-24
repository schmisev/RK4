import { ParserError } from "../errors";
import { BinaryExpr, ClassDefinition, Expr, ForBlock, IfElseBlock, Program, Stmt, UnaryExpr, WhileBlock } from "../language/frontend/ast";

// Type alias
const TYPE2GER: Record<string, string> = {
    "number": "Zahl",
    "boolean": "Wahrheitswert",
    "string": "Text",
    "null": "Nix",
}

const translateOperator = (op: string) => {
    switch (op) {
        case "*":
            return "⋅";
        case "/":
            return "∶";
        case "+":
            return "＋";
        case "-":
            return "－";
        default:
            return op;
    }
}

let sections: string[] = [];
let classes: string[] = [];

// Structograms
export function showStructogram(program: Program) {
    const structogramView = document.getElementById("structogram-diagram-canvas")!;
    const classView = document.getElementById("class-diagram-canvas")!;
    
    classes = [];
    sections = [];
    sections.push(structure(program));

    structogramView.innerHTML = ""; // reset view
    structogramView.innerHTML = sections.join("<br>");

    classView.innerHTML = ""; // reset view
    classView.innerHTML = classes.join("<br>");
}

function structure(astNode: Stmt): string {
    const view = document.getElementById("diagram-canvas")!;
    switch (astNode.kind) {
        case "Program":
            return structureProgram(astNode);
        case "IfElseBlock":
            return structureIfElse(astNode);
        case "WhileBlock":
            return structureWhile(astNode);
        case "ForBlock":
            return structureFor(astNode);
        case "NumericLiteral":
            return `<span class="struct-literal">${astNode.value}</span>`;
        case "StringLiteral":
            return `<span class="struct-string">"${astNode.value}"</span>`;
        case "BooleanLiteral":
            return `<span class="struct-literal">${astNode.value ? "wahr" : "falsch"}</span>`;
        case "NullLiteral":
            return `<span class="struct-literal">nix</span>`;
        case "Identifier":
            return `<span class="struct-ident">${astNode.symbol}</span>`
        case "BinaryExpr":
            return structureBinaryExpr(astNode);
        case "UnaryExpr":
            return structureUnaryExpr(astNode);
        case "AssignmentExpr":
            return `${structure(astNode.assigne)} ist ${structure(astNode.value)}`
        case "CallExpr":
            return `${structure(astNode.ident)}(${astNode.args.map(structure).join(", ")})`
        case "MemberExpr":
            return `<span class="struct-object">${structure(astNode.container)}</span><b>.</b>${structure(astNode.member)}`
        case "VarDeclaration":
            return `<span class="struct-type">${TYPE2GER[astNode.type]}</span> <span class="struct-ident">${astNode.ident}</span> ist ${structure(astNode.value)}`
        case "ObjDeclaration":
            return `<span class="struct-type">Objekt</span> <span class="struct-ident">${astNode.ident}</span> als <span class="struct-classtype">${astNode.classname}</span>`
        case "ShowCommand":
            return `<span class="struct-cmd">zeig</span> ${astNode.values.map(structure).join(", ")}`
        case "FunctionDefinition":
            const funcHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")})`
            sections.push(`<div class="struct-program">Funktion: ${funcHandle} ${structureSequence(astNode.body)}</div>`);
            return `<span class="struct-deemph">↪  ${funcHandle}</span>`;
        case "ExtMethodDefinition":
            const methodHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")}) für ${astNode.classname}`
            sections.push(`<div class="struct-program">Methode: ${methodHandle} ${structureSequence(astNode.body)}</div>`);
            return `<span class="struct-deemph">↪ ${methodHandle}</span>`;
        case "ClassDefinition":
            classes.push(structureClass(astNode));
            return `<div class="struct-deemph">↪ ${astNode.ident}</div>`;
        case "BreakCommand":
            return `<span class="struct-cmd">anhalten</span>`
        case "ContinueCommand":
            return `<span class="struct-cmd">weiter</span>`
        case "ReturnCommand":
            return `<span><span class="struct-cmd">zurück</span> ${structure(astNode.value)}</span>`
        case "EmptyLine":
        default:
            return `<span>&lt${astNode.kind}&gt</span>`
    }
}

function encapsulateExpr(astNode: Expr, right = false) {
    const expr = structure(astNode)

    if (astNode.kind == "BinaryExpr" || (astNode.kind == "UnaryExpr" && right))
        return "(" + expr + ")";
    return expr;
}

function makeTooltip(txt: string, tt: string) {
    return `<span class="struct-tooltip">${txt}<span class="tooltip">${tt}</span></span>`;
}

function structureProgram(astNode: Program) {
    return `<div class="struct-program">
            ${makeTooltip("Hauptprogramm", "Das Hauptprogramm wird zuerst ausgeführt!")}
            </span>
            ${structureSequence(astNode.body)}
            </div>`
}

function structureBinaryExpr(astNode: BinaryExpr) {
    const rightSide = encapsulateExpr(astNode.right, true);
    const leftSide = encapsulateExpr(astNode.left);
    
    return `${leftSide} ${translateOperator(astNode.operator)} ${rightSide}`
}

function structureUnaryExpr(astNode: UnaryExpr) {
    let rightSide = encapsulateExpr(astNode.right);
    if (astNode.operator.length > 1) rightSide = " " + rightSide; // pad for multicharacter operators
    
    return `${astNode.operator}${rightSide}`
}

function structureSequence(body: Stmt[]): string {
    let result = "";
    for (const node of body) {
        if (node.kind == "IfElseBlock") {
            result += `<div class="struct-box struct-unpadded">${structure(node)}</div>`
        } else {
            result += `<div class="struct-box">${structure(node)}</div>`
        }
    }
    return result;
}

function structureWhile(node: WhileBlock): string {
    const cond = structure(node.condition);
    const result = 
    `wiederhole ${makeTooltip("solange", "Die folgenden Anweisungen werden immer wieder ausgeführt, bis die Bedingung <u>" + cond + "</u> nicht mehr wahr ist!")}
     ${cond}
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureFor(node: ForBlock): string {
    const count = structure(node.counter)
    const result = 
    `wiederhole ${count} ${makeTooltip("mal", "Die folgenden Anweisungen werden sooft ausgeführt, wie es in die Anzahl <u>" + count + "</u> vorgibt!")}
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureIfElse(node: IfElseBlock): string {
    const cond = structure(node.condition);
    const result =
    `
    <div class="struct-ifelse">${cond} ? <br><br>
        <div style="display: flex;">
            <div class="struct-column" style="padding-left: 5px; text-align: left;">${makeTooltip("wahr", "Wenn die Bedingung <u>" + cond + "</u> zutrifft, wird die linke Spalte ausgeführt!")}</div>
            <div class="struct-column" style="padding-right: 5px; text-align: right;">${makeTooltip("falsch", "Wenn die Bedingung <u>" + cond + "</u> nicht zutrifft, wird die rechte Spalte ausgeführt!")}</div>
        </div>
    </div>
    <div class="struct-row">
        <div class="struct-column">${structureSequence(node.ifTrue)}</div>
        <div class="struct-column">${structureSequence(node.ifFalse)}</div>
    </div>
    `
    return result;
}

function structureClass(node: ClassDefinition): string {
    const result = 
    `<div class="struct-class">
        <div class="struct-classname">
            ${node.ident}
        </div>
        
        <div class="struct-attributes">
            ${node.attributes.map((attr) => {
                if (attr.type == "object")
                    return `<span class="struct-type">${attr.classname}</span> ${attr.ident}`
                else
                    return `<span class="struct-type">${TYPE2GER[attr.type]}</span> ${attr.ident}`
            }).join("<br>")}
        </div>
        
        <div class="struct-methods">${
            node.methods.map((meth) => {
                return `${meth.name}(${meth.params.map((p) => p.ident).join(", ")})`
            }).join("<br>")}
        </div>
    </div>`
    return result;
}