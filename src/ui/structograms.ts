import { AnyStmt, BinaryExpr, ClassDefinition, Expr, ExtMethodDefinition, AnyForBlock, FunctionDefinition, AnyIfElseBlock, Program, UnaryExpr, AnyWhileBlock, AnyAlwaysBlock, StmtKind, SwitchBlock, AnySwitchBlock, AnyCaseBlock, AnyFromToBlock } from "../language/frontend/ast";
import { ValueAlias } from "../language/runtime/values";
import { ENV } from "../spec";
import { translateOperator } from "../utils";
import { toggleDefs, toggleLabels, toggleMethods, toggleFunctions } from "./toggle-buttons";

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
        <div class="struct-dot"></div>
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
        ${makeTooltip(ENV.world.mth.IS_GOAL_REACHED, `Gibt <span class="struct-literal">wahr</span> zurück, wenn die aktuelle Teilaufgabe vollständig gelöst wurde, sonst <span class="struct-literal">falsch</span>.`) + "()<br>"}
        ${makeTooltip(ENV.world.mth.GET_STAGE_INDEX, `Gibt die aktuelle Teilaufgabe als Zahl aus, also <span class="struct-literal">1</span>, <span class="struct-literal">2</span>, <span class="struct-literal">3</span>, usw.`) + "()<br>"}
    </div>
