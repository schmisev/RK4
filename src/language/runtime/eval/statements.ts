import { RuntimeError } from "../../../errors";
import { AbruptStmtKind, AlwaysBlock, ClassDefinition, DocComment, EmptyLine, ExtMethodDefinition, ForBlock, FunctionDefinition, IfElseBlock, ObjDeclaration, Program, ReturnCommand, ShowCommand, Stmt, StmtKind, AbruptEvalResult, VarDeclaration, WhileBlock, ContinueCommand, BreakCommand } from "../../frontend/ast";
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
} from "../values";

export function* eval_program(prog: Program, env: Environment) {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of prog.body) {
        if (statement.kind == StmtKind.DocComment || statement.kind == "EmptyLine") continue; // skip these
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
        throw new RuntimeError(`Kein Wert gegeben: ${JSON.stringify(decl)}`, decl.lineIndex);
    }
    const value = yield* evaluate(decl.value, evalEnv);
    if (value.type != decl.type) {
        throw new RuntimeError(
            `Datentypen '${value.type}' und '${decl.type}' passen nicht zusammen!`, decl.lineIndex
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
    if (cl.type != "class")
        throw new RuntimeError(`'${decl.classname}' ist kein Klassenname!`, decl.lineIndex);
    if (cl.internal)
        throw new RuntimeError(`Kann kein neues Objekt der Klasse '${decl.classname}' erzeugen.`, decl.lineIndex);

    const obj: ObjectVal = {
        type: "object",
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
            `Erwarte ${cl.params.length} Parameter, habe aber ${args.length} erhalten!`, decl.lineIndex
        );
    for (let i = 0; i < cl.params.length; i++) {
        const param = cl.params[i];
        const varname = param.ident;
        const arg = args[i];

        if (param.type != arg.type)
            throw new RuntimeError(
                `'${varname}' sollte '${param.type}' sein, ist aber '${arg.type}'`, decl.lineIndex
            );
        constructorEnv.declareVar(varname, args[i]);
    }
    
    for (const attr of cl.attributes) {
        if (attr.type == "object") {
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
        type: "function",
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
        type: "method",
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
    if (cls.type != "class")
        throw new RuntimeError(
            `Erweiterungsmethoden können nur für Klassen definiert werden, nicht für '${cls.type}'!`, def.lineIndex
        );
    cls.prototype.declareMethod(def.name, {
        type: "method",
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
            `Du kannst Klassen wie '${def.ident}' nur global definieren!`, def.lineIndex
        );
    const prototype = new ClassPrototype();
    for (const m of def.methods) {
        eval_method_definition(m, prototype, env);
    }

    const cl: ClassVal = {
        type: "class",
        name: def.ident,
        attributes: def.attributes,
        params: def.params,
        prototype,
    };

    return env.declareVar(def.ident, cl);
}

function formatValue(value: RuntimeVal): string {
    // side effect
    if (value.type == "number") {
        return value.value.toString();
    } else if (value.type == "boolean") {
        const boolVal = value.value;
        if (boolVal) {
            return "wahr";
        } else {
            return "falsch";
        }
    } else if (value.type == "null") {
        return "nix";
    } else if (value.type == "string") {
        return value.value;
    } else if (value.type == "object") {
        return `[Object der Klasse ${value.cls.name}]`;
    } else if (value.type == "class") {
        return `<Klasse ${value.name}>`;
    } else if (value.type == "function" || value.type == "native-fn") {
        return `(Funktion ${value.name})`;
    }
    return value satisfies never;
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
        type: "return",
        value: yield* evaluate_expr(ret.value, env),
    }
}

export function* eval_break_command(
    brk: BreakCommand,
    env: Environment
): SteppedEval<AbruptBreak> {
    return {
        type: "break",
    }
}

export function* eval_continue_command(
    cnt: ContinueCommand,
    env: Environment
): SteppedEval<AbruptContinue> {
    return {
        type: "continue",
    }
}

function evaluate_condition_value(
    condition: RuntimeVal,
    lineIndex: number
): boolean {
    if (condition.type == "boolean") {
        return condition.value;
    }
    if (condition.type == "number") return condition.value != 0;
    throw new RuntimeError(
        "Die Bedingung muss eine Zahl oder ein Wahrheitswert sein!", lineIndex
    );

}

export function* eval_if_else_block<A extends AbruptStmtKind>(
    block: IfElseBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const condition = yield* evaluate_expr(block.condition, env);
    if (evaluate_condition_value(condition, block.lineIndex)) {
        return yield* eval_bare_statements(block.ifTrue, new Environment(env));
    } else {
        return yield* eval_bare_statements(block.ifFalse, new Environment(env));
    }
}

export function* eval_for_block<A extends AbruptStmtKind>(
    block: ForBlock<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const counter = yield* evaluate(block.counter, env);
    if (counter.type != "number")
        throw new RuntimeError("Zähler muss eine Zahl sein!", block.lineIndex);
    let max = counter.value;
    if (max < 0) throw new RuntimeError("Zähler muss größer oder gleich 0 sein!", block.lineIndex);

    let lastEvaluated: RuntimeVal = MK_NULL();
    loop: for (let i = 0; i < max; i++) {
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case "return":
                return bodyValue;
            case "continue":
                continue loop;
            case "break":
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
        yield block.lineIndex;
        // yield here to prevent infinite loops from being unable to be stopped
        const condition = yield* evaluate_expr(block.condition, env);
        if (!evaluate_condition_value(condition, block.lineIndex))
            break loop;
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case "continue":
                continue loop;
            case "break":
                lastEvaluated = MK_NULL();
                break loop;
            case "return":
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
        yield block.lineIndex;
        const bodyValue = yield* eval_bare_statements(
            block.body,
            new Environment(env)
        );
        switch (bodyValue.type) {
            case "return":
                return bodyValue;
            case "continue":
                continue loop;
            case "break":
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
            case "break":
            case "continue":
            case "return":
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