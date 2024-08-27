import { ParserError } from "../errors";
import { BinaryExpr, ClassDefinition, Expr, ForBlock, IfElseBlock, Program, Stmt, UnaryExpr, WhileBlock } from "../language/frontend/ast";
import { ENV } from "../spec";

// Robot class
const ROBOT_PSEUDO_CLASS = 
`<div class="struct-class">
    <div class="struct-classname">${ENV.robot.cls}</div>
    
    <div class="struct-attributes">
        <span class="struct-type">Zahl</span> ${makeTooltip(ENV.robot.attr.X, `Du kannst auf das Attribut <span class="struct-ident">${ENV.robot.attr.X}</span> nicht direkt zugreifen.`) + "🔒<br>"}
        <span class="struct-type">Zahl</span> ${makeTooltip(ENV.robot.attr.Y, `Du kannst auf das Attribut <span class="struct-ident">${ENV.robot.attr.Y}</span> nicht direkt zugreifen.`) + "🔒<br>"}
        <span class="struct-type">Text</span> ${makeTooltip(ENV.robot.attr.DIR, `Du kannst auf das Attribut <span class="struct-ident">${ENV.robot.attr.DIR}</span> nicht direkt zugreifen.`) + "🔒<br>"}
    </div>
    
    <div class="struct-methods">
        ${makeTooltip(ENV.robot.mth.GET_X , `Gibt die aktuelle x-Koordinate des Roboters zurück!`) + "()<br>"}
        ${makeTooltip(ENV.robot.mth.GET_Y, `Gibt die aktuelle y-Koordinate des Roboters zurück!`) + "()<br>"}
        ${makeTooltip(ENV.robot.mth.GET_DIR, `Gibt die aktuelle Richtung des Roboters als Text zurück: <span class="struct-string">"N"</span>, <span class="struct-string">"S"</span>, <span class="struct-string">"W"</span> oder <span class="struct-string">"O"</span>!`) + "()<br>"}
        <div class="struct-dot"></div>
        ${makeTooltip(ENV.robot.mth.STEP, `Der Roboter geht ein Feld nach vorne - wenn das möglich ist.`) + "()<br>"}
        ${makeTooltip(ENV.robot.mth.PLACE_BLOCK, `Der Roboter legt vor sich einen roten Block. Du kannst natürlich auch eine eigene Farbe angeben!`) + `(farbe?)<br>`}
        ${makeTooltip(ENV.robot.mth.PICKUP_BLOCK, `Der Roboter hebt einen Block vor sich auf!`) + `()<br>`}
        ${makeTooltip(ENV.robot.mth.SET_MARKER, `Der Roboter setzt unter sich eine gelbe Marke. Du kannst natürlich auch eine eigene Farbe angeben!`) + `(farbe?)<br>`}
        ${makeTooltip(ENV.robot.mth.REMOVE_MARKER, `Der Roboter entfernt die Marke unter sich.`) + `()<br>`}
        <div class="struct-dot"></div>
        ${makeTooltip(ENV.robot.mth.SEES_BLOCK, `Gibt <span class="struct-literal">wahr</span> zurück, wenn vor dem Roboter mindestens ein Ziegel liegt, sonst <span class="struct-literal">falsch</span>. Wenn du eine Farbe angibst, wird nur <span class="struct-literal">wahr</span> zurückgegeben, wenn der oberste Ziegel auf dem Stapel diese Farbe hat.`) + `(farbe?)<br>`}
        ${makeTooltip(ENV.robot.mth.IS_ON_MARKER, `Gibt <span class="struct-literal">wahr</span> zurück, wenn der Roboter auf einer Marke steht, sonst <span class="struct-literal">falsch</span>. Wenn du eine Farbe angibst, wird nur <span class="struct-literal">wahr</span> zurückgegeben, wenn die Marke diese Farbe hat.`) + `(farbe?)<br>`}
        ${makeTooltip(ENV.robot.mth.SEES_WALL, `Gibt <span class="struct-literal">wahr</span> zurück, wenn der Roboter vor einer Wand steht, sonst <span class="struct-literal">falsch</span>.`) + `()<br>`}
        ${makeTooltip(ENV.robot.mth.SEES_VOID, `Gibt <span class="struct-literal">wahr</span> zurück, wenn der Roboter vor dem Abgrund steht, sonst <span class="struct-literal">falsch</span>.`) + `()<br>`}
            
    </div>
</div>`

