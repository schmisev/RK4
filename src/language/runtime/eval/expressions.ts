import { RuntimeError } from "../../../errors";
import { Identifier, BinaryExpr, UnaryExpr, AssignmentExpr, CallExpr, MemberExpr } from "../../frontend/ast";
import Environment from "../environment";
import { SteppedEval, evaluate } from "../interpreter";
import {
    RuntimeVal,
    NumberVal,
    BooleanVal,
    MK_NULL,
    StringVal,
    NativeFunctionVal,
    FunctionVal,
    MK_BOOL,
    MK_NUMBER,
    ObjectVal,
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

export function* eval_assignment_expr(
    node: AssignmentExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (node.assigne.kind == "MemberExpr") {
        const assigne = node.assigne as MemberExpr;
        const symbol = (assigne.member as Identifier).symbol;
        const obj = yield* evaluate(assigne.container, env);
        const objenv = (obj as ObjectVal).env;
        return objenv.assignVar(symbol, yield* evaluate(node.value, env));
    }

    // regular assigments
    if (node.assigne.kind != "Identifier") {
        throw new RuntimeError(
            `Kann den Wert von '${node.assigne.kind}' nicht ändern - weil das Quatsch wäre!`
        );
    }

    const varname = (node.assigne as Identifier).symbol;
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
                lhs as NumberVal,
                rhs as NumberVal,
                binop.operator
            );
        } else if (lhs.type == "boolean" && rhs.type == "boolean") {
            return eval_logical_binary_expr(
                lhs as BooleanVal,
                rhs as BooleanVal,
                binop.operator
            );
        } else if (lhs.type == "string" && rhs.type == "string") {
            return eval_string_binary_expr(
                lhs as StringVal,
                rhs as StringVal,
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
        return { type: "number", value: lhs.value + rhs.value } as NumberVal;
    } else if (operator == "-") {
        return { type: "number", value: lhs.value - rhs.value } as NumberVal;
    } else if (operator == "*") {
        return { type: "number", value: lhs.value * rhs.value } as NumberVal;
    } else if (operator == "/" || operator == ":") {
        return {
            type: "number",
            value: Math.floor(lhs.value / rhs.value),
        } as NumberVal;
    } else if (operator == "%") {
        return { type: "number", value: lhs.value % rhs.value } as NumberVal;
    }
    // boolean values
    else if (operator == "=") {
        return { type: "boolean", value: lhs.value == rhs.value } as BooleanVal;
    } else if (operator == ">") {
        return { type: "boolean", value: lhs.value > rhs.value } as BooleanVal;
    } else if (operator == "<") {
        return { type: "boolean", value: lhs.value < rhs.value } as BooleanVal;
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
        return { type: "boolean", value: lhs.value && rhs.value } as BooleanVal;
    } else if (operator == "oder") {
        return { type: "boolean", value: lhs.value || rhs.value } as BooleanVal;
    }
    throw new RuntimeError();
}

export function eval_string_binary_expr(
    lhs: StringVal,
    rhs: StringVal,
    operator: string
): StringVal {
    if (operator == "+") {
        return { type: "string", value: lhs.value + rhs.value } as StringVal;
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
            return eval_logical_unary_expr(rhs as BooleanVal, unop.operator);
        } else if (rhs.type == "number") {
            return eval_numeric_unary_expr(rhs as NumberVal, unop.operator);
        } else if (rhs.type == "string") {
            return eval_string_unary_expr(rhs as StringVal, unop.operator);
        }
    } catch {
        throw `Operator in '${unop.operator} ${rhs.type}' ist nicht unterstützt!`;
    }
    throw `Unpassender Typ im Ausdruck '${unop.operator} ${rhs.type}'!`;
}

export function eval_logical_unary_expr(
    rhs: BooleanVal,
    operator: string
): BooleanVal {
    if (operator == "nicht") {
        return { type: "boolean", value: !rhs.value };
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
        return (fn as NativeFunctionVal).call(args, env);
    } else if (fn.type == "function") {
        const fn_ = fn as FunctionVal;
        const scope = new Environment(fn_.declenv);

        // create variables
        if (args.length != fn_.params.length)
            throw new RuntimeError(
                `Erwarte ${fn_.params.length} Parameter, habe aber ${args.length} erhalten!`
            );
        for (let i = 0; i < fn_.params.length; i++) {
            const param = fn_.params[i];
            const varname = param.ident;
            const arg = args[i];

            if (param.type != arg.type)
                throw new RuntimeError(
                    `${varname} sollte '${param.type}' sein, ist aber '${arg.type}'`
                );
            scope.declareVar(varname, args[i]);
        }

        try {
            const result = yield* eval_bare_statements(fn_.body, scope);
            return result;
        } catch (e) {
            if (!(e instanceof Return)) {
                throw e;
            }
            return e.value;
        }
    }

    throw new RuntimeError("Kann nicht ausgeführt werden: " + JSON.stringify(fn));
}

export function* eval_member_expr(
    expr: MemberExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const obj = (yield* evaluate(expr.container, env)) as ObjectVal;
    if (obj.type != "object")
        throw new RuntimeError(
            `Typ ${obj.type} ist kein Objekt, hat also keine Attribute oder Methoden!`
        );
    const ref = (yield* evaluate(expr.member, obj.env)) as RuntimeVal;

    return ref;
}