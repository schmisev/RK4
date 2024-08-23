import { RuntimeError } from "../../../errors";
import { Identifier, BinaryExpr, UnaryExpr, AssignmentExpr, CallExpr, MemberExpr } from "../../frontend/ast";
import Environment from "../environment";
import { SteppedEval, evaluate } from "../interpreter";
import {
    RuntimeVal,
    NumberVal,
    BooleanVal,
    StringVal,
    MK_BOOL,
    MK_NUMBER,
    ObjectVal,
    MK_STRING,
} from "../values";
import { Return } from "./errors";
import { eval_bare_statements } from "./statements";

export function eval_identifier(
    ident: Identifier,
    env: Environment
): RuntimeVal {
    const val = env.lookupVar(ident.symbol);
    return val;
}

function expectObject(val: RuntimeVal, reason: string): asserts val is ObjectVal {
    if (val.type != "object") {
        throw new RuntimeError(
            `Erwartete ein Object, aber bekam '${val.type}' - ${reason}`
        )
    }
}

export function* eval_assignment_expr(
    node: AssignmentExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (node.assigne.kind == "MemberExpr") {
        const assigne = node.assigne;
        const symbol = assigne.member.symbol;
        const obj = yield* evaluate(assigne.container, env);
        expectObject(obj, "nur Objekten können Eigenschaften zugewiesen werden");
        const objenv = obj.env;
        return objenv.assignVar(symbol, yield* evaluate(node.value, env));
    }

    // regular assigments
    if (node.assigne.kind != "Identifier") {
        throw new RuntimeError(
            `Kann den Wert von '${node.assigne.kind}' nicht ändern - weil das Quatsch wäre!`
        );
    }

    const varname = node.assigne.symbol;
    return env.assignVar(varname, yield* evaluate(node.value, env));
}

export function* eval_binary_expr(
    binop: BinaryExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const lhs = yield* evaluate(binop.left, env);
    const rhs = yield* evaluate(binop.right, env);

    try {
        if (lhs.type == "number" && rhs.type == "number") {
            return eval_numeric_binary_expr(
                lhs,
                rhs,
                binop.operator
            );
        } else if (lhs.type == "boolean" && rhs.type == "boolean") {
            return eval_logical_binary_expr(
                lhs,
                rhs,
                binop.operator
            );
        } else if (lhs.type == "string" && rhs.type == "string") {
            return eval_string_binary_expr(
                lhs,
                rhs,
                binop.operator
            );
        }
    } catch {
        throw new RuntimeError(
            `Operator in '${lhs.type} ${binop.operator} ${rhs.type}' ist nicht unterstützt!`
        );
    }

    throw new RuntimeError(
        `Unpassendende Typen im Ausdruck '${lhs.type} ${binop.operator} ${rhs.type}'!`
    );
    //return MK_NULL();
}

export function eval_numeric_binary_expr(
    lhs: NumberVal,
    rhs: NumberVal,
    operator: string
): RuntimeVal {
    // stays numeric
    if (operator == "+") {
        return MK_NUMBER(lhs.value + rhs.value);
    } else if (operator == "-") {
        return MK_NUMBER(lhs.value - rhs.value);
    } else if (operator == "*") {
        return MK_NUMBER(lhs.value * rhs.value);
    } else if (operator == "/" || operator == ":") {
        return MK_NUMBER(Math.floor(lhs.value / rhs.value));
    } else if (operator == "%") {
        return MK_NUMBER(lhs.value % rhs.value);
    }
    // boolean values
    else if (operator == "=") {
        return MK_BOOL(lhs.value == rhs.value);
    } else if (operator == ">") {
        return MK_BOOL(lhs.value > rhs.value);
    } else if (operator == "<") {
        return MK_BOOL(lhs.value < rhs.value);
    }

    // nothing worked
    throw new RuntimeError();
}

export function eval_logical_binary_expr(
    lhs: BooleanVal,
    rhs: BooleanVal,
    operator: string
): BooleanVal {
    if (operator == "und") {
        return MK_BOOL(lhs.value && rhs.value);
    } else if (operator == "oder") {
        return MK_BOOL(lhs.value || rhs.value);
    }
    throw new RuntimeError();
}

export function eval_string_binary_expr(
    lhs: StringVal,
    rhs: StringVal,
    operator: string
): StringVal {
    if (operator == "+") {
        return MK_STRING(lhs.value + rhs.value);
    }
    throw new RuntimeError();
}

export function* eval_unary_expr(
    unop: UnaryExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const rhs = yield* evaluate(unop.right, env);

    try {
        if (rhs.type == "boolean") {
            return eval_logical_unary_expr(rhs, unop.operator);
        } else if (rhs.type == "number") {
            return eval_numeric_unary_expr(rhs, unop.operator);
        } else if (rhs.type == "string") {
            return eval_string_unary_expr(rhs, unop.operator);
        }
    } catch {
        throw new RuntimeError(`Operator in '${unop.operator} ${rhs.type}' ist nicht unterstützt!`);
    }
    throw new RuntimeError(`Unpassender Typ im Ausdruck '${unop.operator} ${rhs.type}'!`);
}

export function eval_logical_unary_expr(
    rhs: BooleanVal,
    operator: string
): BooleanVal {
    if (operator == "nicht") {
        return MK_BOOL(!rhs.value);
    }
    throw new RuntimeError();
}

export function eval_numeric_unary_expr(
    rhs: NumberVal,
    operator: string
): RuntimeVal {
    if (operator == "nicht") {
        return MK_BOOL(rhs.value == 0);
    } else if (operator == "-") {
        return MK_NUMBER(-rhs.value);
    } else if (operator == "+") {
        return rhs;
    }
    throw new RuntimeError();
}

export function eval_string_unary_expr(
    rhs: StringVal,
    operator: string
): StringVal {
    throw new RuntimeError();
}

export function* eval_call_expr(
    call: CallExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const args: RuntimeVal[] = [];
    for (const expr of call.args) {
        const result = yield* evaluate(expr, env);
        args.push(result);
    }
    //const args = call.args.map((arg) => evaluate(arg, env));
    const fn = yield* evaluate(call.ident, env);

    if (fn.type == "native-fn") {
        return fn.call(args, env);
    } else if (fn.type == "function") {
        const scope = new Environment(fn.declenv);

        // create variables
        if (args.length != fn.params.length)
            throw new RuntimeError(
                `Erwarte ${fn.params.length} Parameter, habe aber ${args.length} erhalten!`
            );
        for (let i = 0; i < fn.params.length; i++) {
            const param = fn.params[i];
            const varname = param.ident;
            const arg = args[i];

            if (param.type != arg.type)
                throw new RuntimeError(
                    `${varname} sollte '${param.type}' sein, ist aber '${arg.type}'`
                );
            scope.declareVar(varname, args[i]);
        }

        try {
            const result = yield* eval_bare_statements(fn.body, scope);
            return result;
        } catch (e) {
            if (!(e instanceof Return)) {
                throw e;
            }
            return e.value;
        }
    }

    throw new RuntimeError(`Du versuchst hier ${JSON.stringify(fn)} als Funktion auszuführen!`);
}

export function* eval_member_expr(
    expr: MemberExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const obj = yield* evaluate(expr.container, env);
    expectObject(obj, "nur Objekte haben Attribute und Methoden!");
    const ref = eval_identifier(expr.member, obj.env);
    return ref;
}
