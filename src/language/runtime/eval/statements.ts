import { RuntimeError } from "../../../errors";
import { ClassDefinition, EmptyLine, ExtMethodDefinition, ForBlock, FunctionDefinition, IfElseBlock, ObjDeclaration, Program, ReturnCommand, ShowCommand, Stmt, VarDeclaration, WhileBlock } from "../../frontend/ast";
import Environment from "../environment";
import { SteppedEval, evaluate } from "../interpreter";
import {
    RuntimeVal,
    MK_NULL,
    NumberVal,
    BooleanVal,
    StringVal,
    FunctionVal,
    ClassVal,
    ObjectVal,
} from "../values";
import { Break, Continue, Return } from "./errors";

export function* eval_program(prog: Program, env: Environment) {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of prog.body) {
        lastEvaluated = yield* evaluate(statement, env);
    }
    return lastEvaluated;
}

export function* eval_var_declaration(
    decl: VarDeclaration,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (!decl.value) {
        throw new RuntimeError(`Kein Wert gegeben: ${JSON.stringify(decl)}`);
    }
    const value = yield* evaluate(decl.value, env);
    if (value.type != decl.type) {
        throw new RuntimeError(
            `Datentypen '${value.type}' und '${decl.type}' passen nicht zusammen!`
        );
    }
    return env.declareVar(decl.ident, value);
}

export function eval_obj_declaration(
    decl: ObjDeclaration,
    env: Environment
): RuntimeVal {
    const cl = env.lookupVar(decl.classname) as ClassVal;
    if (cl.type != "class")
        throw new RuntimeError(`'${decl.classname}' ist kein Klassenname!`);
    const scope = new Environment(cl.declenv);

    for (const attr of cl.attributes) {
        if (attr.type == "object") {
            eval_obj_declaration(attr as unknown as ObjDeclaration, scope);
        } else {
            eval_var_declaration(attr as VarDeclaration, scope);
        }
    }
    for (const m of cl.methods) {
        eval_fn_definition(m, scope);
    }

    const obj = {
        type: "object",
        classname: cl.name,
        env: scope,
    } as ObjectVal;
    return env.declareVar(decl.ident, obj, true);
}

export function eval_fn_definition(
    def: FunctionDefinition,
    env: Environment
): RuntimeVal {
    const fn = {
        type: "function",
        name: def.name,
        params: def.params,
        declenv: env,
        body: def.body,
    } as FunctionVal;

    return env.declareVar(def.name, fn, true);
}

export function eval_ext_method_definition(
    def: ExtMethodDefinition,
    env: Environment
): RuntimeVal {
    for (const v of env.getVarValues()) {
        if (v.type == "object") {
            const obj = v as ObjectVal;

            const m = {
                type: "function",
                name: def.name,
                params: def.params,
                declenv: obj.env,
                body: def.body,
            } as FunctionVal;

            if (obj.classname == def.classname) {
                obj.env.declareVar(def.name, m, true);
            }
        }
    }

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
    const cl = {
        type: "class",
        name: def.ident,
        attributes: def.attributes,
        methods: def.methods,
        declenv: env,
    } as ClassVal;

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
            output += (result as NumberVal).value.toString();
        } else if (result.type == "boolean") {
            const value = (result as BooleanVal).value;
            if (value) {
                output += "wahr";
            } else {
                output += "falsch";
            }
        } else if (result.type == "null") {
            output += "nix";
        } else if (result.type == "string") {
            output += (result as StringVal).value.toString();
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

export function* eval_if_else_block(
    block: IfElseBlock,
    env: Environment
): SteppedEval<RuntimeVal> {
    const condition = yield* evaluate(block.condition, env);
    if (
        (condition.type == "boolean" && (condition as BooleanVal).value) ||
        (condition.type == "number" && (condition as NumberVal).value != 0)
    ) {
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
    let i = (counter as NumberVal).value;
    let lastEvaluated: RuntimeVal = MK_NULL();
    if (i < 0) throw new RuntimeError("Zähler muss größer oder gleich 0 sein!");

    try {
        while (i > 0) {
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
            try {
                const condition = yield* evaluate(block.condition, env);
                if (condition.type != "boolean" && condition.type != "number")
                    throw new RuntimeError(
                        "Die Bedingung muss eine Zahl oder ein Wahrheitswert sein!"
                    );
                if (
                    (condition.type == "boolean" && (condition as BooleanVal).value) ||
                    (condition.type == "number" && (condition as NumberVal).value != 0)
                ) {
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

export function* eval_bare_statements(
    body: Stmt[],
    env: Environment
): SteppedEval<RuntimeVal> {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of body) {
        lastEvaluated = yield* evaluate(statement, env);
    }
    return lastEvaluated;
}

export function eval_empty_line(node: EmptyLine, env: Environment): RuntimeVal {
    return MK_NULL();
}