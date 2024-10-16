import { RuntimeError } from "../../../errors";
import { formatValue } from "../../../utils";
import { AbruptStmtKind, AlwaysBlock, ClassDefinition, DocComment, EmptyLine, ExtMethodDefinition, ForBlock, FunctionDefinition, IfElseBlock, ObjDeclaration, Program, ReturnCommand, ShowCommand, Stmt, StmtKind, AbruptEvalResult, VarDeclaration, WhileBlock, ContinueCommand, BreakCommand, SwitchBlock, FromToBlock, ForInBlock } from "../../frontend/ast";
import { CodePosition } from "../../frontend/lexer";
import { ClassPrototype, Environment, VarHolder } from "../environment";
import { SteppedEval, evaluate, evaluate_expr } from "../interpreter";
import {
    RuntimeVal,
    MK_NULL,
    FunctionVal,
    ClassVal,
    ObjectVal,
    MethodVal,
    AbruptReturn,
    AbruptContinue,
    AbruptBreak,
    AbruptAlias,
    ValueAlias,
    NumberVal,
    MK_NUMBER,
} from "../values";
import { eval_binary_expr, eval_numeric_binary_expr, eval_pure_binary_expr } from "./expressions";

export function* eval_program(prog: Program, env: Environment) {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of prog.body) {
        if (statement.kind == StmtKind.DocComment || statement.kind == StmtKind.EmptyLine) continue; // skip these
        lastEvaluated = yield* evaluate(statement, env);
    }
    return lastEvaluated;
}

export function* eval_var_declaration(
    decl: VarDeclaration,
    evalEnv: Environment,
    declEnv: Environment | VarHolder = evalEnv,
): SteppedEval<RuntimeVal> {
    if (!decl.value) {
        throw new RuntimeError(`Kein Wert gegeben: ${JSON.stringify(decl)}`, decl.codePos);
    }
    const value = yield* evaluate(decl.value, evalEnv);
    if (value.type != decl.type) {
        throw new RuntimeError(
            `Datentypen '${value.type}' und '${decl.type}' passen nicht zusammen!`, decl.codePos
        );
    }
    declEnv.declareVar(decl.ident, value);
    return value;
}

export function* eval_obj_declaration(
    decl: ObjDeclaration,
    evalEnv: Environment,
    declEnv: Environment | VarHolder = evalEnv,
): SteppedEval<RuntimeVal> {
    const cl = evalEnv.lookupVar(decl.classname);
    if (cl.type != ValueAlias.Class)
        throw new RuntimeError(`'${decl.classname}' ist kein Klassenname!`, decl.codePos);
    if (cl.internal)
        throw new RuntimeError(`Kann kein neues Objekt der Klasse '${decl.classname}' erzeugen.`, decl.codePos);

    const obj: ObjectVal = {
        type: ValueAlias.Object,
        cls: cl,
        ownMembers: new VarHolder(),
    };

    // calculate arguments of constructor
    const args: RuntimeVal[] = [];
    for (const expr of decl.args) {
        const result = yield* evaluate_expr(expr, evalEnv);
        args.push(result);
    }

    const constructorEnv = new Environment(evalEnv);

    // create variables
    if (args.length != cl.params.length)
        throw new RuntimeError(
            `Erwarte ${cl.params.length} Parameter, habe aber ${args.length} erhalten!`, decl.codePos
        );
    for (let i = 0; i < cl.params.length; i++) {
        const param = cl.params[i];
        const varname = param.ident;
        const arg = args[i];

        if (param.type != arg.type)
            throw new RuntimeError(
                `'${varname}' sollte '${param.type}' sein, ist aber '${arg.type}'`, decl.codePos
            );
        constructorEnv.declareVar(varname, args[i]);
    }
    
    for (const attr of cl.attributes) {
        if (attr.type == ValueAlias.Object) {
            yield* eval_obj_declaration(attr, constructorEnv, obj.ownMembers);
        } else {
            yield* eval_var_declaration(attr, constructorEnv, obj.ownMembers);
        }
    }

    declEnv.declareVar(decl.ident, obj, false);
    return obj;
}

export function* eval_fn_definition(
    def: FunctionDefinition,
    env: Environment
): SteppedEval<RuntimeVal> {
    const fn: FunctionVal = {
        type: ValueAlias.Function,
        name: def.name,
        params: def.params,
        declenv: env,
        body: def.body,
    };

    return env.declareVar(def.name, fn, true);
}

