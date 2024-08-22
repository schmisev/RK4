import { ParserError } from "../errors";
import { ClassDefinition, ForBlock, IfElseBlock, Program, Stmt, WhileBlock } from "../language/frontend/ast";

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
export function showStructogram(div: string, program: Program) {
    const view = document.getElementById(div)!;
    
    classes = [];
    sections = [];
    sections.push(structure(program));

    view.innerHTML = ""; // reset view
    view.innerHTML = 
    sections.join("<br>") + 
    `<br><div class="wsr lc30 text" style="text-align: center; font-weight: bold;">Klassenkarten</div><br>` + 
    classes.join("<br>") + "<br>";
}

function structure(astNode: Stmt): string {
    const view = document.getElementById("diagram-canvas")!;
    switch (astNode.kind) {
        case "Program":
            return `<div class="struct-program">Hauptprogramm${structureSequence(astNode.body)}</div>`
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
            return `<span>nix</span>`;
        case "Identifier":
            return `<span class="struct-ident">${astNode.symbol}</span>`
        case "BinaryExpr":
            return `<span>(${structure(astNode.left)} ${translateOperator(astNode.operator)} ${structure(astNode.right)})</span>`
        case "UnaryExpr":
            return `<span>${translateOperator(astNode.operator)} ${structure(astNode.right)}</span>`
        case "AssignmentExpr":
            return `<span>${structure(astNode.assigne)} ist ${structure(astNode.value)}</span>`
        case "CallExpr":
            return `<span>${structure(astNode.ident)}(${astNode.args.map(structure).join(", ")})</span>`
        case "MemberExpr":
            return `<span class="struct-object">${structure(astNode.container)}</span>.${structure(astNode.member)}`
        case "VarDeclaration":
            return `<span class="struct-type">${TYPE2GER[astNode.type]}</span> <span class="struct-ident">${astNode.ident}</span> ist ${structure(astNode.value)}`
        case "ObjDeclaration":
            return `<span>Objekt ${astNode.ident} als ${astNode.type}</span>`
        case "ShowCommand":
            return `<span class="struct-cmd">zeig</span> ${astNode.values.map(structure).join(" ")}`
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
    let result = 
    `wiederhole solange ${structure(node.condition)}
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureFor(node: ForBlock): string {
    let result = 
    `wiederhole ${structure(node.counter)} mal
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureIfElse(node: IfElseBlock): string {
    let result =
    `
    <div class="struct-ifelse">${structure(node.condition)} ? <br><br><br></div>
    <div class="struct-row">
        <div class="struct-column">${structureSequence(node.ifTrue)}</div>
        <div class="struct-column">${structureSequence(node.ifFalse)}</div>
    </div>
    `
    return result;
}

function structureClass(node: ClassDefinition): string {
    let result = 
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