</div>`

let sections: string[] = [];
let classes: Record<string, HTMLElement> = {};

// Structograms
export function showStructogram(program: Program) {
    const structogramView = document.getElementById("structogram-diagram-canvas")!;
    const classView = document.getElementById("class-diagram-canvas")!;

    let worldElement = document.createElement('div');
    worldElement.innerHTML = WORLD_PSEUDO_CLASS;
    let robotElement = document.createElement('div');
    robotElement.innerHTML = ROBOT_PSEUDO_CLASS;

    classes = {
        "Welt": worldElement,
        "Roboter": robotElement,
    };

    sections = [];
    sections.push(structure(program));

    structogramView.innerHTML = ""; // reset view
    structogramView.innerHTML = sections.join("<br>") + "<br>";

    // classView.innerHTML = WORLD_PSEUDO_CLASS + "<br>" + ROBOT_PSEUDO_CLASS + "<br>"; // reset view
    // classView.innerHTML += Object.values(classes).map((e)).join("<br>") + "<br>";
    classView.innerHTML = "";
    for (const el of Object.values(classes)) {
        classView.append(el);
        classView.innerHTML += "<br>";
    }
}

export function setStructogramVisibility(visible: boolean) {
    document.getElementById("class-diagram-canvas")!.style.visibility = visible ? "visible" : "hidden";
    document.getElementById("class-diagram-title")!.style.visibility = visible ? "visible" : "hidden";
    document.getElementById("structogram-diagram-canvas")!.style.visibility = visible ? "visible" : "hidden";
    document.getElementById("structogram-diagram-title")!.style.visibility = visible ? "visible" : "hidden";
}

function structure(astNode: Program | AnyStmt): string {
    // const view = document.getElementById("diagram-canvas")!;
    switch (astNode.kind) {
        case StmtKind.Program:
            return structureProgram(astNode);
        case StmtKind.IfElseBlock:
            return structureIfElse(astNode);
        case StmtKind.SwitchBlock:
            return structureSwitchCase(astNode);
        case StmtKind.WhileBlock:
            return structureWhile(astNode);
        case StmtKind.AlwaysBlock:
            return structureAlways(astNode);
        case StmtKind.ForBlock:
            return structureFor(astNode);
        case StmtKind.FromToBlock:
            return structureFromTo(astNode);
        case StmtKind.NumericLiteral:
            return makeSpan(astNode.value.toString(), "struct-literal");
        case StmtKind.StringLiteral:
            return makeSpan('"' + astNode.value + '"', "struct-string");
        case StmtKind.BooleanLiteral:
            return makeSpan(astNode.value ? "wahr" : "falsch", "struct-literal");
        case StmtKind.NullLiteral:
            return makeSpan("nix", "struct-literal");
        case StmtKind.Identifier:
            if (Object.values(ENV.global.const).includes(astNode.symbol))
                return makeSpan(astNode.symbol, "struct-literal");
            return makeSpan(astNode.symbol, "struct-ident");
        case StmtKind.BinaryExpr:
            return structureBinaryExpr(astNode);
        case StmtKind.UnaryExpr:
            return structureUnaryExpr(astNode);
        case StmtKind.AssignmentExpr:
            return `${structure(astNode.assigne)} ist ${structure(astNode.value)}`
        case StmtKind.CallExpr:
            return `${structure(astNode.ident)}(${astNode.args.map(structure).join(", ")})`
        case StmtKind.MemberExpr:
            return `${makeSpan(structure(astNode.container), "struct-object")}<b>.</b>${structure(astNode.member)}`
        case StmtKind.ComputedMemberExpr:
            return `${structure(astNode.container)}&lsqb;${structure(astNode.accessor)}&rsqb;`
        case StmtKind.VarDeclaration:
            return `${makeSpan(astNode.type, "struct-type")}</span> <span class="struct-ident">${astNode.ident}</span> ist ${structure(astNode.value)}`
        case StmtKind.ObjDeclaration:
            return `${makeSpan("Objekt", "struct-type")} <span class="struct-ident">${astNode.ident}</span> als <span class="struct-classtype">${astNode.classname}</span>`
        case StmtKind.ShowCommand:
            return `${makeSpan("zeig", "struct-cmd")} ${astNode.values.map(structure).join(", ")}`
        case StmtKind.FunctionDefinition:
            return structureFunction(astNode);
        case StmtKind.ExtMethodDefinition:
            return structureExtMethod(astNode);
        case StmtKind.ClassDefinition:
            return structureClass(astNode);
        case StmtKind.BreakCommand:
            return makeSpan("abbrechen ▢", "struct-cmd break");
        case StmtKind.ContinueCommand:
            return makeSpan("weiter ↺", "struct-cmd continue");
        case StmtKind.ReturnCommand:
            return `${makeSpan("↩ zurück", "struct-cmd return")} ${structure(astNode.value)}`
        case StmtKind.DocComment:
            return makeDiv(makeDiv(`${astNode.content.replace(/\n/g, "<br>")}`, "struct-doc-comment"), "struct-doc-wrapper");
        case StmtKind.EmptyLine:
        default:
            return `<span>&lt${astNode.kind}&gt</span>`
    }
}

function encapsulateExpr(astNode: Expr, right = false) {
    const expr = structure(astNode)

    if (astNode.kind == StmtKind.BinaryExpr || astNode.kind == StmtKind.UnaryExpr)
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
    
    return `${makeSpan(leftSide, "line")} ${translateOperator(astNode.operator)} ${makeSpan(rightSide, "line")}`
}

function structureUnaryExpr(astNode: UnaryExpr) {
    let rightSide = encapsulateExpr(astNode.right);
    let operator = translateOperator(astNode.operator);
    if (operator.length > 1) rightSide = " " + rightSide; // pad for multicharacter operators
    
    return `${operator}${rightSide}`
}

function structureSequence(body: AnyStmt[]): string {
    let result = "";
    for (const node of body) {
        if (!toggleDefs.active && (node.kind == StmtKind.ClassDefinition || node.kind == StmtKind.FunctionDefinition || node.kind == StmtKind.ExtMethodDefinition)) {
            structure(node);
            continue;
        }
        if (!toggleLabels.active && node.kind == StmtKind.DocComment) continue;
        
        switch (node.kind) {
            case StmtKind.WhileBlock:
            case StmtKind.ForBlock:
            case StmtKind.FromToBlock:
            case StmtKind.AlwaysBlock:
            case StmtKind.IfElseBlock:
            case StmtKind.SwitchBlock:
                result += `<div class="struct-box">${structure(node)}</div>`
                break;
            default:
                result += `<div class="struct-box lpad rpad">${structure(node)}</div>`;
                break;
        }
    }
    return result;
}

function structureWhile(node: AnyWhileBlock): string {
    const cond = structure(node.condition);
    const result = 
    `<div class="struct-label">
    wiederhole ${makeTooltip("solange", "Die folgenden Anweisungen werden immer wieder ausgeführt, bis die Bedingung <u>" + cond + "</u> nicht mehr wahr ist!")}
    <span class="line">
    ${cond} 
    </span>
    </div>
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureAlways(node: AnyAlwaysBlock): string {
    const result = 
    `<div class="struct-label">
    wiederhole ${makeTooltip("immer", "Die folgenden Anweisungen werden auf immer und ewig ausgeführt - außer man benutzt 'abbrechen' oder 'zurück'!")}
    </div>
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureFor(node: AnyForBlock): string {
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

function structureFromTo(node: AnyFromToBlock): string {
    const start = structure(node.start);
    const end = structure(node.end);
    const result = 
    `<div class="struct-label">
    wiederhole 
    <span class="line">${node.iterIdent ? "für " + makeSpan(node.iterIdent, "struct-ident") : ""} von ${start} bis ${end} 
    </span>
    </div>
        <div class="struct-while">${structureSequence(node.body)}</div>`
    return result;
}

function structureIfElse(node: AnyIfElseBlock): string {
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
        <div class="struct-column">
            <div class="struct-if"></div>
            ${structureSequence(node.ifTrue)}
        </div>
        <div class="struct-column">
            <div class="struct-else"></div>
            ${structureSequence(node.ifFalse)}
        </div>
    </div>
    `
    return result;
}