function eval_method_definition(
    def: FunctionDefinition,
    proto: ClassPrototype,
    env: Environment,
) {
    const method: MethodVal = {
        type: ValueAlias.Method,
        name: def.name,
        params: def.params,
        declenv: env,
        body: def.body,
    };

    proto.declareMethod(method.name, method);
}

export function eval_ext_method_definition(
    def: ExtMethodDefinition,
    env: Environment
): RuntimeVal {
    const cls = env.lookupVar(def.classname);
    if (cls.type != ValueAlias.Class)
        throw new RuntimeError(
            `Erweiterungsmethoden können nur für Klassen definiert werden, nicht für '${cls.type}'!`, def.codePos
        );
    cls.prototype.declareMethod(def.name, {
        type: ValueAlias.Method,
        body: def.body,
        name: def.name,
        declenv: env,
        params: def.params,
    });
    return MK_NULL();
}

export function eval_class_definition(
    def: ClassDefinition,
    env: Environment
): RuntimeVal {
    if (!env.isGlobal())
        throw new RuntimeError(
            `Du kannst Klassen wie '${def.ident}' nur global definieren!`, def.codePos
        );
    const prototype = new ClassPrototype();
    for (const m of def.methods) {
        eval_method_definition(m, prototype, env);
    }

    const cl: ClassVal = {
        type: ValueAlias.Class,
        name: def.ident,
        attributes: def.attributes,
        params: def.params,
        prototype,
    };

    return env.declareVar(def.ident, cl);
}

export function* eval_show_command(
    cmd: ShowCommand,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (!cmd.values) return MK_NULL();
    let result: RuntimeVal = MK_NULL();
    const fmtOutputs = [];
    for (const val of cmd.values) {
        result = yield* evaluate_expr(val, env);

        // side effect
        fmtOutputs.push(formatValue(result));
    }
    console.log(fmtOutputs.join(" "));
    return result;
}

export function* eval_return_command(
    ret: ReturnCommand,
    env: Environment
): SteppedEval<AbruptReturn> {
    return {
        type: AbruptAlias.Return,
        value: yield* evaluate_expr(ret.value, env),
    }
}

export function* eval_break_command(
    brk: BreakCommand,
    env: Environment
): SteppedEval<AbruptBreak> {
    return {
        type: AbruptAlias.Break,
    }
}

export function* eval_continue_command(
    cnt: ContinueCommand,
    env: Environment
): SteppedEval<AbruptContinue> {
    return {
        type: AbruptAlias.Continue,
    }
}

function evaluate_condition_value(
    condition: RuntimeVal,
    codePos: CodePosition
): boolean {
    if (condition.type == ValueAlias.Boolean) {
        return condition.value;
    }
    if (condition.type == ValueAlias.Number) return condition.value != 0;
    throw new RuntimeError(
        "Die Bedingung muss eine Zahl oder ein Wahrheitswert sein!", codePos
    );

}

export function* eval_if_else_block<A extends AbruptStmtKind>(
    block: IfElseBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const condition = yield* evaluate_expr(block.condition, env);
    if (evaluate_condition_value(condition, block.codePos)) {
        return yield* eval_bare_statements(block.ifTrue, new Environment(env));
    } else {
        return yield* eval_bare_statements(block.ifFalse, new Environment(env));
    }
}

export function* eval_switch_block<A extends AbruptStmtKind>(
    block: SwitchBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    let lastCond: boolean = false;
    const selectedVal = yield* evaluate_expr(block.selection, env);

    loop: for (const caseBlock of block.cases) {
        const compVal = yield* evaluate_expr(caseBlock.comp, env);
        const cond = eval_pure_binary_expr(selectedVal, compVal, "=", block.codePos);
        if (cond.type != ValueAlias.Boolean)
            throw new RuntimeError(`Vergleich in Fallunterscheidung fehlgeschlagen.`, block.codePos);
        
        if (cond.value) lastCond = cond.value;
        if (!lastCond) continue; // skip block if not equal
        
        const bodyValue = yield* eval_bare_statements(caseBlock.body, new Environment(env));
        
        switch (bodyValue.type) {
            case AbruptAlias.Return:
                return bodyValue;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL(); // maybe unnecessary
                break loop; // explicit break is allowed
            case AbruptAlias.Continue:
                continue loop; // explicit continue is forced
            default:
                lastEvaluated = bodyValue;
                break loop; // break by default
        }
        // TODO: Implement default, implement fallthrough
    }
    
    if (!lastCond) {
        // default case
        const defaultValue = yield* eval_bare_statements(block.fallback, new Environment(env));
        switch (defaultValue.type) {
            case AbruptAlias.Return:
                return defaultValue;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break;
            case AbruptAlias.Continue:
                break; // acts as break in this case
            default:
                lastEvaluated = defaultValue;
        }
    }

    return lastEvaluated;
}

