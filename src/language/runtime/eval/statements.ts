import { RuntimeError } from "../../../errors";
import { AlwaysBlock, ClassDefinition, DocComment, EmptyLine, ExtMethodDefinition, ForBlock, FunctionDefinition, IfElseBlock, ObjDeclaration, Program, ReturnCommand, ShowCommand, Stmt, VarDeclaration, WhileBlock } from "../../frontend/ast";
import { ClassPrototype, Environment, VarHolder } from "../environment";
import { SteppedEval, evaluate } from "../interpreter";
import {
    RuntimeVal,
    MK_NULL,
    FunctionVal,
    ClassVal,
    ObjectVal,
    BooleanVal,
    MethodVal,
} from "../values";
import { Break, Continue, Return } from "./errors";

export function* eval_program(prog: Program, env: Environment) {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of prog.body) {
        if (statement.kind == "DocComment" || statement.kind == "EmptyLine") continue; // skip these
        try {
            lastEvaluated = yield* evaluate(statement, env);
        } catch (e) {
            if (e instanceof Return) return e.value;
            throw e;
        }
    }
    return lastEvaluated;
}

export function* eval_var_declaration(
    decl: VarDeclaration,
    evalEnv: Environment,
    declEnv: Environment | VarHolder = evalEnv,
): SteppedEval<RuntimeVal> {
    if (!decl.value) {
        throw new RuntimeError(`Kein Wert gegeben: ${JSON.stringify(decl)}`);
    }
    const value = yield* evaluate(decl.value, evalEnv);
    if (value.type != decl.type) {
        throw new RuntimeError(
            `Datentypen '${value.type}' und '${decl.type}' passen nicht zusammen!`
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
        throw new RuntimeError(`'${decl.classname}' ist kein Klassenname!`);
    if (cl.internal)
        throw new RuntimeError(`Kann kein neues Objekt der Klasse ${decl.classname} erzeugen.`);

    const obj: ObjectVal = {
        type: "object",
        cls: cl,
        ownMembers: new VarHolder(),
    };

    for (const attr of cl.attributes) {
        if (attr.type == "object") {
            yield* eval_obj_declaration(attr, evalEnv, obj.ownMembers);
        } else {
            yield* eval_var_declaration(attr, evalEnv, obj.ownMembers);
        }
    }

    declEnv.declareVar(decl.ident, obj, true);
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
    env: ClassPrototype,
) {
    const method: MethodVal = {
        type: "method",
        name: def.name,
        params: def.params,
        body: def.body,
    };

    env.declareMethod(method.name, method);
}

export function eval_ext_method_definition(
    def: ExtMethodDefinition,
    env: Environment
): RuntimeVal {
    const cls = env.lookupVar(def.classname);
    if (cls.type != "class")
        throw new RuntimeError(
            `Erweiterungsmethoden können nur für Klassen definiert werden, nicht für '${cls.type}'!`
        );
    cls.prototype.declareMethod(def.name, {
        type: "method",
        body: def.body,
        name: def.name,
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
            `Du kannst Klassen wie '${def.ident}' nur global definieren!`
        );
    const prototype = new ClassPrototype(env);
    for (const m of def.methods) {
        eval_method_definition(m, prototype);
    }

    const cl: ClassVal = {
        type: "class",
        name: def.ident,
        attributes: def.attributes,
        prototype,
        declenv: env,
    };

    return env.declareVar(def.ident, cl);
}

export function* eval_show_command(
    cmd: ShowCommand,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (!cmd.values) return MK_NULL();
    let output = "";
    let result: RuntimeVal = MK_NULL();
    for (const val of cmd.values) {
        result = yield* evaluate(val, env);

        // side effect
        if (result.type == "number") {
            output += result.value.toString();
        } else if (result.type == "boolean") {
            const value = result.value;
            if (value) {
                output += "wahr";
            } else {
                output += "falsch";
            }
        } else if (result.type == "null") {
            output += "nix";
        } else if (result.type == "string") {
            output += result.value.toString();
        }
        output += " ";
    }
    console.log(output);
    return result;
}

export function* eval_return_command(
    ret: ReturnCommand,
    env: Environment
): SteppedEval<RuntimeVal> {
    throw new Return(yield* evaluate(ret.value, env));
}

function evaluate_condition_value(
    condition: RuntimeVal
): boolean {
    if (condition.type == "boolean") {
        return condition.value;
    }
    if (condition.type == "number") return condition.value != 0;
    throw new RuntimeError(
        "Die Bedingung muss eine Zahl oder ein Wahrheitswert sein!"
    );

}

export function* eval_if_else_block(
    block: IfElseBlock,
    env: Environment
): SteppedEval<RuntimeVal> {
    const condition = yield* evaluate(block.condition, env);
    if (evaluate_condition_value(condition)) {
        return yield* eval_bare_statements(block.ifTrue, new Environment(env));
    } else {
        return yield* eval_bare_statements(block.ifFalse, new Environment(env));
    }
}

export function* eval_for_block(
    block: ForBlock,
    env: Environment
): SteppedEval<RuntimeVal> {
    const counter = yield* evaluate(block.counter, env);
    if (counter.type != "number")
        throw new RuntimeError("Zähler muss eine Zahl sein!");
    let i = counter.value;
    let lastEvaluated: RuntimeVal = MK_NULL();
    if (i < 0) throw new RuntimeError("Zähler muss größer oder gleich 0 sein!");

    try {
        while (i > 0) {
            yield block.lineIndex;
            try {
                lastEvaluated = yield* eval_bare_statements(
                    block.body,
                    new Environment(env)
                );
            } catch (e) {
                if (!(e instanceof Continue)) {
                    throw e;
                }
            }
            i--;
        }
    } catch (e) {
        if (!(e instanceof Break)) {
            throw e;
        }
        return MK_NULL();
    }
    return lastEvaluated;
}

export function* eval_while_block(
    block: WhileBlock,
    env: Environment
): SteppedEval<RuntimeVal> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    try {
        while (true) {
            yield block.lineIndex;
            try {
                // yield here to prevent infinite loops from being unable to be stopped
                const condition = yield* evaluate(block.condition, env);
                if (evaluate_condition_value(condition)) {
                    lastEvaluated = yield* eval_bare_statements(
                        block.body,
                        new Environment(env)
                    );
                } else {
                    return lastEvaluated;
                }
            } catch (e) {
                if (!(e instanceof Continue)) {
                    throw e;
                }
            }
        }
    } catch (e) {
        if (!(e instanceof Break)) {
            throw e;
        }
        return MK_NULL();
    }
}

export function* eval_always_block(
    block: AlwaysBlock,
    env: Environment
): SteppedEval<RuntimeVal> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    try {
        while (true) {
            yield block.lineIndex;
            try {
                lastEvaluated = yield* eval_bare_statements(
                    block.body,
                    new Environment(env)
                );
            } catch (e) {
                if (!(e instanceof Continue)) {
                    throw e;
                }
            }
        }
    } catch (e) {
        if (!(e instanceof Break)) {
            throw e;
        }
        return MK_NULL();
    }
}

export function* eval_bare_statements(
    body: Stmt[],
    env: Environment
): SteppedEval<RuntimeVal> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of body) {
        if (statement.kind == "DocComment" || statement.kind == "EmptyLine") continue; // skip these
        lastEvaluated = yield* evaluate(statement, env);
    }
    return lastEvaluated;
}

export function eval_empty_line(node: EmptyLine, env: Environment): RuntimeVal {
    return MK_NULL();
}

export function eval_doc_comment(node: DocComment, env: Environment): RuntimeVal {
    return MK_NULL();
}