function structureSwitchCase(node: AnySwitchBlock): string {
    const selection = structure(node.selection);
    let h = node.cases.length - 1;

    let result = `
    <div class="struct-switch"> ${selection} ?<br>
        <div style="display: flex;">
            <div style="flex: 50%; padding-left: 5px; text-align: left;"></div>
            <div style="flex: 50%; padding-right: 5px; text-align: right;"></div>
        </div>
    </div>
    <div class="struct-row">
    `

    for (const c of node.cases) {
        result += `<div class="struct-column">
        <div class="struct-switch-condition">
        = ${structure(c.comp)}
        <div class="struct-case">
        ${structureSequence(c.body)}
        </div>
        </div>
        </div>`
    }
    if (node.fallback.length > 0) {
        result += `<div class="struct-column">
        <div class="struct-switch-condition">
        sonst
        <div class="struct-case">
        ${structureSequence(node.fallback)}
        </div>
        </div>
        </div>`
    }

    result += "</div>"

    return result;
}


function structureClass(node: ClassDefinition): string {
    // structure methods within
    for (const meth of node.methods) {
        structureMethod(meth, node.ident);
    }
    
    // create class diagram
    const result = 
    `<div class="struct-class">
        <div class="struct-classname">
            ${node.ident}
        </div>
        
        <div class="struct-attributes">
            ${node.attributes.map((attr) => {
                if (attr.type == ValueAlias.Object)
                    return `<span class="struct-type">${attr.classname}</span> ${attr.ident}`
                else
                    return `<span class="struct-type">${attr.type}</span> ${attr.ident}`
            }).join("<br>")}
        </div>
        
        <div class="struct-methods">${
            node.methods.map((meth) => {
                return `${meth.name}(${meth.params.map((p) => p.ident).join(", ")})`
            }).join("<br>")}
            <div class="struct-dot"></div>
        </div>
    </div>`

    const newClass = document.createElement("div");
    newClass.innerHTML = result;
    classes[node.ident] = newClass;
    return makeSpan(`▢ ${node.ident}`, "struct-deemph");
}

function structureMethod(astNode: FunctionDefinition, classname: string): void {
    const methodHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")})`
    const fullMethodHandle = `${methodHandle} in <span class="struct-classtype">${classname}</span>`
    if (toggleMethods.active)
        sections.push(
            makeDiv(`${makeTooltip("Methode", `Hier ist eine Methode in der Klasse ${classname} definiert, die an anderen Stellen im Code aufgerufen werden kann.`)}: ${fullMethodHandle} ${structureSequence(astNode.body)}`,"struct-program method")
        );
}

function structureExtMethod(astNode: ExtMethodDefinition): string {
    const methodHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")})`
    const fullMethodHandle = `${methodHandle} für <span class="struct-classtype">${astNode.classname}</span>`
    if (toggleMethods.active)
        sections.push(
            makeDiv(`${makeTooltip("Methode", `Hier wird eine neue Methode für die Klasse ${astNode.classname} definiert, die an anderen Stellen im Code aufgerufen werden kann.`)}: ${fullMethodHandle} ${structureSequence(astNode.body)}`,"struct-program method")
        );
    // If the class already exists, we can add the method to it
    if (astNode.classname in classes)
        classes[astNode.classname].getElementsByClassName("struct-methods")[0].innerHTML += methodHandle + "<br>";
    return makeSpan(`▱ ${fullMethodHandle}`, "struct-deemph");
}

function structureFunction(astNode: FunctionDefinition) {
    const funcHandle = `${astNode.name}(${astNode.params.map((p) => p.ident).join(", ")})`
    if (toggleFunctions.active)
        sections.push(
            makeDiv(`${makeTooltip("Funktion", "Hier wird eine neue Funktion definiert, die an anderen Stellen im Code aufgerufen werden kann. So muss man nicht immer dieselben Anweisungen schreiben.")}: ${funcHandle} ${structureSequence(astNode.body)}`, "struct-program function")
        );
    return makeSpan(`▷  ${funcHandle}`, "struct-deemph");
}