export function* eval_for_block<A extends AbruptStmtKind>(
    block: ForBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const counter = yield* evaluate(block.counter, env);
    if (counter.type != ValueAlias.Number)
        throw new RuntimeError("Zähler muss eine Zahl sein!", block.codePos);
    let max = counter.value;
    if (max < 0) throw new RuntimeError("Zähler muss größer oder gleich 0 sein!", block.codePos);

    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: for (let i = 0; i < max; i++) {
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case AbruptAlias.Return:
                return bodyValue;
            case AbruptAlias.Continue:
                continue loop;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break loop;
            default:
                lastEvaluated = bodyValue;
        }
    }
    return lastEvaluated;
}

export function* eval_from_to_block<A extends AbruptStmtKind>(
    block: FromToBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const startVal = yield* evaluate(block.start, env);
    const endVal = yield* evaluate(block.end, env);
    if (startVal.type != ValueAlias.Number || endVal.type != ValueAlias.Number)
        throw new RuntimeError("Start- und Endwert müssen Zahlen sein!", block.codePos);
    if (startVal.value > endVal.value) throw new RuntimeError("Startwert muss kleiner oder gleich dem Endwert sein.", block.codePos);


    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: for (let i = startVal.value; i < endVal.value; i++) {
        const loopEnv = new Environment(env);
        if (block.iterIdent)
            loopEnv.declareVar(block.iterIdent, MK_NUMBER(i), true); // declare iter const
        const bodyValue = yield* eval_bare_statements(
            block.body,
            loopEnv,
        );
        switch (bodyValue.type) {
            case AbruptAlias.Return:
                return bodyValue;
            case AbruptAlias.Continue:
                continue loop;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break loop;
            default:
                lastEvaluated = bodyValue;
        }
    }
    return lastEvaluated;
}

export function* eval_for_in_block<A extends AbruptStmtKind>(
    block: ForInBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const listVal = yield* evaluate(block.list, env);
    if (listVal.type != ValueAlias.List)
        throw new RuntimeError("Kann nur über 'Liste' iterieren!", block.codePos);

    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: for (const el of listVal.elements) {
        const loopEnv = new Environment(env);
        if (block.iterIdent)
            loopEnv.declareVar(block.iterIdent, el, true); // declare iter from list element
        const bodyValue = yield* eval_bare_statements(
            block.body,
            loopEnv,
        );
        switch (bodyValue.type) {
            case AbruptAlias.Return:
                return bodyValue;
            case AbruptAlias.Continue:
                continue loop;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break loop;
            default:
                lastEvaluated = bodyValue;
        }
    }
    return lastEvaluated;
}

export function* eval_while_block<A extends AbruptStmtKind>(
    block: WhileBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: while (true) {
        yield block.codePos;
        // yield here to prevent infinite loops from being unable to be stopped
        const condition = yield* evaluate_expr(block.condition, env);
        if (!evaluate_condition_value(condition, block.codePos))
            break loop;
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case AbruptAlias.Continue:
                continue loop;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break loop;
            case AbruptAlias.Return:
                return bodyValue;
            default:
                lastEvaluated = bodyValue;
        }
    }
    return lastEvaluated;
}

export function* eval_always_block<A extends AbruptStmtKind>(
    block: AlwaysBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: while (true) {
        yield block.codePos;
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case AbruptAlias.Return:
                return bodyValue;
            case AbruptAlias.Continue:
                continue loop;
            case AbruptAlias.Break:
                lastEvaluated = MK_NULL();
                break loop;
            default:
                lastEvaluated = bodyValue;
        }
    }
    return lastEvaluated;
}

export function* eval_bare_statements<A extends AbruptStmtKind>(
    body: Stmt<A>[],
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of body) {
        if (statement.kind == StmtKind.DocComment || statement.kind == StmtKind.EmptyLine) continue; // skip these
        const evaluated = yield* evaluate(statement, env);
        switch (evaluated.type) {
            case AbruptAlias.Break:
            case AbruptAlias.Continue:
            case AbruptAlias.Return:
                return evaluated;
            default:
                lastEvaluated = evaluated;
        }
    }
    return lastEvaluated;
}

export function eval_empty_line(node: EmptyLine, env: Environment): RuntimeVal {
    return MK_NULL();
}

export function eval_doc_comment(node: DocComment, env: Environment): RuntimeVal {
    return MK_NULL();
}