// World class
const WORLD_PSEUDO_CLASS = 
`<div class="struct-class">
    <div class="struct-classname">${ENV.world.cls}</div>
    
    <div class="struct-attributes" style="text-align: center">
        ${makeTooltip("❓", "Du musst die Attribute der Welt-Klasse nicht kennen oder benutzen.")}
    </div>
    
    <div class="struct-methods">
        ${makeTooltip(ENV.world.mth.IS_GOAL_REACHED , `Gibt <span class="struct-literal">wahr</span> zurück, wenn die aktuelle Teilaufgabe vollständig gelöst wurde, sonst <span class="struct-literal">falsch</span>.`) + "()<br>"}
        ${makeTooltip(ENV.world.mth.GET_STAGE_INDEX, `Gibt die aktuelle Teilaufgabe als Zahl aus, also <span class="struct-literal">1</span>, <span class="struct-literal">2</span>, <span class="struct-literal">3</span>, usw.`) + "()<br>"}
    </div>
</div>`

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
    structogramView.innerHTML = sections.join("<br>") + "<br>";

    classView.innerHTML = WORLD_PSEUDO_CLASS + "<br>" + ROBOT_PSEUDO_CLASS + "<br>"; // reset view
    classView.innerHTML += classes.join("<br>") + "<br>";
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
            return makeSpan(astNode.value.toString(), "struct-literal");
        case "StringLiteral":
            return makeSpan('"' + astNode.value + '"', "struct-literal");
        case "BooleanLiteral":
            return makeSpan(astNode.value ? "wahr" : "falsch", "struct-literal");
        case "NullLiteral":
            return makeSpan("nix", "struct-literal");
        case "Identifier":
            if (Object.values(ENV.global.const).includes(astNode.symbol))
                return makeSpan(astNode.symbol, "struct-literal");
            return makeSpan(astNode.symbol, "struct-ident");
        case "BinaryExpr":
            return structureBinaryExpr(astNode);
        case "UnaryExpr":
            return structureUnaryExpr(astNode);
        case "AssignmentExpr":
            return `${structure(astNode.assigne)} ist ${structure(astNode.value)}`
        case "CallExpr":
            return `${structure(astNode.ident)}(${astNode.args.map(structure).join(", ")})`
        case "MemberExpr":
            return `${makeSpan(structure(astNode.container), "struct-object")}<b>.</b>${structure(astNode.member)}`
        case "VarDeclaration":
            return `${makeSpan(TYPE2GER[astNode.type], "struct-type")}</span> <span class="struct-ident">${astNode.ident}</span> ist ${structure(astNode.value)}`
        case "ObjDeclaration":
            return `${makeSpan("Objekt", "struct-type")} <span class="struct-ident">${astNode.ident}</span> als <span class="struct-classtype">${astNode.classname}</span>`
        case "ShowCommand":
            return `${makeSpan("zeig", "struct-cmd")} ${astNode.values.map(structure).join(", ")}`
        case "FunctionDefinition":
            const funcHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")})`
            sections.push(
                makeDiv(`${makeTooltip("Funktion", "Hier wird eine neue Funktion definiert, die an anderen Stellen im Code aufgerufen werden kann. So muss man nicht immer dieselben Anweisungen schreiben.")}: ${funcHandle} ${structureSequence(astNode.body)}`, "struct-program")
            );
            return makeSpan(`↪  ${funcHandle}`, "struct-deemph");
        case "ExtMethodDefinition":
            const methodHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")}) für ${astNode.classname}`
            sections.push(
                makeDiv(`${makeTooltip("Methode", `Hier wird eine neue Methode für die Klasse ${astNode.classname} definiert, die an anderen Stellen im Code aufgerufen werden kann.`)}: ${methodHandle} ${structureSequence(astNode.body)}`,"struct-program")
            );
            return makeSpan(`↪ ${methodHandle}`, "struct-deemph");
        case "ClassDefinition":
            classes.push(structureClass(astNode));
            return makeSpan(`↪ ${astNode.ident}`, "struct-deemph");
        case "BreakCommand":
            return makeSpan("abbrechen", "struct-cmd");
        case "ContinueCommand":
            return makeSpan("weiter", "struct-cmd");
        case "ReturnCommand":
            return `${makeSpan("zurück", "struct-cmd")} ${structure(astNode.value)}`
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

// helper functions
function makeTooltip(txt: string, tt: string) {
    return `<span class="struct-tooltip">${txt}<span class="tooltip">${tt}</span></span>`;
}

function makeDiv(content: string, cls: string = "") {
    return `<div class="${cls}">${content}</div>`;
}

function makeSpan(content: string, cls: string = "") {
    return `<span class="${cls}">${content}</span>`;
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
        if (node.kind == "WhileBlock" || node.kind == "ForBlock" || node.kind == "IfElseBlock")
            result += `<div class="struct-box">${structure(node)}</div>`;
        else 
            result += `<div class="struct-box lpad rpad">${structure(node)}</div>`;
    }
    return result;
}

function structureWhile(node: WhileBlock): string {
    const cond = structure(node.condition);
    const result = 
    `<div class="struct-label">
    wiederhole ${makeTooltip("solange", "Die folgenden Anweisungen werden immer wieder ausgeführt, bis die Bedingung <u>" + cond + "</u> nicht mehr wahr ist!")}
    <br>&nbsp;&nbsp;&nbsp
    <span class="line">
    ${cond} 
    </span>
    </div>
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureFor(node: ForBlock): string {
    const count = structure(node.counter)
    const result = 
    `<div class="struct-label">
    wiederhole 
    <span class="line">${count} ${makeTooltip("mal", "Die folgenden Anweisungen werden sooft ausgeführt, wie es die Anzahl <u>" + count + "</u> vorgibt!")}
    </span>
    </div>
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureIfElse(node: IfElseBlock): string {
    const cond = structure(node.condition);
    let bias = "";
    if (node.ifFalse.length == 0 && node.ifTrue.length > 0) {
        bias = "left";
    }
    if (node.ifTrue.length == 0 && node.ifFalse.length > 0) {
        bias = "right";
    }

    const result =
    `
    <div class="struct-ifelse ${bias}">${cond} ? <br><br>
        <div style="display: flex;">
            <div style="flex: 50%; padding-left: 5px; text-align: left;">${makeTooltip("W", "Wenn die Bedingung <u>" + cond + "</u> zutrifft, wird die linke Spalte ausgeführt!")}</div>
            <div style="flex: 50%; padding-right: 5px; text-align: right;">${makeTooltip("F", "Wenn die Bedingung <u>" + cond + "</u> nicht zutrifft, wird die rechte Spalte ausgeführt!")}</div>
        </div>
    </div>
    <div class="struct-row ${bias}">
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